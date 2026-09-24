/**
 * The check for the `/loop` host command.
 *
 * Run: `node --experimental-strip-types --test test/loop-command.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { apply as applyCommand } from '../src/command.ts'
import { COMPLETION_NOTICE } from '../src/goal-loop.ts'
import { configureLoopVerifier, executeLoopCommand } from '../src/plugin.ts'

test('executeLoopCommand creates a verifier-backed durable objective', (t) => {
  configureLoopVerifier('npm test')
  t.after(() => { configureLoopVerifier(undefined) })
  assert.deepEqual(executeLoopCommand('  fix the login bug  '), {
    objective: `fix the login bug\n\n${COMPLETION_NOTICE}`,
  })
})

test('executeLoopCommand rejects a bare /loop with usage', () => {
  configureLoopVerifier('npm test')
  try {
    const outcome = executeLoopCommand('   ')
    assert.ok('kind' in outcome && outcome.kind === 'error')
    assert.match((outcome as { text: string }).text, /\/loop <objective>/)
  } finally {
    configureLoopVerifier(undefined)
  }
})

test('executeLoopCommand fails closed when no verifier is configured', () => {
  configureLoopVerifier(undefined)
  const outcome = executeLoopCommand('ship it')
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
