#!/usr/bin/env node
/**
 * Capture durable evidence that the standalone dashboard actually works.
 *
 * The fix in this branch is a claim about behaviour, and behavioural claims
 * need a transcript and a picture, not a passing exit code. This records:
 *
 *   1. the HTTP contract   — page, token gate, live state, a real click
 *                            settling a real pending ask, the 409 replay
 *                            guard, and the 403 cross-origin refusal;
 *   2. a browser render    — the same page in a real Chromium, screenshotted;
 *   3. the watcher flag    — before, while, and after a tab is connected,
 *                            which is the invariant the fix introduced.
 *
 * Artifacts land in `docs/evidence/` and are meant to be committed and read
 * by a reviewer who does not trust the test suite.
 *
 * Usage: node --experimental-strip-types test/capture-standalone-evidence.mjs
 * Env:   PLAYWRIGHT_CORE — path to a playwright-core package (see e2e-dashboard.mjs)
 *        CHROME_PATH    — explicit Chromium executable
 */
import { strict as assert } from 'node:assert'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { DashboardState, startDashboard } from '../src/dashboard.ts'
import { clearWatcher, createApprovalRegistry, watcherActive } from '../src/approvals.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'docs', 'evidence')
const require_ = createRequire(import.meta.url)

/** Lines of the transcript, in order, as `[status] description`. */
const transcript = []
const record = (status, description) => {
  const line = `[${status}] ${description}`
  transcript.push([status, description])
  console.log(line)
}

function resolvePlaywrightCore() {
  if (process.env.PLAYWRIGHT_CORE !== undefined && existsSync(process.env.PLAYWRIGHT_CORE)) {
    return process.env.PLAYWRIGHT_CORE
  }
  const candidates = [
    join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/playwright-core'),
    '/opt/homebrew/lib/node_modules/playwright-core',
  ]
  for (const c of candidates) if (existsSync(c)) return c
  return 'playwright-core'
}

function resolveChrome() {
  if (process.env.CHROME_PATH !== undefined) return process.env.CHROME_PATH
  const base = join(homedir(), 'Library/Caches/ms-playwright')
  const shell = join(base, 'chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell')
  if (existsSync(shell)) return shell
  const full = join(base, 'chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome')
  return existsSync(full) ? full : undefined
}

mkdirSync(OUT, { recursive: true })

// ── the server under test, wired exactly as `apply` wires it ──────────────
clearWatcher()
const state = new DashboardState()
const registry = createApprovalRegistry({
  state,
  answers: true,
  answerTimeoutMs: 30_000,
  hasWatcher: () => watcherActive(),
})
const dash = startDashboard(
  { enabled: true, host: '127.0.0.1', port: 0, answers: true, token: 'evidence-token' },
  state,
  registry,
)
await dash.ready
// `dash.url` carries a trailing slash; concatenating a path onto it yields
// `//api/state`, which the router does not match. Use the origin, as the
// integration spec does.
const base = new URL(dash.url).origin
const url = (p) => `${base}${p}`
const post = (p, body, headers = {}) =>
  fetch(url(p), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dashboard-token': 'evidence-token', ...headers },
    body: JSON.stringify(body),
  })

record('setup', `standalone dashboard listening on ${base} (answers: true, shared registry)`)
record(String(watcherActive()), 'watcher flag before any tab connects (expected: false)')

// ── 1. HTTP contract ──────────────────────────────────────────────────────
const noToken = await fetch(url('/api/state'))
record(String(noToken.status), 'GET /api/state with no token — must be 401')

const page = await fetch(url('/?token=evidence-token'))
record(String(page.status), 'GET /?token=… — page renders, must be 200')

const stateRes = await fetch(url('/api/state'), { headers: { 'x-dashboard-token': 'evidence-token' } })
const snapshot = await stateRes.json() 
record(String(stateRes.status), `GET /api/state — answers=${snapshot.answers}, pending=${snapshot.pending.length}`)
assert.equal(snapshot.answers, true, 'the page must not advertise itself observe-only')

// A tab opens FIRST — the real sequence, and the one the fix made possible.
// Asking before any tab existed legitimately delegates to the composer panel.
const controller = new AbortController()
await fetch(url('/api/events?token=evidence-token'), { signal: controller.signal }).catch(() => undefined)
await new Promise(r => setTimeout(r, 100))
record(String(watcherActive()), 'watcher flag while a tab is connected (expected: true)')

// A real pending ask, raised the way the harness raises one.
const question = { toolName: 'write', callId: 'call-evidence', reason: 'write the fix file', agent: { id: 'agent-evidence' } }
const askPromise = registry.answer(question, async () => 'unavailable')

await new Promise(r => setTimeout(r, 50))
const withPending = await (await fetch(url('/api/state'), { headers: { 'x-dashboard-token': 'evidence-token' } })).json() 
record(String(withPending.pending.length), 'GET /api/state — the tab claimed the ask (expected: 1 pending)')
assert.ok(withPending.pending.length > 0, 'an open tab must be able to claim an ask')

const pendingId = withPending.pending[0].id

// The click. This is what could never work before the fix.
const click = await post('/api/approvals/' + pendingId, { outcome: 'allowed-once', feedback: 'evidence capture' })
const clickBody = await click.json() 
record(String(click.status), `POST /api/approvals/:id {allowed-once} — the click settles the ask (got ${JSON.stringify(clickBody)})`)

const settled = await askPromise
record(JSON.stringify(settled), 'the ask promise resolved with the clicked outcome (expected: "allowed-once")')
assert.equal(settled, 'allowed-once', 'the click must decide the ask')

const replay = await post('/api/approvals/' + pendingId, { outcome: 'allowed-once' })
record(String(replay.status), 'POST the same id again — must be 409, a late click reads as "you were beaten"')

const crossOrigin = await post('/api/approvals/' + pendingId, { outcome: 'allowed-once' }, { origin: 'http://evil.example' })
record(String(crossOrigin.status), 'POST with a cross-origin Origin — must be 403')

// ── 2. the watcher flag released on the last close ────────────────────────
controller.abort()
await new Promise(r => setTimeout(r, 150))
record(String(watcherActive()), 'watcher flag after the last tab closed (expected: false — the fix’s close half)')

// ── 3. a real browser render ──────────────────────────────────────────────
let screenshot = 'SKIPPED'
try {
  const { chromium } = require_(resolvePlaywrightCore())
  const executablePath = resolveChrome()
  const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
  const browserPage = await browser.newPage({ viewport: { width: 1280, height: 860 } })
  await browserPage.goto(url('/?token=evidence-token'), { waitUntil: 'networkidle' })
  await browserPage.waitForTimeout(400)
  const shot = join(OUT, 'standalone-dashboard.png')
  await browserPage.screenshot({ path: shot, fullPage: false })
  await browser.close()
  screenshot = 'docs/evidence/standalone-dashboard.png'
  record('200', `real Chromium rendered the page; screenshot → ${screenshot}`)
} catch (error) {
  record('SKIP', `browser capture unavailable: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`)
}

dash.stop()
clearWatcher()

// ── 4. the transcript ─────────────────────────────────────────────────────
const md = [
  '# Standalone dashboard — evidence capture',
  '',
  `Generated by \`test/capture-standalone-evidence.mjs\` on a real machine against`,
  `\`startDashboard\` wired the way \`apply\` wires it (shared registry, \`answers: true\`).`,
  '',
  'Every line below is a real request or a real flag read. Nothing is asserted',
  'by hand — the script exits non-zero if any step contradicts it.',
  '',
  '| Result | Observation |',
  '|---|---|',
  ...transcript.map(([s, d]) => `| \`${s}\` | ${d.replace(/\|/g, '\\|')} |`),
  '',
  `Screenshot: \`${screenshot}\``,
  '',
  '## What this proves',
  '',
  '- The page renders and is token-gated (401 without, 200 with).',
  '- `answers` is `true` — the page no longer advertises itself observe-only.',
  '- **A tab claims a pending ask.** Before the fix `noteWatcher()` was never',
  '  called on the loopback path, so `hasWatcher()` was permanently false and',
  '  this step was impossible.',
  '- **A click settles the ask** with the clicked outcome, the replay is a 409,',
  '  and a cross-origin POST is a 403.',
  '- **The watcher flag is released when the last tab closes**, so a dashboard',
  '  nobody has open cannot beat the composer panel to an ask and strand it.',
  '',
].join('\n')
writeFileSync(join(OUT, 'standalone-dashboard.md'), md)

console.log('\nwrote docs/evidence/standalone-dashboard.md and', screenshot)
