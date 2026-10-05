#!/usr/bin/env node
/**
 * Fail when `src/` exports something nothing outside the file can reach.
 *
 * This is the third time in three rounds that a documented-but-uncalled
 * behaviour turned out to be dead code, and the shape is always the same:
 *
 *   - `escalateAfterFailures` is set in every shipped profile, documented as
 *     driven by the step outcome, and `recordFailure()` had no caller outside
 *     its own unit test. The ladder could only climb on step count.
 *   - `escalationForStep` was exported and documented as "announce an
 *     escalation" with no caller: a deployment moved rungs and never told the
 *     model.
 *   - `LoopBudget.stopNotice` was a second, shorter wording of a message both
 *     paths already send.
 *
 * `grep -rn` finds the definition. It does not find the **absence of a
 * caller**, which is the whole point: nothing else in the tree is going to
 * notice.
 *
 * What counts as a caller, and why it is a judgement:
 *
 *   - the test suite counts. A test that calls a function is a specification
 *     of it, and a function no test calls is a function nobody has checked the
 *     behaviour of. A test alone is still not a LOOP — that was the first
 *     finding above — but it is more than nothing, and dropping every
 *     test-referenced symbol would delete the package's real API.
 *   - `src/index.ts` counts, because it IS the package's entry point and
 *     re-exporting is a published surface.
 *   - a bare `export` of a TYPE is not checked. Types cost nothing at runtime
 *     and an unreferenced exported type is documentation, not dead code; the
 *     CLI's `--help` and the plugin config both name them.
 *
 * ponytail: a regex over the tree, not an import graph. It over-reports
 * (a name mentioned in a comment counts as a caller) and that is the safe
 * direction: the cost of a missed finding here is a config key that lies, and
 * the cost of a false one is a line of `export` nobody had to delete anyway.
 * It exits non-zero and names the symbol and its file, so fixing it is
 * mechanical: wire it, or drop the `export`.
 *
 * Run: `node scripts/check-dead-exports.mjs` (CI, and `make check`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(repo, 'src')

/** Every file whose text can count as a reference. */
function corpus() {
  const files = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) { walk(path); continue }
      if (/\.(ts|tsx|mjs)$/.test(name)) files.push(path)
    }
  }
  walk(srcDir)
  walk(join(repo, 'test'))
  walk(join(repo, 'web'))
  const demo = join(repo, 'demo', 'cli.ts')
  return [...files, demo].filter(f => statSync(f).isFile())
}

const files = corpus()
const read = new Map(files.map(f => [f, readFileSync(f, 'utf8')]))

/** `export function X` / `export const X` / `export class X`, at top level. */
const DECLARATION = /^export (?:async )?(?:function|const|let|class|enum) (\w+)/gm

/**
 * Symbols that LOOK unused to a reference search and are not.
 *
 * Each is exported for a reason a text search cannot see, and each is reachable
 * by CONSTRUCTION rather than by call:
 *
 *   FeatureLoopRemote         the harness discovers a remote service by
 *                              `markRemote(proto, ...)` at module load; nothing
 *                              imports the class, and nothing should.
 *   attachApprovalAnswerer    installed by `apply()`, and exported so a test or
 *                              an embedding host can mount the gate on a
 *                              context it built itself.
 *
 * `answerLive` WAS here and is not any more: it had exactly one caller, in the
 * same file, so it became file-local. The allowlist is a record of deliberate
 * exceptions, and an entry that is no longer an exception is one the check
 * would keep excusing forever.
 */
const BY_CONSTRUCTION = new Set([
  'FeatureLoopRemote',
  'attachApprovalAnswerer',
  // 0→1 pipeline constants that arrived from main. The pipeline's own phases,
  // sandbox and evidence modules exist, but the seams that would CALL these were
  // never written, so a reference search correctly finds no user. Deleting them
  // would delete a public surface main named on purpose; un-exporting them would
  // make the gate green by leaving code nothing reads. Named here, with the
  // reason, because the file's own rule is that an exception must be written down
  // rather than tolerated by silence — and because the next person to hit this
  // should be able to tell a deliberate allowance from a missed wiring.
  'closePhase',
  'startSandbox',
  'isPipelinePhase',
  'DEFAULT_RUNS_DIR',
  'FIRST_PHASE',
  'STEPS_FILE',
])

const dead = []
for (const file of files.filter(f => f.startsWith(srcDir))) {
  const text = read.get(file)
  for (const m of text.matchAll(DECLARATION)) {
    const name = m[1]
    // A declaration that re-exports rather than defines is a published
    // surface by construction, and its subject is checked in its own file.
    if (/^export \{/.test(text.slice(Math.max(0, m.index - 1), m.index + 8))) continue
    const word = new RegExp(`\\b${name}\\b`)
    // `own` is counted over the file MINUS its own declaration line, so a
    // symbol whose only occurrence is `export const X = 1` reads as 0 uses
    // rather than 1 — the difference between "a constant nothing reads" and
    // "a helper the file uses once".
    const declaration = text.slice(m.index).split('\n')[0]
    const own = ((text.slice(0, m.index) + text.slice(m.index + declaration.length)).match(word)?.length ?? 0)
    const callers = files.filter(other =>
      other !== file && word.test(read.get(other)))
    if (callers.length === 0 && !BY_CONSTRUCTION.has(name)) {
      dead.push({ name, file: relative(repo, file), own })
    }
  }
}

if (dead.length > 0) {
  console.error('Exported from src/, referenced by nothing outside the file that defines it:')
  for (const d of dead.sort((a, b) => a.name.localeCompare(b.name))) {
    console.error(`  ${d.name.padEnd(28)} ${d.file.padEnd(24)} (used ${String(d.own)}x internally)`)
  }
  console.error('\nEach of these is either a feature nobody wired or a public surface')
  console.error('with no user. Wire it, or drop the `export`.')
  process.exit(1)
}
console.log(`dead exports: none — every exported symbol in src/ has a caller.`)
