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
 * `PROOF_DIR` decides where the file must land, and it is the ONE thing that
 * can make this fail for a reason that has nothing to do with the gate: the
 * loop runs in whichever Workspace the host has OPEN, so passing a directory
 * the page did not name proves nothing and asserts the wrong path.
 *
 * That is not hypothetical — it is how this script failed the first time it was
 * run against a real profile (2026-10-01): the page said
 * `Runs in "dsh-feature-loop" — /…/dsh-feature-loop`, the click worked, the
 * file appeared there, and the assertion failed because PROOF_DIR pointed
 * elsewhere. So the target is now READ FROM THE PAGE and used as the default;
 * `PROOF_DIR` only overrides it when a person means to.
 *
 * The override is still worth having — mounting a checkout at a path the
 * harness registered under a different name is exactly the case where the page
 * is right and the caller knows better.
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
const buttonLabel = outcome === 'allow' ? 'Allow once' : 'Reject'
const buttonClass = outcome === 'allow' ? 'allow' : 'reject'
const task = 'Create the file proof.txt in the current working directory, ' +
  'containing exactly the word hello and nothing else, then read it back.'

/** Where the file must land: what the page said, unless overridden. */
let proofDir = process.env.PROOF_DIR
let proof = proofDir === undefined ? undefined : join(proofDir, 'proof.txt')

const executablePath = resolveChrome()
const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
  await page.goto(DSH_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  // Two modals stand between a fresh boot and this page, and BOTH block the
  // sidebar — a click on "Feature Loop" under either one does nothing at all,
  // which reads as a dead button rather than as a modal:
  //
  //   "Preview Notice"     — DeepSeek Harness 0.2 is still in preview
  //   "Add an API key"     — offered until you Configure later; on a profile
  //                          whose model route is already declared it is the
  //                          onboarding gate, not a real key request
  //
  // Dismiss each if present, and re-check: dismissing the first can reveal the
  // second, so this cannot `break` on the first hit. Found by running against a
  // profile with no sessions (2026-10-01), where the script sat on a 30s
  // locator timeout with no clue why.
  for (const label of ['Got it', 'OK', 'Continue', 'Close', 'Dismiss', 'Configure later']) {
    const b = page.getByRole('button', { name: label, exact: false }).first()
    if (await b.count()) await b.click().catch(() => undefined)
    await page.waitForTimeout(1500)
  }
  await page.waitForTimeout(2000)

  await page.getByRole('button', { name: 'Feature Loop', exact: false }).first().click({ force: true })
  await page.waitForTimeout(3500)

  // The note is the target the run WILL use, printed by the page itself — and
  // it is the AUTHORITY on where the file lands. `Runs in "x" — /path`.
  const note = (await page.locator('.fl-start-note').textContent()) ?? ''
  console.log('target:', note)
  const fromNote = /—\s*(\S+)\s*$/.exec(note)?.[1]
  proofDir ??= fromNote
  proof = join(proofDir ?? '', 'proof.txt')
  if (!existsSync(proofDir ?? '')) {
    console.error(`the page named a target this machine does not have: ${proofDir}`)
    process.exit(2)
  }
  if (existsSync(proof)) rmSync(proof)

  // Clear the thread before starting, because this script clicks the FIRST card
  // it finds. A run left over from an earlier invocation (or a loop the human
  // abandoned) parks its own ask here, and the click then settles THAT one —
  // which is how this failed the first time it ran against a real profile
  // (2026-10-01): the feed showed `allowed once: bash` while the write this
  // script asked about never happened. A human arriving at a thread with an
  // unexpected card rejects it; that is what this does, and it says so.
  const stale = await page.locator('.card button.reject').count()
  if (stale > 0) {
    console.log(`rejecting ${String(stale)} ask(s) already on screen — not this script's`)
    for (let i = 0; i < stale; i++) {
      await page.locator('.card button.reject').first().click().catch(() => undefined)
      await page.waitForTimeout(1500)
    }
  }

  await page.locator('input.fl-start-input').fill(task)
  await page.locator('button.fl-start-button').click()

  // Wait for THIS run's card, not merely a card: the thread can hold another
  // run's ask, and the feed records what each settle actually was — which is
  // how the mismatch below was diagnosed rather than guessed at.
  await page.waitForFunction(
    (reason) => [...document.querySelectorAll('.card')]
      .filter(e => /APPROVAL REQUIRED/.test(e.innerText ?? ''))
      .some(e => (e.innerText ?? '').includes(reason)),
    'REVIEW REQUESTED',
    { timeout: 180_000 },
  )
  const card = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.card')]
      .find(e => /APPROVAL REQUIRED/.test(e.innerText ?? '') && /REVIEW REQUESTED/.test(e.innerText ?? ''))
    return (el?.innerText ?? '').replace(/\n+/g, ' | ')
  })
  console.log('card:', card)
  assert.match(card, /REVIEW REQUESTED/, 'the card must carry the gate reason')

  // Click the card the run actually produced. `askedAt` is unique per ask and
  // is in the card's own text, so matching on it cannot hit a neighbour — and
  // the wrong card is a silent failure: the click settles, the file is not
  // written, and the assertion that follows reports the plugin rather than the
  // harness that aimed the click.
  const askedAt = /asked ([^|]+?)\s*\|/.exec(card)?.[1]?.trim()
  const selector = askedAt === undefined
    ? `.card button.${buttonClass}`
    : `.card:has-text("asked ${askedAt}") button.${buttonClass}`
  await page.locator(selector).first().click()
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
