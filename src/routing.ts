/**
 * Cheap-first model routing for the feature loop.
 *
 * The single largest cost lever in a multi-step loop is not the prompt — it is
 * which model answers each step. Most steps in a feature/bugfix loop are
 * mechanical (read a file, run a test, apply an edit the plan already named)
 * and do not need the strong tier. Upstream `dsh-agent-loop` fixes one route
 * for the whole session unless a listener rewrites `agent/request`; this module
 * is that policy, owned by the loop rather than bolted on beside it.
 *
 * As with `budget.ts`, no cordis and no `@deepseek-ai/dsh-*` imports: the
 * routing decision is pure, so it is testable on its own and cannot be changed
 * by a harness upgrade.
 *
 * @module dsh-feature-loop/routing
 */

/** One rung of the ladder: an exact provider/model route. */
export interface Route {
  /** Provider route. Omitted means "keep the session's own provider". */
  provider?: string
  /** Exact model name. */
  model: string
  /** Reasoning effort to request on this rung. */
  reasoningEffort?: string
  /** USD per step ceiling — above this the ladder escalates regardless of step. */
  maxCostUSDPerStep?: number
}

/** Why the ladder moved up, for the log and the console. */
export type EscalationReason =
  | { kind: 'initial' }
  | { kind: 'steps'; from: string; steps: number }
  | { kind: 'failure'; from: string; failures: number }
  | { kind: 'cost'; from: string; usdPerStep: number }

/** The routing decision for one step. */
export interface RouteDecision {
  route: Route
  /** 0-based rung index. */
  rung: number
  reason: EscalationReason
}

/** Ladder configuration. */
export interface RoutingConfig {
  /**
   * Rungs in ascending cost order. The loop starts at `ladder[0]` and only ever
   * moves up — never back down within a turn, because a step that needed the
   * strong tier once will need it again for the same work.
   */
  ladder: Route[]
  /**
   * Steps to spend on each rung before escalating. The last rung absorbs the
   * remainder. `0` or omitted means "never escalate on step count".
   */
  stepsPerRung?: number
  /** Consecutive failures on one rung before escalating. Omitted means never. */
  escalateAfterFailures?: number
  /**
   * Hard cap on the rung index. Use it to pin the whole loop cheap when the
   * task is known to be small — e.g. a one-file bugfix should never reach the
   * strong tier at all.
   */
  maxRung?: number
}

/** Thrown when the configured ladder cannot route anything. */
export class EmptyLadderError extends Error {
  constructor() {
    super('dsh-feature-loop: routing.ladder is empty; declare at least one route or omit routing entirely')
    this.name = 'EmptyLadderError'
  }
}

/** `provider/model` label for logs, tolerating a provider-less rung. */
export function routeLabel(route: Route): string {
  return route.provider === undefined ? route.model : `${route.provider}/${route.model}`
}

/**
 * Cheap-first ladder state for one run.
 *
 * `recordFailure`/`recordSuccess` are driven by the loop's step outcome;
 * `forStep` is called where the request is assembled. Escalation is sticky: the
 * class only ever increases its rung.
 */
export class ModelLadder {
  private rung = 0
  private consecutiveFailures = 0
  private escalatedFor: EscalationReason = { kind: 'initial' }
  private readonly config: RoutingConfig

  constructor(config: RoutingConfig) {
    this.config = config
    if (config.ladder.length === 0) throw new EmptyLadderError()
    const maxRung = config.maxRung ?? config.ladder.length - 1
    if (maxRung < 0 || maxRung >= config.ladder.length) {
      throw new Error(
        `dsh-feature-loop: routing.maxRung ${String(maxRung)} is outside the ladder `
        + `(0..${String(config.ladder.length - 1)})`,
      )
    }
  }

  /** The rung currently in use. */
  current(): Route {
    return this.config.ladder[this.rung]!
  }

  /** Current rung index. */
  rungIndex(): number {
    return this.rung
  }

  private ceiling(): number {
    return this.config.maxRung ?? this.config.ladder.length - 1
  }

  private escalate(reason: EscalationReason): void {
    if (this.rung >= this.ceiling()) return
    this.rung += 1
    this.consecutiveFailures = 0
    this.escalatedFor = reason
  }

  /**
   * Record a failed step. Enough consecutive failures on one rung means the
   * rung is not capable of this work, which is the cheapest possible signal
   * that a stronger model is worth its price.
   */
  recordFailure(): void {
    this.consecutiveFailures += 1
    const threshold = this.config.escalateAfterFailures
    if (threshold === undefined || threshold < 1) return
    if (this.consecutiveFailures >= threshold) {
      const from = routeLabel(this.current())
      this.escalate({ kind: 'failure', from, failures: this.consecutiveFailures })
    }
  }

  /** Record a successful step; clears the failure streak. */
  recordSuccess(): void {
    this.consecutiveFailures = 0
  }

  /**
   * The route for one step, escalating first if the step count or the last
   * step's price says this rung has had its turn.
   *
   * @param step - the 1-based step about to run.
   * @param lastStepUSD - the previous step's cost, when known.
   * @returns the route, its rung, and why the ladder is where it is.
   */
  forStep(step: number, lastStepUSD?: number): RouteDecision {
    const stepsPerRung = this.config.stepsPerRung ?? 0
    if (stepsPerRung > 0 && this.rung < this.ceiling()) {
      const used = step - 1
      const wanted = Math.min(Math.floor(used / stepsPerRung), this.ceiling())
      if (wanted > this.rung) {
        const from = routeLabel(this.current())
        this.rung = wanted
        this.consecutiveFailures = 0
        this.escalatedFor = { kind: 'steps', from, steps: used }
      }
    }
    const perStepCap = this.current().maxCostUSDPerStep
    if (perStepCap !== undefined && lastStepUSD !== undefined && lastStepUSD > perStepCap) {
      const from = routeLabel(this.current())
      this.escalate({ kind: 'cost', from, usdPerStep: lastStepUSD })
    }
    return { route: this.current(), rung: this.rung, reason: this.escalatedFor }
  }
}
