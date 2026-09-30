#!/usr/bin/env node
/**
 * The in-UI click path, end to end, against a booted profile.
 *
 * `test/e2e-dashboard.mjs` proves the STANDALONE page's buttons work. This one
 * proves the path a person actually takes — open the harness UI, click
 * **Feature Loop** in the sidebar, type a task, press **Start loop**, then click
 * Allow once or Reject on the card — and that the answer changes the disk.
 *
 * Opt-in like its sibling (it needs a running server, a browser and a real
 * model), so it is NOT part of `make verify`:
 *
 *   node "$DSH/apps/cli/lib/bin.js" --profile feature-loop --port 4188 --no-open
 *   DSH_URL='http://127.0.0.1:4188/?token=…' node test/e2e-in-ui.mjs allow
 *
 *   DSH_URL    the `dsh web:` line, token included. Required — the token is
 *              per boot and this script cannot know it.
 *   OUTCOME    `allow` (the file must appear) or `reject` (it must not).
 *
 * `PROOF_DIR` decides where the file must land. The plugin's own target picker
 * runs in whichever Workspace the host has OPEN, which is not necessarily this
 * checkout — the default is the repository root named by `PROOF_DIR`, so a
 * clean pass proves the picker did what the page said it would.
 *
 * Everything it needs (playwright-core, Chrome) is discovered the same way
 * `e2e-dashboard.mjs` does it; see that file for why.
 */
import { strict as assert } from 'node:assert'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(import.meta.url)

function resolvePlaywrightCore() {
  if (process.env.PLAYWRIGHT_CORE !== undefined) return process.env.PLAYWRIGHT_CORE
  const candidates = [
    join(homedir(), 'node_modules/playwright-core'),
    join(homedir(), 'work/harvey/freepeak/deepseek-harness/node_modules/playwright-core'),
    join(homedir(), '.bun/install/cache/playwright-core'),
  ]
  return candidates.find(c => existsSync(join(c, 'package.json'))) ?? 'playwright-core'
}

function resolveChrome() {
  if (process.env.CHROME_PATH !== undefined) return process.env.CHROME_PATH
  const installed = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  return existsSync(installed) ? installed : undefined
}

const { chromium } = require(resolvePlaywrightCore())

const DSH_URL = process.env.DSH_URL
if (DSH_URL === undefined || DSH_URL === '') {
  console.error('DSH_URL is required: paste the `dsh web:` line, token included.')
  process.exit(2)
}

const outcome = process.argv[2] === 'reject' ? 'reject' : 'allow'
const proofDir = process.env.PROOF_DIR ?? join(homedir(), 'work/harvey/freepeak/dsh-feature-loop')
const proof = join(proofDir, 'proof.txt')
const buttonLabel = outcome === 'allow' ? 'Allow once' : 'Reject'
const buttonClass = outcome === 'allow' ? 'allow' : 'reject'
const task = 'Create the file proof.txt in the current working directory, ' +
  'containing exactly the word hello and nothing else, then read it back.'

if (existsSync(proof)) rmSync(proof)

const executablePath = resolveChrome()
const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
  await page.goto(DSH_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  // The harness's own Preview Notice modal covers the sidebar, so "Feature
  // Loop" is not clickable until it is dismissed. Every fresh instance shows it.
  for (const label of ['Got it', 'OK', 'Continue', 'Close', 'Dismiss']) {
    const b = page.getByRole('button', { name: label, exact: false }).first()
    if (await b.count()) { await b.click().catch(() => undefined); break }
  }
  await page.waitForTimeout(2000)

  await page.getByRole('button', { name: 'Feature Loop', exact: false }).first().click({ force: true })
  await page.waitForTimeout(3500)

  // The note is the target the run WILL use, printed by the page itself.
  const note = (await page.locator('.fl-start-note').textContent()) ?? ''
  console.log('target:', note)

  await page.locator('input.fl-start-input').fill(task)
  await page.locator('button.fl-start-button').click()

  await page.waitForSelector(`.card button.${buttonClass}`, { timeout: 180_000 })
  const card = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.card')].find(e => /APPROVAL REQUIRED/.test(e.innerText ?? ''))
    return (el?.innerText ?? '').replace(/\n+/g, ' | ')
  })
  console.log('card:', card)
  assert.match(card, /REVIEW REQUESTED/, 'the card must carry the gate reason')

  await page.locator(`.card button.${buttonClass}`).first().click()
  console.log('clicked', buttonLabel)

  // Wait for the thread to drain rather than for the file: the file is the
  // assertion, the thread is the UI's own report that it agrees.
  await page.waitForFunction(
    () => /No pending approval requests/.test(document.body.innerText),
    undefined,
    { timeout: 30_000 },
  ).catch(() => undefined)

  const exists = existsSync(proof)
  const content = exists ? readFileSync(proof, 'utf8').trim() : undefined
  console.log('proof:', proof, exists ? `exists (${JSON.stringify(content)})` : 'absent')

  if (outcome === 'allow') {
    assert.ok(exists, 'Allow once must let the write through')
    assert.equal(content, 'hello')
    console.log(`e2e-in-ui (allow): ${buttonLabel} → the file exists at ${proof}`)
  } else {
    assert.equal(exists, false, 'Reject must stop the write')
    console.log(`e2e-in-ui (reject): ${buttonLabel} → no file at ${proof}`)
  }
  await page.screenshot({ path: `docs/evidence/in-ui-${outcome}.png` })
} finally {
  await browser.close()
  // Never leave the proof behind: a stale one makes the next run pass for free.
  if (existsSync(proof)) rmSync(proof)
}
