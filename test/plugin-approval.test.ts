/**
 * The check for the plugin's half of the approval handshake.
 *
 * The plugin's responsibility ends at the `PreToolDecision` it returns from
 * `tools/pre-execute`: `ask` when the review gate fires and a human should be
 * asked, `deny` when the deployment pinned unattended mode. Mapping that `ask`
 * to an `ApprovalOutcome` and back to allow/deny belongs to the harness
 * (`prepareExecution`/`serviceAsk` in `@deepseek-ai/dsh-tools`), so it is not
 * observable here and is not asserted here.
 *
 * `apply` is driven through a fake context whose `on(evt, fn)` captures the
 * handlers, exactly as the harness's own waterfall would call them. The one
 * thing that must hold: a gate-raised review leaves as `ask` carrying the
 * review text, default; or as `deny` carrying that same text when the
 * deployment asks for unattended mode.
 *
 * Run: `node --experimental-strip-types --test test/plugin-approval.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { apply } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'

/** The decision the plugin hands back, narrowed to what this file reads. */
type Decision = { kind: string, reason?: string }

/** One waterfall handler as `ctx.on` registers it. */
type Handler = (payload: unknown, next: () => Promise<Decision>) => Promise<Decision>

/**
 * A context that records handlers instead of dispatching them.
 *
 * Only `on` is needed: `apply` reads nothing else from the context, and the
 * handlers it registers are invoked directly by the tests below.
 *
 * @returns the fake context and a reader for the handlers it captured.
 */
function fakeCtx(): {
  ctx: unknown
  handler: (event: string) => Handler
  registered: () => string[]
} {
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
    registered: () => [...handlers.keys()],
  }
}

/**
 * A spec whose actuator makes one tool irreversible, which is what the gate
 * escalates to a human by default (`DEFAULT_GATE_POLICIES.irreversible`).
 *
 * `guards` is not optional here: `validateSpec` refuses an irreversible tool
 * with no termination guard, because the approval gate would then be the only
 * containment.
 */
const SPEC: NonNullable<CreatePolicyOptions['spec']> = {
  goal: 'Ship the fix with a passing test.',
  sensor: ['test output'],
  controller: { ladder: [{ model: 'cheap' }] },
  actuator: { write_file: 'irreversible', read_file: 'read' },
  feedback: 'the suite passes',
  termination: { successCommand: 'npm test', guards: ['no-progress'] },
  maxSteps: 8,
  costBudgetUSD: 1,
  prices: {},
}

/** The agent identity the gate needs; only its identity matters to the plugin. */
const AGENT = {}

/** What the harness's own waterfall terminus returns when nothing objects. */
const ALLOW: Decision = { kind: 'allow' }

/**
 * Drive one tool call through the registered `tools/pre-execute` handler.
 *
 * @param options - the deployment options handed to `apply`.
 * @param exec - the tool-call payload the harness would dispatch.
 * @returns the decision, and whether the plugin delegated via `next()`.
 */
async function call(
  options: CreatePolicyOptions,
  exec: { agent?: unknown, name: string, arguments?: unknown } = { agent: AGENT, name: 'write_file' },
): Promise<{ decision: Decision, delegated: boolean }> {
  const { ctx, handler } = fakeCtx()
  apply(ctx as never, options)
  let delegated = false
  const decision = await handler('tools/pre-execute')(
    { ...exec, arguments: exec.arguments ?? {} },
    async () => { delegated = true; return ALLOW },
  )
  return { decision, delegated }
}

test('a gate-raised review is returned as an ask, not a deny', async () => {
  const { decision } = await call({ spec: SPEC })
  assert.equal(decision.kind, 'ask')
})

test('the ask carries the review text a human reads in the approval prompt', async () => {
  // The Web UI renders this string as the prompt headline
  // (ui-approval/src/client/ApprovalPanel.tsx, `pending.reason`), so it has to
  // say what is being reviewed and why — not just the tool name.
  const { decision } = await call({ spec: SPEC })
  assert.match(decision.reason ?? '', /REVIEW REQUESTED \(policy\)/)
  assert.match(decision.reason ?? '', /write_file/)
  assert.match(decision.reason ?? '', /always approved by a human/)
})

test('gateMode: deny keeps refusing outright without prompting', async () => {
  // The unattended/CI stance: the same review, expressed as a refusal.
  const { decision, delegated } = await call({ spec: SPEC, gateMode: 'deny' })
  assert.equal(decision.kind, 'deny')
  assert.match(decision.reason ?? '', /REVIEW REQUESTED \(policy\)/)
  assert.equal(delegated, false)
})

test('a tool the gate classifies as safe is delegated, not asked about', async () => {
  const { decision, delegated } = await call(
    { spec: SPEC },
    { agent: AGENT, name: 'read_file' },
  )
  assert.equal(delegated, true)
  assert.equal(decision.kind, 'allow')
})

test('with no spec configured the plugin adds no gate at all', async () => {
  const { decision, delegated } = await call({})
  assert.equal(delegated, true)
  assert.equal(decision.kind, 'allow')
})

test('a call with no agent is still gated, not silently delegated', async () => {
  // An agent-less call cannot be keyed by agent, but skipping it would dispatch
  // the call ungated — the opposite of the guarantee the gate exists to give.
  // It gets a shared policy, so the gate is consulted; the refusal then happens
  // downstream, where the harness denies an agent-less `ask` because there is no
  // session to audit to and no UI to reach (`serviceAsk` in dsh-tools).
  const { decision, delegated } = await call({ spec: SPEC }, { agent: undefined, name: 'write_file' })
  assert.equal(delegated, false, 'the call must not reach the harness undecided')
  assert.equal(decision.kind, 'ask')
  assert.match(decision.reason, /REVIEW REQUESTED/)
})

test('the handler is registered on the harness tool-boundary event', async () => {
  const { ctx, registered } = fakeCtx()
  apply(ctx as never, { spec: SPEC })
  assert.deepEqual(registered(), ['agent/pre-step', 'agent/request', 'tools/pre-execute'])
})
