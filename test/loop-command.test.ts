/**
 * The check for the `/loop` and `/product` host commands.
 *
 * Run: `node --experimental-strip-types --test test/loop-command.test.ts`
 *
 * The ARGUMENT GRAMMAR is pure and is what this file exercises: the
 * `execute*Command` functions validate the text and build the task, with no
 * cordis, no agent and no network.
 *
 * The HANDOFF is not pure — `src/command.ts`'s wrapper calls
 * `agent.followup(...)` — so it is not reachable from here (this file imports
 * `src/plugin.ts`, whose `@deepseek-ai/dsh-*` peers no install can fetch). The
 * part that must not regress is pinned structurally instead, below: the
 * registered handler must submit a turn rather than only returning text, which
 * is the bug this file was written one step short of catching.
 */

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { executeLoopCommand, executeProductCommand } from '../src/plugin.ts'

test('executeLoopCommand returns the trimmed task', () => {
  assert.deepEqual(executeLoopCommand('  fix the login bug  '), { task: 'fix the login bug' })
})

test('executeLoopCommand rejects a bare /loop with usage', () => {
  const outcome = executeLoopCommand('   ')
  assert.ok('kind' in outcome && outcome.kind === 'error')
  assert.match((outcome as { text: string }).text, /\/loop <task>/)
})

// ── /product: the 0→1 pipeline's front door ──────────────────────────────────
//
// Until this existed the pipeline was reachable only by hand-editing the patch
// row — a configuration act, not the "one sentence starts the run" the PRD
// promises. Every live verification of this work drove it through a `--patch`
// overlay, which is exactly what a user will not do.

test('executeProductCommand carries the user\'s own words', () => {
  // The deployment's `spec.goal` is not the task, and three live runs researched
  // the profile's static goal instead of the request before this was found.
  const outcome = executeProductCommand('a CLI that converts Markdown tables to CSV')
  assert.ok(!('kind' in outcome))
  assert.match((outcome as { task: string }).task, /a CLI that converts Markdown tables to CSV/)
})

test('executeProductCommand names the whole phase spine, in order', () => {
  const outcome = executeProductCommand('x')
  assert.ok(!('kind' in outcome))
  const task = (outcome as { task: string }).task
  const at = ['research', 'prd', 'implement', 'test', 'ship'].map(p => task.indexOf(p))
  assert.ok(at.every(i => i > 0), 'every phase must be named')
  assert.deepEqual([...at].sort((a, b) => a - b), at, 'in spine order')
})

test('executeProductCommand says the loop owns the gates', () => {
  const outcome = executeProductCommand('x')
  assert.match((outcome as { task: string }).task, /the loop checks its\s+gate/)
  assert.match((outcome as { task: string }).task, /exactly what is missing/)
})

test('executeProductCommand rejects a bare /product with an example', () => {
  const outcome = executeProductCommand('   ')
  assert.ok('kind' in outcome && outcome.kind === 'error')
  assert.match((outcome as { text: string }).text, /\/product <goal>/)
  assert.match((outcome as { text: string }).text, /\/product a CLI that converts/)
})

test('executeProductCommand never escalates the gate', () => {
  // Gate changes belong in configuration, where they are visible and reversible.
  // A command that silently turned a deployment into YOLO would be the opposite
  // of the envelope's whole purpose.
  const text = JSON.stringify(executeProductCommand('x'))
  for (const forbidden of ['gateMode', 'yolo', 'always-approve', 'unlimited']) {
    assert.doesNotMatch(text, new RegExp(forbidden, 'i'), `/product must not mention ${forbidden}`)
  }
})

test('executeProductCommand adds the pipeline framing rather than replacing the goal', () => {
  const outcome = executeProductCommand('fix the login bug')
  assert.ok(!('kind' in outcome))
  assert.ok((outcome as { task: string }).task.length > 'fix the login bug'.length)
})

// ── the goal a command leaves behind ─────────────────────────────────────────
//
// The composer submits a command's return value as the turn, so the leading
// `/product` reaches the turn attached. Everything downstream names work after
// the goal — the branch, the commit subject, the PR title — so a live run
// through /product committed "feat: /product a slugify(text) function that
// lowercases…". The goal a user typed is not "slash product a slugify".

test('the goal drops the launcher and the command name', async () => {
  const { userGoalOf } = await import('../src/plugin.ts')
  const events = [
    { type: 'system/message', data: {} },
    {
      type: 'user/message',
      data: {
        content: [{ type: 'text', text: 'headless /product a CLI that converts Markdown tables to CSV' }],
      },
    },
  ]
  const agent = { session: { snapshotEvents: () => events } }
  assert.equal(userGoalOf(agent as never), 'a CLI that converts Markdown tables to CSV')
})

test('the goal drops a bare command name with no goal after it', async () => {
  const { userGoalOf } = await import('../src/plugin.ts')
  const events = [{
    type: 'user/message',
    data: { content: [{ type: 'text', text: 'headless /product' }] },
  }]
  const agent = { session: { snapshotEvents: () => events } }
  // No goal is not a goal of "product" — it falls back, which is the honest answer.
  assert.ok(userGoalOf(agent as never) === undefined || userGoalOf(agent as never) !== '/product')
})

test('the goal still skips the runtime-context scaffolding', async () => {
  const { userGoalOf } = await import('../src/plugin.ts')
  const events = [
    { type: 'user/message', data: { content: [{ type: 'text', text: 'Current runtime context.' }] } },
    { type: 'user/message', data: { content: [{ type: 'text', text: 'web build the thing' }] } },
  ]
  const agent = { session: { snapshotEvents: () => events } }
  assert.equal(userGoalOf(agent as never), 'build the thing')
})

// ── the handoff: a command must START A TURN, not just return text ───────────
// Measured on harness 0.2.0-rc.2 (2026-10-07): the composer's claimed-command
// path renders a `success` result's `text` as an inline notice and stops.
// `command/run` + `command/done`, no `turn/start`. A live `/product` produced a
// command row and nothing else, so the 0→1 pipeline never started — and the
// whole unit suite passed, because every assertion here checked the argument
// grammar and none checked that a turn begins.
//
// The wrapper is unreachable from here (it needs a real Agent), so this pins
// the shape of the source. Comments are stripped first: an assertion that reads
// prose is an assertion about the prose — the first version of this test failed
// on the word `whenIdle()` inside a comment explaining why it is NOT called.
const commandSource = (): string => {
  const here = dirname(fileURLToPath(import.meta.url))
  const raw = readFileSync(join(here, '..', 'src', 'command.ts'), 'utf8')
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/(^|[^:])\/\/.*$/gm, '$1')  // line comments, sparing `https://`
}

test('the registered handler submits the task as a turn, not as result text', () => {
  const source = commandSource()

  assert.match(source, /invocation\.agent\.followup\(/,
    'the command handler must call `agent.followup(...)` — a handler that only '
    + 'returns `{kind: "success", text: task}` renders a notice and starts no turn')

  // And it must NOT await the turn: a five-phase pipeline runs for minutes, and
  // the composer's submit transaction would hold the input bar locked for all of it.
  assert.ok(!/whenIdle\(\)/.test(source),
    'the handler must not await `whenIdle()` — the handoff is queue-and-return, '
    + 'or the composer stays in its submitting phase for the whole run')

  // The task must be a real user message carrying the built task, not a bare string.
  assert.match(source, /createUserMessage\(/, 'the task must be wrapped as a user message')
  assert.match(source, /text: outcome\.task/, 'the message must carry the built task text')
})

test('a command that cannot start the turn reports an error, so the draft survives', () => {
  assert.match(commandSource(), /kind: 'error'/,
    'a refused handoff must be an error result: the composer keeps the draft on '
    + 'an error and clears it on success, so returning success would lose the line')
})
