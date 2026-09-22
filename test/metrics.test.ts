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
  // A record that timed nothing declares nothing: it cannot make the kind "mixed".
  assert.equal(
    summarize([
      record({ stepLatencyMs: [], latencyKind: 'model' }),
      record({ stepLatencyMs: [] }),
    ]).speed.latencyKind,
    'round-trip',
  )
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

test('review alert fires exactly at a 0.15 mean reviewFraction, silent below it', () => {
  const at = summarize([record({ reviewFraction: 0.15 }), record({ reviewFraction: 0.15 })])
  assert.equal(at.alerts.length, 1, JSON.stringify(at.alerts))
  assert.equal(at.alerts[0].kind, 'review')
  const below = summarize([record({ reviewFraction: 0.149 }), record({ reviewFraction: 0.149 })])
  assert.equal(below.alerts.length, 0)
})

test('an empty record list summarizes to zeros without throwing', () => {
  const s = summarize([])
  assert.equal(s.runs, 0)
  assert.equal(s.provisional, true)
  assert.equal(s.malformed, 0)
  assert.equal(s.quality.goalMetRate, 0)
  assert.equal(s.quality.firstPassRate, 0)
  assert.equal(s.quality.reviewFraction, 0)
  assert.equal(s.quality.meanJudge, undefined)
  assert.equal(s.quality.meanQuality, undefined)
  assert.equal(s.cost.unpricedSteps, 0)
  assert.equal(s.cost.goalMetCost, undefined)
  assert.equal(s.speed.steps.p50, 0)
  assert.equal(s.speed.steps.baseline, undefined, 'no goal-met runs, no baseline')
  assert.equal(s.speed.latencyKind, 'round-trip')
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
