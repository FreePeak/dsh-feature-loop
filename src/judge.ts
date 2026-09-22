/**
 * A chat-based judge: the same contract as the Laya judge, over any model.
 *
 * The attention router's question — "does this step deserve a human's eyes?" —
 * is a classification, and `laya.ts` answers it with a local non-autoregressive
 * engine at ~73 ms and $0. That is the intended production path. This file
 * exists because Laya is not always deployed, and a loop that can only route
 * attention when a particular local model is running is a loop that silently
 * becomes detectors-only the moment that model is down.
 *
 * So the judge is an interface with two implementations, and the router does
 * not know which one it has:
 *
 * - `OnegwJudge` (in `laya.ts`) — the real thing: one typed `score` call, free,
 *   fast, local.
 * - `ChatJudge` (here) — a chat completion asked for a single digit. Slower and
 *   metered, but available anywhere a model is.
 * - `NO_JUDGE` — no judge at all. Detectors only, which is a supported mode.
 *
 * The honest note: a chat judge costs money on every call, and the router calls
 * it per step. On a run with a $1 ceiling that is real. Prefer Laya when it is
 * deployed, and prefer `NO_JUDGE` when the budget is tight enough that the
 * judge's cost rivals the work it is supervising.
 *
 * @module dsh-feature-loop/judge
 */

import type { Judge, SystemOneQuestion } from './laya.ts'
import type { LlmClient } from './llm.ts'

/** Configuration for the chat judge. */
export interface ChatJudgeConfig {
  /** The transport to ask. */
  llm: LlmClient
  /** The model id to ask, e.g. `xiaomi/mimo-v2.5`. */
  model: string
  /**
   * Cap on the judge's own output. Generous, because a reasoning model spends
   * its budget thinking BEFORE it emits the answer: measured against
   * `xiaomi/mimo-v2.5`, a cap of 256 returns `finish_reason: "length"` with
   * empty content, and 1024 returns the answer after 859 thinking tokens. A cap
   * tuned for the one-line answer is a cap that silently disables the judge.
   */
  maxTokens?: number
}

/**
 * Extract a 0–3 score from a model's reply.
 *
 * Tolerant on purpose — the model may wrap the digit in prose, a code fence, or
 * a sentence. Strict on the range: a value outside 0–3 is not a score this
 * scale can express, and silently clamping it would turn a confused judge into
 * a confident one.
 *
 * The labelled form is tried first and the bare-digit form last, because a
 * reasoning model's reply contains the rubric text we sent it, and the rubric
 * contains digits ("0 = routine", "3 = stop"). Matching a bare digit first would
 * read the rubric back as the answer.
 *
 * @param raw - the model's reply.
 * @returns the score, or `undefined` when no in-range labelled digit was present.
 */
export function parseScore(raw: string): number | undefined {
  const labelled = [
    /SCORE\s*[:=]\s*([0-3])\b/i,
    /\bscore\s*[:=]?\s*([0-3])\b/i,
    /\b([0-3])\s*(?:\/\s*3|out of 3)\b/i,
  ]
  for (const pattern of labelled) {
    const match = pattern.exec(raw)
    if (match?.[1] !== undefined) {
      const value = Number(match[1])
      if (Number.isInteger(value) && value >= 0 && value <= 3) return value
    }
  }
  // Last resort: the reply is nothing but a digit. Only accepted when the whole
  // trimmed reply is the digit, so rubric prose can never be mistaken for an
  // answer.
  const bare = /^\s*(?:```[a-z]*\s*)?([0-3])(?:\s*```)?\s*$/.exec(raw)
  if (bare?.[1] !== undefined) return Number(bare[1])
  return undefined
}

/**
 * Create a judge backed by a chat completion.
 *
 * Unlike `OnegwJudge`, this does not latch off after a failure: a chat judge
 * failing once is usually a transient gateway error, and latching it off would
 * quietly downgrade the whole run to detectors-only on a single blip. It does
 * stop asking after repeated failures, so a genuinely dead judge costs a few
 * calls rather than one per step for the rest of the run.
 *
 * @param config - transport, model, and output cap.
 * @returns a judge that always resolves, reporting its failures in `error`.
 */
export function createChatJudge(config: ChatJudgeConfig): Judge {
  const failures: string[] = []
  let consecutiveFailures = 0
  /** After this many consecutive failures, stop asking for the rest of the run. */
  const giveUpAfter = 3

  return {
    async score(state: string, questions: Record<string, SystemOneQuestion>) {
      if (consecutiveFailures >= giveUpAfter) {
        return {
          score: undefined,
          error: `chat judge gave up after ${String(consecutiveFailures)} consecutive failures (last: ${failures.at(-1) ?? 'unknown'})`,
        }
      }
      const question = questions.review_worthiness
      if (question === undefined) {
        return { score: undefined, error: 'no review_worthiness question was supplied' }
      }
      const criteria = Object.entries(question.criteria ?? {})
        .map(([level, text]) => `  ${level} = ${text}`)
        .join('\n')

      try {
        const result = await config.llm.complete({
          model: config.model,
          maxTokens: config.maxTokens ?? 2048,
          messages: [
            {
              role: 'system',
              content: 'You are a review router for an autonomous coding agent. '
                + 'You answer with a single line of the exact form "SCORE=<digit>" and nothing else.',
            },
            {
              role: 'user',
              content: [
                state,
                '',
                question.instructions,
                '',
                'Scale:',
                criteria,
                '',
                'Reply with exactly one line: SCORE=<digit from 0 to 3>',
              ].join('\n'),
            },
          ],
        })
        const score = parseScore(result.content)
        if (score === undefined) {
          consecutiveFailures += 1
          // Name the real cause. "No in-range digit" on an empty reply is
          // technically true and useless: the operator needs to know whether the
          // judge refused, ran out of tokens thinking, or was never reached.
          const detail = result.finishReason === 'length'
            ? `chat judge exhausted its ${String(config.maxTokens ?? 2048)}-token budget while thinking `
              + 'and never emitted an answer — raise maxTokens, or use a non-reasoning judge such as Laya'
            : result.content.trim() === ''
              ? 'chat judge returned empty content with no reason given'
              : `chat judge replied without a SCORE=<digit> line: ${JSON.stringify(result.content.slice(0, 80))}`
          failures.push(detail)
          return { score: undefined, error: detail }
        }
        consecutiveFailures = 0
        return { score }
      } catch (error: unknown) {
        consecutiveFailures += 1
        const detail = `chat judge call failed: ${error instanceof Error ? error.message : String(error)}`
        failures.push(detail)
        return { score: undefined, error: detail }
      }
    },
  }
}
