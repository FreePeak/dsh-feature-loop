/**
 * The check for the optimizer: the typed battery, and every fail-toward-no-advice
 * rule that keeps a non-autoregressive judge from ever producing bad advice.
 *
 * No network, no model, no real gateway: a scripted fake satisfies the `Judge`
 * interface and queues canned answers, so each assertion pins one rule from the
 * module's contract — deterministic recommendations, latch/outage → empty plus
 * a reason, out-of-range scores rejected (never clamped), choice/noul failures
 * dropped while score questions continue, unconfident answers sorted last,
 * cost levers suppressed off an un-metered run, and the state prompt's stated
 * word bound.
 *
 * Run: `node --experimental-strip-types --test test/optimizer.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import type { Judge, JudgeResult, SystemOneAnswer, SystemOneQuestion } from '../src/laya.ts'
import { NO_JUDGE } from '../src/laya.ts'
import type { RunRecord } from '../src/runlog.ts'
import {
  OPTIMIZER_STATE_WORD_LIMIT,
  buildOptimizerState,
  proposeOptimizations,
} from '../src/optimizer.ts'

/** One scripted turn: an answer, a resolved error, or a throw. */
type Scripted =
  | { answer: SystemOneAnswer }
  | { error: string }
  | { throws: string }

/**
 * A fake `Judge` that dequeues one canned reply per call.
 *
 * It records the call count and every question key it was asked, so tests can
 * assert not just what came back but what was (and was never) asked — e.g. that
 * suppressed cost levers cost zero round-trips.
 */
function scriptedJudge(script: readonly Scripted[]): Judge & { calls: number; keys: string[][] } {
  const queue = [...script]
  const judge = {
    calls: 0,
    keys: [] as string[][],
    async score(_state: string, questions: Record<string, SystemOneQuestion>) {
      judge.calls += 1
      judge.keys.push(Object.keys(questions))
      const item = queue.shift()
      if (item === undefined) throw new Error('scripted judge: queue is empty')
      if ('throws' in item) throw new Error(item.throws)
      if ('error' in item) return { score: undefined, error: item.error }
      const answer = item.answer
      // `JudgeResult` carries every field a live answer may hold; the fake
      // passes them through verbatim so each assertion pins what `readAnswer`
      // does with a real shape, not a narrowed one.
      const out: JudgeResult = { score: answer.score }
      if (answer.probability !== undefined) out.probability = answer.probability
      if (answer.choice !== undefined) out.choice = answer.choice
      if (answer.confidence !== undefined) out.confidence = answer.confidence
      return out
    },
  }
  return judge as Judge & { calls: number, keys: string[][] }
}

function runRecord(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    runId: 'run-1',
    startedAt: 1,
    endedAt: 2,
    pass: 1,
    passes: 1,
    taskKey: 'task',
    outcome: 'goal-met',
    steps: 5,
    maxSteps: 10,
    costUSD: 0.1,
    budgetUSD: 1,
    unpricedSteps: 0,
    byRoute: { 'xiaomi/mimo-v2.5': { steps: 5, usd: 0.1 } },
    stepLatencyMs: [100, 200, 300],
    wallMs: 1000,
    latencyKind: 'round-trip',
    signals: [],
    judgeScores: [0, 1],
    reviewFraction: 0.1,
    qualityScore: 2,
    specFingerprint: 'abc123',
    ...overrides,
  }
}

/** Two rungs so the ladder lever has somewhere to move; the rest: book defaults. */
const SPEC = {
  maxSteps: 6,
  costBudgetUSD: 1,
  controller: {
    ladder: [{ model: 'cheap-1' }, { model: 'strong-1' }],
    stepsPerRung: 0,
    escalateAfterFailures: 3,
  },
}

const RECORDS = [runRecord()]

/** Battery order, asserted explicitly: it is the tie order for the sort. */
const BATTERY_ORDER = [
  'ladder-rung',
  'max-tokens',
  'prompt-cache',
  'step-ceiling',
  'escalation',
  'attention-budget',
  'tool-result-size',
]

// Seven answers, confidence descending in battery order, so a correct
// sort returns exactly battery order — any reordering is a bug.
const FULL_SCRIPT: Scripted[] = [
  { answer: { choice: 'downgrade', confidence: 0.97 } },
  { answer: { score: 3, confidence: 0.96 } },
  { answer: { probability: 0.9, confidence: 0.95 } },
  { answer: { score: 2, confidence: 0.94 } },
  { answer: { score: 3, confidence: 0.93 } },
  { answer: { score: 0, confidence: 0.92 } },
  { answer: { score: 2, confidence: 0.91 } },
]

test('seven questions, one per lever, in declared order, one recommendation each', async () => {
  const judge = scriptedJudge(FULL_SCRIPT)
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  assert.equal(unavailable, undefined)
  assert.equal(judge.calls, 7)
  assert.deepEqual(judge.keys.map(keys => keys[0]), BATTERY_ORDER)
  assert.deepEqual(recommendations.map(r => r.lever), BATTERY_ORDER)

  const byLever = new Map(recommendations.map(r => [r.lever, r]))
  const ladder = byLever.get('ladder-rung')!
  assert.equal(ladder.questionType, 'choice')
  assert.match(ladder.current, /cheap-1 → strong-1/)
  assert.match(ladder.current, /xiaomi\/mimo-v2\.5/)
  assert.match(ladder.proposed, /maxRung to 0/)
  assert.equal(ladder.confidence, 0.97)

  const tokens = byLever.get('max-tokens')!
  assert.equal(tokens.questionType, 'score')
  assert.match(tokens.proposed, /4096 → 1024/) // verbosity 3 = two bands down

  const cache = byLever.get('prompt-cache')!
  assert.equal(cache.questionType, 'noul')
  assert.match(cache.proposed, /caching/) // P(yes) = 0.9 → the prefix reads stable

  const ceiling = byLever.get('step-ceiling')!
  assert.match(ceiling.current, /maxSteps=6/)
  assert.match(ceiling.proposed, /6 → 7/) // grinding 2 = one step up, in the band

  const escalation = byLever.get('escalation')!
  assert.match(escalation.proposed, /escalate sooner/)
  assert.match(escalation.proposed, /escalateAfterFailures 3 → 1/)

  const attention = byLever.get('attention-budget')!
  assert.match(attention.proposed, /reviewBudget 0\.1 → 0\.05/)
  assert.match(attention.proposed, /judgeThreshold 2 → 3/)

  const tool = byLever.get('tool-result-size')!
  assert.match(tool.proposed, /10000/) // halve the 20 000-byte tools.ts default

  for (const rec of recommendations) {
    assert.ok(rec.evidence.length > 0, `${rec.lever} needs evidence`)
    assert.ok(rec.current.length > 0, `${rec.lever} needs a current value`)
  }
})

test('a healthy answer earns no advice: keep/right-sized questions are dropped', async () => {
  const judge = scriptedJudge([
    { answer: { choice: 'keep', confidence: 0.9 } }, // ladder fine
    { answer: { score: 1, confidence: 0.9 } }, // verbosity fine
    { answer: { probability: 0.9, confidence: 0.9 } }, // cache fine — still a rec
    { answer: { score: 1, confidence: 0.9 } }, // ceiling fine
    { answer: { score: 2, confidence: 0.9 } }, // escalation fine
    { answer: { score: 2, confidence: 0.9 } }, // attention fine
    { answer: { score: 1, confidence: 0.9 } }, // tool results fine
  ])
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  assert.equal(unavailable, undefined, 'advice-free is not an outage')
  assert.deepEqual(recommendations.map(r => r.lever), ['prompt-cache'])
})

test('NO_JUDGE: every question errors → empty array with the reason', async () => {
  const { recommendations, unavailable } = await proposeOptimizations(NO_JUDGE, RECORDS, SPEC)
  assert.deepEqual(recommendations, [])
  assert.match(unavailable ?? '', /no judge configured/)
})

test('a latched judge answers nothing and is never asked', async () => {
  const judge = Object.assign(scriptedJudge([]), {
    disabledReason: () => 'onegw /v1/systemone returned 503',
  })
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  assert.deepEqual(recommendations, [])
  assert.match(unavailable ?? '', /latched off/)
  assert.match(unavailable ?? '', /503/)
  assert.equal(judge.calls, 0, 'the latch is read before a single call is spent')
})

test('a throwing judge fails toward no advice, not partial advice', async () => {
  const judge = scriptedJudge([{ throws: 'socket hang up' }])
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  assert.deepEqual(recommendations, [])
  assert.match(unavailable ?? '', /judge threw/)
  assert.match(unavailable ?? '', /socket hang up/)
  assert.equal(judge.calls, 1, 'one failure ends the battery')
})

test('an out-of-range score is REJECTED — never clamped — and the rest still return', async () => {
  const judge = scriptedJudge([
    { error: 'choice primitive failed' },
    { answer: { score: 7, confidence: 0.9 } }, // 7 is not a level this scale has
    { answer: { probability: 0.9, confidence: 0.87 } },
    { answer: { score: 2, confidence: 0.86 } },
    { answer: { score: 3, confidence: 0.85 } },
    { answer: { score: 0, confidence: 0.84 } },
    { answer: { score: 3, confidence: 0.83 } },
  ])
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  const levers = recommendations.map(r => r.lever)
  // Clamping would have turned that 7 into a confident "tighten two bands";
  // instead max-tokens is absent entirely...
  assert.ok(!levers.includes('max-tokens'), `rejected, not clamped; got ${levers.join(', ')}`)
  assert.equal(unavailable, undefined, 'other questions answered — this is not an outage')
  // ...while every other answered lever is still returned.
  for (const lever of ['prompt-cache', 'step-ceiling', 'escalation', 'attention-budget', 'tool-result-size']) {
    assert.ok(levers.includes(lever), `expected ${lever} in ${levers.join(', ')}`)
  }
  assert.ok(!levers.includes('ladder-rung'), 'that question errored and was dropped')
})

test('a failing choice/noul call drops only that question; score questions still answer', async () => {
  // The error strings are historical: choice/noul now answer live (verified
  // 2026-09-23), but a future engine that fails one primitive must still not
  // take the other six down — so the drop-and-continue rule keeps its test.
  const judge = scriptedJudge([
    { error: 'choice primitive failed' },
    { answer: { score: 0, confidence: 0.9 } },
    { error: 'noul primitive failed' },
    { answer: { score: 3, confidence: 0.8 } },
    { answer: { score: 3, confidence: 0.7 } },
    { answer: { score: 3, confidence: 0.6 } },
    { answer: { score: 3, confidence: 0.5 } },
  ])
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  const levers = recommendations.map(r => r.lever)
  assert.equal(judge.calls, 7, 'every question is still asked — one primitive failing is not the judge failing')
  assert.ok(!levers.includes('ladder-rung'))
  assert.ok(!levers.includes('prompt-cache'))
  for (const lever of ['max-tokens', 'step-ceiling', 'escalation', 'attention-budget', 'tool-result-size']) {
    assert.ok(levers.includes(lever), `expected ${lever} in ${levers.join(', ')}`)
  }
  assert.equal(recommendations.length, 5)
  assert.equal(unavailable, undefined, 'partial answers are recommendations, not an outage')
})

test('answers without confidence sort last and say so in their evidence', async () => {
  const judge = scriptedJudge([
    { answer: { choice: 'downgrade' } }, // no confidence
    { answer: { score: 3 } }, // no confidence
    { answer: { probability: 0.9, confidence: 0.95 } },
    { answer: { score: 3 } }, // no confidence
    { answer: { score: 3, confidence: 0.6 } },
    { answer: { score: 3 } }, // no confidence
    { answer: { score: 3 } }, // no confidence
  ])
  const { recommendations } = await proposeOptimizations(judge, RECORDS, SPEC)
  assert.equal(recommendations.length, 7)
  // The two confident answers lead, ordered by their confidence.
  assert.deepEqual(recommendations.slice(0, 2).map(r => [r.lever, r.confidence]), [
    ['prompt-cache', 0.95],
    ['escalation', 0.6],
  ])
  // Everything without a reported confidence is after everything with one...
  const pattern = recommendations.map(r => r.confidence !== undefined)
  assert.deepEqual(pattern, [true, true, false, false, false, false, false])
  // ...and marked as low-confidence rather than left silently bare.
  for (const rec of recommendations.slice(2)) {
    assert.equal(rec.confidence, undefined)
    assert.match(rec.evidence, /low confidence: the engine reported none/)
  }
  // Within the unconfident block, the battery order is preserved (stable sort).
  assert.deepEqual(recommendations.slice(2).map(r => r.lever), [
    'ladder-rung',
    'max-tokens',
    'step-ceiling',
    'attention-budget',
    'tool-result-size',
  ])
})

test('any unpriced step suppresses every cost lever — and they are never even asked', async () => {
  const judge = scriptedJudge([
    // Only the four non-cost questions are asked, in battery order.
    { answer: { probability: 0.9, confidence: 0.9 } },
    { answer: { score: 2, confidence: 0.8 } },
    { answer: { score: 3, confidence: 0.7 } },
    { answer: { score: 3, confidence: 0.6 } },
  ])
  const { recommendations, unavailable } = await proposeOptimizations(judge, [runRecord({ unpricedSteps: 3 })], SPEC)
  assert.equal(judge.calls, 4, 'cost questions are filtered out before asking')
  assert.deepEqual(judge.keys.map(keys => keys[0]), [
    'prompt-cache',
    'step-ceiling',
    'escalation',
    'attention-budget',
  ])
  const levers = recommendations.map(r => r.lever)
  for (const costLever of ['ladder-rung', 'max-tokens', 'tool-result-size']) {
    assert.ok(!levers.includes(costLever), `cost lever ${costLever} must be suppressed`)
  }
  assert.equal(levers.length, 4, 'the quality/speed levers are unaffected')
  // The suppression reason is written into the output, not swallowed.
  assert.match(unavailable ?? '', /suppressed/)
  assert.match(unavailable ?? '', /unpriced/)
})

test('one fully priced record is not enough to hide the meter: zero unpriced → no suppression', async () => {
  const judge = scriptedJudge(FULL_SCRIPT)
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  assert.equal(unavailable, undefined)
  assert.equal(recommendations.length, 7)
})

test('buildOptimizerState names every axis, calls itself a prompt, and reports the worst one', () => {
  const state = buildOptimizerState(RECORDS, SPEC)
  assert.match(state, /a PROMPT for the judge, not a log/)
  assert.match(state, /cost:/)
  assert.match(state, /steps:/)
  assert.match(state, /judge:/)
  assert.match(state, /signals:/)
  assert.match(state, /speed:/)
  // judgeScores are [0, 1] → quality deficit 1 − 0.5/3 ≈ 0.83 dominates.
  assert.match(state, /worst axis: quality/)
  assert.match(state, /axis fractions: cost/)
  assert.match(state, /unpriced steps 0/)
})

test('an empty history stays inside the stated word bound and says unknown, not calm', () => {
  const state = buildOptimizerState([], SPEC)
  assert.ok(
    state.split(/\s+/).filter(Boolean).length <= OPTIMIZER_STATE_WORD_LIMIT,
    'empty state must respect the bound too',
  )
  assert.match(state, /runs: none recorded/)
  assert.match(state, /unknown, not calm/)
  assert.match(state, /worst axis: unknown/)
})

test('buildOptimizerState stays under the stated word bound on a fat history', () => {
  // Fat where a real log gets fat: long route names, many signal kinds, many
  // runs — the deliberate pad/truncate must hold regardless.
  const routes: Record<string, { steps: number; usd: number }> = {}
  for (let i = 0; i < 40; i += 1) {
    routes[`provider model tier variant number ${String(i)} with a deliberately long name`] = { steps: i + 1, usd: 0.01 }
  }
  const records = Array.from({ length: 50 }, (_, i) => runRecord({
    runId: `run-${String(i)}`,
    byRoute: routes,
    signals: Array.from({ length: 12 }, (_, k) => ({
      kind: `detector kind number ${String(k)} with extra words to fatten the summary`,
      severity: k % 3 === 0 ? 'critical' : 'warning',
    })),
    judgeScores: [0, 1, 2, 3, 1, 2],
    stepLatencyMs: Array.from({ length: 40 }, (_, k) => k * 37),
  }))
  const state = buildOptimizerState(records, SPEC)
  const words = state.split(/\s+/).filter(Boolean).length
  assert.ok(words <= OPTIMIZER_STATE_WORD_LIMIT, `expected ≤ ${String(OPTIMIZER_STATE_WORD_LIMIT)} words, got ${String(words)}`)
  assert.match(state, /worst axis/, 'truncation must keep the worst-axis line — it is the point of the prompt')
})

test('unpriced steps in the state are flagged loudly, not averaged away', () => {
  const state = buildOptimizerState([runRecord({ unpricedSteps: 5 })], SPEC)
  assert.match(state, /WARNING: unpriced steps/)
  assert.match(state, /unpriced steps 5/)
  assert.match(state, /suppressed rather than believed/)
})

test('an in-range float score rounds to the nearest level — verified live against Laya', async () => {
  // Live Laya answers score questions with expected levels (0.89, 1.41…), not
  // integers. Rounding is NOT clamping: the value already lies on the 0–3
  // scale, and the nearest level is what the rubric means by it. Out-of-range
  // stays rejected (see the score-7 test above); this is the in-band half.
  const judge = scriptedJudge([
    { error: 'choice not asked here' },
    { answer: { score: 0.89, confidence: 0.9 } }, // → 1: right-sized, skipped
    { answer: { probability: 0.9, confidence: 0.87 } },
    { answer: { score: 2.4, confidence: 0.86 } }, // → 2: proposes
    { answer: { score: 3, confidence: 0.85 } },
    { answer: { score: 0, confidence: 0.84 } },
    { answer: { score: 3, confidence: 0.83 } },
  ])
  const { recommendations, unavailable } = await proposeOptimizations(judge, RECORDS, SPEC)
  const levers = recommendations.map(r => r.lever)
  // 0.89 rounds to 1 (right-sized → skip); 2.4 rounds to 2 (grinding → propose).
  assert.ok(!levers.includes('max-tokens'), `0.89 → 1 is right-sized, skipped; got ${levers.join(', ')}`)
  assert.ok(levers.includes('step-ceiling'), `2.4 → 2 proposes; got ${levers.join(', ')}`)
  assert.equal(unavailable, undefined)
})
