/**
 * The plugin's WIRING, not its policies.
 *
 * Every decision `src/plugin.ts` asks for is unit-tested somewhere else:
 * `agent-policy.test.ts` covers the detectors, `review.test.ts`/`policy.test.ts`
 * the gate and the router, `budget.test.ts` the ceilings. What none of them
 * cover is the part that actually broke twice, both times silently:
 *
 *   - the first draft of `plugin.ts` never wrote `policy.history`, so all six
 *     detectors read an empty array and the run looked perfectly healthy while
 *     reviewing nothing (PRD §7.1);
 *   - `policyFor` returned `undefined` for an agent-less call, so the gate
 *     delegated and the tool dispatched **ungated** (README "Four gaps").
 *
 * A wiring bug of that shape has no failing assertion anywhere in the suite,
 * because the wiring is the one part the suite never executed. This file drives
 * the three extension points in the order the harness does — pre-step, then the
 * tool boundary, then the next pre-step — through the same fake context the
 * approval tests use, and asserts on the OBSERVABLE consequences: the injected
 * notice text, the `PreToolDecision`, and the cost the ceiling sees.
 *
 * Run: `node --experimental-strip-types --test test/plugin-wiring.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { apply, createPolicy, reviewStep, routeForStep } from '../src/plugin.ts'
import type { CreatePolicyOptions, FeatureLoopPolicy } from '../src/plugin.ts'

/** The plugin's decision shapes, narrowed to what this file reads. */
interface Decision { kind: string, reason?: string, messages?: { source?: { kind?: string } }[] }
type Handler = (payload: unknown, next: () => Promise<Decision>) => Promise<Decision>

/** A context that records handlers instead of dispatching them. */
function fakeCtx(): { ctx: unknown, handler: (event: string) => Handler } {
  const handlers = new Map<string, Handler>()
  return {
    ctx: {
      on(event: string, fn: Handler): () => void {
        handlers.set(event, fn)
        return () => { handlers.delete(event) }
      },
    },
    handler(event: string): Handler {
      const fn = handlers.get(event)
      assert.ok(fn !== undefined, `no handler registered for "${event}"`)
      return fn
    },
  }
}

/**
 * A spec with a cheap ladder, one irreversible tool and one read-only tool.
 *
 * `maxSteps: 4` is the point of the ceiling tests: a spec with a generous
 * ceiling cannot prove the ceiling is wired at all.
 */
const SPEC: NonNullable<CreatePolicyOptions['spec']> = {
  goal: 'Ship the fix with a passing test.',
  sensor: ['test output'],
  controller: { ladder: [{ model: 'cheap' }, { model: 'pricy' }] },
  actuator: { write_file: 'irreversible', read_file: 'read' },
  feedback: 'the suite passes',
  termination: { successCommand: 'npm test', guards: ['no-progress'] },
  maxSteps: 4,
  costBudgetUSD: 1,
  prices: {},
}

/** One agent object, shared by the hooks of a single run. */
const AGENT = {}

/** Mount the plugin with the dashboard off (it would bind a port per test). */
function mount(options: CreatePolicyOptions): {
  ctx: unknown
  handler: (event: string) => Handler
  dispose: () => void
} {
  const { ctx, handler } = fakeCtx()
  return { ctx, handler, dispose: apply(ctx as never, { ...options, dashboard: { enabled: false } }) }
}

/**
 * Run one step boundary.
 *
 * The harness's own `agent/pre-step` payload (`runtime-types.ts:320`) is
 * `{agent, messages, turn, step, signal}` where `turn` is a NUMBER and `step`
 * is a NUMBER — not objects with `{turn, step}` inside them. The first draft
 * of this helper got that wrong and every ceiling assertion passed vacuously:
 * `step` destructured to `undefined`, so `verdict(undefined)` compared
 * `undefined > 4` and never stopped. The payload below is the real shape, and
 * the ceiling test is the one that would have caught the difference.
 */
async function preStep(
  handler: (event: string) => Handler,
  step: number,
  agent: unknown = AGENT,
): Promise<Decision> {
  return await handler('agent/pre-step')(
    { agent, messages: [], turn: 1, step, signal: new AbortController().signal },
    async () => ({ kind: 'enter', messages: [] }),
  )
}

/** Dispatch one tool call through the gate. */
async function tool(
  handler: (event: string) => Handler,
  name: string,
  agent: unknown = AGENT,
): Promise<{ decision: Decision, delegated: boolean }> {
  let delegated = false
  const decision = await handler('tools/pre-execute')(
    { agent, name, arguments: { path: 'a.ts' } },
    async () => { delegated = true; return { kind: 'allow' } },
  )
  return { decision, delegated }
}


// The helpers take the READER, never a captured handler: they look the event
// up on each call, so a handler registered late (or twice) cannot be hidden
// by a reference captured before it existed.

// ── the gate ───────────────────────────────────────────────────────────────

test('a tool call the gate blocks never reaches the harness', async () => {
  const { ctx, handler, dispose } = mount({ spec: SPEC })
  const { decision, delegated } = await tool(handler, 'write_file')
  assert.equal(delegated, false, 'the call must be decided here, not passed on')
  assert.equal(decision.kind, 'ask')
  assert.match(decision.reason ?? '', /REVIEW REQUESTED \(policy\)/)
  dispose()
  void ctx
})

test('a read-only tool is delegated to the harness', async () => {
  const { handler, dispose } = mount({ spec: SPEC })
  const { decision, delegated } = await tool(handler, 'read_file')
  assert.equal(delegated, true)
  assert.equal(decision.kind, 'allow')
  dispose()
})

test('an agent-less call is still gated — the fail-open regression', async () => {
  // The exact bug the README records: `policyFor` once answered `undefined`
  // here, the handler delegated, and an irreversible tool ran with no human in
  // the loop. The refusal happens downstream (`serviceAsk` denies an
  // agent-less ask), so the assertion is that it never gets that far.
  const { handler, dispose } = mount({ spec: SPEC })
  const { decision, delegated } = await tool(handler, 'write_file', undefined)
  assert.equal(delegated, false, 'the agent-less path must not dispatch ungated')
  assert.equal(decision.kind, 'ask')
  dispose()
})

// ── the detectors ──────────────────────────────────────────────────────────

test('a blocked call is recorded as a failure, and three of them raise the cascade', async () => {
  // The other half of the empty-history bug: `policy.pending.error` must be
  // set on the blocked path, or a loop the gate refuses forever reads as three
  // healthy steps.
  const { handler, dispose } = mount({ spec: SPEC })

  // Three denied calls between step boundaries. The gate asks each time (the
  // no answerer refuses it downstream, which is what a blocked run looks like),
  // and every one must land in history as an error.
  for (let i = 0; i < 3; i++) {
    await tool(handler, 'write_file')
    if (i < 2) await preStep(handler, i + 2)
  }
  const last = await preStep(handler, 4)

  const texts = (last.messages ?? []).map(m => JSON.stringify(m)).join('\n')
  assert.match(texts, /error-cascade|REVIEW REQUESTED/, 'three blocked steps must ask for review')
  dispose()
})

test('a long spin loop raises the signal the empty observations were recorded for', async () => {
  // "A step that did nothing" is itself worth detecting: skipping it would let
  // a silent spin loop look like a healthy one. What the shipped thresholds
  // do NOT do is fire inside four steps — `excessive-steps` needs the book's
  // 20-span line and `tool-cycle` needs three identical calls, and a step with
  // no tool has neither. That is a deliberate reading of the book, so this
  // test pins the real line rather than asserting a signal nobody promised.
  //
  // It reads the SIGNAL, not a notice, and that difference is the product:
  // `excessive-steps` is a warning, and the attention router spends a human's
  // attention on critical signals only (`route()` in review.ts). A grinding
  // loop therefore records evidence on the run card and stays out of the
  // model's context. `agent/pre-step` hands those signals to the dashboard,
  // not back to its caller, so the seam that proves the wiring is the
  // `reviewStep` the handler calls — asserted at that level, not faked above.
  const spin: NonNullable<CreatePolicyOptions['spec']> = { ...SPEC, maxSteps: 100 }
  const policy: FeatureLoopPolicy = createPolicy({ spec: spin })
  let signals: string[] = []
  for (let n = 1; n <= 22; n++) signals = (await reviewStep(policy, n)).signals.map(s => s.kind)
  assert.ok(signals.includes('excessive-steps'), `expected excessive-steps, got ${signals.join(',') || 'none'}`)
  assert.ok(!signals.includes('error-cascade'), 'empty steps are not errors')
})

test('a short run of empty steps is recorded but not yet a signal', async () => {
  // The honest counterpart to the test above: four empty steps are history,
  // not a review. If this ever fails because the plugin got MORE talkative,
  // the fix is the thresholds, not this assertion.
  const policy: FeatureLoopPolicy = createPolicy({ spec: SPEC })
  for (let n = 1; n <= 4; n++) await reviewStep(policy, n)
  assert.equal(policy.history.length, 3, 'every boundary commits the previous step')
  assert.ok(
    policy.history.every(step => step.tool === undefined && step.error === false),
    'a step that ran no tool is an empty observation, not a skipped one',
  )
})

// ── the ceilings ───────────────────────────────────────────────────────────

test('the step ceiling stops the run at the harness boundary', async () => {
  const { handler, dispose } = mount({ spec: SPEC })
  // SPEC.maxSteps is 4, so the fifth boundary is over the ceiling.
  for (let n = 1; n <= 4; n++) await preStep(handler, n)
  const decision = await preStep(handler, 5)
  assert.equal(decision.kind, 'reject', 'a ceiling must stop the run, not annotate it')
  assert.match(decision.reason ?? '', /step ceiling/)
  dispose()
})

test('the step ceiling stops the run even when nothing has been spent', async () => {
  // The other failure mode: a ceiling that is only enforced when the budget has
  // a non-zero `spent`. `verdict` checks steps before money, so both hold.
  const { handler, dispose } = mount({ spec: SPEC })
  for (let n = 1; n <= 5; n++) {
    const d = await preStep(handler, n)
    if (n === 5) assert.equal(d.kind, 'reject')
  }
  dispose()
})

test('the ladder routes every step it is given a rung for', async () => {
  const { handler, dispose } = mount({ spec: SPEC })
  const first = await handler('agent/request')(
    { agent: AGENT, step: 1 },
    async () => ({}),
  )
  assert.equal((first as { model?: string }).model, 'cheap')
  dispose()
})

// ── the pure policy, for the seam the hooks share ──────────────────────────

test('reviewStep commits history even when no tool ever ran', async () => {
  // The same wiring bug, pinned at the seam the hooks both call: after N
  // boundaries the history is N-1 long, and it holds a real tool when one ran.
  const policy: FeatureLoopPolicy = createPolicy({ spec: SPEC })
  await reviewStep(policy, 1)
  assert.equal(policy.history.length, 0, 'the first boundary has no previous step')
  await reviewStep(policy, 2)
  assert.equal(policy.history.length, 1)
  policy.pending = { tool: 'write_file', argsKey: 'k', error: false }
  await reviewStep(policy, 3)
  assert.equal(policy.history.length, 2)
  assert.equal(policy.history[1]?.tool, 'write_file')
})

test('the plugin path escalates the ladder on failure, not only on step count', async () => {
  // `escalateAfterFailures` is set in every shipped profile
  // (`escalateAfterFailures: 2`) and is documented as "consecutive failures on
  // one rung" — and the plugin path had no caller for `recordFailure` at all.
  // A DSH deployment could therefore only climb on `stepsPerRung`, so a task
  // that failed fast and early stayed on the cheap model for its whole life,
  // which is the opposite of what the rung is for.
  //
  // Driven through `reviewStep`, which is what the `agent/pre-step` handler
  // calls and where the previous step's outcome is committed. `stepsPerRung: 99`
  // removes the other reason to climb, so nothing but failure can move it.
  const policy = createPolicy({
    spec: {
      ...SPEC,
      controller: {
        ladder: [{ provider: 'cheap', model: 'fast' }, { provider: 'pricey', model: 'strong' }],
        stepsPerRung: 99,
        escalateAfterFailures: 2,
      },
      maxSteps: 6,
      prices: {
        'cheap/fast': { inputPerMTok: 1, outputPerMTok: 1 },
        'pricey/strong': { inputPerMTok: 1, outputPerMTok: 1 },
      },
    },
  })

  // Read the route AFTER the review, which is the order the handler uses:
  // `reviewStep` commits the previous step's outcome, and `routeForStep` is
  // what `agent/request` then asks. Escalation is sticky, so the route a step
  // actually ran on is the answer to "did the ladder move".
  const routes: string[] = []
  for (let step = 1; step <= 4; step++) {
    // The `tools/pre-execute` handler records the step that just ran; a denied
    // call marks it failed, which is the plugin path's only failure signal.
    if (step > 1) policy.pending = { tool: 'write_file', argsKey: 'k', error: true }
    await reviewStep(policy, step)
    const routed = routeForStep(policy, step, undefined)
    if (routed !== undefined) routes.push(`${String(routed.provider)}/${String(routed.model)}`)
  }

  assert.deepEqual(
    routes,
    ['cheap/fast', 'cheap/fast', 'pricey/strong', 'pricey/strong'],
    'two consecutive failures move the ladder, and only then',
  )
})
