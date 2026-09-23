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

import { startDashboard } from '../src/dashboard.ts'

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
