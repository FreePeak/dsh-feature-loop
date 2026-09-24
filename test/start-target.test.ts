/**
 * The check for the start-loop target decision — the judgement that decides
 * WHICH session receives the run.
 *
 * Run: `node --experimental-strip-types --test test/start-target.test.ts`
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { decideStart } from '../web/start-target.ts'
import type { StartCandidate } from '../web/start-target.ts'

const s = (over: Partial<StartCandidate> = {}): StartCandidate => ({
  id: 'a', displayTitle: 'A', blank: false, running: false, updatedAt: 1, ...over,
})

test('no sessions blocks with a reason, never a silent dead button', () => {
  const d = decideStart([], undefined, 'do a thing')
  assert.equal(d.target, undefined)
  assert.equal(d.blocked, 'no-session')
  assert.match(d.note, /no open session/i)
})

test('a blank session IS a target — it is the fresh inbox', () => {
  // `blank` means New Session reuse eligibility, not "unusable". Excluding it
  // made the control dead exactly when someone wanted to start a run.
  const d = decideStart([s({ blank: true, displayTitle: 'New' })], undefined, 'go')
  assert.equal(d.target?.displayTitle, 'New')
  assert.equal(d.blocked, undefined)
})

test('exactly one live session is used and named', () => {
  const d = decideStart([s({ id: 'only', displayTitle: 'Refactor login' })], undefined, 'go')
  assert.equal(d.target?.id, 'only')
  assert.equal(d.ambiguous, false)
  assert.equal(d.blocked, undefined)
  assert.match(d.note, /Refactor login/)
})

test('several live sessions require a choice rather than a silent default', () => {
  const d = decideStart([s({ id: 'a', updatedAt: 1 }), s({ id: 'b', updatedAt: 9 })], undefined, 'go')
  assert.equal(d.ambiguous, true, 'a silent default could prompt the wrong session')
  assert.equal(d.target?.id, 'b', 'prefers the most recently touched')
})

test('the chosen session wins over the default', () => {
  const d = decideStart([s({ id: 'a', updatedAt: 1 }), s({ id: 'b', updatedAt: 9 })], 'a', 'go')
  assert.equal(d.target?.id, 'a')
  assert.equal(d.ambiguous, true)
})

test('a stale pick falls back instead of targeting nothing', () => {
  const d = decideStart([s({ id: 'a' })], 'closed-long-ago', 'go')
  assert.equal(d.target?.id, 'a', 'a session that vanished must not wedge the control')
})

test('an empty task blocks submission but keeps the session visible', () => {
  const d = decideStart([s({ displayTitle: 'Work' })], undefined, '   ')
  assert.equal(d.blocked, 'empty-task')
  assert.equal(d.target?.displayTitle, 'Work', 'the target is still shown, so the block is not mysterious')
})
