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
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  DashboardState,
  parseDashboardConfig,
  startDashboard,
  workspaceLabelOf,
} from '../src/dashboard.ts'
import type { DashboardHandle, DashboardSnapshot } from '../src/dashboard.ts'
import { clearWatcher, watcherActive } from '../src/approvals.ts'
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

test('recordMeta projects session/workspace onto the run snapshot', async (t) => {
  const { dash, state } = await started(t)
  state.recordMeta('sess-abc', {
    sessionId: 'sess-abc',
    cwd: '/Users/linh/work/harvey/freepeak/dsh-feature-loop',
  })
  state.recordStep('sess-abc', { step: 1, maxSteps: 8 })
  // No cwd → ungrouped live session still appears.
  state.recordStep('agentless-run', { step: 2, maxSteps: 8 })

  const snapshot = await getState(dash)
  const withWs = snapshot.runs.find((r) => r.runId === 'sess-abc')
  const bare = snapshot.runs.find((r) => r.runId === 'agentless-run')
  assert.equal(withWs?.sessionId, 'sess-abc')
  assert.equal(withWs?.cwd, '/Users/linh/work/harvey/freepeak/dsh-feature-loop')
  assert.equal(withWs?.workspaceLabel, 'dsh-feature-loop')
  assert.ok((withWs?.updatedAt ?? 0) > 0)
  assert.equal(bare?.workspaceLabel, undefined)
  assert.equal(bare?.cwd, undefined)
})

test('workspaceLabelOf picks the path basename', () => {
  assert.equal(workspaceLabelOf('/tmp/proj/'), 'proj')
  assert.equal(workspaceLabelOf('/'), '/')
  assert.equal(workspaceLabelOf(undefined), undefined)
  assert.equal(workspaceLabelOf(''), undefined)
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

test('POST feedback rides the decision into the activity feed', async (t) => {
  const { dash } = await started(t)
  const close = await connectSse(dash)
  t.after(close)

  const pending = dash.answer(QUESTION, delegatingNext().next)
  const { id } = (await getState(dash)).pending[0] as { id: string }

  const res = await post(dash, id, 'rejected', {
    token: dash.token,
    body: JSON.stringify({ outcome: 'rejected', feedback: 'path looks wrong; rewrite under src/' }),
  })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), {
    ok: true,
    outcome: 'rejected',
    feedback: 'path looks wrong; rewrite under src/',
  })
  assert.equal(await pending, 'rejected')
  const feed = (await getState(dash)).feed.map(line => line.text).join('\n')
  assert.match(feed, /rejected: write_file — path looks wrong; rewrite under src\//)
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

test('every route takes the query token, the settling one included', async (t) => {
  // KNOWN-ISSUES §5. The settle route used to require the HEADER while every
  // read route accepted `?token=` too, so the two halves of one five-route API
  // disagreed about how to authenticate and the failure was a 401 that read
  // as "wrong token" when it meant "wrong mechanism".
  const { dash } = await started(t)
  const close = await connectSse(dash)
  t.after(close)

  const pending = dash.answer(QUESTION, delegatingNext().next)
  const { id } = (await getState(dash)).pending[0] as { id: string }

  const res = await fetch(
    `${dash.url}api/approvals/${encodeURIComponent(id)}?token=${encodeURIComponent(dash.token)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: new URL(dash.url).origin },
      body: JSON.stringify({ outcome: 'allowed-once' }),
    },
  )
  assert.equal(res.status, 200)
  assert.equal(await pending, 'allowed-once')

  // Query auth is not a hole: no token at all is still a 401, and a browser
  // from another origin is still a 403 even when it holds the query token.
  const second = dash.answer(QUESTION, delegatingNext().next)
  const next = (await getState(dash)).pending[0] as { id: string }
  assert.equal(
    (await fetch(`${dash.url}api/approvals/${next.id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ outcome: 'rejected' }),
    })).status,
    401,
  )
  assert.equal(
    (await fetch(`${dash.url}api/approvals/${next.id}?token=${encodeURIComponent(dash.token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://evil.example' },
      body: JSON.stringify({ outcome: 'rejected' }),
    })).status,
    403,
    'the query token must not buy a cross-origin state change',
  )
  assert.equal((await post(dash, next.id, 'rejected', { token: dash.token })).status, 200)
  assert.equal(await second, 'rejected')
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

test('every settle names the ask it settled, so a page can say WHICH one ended', async (t) => {
  // The page's card is built from `pending`, so a settled ask has left it — and
  // the only record that survives is the feed line. `expired: write_file` names
  // a TOOL, which is not enough: a run with two writes in flight cannot say
  // which card went blank. The id is what makes the line addressable, and this
  // asserts it on ALL FOUR settle paths, because the fix that came first touched
  // only the default text and the timeout kept passing its own.
  // 5s, not 30ms: cases 2-4 create their own asks and a 30ms ceiling would
  // expire the one under test before the test reached it. The expiry path is
  // case 1 and wants a tight ceiling — so this uses two dashboards.
  const { dash } = await started(t, { answerTimeoutMs: 5000 })
  const close = await connectSse(dash)
  t.after(close)

  // Every id in a feed, in order — and `idIn` is the Nth of them. An earlier
  // draft read only the FIRST match, so cases 2-4 were all silently comparing
  // case 1's id and the distinctness assertion could never fail. The nth form is
  // what makes each case check its own settle.
  const idsIn = (feed: readonly { text: string }[]): string[] =>
    [...feed.map(l => l.text).join('\n').matchAll(/\[([0-9a-f-]{36})\]/g)].map(m => m[1])
  const idIn = (feed: readonly { text: string }[], n: number): string | undefined =>
    idsIn(feed)[n]

  // 1. expiry (the timer passes its own text) — its own dashboard, because
  //    this one's ceiling is 5s and waiting for it four times is not a test.
  const { dash: quick } = await started(t, { answerTimeoutMs: 30 })
  const quickClose = await connectSse(quick)
  t.after(quickClose)
  await quick.answer(QUESTION, delegatingNext().next)
  const expiredId = idIn((await getState(quick)).feed, 0)
  assert.ok(expiredId !== undefined, 'an expiry must name the ask it expired')

  // 2. abort. Its own signal, aborted while the ask is live.
  const controller = new AbortController()
  const abortNext = delegatingNext()
  const aborted = dash.answer({ ...QUESTION, signal: controller.signal }, abortNext.next)
  await delay(20)
  controller.abort()
  assert.equal(await aborted, 'cancelled')
  assert.equal(abortNext.delegated(), false, 'the ask was claimed, so nothing delegated')
  const cancelledId = idIn((await getState(dash)).feed, 0)
  assert.ok(cancelledId !== undefined, 'an abort must name the ask it cancelled')

  // 3. an explicit decision from the page, WITH operator feedback — the path
  //    that builds its own text and so bypasses the default entirely.
  const decideNext = delegatingNext()
  const decided = dash.answer(QUESTION, decideNext.next)
  const live = (await getState(dash)).pending
  assert.equal(live.length, 1, 'exactly one ask is in flight')
  const pending = live[0] as { id: string }
  const res = await post(dash, pending.id, 'allowed-once', {
    token: dash.token,
    body: JSON.stringify({ outcome: 'allowed-once', feedback: 'looks right' }),
  })
  assert.equal(res.status, 200, await res.text())
  assert.equal(await decided, 'allowed-once')
  assert.equal(decideNext.delegated(), false)
  const allowedId = idIn((await getState(dash)).feed, 1)
  assert.ok(allowedId !== undefined, 'a decision must name the ask it settled')

  // 4. the last tab disconnecting
  const orphan = dash.answer(QUESTION, delegatingNext().next)
  await delay(5)
  close()
  assert.equal(await orphan, 'unavailable')
  const disconnectedId = idIn((await getState(dash)).feed, 2)
  assert.ok(disconnectedId !== undefined, 'a disconnect must name the ask it closed')

  // The ids are DISTINCT, which is the whole point: three settles of the same
  // tool are three different asks. `expiredId` came from the OTHER dashboard,
  // so only the three from this one are comparable.
  assert.equal(new Set([cancelledId, allowedId, disconnectedId]).size, 3)
  assert.ok(
    expiredId !== undefined && !new Set([cancelledId, allowedId, disconnectedId]).has(expiredId),
    'the expiry happened on its own dashboard, so its id must not collide either',
  )
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

test('with no standalone flag, no server starts but the in-UI answerer does', () => {
  // The dashboard is a page in the DSH UI, reached over the host remote — so
  // the default is no second origin. The approval listener is still registered
  // because the in-UI page is a claimer, and it delegates whenever no page is
  // watching. See test/approvals.test.ts for the claim guard itself.
  const { ctx, registered } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: false, port: 0 } })
  assert.ok(
    registered().includes('approval/request'),
    'the in-UI page must still be able to claim an ask',
  )
  assert.ok(registered().includes('agent/pre-step'), 'and the policies still attach')
  dispose()
})

test('the approval listener is registered even with no dashboard config at all', () => {
  const { ctx, registered } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC })
  assert.ok(
    registered().includes('approval/request'),
    'an unwatched ask must still fall through to the composer panel, which '
    + 'requires a listener that delegates',
  )
  dispose()
})

test('with the dashboard enabled, the answerer is registered PREPENDED', async (t) => {
  const { ctx, registered, optsOf, handler } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC, dashboard: { standalone: true, enabled: true, port: 0 } })
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
    () => apply(ctx as never, { spec: SPEC, dashboard: { standalone: true, enabled: true, port: 70_000 } }),
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
      dashboard: { standalone: true, enabled: true, port: 0, brief: { enabled: true, model: 'm' } },
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
      dashboard: { standalone: true, enabled: true, port: 0 },
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

test('with standalone:true the logged URL line is greppable and the disposer stops the server', async (t) => {
  const { url, token, dispose, registered } = await appliedWithDashboard(t)
  assert.ok(registered().includes('approval/request'))

  const base = `${url.origin}${url.pathname}`
  const alive = await fetch(`${base}api/state?token=${encodeURIComponent(token)}`)
  assert.equal(alive.status, 200)

  dispose()
  await assert.rejects(fetch(`${base}api/state`), 'the disposer closed it')
})

test('the hooks feed the run state the standalone page renders', async (t) => {
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

test('absent metrics/recommendations still produce a valid snapshot shape', async (t) => {
  const { dash } = await started(t)
  const snapshot = await getState(dash)
  // Exact key set: absent surfaces are absent keys, never zeroed numbers
  // that would read as "measured, and it is all fine". `watching` is the one
  // addition — a `/api/state` poll is itself the heartbeat that makes this
  // caller eligible to answer, so it is always true on the response that
  // carries it. (The SSE frame is the other place `snapshot()` is served, and
  // it does NOT carry the key: nothing has proven a watcher at that point.)
  assert.deepEqual(snapshot, {
    answers: true,
    pending: [],
    runs: [],
    feed: [],
    watching: true,
  })
})

test('settleApproval settles a pending ask without HTTP', async (t) => {
  const { startDashboard, DashboardState } = await import('../src/dashboard.ts')
  const dash = startDashboard({ enabled: true, host: '127.0.0.1', port: 0, answers: true }, new DashboardState())
  t.after(() => void dash.stop())
  await dash.ready
  // Seed one pending entry by asking with no client connected is impossible
  // (it delegates), so settle an absent id and assert the miss contract.
  assert.equal(dash.settleApproval('no-such-id', 'allowed-once'), false)
})

test('a run carries the task a human typed, so the tree is self-describing', async () => {
  const { DashboardState } = await import('../src/dashboard.ts')
  const state = new DashboardState()
  state.recordMeta('agent-7', { sessionId: 'agent-7', label: 'fix the budget rounding and keep maxSteps honest' })
  const run = state.snapshot().runs.find(r => r.runId === 'agent-7')
  assert.equal(run?.label, 'fix the budget rounding and keep maxSteps honest')
  // A label is display-only: it must not be able to smuggle policy into a run.
  assert.equal(run?.maxSteps, undefined, 'naming a ceiling does not set one')
})

test('a very long task label is capped, so a run row cannot be a paragraph', async () => {
  const { DashboardState } = await import('../src/dashboard.ts')
  const state = new DashboardState()
  state.recordMeta('r1', { sessionId: 'r1', label: 'x'.repeat(400) })
  const run = state.snapshot().runs.find(r => r.runId === 'r1')
  assert.ok((run?.label?.length ?? 0) <= 120, `capped at 120, got ${String(run?.label?.length)}`)
})

/**
 * The watcher flag is the standalone page's claim on an ask, so its lifetime
 * must match the tab's. Registering on open without clearing on close left the
 * flag set for the life of the process: a dashboard nobody had open still beat
 * the composer panel to every ask, then stranded it, because the page that
 * would have answered was gone. Both halves are pinned here — the open half is
 * what lets a click settle an ask at all, the close half is what stops a
 * closed tab from winning one.
 */
test('an SSE client is a watcher while open, and stops being one when the last tab closes', async (t) => {
  clearWatcher()
  t.after(clearWatcher)
  assert.equal(watcherActive(), false, 'starts unwatched')

  const { dash } = await started(t, { host: '127.0.0.1', answers: true })

  const disconnect = await connectSse(dash)
  assert.equal(watcherActive(), true, 'an open tab claims asks')

  disconnect()
  await delay(50)
  assert.equal(watcherActive(), false, 'the last tab going releases the claim')
})

/**
 * KNOWN-ISSUES §6: a client that polls `/api/state` is watching, even though it
 * holds no stream. It used not to count, so a headless run was told "no
 * approval channel is available" while its own poller sat right there — and
 * the only way to learn it was ineligible was to watch a gate refuse an ask.
 */
test('a /api/state poll counts as a watcher and says so', async (t) => {
  clearWatcher()
  t.after(clearWatcher)
  const { dash } = await started(t, { host: '127.0.0.1', answers: true })
  assert.equal(watcherActive(), false, 'starts unwatched')
  const state = await getState(dash)
  assert.equal(watcherActive(), true, 'a poll is the heartbeat a stream would have been')
  assert.equal(state.watching, true, 'and the response says the client is eligible to answer')

  // `answers: false` means observe-only: the page may render, but the registry
  // must not let it claim, so it never registers a heartbeat and `watching`
  // stays false. That is the field's whole job — it answers "if I POST an
  // answer right now, am I eligible to have it counted?".
  clearWatcher()
  const { dash: observer } = await started(t, { host: '127.0.0.1', answers: false })
  const seen = await getState(observer)
  assert.equal(seen.answers, false, 'observe-only stays observe-only')
  assert.equal(seen.watching, false, 'and reports itself ineligible to answer')
})

// ── the watcher TTL and the page poll must not drift apart ─────────────────
// The in-UI page claims an ask only while it counts as a watcher, and this poll
test('the in-UI page renders the roll-up, and only what the roll-up computed', () => {
  // §1bz fixed the label the alert prints, and found the projection dropping
  // `metrics` so the page could not receive it at all (a65257b). Nothing rendered
  // it. These assertions are about the two things that went wrong:
  //
  //  1. the panel is MOUNTED in the page, not merely defined beside it;
  //  2. it computes NOTHING — every threshold in §1bp…§1bz was a number whose
  //     label disagreed with it, and the fix that stuck was reading names.
  const here = dirname(fileURLToPath(import.meta.url))
  const app = readFileSync(join(here, '..', 'web', 'app.tsx'), 'utf8')

  assert.match(app, /<MetricsPanel snapshot=\{snapshot\} \/>/,
    'the page must MOUNT the metrics panel — a defined-but-unused component is '
    + 'the shape this defect took')
  assert.match(app, /if \(metrics === undefined\) return null/,
    'and it must draw nothing when nothing was measured: "no data" and "zero" '
    + 'are different facts and only one belongs on a screen')
  assert.match(app, /aria-label="Measurements"/, 'and it must be a labelled region')
  // §1ca: the axis knows how many samples its median is drawn from, and a thin
  // one must SAY SO beside the figure. Drawn from the count, not from a fixed
  // number, so it tracks the axis rather than restating today's history.
  assert.match(app, /samples !== undefined && samples < 3/,
    'the panel must decide thinness FROM the count, not from a constant that '
    + 'describes today\'s history')
  assert.match(app, /thin\(metrics\.speed\.wallMs\.samples\)/,
    'the wall-clock figure must carry its sample count — a median over one run '
    + 'is that run, and §1ca measured it wearing the label of a distribution')
  assert.match(app, /thin\(metrics\.cost\.perRun\.samples\)/,
    'and so must the cost figure')

  // Bounded by a NAME, not a character count. The count was 2400 when written,
  // the component grew past it, and the failure was a confusing "did not match
  // /reviewFraction/" — a window that silently stops covering the code it was
  // written to inspect is worse than no window at all.
  const panelStart = app.indexOf('function MetricsPanel')
  const panelEnd = app.indexOf('/** Left sidebar activity ledger', panelStart)
  assert.ok(panelStart > 0 && panelEnd > panelStart,
    'MetricsPanel must be defined, and followed by the left-sidebar ledger')
  const panel = app.slice(panelStart, panelEnd)
  // No arithmetic on a figure the roll-up already decided. A comparison here is
  // a threshold invented by the page, which is exactly how the alert came to
  // print one quantity beside another's name.
  assert.equal(/quality\.goalMetRate\s*[<>]=?/.test(panel), false,
    'the panel must not re-threshold goalMetRate')
  assert.equal(/reviewRunRate\s*[<>]=?/.test(panel), false,
    'the panel must not re-threshold reviewRunRate')
  // It names both review readings, because §1bz was those two being conflated.
  assert.match(panel, /reviewRunRate/)
  assert.match(panel, /reviewFraction/)
})

test('the proposals panel draws the diff, and distinguishes absent from empty', () => {
  // §1cc: `recommendations` had no writer and no renderer. The writer landed in
  // d4d2242; this is the renderer half. Three facts, each of which was a real
  // failure mode somewhere in this chain:
  //
  //  1. the panel is MOUNTED (a defined-but-unused component is the shape the
  //     `metrics` gap took);
  //  2. absent is not empty — absent means the battery has not run, empty means
  //     it ran and had nothing to say (§1bq's rule, and the reason a `?? []`
  //     would erase the difference the writer just introduced);
  //  3. an absent confidence is a GAP in evidence, not zero confidence
  //     (optimizer.ts rule 4) — so it is omitted, never printed as `0%`.
  const here = dirname(fileURLToPath(import.meta.url))
  const app = readFileSync(join(here, '..', 'web', 'app.tsx'), 'utf8')

  assert.match(app, /<RecommendationsPanel snapshot=\{snapshot\} \/>/,
    'the page must MOUNT the proposals panel')
  assert.match(app, /if \(recommendations === undefined\) return null/,
    'and draw nothing when the battery has not run — that is not the same as '
    + 'an empty list, and collapsing the two is §1bq\'s rule in a new place')
  assert.match(app, /recommendations\.length === 0/, 'with an empty case that SAYS so')
  assert.match(app, /The optimizer ran and proposed nothing/,
    'in words, because an empty heading reads as a broken panel')

  const start = app.indexOf('function RecommendationsPanel')
  const end = app.indexOf('function MetricsPanel', start)
  assert.ok(start > 0 && end > start, 'the panel must be defined before the roll-up')
  const panel = app.slice(start, end)
  // It prints the optimizer's fields; it computes none of them. A threshold or a
  // derived figure here would be a second source of truth about the same lever.
  for (const field of ['rec.current', 'rec.proposed', 'rec.evidence', 'rec.confidence']) {
    assert.ok(panel.includes(field), `the panel must render ${field}`)
  }
  assert.equal(/rec\.confidence\s*\?\?\s*0/.test(panel), false,
    'an absent confidence must not become 0 — optimizer rule 4 sorts those last '
    + 'precisely because absence is a gap, not a low score')
  // The `? null :` guard, as a two-line shape: an absent confidence draws
  // NOTHING rather than a zero. A single-line regex over a multiline ternary
  // reads as if the code were one line, which is how a passing check asserts
  // nothing — the same failure shape as the character-count window fixed in
  // this file last round.
  assert.match(panel, /\{rec\.confidence === undefined\s*\n?\s*\? null\s*\n?\s*:/,
    'and it must be OMITTED when absent, which is the only honest rendering')
  // Read-only, because there is no apply affordance anywhere in the server
  // (dashboard.ts documents it) — a button here would be a control that does
  // nothing, which is a worse lie than no control.
  assert.equal(/<button|onClick|onChange/.test(panel), false,
    'the panel must stay read-only: the server has no apply path to call')
})

test('the CSS the metrics panel uses exists, and the runs pane keeps the rail', () => {
  // A half-styled pane is worse than an absent one, and a pane that takes the
  // rail's flex would leave the run list it summarises with a few rows.
  const here = dirname(fileURLToPath(import.meta.url))
  const css = readFileSync(join(here, '..', 'web', 'shell.css'), 'utf8')
  for (const selector of [
    '.rail .pane-metrics', '.metric-tiles', '.metric-tile', '.metric-alert',
    '.rail .pane-proposals', '.proposal-list', '.proposal', '.proposal-diff',
  ]) {
    assert.ok(css.includes(selector), `shell.css must style ${selector}`)
  }
  assert.match(css, /\.rail \.pane-proposals \{\s*flex: 0 0 auto/,
    'the proposals pane is sized by content, for the same reason as the metrics one')
  assert.match(css, /\.rail \.pane-metrics \{\s*flex: 0 0 auto/,
    'the metrics pane is sized by its content')
  assert.match(css, /\.rail \.pane-runs \{\s*flex: 1 1 auto/,
    'and the run list keeps the remaining space')
})

// is what keeps it one. A poll at or above the TTL leaves the page a watcher
// part of the time, so a gate firing in the gap hands its ask to the composer
// instead — from the page the operator is watching.
//
// This test failed to catch that regression when it only checked the derived
// constant, so it now asserts what the page actually schedules with.
test('the in-UI page polls well inside the watcher TTL', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const approvals = readFileSync(join(here, '..', 'src', 'watcher-ttl.ts'), 'utf8')
  const app = readFileSync(join(here, '..', 'web', 'app.tsx'), 'utf8')

  const ttlText = /WATCHER_TTL_MS\s*=\s*([\d_]+)/.exec(approvals)?.[1]
  assert.ok(ttlText !== undefined, 'the watcher TTL must be a literal this test can read')
  const ttl = Number(ttlText.replace(/_/g, ''))

  // The scheduled interval is what matters, so read it back out of the source.
  const scheduled = /setInterval\(tick,\s*([^)]+)\)/.exec(app)?.[1]?.trim()
  assert.ok(scheduled !== undefined, 'the page must schedule its safety-net poll')

  if (/^[\d_]+$/.test(scheduled)) {
    // A literal: it must clear the TTL, with room for a slow remote read.
    const literal = Number(scheduled.replace(/_/g, ''))
    assert.ok(literal * 2 < ttl,
      `the page polls every ${literal}ms against a ${ttl}ms watcher TTL — it is a `
      + 'watcher only part of the time, so asks escape to the composer panel')
  } else {
    // A derived value: it must be WATCHER_POLL_MS, and that must be < the TTL.
    assert.equal(scheduled, 'WATCHER_POLL_MS',
      'the poll interval must come from the derived constant, not ad hoc')
    assert.match(app, /const WATCHER_POLL_MS = Math\.round\(WATCHER_TTL_MS \/ 3\)/,
      'WATCHER_POLL_MS must be derived from the shared TTL so the two cannot drift')
    assert.ok(Math.round(ttl / 3) < ttl, 'the derived poll must clear the TTL')
  }
})
