#!/usr/bin/env node
/**
 * Launch a demo HITL dashboard with live run state and one pending ask
 * (including a review brief), so the revamp can be opened in a browser.
 *
 * The ask only claims while an SSE client is connected (`answer` guard), so
 * this script waits for a tab — real browser or Playwright — before raising it.
 *
 * Usage:
 *   node --experimental-strip-types demo/hitl-open.mjs open
 *   node --experimental-strip-types demo/hitl-open.mjs shot
 */
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { DashboardState, startDashboard } from '../src/dashboard.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const mode = process.argv[2] ?? 'open'

const QUESTION = {
  agent: { id: 'run-7f3a' },
  toolName: 'write_file',
  callId: 'call-9',
  reason: 'REVIEW REQUESTED (policy): write_file: irreversible — a human should review this.',
}

const state = new DashboardState()
state.recordStep('run-7f3a', {
  step: 4,
  maxSteps: 12,
  spentUSD: 0.0214,
  budgetUSD: 1,
})
state.recordRoute('run-7f3a', 'onegw/execution')
state.recordJudge('run-7f3a', 2)
state.recordSignals('run-7f3a', [
  { severity: 'warning', kind: 'budget', step: 4, detail: 'spend trajectory may hit the ceiling by step 12' },
  { severity: 'info', kind: 'excessive-steps', step: 3, detail: 'half the step budget remains' },
])
state.note('step', 'step 4/12 — reviewing write_file', 'run-7f3a')
state.note('route', 'routed onegw/execution', 'run-7f3a')
state.note('judge', 'judge score 2/3 on step 3 output', 'run-7f3a')
state.note('gate', 'ask: write_file — irreversible', 'run-7f3a')

const dash = startDashboard(
  { enabled: true, port: Number(process.env.DSH_DEMO_PORT ?? 3092), answerTimeoutMs: 30_000_000 },
  state,
)
await dash.ready
const url = `${dash.url}?token=${dash.token}`
console.log(`feature-loop dashboard: ${url}`)

/**
 * Raise one ask after the tab is live, following the e2e pattern: wait for
 * the page, give the EventSource a beat to register the SSE client, then
 * call answer() once. If the guard still delegated, retry a few times.
 */
async function raiseClaimedAsk(waitForCard = false) {
  for (let attempt = 1; attempt <= 8; attempt++) {
    await new Promise((resolve) => { setTimeout(resolve, attempt === 1 ? 400 : 300) })
    let delegated = false
    const outcome = dash.answer(QUESTION, async () => {
      delegated = true
      return 'unavailable'
    })
    await new Promise((resolve) => { setTimeout(resolve, 200) })
    const entry = dash.pendingSnapshot()[0]
    if (entry !== undefined) {
      dash.briefs.markBriefPending(entry.id)
      setTimeout(() => {
        dash.briefs.recordBrief(entry.id, [
          { kind: 'heading', text: 'write_file · irreversible' },
          { kind: 'paragraph', text: 'The gate fired because the actuator marks this write irreversible.' },
          { kind: 'list', items: [
            'Touches src/plugin.ts (tracked path)',
            'One file only; no deletes',
            'Run step 4/12, spend $0.0214 / $1.00',
          ] },
          { kind: 'code', language: 'bash', code: "await write_file({ path: 'src/plugin.ts', … })" },
          { kind: 'paragraph', text: 'Reject if the change belongs behind a review gate you have not signed off.' },
        ])
      }, 500)
      console.log(`demo: ask claimed on attempt ${attempt} (id ${entry.id})`)
      if (waitForCard) {
        // Caller's page must observe it; just keep the promise alive.
        void outcome
      }
      return
    }
    await outcome
    console.log(`demo: attempt ${attempt} delegated (tab not watching yet)`)
  }
  throw new Error('no dashboard tab connected — open the page first')
}

function openBrowser(target) {
  execFile('open', [target], (err) => {
    if (err) console.error(`open failed: ${String(err.message)}`)
  })
}

/**
 * Hold one SSE client so a pending ask is not fail-closed when the human
 * tab blips (Chrome focus changes, temporary network stalls). Decisions still
 * come from the browser tab; this stream only keeps `clients.size > 0`.
 */
function holdSseClient(baseUrl, token) {
  const target = new URL('/api/events', baseUrl)
  target.searchParams.set('token', token)
  let req
  let stopped = false
  const connect = () => {
    if (stopped) return
    req = http.get(target, {
      headers: {
        Accept: 'text/event-stream',
        'X-Dashboard-Token': token,
      },
    }, (res) => {
      res.resume()
      res.on('end', () => {
        if (!stopped) setTimeout(connect, 500)
      })
    })
    req.on('error', () => {
      if (!stopped) setTimeout(connect, 500)
    })
  }
  connect()
  return () => {
    stopped = true
    req?.destroy()
  }
}

function playwrightCore() {
  const candidates = [
    join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/playwright-core'),
    join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/.pnpm'),
  ]
  const explicit = process.env.PLAYWRIGHT_CORE
  if (explicit !== undefined && existsSync(explicit)) return explicit
  return candidates.find((c) => existsSync(join(c, 'package.json'))) ?? 'playwright-core'
}

function chromePath() {
  if (process.env.CHROME_PATH !== undefined && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH
  }
  const shell = join(
    homedir(),
    'Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  )
  if (existsSync(shell)) return shell
  const legacy = join(
    homedir(),
    'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',
  )
  if (existsSync(legacy)) return legacy
  return undefined
}

async function screenshot(target, outPath) {
  const require = createRequire(import.meta.url)
  const { chromium } = require(playwrightCore())
  const executablePath = chromePath()
  const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
    console.log('shot: goto')
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15_000 })
    await page.waitForSelector('#conn-label', { timeout: 10_000 })
    console.log('shot: raising ask')
    await raiseClaimedAsk()
    console.log('shot: waiting for card + brief')
    await page.waitForSelector('.card .tool', { timeout: 10_000 })
    await page.waitForSelector('.brief', { timeout: 10_000 })
    // Let the brief SSE frame paint, then settle.
    await page.waitForTimeout(300)
    mkdirSync(dirname(outPath), { recursive: true })
    console.log('shot: screenshotting')
    await page.screenshot({ path: outPath, fullPage: true, timeout: 15_000 })
    console.log(`screenshot: ${outPath}`)
    writeFileSync(join(root, 'docs/hitl-dashboard-url.txt'), `${target}\n`)
  } finally {
    await browser.close()
  }
}

if (mode === 'shot') {
  await screenshot(url, join(root, 'docs/hitl-dashboard-revamp.png'))
  await dash.stop()
} else {
  // Keep-alive stream first so raiseClaimedAsk can claim without waiting on
  // the human tab, and so tab focus changes do not settle the ask.
  const releaseSse = holdSseClient(dash.url, dash.token)
  await new Promise((resolve) => { setTimeout(resolve, 200) })
  openBrowser(url)
  await raiseClaimedAsk()
  writeFileSync(join(root, 'docs/hitl-dashboard-url.txt'), `${url}\n`)
  console.log('pending ask raised; browser should show the decision card.')
  console.log('Ctrl+C stops the demo dashboard.')
  process.on('SIGINT', async () => {
    releaseSse()
    await dash.stop()
    process.exit(0)
  })
  await new Promise(() => {})
}
