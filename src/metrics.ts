/**
 * The three axes — quality, cost, speed — as pure arithmetic over run records.
 *
 * The dashboard, the envelope and the CLI all ask the same question ("is this
 * loop healthy?") and must get the same answer, so the answer is computed
 * once, here, from records passed in as data: no fs, no http, no cordis, no
 * `@deepseek-ai/*`. This is the same seam `budget.ts` and `signals.ts` already
 * use — policy is pure, I/O lives elsewhere, and a harness upgrade cannot
 * change what a number means.
 *
 * Every alert threshold below is the book's own, quoted in the comment above
 * its condition, because a threshold with no provenance is a number someone
 * liked. Conditions fire when the measured value is *at or above* the
 * threshold: a P95 sitting exactly at 2x baseline is already the condition the
 * book warns about, the same way `budget.ts` warns at
 * `spent >= costBudgetUSD * warnAt` rather than strictly above.
 *
 * Absence is never zero here. A metric with no observations is `undefined` or
 * omitted, so a dashboard can say "not measured" instead of printing a
 * confident $0.00 over an empty history.
 *
 * @module dsh-feature-loop/metrics
 */

/** `RunRecord` is data in, numbers out — a type-only import keeps this module free of `runlog.ts`'s fs imports. */
import type { RunRecord } from './runlog.ts'

/** One axis of the summary: distribution, newest observation, and (when computed) the baseline it is measured against. */
export interface AxisMetric {
  /** Nearest-rank median over the axis' samples. 0 when there are none — an empty axis is "not measured", never a claim that the value is zero. */
  p50: number
  /** Nearest-rank 95th percentile: the sample at `ceil(0.95 * n) - 1` of the ascending values, so over 20 samples it is the 19th fastest, not the slowest. */
  p95: number
  /** The most recent observation, in record order: what the loop is doing *now*, as opposed to what it has done on average. */
  latest: number
  /** Recent goal-met mean, when one could be computed — the reference the alerts measure against. Absent means "no successful runs to compare to", not zero. */
  baseline?: number
  /** The alert fired on this axis, mirrored from `alerts` so a dashboard rendering one axis can show why it is red without scanning the list. */
  alert?: string
}

/**
 * Everything derived from the run history, in one pass.
 *
 * Each sub-object is one axis of health the book tells you to watch; the
 * `alerts` array carries only the thresholds that actually fired, so a quiet
 * loop renders as an empty list rather than a wall of green checkmarks.
 */
export interface MetricsSummary {
  /** Records summarized. */
  runs: number
  /** True while the history is too short for a tail to mean anything: with fewer than five runs, a P95 is an anecdote with two decimals. */
  provisional: boolean
  /** Lines `readRecords` could not parse, passed through so a torn log is never mistaken for a quiet loop. */
  malformed: number
  cost: {
    /** Per-run USD. */
    perRun: AxisMetric
    /** Per-step USD: each run's `costUSD / steps`, zero-step runs excluded (they have no "per step" to divide by). */
    perStep: AxisMetric
    /** Mean cost of a goal-met run — the price of success. Absent when no run has met its goal, because an absent number is not zero. */
    goalMetCost?: number
    /**
     * Sum of `unpricedSteps` across records, exposed whenever non-zero.
     *
     * Non-zero means some steps were priced at zero because the adapter
     * reported no usage, so every cost figure in this summary is an
     * under-count. The dashboard must show cost as "unknown", never a false
     * $0.00: a budget that reads low is worse than one that reads unknown,
     * because a number below the ceiling invites the next run to keep going.
     */
    unpricedSteps: number
  }
  speed: {
    /** Steps per run. */
    steps: AxisMetric
    /** Per-step latency in ms, pooled across every `stepLatencyMs` sample. Records with an empty array contribute nothing here. */
    latencyMs: AxisMetric
    /** Wall-clock ms per run — every record has one, including the ones that timed no steps. */
    wallMs: AxisMetric
    /** What `stepLatencyMs` measured: the common declared kind, or `'mixed'` when records disagree — two differently-labelled numbers must never be averaged into one claim. */
    latencyKind: 'round-trip' | 'model' | 'mixed'
  }
  quality: {
    /** Share of runs that ended `goal-met`. */
    goalMetRate: number
    /** Share of *all* runs that met their goal on pass 1 — the fraction the loop got right without buying a retry. */
    firstPassRate: number
    /** Mean of every judge score flattened across runs. Absent when no judge ran. */
    meanJudge?: number
    /** Mean of `qualityScore` over the runs that asked for one. Absent when none did — not scored is not zero. */
    meanQuality?: number
    /** Mean `reviewFraction` across runs: the human-escalation rate. */
    reviewFraction: number
  }
  /** Only the thresholds that actually fired, in the book's order. */
  alerts: { kind: string; severity: string; detail: string }[]
}

/** Arithmetic mean, or `NaN` on an empty array — callers guard, so absence stays absence. */
function mean(values: readonly number[]): number {
  let sum = 0
  for (const v of values) sum += v
  return sum / values.length
}

/**
 * Nearest-rank percentile of ascending samples: the value at 0-based index
 * `ceil(p / 100 * n) - 1`, clamped into the array. Never interpolated — an
 * interpolated P95 invents a latency no run ever took, and policies that gate
 * real money on it should only ever see observed numbers.
 *
 * Returns 0 for an empty array; every caller treats an empty axis as "not
 * measured" before alerting on it.
 */
function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0
  const rank = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))]
}

/** p50/p95/latest over values in chronological (record) order. */
function axisOf(values: readonly number[]): { p50: number; p95: number; latest: number } {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    latest: values.length > 0 ? values[values.length - 1] : 0,
  }
}

/**
 * Derive the three axes and the book's alerts from run records.
 *
 * Pure: the records arrive as data, so the same history always yields the
 * same summary and the test is the arithmetic itself, not a fixture on disk.
 *
 * @param records - completed runs, newest last (append order).
 * @param opts - `malformed`, the count of unparsable lines `readRecords`
 *   skipped, passed through so the summary reports losses it did not cause.
 * @returns every axis, the baselines it was measured against, and the
 *   thresholds that fired.
 */
export function summarize(
  records: readonly RunRecord[],
  opts?: { malformed?: number },
): MetricsSummary {
  const runs = records.length
  const base = baseline(records)

  const stepsAxis: AxisMetric = { ...axisOf(records.map(r => r.steps)), baseline: base.steps }
  const perRunAxis: AxisMetric = { ...axisOf(records.map(r => r.costUSD)), baseline: base.cost }
  const perStepAxis: AxisMetric = axisOf(
    records.filter(r => r.steps > 0).map(r => r.costUSD / r.steps),
  )
  const wallAxis: AxisMetric = axisOf(records.map(r => r.wallMs))
  const latencyValues = records.flatMap(r => r.stepLatencyMs)
  const latencyAxis: AxisMetric = { ...axisOf(latencyValues), baseline: base.latencyMs }

  const met = records.filter(r => r.outcome === 'goal-met')
  const judges = records.flatMap(r => r.judgeScores)
  const qualities = records.flatMap(r => (r.qualityScore === undefined ? [] : [r.qualityScore]))
  const unpricedSteps = records.reduce((sum, r) => sum + r.unpricedSteps, 0)
  const reviewFraction = runs > 0 ? mean(records.map(r => r.reviewFraction)) : 0

  // Only records that actually timed steps declare a kind: an empty
  // `stepLatencyMs` has no measurement to label.
  const measuredKinds = new Set(
    records.filter(r => r.stepLatencyMs.length > 0).map(r => r.latencyKind),
  )
  // ponytail: `LatencyKind` has no "none" value, so a history with zero timed
  // steps reports 'round-trip' rather than "measured nothing"; ceiling: the
  // dashboard cannot distinguish a measured round-trip from an empty window;
  // upgrade path: widen `LatencyKind` in runlog.ts to carry 'none'.
  const latencyKind: MetricsSummary['speed']['latencyKind'] = measuredKinds.size > 1
    ? 'mixed'
    : measuredKinds.size === 1
      ? [...measuredKinds][0]
      : 'round-trip'

  const alerts: MetricsSummary['alerts'] = []
  const push = (kind: string, detail: string): string => {
    // Every threshold alert is a warning, not `critical`: these describe how
    // the *history* is trending. `critical` is reserved for signals that must
    // stop the loop before its next step (see `mustReview` in signals.ts).
    alerts.push({ kind, severity: 'warning', detail })
    return detail
  }

  // The book: "Steps per run (P50/P95) … Alert when P95 > 2x baseline".
  // Fires at the boundary too — P95 sitting exactly at 2x baseline is already
  // the condition, matching budget.ts's own `spent >= costBudgetUSD * warnAt`.
  if (stepsAxis.baseline !== undefined && stepsAxis.p95 >= 2 * stepsAxis.baseline) {
    stepsAxis.alert = push(
      'steps',
      `P95 steps per run ${stepsAxis.p95} >= 2x baseline ${stepsAxis.baseline}`,
    )
  }

  // The book: "Cost per run (P50/P95) … Alert when P95 > budget * 0.8".
  // ponytail: the whole history is judged against the LAST record's
  // budgetUSD — budget is config, and the last record holds the config in
  // effect now; ceiling: a history that mixed two budgets measures old runs
  // by the new number; upgrade path: compare per-record cost/budget ratios
  // or group records into budget epochs.
  const budgetUSD = runs > 0 ? records[runs - 1].budgetUSD : 0
  if (budgetUSD > 0 && perRunAxis.p95 >= budgetUSD * 0.8) {
    perRunAxis.alert = push(
      'cost',
      `P95 cost per run $${perRunAxis.p95} >= 80% of the $${budgetUSD} budget`,
    )
  }

  // The book: "Latency P95 … > 3x median". A tail that far above the median
  // means some runs are much slower, not that everything drifted. `p95 > 0`
  // keeps a window of all-zero timings (a transport that wrote zeros instead
  // of measurements) from firing on the trivial `0 >= 0` — no tail, no alert.
  if (latencyValues.length > 0 && latencyAxis.p95 > 0 && latencyAxis.p95 >= 3 * latencyAxis.p50) {
    latencyAxis.alert = push(
      'latency',
      `P95 step latency ${latencyAxis.p95}ms >= 3x median ${latencyAxis.p50}ms`,
    )
  }

  // This repo's own rule, budget.ts: "a budget that reads low is worse than
  // one that reads unknown." Unpriced steps make every cost figure above an
  // under-count, so the cost axis is overwritten with the "unknown" message:
  // a dashboard reads one line per axis, and the correct line is never a
  // dollar amount that looks like $0.00 spent.
  if (unpricedSteps > 0) {
    perRunAxis.alert = push(
      'unpriced',
      `cost is unknown: ${unpricedSteps} step(s) reported no usage, so spend is an under-count, not $0.00`,
    )
  }

  // The book: "Cycle detection rate … > 2% of runs".
  if (runs > 0) {
    const cyclic = records.filter(r => r.signals.some(s => s.kind === 'tool-cycle')).length
    const share = cyclic / runs
    if (share >= 0.02) {
      push('cycle', `tool-cycle in ${cyclic}/${runs} runs (${(share * 100).toFixed(2)}% >= 2% of runs)`)
    }
  }

  // The book: "Human escalation rate … > 15% of runs".
  if (reviewFraction >= 0.15) {
    push('review', `mean review fraction ${reviewFraction.toFixed(2)} >= 0.15 (15% of runs)`)
  }

  return {
    runs,
    provisional: runs < 5,
    malformed: opts?.malformed ?? 0,
    cost: {
      perRun: perRunAxis,
      perStep: perStepAxis,
      goalMetCost: met.length > 0 ? mean(met.map(r => r.costUSD)) : undefined,
      unpricedSteps,
    },
    speed: { steps: stepsAxis, latencyMs: latencyAxis, wallMs: wallAxis, latencyKind },
    quality: {
      goalMetRate: runs > 0 ? met.length / runs : 0,
      firstPassRate: runs > 0 ? met.filter(r => r.pass === 1).length / runs : 0,
      meanJudge: judges.length > 0 ? mean(judges) : undefined,
      meanQuality: qualities.length > 0 ? mean(qualities) : undefined,
      reviewFraction,
    },
    alerts,
  }
}

/**
 * The recent-success baseline the alerts measure against: means of
 * `steps`/`costUSD`/step-latency over the last `window` goal-met records.
 *
 * Only goal-met runs, because "twice as bad as baseline" must mean twice as
 * bad as what the loop has recently *achieved* — mixing in budget-stops and
 * errors would make every failure itself raise the bar for noticing failures.
 *
 * @param records - completed runs, newest last.
 * @param window - how many goal-met records to look back over. Defaults to 7: enough for a mean to mean something, few enough that a tuning change shows up this week.
 * @returns the means that had observations; a key with no data is absent, never zero.
 */
export function baseline(
  records: readonly RunRecord[],
  window = 7,
): { steps?: number; cost?: number; latencyMs?: number } {
  const met = records.filter(r => r.outcome === 'goal-met').slice(-Math.max(1, window))
  const out: { steps?: number; cost?: number; latencyMs?: number } = {}
  if (met.length === 0) return out
  out.steps = mean(met.map(r => r.steps))
  out.cost = mean(met.map(r => r.costUSD))
  // A goal-met run that timed no steps says nothing about latency, so it is
  // dropped rather than counted as a 0 ms success.
  const latencies = met.filter(r => r.stepLatencyMs.length > 0).map(r => mean(r.stepLatencyMs))
  if (latencies.length > 0) out.latencyMs = mean(latencies)
  return out
}
