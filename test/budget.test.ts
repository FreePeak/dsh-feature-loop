/**
 * The check that fails when the ceilings or the ladder break.
 *
 * Run: `node --experimental-strip-types --test test/budget.test.ts`
 * No harness, no network, no model call — the policy is pure, so its test is too.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { LoopBudget, UnpricedRouteError, priceUsage, routeKey } from '../src/budget.ts'
import { EmptyLadderError, ModelLadder, routeLabel } from '../src/routing.ts'

const PRICES = {
  'deepseek/deepseek-v4-flash': { inputPerMTok: 0.14, outputPerMTok: 0.28, cacheReadPerMTok: 0.014 },
  'deepseek/deepseek-v4-pro': { inputPerMTok: 2.5, outputPerMTok: 10 },
}

test('priceUsage bills cache traffic at the cache rate, not at zero', () => {
  // 1M input, 1M output, 10M cache-read at the flash rates above.
  const usd = priceUsage(
    { inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 10_000_000 },
    PRICES['deepseek/deepseek-v4-flash'],
  )
  // 0.14 + 0.28 + (10 * 0.014) = 0.56
  assert.ok(Math.abs(usd - 0.56) < 1e-9, `expected 0.56, got ${usd}`)
})

test('priceUsage falls back to the input rate when a route declares no cache rate', () => {
  const usd = priceUsage(
    { inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 },
    PRICES['deepseek/deepseek-v4-pro'],
  )
  assert.ok(Math.abs(usd - 2.5) < 1e-9, `expected 2.5, got ${usd}`)
})

test('an unknown route with no fallback is an error, never a silent zero', () => {
  const budget = new LoopBudget({ maxSteps: 5, costBudgetUSD: 1, prices: PRICES })
  assert.throws(() => budget.priceOf('other', 'mystery-model'), UnpricedRouteError)
})

test('the step ceiling stops the step after maxSteps, not before it', () => {
  const budget = new LoopBudget({ maxSteps: 3, costBudgetUSD: 10, prices: PRICES })
  assert.equal(budget.verdict(3).kind, 'ok')
  const stopped = budget.verdict(4)
  assert.equal(stopped.kind, 'stop')
  assert.match((stopped as { reason: string }).reason, /step ceiling/)
})

test('the cost ceiling stops a run that spends its budget, before the next step', () => {
  const budget = new LoopBudget({ maxSteps: 99, costBudgetUSD: 1, prices: PRICES })
  assert.equal(budget.verdict(1).kind, 'ok')

  // One pro-tier step of 400k in / 20k out = 1.0 + 0.2 = $1.20, over a $1 budget.
  budget.spend('deepseek', 'deepseek-v4-pro', { inputTokens: 400_000, outputTokens: 20_000 })

  const verdict = budget.verdict(2)
  assert.equal(verdict.kind, 'stop', 'a spent budget must stop the next step')
  assert.match((verdict as { reason: string }).reason, /cost ceiling/)
  assert.ok(budget.fraction() > 1)
})

test('the warn threshold fires before the ceiling, so the model can converge', () => {
  const budget = new LoopBudget({ maxSteps: 99, costBudgetUSD: 1, warnAt: 0.8, prices: PRICES })
  budget.spend('deepseek', 'deepseek-v4-pro', { inputTokens: 350_000, outputTokens: 10_000 }) // $0.975
  const verdict = budget.verdict(2)
  assert.equal(verdict.kind, 'warn')
  assert.match((verdict as { reason: string }).reason, /98%|97%/)
})

test('a missing usage reading counts the step but does not invent a cost', () => {
  const budget = new LoopBudget({ maxSteps: 5, costBudgetUSD: 1, prices: PRICES })
  assert.equal(budget.spend('deepseek', 'deepseek-v4-flash', undefined), 0)
  assert.equal(budget.snapshot().steps, 1)
  assert.equal(budget.snapshot().spentUSD, 0)
})

test('the snapshot attributes spend per route, which is the number you tune the ladder with', () => {
  const budget = new LoopBudget({ maxSteps: 9, costBudgetUSD: 5, prices: PRICES })
  budget.spend('deepseek', 'deepseek-v4-flash', { inputTokens: 1_000_000, outputTokens: 0 }) // 0.14
  budget.spend('deepseek', 'deepseek-v4-pro', { inputTokens: 1_000_000, outputTokens: 0 }) // 2.50
  const snap = budget.snapshot()
  assert.equal(snap.steps, 2)
  assert.ok(Math.abs(snap.byRoute[routeKey('deepseek', 'deepseek-v4-flash')].usd - 0.14) < 1e-9)
  assert.ok(Math.abs(snap.byRoute[routeKey('deepseek', 'deepseek-v4-pro')].usd - 2.5) < 1e-9)
})

test('an unlimited or nonsensical budget is refused at construction', () => {
  assert.throws(() => new LoopBudget({ maxSteps: 0, costBudgetUSD: 1 }), /maxSteps/)
  assert.throws(() => new LoopBudget({ maxSteps: 1, costBudgetUSD: 0 }), /costBudgetUSD/)
  assert.throws(() => new LoopBudget({ maxSteps: 1, costBudgetUSD: 1, warnAt: 1.5 }), /warnAt/)
})

test('the ladder starts on the cheapest rung and only moves up', () => {
  const ladder = new ModelLadder({
    ladder: [{ model: 'deepseek-v4-flash' }, { model: 'deepseek-v4-pro' }],
    stepsPerRung: 3,
  })
  assert.equal(ladder.forStep(1).rung, 0)
  assert.equal(ladder.forStep(3).rung, 0)
  assert.equal(ladder.forStep(4).rung, 1, 'step 4 is the second rung with stepsPerRung=3')
  assert.equal(ladder.forStep(9).rung, 1, 'the last rung absorbs the remainder')
  assert.equal(ladder.forStep(1).rung, 1, 'escalation is sticky; it never walks back down')
})

test('consecutive failures escalate early, because the rung is the problem', () => {
  const ladder = new ModelLadder({
    ladder: [{ model: 'flash' }, { model: 'pro' }],
    escalateAfterFailures: 2,
  })
  assert.equal(ladder.rungIndex(), 0)
  ladder.recordFailure()
  assert.equal(ladder.rungIndex(), 0, 'one failure is not evidence yet')
  ladder.recordFailure()
  assert.equal(ladder.rungIndex(), 1)
})

test('a success clears the failure streak so a flaky step does not escalate', () => {
  const ladder = new ModelLadder({
    ladder: [{ model: 'flash' }, { model: 'pro' }],
    escalateAfterFailures: 2,
  })
  ladder.recordFailure()
  ladder.recordSuccess()
  ladder.recordFailure()
  assert.equal(ladder.rungIndex(), 0, 'two non-consecutive failures must not escalate')
})

test('maxRung pins a small task to the cheap tier for its whole life', () => {
  const ladder = new ModelLadder({
    ladder: [{ model: 'flash' }, { model: 'pro' }],
    stepsPerRung: 1,
    escalateAfterFailures: 1,
    maxRung: 0,
  })
  ladder.recordFailure()
  assert.equal(ladder.forStep(50).rung, 0, 'maxRung is a hard cap, not a hint')
})

test('an empty or out-of-range ladder is refused, not silently degraded', () => {
  assert.throws(() => new ModelLadder({ ladder: [] }), EmptyLadderError)
  assert.throws(
    () => new ModelLadder({ ladder: [{ model: 'a' }], maxRung: 3 }),
    /maxRung 3 is outside the ladder/,
  )
})

test('routeLabel renders a provider-less rung without a stray slash', () => {
  assert.equal(routeLabel({ model: 'flash' }), 'flash')
  assert.equal(routeLabel({ provider: 'deepseek', model: 'flash' }), 'deepseek/flash')
})

test('an unpriceable route throws even when the adapter reported no usage', () => {
  // This is the hole that made the cost ceiling a fiction: a gateway that
  // reports no usage must not be able to make an unpriced route free. The price
  // is resolved before the usage check, so an unknown route is an error either
  // way.
  const budget = new LoopBudget({ maxSteps: 10, costBudgetUSD: 1, prices: PRICES })
  assert.throws(() => budget.spend('nobody', 'mystery-model', undefined), UnpricedRouteError)
})

test('steps the adapter reported no usage for are counted, not hidden as free', () => {
  const budget = new LoopBudget({ maxSteps: 10, costBudgetUSD: 1, prices: PRICES })
  budget.spend('deepseek', 'deepseek-v4-flash', { inputTokens: 1_000_000, outputTokens: 0 })
  budget.spend('deepseek', 'deepseek-v4-flash', undefined)
  budget.spend('deepseek', 'deepseek-v4-flash', undefined)
  const snapshot = budget.snapshot()
  assert.equal(snapshot.steps, 3)
  assert.equal(snapshot.unpricedSteps, 2, 'a non-zero count means spentUSD is an under-count and must say so')
  // The priced step is still priced: an unpriced step does not zero the run.
  assert.ok(Math.abs(snapshot.spentUSD - 0.14) < 1e-9, `expected 0.14, got ${snapshot.spentUSD}`)
})

test('a run of entirely unpriced steps reports zero spend but a full unpriced count', () => {
  const budget = new LoopBudget({ maxSteps: 10, costBudgetUSD: 1, prices: PRICES })
  for (let i = 0; i < 5; i += 1) budget.spend('deepseek', 'deepseek-v4-flash', undefined)
  const snapshot = budget.snapshot()
  assert.equal(snapshot.spentUSD, 0)
  assert.equal(snapshot.unpricedSteps, 5)
  // And the step ceiling still applies, so an unpriced run is still bounded.
  assert.equal(budget.verdict(11).kind, 'stop')
})

test('spend is non-zero after a priced attempt — the acceptance for the metering gap', () => {
  // The PRD's own acceptance criterion: `costBudgetUSD` used to measure zero
  // because nothing ever called `spend()` with real usage. This asserts the
  // number the cost ceiling runs on actually moves when an attempt is priced.
  const budget = new LoopBudget({ maxSteps: 5, costBudgetUSD: 1, prices: PRICES })
  const usd = budget.spend(
    'deepseek',
    'deepseek-v4-flash',
    { inputTokens: 1_000_000, outputTokens: 100_000, reasoningTokens: 50_000 },
  )
  // 0.14 input + 0.028 output = 0.168. The 50k reasoning tokens ride inside
  // outputTokens — they must not be billed a second time.
  assert.ok(usd > 0, `a priced attempt must cost something, got ${String(usd)}`)
  assert.ok(Math.abs(usd - 0.168) < 1e-9, `expected 0.168, got ${String(usd)}`)
  const snapshot = budget.snapshot()
  assert.ok(snapshot.spentUSD > 0, 'spentUSD must leave zero — this is the gap the metering fix closes')
  assert.equal(snapshot.unpricedSteps, 0)
})
