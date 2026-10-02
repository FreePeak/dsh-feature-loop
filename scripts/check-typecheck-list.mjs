#!/usr/bin/env node
/**
 * Fail when a `src/` module is typechecked by nothing.
 *
 * The CI typecheck job lists its inputs by hand, because the harness packages
 * are peers that job deliberately does not install — so there is no tsconfig
 * project to point at. A hand-maintained list drifts silently: a new pure
 * module lands, is never added, and its types are checked by no job and no
 * local run (`make typecheck` reads tsconfig.json, which is a different set).
 *
 * That is not hypothetical. This script was written because the list HAD
 * drifted: `src/approvals.ts`, `src/watcher-ttl.ts` and `src/change-event.ts`
 * were all absent, and the first two import nothing but this repo's own modules.
 * The third is subtler and is why this is a script rather than a one-line grep:
 *
 *   - `approvals.ts` and `watcher-ttl.ts` belong in the list, and now are;
 *   - `change-event.ts` LOOKS like they do — it imports nothing at all — but it
 *     is two `declare module` AUGMENTATIONS of `@deepseek-ai/cordis` and
 *     `@deepseek-ai/dsh-typert-protocol`. A `tsc` run that has not installed
 *     those packages rejects an augmentation of a module it cannot resolve
 *     (TS2664), so listing it turns CI red with an error that reads like a bug
 *     in the module rather than a bug in the list.
 *
 * So the rule is: every `src/*.ts` is either in the CI list or in EXCLUDED,
 * with a reason, right here. Adding a module means touching one of the two, and
 * forgetting is a failure with a message that names the file.
 *
 * Run: `node scripts/check-typecheck-list.mjs` (CI's last typecheck step).
 *
 * ponytail: reads the workflow file with a regex rather than a YAML parser —
 * the shape it needs is "a line mentioning src/x.ts", and a dependency would be
 * a worse trade than the 20 lines above. It exits non-zero, so a wrong answer
 * cannot pass.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Modules that are typechecked locally (`npx tsc --noEmit` against a harness
 * checkout) rather than in CI, each with why it cannot go in the CI list.
 */
const EXCLUDED = {
  'src/change-event.ts':
    'two `declare module` augmentations of @deepseek-ai/cordis and ' +
    '@deepseek-ai/dsh-typert-protocol; a tsc run without those packages rejects ' +
    'the augmentation (TS2664). Typechecked with src/plugin.ts, which imports both.',
  'src/command.ts': 'imports @deepseek-ai/cordis, for the host command registry.',
  'src/index.ts': 'the package entry; imports the harness and src/plugin.ts.',
  'src/plugin.ts': [
    'imports four @deepseek-ai/* packages; this is the module the job exists to avoid.',
    'NOT TYPECHECKED ANYWHERE, verified 2026-10-03: `npx tsc --noEmit` against the',
    'whole tsconfig reports 11 errors here, all of the form `ctx.on(...)` where the',
    'event is not on cordis`\'s `Events` — @deepseek-ai/dsh-llm is not published into',
    'node_modules/@deepseek-ai (15 packages are linked there and it is not one), so its',
    '`Events` augmentation is absent. `scripts/typecheck.sh` guards on that directory',
    'existing, the guard is false, and it falls through to this list. So the README',
    'claimed "clean, all of src/ incl. plugin.ts" for a file no typecheck reaches.',
    'Corrected in KNOWN-ISSUES §1g; the decision about vendoring the augmentation is',
    'deliberately left to a maintainer.',
  ].join('\n    '),
  'src/remote.ts': 'imports @deepseek-ai/cordis and @deepseek-ai/dsh-typert-protocol.',
}

const ci = readFileSync(join(repo, '.github/workflows/ci.yml'), 'utf8')
// Every `src/*.ts` the workflow mentions anywhere — the typecheck command and
// the prose around it both count, which is why prose is stripped first.
const prose = ci.replace(/^\s*#.*$/gm, '')
const listed = new Set(prose.match(/src\/[a-z0-9-]+\.ts/g) ?? [])

const onDisk = readdirSync(join(repo, 'src'))
  .filter(f => f.endsWith('.ts'))
  .map(f => `src/${f}`)

const uncovered = onDisk.filter(f => !listed.has(f) && f in EXCLUDED === false)
const staleExclusions = Object.keys(EXCLUDED).filter(f => !onDisk.includes(f))
const listedButGone = [...listed].filter(f => !onDisk.includes(f))

let failed = false
if (uncovered.length > 0) {
  console.error('These src/ modules are typechecked by nothing:')
  for (const f of uncovered) console.error(`  ${f}`)
  console.error('\nAdd each to the tsc command in .github/workflows/ci.yml, or to')
  console.error('EXCLUDED in scripts/check-typecheck-list.mjs with a reason.')
  failed = true
}
for (const f of staleExclusions) {
  console.error(`EXCLUDED names ${f}, which no longer exists — remove it.`)
  failed = true
}
for (const f of listedButGone) {
  console.error(`The CI list names ${f}, which is not in src/ — remove it.`)
  failed = true
}
if (failed) process.exit(1)

console.log(`typecheck coverage: ${String(onDisk.length - Object.keys(EXCLUDED).length)}/` +
  `${String(onDisk.length)} modules checked in CI, ` +
  `${String(Object.keys(EXCLUDED).length)} excluded by name.`)

// The demo's entry point is referenced by four npm scripts and by demo/run.sh,
// and it is NOT in src/ — so nothing above would notice it going missing, which
// is exactly what happened in 633c1e2 (the file was deleted by an unrelated
// change and every demo script pointed at nothing until 2026-10-01).
const demo = join(repo, 'demo/cli.ts')
if (!existsSync(demo)) {
  console.error('demo/cli.ts is missing — `npm run demo` and demo/run.sh both exec it.')
  failed = true
} else {
  const runner = readFileSync(join(repo, 'demo/run.sh'), 'utf8')
  if (!/demo\/cli\.ts/.test(runner)) {
    console.error('demo/run.sh does not reference demo/cli.ts — it points somewhere else.')
    failed = true
  }
}
if (failed) process.exit(1)
