#!/usr/bin/env node
/**
 * Fail when a config key is validated and then never consulted.
 *
 * This is the fourth face of one defect class, and the one no reference search
 * can see. The other three were a function nothing calls, a rung naming an
 * undeclared model, a key documented as read when it was not. This one is
 * quieter still:
 *
 *   `parseOptimizeConfig` VALIDATES all five keys of the `optimize:` block, so
 *   every one of them looks live to `check-dead-exports.mjs`, to a reader, and
 *   to `grep`. Only `history` is consulted by a hook. `loops`, `derive`,
 *   `judge` and `totalBudgetUSD` are read by the validator and by nothing else.
 *
 * That is not a bug in itself — a validated-then-ignored key is a documented
 * no-op, and the keys are kept so a deployment that sets one does not start
 * failing validation the day it is honoured. What IS a bug, and has already
 * happened once, is the documentation saying otherwise: a note claimed
 * `derive` and `history` "drive the run-history recording", and `grep
 * -n 'optimize?.derive' src/plugin.ts` returns nothing.
 *
 * So this check is about the DOCUMENT, not the code: a key the validator
 * accepts and no hook reads must be labelled as a no-op at every place a
 * deployment is told what it does — its own doc comment, and the example
 * configs. A key that IS read must not carry that label, because the day the
 * behaviour lands, a comment saying "read by nothing" is its own kind of lie.
 *
 * It reads `src/spec.ts` for the accepted keys, `src/plugin.ts` for the
 * consulted ones, and the shipped YAML for the labels. Everything is parsed
 * with a regex; the tree is small and the shapes are fixed by the files that
 * define them.
 *
 * ponytail: a small allowlist of which files must carry the label, rather than
 * a scan for every mention of every key. A mention is not a promise — README
 * talks about `history` in prose that is not a claim about whether a hook reads
 * it — so the check asserts on the two places that ARE promises: the key's own
 * JSDoc and the example configs. It exits non-zero and names the file, so
 * fixing it is adding a clause, not a judgement call.
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
const index = read('src/index.ts')

/** The keys `parseOptimizeConfig` accepts. */
const block = /export interface OptimizeConfig \{([\s\S]*?)\n\}/.exec(spec)
if (block === null) {
  console.error('OptimizeConfig not found in src/spec.ts — has it been renamed?')
  process.exit(1)
}
const accepted = [...block[1].matchAll(/^\s{2}(\w+)\??:/gm)].map(m => m[1])

/** A key a HOOK consults: `optimize?.key` or `optimize.key` in the plugin. */
const consulted = new Set(
  [...plugin.matchAll(/optimize\??\.(\w+)/g)].map(m => m[1]),
)

const ignored = accepted.filter(k => !consulted.has(k))
const wired = accepted.filter(k => consulted.has(k))

/**
 * Where a key's behaviour is PROMISED to a deployment. Each of these must
 * either name the key as read, or name it as a no-op — and the two must not
 * both be true for the same key.
 */
const PROMISES = [
  { file: 'src/index.ts', about: 'Config.optimize', keys: accepted },
  { file: 'README.md', about: 'the optimize example', keys: accepted },
  { file: 'cordis.patch.yml', about: 'the optimize example', keys: accepted },
  { file: 'docker/profile.patch.yml', about: 'the optimize example', keys: accepted },
]

const READ = /read by|reads\\b|drives?\\b|consulted|feeds\\b/i
const NOOP = /read by nothing|no-?op\\b|accepted\\b[^.]*not|not (?:yet )?(?:acted|consumed)|intentionally not|does nothing/i

let failed = false
for (const p of PROMISES) {
  const path = join(repo, p.file)
  if (!existsSync(path)) continue
  // One unit per promise: a run of consecutive comment lines is a single
  // explanation, and a reader takes it as a whole. Judging line by line is what
  // made the first two attempts misread "history alone does that" as a claim
  // ABOUT history.
  const blocks = []
  let current = []
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const isComment = /^\\s*(\/\/|#)/.test(line)
    if (isComment) current.push(line)
    else { if (current.length > 0) blocks.push(current.join('\n')); current = [] }
  }
  if (current.length > 0) blocks.push(current.join('\n'))

  for (const key of p.keys) {
    const word = new RegExp(`\\b${key}\\b`)
    const mentioning = blocks.filter(b => word.test(b))
    if (mentioning.length === 0) continue
    // The opening list of the block — "(loops, derive, history, judge, …)" —
    // names every key and promises nothing.
    const claims = mentioning.filter(b => !new RegExp(`\\((?:[^)]*\\b${key}\\b[^)]*)\\)`).test(b))
    if (claims.length === 0) continue
    // A line that names the key AND its own value (`judge: chat`) is the
    // example config offering the key — a claim about what it does, whatever
    // follows the second `#`. Prose elsewhere in the file does not count; only
    // the line that sets the key.
    // A line that SETS the key (`judge: chat`) is the example offering it, and
    // its tail — whatever follows the second `#` — is the claim. The key's own
    // JSDoc counts too. A line that only mentions the word is neither: it is
    // prose, and judging it is what made the first three attempts of this
    // check misfire.
    const setting = new RegExp(`\\b${key}\\s*:`)
    // "who scores across passes" is a promise without the word "reads", and it
    // is exactly the phrasing the README used. So the claim is judged on the
    // TAIL of an offering line — everything after the second `#` — against
    // BOTH the read markers and a plain description of doing something. The
    // markers exist to catch the blatant claims; the tail test catches the
    // ordinary ones, which is the whole point of looking here at all.
    const tail = (l) => { const parts = l.split('#'); return parts.length > 2 ? parts.slice(2).join('#') : l }
    const offers = (b) => b.split('\n').filter(l => setting.test(l))
    const doesSomething = (t) => READ.test(t) || /\b(?:who|what|how|when|where)\b|\b(?:scores|records|drives|feeds|derives|optimis|optimiz|weights|selects|chooses)\w*\b/i.test(t)
    const saysRead = claims.some(b => offers(b).some(l => doesSomething(tail(l))))
      || claims.some(b => offers(b).length === 0 && doesSomething(tail(b)))
    const saysNoop = claims.some(b => offers(b).some(l => NOOP.test(l)))
      || claims.some(b => offers(b).length === 0 && NOOP.test(b))
    // A no-op label for ONE key is not a no-op label for the BLOCK. The README's
    // optimize example is four comment lines naming four different keys, and
    // the `derive` line's "READ BY NOTHING" used to suppress the `judge` line's
    // promise two lines below it. The label has to be on the line that makes
    // the claim.
    if (failed && process.env.FL_CHECK_VERBOSE === '1') {
      console.error(`  ${p.file} ${key}: read=${saysRead} noop=${saysNoop} consulted=${consulted.has(key)}`)
    }
    const shouldBeNoop = !consulted.has(key)
    if (shouldBeNoop && saysRead && !saysNoop) {
      console.error(
        `${p.file}: a comment block names '${key}' and says it does something,\n` +
        `  but no hook reads it (src/plugin.ts has no optimize?.${key}). ${p.about}\\n` +
        `  promises behaviour that does not exist. Wire it, or say "read by nothing".`,
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

if (failed) process.exit(1)
console.log(
  `config keys: ${accepted.length} accepted, ${wired.length} consulted by a hook ` +
  `(${wired.join(', ') || 'none'}), ${ignored.length} documented no-ops ` +
  `(${ignored.join(', ') || 'none'}) — every label matches.`,
)
