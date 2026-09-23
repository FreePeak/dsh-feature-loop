/**
 * The local judge: Laya, over the System One / Jev / TypeSafe contract.
 *
 * Laya is an open non-autoregressive decision engine (ModernBERT-class,
 * Apache 2.0) that answers typed questions — `noul`, `choice`, `score` — rather
 * than generating text. That is exactly the right shape for "is this step worth
 * a human's attention?": it is a classification, it runs locally for free, and
 * it returns a level instead of a paragraph to parse.
 *
 * **Provider posture.** Treat Laya like any other decision provider (Jev /
 * TypeSafe): same wire, different base URL. The shared machine service is the
 * containerised sidecar at `http://127.0.0.1:8091` — not onegw, not a repo
 * script, not launchd. This module posts to `/v1/systemone` and never loads
 * weights. Point `baseURL` at the sidecar (default in the CLI) or at a gateway
 * that forwards the same contract; the code does not change.
 *
 * Wire rules that matter (verified live against the sidecar):
 *
 * - **`score` criteria must be an ordered array** of level labels
 *   (`["routine","risky","stop"]`). A map loses ladder order and the engine
 *   labels the legend with the map keys (`"0"`,`"1"`), not the human text.
 * - **`choice` criteria may be a map** (keys are the option ids the engine
 *   returns) or an array (labels are the options).
 * - **`noul` answers as `noul`**, not `probability`. This client maps that
 *   field onto `JudgeResult.probability` so callers stay provider-agnostic.
 * - **Gate on `confidence`**, not the answer alone. Low confidence → keep the
 *   native detectors; a flat multi-way choice is a known low-confidence shape.
 *
 * The judge is an optimisation, not a dependency. If it is slow, unreachable,
 * or returns nonsense, the loop keeps running on its deterministic detectors
 * (`signals.ts`) and *records* that the judge was unavailable. It never fails
 * closed on a judge outage — that would let a local model's downtime stop your
 * work — and it never silently passes either, which is the failure mode this
 * whole file exists to avoid.
 *
 * @module dsh-feature-loop/laya
 */

/**
 * A typed question, as System One / Jev accepts it.
 *
 * For `score`, prefer `criteria` as a `string[]` (ordered ladder). A
 * `Record` is accepted for back-compat and normalised to an ordered array
 * before the POST so the engine keeps the human labels.
 */
export interface SystemOneQuestion {
  type: 'noul' | 'choice' | 'score'
  instructions: string
  /** Ordered ladder (`score`) or labelled options (`choice`). */
  criteria?: string[] | Record<string, string>
}

/** What one System One answer looks like on the wire and after normalisation. */
export interface SystemOneAnswer {
  /** For `score`: the expected level on the ordinal rubric. */
  score?: number
  /**
   * For `noul`: P(yes) in [0, 1]. On the wire the field is often named
   * `noul`; {@link normaliseAnswer} maps it here.
   */
  probability?: number
  /** Wire name for the noul head — kept so raw payloads round-trip. */
  noul?: number
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

/** Configuration for the System-One judge client. */
export interface OnegwJudgeConfig {
  /**
   * Base URL of a System One provider. Swap local Laya (`http://127.0.0.1:8091`)
   * for hosted Jev/TypeSafe by changing only this field (CLI:
   * `--judge-base-url` / `SYSTEMONE_BASE_URL`).
   */
  baseURL: string
  /** Model alias the provider routes to — `laya`, `laya-multilingual`, or a combo. */
  model: string
  /** Bearer key, for a hosted backend. The local sidecar ignores it. */
  apiKey?: string
  /**
   * Deadline for one judge call. Laya is sub-second warm on an M-class machine
   * but a cold weight page-in can take longer, so a first-call timeout is
   * expected and must not stall the loop.
   */
  timeoutMs: number
}

/**
 * Turn a `score` criteria map into an ordered label array.
 *
 * Numeric keys (`"0"`,`"1"`,`"2"`) sort by number so a map written as a
 * ladder keeps ladder order. Non-numeric keys keep insertion order via
 * `Object.values`. Already-array criteria pass through.
 */
export function scoreCriteria(criteria: string[] | Record<string, string> | undefined): string[] | undefined {
  if (criteria === undefined) return undefined
  if (Array.isArray(criteria)) return criteria
  const entries = Object.entries(criteria)
  const allNumeric = entries.every(([k]) => /^\d+$/.test(k))
  if (allNumeric) {
    return entries
      .map(([k, v]) => [Number(k), v] as const)
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v)
  }
  return entries.map(([, v]) => v)
}

/**
 * Shape one question for the wire: `score` criteria become ordered arrays.
 * `choice` maps stay maps (option ids matter); `choice` arrays stay arrays.
 */
export function wireQuestion(q: SystemOneQuestion): SystemOneQuestion {
  if (q.type !== 'score' || q.criteria === undefined || Array.isArray(q.criteria)) return q
  return { ...q, criteria: scoreCriteria(q.criteria) }
}

/**
 * Map a raw System One answer onto the fields callers read.
 *
 * Laya/Jev name the noul head `noul`; some gateways rename it `probability`.
 * Callers only ever see `probability`.
 */
export function normaliseAnswer(raw: SystemOneAnswer | undefined): SystemOneAnswer | undefined {
  if (raw === undefined) return undefined
  const probability = typeof raw.probability === 'number' && Number.isFinite(raw.probability)
    ? raw.probability
    : typeof raw.noul === 'number' && Number.isFinite(raw.noul)
      ? raw.noul
      : undefined
  return {
    ...raw.score !== undefined ? { score: raw.score } : {},
    ...probability !== undefined ? { probability } : {},
    ...raw.choice !== undefined ? { choice: raw.choice } : {},
    ...raw.confidence !== undefined ? { confidence: raw.confidence } : {},
  }
}

/**
 * The System-One judge client (class name kept for call-site stability).
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
    // score maps → ordered arrays before the wire; choice maps stay.
    const wired: Record<string, SystemOneQuestion> = {}
    for (const [k, q] of Object.entries(questions)) wired[k] = wireQuestion(q)
    try {
      const response = await fetch(`${this.config.baseURL.replace(/\/$/, '')}/v1/systemone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.apiKey === undefined ? {} : { Authorization: `Bearer ${this.config.apiKey}` },
        },
        body: JSON.stringify({ state, model: this.config.model, questions: wired }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const detail = `systemone returned ${String(response.status)}`
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
      const answer = normaliseAnswer(key === undefined ? undefined : payload.answers?.[key])
      if (answer === undefined) {
        const detail = `systemone answered without "${key}" — asked [${keys.join(', ')}], got [${Object.keys(payload.answers ?? {}).join(', ')}]`
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
