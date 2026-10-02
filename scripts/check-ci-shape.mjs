#!/usr/bin/env node
/**
 * Fail when a claim about CI stops matching ci.yml.
 *
 * This repo now carries five hand-maintained checks, each of which claims a
 * place it runs. A check that CI stopped invoking still passes on every
 * developer's machine and protects nothing — the failure mode is invisible
 * because the script itself is fine.
 *
 * So the CI SHAPE is the thing that needs a check:
 *
 *   - every script in `scripts/check-*.mjs` is invoked by ci.yml, so no check
 *     can be committed and quietly orphaned;
 *   - every such script is also in `make check`, so `make check` is not
 *     quietly weaker than CI;
 *   - every invocation names the file it runs, so a step cannot invoke
 *     something that does not exist;
 *   - the `test` job installs nothing, which is the property its whole list
 *     depends on — the checks there are only meaningful without a
 *     node_modules, and a step added later would quietly weaken it.
 *
 * All four were verified by breaking each and watching this fail.
 *
 * ponytail: regexes over a workflow file, like the other four. A YAML parser
 * would be more correct and would be a dependency for a check about a file the
 * repo already hand-edits. It exits non-zero and names what is wrong.
 *
 * Run: `node scripts/check-ci-shape.mjs` (CI's `test` job, first step).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const ci = readFileSync(join(repo, '.github/workflows/ci.yml'), 'utf8')
const makefile = readFileSync(join(repo, 'Makefile'), 'utf8')

const checks = readdirSync(join(repo, 'scripts'))
  .filter((f) => f.startsWith('check-') && f.endsWith('.mjs'))
  .sort()

let failed = false
const fail = (msg) => {
  console.error(msg)
  failed = true
}

if (checks.length === 0) fail('no scripts/check-*.mjs found — the glob is wrong, or they were all deleted')

for (const file of checks) {
  const invocation = `node scripts/${file}`
  if (!ci.includes(invocation)) {
    fail(`ci.yml never runs ${invocation}\n`
      + `  It passes on every machine and protects nothing. Add a step for it, or\n`
      + '  delete the script.')
  }
  if (!makefile.includes(invocation)) {
    fail(`Makefile's \`check\` target never runs ${invocation}\n`
      + '  `make check` must not be quietly weaker than CI.')
  }
}

// The `test` job is the no-install one; its whole list depends on it, and a
// later `npm install` step would silently remove the property being tested.
// Slice by JOB boundaries: `  <name>:` at two-space indent starts a job, and
// the first regex's lookahead was one of those — which on this file matched at
// the `typecheck:` that follows nothing, so the whole test job was never
// examined and the install check passed on a job that DID install. Read the
// job by its own section instead of by a guess about where it ends.
function jobBody(name) {
  const start = new RegExp(`^ {2}${name}:$`, 'm').exec(ci)
  if (start === null) return undefined
  const rest = ci.slice(start.index + start[0].length)
  const next = /^ {2}[a-z][a-z-]*:$/m.exec(rest)
  return next === null ? rest : rest.slice(0, next.index)
}

const testJobBody = jobBody('test')
if (testJobBody === undefined) {
  fail('no `test` job found in ci.yml — renamed?')
} else if (/\b(npm|pnpm|yarn) (install|ci)\b/.test(testJobBody)) {
  fail('the `test` job installs dependencies.\n'
    + '  Its test list is deliberately run with NO node_modules — that is what proves\n'
    + '  the files are dependency-free. An install there removes the property.')
}

// Each `node scripts/…` invocation must name a file that exists. A typo in a
// step fails that step, but only after the four checks above already pass.
for (const m of ci.matchAll(/run:\s*(?:.*\\\s*)?node\s+scripts\/([\w.-]+\.mjs)/g)) {
  if (!existsSync(join(repo, 'scripts', m[1]))) {
    fail(`ci.yml runs scripts/${m[1]}, which does not exist`)
  }
}

if (failed) process.exit(1)
console.log(`ci shape: ${String(checks.length)} checks, all invoked by ci.yml and by make check; `
  + 'the test job still installs nothing.')
