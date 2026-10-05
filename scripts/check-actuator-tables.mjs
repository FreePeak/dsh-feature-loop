#!/usr/bin/env node
/**
 * Fail when the three shipped copies of the actuator table disagree.
 *
 * The `spec.actuator` table is the fail-closed default for every tool the
 * harness exposes but this table does not name: `resolveReversibility` returns
 * `'irreversible'`, so an unclassified tool gets a review card. That is the
 * right direction for `write`. It is pure noise for `job_list`, which only reads
 * a list — and measured 2026-10-03 on a live five-ask run, one of the five
 * asks was `job_list`.
 *
 * The table ships in THREE files, hand-edited:
 *
 *   cordis.patch.yml            the default profile the package installs
 *   docker/profile.patch.yml    the container profile
 *   scripts/make-profile.sh     the generated profile
 *
 * and nothing compared them. They HAD diverged: the docker copy was missing
 * `task`, so a container deployment gated every delegated HITL call while a
 * generated one did not — the same deployment, two policies, discovered only by
 * reading two files side by side.
 *
 * This is §1bd and §1bi's shape exactly: a claim repeated in several places
 * that nothing checks. The fix is not a third careful edit, it is a comparison.
 *
 * Run: `node scripts/check-actuator-tables.mjs` (CI's `test` job, and
 * `make check`).
 *
 * ponytail: regexes over three files, like the other checks. It compares the
 * TOOL → CLASS mapping and nothing about the prose around it.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Where each copy lives, and the indent its rows are written at. */
const COPIES = [
  ['cordis.patch.yml', 12],
  ['docker/profile.patch.yml', 8],
  ['scripts/make-profile.sh', 8],
]

/** `irreversible`, `reversible-write`, `read`, `auto`… — never a comment. */
const CLASS = '(?:irreversible|reversible-write|read)'

/**
 * The `tool: class` rows under one `actuator:` block.
 *
 * @param {string} text - the whole file.
 * @param {number} indent - the row indent that file uses inside the block.
 * @returns {Map<string, string>} tool → reversibility class.
 */
function actuatorTable(text, indent) {
  const start = text.indexOf('actuator:')
  if (start === -1) throw new Error('no `actuator:` block — renamed, or the block moved to another file')
  const row = new RegExp(`^ {${indent}}([a-z_]+):\\s*(${CLASS})\\s*(?:#.*)?$`, 'gm')
  const table = new Map()
  let match
  while ((match = row.exec(text.slice(start))) !== null) {
    table.set(match[1], match[2])
  }
  return table
}

const tables = new Map()
for (const [file, indent] of COPIES) {
  try {
    tables.set(file, actuatorTable(readFileSync(join(repo, file), 'utf8'), indent))
  } catch (error) {
    console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

const [reference] = COPIES.map(([file]) => file)
const referenceTable = tables.get(reference)
let failed = false

for (const file of COPIES.slice(1).map(([f]) => f)) {
  const table = tables.get(file)
  for (const [tool, klass] of referenceTable) {
    if (!table.has(tool)) {
      console.error(`actuator tables: ${reference} classifies ${tool} as ${klass}; ${file} does not name it.\n`
        + `  Unclassified falls back to \`irreversible\`, so ${file} gates a call that\n`
        + `  ${reference} lets through — two policies for one deployment.`)
      failed = true
    } else if (table.get(tool) !== klass) {
      console.error(`actuator tables: ${tool} is ${klass} in ${reference} and ${table.get(tool)} in ${file}.`)
      failed = true
    }
  }
  for (const tool of table.keys()) {
    if (!referenceTable.has(tool)) {
      console.error(`actuator tables: ${file} classifies ${tool}, which ${reference} does not name.\n`
        + `  Add it to ${reference} too, or the next copy diverges from both.`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log(`actuator tables: ${String(referenceTable.size)} tools, identical in all ${String(COPIES.length)} copies`)
