/**
 * The check for the approval registry — the piece that owns who is waiting.
 *
 * Run: `node --experimental-strip-types --test test/approvals.test.ts`
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createApprovalRegistry } from '../src/approvals.ts'
import { DashboardState } from '../src/dashboard.ts'
import type { ApprovalQuestion } from '../src/dashboard.ts'

function ask(over: Partial<ApprovalQuestion> = {}): ApprovalQuestion {
  return {
    toolName: 'write',
    callId: 'c1',
    reason: 'irreversible',
    ...over,
  } as ApprovalQuestion
}

test('no watcher delegates instead of stranding the ask', async () => {
  const reg = createApprovalRegistry({
    state: new DashboardState(), answers: true, answerTimeoutMs: 50_000, hasWatcher: () => false,
  })
  const outcome = await reg.answer(ask(), async () => 'unavailable')
  assert.equal(outcome, 'unavailable', 'delegated down the chain')
  assert.equal(reg.pendingSnapshot().length, 0, 'and claimed nothing')
})

test('a watched ask is pending until it is settled', async () => {
  const reg = createApprovalRegistry({
    state: new DashboardState(), answers: true, answerTimeoutMs: 50_000, hasWatcher: () => true,
  })
  let resolveAsk: ((v: 'allowed-once' | 'rejected') => void) | undefined
  const settled = reg.answer(ask(), async () => 'unavailable').then(v => { resolveAsk = () => undefined; return v })
  await new Promise(r => setTimeout(r, 5))
  const pending = reg.pendingSnapshot()
  assert.equal(pending.length, 1, 'the ask is claimable')
  assert.equal(pending[0]?.toolName, 'write')
  assert.equal(reg.settleApproval(pending[0]!.id, 'allowed-once'), true, 'click settles it')
  assert.equal(await settled, 'allowed-once')
  assert.equal(reg.settleApproval(pending[0]!.id, 'rejected'), false, 'a second click is a miss, not a re-authorise')
  resolveAsk?.()
})

test('answers:false always delegates even with a watcher', async () => {
  const reg = createApprovalRegistry({
    state: new DashboardState(), answers: false, answerTimeoutMs: 50_000, hasWatcher: () => true,
  })
  assert.equal(await reg.answer(ask(), async () => 'unavailable'), 'unavailable')
})

test('stop settles everything and refuses later asks', async () => {
  const reg = createApprovalRegistry({
    state: new DashboardState(), answers: true, answerTimeoutMs: 50_000, hasWatcher: () => true,
  })
  const settled = reg.answer(ask(), async () => 'unavailable')
  await new Promise(r => setTimeout(r, 5))
  reg.stop()
  assert.equal(await settled, 'unavailable')
  assert.equal(await reg.answer(ask(), async () => 'cancelled'), 'cancelled', 'delegates after stop')
})
