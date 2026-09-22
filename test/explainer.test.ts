/**
 * The explainer's checks: it always resolves (never throws, never hangs past
 * its deadline), it gives up after repeated failures like the chat judge, and
 * the user message it builds says only what the ask actually holds.
 *
 * `createScriptedClient` from `src/llm.ts` is the model double — the same one
 * the runner's control-flow tests use.
 *
 * Run: `node --experimental-strip-types --test test/explainer.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { briefUserMessage, createChatExplainer, NO_EXPLAINER } from '../src/explainer.ts'
import { createScriptedClient } from '../src/llm.ts'

test('NO_EXPLAINER resolves undefined: no model call, no brief', async () => {
  assert.equal(await NO_EXPLAINER.explain({ toolName: 'write' }), undefined)
})

test('the happy path returns the model text untouched', async () => {
  const llm = createScriptedClient([
    { content: 'root = Stack([h])\nh = CardHeader("write")', toolCalls: [] },
  ])
  const explainer = createChatExplainer({ llm, model: 'test-model' })
  assert.equal(
    await explainer.explain({ toolName: 'write' }),
    'root = Stack([h])\nh = CardHeader("write")',
  )
  assert.deepEqual(llm.calls, ['test-model'])
})

test('empty content resolves undefined, not an empty brief', async () => {
  const llm = createScriptedClient([{ content: '   ', toolCalls: [] }])
  const explainer = createChatExplainer({ llm, model: 'test-model' })
  assert.equal(await explainer.explain({ toolName: 'write' }), undefined)
})

test('a throwing transport resolves undefined', async () => {
  const explainer = createChatExplainer({
    llm: {
      complete: () => Promise.reject(new Error('gateway down')),
    },
    model: 'test-model',
  })
  assert.equal(await explainer.explain({ toolName: 'write' }), undefined)
})

test('three consecutive failures stop further calls', async () => {
  let calls = 0
  const explainer = createChatExplainer({
    llm: {
      complete: () => {
        calls += 1
        return Promise.reject(new Error('gateway down'))
      },
    },
    model: 'test-model',
  })
  for (let i = 0; i < 3; i += 1) assert.equal(await explainer.explain({ toolName: 'write' }), undefined)
  assert.equal(calls, 3)
  assert.equal(await explainer.explain({ toolName: 'write' }), undefined)
  assert.equal(calls, 3)
})

test('an already-aborted ask makes no model call', async () => {
  const llm = createScriptedClient([{ content: 'root = Stack([])', toolCalls: [] }])
  const explainer = createChatExplainer({ llm, model: 'test-model' })
  const controller = new AbortController()
  controller.abort()
  assert.equal(await explainer.explain({ toolName: 'write' }, controller.signal), undefined)
  assert.deepEqual(llm.calls, [])
})

test('the user message holds only what the ask holds — no invented arguments', () => {
  const message = briefUserMessage({
    toolName: 'write',
    callId: 'call-1',
    reason: 'REVIEW REQUESTED (policy): write: irreversible',
    reversibility: 'irreversible',
    runId: 'agent-1',
    step: 4,
    maxSteps: 12,
    route: 'onegw/execution',
    signals: [{ severity: 'warning', kind: 'scope-drift', step: 3, detail: 'touched 2 extra files' }],
  })
  assert.ok(message.includes('Tool: write'))
  assert.ok(message.includes('Call: call-1'))
  assert.ok(message.includes('REVIEW REQUESTED'))
  assert.ok(message.includes('Step: 4 / 12'))
  assert.ok(message.includes('[warning] scope-drift @ step 3'))
  assert.ok(!message.includes('arguments'), 'must not claim tool arguments it was never given')
})
