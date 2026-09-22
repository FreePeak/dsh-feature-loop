/**
 * Rolling latency window behind the loop's model-escalation policy.
 *
 * The loop starts on the cheapest model and climbs the ladder only when the
 * tool calls it just made are demonstrably slow. "Demonstrably" means the tail
 * of the window, never one outlier: `shouldEscalate` reads `percentile(95)`, so
 * how that number is defined decides how often the loop spends real money.
 *
 * Percentiles are **nearest-rank**, never interpolated: for `n` samples the
 * answer is the sample at 0-based index `max(0, ceil(p / 100 * n) - 1)` of the
 * ascending snapshot. p0 is the fastest sample, p100 the slowest, p50 over an
 * even window is the *lower* middle sample, and p95 over 20 samples is the 19th
 * fastest — the slowest sample only when the rank lands on it.
 *
 * @module demo/latency-window
 */

/** Summary of the samples in a window; every stat is absent when empty. */
export interface LatencyStats {
  count: number
  mean: number | undefined
  p50: number | undefined
  p95: number | undefined
  max: number | undefined
}

/** A fixed-size window of the most recent latencies, in milliseconds. */
export class LatencyWindow {
  /** How many recent samples the window retains. */
  readonly capacity: number

  #samples: number[] = []

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`capacity must be a positive integer, got ${capacity}`)
    }
    this.capacity = capacity
  }

  /** Number of samples currently held. */
  get size(): number {
    return this.#samples.length
  }

  /** Append one latency, dropping the oldest sample once the window is full. */
  record(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new RangeError(`latency must be a finite, non-negative number, got ${ms}`)
    }
    this.#samples.push(ms)
    // ponytail: O(n) shift is fine for the handful of samples a run keeps.
    if (this.#samples.length > this.capacity) this.#samples.shift()
  }

  /** Ascending copy of the current window. */
  snapshot(): number[] {
    return [...this.#samples].sort((a, b) => a - b)
  }

  /** Arithmetic mean of the current window, or `undefined` when empty. */
  mean(): number | undefined {
    return this.#samples.length === 0
      ? undefined
      : this.#samples.reduce((sum, ms) => sum + ms, 0) / this.#samples.length
  }

  /** Slowest sample in the current window, or `undefined` when empty. */
  max(): number | undefined {
    return this.#samples.length === 0 ? undefined : Math.max(...this.#samples)
  }

  /**
   * Nearest-rank percentile of the current window.
   *
   * @param p Probability in [0, 100]; 0 is the fastest sample, 100 the slowest.
   * @returns The observed sample at rank `max(0, ceil(p / 100 * n) - 1)`, or
   *   `undefined` when the window is empty.
   * @throws {RangeError} When `p` is not a finite number within [0, 100].
   */
  percentile(p: number): number | undefined {
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      throw new RangeError(`percentile must be within [0, 100], got ${p}`)
    }
    if (this.#samples.length === 0) return undefined

    const sorted = this.snapshot()
    const rank = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
    return sorted[rank]
  }

  /** Every statistic the escalation policy reads. */
  stats(): LatencyStats {
    return {
      count: this.#samples.length, mean: this.mean(), p50: this.percentile(50),
      p95: this.percentile(95), max: this.max(),
    }
  }
}

/** How the loop decides a stronger model is worth buying. */
export interface EscalationOptions {
  /** p95 latency the loop tolerates, in milliseconds. */
  p95BudgetMs: number
  /** Samples required before the tail is trusted. Defaults to 1. */
  minSamples?: number
}

/**
 * Whether the loop should climb to a stronger model on the next step: true only
 * once `minSamples` are recorded *and* the window's p95 is strictly over budget.
 */
export function shouldEscalate(window: LatencyWindow, opts: EscalationOptions): boolean {
  const minSamples = opts.minSamples ?? 1
  if (window.size < minSamples) return false
  const p95 = window.percentile(95)
  return p95 !== undefined && p95 > opts.p95BudgetMs
}
