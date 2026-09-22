/**
 * The refinement loop: one task, re-run with its own evidence, up to N passes.
 *
 * A single `runLoop` pass ends where its ceilings say it ends. Refinement asks
 * the next pass to do better *without changing the config* — proposals stay
 * proposals-only, so what changes between passes is a user notice carrying the
 * prior pass's evidence (cost, steps, judge scores, the weakest dimension, the
 * failing check output). That is the book's Self-Correction-with-Reflection and
 * Reviewer-Writer patterns, and it needs no config mutation: pre-applied
 * proposals from the dashboard change the spec for the next *session*, not
 * mid-refinement.
 *
 * Three numbers bound the loop, in the order they are checked:
 *
 * 1. `loops` — the 3–10 dial (`optimize.loops`, validated at load by
 *    `parseLoops` in `spec.ts`). Absent means one pass: today's behaviour,
 *    exactly.
 * 2. The `< 0.05` improvement rule — the book's anti-oscillation stop: when
 *    the mean judge score improves by less than 0.05 between passes, another
 *    pass is grinding, not refining.
 * 3. `totalBudgetUSD` — the refinement budget. Defaults to
 *    `costBudgetUSD × loops × 0.6` (the frontier's "first 50% nearly free").
 *    A pass does not start when the remaining budget cannot fund it. Without
 *    this, 10 passes × $1 is a $10 surprise — the book's own runaway-loop
 *    failure mode.
 *
 * Best-pass selection is deterministic and documented: goal-met first, then
 * higher quality, then lower cost, then fewer steps. A refinement pass that
 * makes things worse is never returned.
 *
 * @module dsh-feature-loop/refine
 */

import { randomUUID } from 'node:crypto'
import { runLoop } from './runner.ts'
import type { LoopRunnerOptions, LoopRunResult } from './runner.ts'
import type { LoopEvent } from './runner.ts'
import { parseLoops } from './spec.ts'

/** The book's anti-oscillation rule: stop when min quality improves by less. */
export const MIN_IMPROVEMENT = 0.05

/** The frontier's "first 50% nearly free": the default refinement budget. */
const REFINEMENT_BUDGET_FACTOR = 0.6

/** A run the refinement compared, and the quality number it was compared on. */
export interface PassRecord {
  result: LoopRunResult
  /** Mean of the pass's `judge` transcript scores, or `undefined` when the judge never scored. */
  quality: number | undefined
}

/** Options for {@link runRefined}: one task, up to `loops` passes. */
export interface RefineOptions extends LoopRunnerOptions {
  /**
   * Refinement passes over the task, an integer in `LOOPS_RANGE` (3–10).
   * Absent means one pass — the loop runs exactly as it does today.
   */
  loops?: number
  /**
   * Dollars the whole refinement (all passes) may spend. Defaults to
   * `spec.costBudgetUSD × loops × 0.6`. A non-positive value is rejected.
   */
  totalBudgetUSD?: number
  /**
   * The quality bar for the goal-met stop: the mean judge score (0–3) at or
   * above which a `goal-met` pass ends refinement. Default 2 — the same bar
   * as the attention router's `judgeThreshold`, because a pass worth stopping
   * for is a pass worth a human look.
   */
  qualityThreshold?: number
  /** History file each pass is appended to, when set (with `taskKey`). */
  historyPath?: string
  /** Stable key for the goal, so envelopes are per-task rather than global. */
  taskKey?: string
  /**
   * The spec fingerprint recorded on each run record, when known. Kept
   * optional so the refinement does not depend on who remembered to
   * fingerprint what: unknown reads as `'none'`, the same as `runlog.ts`.
   */
  specFingerprint?: string
  /**
   * Injectable replacement for `runLoop`, for tests. Omitted means the real
   * loop — the refinement's control flow is then exercised against a live
   * model, which is exactly what the scripted tests exist to avoid.
   */
  runFn?: (options: LoopRunnerOptions) => Promise<LoopRunResult>
}

/** What refinement produced: the best pass, and how many passes it took. */
export interface RefinedResult extends LoopRunResult {
  /** Passes actually run, 1-based count. */
  passes: number
  /** Whether the refinement stopped for a reason other than running out of passes. */
  stoppedEarly: boolean
  /** Why it stopped, in one line. */
  stopReason: string
}

/** Mean of a pass's `judge` transcript scores; `undefined` when none scored. */
export function passQuality(transcript: readonly LoopEvent[]): number | undefined {
  const scores = transcript
    .filter((e): e is Extract<LoopEvent, { kind: 'judge' }> => e.kind === 'judge')
    .map(e => e.score)
    .filter((s): s is number => typeof s === 'number')
  if (scores.length === 0) return undefined
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

/**
 * Whether the challenger beats the incumbent.
 *
 * Deterministic and documented: goal-met first (the only outcome that means
 * "done"), then higher Laya/judge quality, then lower cost, then fewer steps.
 * A pass with no quality number never outranks one with a number on quality —
 * "not scored" is not a score — but it may still win on cost or steps when
 * neither pass met the goal and quality is absent on both sides.
 */
function beats(challenger: PassRecord, incumbent: PassRecord): boolean {
  const cMet = challenger.result.outcome === 'goal-met'
  const iMet = incumbent.result.outcome === 'goal-met'
  if (cMet !== iMet) return cMet
  if (challenger.quality !== incumbent.quality) {
    if (challenger.quality === undefined) return false
    if (incumbent.quality === undefined) return true
    if (challenger.quality !== incumbent.quality) return challenger.quality > incumbent.quality
  }
  if (challenger.result.spentUSD !== incumbent.result.spentUSD) {
    return challenger.result.spentUSD < incumbent.result.spentUSD
  }
  return challenger.result.steps < incumbent.result.steps
}

/** The last failing `success-check` output, for the next pass's notice. */
function lastCheckFailure(transcript: readonly LoopEvent[]): string | undefined {
  for (let i = transcript.length - 1; i >= 0; i -= 1) {
    const e = transcript[i]!
    if (e.kind === 'success-check' && !e.ok) return e.output
  }
  return undefined
}

/**
 * Render one pass's evidence as the next pass's opening notice.
 *
 * Derived counts and short outputs only — never step text: the notice is a
 * prompt addition priced per token, and a notice that pastes the transcript
 * would spend the refinement budget restating what the loop already paid to
 * produce.
 */
function evidenceNotice(pass: number, record: PassRecord, threshold: number): string {
  const r = record.result
  const scored = r.transcript.filter(e => e.kind === 'judge').length
  const signals = [...new Set(r.signals.map(s => s.kind))]
  const failure = lastCheckFailure(r.transcript)
  const lines = [
    `pass ${String(pass)} ended ${r.outcome} after ${String(r.steps)} steps, $${r.spentUSD.toFixed(4)}, `
    + `quality ${record.quality === undefined ? 'unscored' : record.quality.toFixed(2)} (bar ${String(threshold)}), `
    + `${String(scored)} judge call(s), signals: ${signals.length === 0 ? 'none' : signals.join(', ')}.`,
  ]
  if (failure !== undefined) lines.push(`Failing check output: ${failure.slice(0, 500)}`)
  lines.push('Improve on this: keep what worked, change what the check output and the signals point at.')
  return lines.join('\n')
}

/**
 * Run one task for up to `loops` passes, returning the best pass.
 *
 * @param options - the loop's options plus the refinement knobs.
 * @returns the best pass's result, with the pass count and stop reason.
 */
export async function runRefined(options: RefineOptions): Promise<RefinedResult> {
  const { loops: loopsOpt, totalBudgetUSD: budgetOpt, qualityThreshold = 2, historyPath, taskKey, specFingerprint: fingerprint, runFn, ...loopOptions } = options
  const loops = loopsOpt === undefined ? 1 : parseLoops(loopsOpt, 'optimize.loops')
  if (budgetOpt !== undefined && (!Number.isFinite(budgetOpt) || budgetOpt <= 0)) {
    throw new TypeError(
      `optimize.totalBudgetUSD must be > 0, received ${String(budgetOpt)} — an unlimited refinement budget is not a budget`,
    )
  }
  const run = runFn ?? runLoop
  const startedAt = Date.now()
  const runId = randomUUID()
  const totalBudgetUSD = budgetOpt ?? loopOptions.spec.costBudgetUSD * loops * REFINEMENT_BUDGET_FACTOR

  let best: PassRecord | undefined
  let previousQuality: number | undefined
  let spentTotal = 0
  let passes = 0
  let stoppedEarly = false
  let stopReason = `ran all ${String(loops)} requested pass(es)`
  let notice: string | undefined

  for (let pass = 1; pass <= loops; pass += 1) {
    // A pass does not start when the remaining refinement budget cannot fund
    // it: the expected cost is the mean of passes so far, falling back to one
    // per-pass budget share for the first pass. A refinement that spends its
    // whole budget proving the budget was too small has still spent it.
    const expected = passes === 0 ? totalBudgetUSD / loops : spentTotal / passes
    if (spentTotal + expected > totalBudgetUSD && best !== undefined) {
      stoppedEarly = true
      stopReason = `refinement budget exhausted: $${spentTotal.toFixed(4)} spent of $${totalBudgetUSD.toFixed(2)}, `
        + `next pass needs ~$${expected.toFixed(4)}`
      break
    }
    const result = await run({ ...loopOptions, ...(notice === undefined ? {} : { passNotice: notice }) })
    passes += 1
    spentTotal += result.spentUSD
    const quality = passQuality(result.transcript)
    const record: PassRecord = { result, quality }
    if (best === undefined || beats(record, best)) best = record

    if (historyPath !== undefined && taskKey !== undefined) {
      // Dynamic import keeps this module in the harness-free closure: runlog
      // is Node builtins only, but a static import would still load its fs
      // surface into every consumer that only refines in memory.
      const { appendRecord } = await import('./runlog.ts')
      appendRecord(historyPath, {
        runId,
        startedAt,
        endedAt: Date.now(),
        pass,
        passes: loops,
        taskKey,
        outcome: result.outcome,
        steps: result.steps,
        maxSteps: loopOptions.spec.maxSteps,
        costUSD: result.spentUSD,
        budgetUSD: loopOptions.spec.costBudgetUSD,
        unpricedSteps: 0,
        byRoute: {},
        stepLatencyMs: [],
        wallMs: 0,
        latencyKind: 'round-trip',
        signals: result.signals.map(s => ({ kind: s.kind, severity: s.severity })),
        judgeScores: result.transcript
          .filter((e): e is Extract<LoopEvent, { kind: 'judge' }> => e.kind === 'judge')
          .map(e => e.score)
          .filter((s): s is number => typeof s === 'number'),
        reviewFraction: result.reviewFraction,
        specFingerprint: fingerprint ?? 'none',
      })
    }

    // Stop rules, in order. Goal-met AND at/above the bar stops: a goal-met
    // pass below the bar is a check that passed while the judge still disliked
    // the artifact, and one more pass is cheaper than shipping it. With no
    // judge scores at all, quality is undefined and goal-met alone stops —
    // "not scored" must not hold a finished task hostage.
    if (result.outcome === 'goal-met' && (quality === undefined || quality >= qualityThreshold)) {
      if (pass < loops) {
        stoppedEarly = true
        stopReason = quality === undefined
          ? `pass ${String(pass)} met the goal (no judge scores to compare)`
          : `pass ${String(pass)} met the goal at quality ${quality.toFixed(2)} (bar ${String(qualityThreshold)})`
      }
      break
    }
    if (result.outcome === 'aborted' || result.outcome === 'error') {
      // An aborted or errored pass stops refinement with the best so far and
      // its original outcome preserved: the operator's refusal (or the
      // gateway's failure) is evidence, not a number to optimise past.
      if (pass < loops) {
        stoppedEarly = true
        stopReason = `pass ${String(pass)} ended ${result.outcome}; keeping the best pass so far`
      }
      break
    }
    if (previousQuality !== undefined && quality !== undefined && quality - previousQuality < MIN_IMPROVEMENT) {
      if (pass < loops) {
        stoppedEarly = true
        stopReason = `pass ${String(pass)} improved quality by ${(quality - previousQuality).toFixed(3)} `
          + `(< ${String(MIN_IMPROVEMENT)}): refining further is grinding, not improving`
      }
      break
    }
    // An unscored pass leaves the baseline alone: "not scored" carries no
    // information about improvement, so it neither stops refinement nor
    // resets the comparison — the next scored pass is still measured against
    // the last pass that actually had a number.
    if (quality !== undefined) previousQuality = quality
    notice = evidenceNotice(pass, record, qualityThreshold)
  }

  // `best` is always set: the loop body runs at least once (loops >= 1), and
  // every pass assigns it when it is undefined.
  const winner = best!
  return { ...winner.result, passes, stoppedEarly, stopReason }
}
