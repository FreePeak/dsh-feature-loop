/**
 * The check that fails when an axis drifts or a threshold moves.
 *
 * Run: `node --experimental-strip-types --test test/metrics.test.ts`
 * No harness, no network, no model call — the module is pure, so its test is
 * hand-built records and arithmetic, including each alert exactly at its
 * threshold and one step below it.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import type { RunRecord } from '../src/runlog.ts'
import { baseline, summarize } from '../src/metrics.ts'

/** A complete record with sane defaults; every test overrides only what it measures. */
function record(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    runId: 'run',
    startedAt: 0,
    endedAt: 1000,
    pass: 1,
    passes: 1,
    taskKey: 'task',
    outcome: 'goal-met',
    steps: 1,
    maxSteps: 10,
    costUSD: 0.1,
    budgetUSD: 10,
    unpricedSteps: 0,
    byRoute: {},
    stepLatencyMs: [100],
    wallMs: 1000,
    latencyKind: 'round-trip',
    signals: [],
    judgeScores: [],
    reviewFraction: 0,
    specFingerprint: 'none',
    ...overrides,
  }
}

test('percentiles are nearest-rank: exact p50/p95 on a hand-built array', () => {
  const records = Array.from({ length: 20 }, (_, i) =>
    record({ steps: i + 1, wallMs: (i + 1) * 100 }))
  const s = summarize(records)
  // n=20: p50 at index ceil(10)-1 = 9 (the 10th), p95 at index ceil(19)-1 = 18 (the 19th, NOT the max).
  assert.equal(s.speed.steps.p50, 10)
  assert.equal(s.speed.steps.p95, 19)
  assert.equal(s.speed.steps.latest, 20)
  assert.equal(s.speed.wallMs.p50, 1000)
  assert.equal(s.speed.wallMs.p95, 1900)
  assert.equal(s.speed.wallMs.latest, 2000)
  // Baseline: mean of the last 7 goal-met runs, 14..20.
  assert.equal(s.speed.steps.baseline, 17)
})

test('latency percentiles pool stepLatencyMs; empty arrays contribute to wallMs only', () => {
  const s = summarize([
    record({ stepLatencyMs: [100, 100, 100, 100, 100, 100] }),
    record({ stepLatencyMs: [300] }),
    record({ stepLatencyMs: [], wallMs: 2000 }),
  ])
  // 7 pooled samples: p50 at index 3 (a 100), p95 at index 6 (the 300).
  assert.equal(s.speed.latencyMs.p50, 100)
  assert.equal(s.speed.latencyMs.p95, 300)
  assert.equal(s.speed.latencyMs.latest, 300)
  // wallMs gets a sample from every record, including the one that timed no steps.
  assert.equal(s.speed.wallMs.p95, 2000)
  assert.equal(s.speed.wallMs.latest, 2000)
})

test('latencyKind is the common measured kind, mixed when records disagree', () => {
  assert.equal(
    summarize([record({ latencyKind: 'model' }), record({ latencyKind: 'model' })]).speed.latencyKind,
    'model',
  )
  assert.equal(
    summarize([record({ latencyKind: 'model' }), record()]).speed.latencyKind,
    'mixed',
  )
  // A record that timed nothing declares nothing: it cannot make the kind
  // "mixed" — and when NOTHING was timed the kind is absent rather than a
  // guess. `undefined` is not `'round-trip'`: the old default declared a
  // MEASUREMENT KIND for a run that never took one (§1bt).
  assert.equal(
    summarize([
      record({ stepLatencyMs: [], latencyKind: 'model' }),
      record({ stepLatencyMs: [] }),
    ]).speed.latencyKind,
    undefined,
  )
  assert.equal(
    summarize([
      record({ stepLatencyMs: [10], latencyKind: 'model' }),
      record({ stepLatencyMs: [] }),
    ]).speed.latencyKind,
    'model',
    'and one timed record is enough to name the kind',
  )
})

test('an unmeasured run does not put a zero in the wall-clock axis', () => {
  // §1bs found `reviewFraction` hardcoded to 0 where a count existed. These two
  // have NO source on the harness path — the plugin never times anything — so
  // the honest shape is an absent field, and an absent field must not enter the
  // distribution as a zero.
  const unmeasured = [
    record({ outcome: 'goal-met', steps: 4, wallMs: undefined, latencyKind: undefined, stepLatencyMs: [] }),
    record({ outcome: 'goal-met', steps: 6, wallMs: 1500, latencyKind: 'model', stepLatencyMs: [120] }),
  ]
  const s = summarize(unmeasured, unmeasured)
  assert.equal(s.measuredRuns, 2, 'both runs stepped')
  assert.equal(s.speed.wallMs.p50, 1500, 'only the timed run contributes')
  assert.equal(s.speed.latencyKind, 'model', 'and one timed run names the kind')
  assert.equal(s.speed.latencyMs.p50, 120)

  const none = [record({ outcome: 'model-stop', steps: 2, wallMs: undefined, stepLatencyMs: [] })]
  const n = summarize(none, none)
  assert.equal(n.speed.wallMs.p50, 0, 'no run was timed')
  assert.equal(n.speed.latencyKind, undefined, 'so no kind is declared either')
})

test('goalMetRate counts goal-met outcomes; firstPassRate only first-pass successes', () => {
  const s = summarize([
    record({ outcome: 'goal-met', pass: 1 }),
    record({ outcome: 'goal-met', pass: 2 }),
    record({ outcome: 'budget-stop' }),
    record({ outcome: 'error' }),
  ])
  assert.equal(s.quality.goalMetRate, 0.5)
  assert.equal(s.quality.firstPassRate, 0.25)
})

test('firstPassRate is absent when no record is a retry, rather than echoing goalMetRate', () => {
  // The defect: `recordTurn` hardcodes `pass: 1`, so on the harness path
  // `met.filter(pass === 1)` IS `met` and the two numbers are one number.
  // Measured 2026-10-04 on the committed history — goalMetRate 0.867,
  // firstPassRate 0.867, all 15 records pass === 1. A reader saw two
  // independent-looking rates.
  const single = summarize([record({ outcome: 'goal-met' }), record({ outcome: 'goal-met' })])
  assert.equal(single.quality.goalMetRate, 1)
  assert.equal(single.quality.firstPassRate, undefined)

  // And it answers normally the moment a retry exists, which is the only way one
  // can: the CLI's runRefined writes them.
  const withRetry = summarize([
    record({ outcome: 'goal-met', pass: 1 }),
    record({ outcome: 'goal-met', pass: 2 }),
  ])
  assert.equal(withRetry.quality.goalMetRate, 1)
  assert.equal(withRetry.quality.firstPassRate, 0.5, 'one of two runs needed no retry')
})

test('a zero-step run is not a sample of what a run costs', () => {
  // Measured 2026-10-04 on the committed history: 13 of 15 records had
  // steps: 0, so steps.p50 and cost.perRun.p50 were BOTH 0 — "a typical run
  // costs $0.00 and takes 0 steps". Exact arithmetic, misleading reading: the
  // zero meant "most of these never ran".
  const history = [
    ...Array.from({ length: 13 }, () => record({ outcome: 'model-stop', steps: 0, costUSD: 0 })),
    record({ outcome: 'goal-met', steps: 8, costUSD: 0.004 }),
    record({ outcome: 'goal-met', steps: 10, costUSD: 0.006 }),
  ]
  const s = summarize(history, history)
  assert.equal(s.runs, 15, 'every closed turn is still a run')
  assert.equal(s.measuredRuns, 2, 'and the axes say how many of them ran')
  assert.equal(s.speed.steps.p50, 8, 'p50 steps of the runs that ran')
  // n=2, so p50 is the lower of the two — the point is that it is NOT 0. With
  // the 13 non-runs included it would have been exactly 0.
  assert.equal(s.cost.perRun.p50, 0.004, 'p50 cost is not dragged to zero by the non-runs')
  assert.equal(s.cost.goalMetCost, 0.005, 'the price of success, over runs that succeeded by doing something')

  // And when NOTHING ran, the axes are absent rather than zero — a 0 p50 with
  // no measurement behind it is the same false claim in a smaller font.
  const empty = [record({ outcome: 'model-stop', steps: 0, costUSD: 0 })]
  const e = summarize(empty, empty)
  assert.equal(e.measuredRuns, 0)
  assert.equal(e.cost.perRun.p50, 0, 'the axis shape is unchanged when there is nothing to measure')
  assert.equal(e.cost.goalMetCost, undefined, 'but no price of success is invented')
})

test('meanJudge and meanQuality stay absent when nothing was scored — absent is not zero', () => {
  const s = summarize([record(), record()])
  assert.equal(s.quality.meanJudge, undefined)
  assert.equal(s.quality.meanQuality, undefined)
})

test('meanJudge flattens every judge score; meanQuality averages only the scored runs', () => {
  const s = summarize([
    record({ judgeScores: [1, 3] }),
    record({ judgeScores: [2], qualityScore: 3 }),
    record({ qualityScore: 1 }),
  ])
  assert.equal(s.quality.meanJudge, 2)
  assert.equal(s.quality.meanQuality, 2)
})

test('unpriced steps propagate as a non-zero sum and mark cost unknown', () => {
  const s = summarize([record({ unpricedSteps: 2 }), record({ unpricedSteps: 3 })])
  assert.equal(s.cost.unpricedSteps, 5, 'the SUM of every record, not just the records that had any')
  const alert = s.alerts.find(a => a.kind === 'unpriced')
  assert.ok(alert, 'a non-zero unpriced count must alert')
  assert.equal(alert.severity, 'warning')
  assert.match(alert.detail, /cost is unknown/i)

  // Zero unpriced steps: the number is 0 AND there is no alert — absence of
  // evidence of under-counting is the only time cost may read as a figure.
  const clean = summarize([record()])
  assert.equal(clean.cost.unpricedSteps, 0)
  assert.equal(clean.alerts.length, 0)
})

test('steps alert fires exactly at 2x baseline, silent one step below', () => {
  // 7 goal-met runs: baseline = mean = 6, P95 = max = 12 — exactly 2x.
  const at = summarize([5, 5, 5, 5, 5, 5, 12].map(steps => record({ steps })))
  assert.equal(at.alerts.length, 1, JSON.stringify(at.alerts))
  assert.equal(at.alerts[0].kind, 'steps')
  // Max 11: P95 11 < 2 * (41/7) ≈ 11.71 — no threshold met, no alert at all.
  const below = summarize([5, 5, 5, 5, 5, 5, 11].map(steps => record({ steps })))
  assert.equal(below.alerts.length, 0)
})

test('cost alert fires exactly at budget * 0.8, silent one cent below', () => {
  const threshold = 10 * 0.8 // budgetUSD default is 10
  const at = summarize([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, threshold].map(costUSD => record({ costUSD })))
  assert.equal(at.alerts.length, 1, JSON.stringify(at.alerts))
  assert.equal(at.alerts[0].kind, 'cost')
  const below = summarize([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, threshold - 0.1].map(costUSD => record({ costUSD })))
  assert.equal(below.alerts.length, 0)
})

test('latency alert fires exactly at 3x median, silent one ms below', () => {
  const at = summarize([100, 100, 100, 100, 100, 100, 300].map(ms => record({ stepLatencyMs: [ms] })))
  assert.equal(at.alerts.length, 1, JSON.stringify(at.alerts))
  assert.equal(at.alerts[0].kind, 'latency')
  // p50 stays 100; p95 299 < 300 = 3 * median.
  const below = summarize([100, 100, 100, 100, 100, 100, 299].map(ms => record({ stepLatencyMs: [ms] })))
  assert.equal(below.alerts.length, 0)
})

test('cycle alert fires exactly at 2% of runs, silent below it', () => {
  const cycle = { signals: [{ kind: 'tool-cycle', severity: 'warning' }] }
  // 1 of 50 = 0.02 exactly.
  const at = summarize(Array.from({ length: 50 }, (_, i) => record(i === 0 ? cycle : {})))
  assert.equal(at.alerts.length, 1, JSON.stringify(at.alerts))
  assert.equal(at.alerts[0].kind, 'cycle')
  // 1 of 51 ≈ 0.0196 < 0.02.
  const below = summarize(Array.from({ length: 51 }, (_, i) => record(i === 0 ? cycle : {})))
  assert.equal(below.alerts.length, 0)
})

test('the review alert fires on the share of RUNS, and names that', () => {
  // The book's sentence is "Human escalation rate … > 15% of RUNS". The alert
  // used to fire on the share of STEPS while printing "(15% of runs)" — so the
  // number and the label were different quantities.
  const at = summarize([record({ reviewFraction: 0.15 }), record({ reviewFraction: 0.15 })])
  assert.ok(at.alerts.some(a => a.kind === 'review'), JSON.stringify(at.alerts))
  assert.match(at.alerts.find(a => a.kind === 'review')!.detail, /of runs surfaced a step/)

  // The step share keeps its own bar and its own label: a loop that reviews a
  // quarter of its STEPS is drowning a human even when every run involves one.
  assert.ok(at.alerts.some(a => a.kind === 'review-fraction'))
  assert.match(at.alerts.find(a => a.kind === 'review-fraction')!.detail, /% of steps/)
})

test('a heavy review on FEW runs is reported by both numbers, and they disagree', () => {
  // One review in a single 100-step run: 1% of steps, 100% of runs. Under the old
  // single number this read as "no human was involved" and the alert stayed
  // silent.
  const heavyFew = summarize([record({ reviewFraction: 0.01, steps: 100 })], [record()])
  assert.equal(heavyFew.quality.reviewFraction, 0.01, 'a share of steps')
  assert.equal(heavyFew.quality.reviewRunRate, 1, 'a share of runs')
  assert.ok(heavyFew.alerts.some(a => a.kind === 'review'), 'the run share fires its bar')
  assert.equal(heavyFew.alerts.filter(a => a.kind === 'review-fraction').length, 0, 'the step share does not')

  const lightMany = summarize(
    [record({ reviewFraction: 0.01, steps: 2 }), record({ reviewFraction: 0.01, steps: 2 }),
     record({ reviewFraction: 0.01, steps: 2 }), record({ reviewFraction: 0, steps: 2 })],
    [record()],
  )
  assert.equal(lightMany.quality.reviewRunRate, 0.75)
  assert.equal(Math.round(lightMany.quality.reviewFraction * 100) / 100, 0.01)
})

test('reviewRunRate is absent with no records — zero runs is not zero escalation', () => {
  const none = summarize([], [])
  assert.equal(none.quality.reviewRunRate, undefined)
  assert.equal(none.quality.reviewFraction, 0, 'the step share has no denominator and stays 0')
})

test('an empty record list summarizes to zeros without throwing', () => {
  const s = summarize([])
  assert.equal(s.runs, 0)
  assert.equal(s.provisional, true)
  assert.equal(s.malformed, 0)
  assert.equal(s.quality.goalMetRate, 0)
  // Absent, not zero: with no records there are no passes to be first of, and
  // a 0 here would be indistinguishable from a real "no run ever landed on its
  // first pass" — which is exactly the confusion this field is being fixed for.
  assert.equal(s.quality.firstPassRate, undefined)
  assert.equal(s.quality.reviewFraction, 0)
  assert.equal(s.quality.meanJudge, undefined)
  assert.equal(s.quality.meanQuality, undefined)
  assert.equal(s.cost.unpricedSteps, 0)
  assert.equal(s.cost.goalMetCost, undefined)
  assert.equal(s.speed.steps.p50, 0)
  assert.equal(s.speed.steps.baseline, undefined, 'no goal-met runs, no baseline')
  // Nothing was timed, so no kind is declared. This used to be 'round-trip':
  // a measurement kind asserted for a measurement that never happened.
  assert.equal(s.speed.latencyKind, undefined)
  assert.equal(s.alerts.length, 0)
})

test('a short history is flagged provisional, and malformed lines pass through', () => {
  assert.equal(summarize([record(), record(), record(), record()]).provisional, true)
  assert.equal(summarize([record(), record(), record(), record(), record()]).provisional, false)
  assert.equal(summarize([], { malformed: 3 }).malformed, 3)
})

test('goalMetCost is absent until a goal-met run exists, then the mean cost of success', () => {
  assert.equal(summarize([record({ outcome: 'budget-stop' })]).cost.goalMetCost, undefined)
  const s = summarize([
    record({ outcome: 'budget-stop', costUSD: 9 }),
    record({ costUSD: 0.5 }),
    record({ costUSD: 1.5 }),
  ])
  assert.equal(s.cost.goalMetCost, 1)
})

test('cost.perStep is each run\'s USD per step; zero-step runs add nothing', () => {
  const s = summarize([
    record({ steps: 4, costUSD: 1 }),
    record({ steps: 2, costUSD: 1 }),
    record({ outcome: 'budget-stop', steps: 0, costUSD: 0 }),
  ])
  // Two priced runs: 0.25 and 0.5. Nearest-rank: p50 at index 0, p95 at index 1.
  assert.equal(s.cost.perStep.p50, 0.25)
  assert.equal(s.cost.perStep.p95, 0.5)
  assert.equal(s.cost.perStep.latest, 0.5)
})

test('baseline averages the last seven goal-met runs, ignoring the rest', () => {
  const records = [
    record({ outcome: 'budget-stop', steps: 100, costUSD: 9 }),
    ...Array.from({ length: 7 }, () => record({ steps: 2, costUSD: 0.25, stepLatencyMs: [50] })),
    record({ outcome: 'error', steps: 500, costUSD: 9 }),
  ]
  const b = baseline(records)
  assert.equal(b.steps, 2)
  assert.equal(b.cost, 0.25)
  assert.equal(b.latencyMs, 50)
  // Window counts goal-met records only; no goal-met run means no baseline at all.
  assert.equal(baseline(records, 2).steps, 2)
  assert.deepEqual(baseline([record({ outcome: 'error' })]), {})
  // Goal-met runs with no timed steps: steps and cost yes, latency absent — not 0.
  const silent = Array.from({ length: 7 }, () => record({ stepLatencyMs: [] }))
  assert.equal(baseline(silent).steps, 1)
  assert.equal(baseline(silent).latencyMs, undefined)
})

test('summarize mirrors the baseline onto the axes it measured', () => {
  const records = Array.from({ length: 7 }, () =>
    record({ steps: 3, costUSD: 0.25, stepLatencyMs: [40], wallMs: 500 }))
  const s = summarize(records)
  assert.equal(s.speed.steps.baseline, 3)
  assert.equal(s.cost.perRun.baseline, 0.25)
  assert.equal(s.speed.latencyMs.baseline, 40)
  assert.equal(s.speed.wallMs.baseline, undefined, 'wall time has no baseline to compare against')
  assert.equal(s.alerts.length, 0)
})


test('every axis says how many samples its median is drawn from', () => {
  // §1ca: a live run printed "1203s" beside a turn the e2e had itself timed at
  // 268s. The number was a median over ONE sample and nothing on the wire said
  // so — the figure wore the same label a 40-run median wears.
  const summary = summarize([record({ steps: 4, costUSD: 0.005, wallMs: 1_203_287 })])
  assert.equal(summary.speed.wallMs.p50, 1_203_287, 'the median IS the sample')
  assert.equal(summary.speed.wallMs.samples, 1,
    'and the axis must report that it is drawn from one sample')
  assert.equal(summary.cost.perRun.samples, 1)
  assert.equal(summary.speed.steps.samples, 1)
  assert.equal(summary.speed.wallMs.samples, 1)

  // An axis nobody measured is zero samples, not absent: "nothing to draw a
  // percentile from" is a fact. That is §1bq's rule, not its exception.
  const untimed = summarize([record({ wallMs: undefined })])
  assert.equal(untimed.speed.wallMs.samples, 0)
  assert.equal(untimed.cost.perRun.samples, 1, 'the cost axis was still measured')

  // §1ca: records written BEFORE this path had a clock carry `wallMs: 0`, and
  // they never leave the file. Two zeros out of three samples made the ZERO the
  // median, so the panel said "a typical turn takes 0s" while `latest` read
  // 193561. A zero measurement is an absence wearing a number.
  const mixed = summarize([
    record({ wallMs: 0 }),
    record({ wallMs: 0 }),
    record({ wallMs: 193_561 }),
  ])
  assert.equal(mixed.speed.wallMs.samples, 1,
    'the pre-clock zeros are not samples')
  assert.equal(mixed.speed.wallMs.p50, 193_561,
    'and the median is the one real measurement, not the zero beside it')
  // `latest` is the last RECORD's value. Left alone deliberately: it documents
  // "what the loop is doing now", and rewriting it to hide a record would be
  // the roll-up inventing a measurement. Here the last record IS the real one.
  assert.equal(mixed.speed.wallMs.latest, 193_561)

  // Two runs are a coin toss, not a median — so the count is reported verbatim
  // and the PANEL decides what is too thin to label, never the roll-up.
  const two = summarize([
    record({ wallMs: 100, steps: 2 }),
    record({ wallMs: 9_000, steps: 8 }),
  ])
  assert.equal(two.speed.wallMs.samples, 2)
  assert.equal(two.speed.wallMs.p50, 100, 'n=2 nearest-rank p50 is index ceil(1)-1 = 0: the lower value')
})
