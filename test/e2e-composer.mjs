/**
 * §1cb, driven end to end: a REAL composer-driven run with NO dashboard page.
 *
 * The browser opens the DSH web UI and does nothing else. The task goes through
 * the harness's OWN composer (the conversation contenteditable), NOT the
 * Feature Loop page — so the only `approval/request` answerer registered is the
 * harness's composer panel, which never calls `noteWatcher`.
 *
 * This is the check §1be's fixtures could not be: they asserted "a watcher is
 * present", which is true of a page and false of the composer. Read from the
 * harness, the composer answers over the GATEWAY's client stream
 * (`dsh-client-ui-approval` → `ctx.remote.$on('approval/request')`), and the
 * gate's `someoneCanAnswer()` reads exactly that with `hasLiveClient()`.
 *
 * Measured 2026-10-04 against the previous build: the task was DENIED up front
 * with §1bb's "nobody is watching" sentence and this panel never appeared —
 * `panel.waitFor` timed out after 240s with zero asks. With the probe: one
 * composer card, settled in 32ms, the file written.
 *
 * Do NOT poll `/api/state` while this runs. That endpoint IS a watcher
 * heartbeat (`noteWatcher`), so a verification curl inside the 15s TTL sets
 * `watching: true`, and the gate then takes the dashboard branch — the run
 * still passes while proving nothing about the composer. Measured 2026-10-04;
 * this is the same class as §1be's fixture asserting itself.
 *
 * Usage (opt-in, not part of `make verify` — needs a RUNNING profile):
 *   DSH_URL='http://127.0.0.1:4188/?token=…' node test/e2e-composer.mjs
 */

import { createRequire } from 'node:module'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const URL_ = process.env.DSH_URL
if (URL_ === undefined || URL_ === '') {
  console.error("DSH_URL is required: paste the `dsh web:` line, token included.")
  process.exit(2)
}
const PROOF_DIR = process.env.PROOF_DIR ?? '/private/tmp/composer-proof'
const TASK = `Write the single word hello into ${join(PROOF_DIR, 'composer.txt')} then read it back.`
function resolve() {
  for (const c of [join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/playwright-core'), join(homedir(), 'node_modules/playwright-core')])
    if (existsSync(join(c, 'package.json'))) return c
  return 'playwright-core'
}
const { chromium } = createRequire(join(homedir(), 'x.js'))(resolve())
const browser = await chromium.launch({ channel: 'chrome' })
const proof = join(PROOF_DIR, 'composer.txt')
rmSync(proof, { force: true })
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage()
  await page.goto(URL_, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(7000)
  for (const label of ['Got it', 'OK', 'Continue', 'Close', 'Dismiss', 'Not now']) {
    const b = page.getByRole('button', { name: label, exact: false }).first()
    if (await b.count()) await b.click().catch(() => undefined)
    await page.waitForTimeout(900)
  }
  // Never open the Feature Loop page: that is the dashboard watcher this test
  // must NOT have, or it proves nothing about the composer.
  const composer = page.locator('div[contenteditable="true"]').first()
  await composer.click()
  await composer.fill(TASK)
  await page.keyboard.press('Enter')

  // The composer approval panel: the harness's own card.
  const panel = page.locator('[data-approval-key]')
  await panel.waitFor({ state: 'visible', timeout: 240_000 })
  const headline = await panel.locator('[role="group"]').first().innerText()
  console.log('composer card:', JSON.stringify(headline.split('\n')[0].slice(0, 90)))

  const waits = []
  let settled = 0
  for (let round = 0; round < 6; round += 1) {
    const started = Date.now()
    const card = page.locator('[data-approval-key]').first()
    if (await card.count() === 0) break
    await card.getByRole('button', { name: 'Allow once', exact: false }).first().click()
    waits.push(Date.now() - started)
    settled += 1
    await page.waitForTimeout(2500)
  }
  console.log('asks settled by the COMPOSER:', String(settled), '(waits ms:', waits.join(', ') || 'none', ')')

  // The card is the gate's `ask`, and the file is the composer having answered
  // it. A denied-up-front gate produces neither — which is precisely the
  // pre-probe failure this file exists to catch.
  const ok = existsSync(proof)
  console.log('proof:', proof, ok ? `exists (${JSON.stringify(readFileSync(proof, 'utf8').trim())})` : 'ABSENT')
  if (settled === 0 || !ok) {
    console.error('FAIL: a composer-only run settled no asks, or wrote nothing — §1cb says this is denied up front')
    process.exitCode = 1
  }
} finally {
  await browser.close()
  rmSync(proof, { force: true })
}
