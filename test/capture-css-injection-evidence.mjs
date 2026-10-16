#!/usr/bin/env node
/**
 * Capture evidence for the plugin's CSS injection into a host DSH web UI.
 *
 * A screenshot of a broken-looking page proves nothing on its own: nobody can
 * tell from one image whether the styling is the plugin's fault or the app's
 * own. So this measures the thing itself, as a difference:
 *
 *   - boots a CONTROL DSH web instance with the plugin NOT installed;
 *   - connects to a PLUGIN instance that is already running (passed as argv);
 *   - counts the CSS rules and stylesheet bytes in each rendered page;
 *   - screenshots both, and diffs the computed style of host chrome.
 *
 * The delta is the plugin's contribution, attributed by construction rather
 * than by guessing which rule came from where.
 *
 * Usage: node --experimental-strip-types test/capture-css-injection-evidence.mjs <control-url> <plugin-url>
 * Env:   PLAYWRIGHT_CORE — path to a playwright-core package
 *        CHROME_PATH    — explicit Chromium executable
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'docs', 'evidence')
mkdirSync(OUT, { recursive: true })


/** Lines of the transcript, as `[status] description`. */
const transcript = []
const record = (status, description) => {
  transcript.push([status, description])
  console.log(`[${status}] ${description}`)
}

function resolveChrome() {
  if (process.env.CHROME_PATH !== undefined) return process.env.CHROME_PATH
  const base = join(homedir(), 'Library/Caches/ms-playwright')
  const shell = join(base, 'chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell')
  if (existsSync(shell)) return shell
  const full = join(base, 'chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')
  return existsSync(full) ? full : undefined
}

function resolvePlaywrightCore() {
  for (const c of [process.env.PLAYWRIGHT_CORE, '/tmp/pw/node_modules/playwright-core'].filter(x => x !== undefined)) {
    if (existsSync(c)) return c
  }
  return 'playwright-core'
}

// ── two instances, supplied by the caller ─────────────────────────────────
// Provisioning lives in the shell, not here: a capture script that also boots
// servers is a script whose failures are hard to read. The caller passes a
// control (plugin absent) and an under-test (plugin present) URL; both must be
// real running instances, because the whole claim is a difference between them.
const controlUrl = process.argv[2]
const pluginUrl = process.argv[3]
if (controlUrl === undefined || pluginUrl === undefined) {
  console.error('usage: capture-css-injection-evidence.mjs <control-url> <plugin-url>')
  process.exit(2)
}
record('setup', `control  (plugin absent): ${controlUrl.replace(/\?token=.*/, '?token=…')}`)
record('setup', `under test (plugin present): ${pluginUrl.replace(/\?token=.*/, '?token=…')}`)

// ── measure both ──────────────────────────────────────────────────────────
const { createRequire } = await import('node:module')
const require_ = createRequire(import.meta.url)
const { chromium } = require_(resolvePlaywrightCore())
const executablePath = resolveChrome()
const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })

/**
 * Render one instance and report what its document actually contains.
 */
async function measure(url, screenshot) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = []
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 160)))
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {})
  // Wait for the app to actually finish its own load before measuring. A
  // screenshot taken while the sidebar is still its skeleton state is not
  // comparable to one taken after, and comparing the two invents a styling
  // difference that is really just a load difference.
  await page.waitForFunction(
    () => !document.body.innerText.includes('No sessions yet'),
    undefined,
    { timeout: 30_000 },
  ).catch(() => {})
  await page.waitForTimeout(3000)

  const data = await page.evaluate(() => {
    const sheets = [...document.querySelectorAll('style, link[rel=stylesheet]')]
    let rules = 0
    let bytes = 0
    for (const sheet of sheets) {
      try {
        rules += sheet.sheet?.cssRules?.length ?? 0
      } catch { /* cross-origin sheet, not readable */ }
      bytes += (sheet.textContent ?? '').length + (sheet.href ?? '').length
    }
    // The host's own modal heading, which the plugin's stylesheet changes.
    const modal = [...document.querySelectorAll('div')]
      .find(d => /internal testing notice/i.test(d.textContent ?? '') && d.children.length < 12)
    const heading = modal === undefined
      ? null
      : [...modal.querySelectorAll('h1, h2, h3')]
          .map(e => ({ text: (e.textContent ?? '').trim().slice(0, 30), textTransform: getComputedStyle(e).textTransform }))[0] ?? null
    return {
      sheets: sheets.length,
      rules,
      bytes,
      heading,
      bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 36),
    }
  })

  await page.screenshot({ path: join(OUT, screenshot) })
  await page.close()
  return { ...data, pageErrors }
}

const controlM = await measure(controlUrl, 'css-injection-control.png')
const pluginM = await measure(pluginUrl, 'css-injection-plugin.png')
await browser.close()

record(String(controlM.rules), `CONTROL (no plugin): ${controlM.sheets} stylesheets, ${controlM.rules} CSS rules, ${controlM.bytes} bytes`)
record(String(pluginM.rules), `PLUGIN instance: ${pluginM.sheets} stylesheets, ${pluginM.rules} CSS rules, ${pluginM.bytes} bytes`)

const rulesDelta = pluginM.rules - controlM.rules
const bytesDelta = pluginM.bytes - controlM.bytes
record(String(rulesDelta), `DELTA attributed to this plugin: +${rulesDelta} CSS rules, +${bytesDelta} bytes`)

record(
  controlM.heading === null ? 'n/a' : controlM.heading.textTransform,
  `CONTROL host modal heading: "${controlM.heading?.text ?? 'n/a'}" -> text-transform: ${controlM.heading?.textTransform ?? 'n/a'}`,
)
record(
  pluginM.heading === null ? 'n/a' : pluginM.heading.textTransform,
  `PLUGIN host modal heading: "${pluginM.heading?.text ?? 'n/a'}" -> text-transform: ${pluginM.heading?.textTransform ?? 'n/a'}`,
)

const headingLeaked = controlM.heading !== null && pluginM.heading !== null
  && controlM.heading.textTransform !== pluginM.heading.textTransform
record(headingLeaked ? 'LEAK' : 'none', headingLeaked
  ? 'HOST CSS CHANGED: the plugin restyles an element the host owns'
  : 'no computed-style change observed on the host modal heading')

record(String(pluginM.pageErrors.length), `page errors in the plugin instance: ${pluginM.pageErrors.length}`)

const md = [
  '# Plugin CSS injection — evidence capture',
  '',
  'Generated by `test/capture-css-injection-evidence.mjs` against two real DSH web',
  'instances on this machine: a control with the plugin **not** installed, and the',
  'instance under test. The control exists so the plugin\'s contribution is',
  'attributed by difference, rather than by guessing which rule came from where —',
  'the host app uses Tailwind too, so both stylesheets contain `--tw-*` variables',
  'and no single marker separates them.',
  '',
  '| Result | Observation |',
  '|---|---|',
  ...transcript.map(([s, d]) => `| \`${s}\` | ${String(d).replace(/\|/g, '\\|')} |`),
  '',
  '| | Control (no plugin) | Plugin instance |',
  '|---|---|---|',
  `| Stylesheets | ${controlM.sheets} | ${pluginM.sheets} |`,
  `| CSS rules | ${controlM.rules} | ${pluginM.rules} |`,
  `| CSS bytes | ${controlM.bytes} | ${pluginM.bytes} |`,
  `| Body font | \`${controlM.bodyFont}\` | \`${pluginM.bodyFont}\` |`,
  '',
  `![control](css-injection-control.png)`,
  '',
  `![plugin](css-injection-plugin.png)`,
  '',
  '## What this proves',
  '',
  `- The plugin adds **${rulesDelta} CSS rules** (${controlM.rules} → ${pluginM.rules}) and`,
  `  **${bytesDelta} bytes** of stylesheet to the host document.`,
  '',
  "- It ships `client.js` with Tailwind compiled inline plus `assets/assistant-ui/dashboard.css`",
  '  and `shell.css`, and the client runtime creates a `<style>` element to inject them',
  '  **unscoped** into the host page. Its utilities and reset therefore compete with the',
  '  shell\'s own styles in one document.',
  '',
  headingLeaked
    ? '- A host element the plugin does not own is **visibly restyled**: the modal heading\n  changes `text-transform`. That is the leak, observed rather than inferred.'
    : '- No computed-style change was observed on the sampled host element, but the rule\n  count still grows: the risk is latent collision, not an observed one.',
  '',
  '## What this does not prove',
  '',
  '- This is two instances on one machine and one browser, not a visual regression suite.',
  '- It counts rules and bytes. It does not attempt to enumerate which specific',
  '  selectors collide; that is the work a fix would need to do.',
  '- A page that happens to render acceptably is not a page that is unaffected — the',
  '  same unscoped injection can break a host that ships different styles.',
  '',
].join('\n')
writeFileSync(join(OUT, 'css-injection.md'), md)
console.log('\nwrote docs/evidence/css-injection.md and two screenshots')
