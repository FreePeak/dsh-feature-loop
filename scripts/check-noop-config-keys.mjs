#!/usr/bin/env node
/**
 * Fail when a config key is documented as doing something no hook reads.
 *
 * This is the fourth face of one defect class, and the one no reference search
 * can see. The other three were a function nothing calls, a rung naming an
 * undeclared model, and a key whose documentation claimed it was read when it
 * was not. That last one has already happened here: a note claimed `derive`
 * and `history` "drive the run-history recording", and
 * `grep -n 'optimize?.derive' src/plugin.ts` returns nothing.
 *
 * `parseOptimizeConfig` VALIDATES every key of the `optimize:` block, so each
 * one looks live to `check-dead-exports.mjs`, to `grep`, and to a reader. Only
 * `history` is consulted by a hook. A validated-then-ignored key is a
 * documented no-op and is not itself a bug — the keys are kept so a deployment
 * that sets one does not start failing validation the day it is honoured. What
 * IS a bug, and what this catches, is the DOCUMENT promising otherwise.
 *
 * The rules, each learned from a wrong result rather than designed up front:
 *
 *   - **a SETTING line is any line matching `key:`, commented or not.** This is
 *     the judgement the earlier drafts got wrong in both directions, and it is
 *     worth stating as a judgement instead of hiding in a pattern: `# judge:
 *     chat   # who scores across passes` is commented out, and it is still
 *     documentation claiming the key does something. If the key does nothing,
 *     that claim is wrong whether or not the line is one a deployment would
 *     copy. Judging only uncommented lines passed the exact false claim this
 *     file exists to catch.
 *   - **the CLAIM is the TAIL** — everything after the second `#`, which is
 *     where a YAML example puts the sentence about the key.
 *   - **a no-op label is not a promise.** "READ BY NOTHING" matches a read
 *     marker AND a no-op marker, so `isNoop` runs first and short-circuits. The
 *     first version did not, and passed the false claim above.
 *   - **a line that only NAMES the key is prose.** `--judge laya` inside a
 *     shell command mentions `judge` and promises nothing, so a key is judged
 *     only where it is actually SET.
 *   - **a run of consecutive comment lines is ONE block.** Judging line by line
 *     is what let one key's label suppress another's claim two lines below it.
 *
 * ponytail: a small allowlist of which files must carry the label, rather than a
 * scan for every mention of every key. No dependencies, and every regexp below
 * is a plain literal — an earlier draft escaped its `\b` inside a template,
 * which made every word boundary a literal backslash-b and the check unable to
 * fire at all.
 *
 * Run: `node scripts/check-noop-config-keys.mjs` (CI, and `make check`).
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(repo, p), 'utf8')

const spec = read('src/spec.ts')
const plugin = read('src/plugin.ts')

/** The keys `parseOptimizeConfig` accepts, from the interface it validates. */
const block = /export interface OptimizeConfig \{([\s\S]*?)\n\}/.exec(spec)
if (block === null) {
  console.error('OptimizeConfig not found in src/spec.ts — has it been renamed?')
  process.exit(1)
}
const accepted = [...block[1].matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1])

/**
 * A key a HOOK consults: `optimize?.key` or `optimize.key` in the plugin.
 *
 * The lookahead keeps the FILENAME `optimize.ts` in a comment from reading as
 * a key named `ts`, and the filter drops anything that is not one of this
 * block's keys. Both were found by the summary line, which is why it prints the
 * consulted set.
 */
const consulted = new Set(
  [...plugin.matchAll(/optimize\??\.(\w+)(?![.\w])/g)]
    .map((m) => m[1])
    .filter((k) => accepted.includes(k)),
)

const ignored = accepted.filter((k) => !consulted.has(k))
const wired = accepted.filter((k) => consulted.has(k))

/** Where a key's behaviour is PROMISED to a deployment. */
const PROMISES = [
  { file: 'src/index.ts', about: 'Config.optimize' },
  { file: 'README.md', about: 'the optimize example' },
  { file: 'cordis.patch.yml', about: 'the optimize example' },
  { file: 'docker/profile.patch.yml', about: 'the optimize example' },
]

/** Markers of a claim that the key does something. */
const READ = /\bread(?:s| by)?\b|\bdrives?\b|\bconsulted\b|\bfeeds?\b|\brecords?\b|\bderives?\b|\bscores?\b/i

/**
 * Markers of a no-op label, checked BEFORE `READ` — see the header.
 */
const NOOP = [
  /read by nothing/i,
  /accepted\b[^.]*(?:not|never)\b/i,
  /no-?op\b/i,
  /not (?:yet )?(?:acted|consumed|read)/i,
  /intentionally not/i,
  /does nothing/i,
  /never (?:read|consulted|used)/i,
  /\bCLI only\b/i,
  /\bCLI's? [`']?runRefined\b/i,
]
const isNoop = (t) => NOOP.some((re) => re.test(t))

/** Does this text promise behaviour? A no-op label is not a promise. */
const doesSomething = (t) => !isNoop(t) && READ.test(t)

/** A run of consecutive comment lines is ONE explanation, taken as a whole. */
function commentBlocks(text) {
  const blocks = []
  let current = []
  for (const line of text.split('\n')) {
    if (/^\s*(\/\/|#)/.test(line)) current.push(line)
    else {
      if (current.length > 0) blocks.push(current.join('\n'))
      current = []
    }
  }
  if (current.length > 0) blocks.push(current.join('\n'))
  return blocks
}

/** Everything after the second `#` on a setting line — that is its claim. */
const tailOf = (l) => {
  const parts = l.split('#')
  return parts.length > 2 ? parts.slice(2).join('#') : l
}

let failed = false
for (const p of PROMISES) {
  const path = join(repo, p.file)
  if (!existsSync(path)) continue

  for (const b of commentBlocks(readFileSync(path, 'utf8'))) {
    for (const key of accepted) {
      // An opening list — "(loops, derive, history, judge, …)" — names every
      // key and promises nothing.
      if (new RegExp(`\\((?:[^)]*\\b${key}\\b[^)]*)\\)`).test(b)) continue

      // The key must be SET here, not merely mentioned: `key: value` with an
      // OPTIONAL comment marker. A shell flag or a markdown heading does not
      // match, which is what keeps `--judge laya` out of the judgement.
      const setting = new RegExp(`^\\s*#?\\s*${key}\\s*:`)
      const settingLines = b.split('\n').filter((l) => setting.test(l))
      if (settingLines.length === 0) continue

      const saysRead = settingLines.some((l) => doesSomething(tailOf(l)))
      const saysNoop = settingLines.some((l) => isNoop(tailOf(l)))

      if (process.env.FL_CHECK_VERBOSE === '1') {
        console.error(`  ${p.file} ${key}: read=${saysRead} noop=${saysNoop} consulted=${consulted.has(key)}`)
      }

      const shouldBeNoop = !consulted.has(key)
      if (shouldBeNoop && saysRead && !saysNoop) {
        console.error(
          `${p.file}: a comment block sets '${key}' and says it does something,\n` +
          `  but no hook reads it (src/plugin.ts has no optimize?.${key}). ${p.about}\n` +
          '  promises behaviour that does not exist. Wire it, or say "read by nothing".',
        )
        failed = true
      }
      if (!shouldBeNoop && saysNoop && !saysRead) {
        console.error(
          `${p.file}: a comment block labels '${key}' read-by-nothing, but\n` +
          `  src/plugin.ts consults it (optimize?.${key}). That label is now the wrong one.`,
        )
        failed = true
      }
    }
  }
}

/*
 * The matching, asserted. This check shipped once with two defects that made it
 * unable to fire: every `\b` written as a literal backslash-b inside a
 * template, and `READ` matching only `reads\b`, so the `read for Metrics` a real
 * doc comment uses missed. These cases are the regression test for both, for the
 * READ-vs-NOOP precedence, and for the shape that motivated the file: a
 * COMMENTED-OUT line is still a promise when it claims something.
 */
for (const [text, expectPromise, why] of [
  [' accepted, READ BY NOTHING — see OptimizePolicyOptions', false, 'a no-op label is not a promise'],
  [' run-history file: appended per closed turn, read for Metrics', true, 'a bare "read" is a promise'],
  [' refinement passes, integer 3–10 (CLI only; validated at load)', false, 'CLI-only is a no-op label'],
  [' who scores across passes', true, 'a promise without the word reads'],
  [' refinement budget; default is derived × loops × 0.6 (CLI only)', false, 'no-op wins over "derived"'],
  [" the CLI's --derive derives envelopes, the plugin records the history they come from", true,
    'the exact false claim that shipped: verbs the code never runs'],
  [' cross-pass judge, read by nothing (CLI runRefined takes it)', false,
    'and the label that replaced it'],
]) {
  const got = doesSomething(text)
  if (got !== expectPromise) {
    console.error(`self-test failed: ${why}`)
    console.error(`  ${JSON.stringify(text)}`)
    console.error(`  expected a promise: ${expectPromise}, got ${got}`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(
  `config keys: ${String(accepted.length)} accepted, ${String(wired.length)} consulted by a hook ` +
  `(${wired.join(', ') || 'none'}), ${String(ignored.length)} documented no-ops ` +
  `(${ignored.join(', ') || 'none'}) — every label matches.`,
)
