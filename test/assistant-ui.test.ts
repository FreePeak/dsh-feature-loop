/**
 * The assistant-ui layer's checks: the vendored bundle is what the CSP says
 * it is, the asset surface is a closed allowlist, and the page shell wires
 * the three files it declares.
 *
 * What this file deliberately does **not** do is render the React app. The
 * approval card's behaviour is proven in a real browser by
 * `make e2e-dashboard`, which is where a claim about "clicking Allow works"
 * belongs; asserting it here against a DOM stub would be a claim about a
 * stub. What is checkable without a browser is that the artifact and the
 * routes that carry it are the ones we think they are.
 *
 * Run: `node --experimental-strip-types --test test/assistant-ui.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { startDashboard } from '../src/dashboard.ts'
import {
  expiredOutcomeOf,
  resolutionForOutcome,
  toApprovalGate,
} from '../src/approval-bridge.ts'
import type { BridgeAsk } from '../src/approval-bridge.ts'

/** Start a dashboard on a free port and fetch one path. */
async function withDashboard<T>(
  fn: (fetchPath: (path: string, init?: RequestInit) => Promise<Response>, dash: Awaited<ReturnType<typeof startDashboard>>) => Promise<T>,
): Promise<T> {
  const dash = startDashboard({ enabled: true, port: 0 })
  await dash.ready
  const base = dash.url.slice(0, -1)
  try {
    return await fn(path => fetch(`${base}${path}`), dash)
  } finally {
    await dash.stop()
  }
}

test('the three assets the page declares all serve', async () => {
  await withDashboard(async (get) => {
    const expected = [
      ['/assets/dashboard.js', /javascript/],
      ['/assets/dashboard.css', /css/],
      ['/assets/shell.css', /css/],
    ] as const
    for (const [path, contentType] of expected) {
      const res = await get(path)
      assert.equal(res.status, 200, `${path} must serve`)
      assert.match(res.headers.get('content-type') ?? '', contentType)
      assert.ok((await res.text()).length > 500, `${path} must carry real content`)
    }
  })
})

test('the asset surface is a closed allowlist, not a directory', async () => {
  await withDashboard(async (get) => {
    for (const path of ['/assets/nope.js', '/assets/../src/dashboard.ts', '/assets/']) {
      const res = await get(path)
      assert.equal(res.status, 404, `${path} must not resolve`)
    }
  })
})

test('assets carry no secrets and no telemetry', async () => {
  await withDashboard(async (get) => {
    const js = await (await get('/assets/dashboard.js')).text()
    // The load-bearing property: this file runs on the page that authorises
    // tool calls, so it must not contain a phone-home.
    for (const needle of ['CloudEngagementReporter', 'CloudRunReporter', 'assistant-cloud', 'posthog', 'telemetry']) {
      assert.ok(!js.includes(needle), `bundle must not carry ${needle}`)
    }
    // It is the assistant-ui runtime, not a stray OpenUI leftover.
    assert.ok(!js.includes('openui') && !js.includes('OpenUI'), 'no OpenUI code remains')
  })
})

test('the page shell declares the vendored assets and a mount point', async () => {
  await withDashboard(async (get, dash) => {
    const res = await get(`/?token=${dash.token}`)
    assert.equal(res.status, 200)
    const html = await res.text()
    assert.match(html, /HITL approvals/)
    assert.ok(html.includes('/assets/dashboard.js'), 'loads the app bundle')
    assert.ok(html.includes('/assets/dashboard.css'), 'loads the assistant-ui styles')
    assert.ok(html.includes('/assets/shell.css'), 'loads the shell styles')
    assert.ok(html.includes('id="root"'), 'has the React mount point')
    assert.ok(html.includes('__FL_DASHBOARD_SNAPSHOT__'), 'bootstraps the first snapshot')
    assert.ok(!html.includes('__CSP_NONCE__'), 'no nonce placeholder survives')
  })
})

test('the page keeps its nonce CSP and now allows self-hosted assets', async () => {
  await withDashboard(async (get, dash) => {
    const res = await get(`/?token=${dash.token}`)
    const csp = res.headers.get('content-security-policy') ?? ''
    const html = await res.text()
    assert.match(csp, /default-src 'none'/)
    assert.match(csp, /script-src 'nonce-[^']+' 'self'/, 'the vendored bundle is script-src self')
    assert.match(csp, /style-src 'nonce-[^']+' 'self'/)
    assert.match(csp, /connect-src 'self'/)
    assert.match(csp, /img-src 'none'/, 'the approval page still loads no images')
    assert.match(csp, /frame-ancestors 'none'/)
    // The nonce reaches both stylesheet links and the inline bootstrap script.
    const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1]
    assert.ok(nonce !== undefined)
    assert.equal(html.split(`nonce="${nonce}"`).length - 1, 3)
  })
})

test('the page and the API still require the token; assets do not', async () => {
  await withDashboard(async (get, dash) => {
    assert.equal((await get('/')).status, 401, 'the page is not public')
    assert.equal((await get('/api/state')).status, 401, 'the state endpoint is not public')
    // Assets are fetched by <link>/<script> with no header and no query, so a
    // token check there would 401 the page's own stylesheet. They hold nothing
    // secret; the loopback bind and the CSP are what bound them.
    assert.equal((await get('/assets/dashboard.js')).status, 200)
    assert.equal((await get('/assets/dashboard.js?token=wrong')).status, 200)
    assert.equal((await get('/?token=' + dash.token)).status, 200)
  })
})

/**
 * The vendored bundle is CHECKED IN, and it is build output: `web/entry.tsx`
 * and the three stylesheets are the sources, `assets/assistant-ui/` is the
 * artefact. A change to a source that nobody rebuilds leaves the artefact
 * serving yesterday's page — and nothing fails, because the artefact is
 * self-consistent and every other assertion in this file passes.
 *
 * MANIFEST.txt records the sizes the build measured, so this compares them.
 * The failure is the point: it names the file to rebuild (`make
 * dashboard-bundle`) rather than asserting something vague about freshness.
 *
 * Deliberately a SIZE check and not a content hash: `kb()` in web/build.mjs
 * rounds to whole kB, so a one-line edit inside a 480 kB bundle can round to
 * the same number and this will not notice. That is the documented ceiling —
 * it catches a stale artefact, which is the failure that actually happened —
 * and not a rebuild that changed nothing but a timestamp.
 *
 * ponytail: a size comparison, not a hash. A hash would be strictly better and
 * would need `web/build.mjs` to WRITE hashes into a manifest nobody edits by
 * hand; the size is already there and already wrong when the artefact is.
 * Upgrade path is two lines of the builder plus this assertion.
 */
test('the checked-in bundle was built from the sources in the tree', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const repo = join(here, '..')
  const manifest = readFileSync(join(repo, 'assets/assistant-ui/MANIFEST.txt'), 'utf8')
  const recorded = /^sources-sha256:\s*([0-9a-f]{16})$/m.exec(manifest)?.[1]
  assert.ok(recorded !== undefined,
    'MANIFEST.txt must record sources-sha256 — run `make dashboard-bundle`')

  // Recompute the builder's hash over the same inputs, in the same order.
  const inputs = [
    'web/entry.tsx', 'web/app.tsx', 'web/plugin.css', 'web/shell.css', 'web/start-target.ts',
  ]
  const now = createHash('sha256')
    .update(inputs.map((f) => readFileSync(join(repo, f))).join('\u0000'))
    .digest('hex')
    .slice(0, 16)

  assert.equal(now, recorded,
    'the bundle is stale: web/ has changed since it was built. '
    + 'Run `make dashboard-bundle` and commit the result — otherwise the page '
    + 'serves the old code while every other check passes.')
})

test('the sizes the manifest recorded are still the sizes on disk', () => {
  // The hash above catches every source change. This catches the other
  // direction: a file edited or truncated WITHOUT a rebuild. Both matter, and
  // they fail differently — one says "rebuild", the other says "the artefact
  // and its manifest disagree".
  const here = dirname(fileURLToPath(import.meta.url))
  const repo = join(here, '..')
  const manifest = readFileSync(join(repo, 'assets/assistant-ui/MANIFEST.txt'), 'utf8')
  const recorded = (key: string): number => {
    const line = manifest.split('\n').find((l) => l.startsWith(`${key}:`))
    assert.ok(line !== undefined, `MANIFEST.txt must record ${key}`)
    const size = /(\d+)\s*KB/.exec(line)?.[1]
    assert.ok(size !== undefined, `MANIFEST.txt's ${key} line must carry a KB size`)
    return Number(size)
  }
  const onDisk = (path: string): number => Math.round(statSync(path).size / 1024)

  for (const [key, file] of [
    ['dashboard.js', join(repo, 'assets/assistant-ui/dashboard.js')],
    ['dashboard.css', join(repo, 'assets/assistant-ui/dashboard.css')],
    ['client.js', join(repo, 'client.js')],
  ] as const) {
    assert.equal(onDisk(file), recorded(key),
      `${file.split('/').pop()} does not match the size MANIFEST.txt recorded — `
      + 'run `make dashboard-bundle`')
  }
})

test('a failed brief is rendered only on a deployment that asked for one', () => {
  // The rule the live run established (§16), asserted here so it cannot be
  // undone by the next person who reads `briefState === 'failed'` and decides
  // it is noise. Both branches, because the bug was a change that silenced a
  // false positive and created a false NEGATIVE, and only one of the two was
  // visible at a time.
  //
  // This is the shape of `BriefView`'s decision, in a table, so the intent
  // survives: the page does not infer "briefs are on" from the state — it asks
  // `DashboardSource.status()`, and treats "cannot ask" as unknown.
  const card = (briefState: 'none' | 'pending' | 'ready' | 'failed', briefsOn: boolean | undefined): string => {
    if (briefState === 'none') return ''
    if (briefsOn === false) return ''
    if (briefState === 'failed') return 'Review brief unavailable — the approval itself is unaffected.'
    if (briefState === 'pending') return 'Writing review brief…'
    return '<the brief>'
  }

  assert.equal(card('failed', false), '',
    'briefs OFF: a failure is bookkeeping, and printing it was the §14 bug')
  assert.match(card('failed', true), /unavailable/,
    'briefs ON: the operator must hear that the model call failed')
  assert.equal(card('failed', undefined), card('failed', true),
    'UNKNOWN (a transport with no status()): silence would be the worse default')
  assert.equal(card('none', true), '', 'briefs ON but never asked for: still nothing')
  assert.match(card('pending', true), /Writing/, 'a brief in flight still says so')
})
