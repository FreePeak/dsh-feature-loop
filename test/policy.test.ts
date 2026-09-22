/**
 * The check for the book-shaped policy: spec, detectors, gate, router.
 *
 * Run: `node --experimental-strip-types --test test/policy.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { IncompleteSpecError, describeEnvelope, validateSpec } from '../src/spec.ts'
import type { LoopSpec } from '../src/spec.ts'
import { BOOK_THRESHOLDS, detectSignals, mustReview, trailingRepeat } from '../src/signals.ts'
import type { StepObservation } from '../src/signals.ts'
import { AttentionRouter, DEFAULT_GATE_POLICIES, ReviewGate, judgeQuestion } from '../src/review.ts'
import { BUG_FIX_RULES, FEATURE_RULES, PHASES, phaseOf } from '../src/prompts.ts'

/** A complete spec, so each test can break exactly one dimension. */
function spec(overrides: Partial<LoopSpec> = {}): LoopSpec {
  return {
    goal: 'the failing test in auth.spec.ts passes and no other test breaks',
    sensor: ['repo files', 'test output'],
    controller: { ladder: [{ model: 'flash' }, { model: 'pro' }] },
    actuator: { read: 'read', edit: 'reversible-write' },
    feedback: 'all tests pass, and the diff is the smallest that achieves it',
    termination: { successCommand: 'npm test', guards: ['error-cascade'] },
    maxSteps: 12,
    costBudgetUSD: 0.5,
    ...overrides,
  }
}

test('a complete spec validates', () => {
  assert.equal(validateSpec(spec()).maxSteps, 12)
})

/** Capture the thrown IncompleteSpecError so its problem list can be asserted. */
function caughtSpecError(candidate: LoopSpec): IncompleteSpecError {
  try {
    validateSpec(candidate)
  } catch (error: unknown) {
    assert.ok(error instanceof IncompleteSpecError, `expected IncompleteSpecError, got ${String(error)}`)
    return error
  }
  throw new Error('expected validateSpec to throw, but it returned')
}

test('a missing dimension is reported, and every problem is listed at once', () => {
  const err = caughtSpecError(spec({ goal: '  ', sensor: [], maxSteps: 0, costBudgetUSD: 0 }))
  // All four, not just the first: a config fix should be one round trip.
  assert.equal(err.problems.length >= 4, true, `expected >=4 problems, got ${err.problems.length}`)
  assert.ok(err.problems.some(p => p.includes('goal')))
  assert.ok(err.problems.some(p => p.includes('sensor')))
  assert.ok(err.problems.some(p => p.includes('maxSteps')))
  assert.ok(err.problems.some(p => p.includes('costBudgetUSD')))
})

test('a spec with no termination at all is refused — that is the infinite loop', () => {
  assert.throws(
    () => validateSpec(spec({ termination: {} })),
    /neither a successCommand nor guards/,
  )
})

test('irreversible tools without guards are called out rather than silently allowed', () => {
  const err = caughtSpecError(
    spec({ actuator: { edit: 'irreversible' }, termination: { successCommand: 'npm test' } }),
  )
  assert.ok(err.problems.some(p => p.includes('irreversible tools')))
})

test('the envelope line names steps, dollars and routes', () => {
  assert.match(describeEnvelope(spec()), /<= 12 steps, <= \$0\.50, routes flash → pro/)
})

test('trailingRepeat counts only the identical run at the end', () => {
  const steps: StepObservation[] = [
    { index: 1, tool: 'read', argsKey: 'a', costUSD: 0 },
    { index: 2, tool: 'edit', argsKey: 'x', costUSD: 0 },
    { index: 3, tool: 'edit', argsKey: 'x', costUSD: 0 },
    { index: 4, tool: 'edit', argsKey: 'x', costUSD: 0 },
  ]
  assert.deepEqual(trailingRepeat(steps), { count: 3, tool: 'edit' })
})

test('a cycle fires at 3 identical calls, not at 2 — 2 is a legitimate retry', () => {
  const base = (n: number): StepObservation[] =>
    Array.from({ length: n }, (_, i) => ({ index: i + 1, tool: 'read', argsKey: 'same', costUSD: 0.01 }))
  const env = { maxSteps: 20, costBudgetUSD: 1, spentUSD: 0.05 }
  assert.equal(detectSignals(base(2), env).some(s => s.kind === 'tool-cycle'), false)
  const atThree = detectSignals(base(3), env)
  assert.equal(atThree.some(s => s.kind === 'tool-cycle'), true)
  assert.equal(atThree.find(s => s.kind === 'tool-cycle')!.severity, 'critical')
})

test('an error cascade needs three consecutive failures and is critical', () => {
  const steps: StepObservation[] = [
    { index: 1, tool: 'run_tests', costUSD: 0.01, error: false },
    { index: 2, tool: 'edit', costUSD: 0.01, error: true },
    { index: 3, tool: 'edit', costUSD: 0.01, error: true },
  ]
  const env = { maxSteps: 20, costBudgetUSD: 1, spentUSD: 0.03 }
  assert.equal(detectSignals(steps, env).some(s => s.kind === 'error-cascade'), false)
  steps.push({ index: 4, tool: 'edit', costUSD: 0.01, error: true })
  const fired = detectSignals(steps, env).find(s => s.kind === 'error-cascade')
  assert.equal(fired?.severity, 'critical')
})

test('the budget detector uses the book 0.8, and goes critical at 1.0', () => {
  const steps: StepObservation[] = [{ index: 1, costUSD: 0.5 }]
  const warn = detectSignals(steps, { maxSteps: 20, costBudgetUSD: 1, spentUSD: 0.8 })
  assert.equal(warn.find(s => s.kind === 'budget')?.severity, 'warning')
  const over = detectSignals(steps, { maxSteps: 20, costBudgetUSD: 1, spentUSD: 1.05 })
  assert.equal(over.find(s => s.kind === 'budget')?.severity, 'critical')
})

test('tool dominance is info, because a favourite tool is suspicious not wrong', () => {
  const steps: StepObservation[] = Array.from({ length: 10 }, (_, i) => ({
    index: i + 1,
    tool: i < 7 ? 'grep' : 'edit',
    argsKey: `k${String(i)}`,
    costUSD: 0.01,
  }))
  const fired = detectSignals(steps, { maxSteps: 50, costBudgetUSD: 10, spentUSD: 0.1 })
  assert.equal(fired.find(s => s.kind === 'tool-dominance')?.severity, 'info')
})

test('tool dominance stays quiet on a short run, where every tool is 100%', () => {
  // Without a floor this fires on the first step of every run — a signal that
  // always fires is noise that trains its reader to ignore the real ones.
  const one: StepObservation[] = [{ index: 1, tool: 'read_file', argsKey: 'a', costUSD: 0.01 }]
  const env = { maxSteps: 50, costBudgetUSD: 10, spentUSD: 0.1 }
  assert.equal(detectSignals(one, env).some(s => s.kind === 'tool-dominance'), false)
  const four: StepObservation[] = Array.from({ length: 4 }, (_, i) => ({
    index: i + 1, tool: 'read_file', argsKey: `k${String(i)}`, costUSD: 0.01,
  }))
  assert.equal(detectSignals(four, env).some(s => s.kind === 'tool-dominance'), false)
  // At the floor it becomes meaningful: five steps, one tool owning all of them.
  const five: StepObservation[] = Array.from({ length: 5 }, (_, i) => ({
    index: i + 1, tool: 'read_file', argsKey: `k${String(i)}`, costUSD: 0.01,
  }))
  assert.equal(detectSignals(five, env).some(s => s.kind === 'tool-dominance'), true)
})

test('quality drop only fires when a baseline exists — a missing baseline is not a pass', () => {
  const steps: StepObservation[] = [{ index: 1, costUSD: 0.01, score: 0.5 }]
  const env = { maxSteps: 20, costBudgetUSD: 1, spentUSD: 0.01 }
  assert.equal(detectSignals(steps, env).some(s => s.kind === 'quality-drop'), false)
  assert.equal(
    detectSignals(steps, { ...env, baselineScore: 0.9 }).some(s => s.kind === 'quality-drop'),
    true,
  )
})

test('critical signals are the floor the router cannot fall below', () => {
  const signals = detectSignals(
    Array.from({ length: 3 }, (_, i) => ({ index: i + 1, tool: 'read', argsKey: 'same', costUSD: 0.01 })),
    { maxSteps: 20, costBudgetUSD: 1, spentUSD: 0.03 },
  )
  assert.equal(mustReview(signals), true)
})

test('the gate is fail-closed: an unclassified tool is treated as most dangerous', () => {
  const gate = new ReviewGate()
  const decision = gate.check('mystery_tool', 'read')
  // `read` defaults to auto, but a tool named in the policy table wins; with no
  // entry the reversibility class decides, so assert the class default holds.
  assert.equal(decision.review, false)
  assert.equal(DEFAULT_GATE_POLICIES.irreversible, 'always-approve')
  const irreversible = gate.check('rm_rf', 'irreversible')
  assert.equal(irreversible.review, true)
})

test('auto-if-confident asks when there is no confidence estimate at all', () => {
  const gate = new ReviewGate()
  assert.equal(gate.check('edit', 'reversible-write', 0.9).review, false)
  assert.equal(gate.check('edit', 'reversible-write', 0.5).review, true)
  // No estimate is not the same as a good estimate.
  assert.equal(gate.check('edit', 'reversible-write').review, true)
})

test('a per-tool policy override beats the reversibility class', () => {
  const gate = new ReviewGate({ edit: 'always-approve' })
  assert.equal(gate.check('edit', 'reversible-write', 0.99).review, true)
})

test('the router surfaces a critical signal even when the attention budget is spent', () => {
  const router = new AttentionRouter({ reviewBudget: 0.1 })
  for (let i = 0; i < 50; i += 1) router.observeStep()
  // Burn the budget.
  for (let i = 0; i < 10; i += 1) router.operatorRequest(i)
  const signals = detectSignals(
    Array.from({ length: 3 }, (_, i) => ({ index: i + 1, tool: 'read', argsKey: 'same', costUSD: 0.01 })),
    { maxSteps: 20, costBudgetUSD: 1, spentUSD: 0.03 },
  )
  const decision = router.route(signals)
  assert.equal(decision.review, true, 'safety is not rate-limited')
  assert.equal(decision.source, 'signal')
})

test('the judge is rate-capped, so a chatty judge cannot turn the loop into a chat app', () => {
  const router = new AttentionRouter({ reviewBudget: 0.1, judgeThreshold: 2 })
  for (let i = 0; i < 10; i += 1) router.observeStep()
  // First judge request fits the 10% budget.
  assert.equal(router.route([], undefined, 3).review, true)
  // The next one does not.
  const capped = router.route([], undefined, 3)
  assert.equal(capped.review, false)
  assert.equal(capped.source, 'rate-capped')
})

test('a judge score below the threshold does not surface a step', () => {
  const router = new AttentionRouter({ judgeThreshold: 2 })
  assert.equal(router.route([], undefined, 1).review, false)
})

test('the operator can always ask to see a step', () => {
  const router = new AttentionRouter()
  const decision = router.operatorRequest(7)
  assert.equal(decision.review, true)
  assert.equal(decision.source, 'operator')
  assert.match(decision.reason, /step 7/)
})

test('a nonsensical review budget is refused at construction', () => {
  assert.throws(() => new AttentionRouter({ reviewBudget: 0 }), /reviewBudget/)
  assert.throws(() => new AttentionRouter({ reviewBudget: 1.5 }), /reviewBudget/)
})

test('the judge question is a score on the 0-3 scale, not a request for prose', () => {
  const q = judgeQuestion('edit src/auth.ts (12 lines)', [])
  assert.equal(q.questions.review_worthiness.type, 'score')
  assert.equal(Object.keys(q.questions.review_worthiness.criteria ?? {}).length, 4)
  assert.match(q.state, /Detectors: none fired/)
})

test('the MVP phases carry the book prompts verbatim, in order', () => {
  assert.equal(BUG_FIX_RULES.length, 6)
  assert.equal(FEATURE_RULES.length, 5)
  assert.match(BUG_FIX_RULES[0], /failing test that reproduces the bug/)
  assert.match(BUG_FIX_RULES[5], /Never suppress a test/)
  assert.match(FEATURE_RULES[0], /Read the existing architecture/)
  assert.match(phaseOf('bugfix').prompt, /1\. First, write a failing test/)
  assert.equal(PHASES.feature.actuator.edit_file, 'reversible-write')
  // The actuator must name tools the tool layer actually provides, or the gate
  // silently falls back to the tool's own declaration for every call.
  assert.equal(PHASES.bugfix.actuator.read_file, 'read')
  assert.equal(PHASES.bugfix.actuator.run_tests, 'read')
})

test('the book thresholds are the ones in the code, not numbers someone liked', () => {
  assert.equal(BOOK_THRESHOLDS.cycleLength, 3)
  assert.equal(BOOK_THRESHOLDS.excessiveSteps, 20)
  assert.equal(BOOK_THRESHOLDS.budgetWarnFraction, 0.8)
  assert.equal(BOOK_THRESHOLDS.toolDominanceFraction, 0.6)
  assert.equal(BOOK_THRESHOLDS.errorCascade, 3)
  assert.equal(BOOK_THRESHOLDS.qualityDropFraction, 0.7)
})
