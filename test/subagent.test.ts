/**
 * The check for "is this session a subagent?".
 *
 * Run: `node --experimental-strip-types --test test/subagent.test.ts`
 *
 * Pure: a header in, a boolean out. No cordis, no agent, no network.
 *
 * The bug this exists for, measured on a live headless run (2026-10-07): the
 * model spawned four research subagents and each got its own phase machine from
 * `createPolicy`, so every one of them ran the research phase's full 24-step
 * ceiling and was rejected — `stopReason: 'refusal'`, parent told "declined the
 * task. It left no closing message", run blocked in `research` at 2% of budget.
 */

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { isSubagentSession } from '../src/subagent.ts'

test('a top-level session is not a subagent', () => {
  assert.equal(isSubagentSession({}), false)
  assert.equal(isSubagentSession({ delegationDepth: 0 }), false)
  assert.equal(isSubagentSession(undefined), false)
})

test('origin: subagent is enough on its own', () => {
  assert.equal(isSubagentSession({ origin: 'subagent' }), true)
})

test('a non-zero delegation depth is enough on its own', () => {
  assert.equal(isSubagentSession({ delegationDepth: 1 }), true)
  assert.equal(isSubagentSession({ delegationDepth: 7 }), true)
})

test('both signals together still read as a subagent', () => {
  assert.equal(isSubagentSession({ origin: 'subagent', delegationDepth: 1 }), true)
})

test('malformed signals fail closed to "not a subagent"', () => {
  // The direction matters: an unclassified session keeps the phase machine it
  // would have had before this existed, rather than silently losing it.
  assert.equal(isSubagentSession({ delegationDepth: -1 }), false)
  assert.equal(isSubagentSession({ delegationDepth: '1' }), false)
  assert.equal(isSubagentSession({ delegationDepth: Number.NaN }), false)
  assert.equal(isSubagentSession({ delegationDepth: Number.POSITIVE_INFINITY }), false)
  assert.equal(isSubagentSession({ origin: 'child' }), false)
  assert.equal(isSubagentSession({ origin: 1 }), false)
})

// ── the wiring: a subagent policy must lose the phase machine, not the gate ──
// The predicate above is only half the fix; the other half is that
// `policyFor` acts on it. That half lives in `src/plugin.ts`, which carries
// runtime `@deepseek-ai/dsh-*` imports no install can fetch, so it is pinned
// structurally — the same approach `test/loop-command.test.ts` uses for the
// `/product` handoff, and for the same reason: the assertion is about what the
// code does, and the unit suite passed while the bug was live.
const pluginSource = (): string => {
  const here = dirname(fileURLToPath(import.meta.url))
  const raw = readFileSync(join(here, '..', 'src', 'plugin.ts'), 'utf8')
  // Comments stripped first: an assertion that reads prose is an assertion
  // about the prose.
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

test('a subagent policy drops the pipeline', () => {
  assert.match(pluginSource(), /if \(isSubagentSession\(sessionHeaderOf\(agent\)\)\) policy\.pipeline = undefined/,
    'policyFor must clear `policy.pipeline` for a subagent session — otherwise every '
    + 'helper the model spawns runs its own 0→1 phase machine and burns the '
    + 'research ceiling before it can answer')
})

test('a subagent keeps the gate, the budget and the spec', () => {
  const source = pluginSource()
  // The subagent branch clears exactly ONE field. A gate that is off for a
  // subagent is a gate that never asks a human about a subagent's writes, so
  // the assertion is on the whole branch body, not on a field list: everything
  // inside the `if` must be that single assignment.
  const branch = /if \(isSubagentSession\(sessionHeaderOf\(agent\)\)\) ([^\n]+)/.exec(source)?.[1]
  assert.ok(branch !== undefined, 'the subagent branch must exist')
  assert.equal(branch.trim(), 'policy.pipeline = undefined',
    `the subagent branch must do nothing but drop the pipeline, it does: ${branch.trim()}`)

  // And the fields that must survive are never touched anywhere in the file.
  assert.ok(!/policy\.gate = undefined/.test(source), 'the review gate must stay on for a subagent')
  assert.ok(!/policy\.gateMode = 'auto'/.test(source), 'a subagent must not be silently put into YOLO')
  assert.ok(!/policy\.spec = undefined/.test(source), 'the spec (budget, ladder) must stay')
  assert.ok(!/policy\.budget = undefined/.test(source), 'the run budget must stay')
  assert.ok(!/policy\.worktreeRoot = undefined/.test(source), 'containment must stay')
})
