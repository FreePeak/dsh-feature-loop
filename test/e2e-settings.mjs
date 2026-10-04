#!/usr/bin/env node
/**
 * The SETTINGS page, clicked, and the next run obeying it.
 *
 * `e2e-in-ui.mjs` proves the approval card's buttons work.
 * `e2e-dashboard.mjs` proves the standalone page's. Neither opens the Settings
 * tab, and the Settings tab is the only surface that writes
 * `~/.config/dshloop/config.yaml` — the file whose whole purpose is to change
 * what the gate does. It was display-only for its first three weeks of life,
 * and the only tests that covered it called the merge function directly, which
 * is the helper rather than the page.
 *
 * So this drives the page the way a person does: open the Settings tab, change
 * one control, press **Save**, read the notice, and then assert the FILE. The
 * gate obeying it is `e2e-in-ui`'s job, on a server booted after the save — a
 * restart is what applies it, and the notice says so.
 *
 * Two modes, because one save must be provably reversible:
 *
 *   node test/e2e-settings.mjs            assert the page's own contract
 *   node test/e2e-settings.mjs --gate     also set the gate to `deny`, and
 *                                         assert a subsequent live run is
 *                                         refused (needs a server it controls)
 *
 * `DSH_URL` is the `dsh web:` line, token included — per boot, so this script
 * cannot know it. `--gate` additionally needs `DSH_HOME` and `ONEGW_API_KEY`
 * because it boots a profile of its own to prove the denial.
 *
 * Run: `node --experimental-strip-types test/e2e-settings.mjs`
 * Opt-in, like its siblings: it needs a running server and a real browser.
 */
import { strict as assert } from 'node:assert'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

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

/** The gate half needs a profile it can boot and a settings home of its own. */
const wantGate = process.argv.includes('--gate')
const harness = process.env.DSH_HARNESS ?? join(homedir(), 'work/harvey/freepeak/deepseek-harness')
const cli = join(harness, 'apps/cli/lib/bin.js')
if (wantGate) {
  // The gate half boots a profile of its own, and it has to be one the
  // settings file can apply TO — the same `$DSH_HOME`, not a temp dir with a
  // hand-written config beside it, or the run proves nothing about this file.
  for (const [key, value] of [['DSH_E2E_HOME', process.env.DSH_E2E_HOME], ['DSH_E2E_PROFILE', process.env.DSH_E2E_PROFILE]]) {
    // (and DSH_E2E_APP must not be `web` — see the note at the spawn below)
    if (value === undefined || value === '') {
      console.error(`--gate needs ${key}: the profile whose DSH_HOME this settings file lives in.`)
      process.exit(2)
    }
  }
}

/** Where the page's own file lives, so the assertions can read it. */
function settingsFile() {
  const xdg = process.env.XDG_CONFIG_HOME
  const base = xdg !== undefined && xdg !== '' ? xdg : join(homedir(), '.config')
  return join(base, 'dshloop', 'config.yaml')
}

/** The settings as a flat key→value, which is the only shape asserted on. */
function readSettings(path) {
  if (!existsSync(path)) return {}
  // The page writes YAML with one scalar or one shallow map per key. Parsing it
  // properly needs a YAML dependency this opt-in script does not assume, and the
  // two keys asserted here are scalars or a two-line block, so a targeted read
  // is honest about what it checks: the bytes the page wrote.
  const text = readFileSync(path, 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const scalar = /^([A-Za-z][A-Za-z0-9]*):\s*(\S+)\s*$/.exec(line)
    if (scalar !== null) { out[scalar[1]] = scalar[2]; continue }
    const map = /^([A-Za-z][A-Za-z0-9]*):\s*$/.exec(line)
    if (map !== null) {
      // Collect the indented children of this key.
      const start = text.split('\n').indexOf(line)
      const lines = text.split('\n')
      const block = {}
      for (let i = start + 1; i < lines.length && /^\s+\S/.test(lines[i]); i += 1) {
        const child = /^\s+([A-Za-z][A-Za-z0-9]*):\s*(\S+)\s*$/.exec(lines[i])
        if (child !== null) block[child[1]] = child[2]
      }
      out[map[1]] = block
    }
  }
  return out
}

/**
 * Write the settings file the way a person would edit it: by hand, in YAML.
 *
 * Deliberately NOT through the page's own save. The two mixed-map assertions
 * below need a file the page did not write, because the page cannot write a
 * mixed map — picking a posture replaces every class (§1n) — so the only way to
 * put one in front of the page is to type it.
 *
 * @param {Record<string, unknown>} settings - the mapping to write.
 * @returns {void}
 */
function writeSettingsFile(settings) {
  mkdirSync(dirname(settingsFile()), { recursive: true })
  const lines = ['# written by test/e2e-settings.mjs — a hand-edited file, on purpose', '']
  for (const [key, value] of Object.entries(settings)) {
    if (typeof value === 'object' && value !== null) {
      lines.push(`${key}:`)
      for (const [k, v] of Object.entries(value)) lines.push(`  ${k}: ${v}`)
    } else {
      lines.push(`${key}: ${String(value)}`)
    }
  }
  writeFileSync(settingsFile(), `${lines.join('\n')}\n`)
}

const before = readSettings(settingsFile())
const executablePath = resolveChrome()
const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
let saved = false
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
  await page.goto(DSH_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  // The same two modals e2e-in-ui dismisses; see that file for why each is here.
  for (const label of ['Got it', 'OK', 'Continue', 'Close', 'Dismiss', 'Configure later']) {
    const b = page.getByRole('button', { name: label, exact: false }).first()
    if (await b.count()) await b.click().catch(() => undefined)
    await page.waitForTimeout(1500)
  }
  await page.waitForTimeout(1500)

  await page.getByRole('button', { name: 'Feature Loop', exact: false }).first().click({ force: true })
  await page.waitForTimeout(3500)

  // 1. The tab exists and opens. An assertion that the page LOADED is the
  //    precondition for every other one, and it is a real one: the sidebar
  //    entry is dead while a modal covers it, which reads as a broken button.
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.waitForTimeout(2000)
  // The Gate mode select, found by its OWN label rather than by index. `nth(1)`
  // was the first draft and it is the same mistake the settings wiring already
  // made once: a positional selector reads as an identity, and adding a control
  // above it silently retargets the assertion at the wrong field. The page puts
  // the label and the control in the same `.fl-row`, so the row is the scope.
  const gateSelect = page
    .locator('.fl-row')
    .filter({ hasText: 'Gate mode' })
    .locator('select')
    .first()
  const gateValue = await gateSelect.inputValue()
  console.log('gate mode as loaded:', gateValue)
  assert.ok(gateValue === 'ask' || gateValue === 'deny', 'the Gate mode select must show a real value')

  // 2. Save the value that is already loaded. This is the honest first press:
  //    it must write the file and must NOT change behaviour, so anything the
  //    script breaks later is attributable to the second press alone.
  await page.getByRole('button', { name: 'Save', exact: false }).first().click()
  await page.waitForTimeout(2500)
  const notice = await page.locator('.fl-notice[data-kind="ok"]').first().textContent()
  console.log('notice:', (notice ?? '').replace(/\s+/g, ' ').slice(0, 120))
  assert.match(notice ?? '', /Saved to config\.yaml/, 'a successful save must say so')
  assert.match(
    notice ?? '',
    /next plugin load/,
    'the notice must name when it applies — a save that reads as immediate is a lie',
  )
  assert.ok(existsSync(settingsFile()), 'the settings file must exist after a save')
  saved = true

  // What the page's own Save produced, captured BEFORE any hand-editing below.
  // The first version read it AFTER `writeSettingsFile` had already put the
  // mixed map in place, so the "restore" wrote the mixed map back, the marker
  // stayed up, and the assertion was right while the fixture was wrong.
  const after = readSettings(settingsFile())

  // 3. The MIXED-map marker and the sentence about what the select does. Both
  //    are copy, and copy is exactly what a later refactor softens: §1n added both
  //    in `web/entry.tsx` and nothing asserted either, so a wording pass could
  //    have removed them without a single red test. They are asserted HERE because
  //    this is the only place the rendered strings exist.
  // The hint is a sibling `.fl-hint` inside the `Field` wrapper, so scope to that
  // element rather than to `../..`: the parent subtree also contains the NEXT
  // field's hint, and asserting on it once the marker is present picks up text
  // this row never rendered. That is the same positional-assumption bug the rest
  // of this file records, wearing a different hat.
  const gateHintOf = async () => {
    const field = page.locator('.fl-row').filter({ hasText: 'When to stop and ask' }).first()
    return (await field.locator('xpath=../..').locator('.fl-hint').first().innerText())
      .replace(/\s+/g, ' ')
  }

  // A file that is not one of the three postures must say so, and must say what
  // touching the select will do to it. Measured 2026-10-03 with
  // `{write: always-approve, edit: auto, bash: auto}` in the file.
  await writeSettingsFile({ gatePolicies: { write: 'always-approve', edit: 'auto', bash: 'auto' } })
  // **Reload**, not a tab switch: the draft is fetched once on mount, so the page
  // still shows the previous file until something re-reads it. The first version
  // of this block switched tabs and the assertion below therefore measured a
  // STALE render — which is why the mixed map appeared to stay on screen after
  // restoring it. `Reload` is the button the page ships for exactly this.
  await page.getByRole('button', { name: 'Reload', exact: false }).first().click()
  await page.waitForTimeout(2500)
  const mixedHint = await gateHintOf()
  console.log('mixed-file hint:', mixedHint.slice(0, 130))
  assert.match(
    mixedHint,
    /Not one of the postures, and this page has no per-tool fields/,
    'a hand-edited map that is not a posture must be marked, or the page shows one posture\'s copy for a file it does not describe. The marker also has to name the FILE, because the page has no per-tool fields: three selects and nothing that edits one class.',
  )
  assert.match(
    mixedHint,
    /REPLACES every class in that file/,
    'picking an option overwrites every class in the file, and the page must say so BEFORE the operator does it',
  )
  // Now put the file back and confirm the sentence is GONE: the marker is about
  // the file in front of the reader, so restoring the file must clear it. That
  // also proves the assertion above is not passing on a stale render.
  await writeSettingsFile(after)
  await page.getByRole('button', { name: 'Reload', exact: false }).first().click()
  await page.waitForTimeout(2500)
  const restoredHint = await gateHintOf()
  assert.ok(
    !restoredHint.includes('REPLACES'),
    `the REPLACES sentence belongs to a mixed file only; after restoring it the hint read: ${restoredHint.slice(0, 120)}`,
  )

  // Leave the file as the page's own save left it, so the restore below is the
  // only thing that writes.
  await writeSettingsFile(after)
  await page.getByRole('tab', { name: 'Dashboard' }).click()
  await page.waitForTimeout(600)
  await page.getByRole('tab', { name: 'Settings' }).click()
  await page.waitForTimeout(1500)
  assert.equal(after.gateMode, gateValue, 'the file must hold the value the page showed')
  assert.equal(after.gateMode, before.gateMode ?? after.gateMode,
    're-saving the loaded value must not silently change the mode')

  // 3. The gate half. Two runs against the SAME profile and the SAME task, the
  //    only difference being the file the page just wrote.
  //
  //    It has to be a HEADLESS profile. A web profile answers
  //    "Expected 0 arguments but got 2: web, Create a file…" — the web app takes
  //    options, not a task — so both mistakes here (`no app name` and `web` as
  //    the app) produce the same error and neither looks like the settings
  //    working or not.
  //
  //    And the run is spawned directly rather than through this script, because
  //    `deny` fails CLOSED with no approval channel: a headless run refuses the
  //    write whatever the mode is. So the deny run alone proves nothing — the
  //    assertion is that BOTH runs refuse, which is what a web profile's
  //    human-in-the-loop absence already gives you, and what `ask` looks like
  //    on a box with nobody watching. What differs is the MODE the model is
  //    told about, and the run's own words name it.
  if (wantGate) {
    // Fail early, and by NAME, when the profile under test cannot answer a task
    // at all. A web profile parses the task as its first positional and answers
    // `Expected 0 arguments but got 2` — which is indistinguishable from a
    // refusal unless you know to look for it, and it is what two versions of
    // this script got wrong before the check existed.
    const probe = spawnSync(
      process.execPath,
      [cli, '--profile', process.env.DSH_E2E_PROFILE, 'headless', '--help'],
      { encoding: 'utf8', env: { ...process.env, DSH_HOME: process.env.DSH_E2E_HOME } },
    )
    const probeOut = `${probe.stdout ?? ''}${probe.stderr ?? ''}`
    assert.match(
      probeOut,
      /Usage: dsh --profile .*headless/,
      `--gate needs a profile generated with --headless; DSH_E2E_PROFILE=${String(process.env.DSH_E2E_PROFILE)} booted something else:\n${probeOut.slice(0, 400)}`,
    )

    await gateSelect.selectOption('deny')
    await page.getByRole('button', { name: 'Save', exact: false }).first().click()
    await page.waitForTimeout(2500)
    const written = readSettings(settingsFile())
    console.log('gate mode now on disk:', written.gateMode)
    assert.equal(written.gateMode, 'deny', 'the page must write what the select says')

    const home = process.env.DSH_E2E_HOME
    const profile = process.env.DSH_E2E_PROFILE
    const workspace = process.env.DSH_E2E_WORKSPACE ?? process.cwd()
    const proof = join(workspace, 'proof-deny.txt')
    const task = 'Create a file named proof-deny.txt in this workspace containing the single word hello. Do nothing else.'

    /** One headless run of the same task under whatever the file says now. */
    const runOnce = () => {
      rmSync(proof, { force: true })
      const run = spawnSync(
        process.execPath,
        [cli, '--profile', profile, 'headless', task],
        { encoding: 'utf8', cwd: workspace, env: { ...process.env, DSH_HOME: home } },
      )
      return { out: `${run.stdout ?? ''}${run.stderr ?? ''}`, wrote: existsSync(proof) }
    }

    const denied = runOnce()
    assert.equal(denied.wrote, false, 'gateMode: deny must leave no file')
    // The model's OWN words are the only evidence a headless run offers: nothing
    // logs the verdict to stdout, and a refusal reads differently depending on
    // whether it was told it was denied or merely found no one to ask. Asserting
    // on the disk alone would pass for any failure at all — a crashed boot, a
    // missing key, a task the model chose not to do.
    assert.match(
      denied.out,
      /denied|refus|policy/i,
      `the run must say the policy stopped it; it said:\n${denied.out.slice(-600)}`,
    )
    console.log('e2e-settings (--gate): the saved gateMode: deny refused a live write')

    // And the control: with the file saying `ask`, the same profile and task
    // refuse too — because headless has nobody to ask. Asserting BOTH is what
    // makes the deny result mean something: a run that refuses for the wrong
    // reason looks identical from the outside.
    writeFileSync(settingsFile(), 'gateMode: ask\n')
    const asked = runOnce()
    assert.equal(asked.wrote, false, 'an unanswered ask also fails closed')
    assert.match(asked.out, /approval|denied/, 'the ask run must name the approval it could not get')
    console.log('e2e-settings (--gate): control — the same run under ask also fails closed')
  }

  console.log('e2e-settings: the Settings tab saves, says when it applies, and the file holds it')
} finally {
  await browser.close()
  // Put the file back the way it was. This script edits the OPERATOR's settings,
  // so leaving `deny` behind would silently disarm the gate on the machine that
  // ran it — which is a far worse outcome than a failed check.
  if (saved) {
    const path = settingsFile()
    const now = readSettings(path)
    const original = before.gateMode
    const restore = original === undefined
      ? null
      : `gateMode: ${original}\n`
    if (restore === null) {
      rmSync(path, { force: true })
      console.log('restored: settings file removed (there was none before)')
    } else {
      writeFileSync(path, restore)
      console.log('restored: gateMode back to', now.gateMode, '->', original)
    }
  }
}
