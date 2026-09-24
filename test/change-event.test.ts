/**
 * The check for the change bridge: the subscriber set, and the coalescing that
 * keeps a busy run from flooding the browser.
 *
 * Run: `node --experimental-strip-types --test test/change-event.test.ts`
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createChangeEmitter } from '../src/change-event.ts'
import { DashboardState } from '../src/dashboard.ts'

test('many subscribers coexist — a second cannot clobber the first', () => {
  const state = new DashboardState()
  let a = 0, b = 0
  state.onChange(() => { a++ })
  state.onChange(() => { b++ })
  state.recordStep('r1', { step: 1 })
  assert.equal(a, 1, 'the first subscriber still fires')
  assert.equal(b, 1, 'and so does the second')
})

test('unsubscribing releases exactly that subscriber', () => {
  const state = new DashboardState()
  let a = 0, b = 0
  const offA = state.onChange(() => { a++ })
  state.onChange(() => { b++ })
  offA()
  offA() // idempotent
  state.recordStep('r1', { step: 1 })
  assert.equal(a, 0, 'released')
  assert.equal(b, 1, 'the other one is untouched')
})

test('clearListeners drops them all', () => {
  const state = new DashboardState()
  let n = 0
  state.onChange(() => { n++ })
  state.onChange(() => { n++ })
  state.clearListeners()
  state.recordStep('r1', { step: 1 })
  assert.equal(n, 0)
})

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

test('a burst coalesces to one trailing emit, never dropping the last', async () => {
  let emits = 0
  const notify = createChangeEmitter(() => { emits++ }, 40)
  notify() // first is immediate: an idle dashboard updates with no delay
  assert.equal(emits, 1)
  for (let i = 0; i < 20; i++) notify() // a busy step storm
  assert.equal(emits, 1, 'still coalesced while the window is open')
  await wait(90)
  assert.equal(emits, 2, 'exactly one trailing emit, so the final change lands')
})

test('state changes reach the emitter', () => {
  const state = new DashboardState()
  let emits = 0
  const notify = createChangeEmitter(() => { emits++ }, 0)
  state.onChange(notify)
  state.recordStep('r1', { step: 1 })
  state.note('gate', 'ask: write', 'r1')
  assert.equal(emits, 2, 'a step and a feed line are two changes')
})
