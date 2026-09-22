/**
 * Step and cost ceilings for the feature loop.
 *
 * Upstream `@deepseek-ai/dsh-agent-loop` has no turn budget by design — its
 * README lists "No built-in turn budget" as a known limitation and points at
 * `agent/pre-step`. This module is that budget, and it is the reason this fork
 * exists: an unbounded loop is an unbounded bill.
 *
 * Deliberately free of cordis and `@deepseek-ai/dsh-*` imports so the policy is
 * testable on its own (`node --test test/budget.test.ts`) and so a harness
 * upgrade cannot change what the ceiling means.
 *
 * @module dsh-feature-loop/budget
 */

/** USD per 1M tokens for one exact provider/model route. */
export interface ModelPrice {
  /** Billed non-cached input. */
  inputPerMTok: number
  /** Billed output. */
  outputPerMTok: number
  /** Cache read. Missing means the route bills reads as ordinary input. */
  cacheReadPerMTok?: number
  /** Cache write. Missing means the route bills writes as ordinary input. */
  cacheWritePerMTok?: number
}

/**
 * The subset of `@deepseek-ai/dsh-llm`'s `TokenUsage` this meter reads.
 * Structural, not imported: the meter must keep working across a harness bump
 * that adds fields, and must fail loudly rather than silently at zero if the
 * fields it needs are renamed.
 */
export interface UsageReading {
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  /**
   * How much of `outputTokens` was reasoning, when the adapter breaks it out.
   *
   * A breakdown, not an addition: OpenAI-compatible gateways report
   * `completion_tokens_details.reasoning_tokens` as a subset of
   * `completion_tokens`, which is what `outputTokens` holds (see `readUsage`
   * in `llm.ts`). {@link priceUsage} therefore already bills these tokens
   * inside the output line — carried here for reporting and ladder decisions,
   * never priced a second time.
   */
  reasoningTokens?: number
}

/** A price table keyed by `provider/model`. Versioned config, never a constant. */
export type PriceTable = Readonly<Record<string, ModelPrice>>

/** Where the loop stands relative to its ceilings. */
export type Verdict =
  | { kind: 'ok' }
  | { kind: 'warn'; reason: string }
  | { kind: 'stop'; reason: string }

/** Ceilings and the price table they are measured against. */
export interface BudgetConfig {
  /** Hard step ceiling. The loop stops before step `maxSteps + 1` is proposed. */
  maxSteps: number
  /** Hard cost ceiling in USD. */
  costBudgetUSD: number
  /**
   * Fraction of `costBudgetUSD` at which the loop warns and the model is told
   * to converge. Below 1 on purpose: a ceiling that is only announced at the
   * ceiling arrives after the last useful step.
   */
  warnAt?: number
  /** Per-route prices. A route with no entry is priced at `unpricedFallback`. */
  prices?: PriceTable
  /**
   * Price applied to a route the table does not know. `undefined` means an
   * unknown route is a hard error — the safe default, because a loop that
   * silently prices an unknown model at zero is a loop with no ceiling.
   */
  unpricedFallback?: ModelPrice
}

/** Running totals, for logging and for the console. */
export interface BudgetSnapshot {
  steps: number
  spentUSD: number
  budgetUSD: number
  /** Spent as a fraction of budget; `Infinity` when the budget is 0. */
  fraction: number
  /**
   * Steps the adapter reported no usage for, and which therefore cost the run
   * nothing on paper. Surfaced rather than hidden: a non-zero count means the
   * `spentUSD` figure is an under-count, and a budget that reads low is worse
   * than one that reads unknown.
   */
  unpricedSteps: number
  byRoute: Readonly<Record<string, { steps: number; usd: number }>>
}

/** Thrown when a route is priced by neither the table nor the fallback. */
export class UnpricedRouteError extends Error {
  readonly route: string

  constructor(route: string) {
    super(
      `dsh-feature-loop: no price for route "${route}" and no unpricedFallback configured; `
      + 'add the route to budget.prices (see the config catalog for its current rates)',
    )
    this.name = 'UnpricedRouteError'
    this.route = route
  }
}

/** `provider/model`, the price-table key. */
export function routeKey(provider: string, model: string): string {
  return `${provider}/${model}`
}

/**
 * Cost of one usage reading under one price.
 *
 * Billed input is `inputTokens + cacheReadTokens + cacheWriteTokens`: the
 * adapters report cache traffic separately and subtract it out of the input
 * count, so a meter that prices `inputTokens` alone under-reports every cached
 * loop — which is the common case, because a multi-step loop re-sends its
 * prefix on every step.
 *
 * Reasoning tokens are deliberately not a fourth line: adapters report
 * `reasoningTokens` as a breakdown *of* `outputTokens` (the
 * `completion_tokens_details` subset of `completion_tokens`), so the output
 * multiplication below already bills them at the output rate. Adding a
 * reasoning line would double-count every reasoning-model step.
 */
export function priceUsage(usage: UsageReading, price: ModelPrice): number {
  const cacheRead = usage.cacheReadTokens ?? 0
  const cacheWrite = usage.cacheWriteTokens ?? 0
  const readRate = price.cacheReadPerMTok ?? price.inputPerMTok
  const writeRate = price.cacheWritePerMTok ?? price.inputPerMTok
  return (
    usage.inputTokens * price.inputPerMTok
    + usage.outputTokens * price.outputPerMTok
    + cacheRead * readRate
    + cacheWrite * writeRate
  ) / 1_000_000
}

/**
 * Step and cost accounting for one run.
 *
 * One instance per agent. `spend` is called once per completed model step;
 * `verdict` is called before each proposed step, which is what makes the
 * ceiling enforceable *before* the call that would breach it rather than
 * discovered on the invoice.
 */
export class LoopBudget {
  private steps = 0
  private spent = 0
  private unpricedSteps = 0
  private readonly byRoute: Record<string, { steps: number; usd: number }> = {}
  private readonly config: BudgetConfig

  constructor(config: BudgetConfig) {
    this.config = config
    if (!Number.isFinite(config.maxSteps) || config.maxSteps < 1) {
      throw new Error(`dsh-feature-loop: maxSteps must be >= 1, received ${String(config.maxSteps)}`)
    }
    if (!Number.isFinite(config.costBudgetUSD) || config.costBudgetUSD <= 0) {
      throw new Error(
        `dsh-feature-loop: costBudgetUSD must be > 0, received ${String(config.costBudgetUSD)} `
        + '(an unlimited budget is not a budget; set a number you are willing to lose)',
      )
    }
    const warnAt = config.warnAt ?? 0.8
    if (warnAt <= 0 || warnAt > 1) {
      throw new Error(`dsh-feature-loop: warnAt must be in (0, 1], received ${String(warnAt)}`)
    }
  }

  /** Price of one route, or a throw when it is unpriceable. */
  priceOf(provider: string, model: string): ModelPrice {
    const key = routeKey(provider, model)
    const price = this.config.prices?.[key]
    if (price !== undefined) return price
    if (this.config.unpricedFallback !== undefined) return this.config.unpricedFallback
    throw new UnpricedRouteError(key)
  }

  /**
   * Record one completed step's usage.
   * @param provider - the route that served the step.
   * @param model - the model that served the step.
   * @param usage - the adapter-reported token counts, or `undefined` when the
   *   adapter reported none (counted as a step, priced at zero, and visible in
   *   the snapshot as an unpriced step rather than hidden).
   * @returns the cost of this step in USD.
   */
  spend(provider: string, model: string, usage: UsageReading | undefined): number {
    this.steps += 1
    // Resolve the price BEFORE the usage check, and unconditionally. Skipping
    // this when usage is absent is precisely how an unpriced route becomes
    // free: a gateway that reports no usage would silently disable the cost
    // ceiling, and the ceiling is the thing this class exists for. An unknown
    // route must be an error whether or not the adapter talked about tokens.
    const price = this.priceOf(provider, model)
    if (usage === undefined) this.unpricedSteps += 1
    const usd = usage === undefined ? 0 : priceUsage(usage, price)
    this.spent += usd
    const key = routeKey(provider, model)
    const row = (this.byRoute[key] ??= { steps: 0, usd: 0 })
    row.steps += 1
    row.usd += usd
    return usd
  }

  /**
   * Whether the next proposed step may run.
   * @param step - the 1-based step the loop is about to propose.
   * @returns `stop` when a ceiling is already reached, `warn` when the budget is
   *   mostly spent, `ok` otherwise.
   */
  verdict(step: number): Verdict {
    const warnAt = this.config.warnAt ?? 0.8
    if (step > this.config.maxSteps) {
      return { kind: 'stop', reason: `step ceiling reached (${this.config.maxSteps} steps)` }
    }
    if (this.spent >= this.config.costBudgetUSD) {
      return {
        kind: 'stop',
        reason: `cost ceiling reached ($${this.spent.toFixed(4)} of $${this.config.costBudgetUSD.toFixed(2)})`,
      }
    }
    if (this.spent >= this.config.costBudgetUSD * warnAt) {
      return {
        kind: 'warn',
        reason: `budget ${(this.fraction() * 100).toFixed(0)}% spent `
          + `($${this.spent.toFixed(4)} of $${this.config.costBudgetUSD.toFixed(2)})`,
      }
    }
    return { kind: 'ok' }
  }

  /** Spent as a fraction of budget. */
  fraction(): number {
    return this.spent / this.config.costBudgetUSD
  }

  /** Current totals. */
  snapshot(): BudgetSnapshot {
    return {
      steps: this.steps,
      spentUSD: this.spent,
      budgetUSD: this.config.costBudgetUSD,
      fraction: this.fraction(),
      unpricedSteps: this.unpricedSteps,
      byRoute: { ...this.byRoute },
    }
  }

  /** The message appended as a logged step when the ceiling is hit. */
  stopNotice(verdict: Extract<Verdict, { kind: 'stop' }>): string {
    return `${verdict.reason}. Stop starting new work and report what you have completed so far, `
      + 'what remains, and the single next action you would take.'
  }
}
