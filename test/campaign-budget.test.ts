/**
 * Campaign budget reservation and settlement checks.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { CampaignBudget } from '../src/campaign-budget.ts'

test('reservations divide one campaign allowance across feature items', () => {
  const budget = new CampaignBudget(100)
  budget.reserve('feature-a', 60)
  budget.reserve('feature-b', 30)
  assert.equal(budget.availableUSD, 10)
  assert.throws(() => budget.reserve('feature-c', 15), /campaign budget exhausted/)
})

test('duplicate reserve and settle operations are idempotent', () => {
  const budget = new CampaignBudget(100)
  budget.reserve('feature-a', 60)
  budget.reserve('feature-a', 60)
  assert.deepEqual(budget.snapshot().reservations, { 'feature-a': 60 })
  assert.throws(() => budget.reserve('feature-a', 50), /different amount/)
  budget.settle('feature-a', 40)
  budget.settle('feature-a', 40)
  assert.equal(budget.snapshot().spentUSD, 40)
  assert.throws(() => budget.settle('feature-a', 41), /different amount/)
})

test('unused reservations release while observed overspend remains visible', () => {
  const budget = new CampaignBudget(100)
  budget.reserve('done', 60)
  budget.reserve('cancelled', 30)
  budget.settle('done', 100)
  budget.release('cancelled')
  const state = budget.snapshot()
  assert.equal(state.spentUSD, 100)
  assert.equal(state.reservedUSD, 0)
  assert.equal(state.availableUSD, 0)
  assert.deepEqual(state.reservations, {})
  assert.deepEqual(state.settled, { done: 100 })
})

test('invalid limits, item ids, and amounts fail before state changes', () => {
  assert.throws(() => new CampaignBudget(0), /greater than zero/)
  const budget = new CampaignBudget(10)
  assert.throws(() => budget.reserve('', 1), /must not be empty/)
  assert.throws(() => budget.reserve('a', -1), /non-negative/)
  assert.throws(() => budget.reserve('a', Number.NaN), /non-negative/)
  assert.equal(budget.availableUSD, 10)
})
