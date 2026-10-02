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
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Tests that cannot run without the harness packages, each with why. */
const EXCLUDED = {
  'test/css-parity.test.ts': 'parses web/shell.css and the built bundle',
  'test/css-scope.test.ts': 'parses web/shell.css and the built bundle',
  'test/dashboard.test.ts': 'imports src/plugin.ts, which imports the harness',
  'test/judge-config.test.ts': 'imports src/plugin.ts to reach resolveJudge',
  'test/loop-command.test.ts': 'imports src/command.ts, which imports @deepseek-ai/cordis',
  'test/message-source.test.ts': 'imports src/plugin.ts',
  'test/plugin-approval.test.ts': 'imports src/plugin.ts',
  'test/plugin-wiring.test.ts': 'imports src/plugin.ts — it exists to test that wiring',
  'test/remote.test.ts': 'imports src/remote.ts, which imports @deepseek-ai/cordis',
  'test/change-event.test.ts': 'imports src/change-event.ts, which augments two @deepseek-ai modules',
}

const ci = readFileSync(join(repo, '.github/workflows/ci.yml'), 'utf8')
const prose = ci.replace(/^\s*#.*$/gm, '')
// Only the `test` job's own run step; the typecheck job mentions no test files
// today, and if it starts, the right fix is a separate list, not a false pass.
const runBlock = (prose.match(/- name: Run the test suite\n\s+run: [\s\S]*?(?=\n\s*- name:|\n\S)/) ?? [''])[0]
// Both directories. The pattern is anchored on `test/` OR `demo/test/`, so
// adding a suite beside the demo is covered by the same scan rather than by a
// second hand-written list — the copy-is-how-it-drifted problem this file
// exists to catch, one directory over.
const listed = new Set((runBlock.match(/(?:^|\s)(?:demo\/)?test\/[a-z0-9-]+\.test\.ts/g) ?? [])
  // The leading `\s` is part of the match so adjacent paths do not run together
  // (`test/a.test.ts demo/test/b.test.ts` is one match without it), so strip it
  // off before comparing — the set holds PATHS, not fragments.
  .map(m => m.trim()))

// Only `*.test.ts`. The `test/*.mjs` files are opt-in PROBES, not suite
// members: `e2e-dashboard`, `e2e-in-ui` and `e2e-settings` need a browser,
// `probe-container` needs a RUNNING container, and `capture-standalone-evidence`
// writes images.
// Counting them here would be a false failure the first time one is added, and
// the fix would be to widen the pattern — which is how a check starts passing
// everything. They are named in EXCLUDED-adjacent prose in docker/README.md and
// the Makefile instead, which is where a person looks for them.
/** Suites beside their own code, outside `test/`. See DEMO_TESTS below. */
const onDisk = readdirSync(join(repo, 'test'))
  .filter(f => f.endsWith('.test.ts'))
  .map(f => `test/${f}`)

/**
 * The demo's own suite, which lives beside its code rather than in `test/`.
 *
 * `demo/test/latency-window.test.ts` is what the README's quick start proves the
 * loop with — `bash demo/run.sh` reaches `goal-met` by making THAT file pass.
 * It was checked by nothing: not by CI, not by `make check`, and (measured
 * 2026-10-03) not even by the drift check, whose `onDisk` only ever looked in
 * `test/`. So a broken demo suite reads as a broken demo and a working one as a
 * working demo, with no signal either way.
 *
 * It is pure — no harness, no network, no model — so it costs nothing to run and
 * is added to the CI list rather than excluded from it. `check-typecheck-list.mjs`
 * already watches `demo/cli.ts` for exactly this reason; this is the same class
 * of drift one directory over.
 */
const DEMO_TESTS = ['demo/test/latency-window.test.ts']
for (const f of DEMO_TESTS) {
  if (!existsSync(join(repo, f))) {
    console.error(`${f} does not exist — it is the suite demo/run.sh proves the loop with.`)
    process.exit(1)
  }
  if (!listed.has(f)) {
    console.error(
      `${f} is not in the CI test list.\n` +
      '  It is pure (no harness, no network, no model) and it is what the quick\n' +
      '  start proves: bash demo/run.sh reaches goal-met by making it pass. A suite\n' +
      '  nothing runs cannot tell a working demo from a broken one.',
    )
    process.exit(1)
  }
}

// `onDisk` spans both directories, so a CI entry is "gone" only when neither
// holds it. Comparing a `demo/test/` entry against a list built from `test/` is
// the copy-drift this file exists to catch, applied to itself.
// `onDisk` now spans both directories, so a CI entry is "gone" only when neither
// holds it. Comparing a `demo/test/` entry against a list built from `test/` is
// the copy-drift this file exists to catch, applied to itself.
const allOnDisk = [...onDisk, ...DEMO_TESTS]

const uncovered = onDisk.filter(f => !listed.has(f) && f in EXCLUDED === false)
const stale = Object.keys(EXCLUDED).filter(f => !allOnDisk.includes(f))
const listedButGone = [...listed].filter(f => !allOnDisk.includes(f))

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
  console.error(`The CI list names ${f}, which exists in neither test/ nor demo/test/ — remove it.`)
  failed = true
}
if (failed) process.exit(1)

console.log(`test coverage: ${String(onDisk.length - Object.keys(EXCLUDED).length)}/` +
  `${String(onDisk.length)} test files run in CI, ` +
  `${String(Object.keys(EXCLUDED).length)} excluded by name.`)
