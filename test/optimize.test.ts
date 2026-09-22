/**
 * The check for the composition seam: history in, planned ceilings and an
 * advisory out.
 *
 * The modules either side of this one are tested on their own — `envelope.ts`
 * on the percentile arithmetic, `metrics.ts` on the roll-up, `optimizer.ts` on
 * the battery's fail-toward-no-advice rules. What none of those can check is
 * the *join*: whether a derived ceiling is actually applied to the spec, when
 * a pin outranks the derivation, how the cost cap behaves, and whether another
 * goal's records can leak into this goal's envelope. That is what this file
 * covers, with a small real history on disk (no model, no network).
 *
 * Run: `node --experimental-strip-types --test test/optimize.test.ts`
 */

import { strict as assert } from 'node:assert'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { NO_JUDGE } from '../src/laya.ts'
import type { Judge, SystemOneAnswer, SystemOneQuestion } from '../src/laya.ts'
import { advisoryFor, defaultHistoryPath, planEnvelope, recordsForTask } from '../src/optimize.ts'
import { appendRecord, DEFAULT_HISTORY, taskKeyOf } from '../src/runlog.ts'
import type { RunRecord } from '../src/runlog.ts'
import type { LoopSpec } from '../src/spec.ts'

/** A temp history file, unique per test so nothing is shared through disk. */
function historyFile(): string {
  return join(mkdtempSync(join(tmpdir(), 'dsh-opt-')), 'runs.jsonl')
}

/** A spec whose ceilings are the ones a derivation may move. */
function spec(overrides: Partial<LoopSpec> = {}): LoopSpec {
  return {
    goal: 'the demo suite passes',
    sensor: ['repo'],
    controller: { ladder: [{ provider: 'xiaomi', model: 'mimo-v2.5' }], stepsPerRung: 0, escalateAfterFailures: 3 },
    actuator: { read: 'read', edit: 'reversible-write' },
    feedback: 'verify exits 0',
    termination: { successCommand: 'bash verify.sh', guards: ['tool-cycle'] },
    maxSteps: 30,
    costBudgetUSD: 5,
    ...overrides,
  }
}

/** One record, with only the fields the derivation reads given real values. */
function record(goal: string, overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    runId: `run-${String(Math.random()).slice(2, 8)}`,
    startedAt: 1,
    endedAt: 2,
    pass: 1,
    passes: 1,
    taskKey: taskKeyOf(goal),
    outcome: 'goal-met',
    steps: 6,
    maxSteps: 30,
    costUSD: 0.4,
    budgetUSD: 5,
    unpricedSteps: 0,
    byRoute: {},
    stepLatencyMs: [100],
    wallMs: 1000,
    latencyKind: 'model',
    signals: [],
    judgeScores: [2],
    reviewFraction: 0.1,
    specFingerprint: 'spec-1',
    ...overrides,
  }
}

/** Write records to a fresh history file and return its path. */
function withHistory(records: readonly RunRecord[]): string {
  const path = historyFile()
  for (const r of records) appendRecord(path, r)
  return path
}

/** A judge that answers `score` for every question, recording how often it was asked. */
function scoringJudge(score: number): Judge & { calls: number } {
  const judge = {
    calls: 0,
    score(_state: string, _questions: Record<string, SystemOneQuestion>): Promise<SystemOneAnswer> {
      judge.calls += 1
      return Promise.resolve({ score, confidence: 0.9 })
    },
  }
  return judge as unknown as Judge & { calls: number }
}

test('no history: the configured ceilings stand and the run is the first record', () => {
  const plan = planEnvelope({ historyPath: join(tmpdir(), 'dsh-absent-history', 'runs.jsonl'), goal: 'g', spec: spec() })
  assert.equal(plan.spec.maxSteps, 30)
  assert.equal(plan.spec.costBudgetUSD, 5)
  assert.equal(plan.missing, true)
  assert.equal(plan.records.length, 0)
  assert.ok(plan.provenance.some(l => l.includes('does not exist yet')), plan.provenance.join('\n'))
})

test('fewer than five usable records: the envelope is provisional and is NOT applied', () => {
  const goal = 'g'
  const path = withHistory([record(goal), record(goal), record(goal, { steps: 9 })])
  const plan = planEnvelope({ historyPath: path, goal, spec: spec() })
  // The kernel derives floors here (maxSteps = minSteps); applying them would
  // starve a loop that has not been measured yet, which is the whole point of
  // the provisional flag.
  assert.equal(plan.envelope?.provisional, true)
  assert.equal(plan.spec.maxSteps, 30)
  assert.equal(plan.spec.costBudgetUSD, 5)
  assert.ok(plan.provenance.some(l => l.includes('not applied')), plan.provenance.join('\n'))
})

test('five goal-met records: maxSteps is derived from P95 x 1.3 and the cost is tightened', () => {
  const goal = 'g'
  // P95 of [6,6,6,6,6,10] is 10 -> ceil(10 * 1.3) = 13, inside the 3..30 band.
  const path = withHistory([6, 6, 6, 6, 6, 10].map(steps => record(goal, { steps, costUSD: 0.4 })))
  const plan = planEnvelope({ historyPath: path, goal, spec: spec() })
  assert.equal(plan.envelope?.provisional, false)
  assert.equal(plan.spec.maxSteps, 13)
  // P95(cost) = 0.4, x1.3 = 0.52 < the configured 5, so the derivation tightens.
  assert.equal(plan.spec.costBudgetUSD.toFixed(2), '0.52')
  assert.ok(plan.provenance.some(l => l.includes('maxSteps 30 → 13')), plan.provenance.join('\n'))
  assert.ok(plan.provenance.some(l => l.includes('→ $0.52')), plan.provenance.join('\n'))
})

test('an explicit pin outranks the derivation', () => {
  const goal = 'g'
  const path = withHistory([6, 6, 6, 6, 6, 10].map(steps => record(goal, { steps })))
  const plan = planEnvelope({
    historyPath: path,
    goal,
    spec: spec(),
    pinned: { maxSteps: true, costBudgetUSD: true },
  })
  assert.equal(plan.spec.maxSteps, 30)
  assert.equal(plan.spec.costBudgetUSD, 5)
  assert.ok(plan.provenance.filter(l => l.includes('pinned it explicitly')).length === 2, plan.provenance.join('\n'))
})

test('the configured budget is a cap: a derivation wanting more never raises it', () => {
  const goal = 'g'
  // Every goal-met run spent $2 of a $5 config. P95(cost) x 1.3 = $2.60, so the
  // derivation wants less here; drive it the other way by configuring $1.
  const path = withHistory([6, 6, 6, 6, 6, 6].map(() => record(goal, { costUSD: 2 })))
  const plan = planEnvelope({ historyPath: path, goal, spec: spec({ costBudgetUSD: 1 }) })
  // P95(cost) x 1.3 = 2.6 > 1, so the cap holds the operator's number and says why.
  assert.equal(plan.spec.costBudgetUSD, 1)
  assert.ok(plan.provenance.some(l => l.includes('cap, not a target')), plan.provenance.join('\n'))
})

test('the never-lower guard survives the cap: a goal-met run above the derived ceiling raises maxSteps', () => {
  const goal = 'g'
  // One goal-met run at 28 steps sits in the tail P95 cannot see, so the guard
  // raises the ceiling rather than starving that shape. The recorded maxSteps is
  // 30, so the derivation must not land below 28.
  const path = withHistory([
    record(goal, { steps: 5 }),
    record(goal, { steps: 5 }),
    record(goal, { steps: 5 }),
    record(goal, { steps: 5 }),
    record(goal, { steps: 5 }),
    record(goal, { steps: 28 }),
  ])
  const plan = planEnvelope({ historyPath: path, goal, spec: spec() })
  assert.ok(plan.spec.maxSteps >= 28, `maxSteps ${String(plan.spec.maxSteps)} starves the tail`)
  assert.ok(
    plan.provenance.some(l => l.includes('never-lower guard')),
    plan.provenance.join('\n'),
  )
})

test('another goal in the same file never leaks into this envelope', () => {
  const goal = 'this goal'
  const other = 'a different goal'
  const path = withHistory([
    // Nine 3-step runs of another goal: the majority group the kernel would
    // pick if it were handed the whole file.
    ...Array.from({ length: 9 }, () => record(other, { steps: 3, costUSD: 0.01 })),
    ...Array.from({ length: 5 }, () => record(goal, { steps: 8, costUSD: 0.5 })),
  ])
  const plan = planEnvelope({ historyPath: path, goal, spec: spec() })
  assert.equal(plan.records.length, 5)
  assert.ok(plan.provenance.some(l => l.includes('belong to other goals')), plan.provenance.join('\n'))
  // Derived from THIS goal's P95 (8) x 1.3 = 11, not from the other goal's 3 x 1.3 = 4.
  assert.equal(plan.spec.maxSteps, 11)
})

test('recordsForTask keeps only the task asked for', () => {
  const a = record('a')
  const b = record('b')
  assert.deepEqual(recordsForTask([a, b, a], taskKeyOf('a')), [a, a])
})

test('advisoryFor rolls the records up and asks the judge for proposals', async () => {
  const goal = 'g'
  const judge = scoringJudge(2)
  const records = [6, 6, 6, 6, 6].map(steps => record(goal, { steps }))
  const advisory = await advisoryFor({ records, malformed: 2, spec: spec(), judge })
  assert.equal(advisory.metrics.runs, 5)
  assert.equal(advisory.metrics.malformed, 2)
  assert.equal(advisory.metrics.provisional, false)
  assert.equal(advisory.unavailable, undefined)
  assert.ok(advisory.recommendations.length > 0, 'a scoring judge should produce at least one proposal')
  assert.ok(judge.calls > 0)
})

test('advisoryFor reports why there is no advice instead of inventing one', async () => {
  const goal = 'g'
  const advisory = await advisoryFor({ records: [record(goal)], spec: spec(), judge: NO_JUDGE })
  assert.equal(advisory.recommendations.length, 0)
  assert.ok(advisory.unavailable !== undefined && advisory.unavailable.length > 0)
})

test('advisoryFor treats an empty history as not measured, never as zero cost', async () => {
  const advisory = await advisoryFor({ records: [], spec: spec(), judge: NO_JUDGE })
  assert.equal(advisory.metrics.runs, 0)
  assert.equal(advisory.metrics.provisional, true)
  assert.equal(advisory.metrics.cost.goalMetCost, undefined)
})

test('defaultHistoryPath resolves the documented file under the invoking directory', () => {
  assert.equal(defaultHistoryPath('/tmp/workspace'), join('/tmp/workspace', DEFAULT_HISTORY))
})

test('a history whose whole file is malformed is reported, not read as a quiet loop', () => {
  const path = historyFile()
  writeFileSync(path, '{"not":"a record"\nnope, not json at all\n', 'utf8')
  const plan = planEnvelope({ historyPath: path, goal: 'g', spec: spec() })
  assert.equal(plan.malformed, 2)
  assert.equal(plan.records.length, 0)
  assert.equal(plan.spec.maxSteps, 30)
  assert.ok(plan.provenance.some(l => l.includes('could not be parsed')), plan.provenance.join('\n'))
})
