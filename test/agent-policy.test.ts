/**
 * The check for the plugin agent's policy decisions.
 *
 * These functions live in `agent-policy.ts` precisely so this file can exist.
 * `agent.ts` cannot be imported by a test at all — it inherits upstream's
 * constructor parameter properties, which `--experimental-strip-types` rejects —
 * so logic left inside it is logic nothing checks. Extracting the branchy parts
 * is what turns "the plugin wiring compiles" into "the plugin wiring behaves".
 *
 * The cases that matter most are the fail-closed ones: an unclassified tool, and
 * a missing judge score. Both must produce a review request, never a silent
 * proceed.
 *
 * Run: `node --experimental-strip-types --test test/agent-policy.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import {
  argsKeyOf,
  canonicalArgs,
  gateDecisionFor,
  noteToolOutcomes,
  prepareReview,
  resolveReversibility,
  summarizeStep,
} from '../src/agent-policy.ts'
import { ReviewGate } from '../src/review.ts'
import type { StepObservation } from '../src/signals.ts'

/** A step history that has just started. */
function history(...steps: Partial<StepObservation>[]): StepObservation[] {
  return steps.map((step, i) => ({ index: i + 1, costUSD: 0.001, ...step }))
}

test('canonicalArgs ignores key order', () => {
  assert.equal(canonicalArgs({ a: 1, b: 2 }), canonicalArgs({ b: 2, a: 1 }))
  assert.notEqual(canonicalArgs({ a: 1 }), canonicalArgs({ a: 2 }))
})

test('canonicalArgs sorts keys at every depth, not just the top', () => {
  const left = canonicalArgs({ outer: { b: 1, a: 2 } })
  const right = canonicalArgs({ outer: { a: 2, b: 1 } })
  assert.equal(left, right)
})

test('canonicalArgs survives a value JSON cannot represent', () => {
  // A circular argument object would throw inside JSON.stringify. Falling back to
  // String() keeps the call in the history instead of losing it.
  const circular: Record<string, unknown> = { a: 1 }
  circular.self = circular
  assert.equal(typeof canonicalArgs(circular), 'string')
})

test('argsKeyOf treats reordered JSON as the same call', () => {
  assert.equal(argsKeyOf('{"a":1,"b":2}'), argsKeyOf('{"b":2,"a":1}'))
})

test('argsKeyOf returns the RAW text for unparseable arguments, not empty', () => {
  // Returning '' would make two *different* malformed calls compare equal, and a
  // tool that kept emitting bad JSON would raise a false tool-cycle.
  const first = argsKeyOf('{not json A')
  const second = argsKeyOf('{not json B')
  assert.notEqual(first, second)
  assert.equal(first, '{not json A')
  // But two *identical* malformed calls still match, which is the real cycle.
  assert.equal(argsKeyOf('{not json A'), argsKeyOf('{not json A'))
})

test('argsKeyOf maps absent and empty arguments to one key', () => {
  assert.equal(argsKeyOf(undefined), '')
  assert.equal(argsKeyOf(''), '')
  assert.equal(argsKeyOf('   '), '')
})

test('argsKeyOf keeps a non-object payload as raw text', () => {
  // `[1,2]` and `"x"` are valid JSON but not valid tool arguments; they still
  // need a stable identity.
  assert.equal(argsKeyOf('[1,2]'), '[1,2]')
  assert.equal(argsKeyOf('"x"'), '"x"')
})

test('summarizeStep says the run just started rather than inventing a step', () => {
  assert.match(summarizeStep([]), /just started/)
})

test('summarizeStep reports success and failure distinctly', () => {
  assert.match(summarizeStep(history({ tool: 'read_file' })), /read_file and succeeded/)
  assert.match(summarizeStep(history({ tool: 'edit_file', error: true })), /edit_file and failed/)
})

test('summarizeStep copes with a step that called no tool', () => {
  assert.match(summarizeStep(history({})), /no tool/)
})

test('prepareReview asks the judge when the attention budget has room', () => {
  const prepared = prepareReview({
    history: [], maxSteps: 10, costBudgetUSD: 1, spentUSD: 0, budgetRemaining: true,
  })
  assert.equal(prepared.signals.length, 0)
  assert.equal(prepared.askJudge, true, 'a quiet step is exactly what the judge is for')
})

test('prepareReview still asks when the budget is spent but a detector fired', () => {
  const prepared = prepareReview({
    // Three identical calls: a critical tool-cycle.
    history: history(
      { tool: 'read_file', argsKey: 'same' },
      { tool: 'read_file', argsKey: 'same' },
      { tool: 'read_file', argsKey: 'same' },
    ),
    maxSteps: 10, costBudgetUSD: 1, spentUSD: 0, budgetRemaining: false,
  })
  assert.equal(prepared.signals.some(s => s.kind === 'tool-cycle'), true)
  assert.equal(prepared.askJudge, true, 'a critical signal is a reason on its own')
})

test('prepareReview does not ask when nothing fired and there is no budget', () => {
  const prepared = prepareReview({
    history: history({ tool: 'read_file', argsKey: 'a' }),
    maxSteps: 10, costBudgetUSD: 1, spentUSD: 0, budgetRemaining: false,
  })
  assert.equal(prepared.signals.length, 0)
  assert.equal(prepared.askJudge, false, 'no reason to spend a judge call')
})

test('prepareReview carries the budget ceiling into the detectors', () => {
  const prepared = prepareReview({
    history: history({ tool: 'read_file', argsKey: 'a' }),
    maxSteps: 10, costBudgetUSD: 1, spentUSD: 0.9, budgetRemaining: true,
  })
  const budget = prepared.signals.find(s => s.kind === 'budget')
  assert.ok(budget !== undefined, '90% of the budget must raise the 0.8 warning')
  assert.equal(budget.severity, 'warning')
})

test('the spec actuator wins when it names the tool', () => {
  assert.equal(resolveReversibility('read_file', { read_file: 'read' }), 'read')
  assert.equal(resolveReversibility('edit_file', { edit_file: 'reversible-write' }), 'reversible-write')
})

test('an unclassified tool is irreversible — forgetting to classify is not a way in', () => {
  // This is the fail-closed direction. A default of 'read' would auto-approve
  // every tool nobody remembered to list.
  assert.equal(resolveReversibility('mystery_tool', { read_file: 'read' }), 'irreversible')
  assert.equal(resolveReversibility('mystery_tool', undefined), 'irreversible')
})

test('no gate configured means no decision, not a silent approval', () => {
  assert.equal(gateDecisionFor(undefined, 'edit_file', 'reversible-write', 0.9), undefined)
})

test('a read is auto and never interrupts', () => {
  const gate = new ReviewGate()
  const decision = gateDecisionFor(gate, 'read_file', 'read', undefined)
  assert.equal(decision?.review, false)
})

test('a reversible write with no confidence estimate asks rather than guessing', () => {
  const gate = new ReviewGate()
  const decision = gateDecisionFor(gate, 'edit_file', 'reversible-write', undefined)
  assert.equal(decision?.review, true)
  assert.equal(decision?.source, 'policy')
})

test('a reversible write clears the bar when the judge was confident', () => {
  const gate = new ReviewGate()
  assert.equal(gateDecisionFor(gate, 'edit_file', 'reversible-write', 0.9)?.review, false)
  assert.equal(gateDecisionFor(gate, 'edit_file', 'reversible-write', 0.2)?.review, true)
})

test('an irreversible tool always asks, however confident the judge was', () => {
  const gate = new ReviewGate()
  const decision = gateDecisionFor(gate, 'rm_rf', 'irreversible', 1)
  assert.equal(decision?.review, true)
  assert.match(decision?.reason ?? '', /always approved by a human/)
})

test('an unclassified tool reaches the gate as irreversible and asks', () => {
  // The two fail-closed rules composed: unknown tool -> irreversible, and
  // irreversible -> always approve. Neither half alone is enough.
  const gate = new ReviewGate()
  const reversibility = resolveReversibility('mystery_tool', {})
  const decision = gateDecisionFor(gate, 'mystery_tool', reversibility, undefined)
  assert.equal(decision?.review, true)
})

test('noteToolOutcomes marks the step when any call failed', () => {
  const steps = history({ tool: 'edit_file' })
  const changed = noteToolOutcomes(steps, [{ isError: false }, { isError: true }])
  assert.equal(changed, true)
  assert.equal(steps[0]!.error, true, 'a step whose write was rejected did not make progress')
})

test('noteToolOutcomes leaves a clean step clean', () => {
  const steps = history({ tool: 'read_file' })
  assert.equal(noteToolOutcomes(steps, [{ isError: false }]), false)
  assert.equal(steps[0]!.error, undefined)
})

test('noteToolOutcomes is a no-op with no outcomes and no history', () => {
  assert.equal(noteToolOutcomes([], [{ isError: true }]), false)
  assert.equal(noteToolOutcomes(history({ tool: 'a' }), []), false)
})

test('error-cascade can fire in the plugin path now that errors are recorded', () => {
  // The gap this closes: before, `StepObservation.error` was never populated, so
  // three consecutive failing steps produced no signal at all and the gate ran
  // on four detectors instead of six.
  const steps = history(
    { tool: 'run_tests' },
    { tool: 'edit_file' },
    { tool: 'run_tests' },
  )
  for (const step of steps) noteToolOutcomes([step], [{ isError: true }])
  const prepared = prepareReview({
    history: steps, maxSteps: 10, costBudgetUSD: 1, spentUSD: 0, budgetRemaining: false,
  })
  const cascade = prepared.signals.find(s => s.kind === 'error-cascade')
  assert.ok(cascade !== undefined, 'three failing steps must raise error-cascade')
  assert.equal(cascade.severity, 'critical')
})

test('the plugin and the runner agree on what the same call is', async () => {
  // `agent-policy.ts` is the single definition; `runner.ts` re-exports it. If
  // they ever diverge, the two paths would disagree about cycles.
  const { canonicalArgs: fromRunner } = await import('../src/runner.ts')
  assert.equal(fromRunner, canonicalArgs, 'runner must re-export the shared function, not redefine it')
})
