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
// Type-only, so these are erased at runtime: the measurement modules are
// authored concurrently, and this file must pin their shapes without
// loading their code.
import type { MetricsSummary } from '../src/metrics.ts'
import type { Recommendation } from '../src/optimizer.ts'
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
  const html = await page.text()
  // The shell contract: token bootstrap for the bundle, the mount point the
  // bundle renders into, and the bundle script tag. Application logic lives
  // in the bundle, not here.
  assert.match(html, /HITL approvals/, 'the dashboard page is served')
  assert.match(html, /__FL_TOKEN__/, 'the shell bootstraps the token for the bundle')
  assert.match(html, /id="root"/, 'the shell carries the mount point')
  assert.match(html, /dashboard-bundle\.js/, 'the shell loads the bundle')

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

test('without a dashboard config, the dashboard still starts (on by default)', () => {
  const { ctx, registered } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: false, port: 0 } })
  assert.deepEqual(registered(), ['session/event', 'agent/pre-step', 'agent/request', 'tools/pre-execute'])
  assert.ok(!registered().includes('approval/request'), 'disabled dashboard answers nothing')
  dispose()
})

test('with enabled:false, no approval listener is registered', () => {
  const { ctx, registered } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: false } })
  assert.ok(!registered().includes('approval/request'))
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

test('brief enabled without a gateway key fails apply at load, loudly', (t) => {
  // `DSH_CREDENTIALS` points the store read at nowhere, and the key env vars
  // are cleared for the duration — simulating the keyless machine (CI) where
  // this failure must fire. Restored afterwards so no other test observes it.
  const savedKey = process.env.ONEGW_API_KEY
  const savedAlt = process.env.ONEGE_API_KEY
  const savedStore = process.env.DSH_CREDENTIALS
  delete process.env.ONEGW_API_KEY
  delete process.env.ONEGE_API_KEY
  process.env.DSH_CREDENTIALS = '/nonexistent-credentials.yaml'
  t.after(() => {
    if (savedKey !== undefined) process.env.ONEGW_API_KEY = savedKey
    if (savedAlt !== undefined) process.env.ONEGE_API_KEY = savedAlt
    if (savedStore !== undefined) process.env.DSH_CREDENTIALS = savedStore
    else delete process.env.DSH_CREDENTIALS
  })
  const { ctx, registered } = fakeCtx()
  assert.throws(
    () => apply(ctx as never, {
      spec: SPEC,
      dashboard: { enabled: true, port: 0, brief: { enabled: true, model: 'm' } },
    }),
    /no gateway key/,
    'briefs were explicitly enabled: silence would be the worse failure',
  )
  assert.deepEqual(registered(), [], 'nothing registered after the load failure')
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

// ── the review brief ───────────────────────────────────────────────────────

test('parseDashboardConfig: brief defaults to disabled without a model', () => {
  const cfg = parseDashboardConfig({})
  assert.deepEqual(cfg.brief, { enabled: false, model: undefined, maxTokens: 1024, timeoutMs: 15_000 })
})

test('parseDashboardConfig: every bad brief field fails at load, naming dashboard.brief.<field>', () => {
  const bad: [Record<string, unknown>, RegExp][] = [
    [{ brief: { enabled: true } }, /dashboard\.brief\.model is required/],
    [{ brief: { model: '' } }, /dashboard\.brief\.model/],
    [{ brief: { model: 42 } }, /dashboard\.brief\.model/],
    [{ brief: { enabled: 'yes' } }, /dashboard\.brief\.enabled/],
    [{ brief: { model: 'm', maxTokens: 0 } }, /dashboard\.brief\.maxTokens/],
    [{ brief: { model: 'm', timeoutMs: -1 } }, /dashboard\.brief\.timeoutMs/],
    [{ brief: 'on' }, /dashboard\.brief must be a mapping/],
  ]
  for (const [config, pattern] of bad) {
    assert.throws(
      () => parseDashboardConfig(config as never),
      (error: unknown) => error instanceof TypeError && pattern.test(error.message),
      `expected ${JSON.stringify(config)} to throw ${String(pattern)}`,
    )
  }
})

test('the brief lifecycle rides the SSE frame without touching the ask', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  const { next } = delegatingNext()
  const pending = dash.answer(QUESTION, next)

  const claimed = await getState(dash)
  assert.equal(claimed.pending.length, 1)
  const id = claimed.pending[0]?.id ?? ''
  assert.equal(claimed.pending[0]?.briefState, 'none')

  dash.briefs.markBriefPending(id)
  const marking = await getState(dash)
  assert.equal(marking.pending[0]?.briefState, 'pending')

  dash.briefs.recordBrief(id, [
    { kind: 'heading', text: 'write_file' },
    { kind: 'list', items: ['touches one file'] },
  ])
  const ready = await getState(dash)
  assert.equal(ready.pending[0]?.briefState, 'ready')
  assert.deepEqual(ready.pending[0]?.brief, [
    { kind: 'heading', text: 'write_file' },
    { kind: 'list', items: ['touches one file'] },
  ])

  // The ask itself is untouched: the human still decides, by POST as ever.
  const res = await post(dash, id, 'allowed-once', { token: dash.token })
  assert.equal(res.status, 200)
  assert.equal(await pending, 'allowed-once')
  close()
})

test('a failed brief leaves the ask fully answerable', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  const { next } = delegatingNext()
  const pending = dash.answer(QUESTION, next)

  const claimed = await getState(dash)
  const id = claimed.pending[0]?.id ?? ''
  dash.briefs.markBriefPending(id)
  dash.briefs.recordBrief(id, undefined)
  const failed = await getState(dash)
  assert.equal(failed.pending[0]?.briefState, 'failed')
  assert.equal(failed.pending[0]?.brief, undefined)

  const res = await post(dash, id, 'rejected', { token: dash.token })
  assert.equal(res.status, 200)
  assert.equal(await pending, 'rejected')
  close()
})

test('a brief landing after the settle is swallowed, not resurrected', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  const { next } = delegatingNext()
  const pending = dash.answer(QUESTION, next)

  const claimed = await getState(dash)
  const id = claimed.pending[0]?.id ?? ''
  dash.briefs.markBriefPending(id)
  const res = await post(dash, id, 'allowed-once', { token: dash.token })
  assert.equal(res.status, 200)
  assert.equal(await pending, 'allowed-once')

  // The explainer resolves late; the entry is gone, so this is a no-op.
  dash.briefs.recordBrief(id, [{ kind: 'heading', text: 'late' }])
  const after = await getState(dash)
  assert.deepEqual(after.pending, [])
  close()
})

test('the page carries a nonce CSP covering its script and style', async (t) => {
  const { dash } = await started(t)
  const page = await fetch(`${dash.url}?token=${dash.token}`)
  assert.equal(page.status, 200)
  const csp = page.headers.get('content-security-policy') ?? ''
  assert.match(csp, /default-src 'none'/)
  assert.match(csp, /connect-src 'self'/)
  assert.match(csp, /frame-ancestors 'none'/)
  const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1]
  assert.ok(nonce !== undefined && nonce !== '', 'a per-response nonce is issued')
  const html = await page.text()
  assert.ok(!html.includes('__CSP_NONCE__'), 'no placeholder survives substitution')
  assert.ok(html.includes(`nonce="${nonce}"`), 'the nonce reaches the page elements')
})

// ── measurement surfaces: metrics and recommendations ──────────────────────

/** A summary shaped exactly like `metrics.ts` will produce one. */
const METRICS: MetricsSummary = {
  runs: 7,
  provisional: true,
  malformed: 1,
  cost: {
    perRun: { p50: 0.42, p95: 1.2, latest: 0.5, baseline: 0.4 },
    perStep: { p50: 0.05, p95: 0.2, latest: 0.06 },
    goalMetCost: 1.1,
    unpricedSteps: 0,
  },
  speed: {
    steps: { p50: 8, p95: 12, latest: 9 },
    latencyMs: { p50: 900, p95: 2500, latest: 1100, baseline: 1000 },
    wallMs: { p50: 9000, p95: 20000, latest: 12000 },
    latencyKind: 'mixed',
  },
  quality: {
    goalMetRate: 0.71,
    firstPassRate: 0.5,
    meanJudge: 2.4,
    reviewFraction: 0.3,
  },
  alerts: [{ kind: 'cost-spike', severity: 'warning', detail: 'latest run cost 2× p50' }],
}

/** A recommendation shaped exactly like `optimizer.ts` will produce one. */
const RECOMMENDATION: Recommendation = {
  lever: 'ladder-rung',
  current: '1',
  proposed: '2',
  evidence: 'runs 4–7 hit the ceiling before the goal; judge still met.',
  confidence: 0.8,
  questionType: 'choice',
}

test('setMetrics and setRecommendations land in the snapshot', async (t) => {
  const { dash, state } = await started(t)
  state.setMetrics(METRICS)
  state.setRecommendations([RECOMMENDATION])

  const snapshot = await getState(dash)
  assert.deepEqual(snapshot.metrics, METRICS, 'the summary rides the same snapshot as runs')
  assert.deepEqual(snapshot.recommendations, [RECOMMENDATION])

  // Replacement, not merge: a second feed replaces the first entirely, so
  // the page can never render a blend of two roll-ups.
  state.setRecommendations([])
  assert.deepEqual((await getState(dash)).recommendations, [])
})

test('SSE frames carry the measurement surfaces too', async (t) => {
  const { dash, state } = await started(t)
  state.setMetrics(METRICS)
  state.setRecommendations([RECOMMENDATION])

  const controller = new AbortController()
  const res = await fetch(`${dash.url}api/events?token=${encodeURIComponent(dash.token)}`, {
    signal: controller.signal,
  })
  assert.equal(res.status, 200)
  // A first frame must arrive promptly on loopback; the guard turns "never"
  // into a bounded failure so a hung stream cannot hang the whole suite.
  const guard = setTimeout(() => controller.abort(), 3000)
  guard.unref?.()
  t.after(() => { clearTimeout(guard); controller.abort() })

  const reader = res.body?.getReader()
  assert.ok(reader !== undefined, 'the SSE body is a stream')
  const decoder = new TextDecoder()
  let text = ''
  let frame: DashboardSnapshot | undefined
  while (frame === undefined) {
    const chunk = await reader.read()
    assert.equal(chunk.done, false, 'the stream closed before its first data frame')
    text += decoder.decode(chunk.value, { stream: true })
    // Chunks may split anywhere; wait until one full `data:` line is present.
    const match = /^data: (.*)$/m.exec(text)
    if (match?.[1] !== undefined) frame = JSON.parse(match[1]) as DashboardSnapshot
  }
  assert.deepEqual(frame.metrics, METRICS)
  assert.deepEqual(frame.recommendations, [RECOMMENDATION])
})

test('/api/state requires the token even when metrics are present', async (t) => {
  const { dash, state } = await started(t)
  state.setMetrics(METRICS)
  state.setRecommendations([RECOMMENDATION])

  assert.equal((await fetch(`${dash.url}api/state`)).status, 401, 'measurement data is still protected data')
  assert.equal((await fetch(`${dash.url}api/state?token=wrong`)).status, 401)

  const res = await fetch(`${dash.url}api/state`, {
    headers: { 'x-dashboard-token': dash.token },
  })
  assert.equal(res.status, 200)
  const body = await res.json() as DashboardSnapshot
  assert.ok(body.metrics !== undefined, 'the authorized read still carries the data')
})

test('there is no auto-apply endpoint: GET and POST /api/apply both 404', async (t) => {
  const { dash, state } = await started(t)
  state.setRecommendations([RECOMMENDATION])

  // Deliberately WITH a valid token: the absence is a design decision, not
  // an auth wall. Applying a recommendation is a human copying its config
  // snippet by hand — a local model must never loosen its own ceiling.
  const get = await fetch(`${dash.url}api/apply?token=${encodeURIComponent(dash.token)}`)
  assert.equal(get.status, 404, 'GET must not exist either')

  const post = await fetch(`${dash.url}api/apply`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-dashboard-token': dash.token,
      origin: new URL(dash.url).origin,
    },
    body: JSON.stringify({ lever: RECOMMENDATION.lever, proposed: RECOMMENDATION.proposed }),
  })
  assert.equal(post.status, 404, 'the model must never be able to apply its own advice')
})

test('the bundle and the theme are served under the same token gate', async (t) => {
  const { dash } = await started(t)

  // The JS embeds the approval POST paths, so it is protected data too —
  // not a public static asset.
  assert.equal((await fetch(`${dash.url}dashboard-bundle.js`)).status, 401)
  assert.equal((await fetch(`${dash.url}dashboard.css`)).status, 401)
  assert.equal((await fetch(`${dash.url}dashboard-bundle.js?token=wrong`)).status, 401)

  const js = await fetch(`${dash.url}dashboard-bundle.js?token=${dash.token}`)
  assert.equal(js.status, 200)
  assert.match(js.headers.get('content-type') ?? '', /javascript/)
  const body = await js.text()
  // The assistant-ui thread, not the old hand-built page: the bundle renders
  // approvals as tool parts and reads the SSE feed. Size-guard the artifact
  // so a dependency accident (two Reacts, a dev build) fails loudly.
  assert.match(body, /gate-decision/, 'approval tool parts are rendered by the bundle')
  assert.match(body, /api\/events/, 'the bundle reads the SSE feed')
  assert.ok(body.length > 100_000, `bundle suspiciously small: ${String(body.length)} chars`)
  assert.ok(body.length < 3_000_000, `bundle suspiciously large: ${String(body.length)} chars`)

  const css = await fetch(`${dash.url}dashboard.css?token=${dash.token}`)
  assert.equal(css.status, 200)
  assert.match(css.headers.get('content-type') ?? '', /css/)
  assert.match(await css.text(), /\.fl-gate/, 'the theme carries the approval card classes')
})

test('absent metrics/recommendations still produce a valid snapshot shape', async (t) => {
  const { dash } = await started(t)
  const snapshot = await getState(dash)
  // Exact key set: absent surfaces are absent keys, never zeroed numbers
  // that would read as "measured, and it is all fine".
  assert.deepEqual(snapshot, {
    answers: true,
    pending: [],
    runs: [],
    feed: [],
  })
})
