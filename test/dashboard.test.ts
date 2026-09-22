/**
 * The dashboard's checks: config validation, the HTTP surface, and — the one
 * that carries the safety property — the answerer's guard.
 *
 * The guard is what makes this feature safe to ship: a dashboard must claim an
 * `approval/request` ONLY while a browser tab is connected (and `answers` is
 * on), and delegate via `next()` otherwise, so the Web UI's composer panel and
 * the fail-closed default behave exactly as they did before the dashboard
 * existed. Every failure path (abort, timeout, disconnect, stop) must settle
 * the ask rather than leave the harness's tool call hanging.
 *
 * The plugin half drives `apply` through a fake ctx that records handlers and
 * their options — the same technique `test/plugin-approval.test.ts` uses — so
 * registration (including `{prepend: true}`) and fail-at-load validation are
 * asserted without a harness.
 *
 * Run: `node --experimental-strip-types --test test/dashboard.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'

import { DashboardState, parseDashboardConfig, startDashboard } from '../src/dashboard.ts'
import type { DashboardHandle, DashboardSnapshot } from '../src/dashboard.ts'
import { apply } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'

// ── helpers ────────────────────────────────────────────────────────────────

type Question = Parameters<DashboardHandle['answer']>[0]
type AnswerOutcome = Awaited<ReturnType<DashboardHandle['answer']>>

/** What this file uses of node:test's `TestContext` — only the hooks. */
interface TestT {
  after(fn: () => void | Promise<void>): void
}

/** Fetch `/api/state` with the header token; assert 200 and return the body. */
async function getState(dash: DashboardHandle): Promise<DashboardSnapshot> {
  const res = await fetch(`${dash.url}api/state`, {
    headers: { 'x-dashboard-token': dash.token },
  })
  assert.equal(res.status, 200)
  return await res.json() as DashboardSnapshot
}

/** Open the SSE stream; the returned function disconnects it. */
async function connectSse(dash: DashboardHandle): Promise<() => void> {
  const controller = new AbortController()
  const res = await fetch(`${dash.url}api/events?token=${encodeURIComponent(dash.token)}`, {
    signal: controller.signal,
  })
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type') ?? '', /text\/event-stream/)
  return () => controller.abort()
}

/** POST one approval decision; `opts` override token/origin for auth tests. */
async function post(
  dash: DashboardHandle,
  id: string,
  outcome: string,
  opts: { token?: string, origin?: string, body?: string } = {},
): Promise<Response> {
  const origin = opts.origin ?? new URL(dash.url).origin
  return fetch(`${dash.url}api/approvals/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...opts.token === undefined ? {} : { 'x-dashboard-token': opts.token },
      origin,
    },
    body: opts.body ?? JSON.stringify({ outcome }),
  })
}

/** An `answer` call that records delegation and never claims. */
function delegatingNext(): { next: () => Promise<AnswerOutcome>, delegated: () => boolean } {
  let delegated = false
  return {
    next: async () => {
      delegated = true
      return 'unavailable' as const
    },
    delegated: () => delegated,
  }
}

/** Start a dashboard on a free port and register cleanup with the test. */
async function started(
  t: TestT,
  config: Record<string, unknown> = {},
): Promise<{ dash: DashboardHandle, state: DashboardState }> {
  const state = new DashboardState()
  const dash = startDashboard({ enabled: true, port: 0, ...config }, state)
  t.after(() => dash.stop())
  await dash.ready
  return { dash, state }
}

/** A context that records `on(event, fn, opts)` registrations. */
function fakeCtx(): {
  ctx: unknown
  handler: (event: string) => (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>
  optsOf: (event: string) => unknown
  registered: () => string[]
} {
  const handlers = new Map<string, { fn: (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>, opts?: unknown }>()
  return {
    ctx: {
      on(
        event: string,
        fn: (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>,
        opts?: unknown,
      ): () => void {
        handlers.set(event, { fn, opts })
        return () => { handlers.delete(event) }
      },
    },
    handler(event: string) {
      const entry = handlers.get(event)
      assert.ok(entry !== undefined, `no handler registered for "${event}"`)
      return entry.fn
    },
    optsOf: (event: string) => handlers.get(event)?.opts,
    registered: () => [...handlers.keys()],
  }
}

/**
 * A spec whose actuator makes `write_file` irreversible, so the gate asks.
 * Same shape as `test/plugin-approval.test.ts`'s SPEC — the dashboard tests
 * reuse it rather than inventing a second one that could drift.
 */
const SPEC: NonNullable<CreatePolicyOptions['spec']> = {
  goal: 'the gated write is approved through the dashboard.',
  sensor: ['test output'],
  controller: { ladder: [{ model: 'cheap' }] },
  actuator: { write_file: 'irreversible' },
  feedback: 'the suite passes',
  termination: { successCommand: 'true', guards: ['no-progress'] },
  maxSteps: 8,
  costBudgetUSD: 1,
  prices: {},
}

const QUESTION: Question = {
  agent: { id: 'agent-42' },
  toolName: 'write_file',
  callId: 'call-9',
  reason: 'REVIEW REQUESTED (policy): write_file: irreversible — a human should review this.',
}

// ── config validation ──────────────────────────────────────────────────────

test('parseDashboardConfig: loopback defaults, generated token, bounded timeout', () => {
  const cfg = parseDashboardConfig({})
  assert.equal(cfg.host, '127.0.0.1')
  assert.equal(cfg.port, 8100)
  assert.equal(cfg.answers, true)
  assert.equal(cfg.answerTimeoutMs, 600_000)
  assert.match(cfg.token, /^[0-9a-f]{48}$/, 'a generated token is 24 random bytes, hex')
})

test('parseDashboardConfig: every bad field fails at load, naming dashboard.<field>', () => {
  const bad: [Record<string, unknown>, RegExp][] = [
    [{ port: 70_000 }, /dashboard\.port/],
    [{ port: -1 }, /dashboard\.port/],
    [{ host: '0.0.0.1' }, /dashboard\.host/],
    [{ host: 'example.com' }, /dashboard\.host/],
    [{ answers: 'yes' }, /dashboard\.answers/],
    [{ answerTimeoutMs: 0 }, /dashboard\.answerTimeoutMs/],
    [{ answerTimeoutMs: -5 }, /dashboard\.answerTimeoutMs/],
    [{ token: '' }, /dashboard\.token/],
    [{ enabled: 'true' }, /dashboard\.enabled/],
  ]
  for (const [config, pattern] of bad) {
    assert.throws(
      () => parseDashboardConfig(config as never),
      (error: unknown) => error instanceof TypeError && pattern.test(error.message),
      `expected ${JSON.stringify(config)} to throw ${String(pattern)}`,
    )
  }
  // Not even a mapping is refused the same way — loudly, not coerced.
  assert.throws(() => parseDashboardConfig('on' as never), /dashboard must be a mapping/)
})

// ── the HTTP surface ───────────────────────────────────────────────────────

test('the page and the state endpoint both require the token', async (t) => {
  const { dash } = await started(t)

  const noToken = await fetch(dash.url)
  assert.equal(noToken.status, 401, 'the page itself is not public')

  const badToken = await fetch(`${dash.url}?token=wrong`)
  assert.equal(badToken.status, 401)

  const page = await fetch(`${dash.url}?token=${dash.token}`)
  assert.equal(page.status, 200)
  assert.match(page.headers.get('content-type') ?? '', /text\/html/)
  assert.match(await page.text(), /HITL approvals/, 'the dashboard page is served')

  const stateNoToken = await fetch(`${dash.url}api/state`)
  assert.equal(stateNoToken.status, 401)

  // GET accepts the query form too, because EventSource cannot set headers.
  const viaQuery = await fetch(`${dash.url}api/state?token=${dash.token}`)
  assert.equal(viaQuery.status, 200)
})

test('the state snapshot has the shape the page renders', async (t) => {
  const { dash, state } = await started(t)
  state.recordStep('run-1', { step: 3, maxSteps: 12, spentUSD: 0.01, budgetUSD: 1, unpricedSteps: 0 })
  state.recordJudge('run-1', 2)
  state.recordRoute('run-1', 'cheap')
  state.note('approval', 'asked: write_file', 'run-1')

  const snapshot = await getState(dash)
  assert.equal(snapshot.answers, true)
  assert.deepEqual(snapshot.pending, [])
  assert.equal(snapshot.runs.length, 1)
  assert.equal(snapshot.runs[0]?.step, 3)
  assert.equal(snapshot.runs[0]?.judgeScore, 2)
  assert.equal(snapshot.runs[0]?.route, 'cheap')
  assert.equal(snapshot.feed.length, 1)
  assert.equal(snapshot.feed[0]?.kind, 'approval')
})

// ── the guard: claim only while a tab is watching ──────────────────────────

test('no connected client: answer delegates to next() and never claims', async (t) => {
  const { dash } = await started(t)
  const { next, delegated } = delegatingNext()
  const outcome = await dash.answer(QUESTION, next)
  assert.equal(outcome, 'unavailable')
  assert.equal(delegated(), true)
  const snapshot = await getState(dash)
  assert.deepEqual(snapshot.pending, [], 'nothing was claimed')
})

test('answers:false: a connected client still does not claim (observe-only)', async (t) => {
  const { dash } = await started(t, { answers: false })
  const close = await connectSse(dash)
  const { next, delegated } = delegatingNext()
  assert.equal(await dash.answer(QUESTION, next), 'unavailable')
  assert.equal(delegated(), true)
  close()
})

test('a connected client claims; POST allowed-once resolves the ask', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  t.after(close)

  const { next, delegated } = delegatingNext()
  const pending = dash.answer(QUESTION, next)
  // The claim is synchronous with the call when a client is connected.
  assert.equal(delegated(), false, 'must not delegate once claimed')

  const snapshot = await getState(dash)
  assert.equal(snapshot.pending.length, 1)
  const entry = snapshot.pending[0]
  assert.equal(entry?.toolName, 'write_file')
  assert.equal(entry?.callId, 'call-9')
  assert.equal(entry?.runId, 'agent-42')
  assert.match(entry?.reason ?? '', /REVIEW REQUESTED/, 'the reason the page renders is the gate text')

  const res = await post(dash, entry?.id ?? '', 'allowed-once', { token: dash.token })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, outcome: 'allowed-once' })

  assert.equal(await pending, 'allowed-once')
  const after = await getState(dash)
  assert.deepEqual(after.pending, [], 'the ask left the queue')
  const feed = after.feed.map(line => line.text).join('\n')
  assert.match(feed, /asked: write_file/)
  assert.match(feed, /approved: write_file/)
})

test('POST rejected resolves rejected; a second POST is 409', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  t.after(close)

  const pending = dash.answer(QUESTION, delegatingNext().next)
  const { id } = (await getState(dash)).pending[0] as { id: string }

  const first = await post(dash, id, 'rejected', { token: dash.token })
  assert.equal(first.status, 200)
  assert.equal(await pending, 'rejected')

  const second = await post(dash, id, 'rejected', { token: dash.token })
  assert.equal(second.status, 409, 'a late click reads as "already settled", not "not found"')
})

test('POST validation: no token 401, cross-origin 403, bad outcome 400, bad body 400', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  t.after(close)

  const pending = dash.answer(QUESTION, delegatingNext().next)
  const { id } = (await getState(dash)).pending[0] as { id: string }

  assert.equal((await post(dash, id, 'allowed-once', { token: '' })).status, 401)
  assert.equal((await post(dash, id, 'allowed-once', { token: 'nope' })).status, 401)
  assert.equal(
    (await post(dash, id, 'allowed-once', { token: dash.token, origin: 'http://evil.example' })).status,
    403,
    'a browser holding the token from another origin must still be refused',
  )
  assert.equal((await post(dash, id, 'unavailable', { token: dash.token })).status, 400,
    'the HTTP API decides allow/deny only; "unavailable" is not a human answer')
  assert.equal(
    (await post(dash, id, 'allowed-once', { token: dash.token, body: 'not json' })).status,
    400,
  )

  // None of the refusals consumed the ask.
  const res = await post(dash, id, 'allowed-once', { token: dash.token })
  assert.equal(res.status, 200)
  assert.equal(await pending, 'allowed-once')
})

test('an abort (the ask was withdrawn) cancels the pending approval', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  t.after(close)

  const controller = new AbortController()
  const pending = dash.answer({ ...QUESTION, signal: controller.signal }, delegatingNext().next)
  controller.abort()
  assert.equal(await pending, 'cancelled')
  assert.deepEqual((await getState(dash)).pending, [])
})

test('answerTimeoutMs expires the ask to unavailable, never a hang', async (t) => {
  const { dash } = await started(t, { answerTimeoutMs: 30 })
  const close = await connectSse(dash)
  t.after(close)

  const outcome = await dash.answer(QUESTION, delegatingNext().next)
  assert.equal(outcome, 'unavailable')
  const feed = (await getState(dash)).feed.map(line => line.text).join('\n')
  assert.match(feed, /expired: write_file/)
})

test('the last client disconnecting fails pending asks closed', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)

  const pending = dash.answer(QUESTION, delegatingNext().next)
  assert.equal((await getState(dash)).pending.length, 1)
  close()
  assert.equal(await pending, 'unavailable', 'a closed tab must not leave the run waiting')
})

test('stop() settles pending asks unavailable and closes the socket', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)

  const pending = dash.answer(QUESTION, delegatingNext().next)
  await dash.stop()
  assert.equal(await pending, 'unavailable')
  close()
  await assert.rejects(fetch(`${dash.url}api/state`), 'the listener is gone')
  // stop is idempotent: the t.after cleanup calls it again.
  await dash.stop()
})

// ── the plugin's wiring ────────────────────────────────────────────────────

test('without a dashboard config, no approval listener is registered', () => {
  const { ctx, registered } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC })
  assert.deepEqual(registered(), ['agent/pre-step', 'agent/request', 'tools/pre-execute'])
  dispose()
})

test('with the dashboard enabled, the answerer is registered PREPENDED', async (t) => {
  const { ctx, registered, optsOf, handler } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: true, port: 0 } })
  t.after(dispose)

  assert.ok(registered().includes('approval/request'))
  assert.deepEqual(
    optsOf('approval/request'),
    { prepend: true },
    'prepend is mandatory: the harness remote forwarder holds the request without '
    + 'calling next() while a Web UI tab is attached, so a later listener would be '
    + 'unreachable exactly when the UI is open',
  )

  // No client is connected on this fresh server, so the registered handler
  // must delegate — the composer path, untouched.
  let delegated = false
  const outcome = await handler('approval/request')(QUESTION, async () => {
    delegated = true
    return 'unavailable'
  })
  assert.equal(outcome, 'unavailable')
  assert.equal(delegated, true)
})

test('a bad dashboard field fails apply at load, naming the field', () => {
  const { ctx } = fakeCtx()
  assert.throws(
    () => apply(ctx as never, { spec: SPEC, dashboard: { enabled: true, port: 70_000 } }),
    /dashboard\.port/,
    'a typo must stop the plugin, not produce a server nobody can reach',
  )
  // Validation runs even when the dashboard is OFF — the typo is caught now,
  // not the day someone flips enabled: true.
  assert.throws(
    () => apply(ctx as never, { spec: SPEC, dashboard: { host: 'example.com' } }),
    /dashboard\.host/,
  )
})

/**
 * Apply a dashboard-enabled config, catching the greppable startup line.
 *
 * Two races this helper exists to lose:
 * - the line is printed from the server's `listening` event, which fires
 *   AFTER `apply()` returns — so the console must stay captured until it
 *   arrives, not be restored in a `finally` around the synchronous call;
 * - `t.after` hooks are registered BEFORE any assertion, so a failing assert
 *   cannot leak a listening server and hang the whole run.
 */
async function appliedWithDashboard(
  t: TestT,
  options: Record<string, unknown> = {},
): Promise<{
  url: URL
  token: string
  dispose: () => void
  registered: () => string[]
  optsOf: (event: string) => unknown
  handler: (event: string) => (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>
}> {
  const { ctx, registered, optsOf, handler } = fakeCtx()
  const lines: string[] = []
  const original = console.log
  const restore = (): void => { console.log = original }
  t.after(restore)
  let dispose: (() => void) | undefined
  t.after(() => { dispose?.() })

  console.log = (...args: unknown[]) => { lines.push(args.join(' ')) }
  let line: string | undefined
  try {
    dispose = apply(ctx as never, {
      spec: SPEC,
      dashboard: { enabled: true, port: 0 },
      ...options,
    })
    // Bind on port 0 is immediate in practice; 3s of slack is for a slow CI.
    for (let attempt = 0; attempt < 300 && line === undefined; attempt++) {
      line = lines.find(text => text.startsWith('feature-loop dashboard: '))
      if (line === undefined) await delay(10)
    }
  } finally {
    restore()
  }
  assert.ok(line !== undefined, 'startDashboard logs one greppable line on bind')

  // This exact line is `make dashboard`'s contract: grep it out of the
  // container log and rebuild the host URL — and its token — from it.
  const url = new URL(line.slice('feature-loop dashboard: '.length))
  assert.equal(url.searchParams.has('token'), true, 'the line carries ?token=…')
  return {
    url,
    token: url.searchParams.get('token') ?? '',
    dispose: () => { dispose?.() },
    registered,
    optsOf,
    handler,
  }
}

test('the logged URL line is greppable and the disposer stops the server', async (t) => {
  const { url, token, dispose, registered } = await appliedWithDashboard(t)
  assert.ok(registered().includes('approval/request'))

  const base = `${url.origin}${url.pathname}`
  const alive = await fetch(`${base}api/state?token=${encodeURIComponent(token)}`)
  assert.equal(alive.status, 200)

  dispose()
  await assert.rejects(fetch(`${base}api/state`), 'the disposer closed it')
})

test('the hooks feed the run state the page renders', async (t) => {
  const { url, token, handler } = await appliedWithDashboard(t)
  const state = async (): Promise<DashboardSnapshot> => {
    const res = await fetch(`${url.origin}${url.pathname}api/state?token=${encodeURIComponent(token)}`)
    assert.equal(res.status, 200)
    return await res.json() as DashboardSnapshot
  }

  // agent/request → the ladder's route lands on the run card.
  await handler('agent/request')({ agent: { id: 'run-7' }, step: 1 }, async () => ({}))
  // agent/pre-step → step numbers land on the run card.
  await handler('agent/pre-step')(
    { agent: { id: 'run-7' }, turn: {}, step: 1 },
    async () => ({ kind: 'enter', messages: [] }),
  )
  // tools/pre-execute → the gated write lands in the activity feed.
  const decision = await handler('tools/pre-execute')(
    { agent: { id: 'run-7' }, name: 'write_file', arguments: {} },
    async () => ({ kind: 'allow' }),
  )
  assert.equal((decision as { kind: string }).kind, 'ask', 'the gate still asks')

  const snapshot = await state()
  const run = snapshot.runs.find(record => record.runId === 'run-7')
  assert.ok(run !== undefined, 'the hooks created the run record')
  assert.equal(run.route, 'cheap')
  assert.equal(run.step, 1)
  assert.equal(run.maxSteps, 8)
  const feed = snapshot.feed.map(entry => `${entry.kind}: ${entry.text}`).join('\n')
  assert.match(feed, /gate: ask: write_file/, 'the block is visible to the human')
})
