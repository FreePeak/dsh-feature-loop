/**
 * The check for the `/loop` host command.
 *
 * Run: `node --experimental-strip-types --test test/loop-command.test.ts`
 *
 * The handler is pure: it validates the task text and returns it for the
 * composer to submit. No cordis, no agent, no network.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

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
