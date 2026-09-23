/**
 * The check that fails when the derivation, the guards, or the probes break.
 *
 * Run: `node --experimental-strip-types --test test/envelope.test.ts`
 * No harness, no network, no model call — the policy is pure, so its test is too,
 * except for the two `detectSuccessCommand` cases, which use a throwaway temp dir.
 */

import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { defaultActuator, deriveEnvelope, detectSuccessCommand } from '../src/envelope.ts'
import type { RunRecord } from '../src/runlog.ts'

let runSeq = 0

/** A valid RunRecord with defaults; override only what a test is about. */
function rec(p: Partial<RunRecord> = {}): RunRecord {
  runSeq += 1
  return {
    runId: `run-${runSeq}`,
    startedAt: 0,
    endedAt: 1,
    pass: 1,
    passes: 1,
    taskKey: 'task-a',
    outcome: 'goal-met',
    steps: 5,
    maxSteps: 20,
    costUSD: 0.05,
    budgetUSD: 1,
    unpricedSteps: 0,
    byRoute: {},
    stepLatencyMs: [],
    wallMs: 100,
    latencyKind: 'round-trip',
    signals: [],
    judgeScores: [],
    reviewFraction: 0,
    specFingerprint: 'fp-a',
    ...p,
  }
}

const BAND = { minSteps: 3, maxSteps: 50 }

test('P95*1.3 arithmetic: exact steps and cost ceilings from a hand-built history', () => {
  // 20 records, one config. Sorted steps put the 95th-percentile rank
  // (ceil(0.95*20)=19, 1-based) at 10. Costs: 19 × 0.5 and one 0.6, so the
  // cost P95 (rank 19) is 0.5.
  const steps = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 8, 10, 12]
  const records = steps.map((s, i) => rec({ steps: s, costUSD: i === 19 ? 0.6 : 0.5 }))

  const env = deriveEnvelope(records, BAND)

  // ceil(10 * 1.3) = ceil(13) = 13, inside the band.
  assert.equal(env.maxSteps, 13)
  // 0.5 * 1.3 = 0.65 (within float tolerance, the budget.test.ts style).
  assert.ok(Math.abs(env.costBudgetUSD - 0.65) < 1e-9, `expected 0.65, got ${env.costBudgetUSD}`)
  // No root → no probe → no guess.
  assert.equal(env.successCommand, undefined)
  assert.equal(env.provisional, false)
  // Every number has a line explaining its rule.
  const trail = env.provenance.join('\n')
  assert.match(trail, /P95\(steps\)=10/)
  assert.match(trail, /P95\(costUSD\)=0\.5/)
  assert.match(trail, /p95 window/)
})

test('clamping at the low end: derivation below minSteps lands on minSteps', () => {
  // 6 records of 2 steps: P95 = 2, ceil(2 * 1.3) = 3, band floor is 5.
  const records = Array.from({ length: 6 }, () => rec({ steps: 2 }))
  const env = deriveEnvelope(records, { minSteps: 5, maxSteps: 50 })
  assert.equal(env.maxSteps, 5)
  assert.match(env.provenance.join('\n'), /clamp/)
})

test('clamping at the high end: derivation above maxSteps lands on maxSteps', () => {
  // 20 records of 100 steps, none goal-met (so the guard has nothing to
  // raise): P95 = 100, ceil(130) = 130, band ceiling is 30.
  const records = Array.from({ length: 20 }, () => rec({ steps: 100, outcome: 'budget-stop' }))
  const env = deriveEnvelope(records, { minSteps: 3, maxSteps: 30 })
  assert.equal(env.maxSteps, 30)
  assert.match(env.provenance.join('\n'), /clamp/)
})

test('never-lower guard (cost): a goal-met run above P95*1.3 raises the ceiling', () => {
  // 19 records at 0.5 and one goal-met at 1.0: cost P95 (rank 19) = 0.5,
  // so P95 * 1.3 = 0.65 — below the goal-met max of 1.0. Guard must fire.
  const records = Array.from({ length: 20 }, (_, i) =>
    rec({ steps: 5, costUSD: i === 19 ? 1.0 : 0.5, outcome: 'goal-met' }))
  const env = deriveEnvelope(records, BAND)

  assert.equal(env.costBudgetUSD, 1.0)
  const trail = env.provenance.join('\n')
  assert.match(trail, /never-lower guard \(cost\)/)
  // Steps unaffected: P95 = 5 → ceil(6.5) = 7 ≥ goal-met max 5.
  assert.equal(env.maxSteps, 7)
})

test('never-lower guard (steps): raises maxSteps past the clamped derivation', () => {
  // 19 records at 3 steps and one goal-met at 8: step P95 (rank 19) = 3,
  // ceil(3 * 1.3) = 4 — below the goal-met max of 8. Guard must fire.
  const records = Array.from({ length: 20 }, (_, i) =>
    rec({ steps: i === 19 ? 8 : 3, costUSD: 0.05, outcome: 'goal-met' }))
  const env = deriveEnvelope(records, BAND)

  assert.equal(env.maxSteps, 8)
  assert.match(env.provenance.join('\n'), /never-lower guard \(steps\)/)
})

test('cold start: no usable records → provisional floors', () => {
  const env = deriveEnvelope([], { minSteps: 4, maxSteps: 50 })
  assert.equal(env.provisional, true)
  assert.equal(env.maxSteps, 4)
  assert.equal(env.costBudgetUSD, 0.10)
  assert.match(env.provenance.join('\n'), /provisional/)
})

test('cold start: 4 usable records is still provisional, at the same floors', () => {
  const records = Array.from({ length: 4 }, (_, i) => rec({ steps: i + 1 }))
  const env = deriveEnvelope(records, { minSteps: 4, maxSteps: 50 })
  assert.equal(env.provisional, true)
  assert.equal(env.maxSteps, 4)
  assert.equal(env.costBudgetUSD, 0.10)
  assert.match(env.provenance.join('\n'), /provisional/)
})

test('mixed configs: only the majority taskKey/specFingerprint group is used, and provenance says so', () => {
  // Majority: task-a/fp-a, 6 records of 4 steps. Then 3 of task-b/fp-b at 100
  // steps and 1 of task-a/fp-z at 99 — if any leaked in, P95 would jump.
  const records = [
    ...Array.from({ length: 6 }, () => rec({ taskKey: 'task-a', specFingerprint: 'fp-a', steps: 4 })),
    ...Array.from({ length: 3 }, () => rec({ taskKey: 'task-b', specFingerprint: 'fp-b', steps: 100 })),
    rec({ taskKey: 'task-a', specFingerprint: 'fp-z', steps: 99 }),
  ]
  const env = deriveEnvelope(records, { minSteps: 1, maxSteps: 50 })

  // Usable = 6 (rank ceil(0.95*6)=6 → P95 = 4), ceil(4 * 1.3) = 6.
  assert.equal(env.maxSteps, 6, 'the 100-step records of another config must not move the P95')
  assert.equal(env.provisional, false, '6 usable records clears the cold-start floor')
  assert.match(env.provenance.join('\n'), /filtered out 4 of 10/)
})

test('detectSuccessCommand: package.json wins the probe order, empty scripts.test falls through', () => {
  const dir = mkdtempSync(join(tmpdir(), 'envelope-pkg-'))
  try {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: { test: 'vitest run' } }))
    assert.equal(detectSuccessCommand(dir), 'npm test')

    // Both probes present: package.json must still win.
    writeFileSync(join(dir, 'Makefile'), 'test:\n\t@echo ok\n')
    assert.equal(detectSuccessCommand(dir), 'npm test')

    // A blank scripts.test is not a hit; the Makefile is next in order.
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: { test: '' } }))
    assert.equal(detectSuccessCommand(dir), 'make test')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('detectSuccessCommand: an empty temp dir matches nothing and never guesses', () => {
  const dir = mkdtempSync(join(tmpdir(), 'envelope-empty-'))
  try {
    assert.equal(detectSuccessCommand(dir), undefined)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('defaultActuator returns exactly the six harness names with the right classes', () => {
  assert.deepEqual(defaultActuator(), {
    read: 'read',
    glob: 'read',
    grep: 'read',
    edit: 'reversible-write',
    write: 'irreversible',
    bash: 'irreversible',
  })
})
