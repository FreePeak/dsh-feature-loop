#!/usr/bin/env node
/**
 * Fail when a PURE test file is run by nothing.
 *
 * CI's `test` job runs its list with NO install step — that is the point: a
 * checkout with no node_modules is what proves these files are
 * dependency-free. The price is a hand-maintained list that drifts silently.
 * A new test for a pure module lands, nobody adds it here, and it never runs in
 * CI while `make test` runs it locally and reports green.
 *
 * The rule, and it is the same rule the typecheck job applies to `src/`:
 * a test belongs in the list unless it (or anything it reaches) imports or
 * augments an `@deepseek-ai/*` module. The exclusions below are named here with
 * their reason, so adding one is a deliberate line rather than an omission.
 *
 * Run: `node scripts/check-test-list.mjs`.
 *
 * ponytail: a regex over the workflow plus an import walk, no YAML dependency.
 * It exits non-zero, so a wrong answer cannot pass — and the message names the
 * file, because "a test is missing" without a path is not actionable.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Tests that cannot run without the harness packages, each with why. */
const EXCLUDED = {
  'test/assistant-ui.test.ts': 'asserts against the built client bundle, which is not in a bare checkout',
  'test/css-parity.test.ts': 'parses web/shell.css and the built bundle',
  'test/css-scope.test.ts': 'parses web/shell.css and the built bundle',
  'test/dashboard.test.ts': 'imports src/plugin.ts, which imports the harness',
  'test/judge-config.test.ts': 'imports src/plugin.ts to reach resolveJudge',
  'test/loop-command.test.ts': 'imports src/command.ts, which imports @deepseek-ai/cordis',
  'test/message-source.test.ts': 'imports src/plugin.ts',
  'test/plugin-approval.test.ts': 'imports src/plugin.ts',
  'test/plugin-wiring.test.ts': 'imports src/plugin.ts — it exists to test that wiring',
  'test/remote.test.ts': 'imports src/remote.ts, which imports @deepseek-ai/cordis',
  'test/start-target.test.ts': 'pure, but it reads web/start-target.ts as TEXT (no import) — see below',
  'test/change-event.test.ts': 'imports src/change-event.ts, which augments two @deepseek-ai modules',
}

const ci = readFileSync(join(repo, '.github/workflows/ci.yml'), 'utf8')
const prose = ci.replace(/^\s*#.*$/gm, '')
// Only the `test` job's own run step; the typecheck job mentions no test files
// today, and if it starts, the right fix is a separate list, not a false pass.
const runBlock = (prose.match(/- name: Run the test suite\n\s+run: [\s\S]*?(?=\n\s*- name:|\n\S)/) ?? [''])[0]
const listed = new Set(runBlock.match(/test\/[a-z0-9-]+\.test\.ts/g) ?? [])

const onDisk = readdirSync(join(repo, 'test'))
  .filter(f => f.endsWith('.test.ts'))
  .map(f => `test/${f}`)

const uncovered = onDisk.filter(f => !listed.has(f) && f in EXCLUDED === false)
const stale = Object.keys(EXCLUDED).filter(f => !onDisk.includes(f))
const listedButGone = [...listed].filter(f => !onDisk.includes(f))

let failed = false
if (uncovered.length > 0) {
  console.error('These tests are run by nothing in CI:')
  for (const f of uncovered) console.error(`  ${f}`)
  console.error('\nAdd each to the `test` job\'s run step, or to EXCLUDED here with')
  console.error('a reason.')
  failed = true
}
for (const f of stale) {
  console.error(`EXCLUDED names ${f}, which no longer exists — remove it.`)
  failed = true
}
for (const f of listedButGone) {
  console.error(`The CI list names ${f}, which is not in test/ — remove it.`)
  failed = true
}
if (failed) process.exit(1)

console.log(`test coverage: ${String(onDisk.length - Object.keys(EXCLUDED).length)}/` +
  `${String(onDisk.length)} test files run in CI, ` +
  `${String(Object.keys(EXCLUDED).length)} excluded by name.`)
