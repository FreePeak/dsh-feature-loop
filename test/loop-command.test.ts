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

import { executeLoopCommand } from '../src/plugin.ts'

test('executeLoopCommand returns the trimmed task', () => {
  assert.deepEqual(executeLoopCommand('  fix the login bug  '), { task: 'fix the login bug' })
})

test('executeLoopCommand rejects a bare /loop with usage', () => {
  const outcome = executeLoopCommand('   ')
  assert.ok('kind' in outcome && outcome.kind === 'error')
  assert.match((outcome as { text: string }).text, /\/loop <task>/)
})
