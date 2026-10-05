/**
 * §1cf: the standalone (loopback) page renders TODAY's components.
 *
 * The artefact this replaces was frozen at `3973e3a` (2026-09-23) and had no
 * metrics pane and no proposals pane on a page whose whole purpose is watching
 * a run without the harness UI. This drives the real `startDashboard` in a real
 * browser and asserts the two panes are MOUNTED, which a source-level assertion
 * cannot do — the whole failure was a component that exists in `web/app.tsx` and
 * was absent from the served bundle.
 *
 * The panes are absent-by-design until there is something to show, so the
 * assertions are split: with an empty snapshot the page must still MOUNT (the
 * bundle loaded and ran), and with metrics + recommendations set it must draw
 * both. `startDashboard`'s second parameter is the very `DashboardState` the
 * plugin feeds in production, so this drives the production path rather than a
 * fake server.
 *
 * Run: node --experimental-strip-types test/e2e-standalone-panes.mjs
 */
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { DashboardState, startDashboard } from '../src/dashboard.ts'

function resolvePlaywrightCore() {
  const candidates = [
    join(homedir(), 'node_modules/playwright-core'),
    join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/playwright-core'),
  ]
  return candidates.find(p => existsSync(join(p, 'package.json'))) ?? 'playwright-core'
}

function resolveChrome() {
  const installed = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  return existsSync(installed) ? installed : undefined
}

const { chromium } = createRequire(join(homedir(), 'x.js'))(resolvePlaywrightCore())

/**
 * Every child that opens `#root` and nothing else: no harness, no client bundle
 * (that one is loaded by the harness through `__ModuleLoader__`, and this page
 * is not it), no host React. What runs is `assets/assistant-ui/dashboard.js`
 * alone — the file the loopback server serves.
 */
// The plugin's own state object, passed the way `apply()` passes it.
const state = new DashboardState()
const dash = startDashboard({ enabled: true, port: 0, answers: true }, state)
await dash.ready
const executablePath = resolveChrome()
const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
let failures = 0
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage()
  const errors = []
  page.on('pageerror', e => { errors.push(`pageerror: ${e.message}`) })
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${String(r.status())} ${r.url()}`) })

  await page.goto(`${dash.url}?token=${encodeURIComponent(dash.token)}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)

  const text = await page.evaluate(() => document.getElementById('root')?.innerText ?? '')
  console.log(`mounted: ${String(text.length)} chars of the page body`)
  console.log(`panes: runs=${String(await page.locator('.pane-runs').count())}`)

  // The bundle ran. Before this change the same page served a frozen artefact
  // that also mounted, so "mounted" is necessary and not sufficient — the panes
  // below are the assertion that actually distinguishes the two bundles.
  if (text.length === 0) {
    console.error('FAIL: #root is empty — the standalone bundle did not mount at all')
    failures += 1
  }
  if (await page.locator('.pane-runs').count() === 0) {
    console.error('FAIL: the run rail is absent — the page rendered without its own components')
    failures += 1
  }

  // The two panes, with data. Both are absent-by-design on an empty snapshot
  // (§1bq's rule: absent is not empty), so the assertion cannot be "the pane
  // exists" — it is "the pane appears once the server has something to show",
  // which is the only thing that distinguishes a current bundle from a stale
  // one at runtime.
  {
    state.recordStep('sess-panes', {
      label: 'Write the release note',
      cwd: '/private/tmp/workspace-demo',
      workspaceLabel: 'workspace-demo',
      steps: 4,
      maxSteps: 8,
      spentUSD: 0.0042,
      budgetUSD: 1,
      state: 'running',
    })
    // Computed by `summarize`, not hand-written: this fixture threw
    // `Cannot read properties of undefined (reading 'length')` in MetricsPanel
    // because a hand-built summary left out `alerts` and each axis' `latest` /
    // `samples`. The server's own producer cannot omit a required field, so
    // asking it for the values is both shorter and the only version of this
    // fixture that can go stale silently.
    const { summarize } = await import('../src/metrics.ts')
    const record = (steps, costUSD, wallMs, outcome) => ({
      runId: `sess-${String(steps)}-${String(Math.round(costUSD * 1e6))}`,
      startedAt: 1_700_000_000_000,
      endedAt: 1_700_000_000_000 + wallMs,
      pass: 1,
      passes: 1,
      taskKey: 'pane-fixture',
      outcome,
      steps,
      maxSteps: 8,
      costUSD,
      budgetUSD: 1,
      unpricedSteps: 0,
      byRoute: { 'onegw/execution': { steps, usd: costUSD } },
      stepLatencyMs: [],
      wallMs,
      signals: [],
      judgeScores: [],
      reviewFraction: 0.125,
      specFingerprint: 'pane-fixture',
    })
    state.setMetrics(summarize([
      record(7, 0.0029, 203_000, 'goal-met'),
      record(8, 0.0040, 260_000, 'goal-met'),
      record(8, 0.0081, 260_000, 'goal-met'),
      record(12, 0.0060, 420_000, 'budget-stop'),
      record(6, 0.0031, 180_000, 'model-stop'),
    ]))
    state.setRecommendations([{
      lever: 'prompt-cache',
      current: 'off',
      proposed: 'on',
      evidence: 'no cache reads recorded',
      confidence: 0.6562,
    }])
    await page.waitForTimeout(2500)

    const metrics = await page.locator('#metrics').count()
    const proposals = await page.locator('#proposals').count()
    console.log(`panes: metrics=${String(metrics)} proposals=${String(proposals)}`)
    if (metrics === 0) {
      console.error('FAIL: #metrics is absent with a roll-up set — the served bundle predates the panel')
      failures += 1
    } else {
      console.log(`MEASUREMENTS:\n${await page.locator('#metrics').innerText()}`)
    }
    if (proposals === 0) {
      console.error('FAIL: #proposals is absent with a recommendation set — the served bundle predates the panel')
      failures += 1
    } else {
      console.log(`PROPOSALS:\n${await page.locator('#proposals').innerText()}`)
    }
  }

  // A 401 here means the shell's own bootstrap read the page without a token,
  // and an SSE 404 means the loopback source never opened its stream — either
  // is a page that renders once and then goes stale forever.
  const real = errors.filter(e => !/favicon/.test(e))
  console.log(`console/network errors: ${real.length === 0 ? 'none' : JSON.stringify(real.slice(0, 6))}`)
  if (real.some(e => /pageerror/.test(e))) {
    console.error('FAIL: the page threw — a bundle that cannot run is worse than a stale one')
    failures += 1
  }
  await page.screenshot({ path: 'docs/evidence/standalone-panes.png', fullPage: true })
} finally {
  await browser.close()
  await dash.stop()
}

if (failures > 0) {
  console.error(`standalone panes: ${String(failures)} failure(s) — §1cf says the loopback page is frozen`)
  process.exitCode = 1
} else {
  console.log('standalone panes: mounted, with MEASUREMENTS and PROPOSALS drawn')
}