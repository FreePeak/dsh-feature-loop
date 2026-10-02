/**
 * The check for the latency window and the escalation policy it feeds.
 *
 * Run: `node --experimental-strip-types --test demo/test/latency-window.test.ts`
 * No install, no build step, no network — the window is pure, so its test is too.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { LatencyWindow, shouldEscalate } from '../src/latency-window.ts'

/**
 * A full 20-sample window: nineteen calls between 100 ms and 190 ms, then one
 * 900 ms outlier. Rank 18 (the 19th fastest) is 190; rank 19 is 900.
 */
function fullWindow(): LatencyWindow {
  const window = new LatencyWindow(20)
  for (let i = 0; i < 19; i += 1) window.record(100 + i * 5)
  window.record(900)
  return window
}

test('a new window starts empty and reports no statistics', () => {
  const window = new LatencyWindow(5)
  assert.equal(window.size, 0)
  assert.deepEqual(window.snapshot(), [])
  assert.deepEqual(window.stats(), {
    count: 0,
    mean: undefined,
    p50: undefined,
    p95: undefined,
    max: undefined,
  })
  assert.equal(window.percentile(95), undefined)
})

test('the window keeps only the most recent capacity samples', () => {
  const window = new LatencyWindow(3)
  for (const ms of [10, 20, 30, 40]) window.record(ms)
  assert.equal(window.size, 3)
  assert.deepEqual(window.snapshot(), [20, 30, 40])
})

test('mean and max describe the samples currently in the window', () => {
  const window = new LatencyWindow(3)
  for (const ms of [10, 20, 30, 40]) window.record(ms)
  assert.equal(window.mean(), 30)
  assert.equal(window.max(), 40)
})

test('snapshot is ascending and does not expose the window internals', () => {
  const window = new LatencyWindow(4)
  for (const ms of [30, 10, 40, 20]) window.record(ms)
  assert.deepEqual(window.snapshot(), [10, 20, 30, 40])
  window.snapshot().push(9999)
  assert.equal(window.size, 4)
})

test('record rejects a negative or non-finite latency', () => {
  const window = new LatencyWindow(4)
  assert.throws(() => window.record(-1), RangeError)
  assert.throws(() => window.record(Number.NaN), RangeError)
  assert.throws(() => window.record(Number.POSITIVE_INFINITY), RangeError)
  assert.equal(window.size, 0)
})

test('the constructor rejects a capacity that is not a positive integer', () => {
  assert.throws(() => new LatencyWindow(0), RangeError)
  assert.throws(() => new LatencyWindow(2.5), RangeError)
})

test('percentile rejects a probability outside 0 to 100', () => {
  const window = new LatencyWindow(4)
  window.record(10)
  assert.throws(() => window.percentile(-1), RangeError)
  assert.throws(() => window.percentile(101), RangeError)
  assert.throws(() => window.percentile(Number.NaN), RangeError)
})

test('p0 is the fastest sample and p100 is the slowest', () => {
  const window = fullWindow()
  assert.equal(window.percentile(0), 100)
  assert.equal(window.percentile(100), 900)
})

test('p95 of a seven-sample window is its slowest sample', () => {
  // 95 / 100 * 7 = 6.65, so the nearest rank lands on the last sample.
  const window = new LatencyWindow(7)
  for (const ms of [10, 20, 30, 40, 50, 60, 70]) window.record(ms)
  assert.equal(window.percentile(95), 70)
  assert.equal(window.percentile(95), window.max())
})

test('shouldEscalate stays quiet until minSamples have been recorded', () => {
  const window = new LatencyWindow(20)
  window.record(900)
  assert.equal(shouldEscalate(window, { p95BudgetMs: 100, minSamples: 5 }), false)
  assert.equal(shouldEscalate(window, { p95BudgetMs: 100 }), true)
})

test('shouldEscalate stays quiet while the p95 is inside budget', () => {
  const window = new LatencyWindow(20)
  for (let i = 0; i < 20; i += 1) window.record(100 + i)
  assert.equal(shouldEscalate(window, { p95BudgetMs: 150 }), false)
})

test('p50 of a four-sample window is the lower of the two middle samples', () => {
  const window = new LatencyWindow(4)
  for (const ms of [10, 20, 30, 40]) window.record(ms)
  assert.equal(window.percentile(50), 20)
})

test('p95 of a full twenty-sample window is the 19th fastest sample, not the slowest', () => {
  const window = fullWindow()
  assert.equal(window.percentile(95), 190)
})

test('one slow tool call does not escalate the loop when the p95 sits inside budget', () => {
  const window = fullWindow()
  assert.equal(shouldEscalate(window, { p95BudgetMs: 500, minSamples: 20 }), false)
})

// Nearest-rank is `ceil(p / 100 * n) - 1`, and in IEEE doubles `p / 100 * n`
// is not always that. Measured: 28/100*25 is 7.000000000000001, so the float
// form's `ceil` is 8 and it returns the sample AFTER the one nearest-rank is
// defined to return — silently, for every percentile whose rank lands on a
// whole number. Multiply first: `ceil(p * n / 100)`.

test('the rank is exact when p / 100 * n is a whole number in exact arithmetic', () => {
  const window = new LatencyWindow(25)
  for (let i = 1; i <= 25; i += 1) window.record(i * 10)

  // 28th percentile of 25 samples, nearest-rank: rank 7 → the 7th fastest, 70.
  assert.equal(window.percentile(28), 70)
  // The float form computes 28/100*25 = 7.000000000000001, ceils to 8, and
  // returns 80 — the sample nearest-rank never promises.
  assert.notEqual(28 / 100 * 25, 7)
  assert.equal(Math.ceil((28 / 100) * 25) - 1, 7, 'the float form is off by one here')
  assert.equal(Math.ceil((28 * 25) / 100) - 1, 6, 'the integer form is the documented rank')
  assert.equal(window.percentile(56), 140)
})

test('every whole-number rank in a 25-sample window returns the right sample', () => {
  const window = new LatencyWindow(25)
  for (let i = 1; i <= 25; i += 1) window.record(i * 10)
  // p = 4k makes p*n/100 = k exactly for every k in 1..25, so nearest-rank's
  // rank is k-1 and `sorted[k-1]` is the k-th recorded value, k*10. The float
  // form rounds up to k on every one of them and returns (k+1)*10 instead.
  for (let k = 1; k <= 25; k += 1) {
    assert.equal(window.percentile(k * 4), k * 10, `p=${String(k * 4)}`)
  }
  assert.equal(window.percentile(0), 10, 'p=0 is clamped to the fastest sample, not off the front')
})
