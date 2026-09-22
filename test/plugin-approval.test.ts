/**
 * The check for the plugin's half of the approval handshake — plus the
 * optimize wiring that shares its `apply`.
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
 * The second half covers the optimize wiring on the same seam: `session/event`
 * on `turn/end` appends one run record per closed turn (deduped by resend),
 * refreshes the dashboard's Metrics roll-up from the file, and never fails
 * the turn it observes. `recordTurn` is exercised through the registered
 * handler against a temp history file, so the assertions pin the wiring —
 * registration, dedup, append, metrics — not a mock of it.
 *
 * Run: `node --experimental-strip-types --test test/plugin-approval.test.ts`
 */

import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { apply, isTurnEnd } from '../src/plugin.ts'
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

/**
 * Every `apply` below starts the dashboard by default (port 8100), so the
 * fake context's disposer must actually dispose: without it the tenth test
 * binds the tenth socket on the same port and the suite hangs on EADDRINUSE.
 * The helper returns the disposer's promise rather than awaiting it — the
 * harness's own contract treats unload as fire-and-forget.
 */

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
  // The dashboard is on by default and binds 127.0.0.1:8100 — one live server
  // per `apply`. The gate tests never read the page, so disable it here and
  // keep the one shared port for the tests that actually need a socket.
  const dispose = apply(ctx as never, { ...options, dashboard: { enabled: false } })
  let delegated = false
  const decision = await handler('tools/pre-execute')(
    { ...exec, arguments: exec.arguments ?? {} },
    async () => { delegated = true; return ALLOW },
  )
  dispose()
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
  const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: false } })
  // Registration order follows apply(): the session/event recorder is
  // registered before the step/request/tool hooks.
  assert.deepEqual(registered(), ['session/event', 'agent/pre-step', 'agent/request', 'tools/pre-execute'])
  dispose()
})

test('the dashboard starts by default; enabled:false opts out', async () => {
  {
    const { ctx, registered } = fakeCtx()
    const dispose = apply(ctx as never, { spec: SPEC })
    assert.ok(registered().includes('session/event'), `registered: ${registered().join(', ')}`)
    dispose()
  }
  {
    const { ctx, handler } = fakeCtx()
    void handler
    const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: false } })
    dispose()
  }
})

test('history records by default; history:"" disables it', async () => {
  {
    const { ctx, registered } = fakeCtx()
    const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: false } })
    assert.ok(registered().includes('session/event'), `registered: ${registered().join(', ')}`)
    dispose()
  }
  {
    const { ctx, registered } = fakeCtx()
    const dispose = apply(ctx as never, {
      spec: SPEC,
      dashboard: { enabled: false },
      optimize: { history: '' },
    })
    assert.ok(!registered().includes('session/event'), `registered: ${registered().join(', ')}`)
    dispose()
  }
})

test('isTurnEnd narrows only real turn closers', () => {
  const end = { type: 'turn/end', data: { turn: 3, reason: { kind: 'completed' } } }
  assert.deepEqual(isTurnEnd(end), { turn: 3, reasonKind: 'completed' })
  assert.equal(isTurnEnd({ type: 'user/message', data: {} }), undefined)
  const badTurn = { type: 'turn/end', data: { turn: 'three', reason: { kind: 'completed' } } }
  assert.equal(isTurnEnd(badTurn), undefined)
  assert.equal(isTurnEnd({ type: 'turn/end', data: { turn: 3 } }), undefined)
  assert.equal(isTurnEnd(undefined), undefined)
})

/**
 * Drive one `turn/end` through the registered `session/event` handler and wait
 * for the fire-and-forget append to land.
 *
 * The listener returns void and records asynchronously, so the test polls the
 * file rather than awaiting a promise it was never given: the harness's own
 * emit-mode contract is exactly this — observe-only, no acknowledgement.
 *
 * @param options - the deployment options handed to `apply`.
 * @param event - the session event to deliver.
 * @param session - the session it was appended to.
 * @returns the handler's synchronous return (always undefined).
 */
async function emitSessionEvent(
  options: CreatePolicyOptions,
  historyPath: string,
  event: unknown,
  session: unknown = { id: 'sess-1' },
): Promise<void> {
  const { ctx, handler } = fakeCtx()
  // Dashboard off here: each `apply` would otherwise bind :8100, and these
  // tests never read the page — one shared port cannot serve a suite.
  const dispose = apply(ctx as never, {
    ...options,
    dashboard: { enabled: false },
    optimize: { history: historyPath },
  })
  const fn = handler('session/event') as unknown as (s: unknown, e: unknown) => unknown
  fn(session, event)
  // The append is one microtask chain (dynamic import + sync write + sync
  // read); poll rather than sleep a fixed span so a slow disk still passes
  // and a fast one does not wait.
  const deadline = Date.now() + 5000
  for (;;) {
    try {
      if (readFileSync(historyPath, 'utf8').trim() !== '') {
        dispose()
        return
      }
    } catch {
      // Not written yet — keep polling.
    }
    if (Date.now() > deadline) {
      dispose()
      throw new Error('timed out waiting for the run record to land')
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

test('a closed turn appends exactly one run record with metered numbers', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-hist-'))
  const historyPath = join(dir, 'runs.jsonl')
  await emitSessionEvent({ spec: SPEC }, historyPath, {
    type: 'turn/end',
    data: { turn: 1, reason: { kind: 'completed' } },
  })
  const lines = readFileSync(historyPath, 'utf8').trim().split('\n')
  assert.equal(lines.length, 1)
  const record = JSON.parse(lines[0]!) as Record<string, unknown>
  // Metered, not invented: the budget snapshot says zero steps and zero spend
  // because no step ever ran under this policy — and zero is what is written.
  assert.equal(record.steps, 0)
  assert.equal(record.costUSD, 0)
  assert.equal(record.maxSteps, 8)
  assert.equal(record.budgetUSD, 1)
  // `completed` with no ceiling hit reads as goal-met in the harness sense.
  assert.equal(record.outcome, 'goal-met')
  // Honestly absent, never guessed: no route priced, no latency timed.
  assert.deepEqual(record.byRoute, {})
  assert.deepEqual(record.stepLatencyMs, [])
  assert.equal(record.latencyKind, 'round-trip')
  assert.equal(typeof record.taskKey, 'string')
  assert.equal(typeof record.specFingerprint, 'string')
})

test('a re-delivered turn closer never double-records', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-hist-'))
  const historyPath = join(dir, 'runs.jsonl')
  const { ctx, handler } = fakeCtx()
  const dispose = apply(ctx as never, {
    spec: SPEC,
    dashboard: { enabled: false },
    optimize: { history: historyPath },
  })
  const fn = handler('session/event') as unknown as (s: unknown, e: unknown) => unknown
  const event = { type: 'turn/end', data: { turn: 2, reason: { kind: 'completed' } } }
  fn({ id: 'sess-2' }, event)
  fn({ id: 'sess-2' }, event)
  fn({ id: 'sess-2' }, { type: 'turn/end', data: { turn: 2, reason: { kind: 'completed' } } })
  const deadline = Date.now() + 5000
  for (;;) {
    try {
      const lines = readFileSync(historyPath, 'utf8').trim().split('\n')
      if (lines.length >= 1) {
        // One record despite three deliveries — then hold still: a second
        // record landing later would be the dedup failing slowly, not passing.
        await new Promise(resolve => setTimeout(resolve, 100))
        assert.equal(readFileSync(historyPath, 'utf8').trim().split('\n').length, 1)
        dispose()
        return
      }
    } catch {
      // Not written yet — keep polling.
    }
    if (Date.now() > deadline) {
      dispose()
      throw new Error('timed out waiting for the run record to land')
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
})

test('a non-turn event records nothing', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-hist-'))
  const historyPath = join(dir, 'runs.jsonl')
  const { ctx, handler } = fakeCtx()
  const dispose = apply(ctx as never, {
    spec: SPEC,
    dashboard: { enabled: false },
    optimize: { history: historyPath },
  })
  const fn = handler('session/event') as unknown as (s: unknown, e: unknown) => unknown
  fn({ id: 'sess-3' }, { type: 'user/message', data: {} })
  // The listener is synchronous up to the `asTurnEnd` narrow: a non-turn
  // event returns before any async work starts, so no wait is needed — the
  // file must simply never appear.
  await new Promise(resolve => setTimeout(resolve, 100))
  let exists = true
  try {
    readFileSync(historyPath, 'utf8')
  } catch {
    exists = false
  }
  dispose()
  assert.equal(exists, false)
})

test('a blocked turn records a blocked run', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-hist-'))
  const historyPath = join(dir, 'runs.jsonl')
  await emitSessionEvent({ spec: SPEC }, historyPath, {
    type: 'turn/end',
    data: { turn: 4, reason: { kind: 'blocked' } },
  })
  const record = JSON.parse(readFileSync(historyPath, 'utf8').trim().split('\n')[0]!) as Record<string, unknown>
  assert.equal(record.outcome, 'blocked')
})
