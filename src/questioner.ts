/**
 * The questioner: the acting LLM's uncertainty, turned into typed questions
 * Laya can answer.
 *
 * Fixed questions (`judgeQuestion` in `review.ts`, the optimizer `BATTERY`)
 * ask what the *author* was unsure about. This module asks what the *actor*
 * is unsure about, per step: the actor's own reasoning text plus the
 * detectors' signals plus the goal go in, and 1–3 typed `SystemOneQuestion`s
 * come out. LLM reasons → Laya decides → LLM acts.
 *
 * The questioner is one LLM call with a strict output contract, shape-checked
 * before anything reaches Laya. The strictness is load-bearing, not
 * bureaucratic: Laya 500s on malformed questions, `score` without a
 * `criteria` ladder answers nothing usable, and an unvalidated question is a
 * judge outage wearing a generation hat. A generation that fails validation
 * is not retried — the caller falls back to `judgeQuestion`, the fixed
 * question that needs no generation. One fallback, not a retry loop: a
 * questioner that cannot produce a well-formed question twice is down, and
 * retrying it at every step would turn a degraded optimisation into a
 * systematic delay on the critical path (the same stance `OnegwJudge` takes
 * with its latch).
 *
 * Wire shape (Jev / TypeSafe / Laya):
 * - `score` criteria = **ordered string array** (map loses ladder labels).
 * - `choice` criteria = map of option-id → label, or a string array of labels.
 * - `noul` needs only instructions.
 *
 * Cost honesty: the questioner is a metered chat call per step where it runs.
 * Callers gate it the same way they gate the judge (detectors fired, or
 * attention budget remaining) — a questioner that asks on every quiet step
 * costs more than the judge it serves.
 *
 * @module dsh-feature-loop/questioner
 */

import type { SystemOneQuestion } from './laya.ts'
import type { LlmClient } from './llm.ts'
import type { ReviewSignal } from './signals.ts'

/** What the questioner needs: the actor's own words, the goal, and the signals. */
export interface QuestionerInput {
  /** The actor's reasoning or last message text for this step. */
  reasoning: string
  /** The loop's goal, so questions stay about the task. */
  goal: string
  /** What the detectors already found. */
  signals: readonly ReviewSignal[]
}

/** One validated question, keyed for the answer lookup. */
export interface AuthoredQuestion {
  key: string
  question: SystemOneQuestion
}

/**
 * Coerce a generated criteria value into the wire shape for one type.
 *
 * Accepts the shapes an LLM is likely to emit: a string array, a numeric-key
 * map (`{"0":"low","1":"high"}`), or a labelled map. Returns `undefined`
 * when the value is unusable for the asked type.
 */
function coerceCriteria(
  type: 'score' | 'choice' | 'noul',
  raw: unknown,
): string[] | Record<string, string> | undefined {
  if (raw === undefined || raw === null) return undefined
  if (Array.isArray(raw)) {
    const levels = raw.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map(v => v.trim())
    return levels.length === 0 ? undefined : levels
  }
  if (typeof raw !== 'object') return undefined
  const entries = Object.entries(raw as Record<string, unknown>)
  const cleaned: [string, string][] = []
  for (const [k, v] of entries) {
    if (typeof v !== 'string' || v.trim() === '') return undefined
    cleaned.push([k, v.trim()])
  }
  if (cleaned.length === 0) return undefined
  if (type === 'score') {
    // Prefer ordered array on the wire so Laya keeps the human labels.
    const allNumeric = cleaned.every(([k]) => /^\d+$/.test(k))
    if (allNumeric) {
      return cleaned
        .map(([k, v]) => [Number(k), v] as const)
        .sort((a, b) => a[0] - b[0])
        .map(([, v]) => v)
    }
    return cleaned.map(([, v]) => v)
  }
  // choice: keep the map so option ids survive as the returned `choice`.
  return Object.fromEntries(cleaned)
}

/**
 * Shape-check one generated question.
 *
 * Laya's three primitives each need their fields: `score` needs a
 * non-empty ordered `criteria` ladder (without it the head has no levels
 * to score on), `choice` needs at least two labelled options, `noul` needs
 * nothing but instructions. Anything else is rejected, not repaired:
 * repairing a question is authoring it, and the author here is the actor,
 * not this validator.
 *
 * @param _key - the question key (reserved for diagnostics).
 * @param raw - the generated candidate.
 * @returns the question, or `undefined` when it fails validation.
 */
export function validateQuestion(_key: string, raw: unknown): SystemOneQuestion | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const q = raw as Record<string, unknown>
  if (q.type !== 'score' && q.type !== 'choice' && q.type !== 'noul') return undefined
  if (typeof q.instructions !== 'string' || q.instructions.trim() === '') return undefined

  if (q.type === 'noul') {
    return { type: 'noul', instructions: q.instructions.trim() }
  }

  const criteria = coerceCriteria(q.type, q.criteria)
  if (q.type === 'score') {
    const levels = Array.isArray(criteria) ? criteria : criteria === undefined ? [] : Object.values(criteria)
    if (levels.length < 2) return undefined
    return { type: 'score', instructions: q.instructions.trim(), criteria: levels }
  }

  // choice
  if (criteria === undefined) return undefined
  const optionCount = Array.isArray(criteria) ? criteria.length : Object.keys(criteria).length
  if (optionCount < 2) return undefined
  return { type: 'choice', instructions: q.instructions.trim(), criteria }
}

/**
 * Parse the questioner's reply into keyed, validated questions.
 *
 * The contract is a JSON object mapping keys to question objects, in a
 * fenced block or bare. At most 3 questions survive; extras are dropped
 * oldest-last (the model lists most important first, so the tail is the
 * expendable end). Zero valid questions is a normal outcome — the caller
 * falls back to the fixed question — not an error.
 *
 * @param raw - the model's reply text.
 * @returns the validated questions, at most 3.
 */
export function parseQuestions(raw: string): AuthoredQuestion[] {
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(raw)
  const text = (fenced?.[1] ?? raw).trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return []
  const out: AuthoredQuestion[] = []
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (out.length >= 3) break
    if (typeof key !== 'string' || key.trim() === '') continue
    const question = validateQuestion(key, value)
    if (question === undefined) continue
    out.push({ key: key.trim(), question })
  }
  return out
}

/** Build the single user prompt the questioner sends. */
export function questionerPrompt(input: QuestionerInput): string {
  const signalLines = input.signals.length === 0
    ? 'none'
    : input.signals.map(s => `- ${s.kind} (${s.severity})${s.detail ? `: ${s.detail}` : ''}`).join('\n')
  return [
    'You author typed decision questions for a non-autoregressive judge (Laya / Jev / TypeSafe).',
    'The actor is about to continue a coding loop. Your job is to surface what is UNCERTAIN, not what is already decided.',
    '',
    `Goal: ${input.goal}`,
    '',
    'Actor reasoning (this step):',
    input.reasoning.trim() === '' ? '(empty)' : input.reasoning.trim(),
    '',
    'Detectors:',
    signalLines,
    '',
    'Author 1–3 typed questions. Reply with a JSON object mapping a short key to a question, fenced or bare.',
    'Each question is {"type": "score"|"choice"|"noul", "instructions": "...", "criteria": ...}.',
    'A "score" question NEEDS "criteria" as an ORDERED ARRAY of at least 2 level labels (e.g. ["routine","risky","stop"]). A map is accepted but the array form is preferred — maps lose ladder labels on the wire.',
    'A "choice" question NEEDS at least 2 options: either a map {"id":"label",...} or an array of labels.',
    'A "noul" question needs only instructions (P(yes)).',
    'Do not narrate. JSON only.',
  ].join('\n')
}

/**
 * Author typed questions for one step, falling back on generation failure.
 *
 * @param opts.llm - the metered chat client (same as the actor).
 * @param opts.model - the model id to ask.
 * @param input - reasoning, goal, signals.
 * @param fallback - supplier for the fixed `judgeQuestion` shape when generation fails.
 */
export async function authorQuestions(
  opts: { llm: LlmClient, model: string },
  input: QuestionerInput,
  fallback: () => { state: string, questions: Record<string, SystemOneQuestion> },
): Promise<{ state: string, questions: Record<string, SystemOneQuestion>, authored: boolean }> {
  const state = [
    `Goal: ${input.goal}`,
    `Reasoning: ${input.reasoning.trim() === '' ? '(none)' : input.reasoning.trim()}`,
    input.signals.length === 0
      ? 'Detectors: none.'
      : `Detectors: ${input.signals.map(s => s.kind).join(', ')}.`,
  ].join('\n')
  try {
    const result = await opts.llm.complete({
      model: opts.model,
      messages: [{ role: 'user', content: questionerPrompt(input) }],
      maxTokens: 600,
    })
    const authored = parseQuestions(result.content)
    if (authored.length === 0) return { ...fallback(), authored: false }
    return {
      state,
      questions: Object.fromEntries(authored.map(a => [a.key, a.question])),
      authored: true,
    }
  } catch {
    // Generation is an optimisation, not a dependency: any failure —
    // gateway error, timeout, empty content — falls back silently. The
    // fallback question is the observable behaviour; the questioner is the
    // upgrade. (Silently, because the caller's transcript already records
    // the judge answer or its absence — a second error line for the
    // questioner would double-report one degraded step.)
    return { ...fallback(), authored: false }
  }
}
