/**
 * Goal-loop command and verifier policy checks.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import {
  COMPLETION_NOTICE,
  createLoopObjective,
  verifyLoopCompletion,
} from '../src/goal-loop.ts'

test('/loop trims the objective and adds non-secret completion guidance', () => {
  assert.deepEqual(createLoopObjective({ rawInput: '  ship the queue  ', successCommand: 'npm test' }), {
    kind: 'success',
    objective: `ship the queue\n\n${COMPLETION_NOTICE}`,
  })
})

test('/loop fails closed for empty input or missing verifier configuration', () => {
  assert.deepEqual(createLoopObjective({ rawInput: '   ', successCommand: 'npm test' }), {
    kind: 'error',
    text: 'Usage: /loop <objective> — describe the bounded feature-loop goal.',
  })
  assert.deepEqual(createLoopObjective({ rawInput: 'ship it', successCommand: '  ' }), {
    kind: 'error',
    text: 'Feature loop is unavailable: configure spec.termination.successCommand before starting /loop.',
  })
})

test('only a clean zero exit permits goal completion', () => {
  assert.deepEqual(verifyLoopCompletion({ exitCode: 0, signal: null, timedOut: false, aborted: false }), {
    kind: 'allow',
  })
  for (const result of [
    { exitCode: 1, signal: null },
    { exitCode: 0, signal: 'SIGKILL' },
    { exitCode: 0, timedOut: true },
    { exitCode: 0, aborted: true },
    { exitCode: 0, sandbox: { denied: true } },
    { exitCode: 0, sandbox: { runnerFailed: true } },
    { exitCode: null, signal: null },
  ]) {
    assert.equal(verifyLoopCompletion(result).kind, 'deny')
  }
})

test('verifier denial reasons never echo the configured command', () => {
  const decision = verifyLoopCompletion({ exitCode: 2, signal: null })
  assert.equal(decision.kind, 'deny')
  if (decision.kind === 'deny') {
    assert.doesNotMatch(decision.reason, /npm|secret|token/i)
  }
})
