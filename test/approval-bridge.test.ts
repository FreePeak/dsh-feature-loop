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
  assertSettleAccepted,
  expiredOutcomeOf,
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

test('an ask that was already settled is not reported as a failure', () => {
  // The card's buttons are hidden only once the gate closes, and the gate
  // closes only if this call resolves. Throwing here is what left an operator
  // staring at a live "Approve" button that re-reported the same dead error on
  // every click: the ask had already been answered by the composer or another
  // tab, so there was nothing left to approve and nothing wrong with the click.
  assert.doesNotThrow(() => assertSettleAccepted({ ok: true, value: { settled: false } }))
})

test('a settle that actually worked is not a failure either', () => {
  assert.doesNotThrow(() => assertSettleAccepted({ ok: true, value: { settled: true } }))
})

test('a host failure IS reported, so a real error is not silently swallowed', () => {
  // The counterpart to the test above: the point is to stop treating a settled
  // ask as an error, not to stop reporting errors.
  assert.throws(
    () => assertSettleAccepted({ ok: false, error: { message: 'host remote is not mounted' } }),
    /host remote is not mounted/,
  )
})

test('expiredOutcomeOf keys every settled ask by the id its feed line carries', async () => {
  const id = '973f503a-8d08-411b-9f73-5b6c2846478a'
  const out = expiredOutcomeOf([
    { text: 'asked: write — REVIEW REQUESTED (policy): write: irreversible is always approved by a human.' },
    { text: `expired: write — no answer within 20000ms [${id}]` },
    { text: 'allowed once: read_file [11111111-1111-4111-8111-111111111111]' },
    { text: 'rejected: bash [22222222-2222-4222-8222-222222222222]' },
  ])
  assert.equal(out.get(id), 'unavailable')
  assert.equal(out.get('11111111-1111-4111-8111-111111111111'), 'allowed-once')
  assert.equal(out.get('22222222-2222-4222-8222-222222222222'), 'rejected')
})

test('expiredOutcomeOf ignores a line with no id rather than guessing at one', () => {
  // The shape that motivated this: `expired: write` names a TOOL, and a run
  // with two writes in flight cannot say which card went blank. Attributing it
  // to the first live ask would put "Expired — no answer in time." on a card
  // the operator is still holding, which is worse than saying nothing.
  assert.equal(expiredOutcomeOf([{ text: 'expired: write — no answer within 20000ms' }]).size, 0)
  assert.equal(expiredOutcomeOf([{ text: 'expired: write [not-a-uuid]' }]).size, 0)
  assert.equal(expiredOutcomeOf([{ text: 'a human said something' }]).size, 0)
})

test('an expired outcome reaches the gate as a resolution, not an approval', () => {
  // The distinction that matters to the card: `approved` means a human decided;
  // `resolution` means nobody did. Rendering an expiry as `approved: false` would
  // claim the operator refused.
  assert.equal(resolutionForOutcome('unavailable'), 'expired')
  assert.equal(resolutionForOutcome('cancelled'), 'cancelled')
  assert.equal(resolutionForOutcome('rejected'), undefined)
  assert.equal(resolutionForOutcome('allowed-once'), undefined)
})
