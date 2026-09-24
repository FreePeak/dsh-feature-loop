/**
 * Durable-turn usage ledger for the DSH plugin.
 *
 * One AgentLoop turn is one feature-loop run. The Session event log supplies
 * the facts; this fold keeps DSH steps separate from model attempts and never
 * invents a price for missing usage or an unknown route.
 */

import { lastAssistantStreamChunk } from '@deepseek-ai/dsh-llm'
import type { TokenUsage } from '@deepseek-ai/dsh-llm'
import { priceUsage, routeKey } from './budget.ts'
import type { ModelPrice, PriceTable, UsageReading, Verdict } from './budget.ts'

interface RouteSnapshot {
  attempts: number
  usd: number
}

export interface TurnRunSnapshot {
  runKey: string
  turn: number | undefined
  started: boolean
  closed: boolean
  steps: number
  attempts: number
  unpricedAttempts: number
  spentUSD: number
  stopReason: string | undefined
  unpricedRoutes: readonly string[]
  byRoute: Readonly<Record<string, RouteSnapshot>>
}

/** Decide whether the next DSH step may start from one turn's exact ledger. */
export function turnBudgetVerdict(
  config: { maxSteps: number, costBudgetUSD: number, warnAt?: number },
  snapshot: TurnRunSnapshot,
  proposedStep: number,
): Verdict {
  if (!Number.isSafeInteger(config.maxSteps) || config.maxSteps < 1) {
    throw new RangeError('turn budget maxSteps must be a positive safe integer')
  }
  if (!Number.isFinite(config.costBudgetUSD) || config.costBudgetUSD <= 0) {
    throw new RangeError('turn budget costBudgetUSD must be finite and greater than zero')
  }
  const warnAt = config.warnAt ?? 0.8
  if (!Number.isFinite(warnAt) || warnAt <= 0 || warnAt > 1) {
    throw new RangeError('turn budget warnAt must be within (0, 1]')
  }
  if (snapshot.unpricedAttempts > 0) {
    return { kind: 'stop', reason: `usage accounting incomplete for ${String(snapshot.unpricedAttempts)} attempt(s)` }
  }
  if (proposedStep > config.maxSteps) {
    return { kind: 'stop', reason: `step ceiling reached (${String(config.maxSteps)} steps)` }
  }
  if (snapshot.spentUSD >= config.costBudgetUSD) {
    return {
      kind: 'stop',
      reason: `cost ceiling reached ($${snapshot.spentUSD.toFixed(4)} of $${config.costBudgetUSD.toFixed(2)})`,
    }
  }
  if (snapshot.spentUSD >= config.costBudgetUSD * warnAt) {
    return {
      kind: 'warn',
      reason: `budget ${(snapshot.spentUSD / config.costBudgetUSD * 100).toFixed(0)}% spent `
        + `($${snapshot.spentUSD.toFixed(4)} of $${config.costBudgetUSD.toFixed(2)})`,
    }
  }
  return { kind: 'ok' }
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function usageOf(value: unknown): UsageReading | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const usage = value as Partial<TokenUsage>
  if (!isCount(usage.inputTokens) || !isCount(usage.outputTokens)) return undefined
  if (usage.cacheReadTokens !== undefined && !isCount(usage.cacheReadTokens)) return undefined
  if (usage.cacheWriteTokens !== undefined && !isCount(usage.cacheWriteTokens)) return undefined
  if (usage.reasoningTokens !== undefined
    && (!isCount(usage.reasoningTokens) || usage.reasoningTokens > usage.outputTokens)) return undefined
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    ...usage.cacheReadTokens === undefined ? {} : { cacheReadTokens: usage.cacheReadTokens },
    ...usage.cacheWriteTokens === undefined ? {} : { cacheWriteTokens: usage.cacheWriteTokens },
  }
}

function streamUsage(value: unknown): UsageReading | undefined {
  if (!Array.isArray(value)) return undefined
  return usageOf(lastAssistantStreamChunk(value as never, 'usage')?.usage)
}

function validPrice(price: ModelPrice | undefined): price is ModelPrice {
  if (price === undefined) return false
  for (const value of [
    price.inputPerMTok,
    price.outputPerMTok,
    price.cacheReadPerMTok,
    price.cacheWritePerMTok,
  ]) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) return false
  }
  return true
}

function routeOf(value: unknown): { provider: string, model: string } | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const route = value as { provider?: unknown, model?: unknown }
  return typeof route.provider === 'string' && route.provider.length > 0
    && typeof route.model === 'string' && route.model.length > 0
    ? { provider: route.provider, model: route.model }
    : undefined
}

function dataOf(event: unknown): Record<string, unknown> | undefined {
  if (event === null || typeof event !== 'object') return undefined
  const data = (event as { data?: unknown }).data
  return data !== null && typeof data === 'object' ? data as Record<string, unknown> : undefined
}

/** Fold one DSH turn's durable events into exact, route-attributed spend facts. */
export class TurnRunLedger {
  readonly sessionId: string
  private readonly prices: PriceTable
  private readonly fallback: ModelPrice | undefined
  private readonly byRoute = new Map<string, RouteSnapshot>()
  private readonly unpricedRoutes = new Set<string>()
  private turnState: number | undefined
  private started = false
  private closed = false
  private stepCount = 0
  private attemptCount = 0
  private unpricedCount = 0
  private usd = 0
  private reason: string | undefined

  constructor(input: {
    sessionId: string
    prices?: PriceTable
    unpricedFallback?: ModelPrice
  }) {
    this.sessionId = input.sessionId
    this.prices = input.prices ?? {}
    this.fallback = input.unpricedFallback
  }

  get runKey(): string {
    return `${this.sessionId}#${this.turnState === undefined ? 'pending' : String(this.turnState)}`
  }

  /** Record the plugin's explicit veto; final spend alone never sets this. */
  markStop(reason: string): void {
    if (reason.trim() === '') throw new TypeError('stop reason must not be empty')
    this.reason = reason
  }

  /** Consume one committed DSH Session event. Unknown event types are ignored. */
  consume(event: unknown): void {
    if (event === null || typeof event !== 'object') return
    const type = (event as { type?: unknown }).type
    const data = dataOf(event)
    if (data === undefined) return
    switch (type) {
      case 'turn/start': {
        const turn = data.turn
        if (!isCount(turn)) return
        if (this.started && this.turnState !== turn) return
        this.started = true
        this.turnState = turn
        return
      }
      case 'request/header': {
        const header = data.header
        if (header === null || typeof header !== 'object') return
        const config = (header as { config?: unknown }).config
        const route = routeOf(config)
        if (route !== undefined) this.activeRoute = route
        return
      }
      case 'step/end': {
        if (this.owns(data) && isCount(data.step)) this.stepCount += 1
        return
      }
      case 'assistant/message': {
        if (!this.owns(data)) return
        const message = data.message
        const source = message !== null && typeof message === 'object'
          ? (message as { source?: unknown }).source
          : undefined
        this.charge(routeOf(source), usageOf(data.usage) ?? streamUsage(data.stream))
        return
      }
      case 'assistant/attempt': {
        if (this.owns(data)) this.charge(this.activeRoute, streamUsage(data.stream))
        return
      }
      case 'turn/end': {
        if (isCount(data.turn) && (this.turnState === undefined || this.turnState === data.turn)) this.closed = true
        return
      }
      default:
        return
    }
  }

  private activeRoute: { provider: string, model: string } | undefined

  private owns(data: Record<string, unknown>): boolean {
    return this.started && this.turnState !== undefined && data.turn === this.turnState
  }

  private charge(
    route: { provider: string, model: string } | undefined,
    usage: UsageReading | undefined,
  ): void {
    this.attemptCount += 1
    const key = route === undefined ? '<unattributed>' : routeKey(route.provider, route.model)
    if (route === undefined || usage === undefined) {
      this.unpricedCount += 1
      this.unpricedRoutes.add(key)
      return
    }
    const price = this.prices[key] ?? this.fallback
    if (!validPrice(price)) {
      this.unpricedCount += 1
      this.unpricedRoutes.add(key)
      return
    }
    const usd = priceUsage(usage, price)
    if (!Number.isFinite(usd) || usd < 0) {
      this.unpricedCount += 1
      this.unpricedRoutes.add(key)
      return
    }
    this.usd += usd
    const row = this.byRoute.get(key) ?? { attempts: 0, usd: 0 }
    row.attempts += 1
    row.usd += usd
    this.byRoute.set(key, row)
  }

  snapshot(): TurnRunSnapshot {
    return {
      runKey: this.runKey,
      turn: this.turnState,
      started: this.started,
      closed: this.closed,
      steps: this.stepCount,
      attempts: this.attemptCount,
      unpricedAttempts: this.unpricedCount,
      spentUSD: this.usd,
      stopReason: this.reason,
      unpricedRoutes: [...this.unpricedRoutes].sort(),
      byRoute: Object.fromEntries([...this.byRoute].map(([key, row]) => [key, { ...row }])),
    }
  }
}

/** Keep one independent TurnRunLedger per DSH turn in a session. */
export class TurnRunRegistry {
  readonly sessionId: string
  private readonly runs = new Map<number, TurnRunLedger>()
  private readonly config: { prices?: PriceTable, unpricedFallback?: ModelPrice }
  private currentTurn: number | undefined

  constructor(input: {
    sessionId: string
    prices?: PriceTable
    unpricedFallback?: ModelPrice
  }) {
    this.sessionId = input.sessionId
    this.config = { prices: input.prices, unpricedFallback: input.unpricedFallback }
  }

  /** Consume ordered Session events, including a complete log replay. */
  consume(event: unknown): void {
    if (event === null || typeof event !== 'object') return
    const type = (event as { type?: unknown }).type
    const data = dataOf(event)
    if (data === undefined) return
    if (type === 'turn/start') {
      if (!isCount(data.turn)) return
      this.currentTurn = data.turn
      this.runFor(data.turn).consume(event)
      return
    }
    if (type === 'request/header') {
      this.currentRun()?.consume(event)
      return
    }
    if (!isCount(data.turn) || data.turn !== this.currentTurn) return
    this.currentRun()?.consume(event)
  }

  /** Return one completed or in-flight turn, or `undefined` before it starts. */
  get(turn: number): TurnRunSnapshot | undefined {
    return this.runs.get(turn)?.snapshot()
  }

  /** The current turn, when one is active or has just closed. */
  current(): TurnRunSnapshot | undefined {
    return this.currentTurn === undefined ? undefined : this.get(this.currentTurn)
  }

  private currentRun(): TurnRunLedger | undefined {
    return this.currentTurn === undefined ? undefined : this.runs.get(this.currentTurn)
  }

  private runFor(turn: number): TurnRunLedger {
    let run = this.runs.get(turn)
    if (run === undefined) {
      run = new TurnRunLedger({ sessionId: this.sessionId, ...this.config })
      this.runs.set(turn, run)
    }
    return run
  }
}
