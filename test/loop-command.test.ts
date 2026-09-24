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
  assert.match((outcome as { text: string }).text, /successCommand/)
})

test('the host command creates a native root goal without a direct followup', (t) => {
  configureLoopVerifier('npm test')
  t.after(() => { configureLoopVerifier(undefined) })
  const agent = { id: 'root-a' }
  const created: { agent: object, objective: string }[] = []
  let definition: {
    handler(invocation: { rawInput: string, agent: { id: string } }): { kind: 'success' | 'error', text?: string }
  } | undefined
  const agents = { roots: () => [agent] }
  const goals = {
    create(received: object, request: { objective: string }) {
      created.push({ agent: received, objective: request.objective })
      return { id: 'goal-a', revision: 1 }
    },
  }
  const ctx = {
    commands: { register(value: NonNullable<typeof definition>) { definition = value } },
    get: (key: string) => key === 'agents' ? agents : key === 'goals' ? goals : undefined,
  }
  applyCommand(ctx as never)
  assert.ok(definition !== undefined)
  const result = definition.handler({ rawInput: 'ship the queue', agent })
  assert.equal(result.kind, 'success')
  assert.equal(created.length, 1)
  assert.equal(created[0]?.agent, agent)
  assert.equal(created[0]?.objective, `ship the queue\n\n${COMPLETION_NOTICE}`)
})
