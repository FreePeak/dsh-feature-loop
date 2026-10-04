#!/usr/bin/env node
/**
 * Fail when KNOWN-ISSUES' section letters and its index disagree.
 *
 * This file is a record of what was WRONG, corrected as each was found, and
 * two of its entries were both numbered 1i until a cross-reference happened to
 * point at the wrong one. An index a person maintains is an index that drifts —
 * the same argument as `check-ladder-models.mjs`, applied to prose.
 *
 * Three things, each a failure this repo has actually had:
 *
 *   1. a DUPLICATE letter — two sections, one name, so `§1i` resolves to
 *      whichever comes first;
 *   2. a section with no index row, which is an entry nobody can find;
 *   3. an index row with no section, which is a promise nothing delivers.
 *
 * Run: `node scripts/check-known-issues.mjs` (CI, and `make check`).
 *
 * ponytail: three regexes over one file. A markdown parser would be more correct
 * and would need a dependency for a check whose whole job is to notice that two
 * headings share a name.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const file = join(repo, 'docs/KNOWN-ISSUES.md')
const text = readFileSync(file, 'utf8')

/**
 * A section letter: `1a` and its longer descendants `1bb`.
 *
 * ONE character here made the check blind to a third of the file. It matched
 * `1[a-z]`, so the eight `§1bb`…`§1bi` entries had no headings, no index rows
 * and no validated cross-references — and the check still printed "21 sections,
 * index and cross-references agree". The file's own §1t records a duplicate
 * `1i`; this was the same drift one letter wider, and just as silent.
 */
const LETTER = '1[a-z]{1,2}'

/** `### 1a. Title`, the section headings. */
const sections = [...text.matchAll(new RegExp(`^### (${LETTER})\\. (.+)$`, 'gm'))]
const titles = new Map()
let failed = false

for (const [, letter, title] of sections) {
  if (titles.has(letter)) {
    console.error(
      `KNOWN-ISSUES: two sections are numbered ${letter} — "${titles.get(letter)}" and "${title}".\n`
      + '  §' + letter + ' resolves to whichever comes first, so a cross-reference can\n'
      + '  point at the wrong one. Renumber the later section.',
    )
    failed = true
  }
  titles.set(letter, title)
}

const rows = new Map(
  [...text.matchAll(new RegExp(`^\\| (${LETTER}) \\| (.+?) \\|$`, 'gm'))]
    .map(([, letter, label]) => [letter, label]),
)

for (const letter of titles.keys()) {
  if (!rows.has(letter)) {
    console.error(`KNOWN-ISSUES: §${letter} has no row in the index.`)
    failed = true
  }
}
for (const letter of rows.keys()) {
  if (!titles.has(letter)) {
    console.error(`KNOWN-ISSUES: the index lists §${letter} and no such section exists.`)
    failed = true
  }
}

// Every `§1x` in the prose must resolve, or the sentence points nowhere.
const prose = text.replace(/^\|.*\|$/gm, '')
for (const match of prose.matchAll(new RegExp(`§(${LETTER})`, 'g'))) {
  if (!titles.has(match[1])) {
    console.error(`KNOWN-ISSUES: a cross-reference to §${match[1]}, which does not exist.`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(`known-issues: ${String(titles.size)} sections, index and cross-references agree`)
