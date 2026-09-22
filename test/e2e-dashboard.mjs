#!/usr/bin/env node
/**
 * Opt-in end-to-end check: drive the real dashboard page in a real browser,
 * click Allow once / Reject, and assert the server-side `answer()` promise
 * resolves with the clicked outcome.
 *
 * This closes the one gap recorded in docs/VERIFY-DASHBOARD.md ("a human
 * clicking the rendered page in a real browser is UNVERIFIED").
 *
 * Not part of `make verify`: it needs a browser (Playwright + a Chromium
 * binary) and is therefore opt-in via `make e2e-dashboard`.
 *
 * Usage:
 *   node test/e2e-dashboard.mjs [allow|reject]
 *   PLAYWRIGHT_CORE=/path/to/playwright-core node test/e2e-dashboard.mjs allow
 *
 * Environment:
 *   PLAYWRIGHT_CORE - path to a `playwright-core` package (default: resolve
 *     from the harness checkout's node_modules, then from `npm root -g`).
 *   CHROME_PATH    - explicit Chromium executable (default: Playwright's
 *     bundled chromium_headless_shell, falling back to the full-chromium
 *     cache entry).
 */
import { strict as assert } from 'node:assert'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { startDashboard } from '../src/dashboard.ts'

const mode = process.argv[2] === 'reject' ? 'rejected' : 'allowed-once'
const buttonLabel = mode === 'allowed-once' ? 'Allow once' : 'Reject'

function resolvePlaywrightCore() {
  if (process.env.PLAYWRIGHT_CORE !== undefined && existsSync(process.env.PLAYWRIGHT_CORE)) {
    return process.env.PLAYWRIGHT_CORE
  }
  const candidates = [
    join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/playwright-core'),
    join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/.pnpm'),
  ]
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'package.json'))) return candidate
  }
  return 'playwright-core'
}

function resolveChrome() {
  if (process.env.CHROME_PATH !== undefined && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH
  }
  const shell = join(homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell')
  if (existsSync(shell)) return shell
  const full = join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome')
  if (existsSync(full)) return full
  return undefined
}

const require = createRequire(import.meta.url)
const { chromium } = require(resolvePlaywrightCore())

const dash = startDashboard({ enabled: true, port: 0 })
await dash.ready

const executablePath = resolveChrome()
const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
try {
  const page = await browser.newPage()
  await page.goto(`${dash.url}?token=${dash.token}`)
  await page.waitForSelector('#conn-label', { timeout: 10_000 })

  // Claim the ask only after the tab's SSE stream is connected: `answer`
  // claims exactly while a tab is watching, and an ask made before any tab
  // exists would delegate to `next()` instead.
  const question = {
    agent: { id: 'e2e-agent' },
    toolName: 'write_file',
    callId: 'e2e-call-1',
    reason: 'REVIEW REQUESTED (policy): write_file: irreversible',
  }
  const answered = dash.answer(question, async () => 'unavailable')

  await page.waitForSelector('.card .tool', { timeout: 10_000 })
  const tool = await page.textContent('.card .tool')
  assert.equal(tool?.trim(), 'write_file')

  // The brief section is absent when no brief was requested (briefState none).
  assert.equal(await page.locator('.brief').count(), 0)

  await page.getByRole('button', { name: buttonLabel }).click()
  const outcome = await answered
  assert.equal(outcome, mode)
  console.log(`e2e-dashboard (${mode}): the ${buttonLabel} click resolved the ask ${outcome}`)
} finally {
  await browser.close()
  await dash.stop()
}
