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
/**
 * The task, and why it is not a one-liner.
 *
 * The single-write proof.txt run is the SMALLEST thing the gate can be asked
 * about, and it is the only kind this script drove for its whole life: one ask,
 * one click, one file. Human usability is not a property of that — it is a
 * property of a run that needs a human SEVERAL times, where the cost of the
 * ask (how long before the card appears, whether each card says WHICH file it
 * is about) is what a real task feels.
 *
 * So the default task fixes a thing with several files, which under the
 * generated profile's gate (`write` is irreversible, `bash` is irreversible)
 * produces several asks. `E2E_TASK` overrides it for the one-write case.
 */
const defaultTask = [
  'Fix three broken things in this project, in order, one file each.',
  'For each: create the file if it is missing, then write the correct content, then read it back to confirm.',
  '1. notes/first.md containing exactly: first note',
  '2. notes/second.md containing exactly: second note',
  '3. notes/third.md containing exactly: third note',
  'Report only when all three exist.',
].join(' ')
const task = process.env.E2E_TASK ?? defaultTask

/**
 * Where the file must land. `PROOF_DIR` is a REQUEST, not an authority: the
 * loop runs in whichever Workspace the host has open, and only the page knows
 * which that is. It is kept as a plain string (never a joined path) because
 * every use below happens after the page has answered.
 */
const requested = process.env.PROOF_DIR
/** Filled in from the page's own note; `undefined` until it has been read. */
let proofDir
/** What the run is expected to write: relative paths and their contents. */
let proofFiles = [['proof.txt', 'hello']]

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
  // The PAGE is the authority. A PROOF_DIR that disagrees with it was printed
  // as a note and then ignored — twice, and the second time silently, because
  // `proofDir ??= fromNote` only assigns when the left side is undefined and
  // the env var was always defined. So the request is checked against the page
  // and refused out loud when they differ.
  if (fromNote === undefined) {
    console.error('the page did not name a target; cannot say where the file lands')
    process.exit(2)
  }
  if (requested !== undefined && requested !== fromNote) {
    console.log(`note: PROOF_DIR (${requested}) is not where the page says the loop runs (${fromNote}); following the page`)
  }
  proofDir = fromNote
  // The artefacts the task names, and the words they must hold. A single
  // `proof.txt` was true for the one-line task and is a lie for the three-file
  // one, so the assertions read the same list the task is built from.
  proofFiles = task === defaultTask
    ? [['notes/first.md', 'first note'], ['notes/second.md', 'second note'], ['notes/third.md', 'third note']]
    : [['proof.txt', 'hello']]
  if (!existsSync(proofDir)) {
    console.error(`the page named a target this machine does not have: ${proofDir}`)
    process.exit(2)
  }
  for (const [rel] of proofFiles) {
    const abs = join(proofDir, rel)
    if (existsSync(abs)) rmSync(abs)
  }

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
  // Settle EVERY ask this run raises, one at a time, exactly as a human does.
  //
  // A run that needs a human several times is the case worth measuring, and it
  // is where the loop's real costs show up: how long the card takes to appear
  // after the model calls the tool, whether the card names WHICH call it is
  // about, and whether the NEXT ask arrives at all once this one is settled.
  // Each wait is printed, because "usable" is a number or it is a guess.
  const waits = []
  let settled = 0
  for (let round = 0; round < 8; round += 1) {
    const startedAt = Date.now()
    const seen = await page.waitForFunction(
      () => [...document.querySelectorAll('.card')]
        .filter(e => /APPROVAL REQUIRED/.test(e.innerText ?? '') && /REVIEW REQUESTED/.test(e.innerText ?? ''))
        .map(e => e.innerText ?? ''),
      undefined,
      { timeout: 180_000 },
    ).then(handle => handle.jsonValue()).catch(() => undefined)
    if (seen === undefined || seen.length === 0) break
    const card = seen.at(-1).replace(/\n+/g, ' | ')
    console.log(`ask ${String(settled + 1)} after ${String((Date.now() - startedAt) / 1000)}s: ${card}`)
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
    console.log(`  clicked ${buttonLabel}`)
    waits.push(Date.now() - startedAt)

    // Wait for THIS ask to leave the screen before looking for the next one,
    // or the loop re-clicks the same card.
    await page.waitForFunction(
      (at) => ![...document.querySelectorAll('.card')]
        .some(e => /APPROVAL REQUIRED/.test(e.innerText ?? '') && (e.innerText ?? '').includes(`asked ${at}`)),
      askedAt,
      { timeout: 60_000 },
    ).catch(() => undefined)
    settled += 1
  }
  console.log(`asks settled: ${String(settled)} (waits ms: ${waits.join(', ') || 'none'})`)

  // Wait for the thread to drain rather than for the files: the files are the
  // assertion, the thread is the UI's own report that it agrees.
  await page.waitForFunction(
    () => /No pending approval requests/.test(document.body.innerText),
    undefined,
    { timeout: 60_000 },
  ).catch(() => undefined)

  const found = proofFiles.map(([rel, want]) => {
    const abs = join(proofDir, rel)
    return { rel, abs, want, exists: existsSync(abs), content: existsSync(abs) ? readFileSync(abs, 'utf8').trim() : undefined }
  })
  for (const f of found) console.log('proof:', f.abs, f.exists ? `exists (${JSON.stringify(f.content)})` : 'absent')

  if (outcome === 'allow') {
    for (const f of found) {
      assert.ok(f.exists, `Allow once must let the write through: ${f.rel}`)
      assert.equal(f.content, f.want, `${f.rel} must hold exactly the requested text`)
    }
    console.log(`e2e-in-ui (allow): ${String(settled)} × ${buttonLabel} → ${String(found.length)} file(s) written, waits ${waits.join(', ') || 'none'}ms`)
  } else {
    for (const f of found) {
      assert.equal(f.exists, false, `Reject must stop the write: ${f.rel}`)
    }
    console.log(`e2e-in-ui (reject): ${String(settled)} × ${buttonLabel} → no file written, waits ${waits.join(', ') || 'none'}ms`)
  }
  await page.screenshot({ path: `docs/evidence/in-ui-${outcome}.png` })
} finally {
  await browser.close()
  // Never leave the proof behind: a stale one makes the next run pass for free.
  if (proofDir !== undefined) {
    for (const [rel] of proofFiles) {
      const abs = join(proofDir, rel)
      if (existsSync(abs)) rmSync(abs)
    }
  }
}
