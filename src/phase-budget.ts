/**
 * Per-phase ceilings on top of the run budget.
 *
 * {@link LoopBudget} answers one question: may the run afford another step. This
 * module answers a different one: may *this phase* afford another step. The two
 * are not interchangeable, and conflating them is how a five-phase run ends up
 * with a research phase that spent the implementation budget before anyone wrote
 * code — the run total looked fine at every point, because it only ever went up.
 *
 * The book's rule is explicit that a phase must not be able to fix its overspend
 * by taking someone else's money: *"If the planning phase exceeds its budget,
 * simplify the plan rather than stealing from execution. Prevents any single
 * phase from monopolizing resources"* (App B #82, p296). So the allocator carves
 * each phase's ceiling out of the run budget up front and a phase that reaches it
 * **stops**, even when the run has room left.
 *
 * Two more bounds ride along because a step ceiling alone is not a bound:
 *
 * - **A wall-clock timeout**, independent of step count. App B #9's Timeout Guard
 *   (p278) exists because a step ceiling is only reached by *spending* steps, and
 *   a loop that is slow rather than busy never spends its way to the ceiling. It
 *   fires "regardless of internal state".
 * - **The buffer.** Walkthrough 13.2 reserves 10% of the run budget and ReAct's
 *   production tip says why (p34): *"an agent that hits its budget limit
 *   mid-reasoning with no tokens left to synthesize an answer will either crash
 *   or hallucinate a conclusion."* {@link PhaseAllocator.preCallGuard} is that
 *   reservation, enforced before the call rather than discovered afterwards.
 *
 * Pure — no cordis, no harness import, no I/O.
 *
 * @module dsh-feature-loop/phase-budget
 */

import type { Verdict } from './budget.ts'
import { PHASE_ORDER, PIPELINE_BUDGET } from './phases.ts'
import type { PipelinePhase } from './phases.ts'

/** What one phase may spend, and for how long. */
export interface PhaseAllocation {
  phase: PipelinePhase
  /** The hard USD ceiling for this phase alone. */
  maxSpendUSD: number
  /** The hard step ceiling for this phase alone. */
  maxSteps: number
}

/** The whole run's shape: what each phase gets, and what is held back. */
export interface RunAllocation {
  phases: PhaseAllocation[]
  /**
   * USD held back for the terminal report. Never available to a phase, and the
   * reason {@link PhaseAllocator.preCallGuard} exists.
   */
  bufferUSD: number
  /** The run budget the shares were applied to. */
  totalUSD: number
}

/** Configuration, with every field defaulted from the book's numbers. */
export interface PhaseAllocatorConfig {
  /** The run's total USD ceiling. Split by share across the phases. */
  runBudgetUSD: number
  /** The run's total step ceiling. Split across the phases when per-phase caps are absent. */
  runMaxSteps: number
  /** Override a phase's USD share. Defaults to `PIPELINE_BUDGET.phaseShares`. */
  shares?: Partial<Record<PipelinePhase, number>>
  /** Absolute per-phase step ceilings. Overrides the share-derived default. */
  maxSteps?: Partial<Record<PipelinePhase, number>>
  /** Fraction of a phase's own ceiling at which it warns. Defaults to 0.8. */
  warnFraction?: number
  /** Fraction of the run budget at which new work stops, reserving the buffer. Defaults to 0.9. */
  callGuardFraction?: number
  /** Wall-clock ceiling per phase, in ms. Unset means no per-phase timeout. */
  phaseTimeoutMs?: number
  /** Wall-clock ceiling for the whole run, in ms. Unset means no run timeout. */
  timeoutMs?: number
  /** Clock, injected so the timeouts are testable without a fake sleep. */
  now?: () => number
}

/** What one phase has used. */
export interface PhaseUsage {
  phase: PipelinePhase
  steps: number
  spentUSD: number
  maxSpendUSD: number
  maxSteps: number
  /** Spent as a fraction of this phase's own ceiling. */
  fraction: number
  wallMs: number
}

/** Thrown when a run budget cannot be split into phases that each have a ceiling. */
export class InvalidAllocationError extends Error {
  constructor(problems: string[]) {
    super(`dsh-feature-loop: cannot allocate the run budget:\n  - ${problems.join('\n  - ')}`)
    this.name = 'InvalidAllocationError'
  }
}

/**
 * Divide a run budget into per-phase ceilings, once, at construction.
 *
 * Splitting up front rather than on demand is the point: a share that is
 * recomputed per step is a share that moves, and a moving ceiling is not a
 * ceiling.
 */
export function allocate(
  config: PhaseAllocatorConfig,
): RunAllocation {
  const problems: string[] = []
  if (!Number.isFinite(config.runBudgetUSD) || config.runBudgetUSD <= 0) {
    problems.push(`runBudgetUSD must be > 0, received ${String(config.runBudgetUSD)}`)
  }
  if (!Number.isFinite(config.runMaxSteps) || config.runMaxSteps < 1) {
    problems.push(`runMaxSteps must be >= 1, received ${String(config.runMaxSteps)}`)
  }
  const shares = config.shares ?? {}
  let totalShare = 0
  for (const phase of PHASE_ORDER) {
    const share = shares[phase] ?? PIPELINE_BUDGET.phaseShares[phase]
    if (!Number.isFinite(share) || share <= 0) {
      problems.push(`share for ${phase} must be > 0, received ${String(share)}`)
    }
    totalShare += share
    const cap = config.maxSteps?.[phase]
    if (cap !== undefined && (!Number.isInteger(cap) || cap < 1)) {
      problems.push(`maxSteps for ${phase} must be an integer >= 1, received ${String(cap)}`)
    }
  }
  // Shares and the buffer must fill exactly one budget. A shortfall means money
  // nobody can spend; an excess means a phase can reach past the buffer, which
  // is exactly the reservation the buffer exists to provide.
  const total = totalShare + PIPELINE_BUDGET.bufferShare
  if (Math.abs(total - 1) > 1e-9) {
    problems.push(`phase shares (${totalShare.toFixed(4)}) plus buffer (${PIPELINE_BUDGET.bufferShare}) must equal 1, got ${total.toFixed(4)}`)
  }
  if (problems.length > 0) throw new InvalidAllocationError(problems)

  const phases: PhaseAllocation[] = PHASE_ORDER.map((phase) => {
    const share = shares[phase] ?? PIPELINE_BUDGET.phaseShares[phase]
    return {
      phase,
      maxSpendUSD: config.runBudgetUSD * share,
      // An explicit per-phase cap always wins. Otherwise the step ceiling
      // follows the spend ceiling — a phase allowed 35% of the run's money may
      // reasonably take 35% of its steps. Rounding means the derived caps can
      // sum to a step or two more than `runMaxSteps`; that is fine, because the
      // run-level `LoopBudget` is the backstop and this is the layer that stops
      // one phase from eating all five.
      maxSteps: config.maxSteps?.[phase] ?? Math.max(1, Math.round(config.runMaxSteps * share)),
    }
  })
  return {
    phases,
    bufferUSD: config.runBudgetUSD * PIPELINE_BUDGET.bufferShare,
    totalUSD: config.runBudgetUSD,
  }
}

/**
 * Tracks what each phase has used and refuses the work that would breach it.
 *
 * One instance per run, held beside the `LoopBudget` the way that one is held
 * beside the step history: the run total says whether the *run* is affordable,
 * this says whether the *phase* is.
 */
export class PhaseAllocator {
  private readonly allocation: RunAllocation
  private readonly warnFraction: number
  private readonly callGuardFraction: number
  private readonly phaseTimeoutMs: number | undefined
  private readonly timeoutMs: number | undefined
  private readonly now: () => number
  private readonly spent: Record<PipelinePhase, number>
  private readonly steps: Record<PipelinePhase, number>
  private readonly startedAt: Record<PipelinePhase, number>
  private readonly runStartedAt: number
  private current: PipelinePhase | undefined

  constructor(config: PhaseAllocatorConfig) {
    this.allocation = allocate(config)
    this.warnFraction = config.warnFraction ?? PIPELINE_BUDGET.warnFraction
    this.callGuardFraction = config.callGuardFraction ?? PIPELINE_BUDGET.callGuardFraction
    if (!(this.callGuardFraction > 0 && this.callGuardFraction <= 1)) {
      throw new TypeError(`callGuardFraction must be in (0, 1], received ${String(this.callGuardFraction)}`)
    }
    this.phaseTimeoutMs = config.phaseTimeoutMs
    this.timeoutMs = config.timeoutMs
    this.now = config.now ?? Date.now
    this.spent = Object.fromEntries(PHASE_ORDER.map(p => [p, 0])) as Record<PipelinePhase, number>
    this.steps = Object.fromEntries(PHASE_ORDER.map(p => [p, 0])) as Record<PipelinePhase, number>
    this.startedAt = Object.fromEntries(PHASE_ORDER.map(p => [p, this.now()])) as Record<PipelinePhase, number>
    this.runStartedAt = this.now()
  }

  /** The immutable split, for the report's phase table. */
  get runAllocation(): RunAllocation {
    return this.allocation
  }

  /** The ceiling for one phase. */
  ceilingFor(phase: PipelinePhase): PhaseAllocation {
    return this.allocation.phases.find(a => a.phase === phase) ?? { phase, maxSpendUSD: 0, maxSteps: 0 }
  }

  /** Note that the run has entered a phase, so its wall clock starts now. */
  enterPhase(phase: PipelinePhase): void {
    this.current = phase
    this.startedAt[phase] = this.now()
  }

  /**
   * Price one step into a phase.
   *
   * @param phase - the phase the step belongs to.
   * @param usd - the step's cost. Non-negative; a negative reading is treated as
   *   zero rather than refunding the phase, because a budget that can be
   *   credited is a budget a provider error can drain.
   * @returns the phase's spend after this step.
   */
  spend(phase: PipelinePhase, usd: number): number {
    this.spent[phase] += Number.isFinite(usd) && usd > 0 ? usd : 0
    return this.spent[phase]
  }

  /** Count one step against a phase. */
  countStep(phase: PipelinePhase): number {
    this.steps[phase] += 1
    return this.steps[phase]
  }

  /** What one phase has used. */
  usage(phase: PipelinePhase, at: number = this.now()): PhaseUsage {
    const ceiling = this.ceilingFor(phase)
    return {
      phase,
      steps: this.steps[phase],
      spentUSD: this.spent[phase],
      maxSpendUSD: ceiling.maxSpendUSD,
      maxSteps: ceiling.maxSteps,
      fraction: ceiling.maxSpendUSD === 0 ? Infinity : this.spent[phase] / ceiling.maxSpendUSD,
      wallMs: Math.max(0, at - this.startedAt[phase]),
    }
  }

  /** Every phase's usage, in spine order. */
  allUsage(at: number = this.now()): PhaseUsage[] {
    return PHASE_ORDER.map(p => this.usage(p, at))
  }

  /** Total spent across every phase. */
  totalSpent(): number {
    return PHASE_ORDER.reduce((sum, p) => sum + this.spent[p], 0)
  }

  /**
   * Whether the next step in `phase` may run.
   *
   * Checks, in order: the run's wall clock, the phase's wall clock, the run's
   * call guard, the phase's step ceiling, the phase's spend ceiling. The run's
   * time bounds come first because a run that is out of time cannot be rescued
   * by anything the phase decides.
   */
  verdict(phase: PipelinePhase, at: number = this.now()): Verdict {
    const runWall = at - this.runStartedAt
    if (this.timeoutMs !== undefined && runWall >= this.timeoutMs) {
      return { kind: 'stop', reason: `run wall-clock ceiling reached (${fmtMs(runWall)} of ${fmtMs(this.timeoutMs)})` }
    }
    const phaseWall = Math.max(0, at - this.startedAt[phase])
    if (this.phaseTimeoutMs !== undefined && phaseWall >= this.phaseTimeoutMs) {
      return {
        kind: 'stop',
        reason: `${phase} wall-clock ceiling reached (${fmtMs(phaseWall)} of ${fmtMs(this.phaseTimeoutMs)})`,
      }
    }
    const guard = this.preCallGuard(at)
    if (guard.kind !== 'ok') return guard

    const ceiling = this.ceilingFor(phase)
    const nextStep = this.steps[phase] + 1
    if (nextStep > ceiling.maxSteps) {
      return { kind: 'stop', reason: `${phase} step ceiling reached (${ceiling.maxSteps} steps)` }
    }
    const spent = this.spent[phase]
    if (spent >= ceiling.maxSpendUSD) {
      return {
        kind: 'stop',
        reason: `${phase} cost ceiling reached ($${spent.toFixed(4)} of $${ceiling.maxSpendUSD.toFixed(4)})`,
      }
    }
    if (spent >= ceiling.maxSpendUSD * this.warnFraction) {
      return {
        kind: 'warn',
        reason: `${phase} budget ${Math.round((spent / ceiling.maxSpendUSD) * 100)}% spent `
          + `($${spent.toFixed(4)} of $${ceiling.maxSpendUSD.toFixed(4)}) — finish this phase or simplify the plan`,
      }
    }
    return { kind: 'ok' }
  }

  /**
   * The pre-call guard: stop starting new work once the run has spent its
   * working share, keeping the buffer for the report.
   *
   * This exists because of a live defect, not a hypothetical. The plugin's
   * `agent/pre-step` handler calls `next()` — which makes the model call — and
   * only then computes the ceiling, so the money for step *N* is gone before the
   * verdict for step *N* is known. The book's rule is to check *before*: *"check
   * remaining budget before each LLM call — not after. Set the alert threshold at
   * 90% of budget, not 100%"* (p34).
   *
   * @param at - epoch ms, for the wall-clock check.
   * @returns `stop` at or above the guard fraction, `ok` below it.
   */
  preCallGuard(at: number = this.now()): Verdict {
    if (this.timeoutMs !== undefined && at - this.runStartedAt >= this.timeoutMs) {
      return { kind: 'stop', reason: `run wall-clock ceiling reached (${fmtMs(at - this.runStartedAt)})` }
    }
    const working = this.allocation.totalUSD - this.allocation.bufferUSD
    const spent = this.totalSpent()
    if (spent >= working * this.callGuardFraction) {
      return {
        kind: 'stop',
        reason: `run budget ${Math.round((spent / working) * 100)}% of the working share spent `
          + `($${spent.toFixed(4)} of $${working.toFixed(4)}; $${this.allocation.bufferUSD.toFixed(4)} reserved for the report) `
          + '— report what you have',
      }
    }
    return { kind: 'ok' }
  }

  /** Which phase the allocator thinks is running, for a sanity check at the call site. */
  get currentPhase(): PipelinePhase | undefined {
    return this.current
  }
}

/** Human-readable milliseconds, so a ceiling in a message is not a number to decode. */
function fmtMs(ms: number): string {
  return ms >= 60_000 ? `${(ms / 60_000).toFixed(1)}min` : `${Math.round(ms / 1000)}s`
}
