/**
 * The check for the refinement loop's control flow.
 *
 * Every case uses an injected `runFn`, never a model or a network — the same
 * reason `runner.test.ts` uses the scripted client: control flow that can only
 * be exercised against a live model is control flow that is not tested.
 *
 * Run: `node --experimental-strip-types --test test/refine.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runRefined, passQuality, MIN_IMPROVEMENT } from '../src/refine.ts'
import type { RefineOptions } from '../src/refine.ts'
import { runLoop } from '../src/runner.ts'
import type { LoopRunResult, LoopEvent } from '../src/runner.ts'
import { phaseOf } from '../src/prompts.ts'
import type { LoopSpec } from '../src/spec.ts'

/** A spec that runs fast and never touches the network. */
function spec(overrides: Partial<LoopSpec> = {}): LoopSpec {
  return {
    goal: 'the verify command exits 0',
    sensor: ['files', 'test output'],
    controller: { ladder: [{ provider: 'xiaomi', model: 'mimo-v2.5' }] },
    actuator: { read_file: 'read' },
    feedback: 'verify exits 0',
    termination: { successCommand: 'true', guards: [] },
    maxSteps: 10,
    costBudgetUSD: 1,
    prices: { 'xiaomi/mimo-v2.5': { inputPerMTok: 1, outputPerMTok: 1 } },
    ...overrides,
  }
}

/** A canned pass result, with judge scores carried as transcript events. */
function passResult(overrides: Partial<LoopRunResult> & { scores?: number[] } = {}): LoopRunResult {
  const { scores = [], ...rest } = overrides
  const transcript: LoopEvent[] = scores.map((score, i) => ({ kind: 'judge', step: i + 1, score }))
  return {
    outcome: 'model-stop',
    steps: 4,
    spentUSD: 0.1,
    byRoute: {},
    reviews: 0,
    reviewFraction: 0,
    signals: [],
    stepLatencyMs: [120, 90, 140, 110],
    wallMs: 900,
    latencyKind: 'round-trip',
    transcript,
    lastAssistant: 'done',
    ...rest,
  }
}

/** Options with the mandatory loop fields filled in. */
function options(overrides: Partial<RefineOptions> = {}): RefineOptions {
  return {
    spec: spec(),
    phase: phaseOf('bugfix'),
    tools: [],
    llm: { complete: () => Promise.resolve({ content: 'done', toolCalls: [] }) },
    ...overrides,
  }
}

/** A runFn that replays canned passes and records the notices it received. */
function scriptedPasses(passes: LoopRunResult[]) {
  const queue = [...passes]
  const notices: (string | undefined)[] = []
  return {
    notices,
    runFn: (opts: { passNotice?: string }): Promise<LoopRunResult> => {
      notices.push(opts.passNotice)
      const next = queue.shift()
      return Promise.resolve(next ?? passResult())
    },
  }
}

test('a single pass without loops behaves exactly like runLoop', async () => {
  const canned = passResult({ outcome: 'goal-met' })
  const { runFn } = scriptedPasses([canned])
  const result = await runRefined(options({ runFn }))
  assert.equal(result.outcome, 'goal-met')
  assert.equal(result.passes, 1)
  assert.equal(result.stoppedEarly, false)
})

test('goal-met at quality stops refinement early', async () => {
  const good = passResult({ outcome: 'goal-met', scores: [3, 3], spentUSD: 0.2 })
  const worse = passResult({ outcome: 'goal-met', scores: [1], spentUSD: 0.9, steps: 9 })
  const { runFn, notices } = scriptedPasses([good, worse])
  const result = await runRefined(options({ loops: 5, runFn }))
  assert.equal(result.passes, 1)
  assert.equal(result.stoppedEarly, true)
  assert.match(result.stopReason, /met the goal/)
  // Never returns worse than best: the un-run second pass cannot displace it.
  assert.equal(result.spentUSD, 0.2)
  assert.equal(notices.length, 1)
  assert.equal(notices[0], undefined)
})

test('improvement below 0.05 stops refinement', async () => {
  const first = passResult({ outcome: 'model-stop', scores: [2], spentUSD: 0.1 })
  const second = passResult({ outcome: 'model-stop', scores: [2], spentUSD: 0.1 })
  const third = passResult({ outcome: 'goal-met', scores: [3], spentUSD: 0.1 })
  const { runFn } = scriptedPasses([first, second, third])
  const result = await runRefined(options({ loops: 5, runFn }))
  // 2.0 → 2.0 is a 0.00 improvement: grind, not progress. The goal-met third
  // pass must never run.
  assert.equal(result.passes, 2)
  assert.equal(result.stoppedEarly, true)
  assert.match(result.stopReason, new RegExp(String(MIN_IMPROVEMENT)))
})

test('improvement at or above 0.05 continues', async () => {
  const first = passResult({ outcome: 'model-stop', scores: [1], spentUSD: 0.1 })
  const second = passResult({ outcome: 'goal-met', scores: [3], spentUSD: 0.1 })
  const { runFn } = scriptedPasses([first, second])
  const result = await runRefined(options({ loops: 5, runFn }))
  assert.equal(result.outcome, 'goal-met')
  assert.equal(result.passes, 2)
})

test('best-pass selection: quality outranks cost', async () => {
  const highCost = passResult({ outcome: 'model-stop', scores: [3], spentUSD: 0.5, steps: 8 })
  const lowQuality = passResult({ outcome: 'model-stop', scores: [2.5], spentUSD: 0.2, steps: 8 })
  // 3.0 → 2.5 is a regression, not an improvement, so no stop rule fires and
  // both passes run; the winner must be the higher-quality pass despite its cost.
  const { runFn } = scriptedPasses([highCost, lowQuality])
  const result = await runRefined(options({ loops: 3, totalBudgetUSD: 10, runFn }))
  assert.equal(result.passes, 2)
  assert.equal(result.spentUSD, 0.5)
})

test('best-pass selection: cost breaks a quality tie', async () => {
  const expensive = passResult({ outcome: 'model-stop', scores: [2], spentUSD: 0.5, steps: 8 })
  const cheap = passResult({ outcome: 'model-stop', scores: [2], spentUSD: 0.2, steps: 8 })
  const { runFn } = scriptedPasses([expensive, cheap])
  // Identical quality: the < 0.05 rule fires after the second pass, and the
  // cheaper pass — which did run — wins the tie.
  const result = await runRefined(options({ loops: 3, totalBudgetUSD: 10, runFn }))
  assert.equal(result.passes, 2)
  assert.equal(result.stoppedEarly, true)
  assert.equal(result.spentUSD, 0.2)
})

test('a goal-met pass below the bar loses to a later goal-met pass above it', async () => {
  const belowBar = passResult({ outcome: 'goal-met', scores: [1], spentUSD: 0.1, steps: 3 })
  const aboveBar = passResult({ outcome: 'goal-met', scores: [3], spentUSD: 0.3, steps: 5 })
  // A goal-met pass below the quality bar does NOT stop: one more pass is
  // cheaper than shipping an artifact the judge disliked. The second pass
  // meets the bar and stops, and wins on quality.
  const { runFn } = scriptedPasses([belowBar, aboveBar])
  const result = await runRefined(options({ loops: 3, totalBudgetUSD: 10, runFn }))
  assert.equal(result.passes, 2)
  assert.equal(result.stoppedEarly, true)
  assert.equal(result.spentUSD, 0.3)
})

test('an aborted pass stops refinement and keeps the best so far', async () => {
  const first = passResult({ outcome: 'model-stop', scores: [2], spentUSD: 0.1 })
  const aborted = passResult({ outcome: 'aborted', spentUSD: 0.05 })
  const { runFn } = scriptedPasses([first, aborted])
  const result = await runRefined(options({ loops: 5, totalBudgetUSD: 10, runFn }))
  assert.equal(result.passes, 2)
  assert.equal(result.stoppedEarly, true)
  assert.match(result.stopReason, /aborted/)
  // The aborted pass must not be returned: its outcome is preserved in the
  // stop reason, but the result is the best pass's.
  assert.equal(result.outcome, 'model-stop')
})

test('refinement-budget exhaustion stops before an unfundable pass', async () => {
  const pricey = passResult({ outcome: 'model-stop', scores: [1], spentUSD: 0.4 })
  const { runFn, notices } = scriptedPasses([pricey, pricey, pricey])
  const result = await runRefined(options({ loops: 5, totalBudgetUSD: 0.5, runFn }))
  // Pass 1 spends 0.40; pass 2 would need ~0.40 more but only 0.10 remains.
  assert.equal(result.passes, 1)
  assert.equal(result.stoppedEarly, true)
  assert.match(result.stopReason, /budget exhausted/)
  assert.equal(notices.length, 1)
})

test('loops outside 3–10 fail loudly, naming the field', async () => {
  const { runFn } = scriptedPasses([])
  await assert.rejects(() => runRefined(options({ loops: 2, runFn })), /optimize\.loops/)
  await assert.rejects(() => runRefined(options({ loops: 11, runFn })), /optimize\.loops/)
})

test('pass evidence reaches the next pass as a notice', async () => {
  const first = passResult({ outcome: 'model-stop', scores: [1], spentUSD: 0.1 })
  const second = passResult({ outcome: 'goal-met', scores: [3], spentUSD: 0.1 })
  const { runFn, notices } = scriptedPasses([first, second])
  await runRefined(options({ loops: 3, runFn }))
  assert.equal(notices[0], undefined)
  assert.ok(notices[1]?.includes('pass 1'), 'the second pass opens with the first pass\u2019s evidence')
  assert.ok(notices[1]?.includes('$0.1000'), 'cost rides along')
})

test('passQuality averages judge scores and tolerates an unscored pass', () => {
  assert.equal(passQuality([{ kind: 'judge', step: 1, score: 1 }, { kind: 'judge', step: 2, score: 3 }]), 2)
  assert.equal(passQuality([{ kind: 'judge', step: 1, score: undefined }]), undefined)
  assert.equal(passQuality([]), undefined)
})

test('each pass appends one run record with the pass number and scores', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'refine-history-'))
  const historyPath = join(dir, 'runs.jsonl')
  const first = passResult({ outcome: 'model-stop', scores: [1], spentUSD: 0.1 })
  const second = passResult({ outcome: 'goal-met', scores: [3], spentUSD: 0.1 })
  const { runFn } = scriptedPasses([first, second])
  const result = await runRefined(options({ loops: 3, totalBudgetUSD: 10, historyPath, taskKey: 'task-1', runFn }))
  assert.equal(result.passes, 2)
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n')
  assert.equal(lines.length, 2)
  const records = lines.map(line => JSON.parse(line) as { pass: number, passes: number, taskKey: string, outcome: string, judgeScores: number[], qualityScore?: number })
  assert.equal(records[0]!.pass, 1)
  assert.equal(records[1]!.pass, 2)
  assert.equal(records[0]!.passes, 3)
  assert.equal(records[0]!.taskKey, 'task-1')
  assert.deepEqual(records[0]!.judgeScores, [1])
  assert.equal(records[1]!.outcome, 'goal-met')
  assert.equal(records[1]!.qualityScore, 3)
})

test('the runner returns the latency it measured on every step', async () => {
  // The record test above proves `refine` writes what it is handed; this proves
  // the runner HANDS it over. Reverting the result-boundary change leaves this
  // green and the record test green, and the axis empty again — so the boundary
  // needs its own assertion.
  const started = performance.now()
  const result = await runLoop({
    // The phase's prompt is part of the system prompt, so it is a required
    // option — a test that omits it exercises a TypeError, not the runner.
    phase: phaseOf('bugfix'),
    spec: {
      goal: 'Answer the prompt.',
      sensor: 'the transcript',
      controller: { ladder: [{ model: 'mock' }], stepsPerRung: 5, escalateAfterFailures: 2 },
      actuator: { echo: 'read' },
      feedback: 'the answer arrived',
      termination: { successCommand: 'true', guards: ['error-cascade'] },
      maxSteps: 3,
      costBudgetUSD: 1,
      // The pre-flight refuses a route it cannot price — a real spec declares
      // one, and a test that omits it is testing the refusal instead.
      prices: { 'default/mock': { inputPerMTok: 0.3, outputPerMTok: 1.2 } },
    },
    tools: [],
    llm: { complete: () => Promise.resolve({ content: 'done', toolCalls: [] }) },
  })
  assert.ok(result.stepLatencyMs.length > 0, 'the runner measured at least one step')
  assert.ok(result.stepLatencyMs.every(ms => ms >= 0), 'and every sample is a real duration')
  assert.equal(result.latencyKind, 'round-trip', 'the window it measured is the whole call')
  assert.ok((result.wallMs ?? -1) > 0, `wallMs is the run, not 0 (got ${String(result.wallMs)})`)
  assert.ok((result.wallMs ?? 0) >= started - started, 'and it is measured, not invented')
})

test('a pass record carries the latency the runner measured', async () => {
  // §1bt found the speed axis empty on every path. `runLoop` times every step
  // (`performance.now()` around each model call) and the whole run, and dropped
  // both at the result boundary — so `refine` had nothing but a literal to
  // write. One array reference and one number; this is the assertion that keeps
  // them from being dropped again.
  const dir = mkdtempSync(join(tmpdir(), 'refine-latency-'))
  const historyPath = join(dir, 'runs.jsonl')
  const { runFn } = scriptedPasses([passResult({
    outcome: 'goal-met',
    scores: [3],
    stepLatencyMs: [210, 180, 260],
    wallMs: 1500,
    latencyKind: 'round-trip',
  })])
  await runRefined(options({ loops: 3, totalBudgetUSD: 10, historyPath, taskKey: 'task-1', runFn }))
  const [line] = readFileSync(historyPath, 'utf8').trim().split('\n')
  const record = JSON.parse(line!) as {
    stepLatencyMs: number[], wallMs?: number, latencyKind?: string
  }
  assert.deepEqual(record.stepLatencyMs, [210, 180, 260], 'the measured steps, not an empty array')
  assert.equal(record.wallMs, 1500, 'the run total, not zero')
  assert.equal(record.latencyKind, 'round-trip')
})

test('a pass that spent money records it per route, not as an empty map', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'refine-byRoute-'))
  const historyPath = join(dir, 'runs.jsonl')
  const spent = passResult({
    outcome: 'goal-met',
    scores: [3],
    spentUSD: 0.2,
    byRoute: { 'onegw/execution': { steps: 4, usd: 0.2 } },
  })
  const { runFn } = scriptedPasses([spent])
  await runRefined(options({ loops: 3, totalBudgetUSD: 10, historyPath, taskKey: 'task-1', runFn }))
  const [line] = readFileSync(historyPath, 'utf8').trim().split('\n')
  const record = JSON.parse(line!) as { costUSD: number, byRoute: Record<string, { steps: number, usd: number }> }
  // The optimizer chooses a rung by reading exactly this field: an empty map
  // beside a real costUSD tells it every route is free, which is what every
  // demo-shaped run recorded until the ledger was read instead of a literal.
  assert.equal(record.costUSD, 0.2)
  assert.deepEqual(record.byRoute, { 'onegw/execution': { steps: 4, usd: 0.2 } })
})

test('no history file is written without both historyPath and taskKey', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'refine-nohistory-'))
  const historyPath = join(dir, 'runs.jsonl')
  const { runFn } = scriptedPasses([passResult({ outcome: 'goal-met', scores: [3] })])
  // taskKey omitted: the run must not create the file on its own.
  await runRefined(options({ loops: 3, historyPath, runFn }))
  assert.equal(existsSync(historyPath), false)
})
