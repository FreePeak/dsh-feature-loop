/**
 * The approval bridge's checks. Pure mapping, so this file needs nothing
 * installed and runs in CI's no-install test job.
 *
 * The property under test is authorisation-shaped, not cosmetic: every path
 * through `outcomeForResponse` must either produce the decision the operator
 * actually chose or refuse to produce one. A mapping that turned an unknown
 * option into `allowed-once` would authorise a tool call nobody approved.
 *
 * Run: `node --experimental-strip-types --test test/approval-bridge.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import {
  APPROVAL_OPTIONS,
  isDecided,
  outcomeForResponse,
  resolutionForOutcome,
  toApprovalGate,
} from '../src/approval-bridge.ts'

const ASK = {
  id: 'ask-1',
  toolName: 'write_file',
  callId: 'call-9',
  reason: 'REVIEW REQUESTED (policy): write_file: irreversible',
  runId: 'agent-42',
  askedAt: 1_700_000_000_000,
}

test('a gate carries the gate\'s own reason as its prompt', () => {
  const gate = toApprovalGate(ASK)
  assert.equal(gate.id, 'ask-1')
  assert.equal(gate.prompt, 'REVIEW REQUESTED (policy): write_file: irreversible')
  assert.equal(gate.display, 'decision')
  assert.deepEqual(gate.options.map(o => o.id), ['allow-once', 'reject-once'])
  assert.equal(gate.approved, undefined, 'a pending gate is not pre-decided')
  assert.equal(gate.resolution, undefined)
})

test('an ask with no reason still gets a headless-free prompt', () => {
  const gate = toApprovalGate({ id: 'a', toolName: 'run_tests', askedAt: 0 })
  assert.equal(gate.prompt, 'run_tests needs approval')
})

test('a gate never offers to persist a policy', () => {
  // allow-always / reject-always would widen the deployment's gate from a
  // browser click. They are deliberately absent.
  const kinds = APPROVAL_OPTIONS.map(o => o.kind)
  assert.deepEqual(kinds, ['allow-once', 'reject-once'])
  assert.ok(!kinds.some(k => k.endsWith('always')))
})

test('the allow option maps to allowed-once and nothing else does', () => {
  assert.equal(outcomeForResponse({ optionId: 'allow-once' }), 'allowed-once')
  assert.equal(outcomeForResponse({ optionId: 'reject-once' }), 'rejected')
})

test('the boolean fallback maps both ways', () => {
  assert.equal(outcomeForResponse({ approved: true }), 'allowed-once')
  assert.equal(outcomeForResponse({ approved: false }), 'rejected')
})

test('an unknown option throws rather than authorising', () => {
  assert.throws(() => outcomeForResponse({ optionId: 'allow-always' }), /unknown approval option/)
  assert.throws(() => outcomeForResponse({ optionId: 'allow-always', approved: true }), /unknown approval option/)
  assert.throws(() => outcomeForResponse({ optionId: '' }), /unknown approval option/)
})

test('a response with neither field throws rather than guessing', () => {
  assert.throws(() => outcomeForResponse({}), /neither an optionId nor an approved flag/)
})

test('optionId wins over a contradictory approved flag', () => {
  // The renderer reports the option the human chose; a stale boolean must not
  // override it in either direction.
  assert.equal(outcomeForResponse({ optionId: 'allow-once', approved: false }), 'allowed-once')
  assert.equal(outcomeForResponse({ optionId: 'reject-once', approved: true }), 'rejected')
})

test('resolution distinguishes expired from cancelled', () => {
  assert.equal(resolutionForOutcome('unavailable'), 'expired')
  assert.equal(resolutionForOutcome('cancelled'), 'cancelled')
  assert.equal(resolutionForOutcome('allowed-once'), undefined)
  assert.equal(resolutionForOutcome('rejected'), undefined)
})

test('a decided ask is distinguishable from one that died', () => {
  assert.equal(isDecided('allowed-once'), true)
  assert.equal(isDecided('rejected'), true)
  assert.equal(isDecided('cancelled'), false)
  assert.equal(isDecided('unavailable'), false)
})

test('the gate is a copy: mutating it cannot rewrite the shared option list', () => {
  const gate = toApprovalGate(ASK)
  gate.options[0]!.label = 'tampered'
  assert.equal(APPROVAL_OPTIONS[0]?.label, 'Allow once')
})
