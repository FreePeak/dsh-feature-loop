/**
 * The local judge: Laya, over onegw's System One endpoint.
 *
 * Laya is an open non-autoregressive decision engine (ModernBERT-class,
 * Apache 2.0) that answers typed questions — `noul`, `choice`, `score` — rather
 * than generating text. That is exactly the right shape for "is this step worth
 * a human's attention?": it is a classification, it runs locally for free, and
 * it returns a level instead of a paragraph to parse.
 *
 * Two rules this module obeys, both from the portfolio's existing ownership
 * table (`agentloop/docs/JEV-INTEGRATION.md`):
 *
 * 1. **Transport goes through onegw.** This file never imports Laya, never
 *    loads weights, and never talks to a backend directly. It posts to the
 *    gateway, which owns backend selection, usage accounting, and fallback.
 * 2. **The judge is an optimisation, not a dependency.** If it is slow,
 *    unreachable, or returns nonsense, the loop keeps running on its
 *    deterministic detectors (`signals.ts`) and *records* that the judge was
 *    unavailable. It never fails closed on a judge outage — that would let a
 *    local model's downtime stop your work — and it never silently passes
 *    either, which is the failure mode this whole file exists to avoid.
 *
 * @module dsh-feature-loop/laya
 */

/** A typed question, as System One accepts it. */
export interface SystemOneQuestion {
  type: 'noul' | 'choice' | 'score'
  instructions: string
  criteria?: Record<string, string>
}

/** What one System One answer looks like, per primitive. */
export interface SystemOneAnswer {
  /** For `score`: the expected level on the ordinal rubric. */
  score?: number
  /** For `noul`: P(yes) in [0, 1]. */
  probability?: number
  /** For `choice`: the selected label. */
  choice?: string
  /** The engine's own confidence, when it reports one. */
  confidence?: number
}

/** The judge contract the router consumes. */
export interface Judge {
  /**
   * Score one step's review-worthiness on the book's 0–3 scale.
   * @param state - the step summary plus whatever the detectors found.
   * @param questions - the typed questions, from `judgeQuestion`.
   * @returns the score, or `undefined` when the judge could not answer.
   */
  score(
    state: string,
    questions: Record<string, SystemOneQuestion>,
  ): Promise<JudgeResult>
}

/**
 * What one judge call returns.
 *
 * `score` is the attention-router path: the 0–3 level for the
 * `review_worthiness` question, or `undefined` when the engine did not answer
 * it. The remaining fields are the optimizer battery's ride home: `choice`
 * and `noul` answers have no numeric score, so without these fields a live
 * engine's correct `choice`/`noul` answers would arrive at `readAnswer` as an
 * empty object and be dropped as "no answer". Carrying them is transport, not
 * policy — `readAnswer` still validates each one against the question asked.
 */
export interface JudgeResult {
  score: number | undefined
  error?: string
  /** The `choice` label, when the answered question was a `choice`. */
  choice?: string
  /** P(yes) in [0, 1], when the answered question was a `noul`. */
  probability?: number
  /** The engine's own confidence, when it reported one. */
  confidence?: number
}

/** Configuration for the onegw-backed judge. */
export interface OnegwJudgeConfig {
  /** onegw base URL, e.g. `http://127.0.0.1:8080`. */
  baseURL: string
  /** The model alias onegw should route to — `laya`, `laya-multilingual`, or a combo. */
  model: string
  /** Bearer key, for a hosted backend. Laya local ignores it. */
  apiKey?: string
  /**
   * Deadline for one judge call. Laya is ~73 ms warm on an M2 Pro but its first
   * cold load was measured in minutes, so a first-call timeout is expected and
   * must not stall the loop.
   */
  timeoutMs: number
}

/**
 * The onegw-backed judge.
 *
 * A failed call is latched off for the rest of the run rather than retried: a
 * judge that is down is down, and retrying it at every step would turn a
 * degraded optimisation into a systematic delay on the critical path.
 */
export class OnegwJudge implements Judge {
  private readonly config: OnegwJudgeConfig
  /** Set after the first failure, so a dead judge costs one call, not one per step. */
  private disabled: string | undefined

  constructor(config: OnegwJudgeConfig) {
    this.config = config
  }

  /** Whether the judge has been latched off, and why. */
  disabledReason(): string | undefined {
    return this.disabled
  }

  async score(
    state: string,
    questions: Record<string, SystemOneQuestion>,
  ): Promise<JudgeResult> {
    if (this.disabled !== undefined) return { score: undefined, error: this.disabled }

    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort() }, this.config.timeoutMs)
    try {
      const response = await fetch(`${this.config.baseURL.replace(/\/$/, '')}/v1/systemone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.apiKey === undefined ? {} : { Authorization: `Bearer ${this.config.apiKey}` },
        },
        body: JSON.stringify({ state, model: this.config.model, questions }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const detail = `onegw /v1/systemone returned ${String(response.status)}`
        this.disabled = detail
        return { score: undefined, error: detail }
      }
      const payload = await response.json() as { answers?: Record<string, SystemOneAnswer> }
      // Read the answer under the key that was asked, not a fixed one: the
      // attention router asks `review_worthiness`, the optimizer battery asks
      // one lever-named question per call (`ladder-rung`, `max-tokens`, …).
      // A fixed key here meant every battery question "errored" against a live
      // engine that had answered correctly — verified live 2026-09-23.
      const keys = Object.keys(questions)
      const key = keys.length === 1 ? keys[0]! : 'review_worthiness'
      const answer = key === undefined ? undefined : payload.answers?.[key]
      if (answer === undefined) {
        const detail = `onegw /v1/systemone answered without "${key}" — asked [${keys.join(', ')}], got [${Object.keys(payload.answers ?? {}).join(', ')}]`
        this.disabled = detail
        return { score: undefined, error: detail }
      }
      return {
        score: typeof answer.score === 'number' && Number.isFinite(answer.score) ? answer.score : undefined,
        ...answer.probability !== undefined ? { probability: answer.probability } : {},
        ...answer.choice !== undefined ? { choice: answer.choice } : {},
        ...answer.confidence !== undefined ? { confidence: answer.confidence } : {},
      }
    } catch (error: unknown) {
      const detail = error instanceof Error && error.name === 'AbortError'
        ? `judge timed out after ${String(this.config.timeoutMs)}ms (Laya's first cold load can take minutes)`
        : `judge call failed: ${error instanceof Error ? error.message : String(error)}`
      this.disabled = detail
      return { score: undefined, error: detail }
    } finally {
      clearTimeout(timer)
    }
  }
}

/**
 * The judge you get when none is configured. Always unavailable, and honest
 * about it: the router then runs on detectors alone, which is a supported mode
 * rather than a broken one.
 */
export const NO_JUDGE: Judge = {
  score: () => Promise.resolve({ score: undefined, error: 'no judge configured' }),
}
