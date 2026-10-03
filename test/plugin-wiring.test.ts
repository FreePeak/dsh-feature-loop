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
import { clearWatcher, noteWatcher } from '../src/approvals.ts'

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
  // `escalateAfterFailures` is set on purpose: `ModelLadder.recordFailure`
  // returns early when it is undefined, so this SPEC's ladder could only ever
  // climb on `stepsPerRung`. The other ladder tests here set `stepsPerRung: 99`
  // for the same reason — one signal at a time, so a test cannot pass for the
  // wrong one.
  controller: {
    ladder: [{ model: 'cheap' }, { model: 'pricy' }],
    escalateAfterFailures: 2,
  },
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
/**
 * Mount the plugin with the dashboard OFF, and a watcher on by default.
 *
 * `gateMode: ask` refuses up front when no front end is watching — see
 * `gateForTool` — so every assertion that an `ask` is returned is a claim that
 * somebody COULD answer it. `watched: false` is how a test states the other
 * case rather than inheriting a TTL left behind by the previous test.
 */
function mount(options: CreatePolicyOptions, watched: boolean = true): {
  ctx: unknown
  handler: (event: string) => Handler
  dispose: () => void
} {
  const { ctx, handler } = fakeCtx()
  // Stated, not inherited: the watcher is process-global with a TTL, so a test
  // that did not set it would depend on whichever test ran before it. Running
  // this one case alone passed while the suite failed, which is the whole
  // argument for clearing here.
  if (watched) noteWatcher()
  else clearWatcher()
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
  args: Record<string, unknown> = { path: 'a.ts' },
): Promise<{ decision: Decision, delegated: boolean }> {
  let delegated = false
  const decision = await handler('tools/pre-execute')(
    { agent, name, arguments: args },
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
  // The card names what it is about. Measured 2026-10-03: five asks for three
  // files produced five identical cards, and a gate whose cards cannot be told
  // apart trains the click that makes it worthless.
  assert.match(decision.reason ?? '', /write_file a\.ts/)
  dispose()
  void ctx
})

test('two writes in one run produce two DIFFERENT cards', async () => {
  // The assertion the previous one exists for: it is not enough that a card
  // carries a subject, it is that two cards about different files differ.
  const { handler, dispose } = mount({ spec: SPEC })
  const first = await tool(handler, 'write_file', AGENT, { path: 'notes/first.md' })
  const second = await tool(handler, 'write_file', AGENT, { path: 'notes/second.md' })
  assert.notEqual(first.decision.reason, second.decision.reason)
  assert.match(first.decision.reason ?? '', /notes\/first\.md/)
  assert.match(second.decision.reason ?? '', /notes\/second\.md/)
  dispose()
})

test('a bash card names the command, because bash is gated too', async () => {
  const { handler, dispose } = mount({ spec: SPEC })
  const { decision } = await tool(handler, 'bash', AGENT, { command: 'ls notes' })
  assert.equal(decision.kind, 'ask')
  assert.match(decision.reason ?? '', /bash ls notes/)
  dispose()
})

test('a card never quotes the file contents back at the reviewer', async () => {
  // The subject is a path or a command; the CONTENT is the thing the human has
  // not decided about, and putting it on the card invites approving a diff
  // nobody read.
  const { handler, dispose } = mount({ spec: SPEC })
  // Invented content, and deliberately NOT shaped like a credential: a fixture
  // that reads as a key is one this repo's own scan will (correctly) refuse to
  // let through, and the property under test does not need one.
  const contents = 'const timeoutMs = 30_000'
  const { decision } = await tool(handler, 'write_file', AGENT, { path: 'a.ts', content: contents })
  assert.match(decision.reason ?? '', /a\.ts/)
  assert.equal(decision.reason?.includes(contents), false)
  dispose()
})

test('a card with nothing to name says nothing extra', async () => {
  // No path, no command: the reason must be byte-identical to the old one, so
  // an unnamable call gains no noise.
  const { handler, dispose } = mount({ spec: SPEC })
  const { decision } = await tool(handler, 'write_file', AGENT, { mode: 'overwrite' })
  assert.equal(decision.kind, 'ask')
  assert.equal(decision.reason?.includes('write_file —'), false)
  dispose()
})

test('a multi-line or runaway subject is dropped, not truncated onto the card', async () => {
  const { handler, dispose } = mount({ spec: SPEC })
  const multiline = await tool(handler, 'bash', AGENT, { command: 'echo a\necho b' })
  assert.equal(multiline.decision.reason?.includes('echo a'), false)
  const long = await tool(handler, 'bash', AGENT, { command: 'x'.repeat(300) })
  assert.equal(long.decision.reason?.includes('x'.repeat(100)), false)
  dispose()
})

test('a read-only tool is delegated to the harness', async () => {
  const { handler, dispose } = mount({ spec: SPEC })
  const { decision, delegated } = await tool(handler, 'read_file')
  assert.equal(delegated, true)
  assert.equal(decision.kind, 'allow')
  dispose()
})

test('an ask with NO front end watching is refused here, not by the harness', async () => {
  // The harness's own fail-closed is correct but its message is
  //   tool "write_file" requires approval, but no approval channel is available
  // which a run reports as a SANDBOX denial — a different fact, and one that
  // sends the model hunting for a narrower tool. Measured 2026-10-03: the model
  // spent its remaining budget on that question and produced no work.
  //
  // So the refusal is the plugin's, it says what is actually true, and it says
  // what to do about it. This is the assertion that keeps gateMode: ask from
  // degrading into a confusing deny.
  const { handler, dispose } = mount({ spec: SPEC }, false)
  const { decision, delegated } = await tool(handler, 'write_file')
  assert.equal(delegated, false)
  assert.equal(decision.kind, 'deny')
  assert.match(decision.reason ?? '', /nobody is watching/)
  assert.match(decision.reason ?? '', /gateMode: deny/)
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

test('a rung change is announced to the model, not only to the dashboard', async () => {
  // `escalationForStep` was exported and documented — "announce an escalation,
  // if the ladder moved the route this step" — with no caller outside the
  // export list. So a DSH deployment could move rungs without the MODEL being
  // told: the dashboard showed ROUTE changing and the transcript showed
  // nothing, and a model handed a harder turn with no warning is a model
  // reasoning from a transcript that has suddenly stopped making sense.
  //
  // The channel is `agent/pre-step`, not `agent/request`: that hook returns an
  // `LlmCallConfig` ({provider, model}) and carries no `messages` for a caller
  // to splice, so a notice appended there is dropped without error. The first
  // attempt put it there and typechecked happily.
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

  const routes: string[] = []
  let sawEscalationNotice = false
  for (let step = 1; step <= 4; step++) {
    if (step > 1) policy.pending = { tool: 'write_file', argsKey: 'k', error: true }
    const decision = await reviewStep(policy, step)
    const routed = routeForStep(policy, step, undefined)
    if (routed !== undefined) routes.push(`${String(routed.provider)}/${String(routed.model)}`)
    // `reviewStep` is the handler's seam; the decision it returns carries the
    // messages the harness will splice into the conversation.
    for (const m of decision.notices) {
      if (/ROUTING|escalat|rung/i.test(m)) sawEscalationNotice = true
    }
  }

  assert.deepEqual(routes, ['cheap/fast', 'cheap/fast', 'pricey/strong', 'pricey/strong'],
    'the ladder still moves on failure')
  assert.ok(sawEscalationNotice,
    'and the model is told, in a message the harness will actually deliver')
})


// ── spend drain + session→agent resolution ─────────────────────────────────

/**
 * A fake session log with one settled assistant message already on it.
 * Mirrors the harness contract: `seq` is the *next* seq (log length), and
 * `snapshotEvents(from)` returns events whose seq is >= from.
 */
function settledSession(events: readonly {
  seq: number
  type: string
  data?: unknown
}[]): { seq: number, snapshotEvents: (from?: number) => typeof events } {
  return {
    seq: events.length === 0 ? 0 : Math.max(...events.map(e => e.seq)) + 1,
    snapshotEvents(from = 0) {
      return events.filter(e => e.seq >= from)
    },
  }
}

const PRICED_MSG = {
  seq: 0,
  type: 'assistant/message',
  data: {
    usage: { inputTokens: 1_000_000, outputTokens: 0 },
    message: { source: { provider: 'onegw', model: 'execution' } },
  },
}

test('a settled attempt is priced even when the session cursor is already past it', async () => {
  // The bug: pricedThroughSeq seeded from session.seq (the NEXT seq) skipped
  // every already-settled assistant/message, so costBudgetUSD stayed zero.
  const session = settledSession([PRICED_MSG])
  assert.equal(session.seq, 1, 'harness seq is next-to-write, not last-written')
  const agent = { session }
  const { handler, dispose } = mount({
    spec: {
      ...SPEC,
      maxSteps: 99,
      costBudgetUSD: 0.1, // 1M tokens at $0.3/MTok = $0.30 → over
      prices: {
        'onegw/execution': { inputPerMTok: 0.3, outputPerMTok: 1.2 },
      },
      controller: { ladder: [{ provider: 'onegw', model: 'execution' }] },
    },
  })
  const decision = await preStep(handler, 1, agent)
  assert.equal(decision.kind, 'reject', 'priced usage must fire the cost ceiling')
  assert.match(decision.reason ?? '', /cost ceiling/)
  dispose()
})

test('a THROWING ctx.agents still records the turn', async () => {
  // `ctx.agents` is a cordis PROXY, and reading it on a fiber where
  // `AgentRegistry` has not mounted THROWS `cannot get property "agents" without
  // inject`. Measured 2026-10-03 on a live web run: that throw escaped into the
  // turn record, and the feed showed `run history append failed` — the one
  // thing the history exists to be, gone.
  //
  // No agent found is ALREADY a supported answer (the agent-less policy, with
  // shared ceilings and an honest label). A getter that throws is the same
  // answer with noise on it, not a lost record.
  const { mkdtempSync, readFileSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { tmpdir } = await import('node:os')
  const dir = mkdtempSync(join(tmpdir(), 'dsh-agents-throw-'))
  const historyPath = join(dir, 'runs.jsonl')

  const session = settledSession([PRICED_MSG])
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  const ctx = {
    get agents(): never {
      throw new Error('cannot get property agents without inject')
    },
    on(event: string, fn: (...args: unknown[]) => unknown): () => void {
      handlers.set(event, fn)
      return () => { handlers.delete(event) }
    },
  }
  apply(ctx as never, {
    spec: SPEC,
    dashboard: { enabled: false },
    optimize: { history: historyPath },
  })

  const sessionHandler = handlers.get('session/event') as Handler
  sessionHandler({ id: 'sess-throwing' }, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })

  // recordTurn is async and imports runlog.ts dynamically, so the append lands
  // a tick or two later. Poll for the file instead of guessing a sleep.
  for (let attempt = 0; attempt < 100 && !existsSync(historyPath); attempt += 1) {
    await new Promise(resolve => { setTimeout(resolve, 10) })
  }
  assert.ok(existsSync(historyPath), 'a throwing ctx.agents must not lose the record')
  const [line] = readFileSync(historyPath, 'utf8').trim().split('\n')
  assert.equal(JSON.parse(line!).runId, 'sess-throwing')
})

test('a turn that ran steps keeps goal-met when the transport completed', async () => {
  // The other half of the zero-step rule: the guard must not turn a real run
  // into a failure. This charges a priced assistant message first, so the record
  // has steps to report.
  const { mkdtempSync, readFileSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { tmpdir } = await import('node:os')
  const dir = mkdtempSync(join(tmpdir(), 'dsh-hist-steps-'))
  const historyPath = join(dir, 'runs.jsonl')
  const session = settledSession([PRICED_MSG])
  const agent = { id: 'sess-steps', session }
  const agents = new Map<string, typeof agent>([['sess-steps', agent]])
  // `agents` must exist BEFORE `apply`: the plugin resolves the session's agent
  // when it records the turn, and assigning it afterwards is too late.
  const { ctx, handler } = fakeCtx()
  Object.assign(ctx as object, { agents: { get: (id: string) => agents.get(id) } })
  const dispose = apply(ctx as never, {
    spec: {
      ...SPEC,
      maxSteps: 99,
      costBudgetUSD: 5,
      prices: { 'onegw/execution': { inputPerMTok: 0.3, outputPerMTok: 1.2 } },
      controller: { ladder: [{ provider: 'onegw', model: 'execution' }] },
    },
    dashboard: { enabled: false },
    optimize: { history: historyPath },
  })
  // (payload, next) — two arguments, not six. The payload is ONE object; the
  // neighbouring test's call is the shape to copy, which is why it is here.
  const pre = handler('agent/pre-step')
  await pre(
    { agent, messages: [], turn: 1, step: 1, signal: new AbortController().signal },
    async () => ({ kind: 'enter', messages: [] }),
  )

  const sessionHandler = handler('session/event') as unknown as (s: unknown, e: unknown) => unknown
  sessionHandler({ id: 'sess-steps' }, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })
  const deadline = Date.now() + 5000
  while (Date.now() < deadline && !existsSync(historyPath)) {
    await new Promise(resolve => { setTimeout(resolve, 10) })
  }
  const [line] = readFileSync(historyPath, 'utf8').trim().split('\n')
  const record = JSON.parse(line!) as Record<string, unknown>
  assert.ok(Number(record.steps) > 0, 'this turn did work, so it must have steps')
  assert.equal(record.outcome, 'goal-met', 'a real completed turn is still goal-met')
  dispose()
})

test('session/event records cost against the agent resolved from ctx.agents', async () => {
  // agentOfSession was a stub returning undefined, so turn records always
  // read the agent-less shared policy (fresh zero budget) even when the live
  // agent had already spent.
  const { mkdtempSync, readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { tmpdir } = await import('node:os')
  const dir = mkdtempSync(join(tmpdir(), 'dsh-agent-of-'))
  const historyPath = join(dir, 'runs.jsonl')

  const session = settledSession([PRICED_MSG])
  const agent = { id: 'sess-live', session }
  const agents = new Map<string, typeof agent>([['sess-live', agent]])

  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  const ctx = {
    agents: { get: (id: string) => agents.get(id) },
    on(event: string, fn: (...args: unknown[]) => unknown): () => void {
      handlers.set(event, fn)
      return () => { handlers.delete(event) }
    },
  }
  const dispose = apply(ctx as never, {
    spec: {
      ...SPEC,
      maxSteps: 99,
      costBudgetUSD: 5,
      prices: {
        'onegw/execution': { inputPerMTok: 0.3, outputPerMTok: 1.2 },
      },
      controller: { ladder: [{ provider: 'onegw', model: 'execution' }] },
    },
    dashboard: { enabled: false },
    optimize: { history: historyPath },
  })

  // Charge the live agent via pre-step drain before the turn closes.
  const pre = handlers.get('agent/pre-step') as Handler
  await pre(
    { agent, messages: [], turn: 1, step: 1, signal: new AbortController().signal },
    async () => ({ kind: 'enter', messages: [] }),
  )

  const sessionHandler = handlers.get('session/event')
  assert.ok(sessionHandler !== undefined, 'session/event must register when history is on')
  sessionHandler({ id: 'sess-live' }, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })

  const deadline = Date.now() + 5000
  let record: Record<string, unknown> | undefined
  for (;;) {
    try {
      const lines = readFileSync(historyPath, 'utf8').trim().split('\n')
      if (lines.length >= 1 && lines[0]) {
        record = JSON.parse(lines[0]!) as Record<string, unknown>
        break
      }
    } catch { /* not yet */ }
    if (Date.now() > deadline) break
    await new Promise(r => setTimeout(r, 10))
  }
  dispose()
  assert.ok(record !== undefined, 'run record must land')
  assert.ok((record!.costUSD as number) > 0, `expected non-zero cost, got ${String(record!.costUSD)}`)
  assert.equal(record!.runId, 'sess-live')
})

// ── the settings file ──────────────────────────────────────────────────────
//
// The last hop. test/remote.test.ts unit-tests the merge (it imports no harness
// package, so CI runs it); what only this file can see is that `index.ts` CALLS
// it on the way into `apply`, so a value saved in the settings file changes what
// the tool boundary does. Remove that call and these two fail while every other
// test in the suite still passes — which is the exact shape of the bug this
// replaces: a page that showed a value the gate never consulted.

/** A temp XDG config home holding one settings file, for one test. */
async function withSettingsFile(body: string, run: () => Promise<void>): Promise<void> {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { tmpdir } = await import('node:os')
  const home = mkdtempSync(join(tmpdir(), 'dshloop-settings-'))
  const saved = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = home
  try {
    mkdirSync(join(home, 'dshloop'), { recursive: true })
    writeFileSync(join(home, 'dshloop', 'config.yaml'), body)
    await run()
  } finally {
    if (saved === undefined) delete process.env.XDG_CONFIG_HOME
    else process.env.XDG_CONFIG_HOME = saved
    rmSync(home, { recursive: true, force: true })
  }
}

test('the settings file widens the gate the plugin actually enforces', async () => {
  await withSettingsFile('gatePolicies:\n  write: auto\n', async () => {
    const { mergeRowAndSettings } = await import('../src/remote.ts')
    // The row says `write_file` is always-approve; the file says auto and the
    // FILE WINS — that is the whole contract, exercised through the merge the
    // plugin row is given.
    const merged = mergeRowAndSettings({ gatePolicies: { write_file: 'always-approve' } })
    assert.deepEqual(merged.gatePolicies, { write: 'auto' })

    const { ctx, handler, dispose } = mount({ ...SPEC_OPTS, gatePolicies: merged.gatePolicies as never })
    try {
      const { decision, delegated } = await tool(handler, 'write')
      assert.equal(delegated, true, 'an auto policy must pass the call to the harness')
      assert.equal(decision.kind, 'allow')
    } finally {
      dispose()
      void ctx
    }
  })
})

test('the settings file tightens it too: deny wins over the row asking', async () => {
  await withSettingsFile('gateMode: deny\n', async () => {
    const { mergeRowAndSettings } = await import('../src/remote.ts')
    // The row asks; the file denies. Both stop the call, and `deny` stops it
    // WITHOUT prompting — which is the only difference, and the reason `deny`
    // is the right value for an unattended run.
    const merged = mergeRowAndSettings({ gateMode: 'ask', gatePolicies: { write: 'always-approve' } })
    assert.equal(merged.gateMode, 'deny')

    const { ctx, handler, dispose } = mount({
      ...SPEC_OPTS,
      gateMode: merged.gateMode as never,
      gatePolicies: merged.gatePolicies as never,
    })
    try {
      const { decision, delegated } = await tool(handler, 'write')
      assert.equal(delegated, false, 'deny refuses here rather than passing the call on')
      assert.equal(decision.kind, 'deny')
      assert.match(decision.reason ?? '', /REVIEW REQUESTED/)
    } finally {
      dispose()
      void ctx
    }
  })
})

// Shared by the two settings tests above so each asserts the merge and not a
// second copy of the same spec.
const SPEC_OPTS: CreatePolicyOptions = {
  spec: SPEC,
  gatePolicies: { write: 'always-approve' },
}

// The judge is the one setting that is NOT a plain value: `judge: laya` in the
// file is a STRING, and the plugin has to build a Judge object out of it.
//
// Reproduced live 2026-10-03 on a profile from make-profile.sh, with a settings
// file the panel itself had written: the boot died on the first step with
// `dsh: UNKNOWN: policy.judge.score is not a function`. The merge was spread
// AFTER the constructed `judge:` in index.ts, so the string overwrote the Judge
// and nothing failed until a step asked it for a score.
//
// So this drives `apply` — the CALL SITE — not `resolveJudge` alone. The first
// version of this test called the resolver and passed against the live bug,
// which is the same mistake in a new place: a test that exercises the helper
// proves the helper works, not that the helper is reached correctly.

test('apply builds a Judge from the settings file, not the string in it', async () => {
  await withSettingsFile('judge: none\n', async () => {
    const { apply: applyRow } = await import('../src/index.ts')
    const { ctx, handler } = fakeCtx()
    // The row asks for `laya`; the file says `none`. Either can win — what must
    // never reach the policy is the STRING.
    applyRow(ctx as never, {
      spec: SPEC,
      judge: 'laya',
      judgeBaseURL: 'http://127.0.0.1:1',
      gatePolicies: { write: 'auto' },
      dashboard: { enabled: false },
    } as never)
    await handler('agent/pre-step')(
      { agent: AGENT, messages: [], turn: 1, step: 1, signal: new AbortController().signal },
      async () => ({ kind: 'enter', messages: [] }),
    )
    // `proceed` is the gate's word for "delegate to the harness"; the harness
    // then answers `allow`. Both together mean the judge was consulted (or not
    // needed) and was callable. A string judge throws inside `next()` or inside
    // the gate, which is the crash this test exists for.
    let delegated = false
    await handler('tools/pre-execute')(
      { agent: AGENT, name: 'write', arguments: { path: 'a.ts' } },
      async () => { delegated = true; return { kind: 'allow' } },
    )
    assert.equal(delegated, true, 'the call reached the harness, so no judge call threw')
  })
})

// ── a call that RAN and failed ──────────────────────────────────────────────

test('a tool that RAN and FAILED climbs the ladder; one that succeeded does not', async () => {
  // The regression for §1q, driven end to end because the policy map is the
  // plugin's own and there is no accessor for it.
  //
  // Before `tools/post-execute` was subscribed, `policy.pending.error` was set in
  // exactly one branch — the one where the GATE blocks a call. A `bash` that
  // executed and exited 1 therefore left `error: false`, `reviewStep` read the
  // step as a success, and the ladder climbed only when the gate stopped the
  // loop. `error-cascade` never counted a visibly failing run either.
  //
  // The route for a step is decided on `agent/pre-step` (that is where
  // `reviewStep` runs and where the previous step's outcome is committed);
  // `agent/request` only reports the route already decided. Both are driven,
  // in that order, because that is the order the harness uses.
  // `bash` is deliberately OPEN in the gate. `SPEC`'s actuator does not name it,
  // so it resolves `irreversible` and the gate would BLOCK the call — and a
  // blocked call sets `pending.error` on its own, which makes this test pass
  // while measuring the gate instead of the listener. That is not a hypothetical:
  // the first version of this test did exactly that and passed with the flip
  // removed. An assertion that survives the removal of the thing it names is not
  // an assertion.
  const { ctx, handler, dispose } = mount({
    spec: SPEC,
    gatePolicies: { bash: 'auto', read: 'auto', glob: 'auto', grep: 'auto', edit: 'auto', write: 'always-approve' },
  })
  const agent = AGENT
  const routes: string[] = []

  const step = async (isError: boolean): Promise<void> => {
    await handler('tools/pre-execute')(
      { agent, name: 'bash', arguments: { command: 'true' } },
      async () => ({ kind: 'allow' }),
    )
    await handler('tools/post-execute')(
      { agent, name: 'bash', call: { id: `c-${String(routes.length)}` } },
      { isError, error: { message: 'exit 1' }, content: [] },
      async () => undefined,
    )
    const next = routes.length + 2
    await handler('agent/pre-step')(
      { agent, messages: [], turn: 1, step: next, signal: new AbortController().signal },
      async () => ({ kind: 'enter', messages: [] }),
    )
    const routed = await handler('agent/request')(
      { agent, step: next },
      async () => ({ kind: 'ok', messages: [] }),
    )
    const model = (routed as { model?: string }).model
    routes.push(typeof model === 'string' ? model : 'none')
  }

  await step(true)
  await step(true)
  assert.deepEqual(routes, ['cheap', 'pricy'],
    'two consecutive FAILED calls move the ladder, which is what escalateAfterFailures: 2 means')

  // And the control: a call that SUCCEEDS must not count as a failure, or every
  // ordinary step would climb. The ladder is also sticky, so this asserts it does
  // not climb BACK.
  const control: string[] = []
  for (const isError of [false, false]) {
    await handler('tools/pre-execute')(
      { agent, name: 'bash', arguments: { command: 'true' } },
      async () => ({ kind: 'allow' }),
    )
    await handler('tools/post-execute')(
      { agent, name: 'bash', call: { id: `k-${String(control.length)}` } },
      { isError, content: [] },
      async () => undefined,
    )
    const next = control.length + 2
    await handler('agent/pre-step')(
      { agent, messages: [], turn: 1, step: next, signal: new AbortController().signal },
      async () => ({ kind: 'enter', messages: [] }),
    )
    const routed = await handler('agent/request')(
      { agent, step: next },
      async () => ({ kind: 'ok', messages: [] }),
    )
    const model = (routed as { model?: string }).model
    control.push(typeof model === 'string' ? model : 'none')
  }
  assert.deepEqual(control, ['pricy', 'pricy'],
    'success never climbs the ladder, and the ladder never moves back down')

  dispose()
})

test('error-cascade fires in the plugin path: three failed CALLS raise the critical signal', async () => {
  // `noteToolOutcomes` exists for exactly this and its own doc says the flag "can
  // only be filled in afterwards" because the observation is committed before
  // the tools run. It was called from NOTHING in src/ — so the detector that
  // raises `error-cascade`, one of only two CRITICAL signals, could never fire
  // in a DSH deployment, while its own unit test passed by calling the helper
  // directly (§1r).
  //
  // The signals are read back off the dashboard state the plugin writes, which
  // is the only surface that carries them: `prepareReview`'s return value is not
  // exposed to a test the way `reviewStep`'s is.
  const seen: { signals: readonly { kind: string, severity?: string }[] }[] = []
  const { ctx, handler, dispose } = mount({
    spec: SPEC,
    gatePolicies: { bash: 'auto', read: 'auto', glob: 'auto', grep: 'auto', edit: 'auto', write: 'always-approve' },
    onSignals: (signals: readonly { kind: string, severity?: string }[]) => {
      seen.push({ signals })
    },
  })
  const agent = AGENT

  // Four failed steps: the observation for step N is committed at step N+1, so
  // three failures need four steps before the third is committed — which is
  // precisely the "one step late" the helper's doc warns about.
  for (let step = 1; step <= 5; step += 1) {
    await handler('tools/pre-execute')(
      { agent, name: 'bash', arguments: { command: 'false' } },
      async () => ({ kind: 'allow' }),
    )
    await handler('tools/post-execute')(
      { agent, name: 'bash', call: { id: `x-${String(step)}` } },
      { isError: true, error: { message: 'exit 1' }, content: [] },
      async () => undefined,
    )
    await handler('agent/pre-step')(
      { agent, messages: [], turn: 1, step: step + 1, signal: new AbortController().signal },
      async () => ({ kind: 'enter', messages: [] }),
    )
  }

  const raised = seen.flatMap(s => s.signals).filter(sig => sig.kind === 'error-cascade')
  assert.ok(raised.length > 0,
    `error-cascade must fire on three consecutive failed CALLS; the plugin recorded ${JSON.stringify(seen.map(s => s.signals.map(x => x.kind)))}`)
  assert.equal(raised[0]?.severity, 'critical',
    'it is one of only two CRITICAL signals — a run that is visibly failing must be able to stop one')

  dispose()
})



test('four of the six detectors reach the plugin path, and the fifth is unreachable because nothing constructs its input', async () => {
  // §1r gave the plugin path a readable signals sink, which makes this answerable
  // for the first time: of the six detectors, how many can actually raise in a
  // DSH deployment?
  //
  // Measured through the REAL `reviewStep` with the plugin's own SPEC: this run
  // raises exactly
  //
  //   error-cascade, excessive-steps, tool-cycle, tool-dominance
  //
  // The remaining two are reachable ON DEMAND and not exercised here:
  //   `budget`    needs spentUSD / costBudgetUSD >= 0.8; this run spends nothing,
  //               because every step is a stub and no attempt is priced.
  //   `quality-drop` needs `baselineScore`, which the plugin NEVER sets — there is
  //               no `baselineScore` in src/plugin.ts, so this detector cannot
  //               raise at all. Asserted as the fact it is, so it cannot drift.
  //
  // The run needs TWO shapes because two detectors have incompatible
  // requirements, and forcing one run to satisfy both proves neither:
  // `tool-dominance` needs one tool to OWN MOST of the run (25 identical `bash`
  // calls leave it nothing to compare against), while `tool-cycle` needs three
  // TRAILING identical (tool, argsKey) pairs (a mixed tail never produces one).
  //
  // Driven through `reviewStep` rather than the hooks on purpose: the hooks are
  // about DELIVERY, and this question is about the detectors. The hook path is
  // proven by the test above, which shows the same signals arriving through them.
  // `SPEC` has `maxSteps: 4`, which is the point of the CEILING tests, so a
  // 28-step run stops there and nothing is detected. This question needs a
  // generous ceiling, so it uses one — the same reason the spin test below
  // declares its own `maxSteps: 100`.
  const roomy: NonNullable<CreatePolicyOptions['spec']> = { ...SPEC, maxSteps: 100 }
  const seen = new Set<string>()
  const policy = createPolicy({ spec: roomy, onSignals: (signals) => {
    for (const signal of signals) seen.add(signal.kind)
  } })
  const names = ['bash', 'bash', 'bash', 'bash', 'bash', 'bash', 'read', 'glob', 'grep']
  for (let i = 1; i <= 28; i += 1) {
    policy.pending = { tool: names[i % names.length] ?? 'bash', argsKey: `a${String(i)}`, error: i % 3 === 0 }
    await reviewStep(policy, i)
  }
  for (let i = 0; i < 6; i += 1) {
    policy.pending = { tool: 'bash', argsKey: 'same', error: true }
    await reviewStep(policy, 29 + i)
  }

  assert.deepEqual([...seen].sort(), ['error-cascade', 'excessive-steps', 'tool-cycle', 'tool-dominance'],
    'these four must raise from the plugin path with the plugin\'s own spec')
  // `quality-drop` is unreachable in the plugin path for TWO reasons, and both
  // are checked here rather than one, because either alone is enough to silence
  // it and fixing only one would look like progress:
  //
  //   1. `prepareReview` is called here WITHOUT `baselineScore` — there is no such
  //      option in this plugin's call, so the detector's first condition is false.
  //   2. nothing writes `StepObservation.score` in this path, so even a baseline
  //      would find no score to compare against.
  //
  // The control proves (2) is the binding one: give the policy a baseline and a
  // falling per-step score, and the detector still cannot fire, because the
  // plugin's `prepareReview` call is the gate and it passes no baseline.
  const scored = createPolicy({
    spec: roomy,
    onSignals: (signals: readonly { kind: string }[]) => { for (const x of signals) seen.add(x.kind) },
  })
  for (let i = 1; i <= 4; i += 1) {
    scored.pending = { tool: 'bash', argsKey: `b${String(i)}`, error: false }
    await reviewStep(scored, i)
  }
  // Nothing in src/ writes `score` onto an observation, so the entries are
  // unscored — which is what makes the detector's second condition false.
  assert.equal(scored.history.some(entry => entry.score !== undefined), false,
    'the plugin path writes no per-step score, so quality-drop has nothing to compare')
  assert.equal(seen.has('quality-drop'), false,
    'quality-drop is unreachable in the plugin path — asserted as a FACT so it cannot drift silently')
})

test('the budget SIGNAL fires in the plugin path once a step is priced past 80%', async () => {
  // §1i listed `budget` as "reachable on demand" — in PROSE, with no
  // plugin-path test behind it, which is §1n's shape: a claim in a table that
  // reads like a measurement. This is that measurement.
  //
  // The threshold is deliberately generous and the spend is real, so the ONLY
  // thing that can produce `budget:critical` is `snapshot.spentUSD` reaching
  // `prepareReview` through the plugin's own `reviewStep` — which is the path
  // §1i says exists.
  const seen = new Set<string>()
  const { handler, dispose } = mount({
    spec: {
      ...SPEC,
      maxSteps: 99,
      // $15 against $12 spent = exactly 0.8, so the signal fires WITHOUT the
      // ceiling rejecting first. A $10 ceiling rejects at step 1 and no signal is
      // ever produced — which is what the first version of this test measured,
      // and it reads as "unreachable" rather than "the ceiling got there first".
      costBudgetUSD: 15,
      prices: { 'onegw/execution': { inputPerMTok: 0.3, outputPerMTok: 1.2 } },
      controller: { ladder: [{ provider: 'onegw', model: 'execution' }] },
    },
    onSignals: (signals: readonly { kind: string }[]) => { for (const s of signals) seen.add(s.kind) },
  })

  // The numbers are the whole subtlety, and two of them are the OPPOSITE of
  // what the first draft had:
  //
  //   40 attempts x $0.30 = $12 spent.
  //   against a $10 ceiling that is 120% -> the CEILING rejects at step 1, and
  //     the run never reaches `reviewStep`, so NO signal is produced at all. That
  //     is the first version of this test, and it read as "budget is
  //     unreachable" — which is why the ceiling must sit ABOVE the signal.
  //   against a $15 ceiling that is 80% exactly -> the signal fires and the run
  //     continues.
  //
  // And each step needs its OWN settled attempt, because `spendSettledUsage`
  // advances `pricedThroughSeq` past whatever it prices: one session with one
  // `assistant/message` is priced once and never again, which is the dedupe
  // working, not the meter stalling.
  //
  // Reuse the file's own settled-session fixture rather than stubbing `spentUSD`:
  // a stubbed number would prove the arithmetic and not the wiring.
  const agent = {
    session: settledSession(Array.from({ length: 40 }, (_, i) => ({ ...PRICED_MSG, seq: i }))),
  }
  for (let step = 1; step <= 40; step += 1) {
    await preStep(handler, step, agent)
  }
  dispose()

  assert.ok(seen.has('budget'),
    `the budget signal must reach the plugin path once the meter moves; saw ${[...seen].sort().join(', ') || '(none)'}`)
})
