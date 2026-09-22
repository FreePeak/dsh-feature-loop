/**
 * The optimizer: where the loop can improve quality, cost, and speed — asked
 * of the local judge as typed questions, never as prose from it.
 *
 * Laya is a NON-AUTOREGRESSIVE decision engine. It answers three typed forms
 * and nothing else: `noul` (P(yes) in [0, 1]), `choice` (one selected label),
 * and `score` (an ordinal level). It cannot generate advice. So "find the
 * spots to optimize" cannot mean "ask the model what to optimize" — it means a
 * FIXED BATTERY of typed questions over one compact state string, each
 * question mapped to exactly ONE lever the loop already has (the cheap-first
 * ladder, the step ceiling, `stepsPerRung`, the attention budget, a
 * tool-result cap…). A recommendation the loop cannot act on is worse than
 * none: it spends the operator's trust on a dial that does not exist.
 *
 * Every failure mode falls TOWARD "no advice", never toward bad advice:
 *
 * 1. Judge unavailable, latched-off, or throwing → `{ recommendations: [],
 *    unavailable: <reason> }` — mirroring `OnegwJudge`'s documented latch-off
 *    ("it never fails closed on a judge outage"): a local model's downtime
 *    must not stop your work, and it must not whisper tuning advice either.
 * 2. A `score` answer outside 0–3 REJECTS that question — never clamped
 *    (judge.ts's rule: "clamping would turn a confused judge into a confident
 *    one").
 * 3. A `choice`/`noul` call that errors DROPS that question and continues
 *    with the rest. All three primitives are verified live against local Laya
 *    (2026-09-23: `choice` picked the right tool label, `noul` returned a
 *    P(yes), `score` returned expected levels) — but the rule stays, because
 *    a future engine that cannot answer one primitive must not take the other
 *    six down with it.
 * 4. No confidence from the engine → the recommendation sorts to the END and
 *    says so in its evidence.
 * 5. Cost levers (`ladder-rung`, `max-tokens`, `tool-result-size`) are
 *    SUPPRESSED entirely when any record has `unpricedSteps > 0`: proposing
 *    savings off a meter reading zero is exactly the failure `docs/PRD.md`
 *    §8 calls the largest correctness gap, and `runlog.ts` already rules that
 *    every cost number derived from an under-count "must be suppressed rather
 *    than believed".
 *
 * Inputs are `RunRecord[]` and `spec: unknown` — the same seam `runlog.ts`
 * documents: policy is pure, records are the substrate, and the spec is read
 * defensively so a config change elsewhere cannot throw here.
 *
 * @module dsh-feature-loop/optimizer
 */

import type { Judge, JudgeResult, SystemOneAnswer, SystemOneQuestion } from './laya.ts'
import type { RunRecord } from './runlog.ts'

/** One dial the loop actually has. Every question in the battery maps to exactly one. */
export type Lever =
  | 'ladder-rung'
  | 'max-tokens'
  | 'prompt-cache'
  | 'step-ceiling'
  | 'escalation'
  | 'attention-budget'
  | 'tool-result-size'

/**
 * One change the loop could make, tied to the typed answer that produced it.
 *
 * `current` and `proposed` name real config surfaces (spec fields, CLI flags,
 * tool defaults) rather than vague directions — a recommendation the loop
 * cannot act on is worse than none. `confidence` is present only when the
 * engine reported one; when absent, `proposeOptimizations` sorts the entry to
 * the end and marks `evidence` low-confidence instead of inventing a number.
 */
export interface Recommendation {
  lever: Lever
  current: string
  proposed: string
  evidence: string
  confidence?: number
  questionType: 'noul' | 'choice' | 'score'
}

/**
 * The word bound for {@link buildOptimizerState}.
 *
 * Exported so the test can assert against a stated number rather than a
 * comment's promise. ~600 whitespace-separated words keeps the state string
 * cheap as a prompt while leaving room for a fat history to be truncated
 * deliberately rather than mid-line by accident.
 */
export const OPTIMIZER_STATE_WORD_LIMIT = 600

/**
 * The levers whose savings depend on metered cost. Suppressed together, the
 * moment any record reports an unpriced step, because an under-counted
 * `costUSD` cannot tell you where money is going — only that it is missing.
 */
const COST_LEVERS: ReadonlySet<Lever> = new Set<Lever>([
  'ladder-rung',
  'max-tokens',
  'tool-result-size',
])

/** Defaults the spec does not carry, quoted from the modules that own them. */
const DEFAULT_MAX_TOKENS_PER_STEP = 4096 // cli.ts: `--max-tokens` default
const DEFAULT_TOOL_RESULT_CAP_BYTES = 20_000 // tools.ts: DEFAULT_MAX_OUTPUT_BYTES
const DEFAULT_STEPS_PER_RUNG = 0 // routing.ts: 0 = never escalate on step count
const DEFAULT_ESCALATE_AFTER_FAILURES = 3 // cli.ts controller default
const DEFAULT_REVIEW_BUDGET = 0.1 // review.ts: DEFAULT_ROUTER
const DEFAULT_JUDGE_THRESHOLD = 2 // review.ts: DEFAULT_ROUTER

/** The book's step-ceiling band the optimizer moves within, in steps. */
const STEP_CEILING_BAND: Readonly<{ min: number; max: number }> = { min: 3, max: 10 }

/**
 * What the optimizer reads out of the spec, defensively.
 *
 * `spec` arrives as `unknown`, so every field is pulled with `typeof` guards
 * and falls back to the default the owning module already ships — an absent
 * knob must read as "as configured", never as a crash or a silent zero.
 */
interface SpecView {
  maxSteps: number | undefined
  costBudgetUSD: number | undefined
  ladder: string[]
  maxRung: number | undefined
  stepsPerRung: number
  escalateAfterFailures: number
  maxTokensPerStep: number
  toolResultCapBytes: number
  reviewBudget: number
  judgeThreshold: number
}

function readSpec(spec: unknown): SpecView {
  const root: Record<string, unknown> =
    typeof spec === 'object' && spec !== null ? spec as Record<string, unknown> : {}
  const controller: Record<string, unknown> =
    typeof root.controller === 'object' && root.controller !== null
      ? root.controller as Record<string, unknown>
      : {}
  const rawLadder = Array.isArray(controller.ladder) ? controller.ladder : []
  const ladder = rawLadder.map((rung): string => {
    if (typeof rung === 'string') return rung
    if (typeof rung === 'object' && rung !== null) {
      const model = (rung as Record<string, unknown>).model
      if (typeof model === 'string') return model
    }
    return 'rung?'
  })
  const num = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined
  return {
    maxSteps: num(root.maxSteps),
    costBudgetUSD: num(root.costBudgetUSD),
    ladder,
    maxRung: num(controller.maxRung),
    stepsPerRung: num(controller.stepsPerRung) ?? DEFAULT_STEPS_PER_RUNG,
    escalateAfterFailures: num(controller.escalateAfterFailures) ?? DEFAULT_ESCALATE_AFTER_FAILURES,
    maxTokensPerStep: num(root.maxTokensPerStep) ?? DEFAULT_MAX_TOKENS_PER_STEP,
    // tools.ts owns the byte cap per tool; it is not on the spec today, so a
    // spec-level override is read if present and the tools.ts default if not.
    toolResultCapBytes: num(root.toolResultCapBytes) ?? DEFAULT_TOOL_RESULT_CAP_BYTES,
    // The router overrides ride runner/plugin options rather than LoopSpec, but
    // the spec is `unknown` here, so accept them wherever they were stashed.
    reviewBudget: num(root.reviewBudget) ?? DEFAULT_REVIEW_BUDGET,
    judgeThreshold: num(root.judgeThreshold) ?? DEFAULT_JUDGE_THRESHOLD,
  }
}

/* ------------------------------------------------------------------ *
 * The state string — the model's prompt.
 * ------------------------------------------------------------------ */

const sumOf = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0)

function meanOf(xs: readonly number[]): number | undefined {
  return xs.length === 0 ? undefined : sumOf(xs) / xs.length
}

function p95Of(xs: readonly number[]): number | undefined {
  if (xs.length === 0) return undefined
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
}

const isBookScore = (s: number): boolean => Number.isInteger(s) && s >= 0 && s <= 3

function usd(v: number): string {
  if (v === 0) return '$0.00'
  return Math.abs(v) < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`
}

function routeSummary(records: readonly RunRecord[]): string {
  const stepsByRoute = new Map<string, number>()
  for (const record of records) {
    for (const [route, usage] of Object.entries(record.byRoute)) {
      stepsByRoute.set(route, (stepsByRoute.get(route) ?? 0) + usage.steps)
    }
  }
  if (stepsByRoute.size === 0) return 'none recorded'
  return [...stepsByRoute.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([route, steps]) => `${route} (${String(steps)} steps)`)
    .join(', ')
}

function ceilingBoundRuns(records: readonly RunRecord[]): number {
  return records.filter(r => r.maxSteps > 0 && r.steps >= r.maxSteps).length
}

/**
 * Truncate the state until it fits the word bound — deliberately, not by luck.
 *
 * The cut takes BODY lines from their end (speed detail, signal kinds, route
 * listings) and never the last two lines: axis fractions and `worst axis` are
 * the conclusion this prompt exists to deliver, and a truncation that eats the
 * conclusion would leave a prompt confidently reporting everything is fine.
 * When even the header alone overflows, it is word-sliced with room reserved
 * for the conclusion and the marker — so a short prompt always says it was
 * truncated rather than masquerading as complete.
 */
function enforceWordLimit(state: string, limit: number): string {
  const marker = '… [state truncated to stay within the word limit]'
  const count = (s: string): number => s.split(/\s+/).filter(Boolean).length
  if (count(state) <= limit) return state
  const lines = state.split('\n')
  const tail = lines.length > 2 ? lines.splice(lines.length - 2, 2) : []
  const tailBlock = tail.join('\n')
  const joined = (head: string[]): string =>
    [head.join('\n'), tailBlock, marker].filter(part => part.length > 0).join('\n')
  while (lines.length > 1 && count(joined(lines)) > limit) lines.pop()
  let head = lines.join('\n')
  if (count(joined([head])) > limit) {
    const reserve = count([tailBlock, marker].filter(part => part.length > 0).join('\n'))
    head = head.split(/\s+/).filter(Boolean).slice(0, Math.max(1, limit - reserve)).join(' ')
  }
  return joined([head])
}

/**
 * Render the run history + spec as the judge's prompt: compact, token-bounded,
 * and stating which axis is worst.
 *
 * THIS IS A PROMPT, NOT A LOG. Nothing here is verbatim — no step text, no
 * signals' details — only derived counts, means, and fractions, because the
 * judge answers typed questions about aggregates and a prompt that leaks step
 * content would both bloat the window and invite the model to opine on prose
 * it was never given. Every section is emitted even when empty (explicit
 * `none recorded` lines): that is deliberate padding, because a section a
 * short history silently omits reads to the model as "no problem here".
 *
 * The bound is {@link OPTIMIZER_STATE_WORD_LIMIT} words, enforced by dropping
 * tail lines — see `enforceWordLimit`.
 *
 * @param records - completed runs, the substrate.
 * @param spec - the loop spec as configured, read defensively.
 * @returns the state string for `Judge.score`.
 */
export function buildOptimizerState(records: readonly RunRecord[], spec: unknown): string {
  const view = readSpec(spec)
  const n = records.length
  const lines: string[] = []

  lines.push(
    `dsh-feature-loop optimizer state — a PROMPT for the judge, not a log: `
    + `derived numbers only, no verbatim steps; word limit ${String(OPTIMIZER_STATE_WORD_LIMIT)}.`,
  )

  const fingerprints = [...new Set(records.map(r => r.specFingerprint))].sort()
  lines.push(
    `spec: fingerprints ${fingerprints.length === 0 ? 'none recorded' : fingerprints.join(', ')}; `
    + `maxSteps ${view.maxSteps === undefined ? 'unset' : String(view.maxSteps)}; `
    + `budget ${view.costBudgetUSD === undefined ? 'unset' : usd(view.costBudgetUSD)}; `
    + `ladder ${view.ladder.length === 0 ? 'not configured' : view.ladder.join(' → ')}.`,
  )

  if (n === 0) {
    lines.push('runs: none recorded — every axis below is unknown, not calm.')
  } else {
    lines.push(`runs: ${String(n)}.`)
  }

  const outcomes = ['goal-met', 'budget-stop', 'model-stop', 'aborted', 'blocked', 'error'] as const
  lines.push(
    n === 0
      ? 'outcomes: none recorded.'
      : `outcomes: ${outcomes.map(o => `${o} ${String(records.filter(r => r.outcome === o).length)}`).join(', ')}.`,
  )

  // Cost. The unpriced line is loud on purpose: costUSD is an under-count the
  // moment a step was priced at zero, and the whole optimizer defers to it.
  const totalCost = sumOf(records.map(r => r.costUSD))
  const totalSteps = sumOf(records.map(r => r.steps))
  const unpricedSteps = sumOf(records.map(r => r.unpricedSteps))
  const unpricedRuns = records.filter(r => r.unpricedSteps > 0).length
  const budgeted = records.filter(r => r.budgetUSD > 0)
  const budgetUse = meanOf(budgeted.map(r => r.costUSD / r.budgetUSD))
  if (n === 0) {
    lines.push('cost: unknown (no runs recorded).')
  } else {
    lines.push(
      `cost: total ${usd(totalCost)}; per run ${usd(totalCost / n)}; `
      + `per step ${totalSteps > 0 ? usd(totalCost / totalSteps) : 'n/a (no steps)'}; `
      + `budget used ${budgetUse === undefined ? 'n/a (no budgets)' : `${(budgetUse * 100).toFixed(0)}%`}; `
      + `unpriced steps ${String(unpricedSteps)} in ${String(unpricedRuns)} run(s).`,
    )
    if (unpricedSteps > 0) {
      lines.push(
        'WARNING: unpriced steps mean costUSD under-counts — cost figures below are floors, '
        + 'and cost levers must be suppressed (runlog.ts: suppressed rather than believed).',
      )
    }
  }
  lines.push(`routes: ${routeSummary(records)}.`)

  lines.push(
    n === 0
      ? 'steps: unknown (no runs recorded).'
      : `steps: total ${String(totalSteps)}; mean ${(totalSteps / n).toFixed(1)}; `
        + `max ${String(Math.max(...records.map(r => r.steps)))}; `
        + `ended at the step ceiling ${String(ceilingBoundRuns(records))}/${String(n)} run(s).`,
  )

  // Judge scores. Out-of-range recorded values are EXCLUDED from the mean, the
  // same spirit as judge.ts's parseScore: a score outside 0–3 is not a score
  // this scale can express, and averaging it in would launder confusion.
  const scores = records.flatMap(r => r.judgeScores).filter(isBookScore)
  const excluded = records.flatMap(r => r.judgeScores).length - scores.length
  const quality = records.map(r => r.qualityScore).filter((q): q is number => q !== undefined && isBookScore(q))
  if (n === 0 || (scores.length === 0 && quality.length === 0)) {
    lines.push(`judge: no scores recorded${excluded > 0 ? ` (${String(excluded)} out-of-range excluded)` : ''}.`)
  } else {
    const hist = [0, 1, 2, 3].map(s => `${String(s)}:${String(scores.filter(x => x === s).length)}`).join(' ')
    const qualityMean = meanOf(quality)
    lines.push(
      `judge: ${String(scores.length)} scores; mean ${scores.length > 0 ? (sumOf(scores) / scores.length).toFixed(2) : 'n/a'}/3; `
      + `hist ${hist}; qualityScore mean ${qualityMean === undefined ? 'n/a' : `${qualityMean.toFixed(2)}/3`}; `
      + `out-of-range excluded ${String(excluded)}.`,
    )
  }

  // Signals, counted by severity and kind — the detectors' verdicts, aggregated.
  const allSignals = records.flatMap(r => r.signals)
  if (allSignals.length === 0) {
    lines.push('signals: none recorded.')
  } else {
    const bySeverity = (severity: string): number => allSignals.filter(s => s.severity === severity).length
    const byKind = new Map<string, number>()
    for (const signal of allSignals) byKind.set(signal.kind, (byKind.get(signal.kind) ?? 0) + 1)
    const kindSummary = [...byKind.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([kind, count]) => `${kind} ${String(count)}`)
      .join(', ')
    lines.push(
      `signals: ${String(allSignals.length)} total; critical ${String(bySeverity('critical'))}, `
      + `warning ${String(bySeverity('warning'))}, info ${String(bySeverity('info'))}; kinds: ${kindSummary}.`,
    )
  }

  // Speed. Reported as data; it is deliberately NOT an axis of the argmax below
  // (see the ponytail there: no denominator to normalise against).
  const latencies = records.flatMap(r => r.stepLatencyMs)
  const latencyMean = meanOf(latencies)
  const latencyP95 = p95Of(latencies)
  const roundTrips = records.filter(r => r.latencyKind === 'round-trip').length
  const models = n - roundTrips
  lines.push(
    n === 0 || latencyMean === undefined
      ? 'speed: no step latencies recorded.'
      : `speed: step latency mean ${String(Math.round(latencyMean))}ms, `
        + `p95 ${latencyP95 === undefined ? 'n/a' : `${String(Math.round(latencyP95))}ms`} `
        + `(round-trip ${String(roundTrips)} run(s), model ${String(models)}); `
        + `wall mean ${String(Math.round(meanOf(records.map(r => r.wallMs)) ?? 0))}ms.`,
  )

  // Which axis is worst — every fraction in [0, 1] so they are comparable.
  const fractions: { name: string; value: number }[] = []
  if (budgetUse !== undefined) fractions.push({ name: 'cost', value: budgetUse })
  const stepUse = meanOf(records.filter(r => r.maxSteps > 0).map(r => r.steps / r.maxSteps))
  if (stepUse !== undefined) fractions.push({ name: 'steps', value: stepUse })
  if (scores.length > 0) {
    fractions.push({ name: 'quality', value: 1 - Math.min(1, Math.max(0, sumOf(scores) / scores.length / 3)) })
  }
  if (n > 0) {
    fractions.push({
      name: 'signals',
      value: records.filter(r => r.signals.some(s => s.severity === 'critical')).length / n,
    })
  }
  // ponytail: speed is excluded from this argmax because it has no denominator —
  // a mean latency means nothing without a target. Ceiling: worst-axis selection
  // uses only fractions. Upgrade path: add a `latencyBudgetMs` to the spec and
  // fold speed in as mean/that budget.
  if (fractions.length === 0) {
    lines.push('axis fractions: none (no runs recorded).')
    lines.push('worst axis: unknown (no runs recorded).')
  } else {
    const worst = [...fractions].sort((a, b) => b.value - a.value)[0]!
    lines.push(`axis fractions: ${fractions.map(f => `${f.name} ${f.value.toFixed(2)}`).join(', ')}.`)
    lines.push(`worst axis: ${worst.name} (fraction ${worst.value.toFixed(2)}).`)
  }

  return enforceWordLimit(lines.join('\n'), OPTIMIZER_STATE_WORD_LIMIT)
}

/* ------------------------------------------------------------------ *
 * The battery — one typed question per lever.
 * ------------------------------------------------------------------ */

interface BatteryEntry {
  lever: Lever
  questionType: 'noul' | 'choice' | 'score'
  question: SystemOneQuestion
  /** Allowed labels, for `choice` entries only. */
  labels?: readonly string[]
}

/**
 * The fixed battery, in `Lever` order — this order is the deterministic tie
 * order for recommendations whose confidence is missing or equal.
 *
 * Fixed rather than generated because the judge cannot generate and should not
 * improvise: seven questions, seven dials, mapped once, here. Each rubric is
 * written so the answer's direction alone determines the config move, with a
 * level that means "leave it alone" so a healthy loop earns no advice.
 */
const BATTERY: readonly BatteryEntry[] = [
  {
    lever: 'ladder-rung',
    questionType: 'choice',
    labels: ['keep', 'downgrade', 'upgrade'],
    question: {
      type: 'choice',
      instructions:
        'Given these runs of a coding loop, should the cheap-first model ladder change? '
        + 'Choose downgrade when steps spend on a stronger tier than the work needs; '
        + 'upgrade when the cheap tier repeatedly fails or gets escalated past; '
        + 'keep when the routes already fit the work.',
      criteria: {
        keep: 'the cheap-first ladder already matches the work',
        downgrade: 'steps are landing on pricier rungs than the work needs',
        upgrade: 'the cheap rung is too weak: frequent failures or escalations',
      },
    },
  },
  {
    lever: 'max-tokens',
    questionType: 'score',
    question: {
      type: 'score',
      instructions:
        'How well-sized is each step\'s output against the per-step token cap?',
      criteria: {
        '0': 'outputs are cut off or empty at the current cap — the cap binds',
        '1': 'right-sized: outputs fill neither extreme',
        '2': 'wordy: outputs routinely exceed what the step needs',
        '3': 'bloated: most output tokens are waste',
      },
    },
  },
  {
    lever: 'prompt-cache',
    questionType: 'noul',
    question: {
      type: 'noul',
      instructions:
        'Is the prompt prefix stable across steps — the same system text and tool schemas '
        + 'before any per-step content, so a prompt cache would hit every step?',
      criteria: {
        yes: 'the fixed prefix is identical every step and caching would hit',
        no: 'per-step content comes before or interleaves with the fixed prefix',
      },
    },
  },
  {
    lever: 'step-ceiling',
    questionType: 'score',
    question: {
      type: 'score',
      instructions: 'How much do runs grind against the step ceiling?',
      criteria: {
        '0': 'runs finish well under the ceiling; it never binds',
        '1': 'runs occasionally reach the ceiling',
        '2': 'runs often stop at the ceiling with the goal unmet',
        '3': 'runs routinely run out of steps mid-fix while still making progress',
      },
    },
  },
  {
    lever: 'escalation',
    questionType: 'score',
    question: {
      type: 'score',
      instructions: 'How well-timed is escalation up the model ladder?',
      criteria: {
        '0': 'the loop climbs to expensive rungs almost immediately',
        '1': 'it climbs a little early',
        '2': 'escalation timing is right',
        '3': 'it grinds on a failing cheap rung long before climbing',
      },
    },
  },
  {
    lever: 'attention-budget',
    questionType: 'score',
    question: {
      type: 'score',
      instructions: 'How well does the attention budget match what a human would want to see?',
      criteria: {
        '0': 'far too many steps interrupt a human',
        '1': 'slightly chatty but close',
        '2': 'about right: the steps that matter surface',
        '3': 'serious problems reach nobody; the budget or threshold blocks them',
      },
    },
  },
  {
    lever: 'tool-result-size',
    questionType: 'score',
    question: {
      type: 'score',
      instructions: 'How much do oversized tool results crowd the context?',
      criteria: {
        '0': 'results fit comfortably; nothing truncates',
        '1': 'occasionally large, rarely worth capping',
        '2': 'large tool outputs regularly crowd the context',
        '3': 'the context is mostly tool output; a cap would help immediately',
      },
    },
  },
]

/* ------------------------------------------------------------------ *
 * Reading answers — defensively, fail toward no advice.
 * ------------------------------------------------------------------ */

/**
 * What a live gateway might hand back, on top of `Judge`'s declared contract.
 *
 * `JudgeResult` already carries `score`/`choice`/`probability`/`confidence`,
 * so a live engine's answers arrive typed. This wider shape stays because an
 * engine — or a scripted test judge — may ALSO nest the whole per-question
 * `answers` map the gateway returns (the battery asks one lever-named question
 * per call, and the gateway answers under that key); `readAnswer` prefers the
 * asked lever's entry and falls back to the flat fields.
 */
interface WideResult {
  score?: number
  error?: string
  probability?: number
  choice?: string
  confidence?: number
  answers?: Record<string, SystemOneAnswer>
}

function pickAnswerFields(wide: WideResult): SystemOneAnswer {
  const answer: SystemOneAnswer = {}
  if (wide.score !== undefined) answer.score = wide.score
  if (wide.probability !== undefined) answer.probability = wide.probability
  if (wide.choice !== undefined) answer.choice = wide.choice
  if (wide.confidence !== undefined) answer.confidence = wide.confidence
  return answer
}

function engineConfidence(answer: SystemOneAnswer): number | undefined {
  const c = answer.confidence
  return typeof c === 'number' && Number.isFinite(c) && c >= 0 && c <= 1 ? c : undefined
}

type ReadOutcome =
  | { answer: SystemOneAnswer; confidence: number | undefined }
  | { skip: string }

/**
 * Validate one raw result against the question we asked.
 *
 * The range checks are the fail-toward-no-advice rules made local: an
 * out-of-range `score` REJECTS the question (never clamped — judge.ts:
 * "clamping would turn a confused judge into a confident one"), an unknown
 * `choice` label and an out-of-domain `noul` probability are dropped the same
 * way. An `error` with no usable answer field drops the question but does not
 * abort the battery — except when EVERY question errors, which
 * `proposeOptimizations` reports as the judge being unavailable.
 */
function readAnswer(entry: BatteryEntry, result: JudgeResult): ReadOutcome {
  const wide = result as unknown as WideResult
  const candidate = wide.answers?.[entry.lever] ?? pickAnswerFields(wide)
  const hasField = candidate.score !== undefined || candidate.probability !== undefined
    || candidate.choice !== undefined
  if (!hasField) {
    return { skip: typeof wide.error === 'string' && wide.error.length > 0 ? `judge error: ${wide.error}` : 'judge returned no answer' }
  }
  switch (entry.questionType) {
    case 'score': {
      const s = candidate.score
      if (typeof s !== 'number' || !Number.isFinite(s)) return { skip: 'no numeric score in the answer' }
      if (s < 0 || s > 3) {
        // REJECT, not clamp. judge.ts's parseScore refused out-of-range values
        // for the same reason, stated there as: "silently clamping it would
        // turn a confused judge into a confident one." A 7 means the judge is
        // confused, and a confused judge's advice — rounded to a plausible 3 —
        // would be the worst advice in the file.
        return { skip: `score ${String(s)} is outside 0–3 — rejected, not clamped (see judge.ts parseScore)` }
      }
      // ROUND, not reject, inside the band. A live non-autoregressive engine
      // answers score questions with an expected level (0.89, 1.41…), not an
      // integer — rejecting every float would reject every real answer while
      // the scripted tests' integers sailed through. Rounding is NOT clamping:
      // the value already lies on the scale, and the nearest level is what the
      // rubric means by it. Verified live 2026-09-23: Laya's 0.89 → 1.
      const level = Math.round(s)
      return { answer: { ...candidate, score: level }, confidence: engineConfidence(candidate) }
    }
    case 'choice': {
      const labels = entry.labels ?? []
      if (typeof candidate.choice !== 'string' || !labels.includes(candidate.choice)) {
        return { skip: candidate.choice === undefined ? 'no choice in the answer' : `unknown choice label "${candidate.choice}"` }
      }
      return { answer: candidate, confidence: engineConfidence(candidate) }
    }
    case 'noul': {
      const p = candidate.probability
      if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) {
        return { skip: 'noul probability missing or outside [0, 1]' }
      }
      return { answer: candidate, confidence: engineConfidence(candidate) }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Answers → recommendations, one dial each.
 * ------------------------------------------------------------------ */

type ProposeOutcome = { recommendation: Recommendation } | { skip: string }

function makeRecommendation(
  entry: BatteryEntry,
  current: string,
  proposed: string,
  evidence: string,
  confidence: number | undefined,
): Recommendation {
  return {
    lever: entry.lever,
    current,
    proposed,
    evidence,
    questionType: entry.questionType,
    ...(confidence === undefined ? {} : { confidence }),
  }
}

function round3(v: number): number {
  return Number(v.toFixed(3))
}

/**
 * Map one validated answer to exactly one actionable recommendation, or to a
 * skip when the answer says nothing should change.
 *
 * "Nothing should change" is a real answer, not a failure: recommending `keep`
 * would be advice to do what the loop already does, so those questions are
 * dropped from the output (they are recorded as skips, which only surface in
 * `unavailable` when nothing at all was recommended). Every `proposed` string
 * names a field, flag, or default the loop already reads — never a dial that
 * does not exist.
 */
function proposeFor(
  entry: BatteryEntry,
  outcome: Extract<ReadOutcome, { answer: SystemOneAnswer }>,
  view: SpecView,
  records: readonly RunRecord[],
): ProposeOutcome {
  const { answer, confidence } = outcome
  const conf = confidence === undefined ? '' : `, confidence ${String(confidence)}`
  switch (entry.lever) {
    case 'ladder-rung': {
      const choice = answer.choice
      if (choice === undefined) return { skip: 'no choice in the answer' }
      const current = `ladder ${view.ladder.join(' → ') || 'not configured'}; routes used: ${routeSummary(records)}`
      const prefix = `choice question answered "${choice}"${conf}`
      if (choice === 'keep') return { skip: 'ladder already right-sized (choice: keep)' }
      if (view.ladder.length < 2) {
        return { skip: `single-rung ladder (${view.ladder[0] ?? 'none'}) — there is nothing to move to` }
      }
      if (choice === 'downgrade') {
        if (view.maxRung === 0) return { skip: 'already pinned to the cheap rung (controller.maxRung = 0)' }
        return {
          recommendation: makeRecommendation(
            entry,
            current,
            `pin controller.maxRung to 0 so every step stays on ${view.ladder[0]}`,
            `${prefix}; ladder: ${view.ladder.join(' → ')}`,
            confidence,
          ),
        }
      }
      // upgrade
      const top = view.ladder.length - 1
      const proposed = view.maxRung !== undefined && view.maxRung < top
        ? `raise controller.maxRung ${String(view.maxRung)} → ${String(top)} so the strong tier (${view.ladder[top]}) can be reached`
        : `start steps on ${view.ladder[1]} instead of ${view.ladder[0]} — reorder controller.ladder so the strong tier leads`
      return {
        recommendation: makeRecommendation(entry, current, proposed, `${prefix}; ladder: ${view.ladder.join(' → ')}`, confidence),
      }
    }
    case 'max-tokens': {
      const s = answer.score
      if (typeof s !== 'number') return { skip: 'no score in the answer' }
      const base = view.maxTokensPerStep
      const current = `per-step output cap: ${String(base)} (cli --max-tokens / runner maxTokensPerStep)`
      const prefix = `score question answered ${String(s)}/3${conf}`
      if (s === 1) return { skip: 'output cap right-sized (verbosity 1)' }
      const proposed = s === 0
        ? `raise the per-step cap ${String(base)} → ${String(base * 2)}`
        : `tighten ${s === 2 ? 'one band' : 'two bands'}: ${String(base)} → ${String(Math.max(1, Math.round(base / (s === 2 ? 2 : 4))))}`
      return {
        recommendation: makeRecommendation(entry, current, proposed, `${prefix}; rubric: 0 truncated … 3 bloated`, confidence),
      }
    }
    case 'prompt-cache': {
      const p = answer.probability
      if (typeof p !== 'number') return { skip: 'no probability in the answer' }
      const current = 'prompt prefix stability not tracked by the loop (rebuilt each step by the harness)'
      const prefix = `noul P(yes) = ${String(p)}${conf}`
      const proposed = p >= 0.5
        ? 'keep the fixed prefix (system text + tool schemas) first and enable prompt caching — it should hit every step'
        : 'reorder the prompt so fixed content precedes per-step content — interleaving defeats prefix caching'
      return {
        recommendation: makeRecommendation(entry, current, proposed, `${prefix}; ${p >= 0.5 ? 'prefix reads stable' : 'prefix reads unstable — reorder before caching'}`, confidence),
      }
    }
    case 'step-ceiling': {
      const s = answer.score
      if (typeof s !== 'number') return { skip: 'no score in the answer' }
      const prefix = `score question answered ${String(s)}/3${conf}`
      const evidence = `${prefix}; ${String(ceilingBoundRuns(records))}/${String(records.length)} recorded run(s) ended at the step ceiling`
      if (s === 1) return { skip: 'step ceiling about right (grinding 1)' }
      const base = view.maxSteps === undefined ? undefined : Math.round(view.maxSteps)
      if (base === undefined) return { skip: 'spec carries no maxSteps to move' }
      const delta = s === 0 ? -1 : s === 2 ? 1 : 2
      // ponytail: the band is hardcoded 3..10 wherever the spec's own ceiling
      // sits, so a spec above the band can be corrected downward past ±2.
      // Ceiling: the band is a constant, not configuration. Upgrade path: a
      // declared band on the spec once the book's ceiling rule is configurable.
      const next = Math.min(Math.max(base + delta, STEP_CEILING_BAND.min), STEP_CEILING_BAND.max)
      if (next === base) {
        return { skip: `already at the ${delta > 0 ? 'top' : 'bottom'} of the ${String(STEP_CEILING_BAND.min)}..${String(STEP_CEILING_BAND.max)} band` }
      }
      if (delta > 0 && next < base) {
        return { skip: `current maxSteps ${String(base)} sits above the band — the band cannot raise it further` }
      }
      return {
        recommendation: makeRecommendation(
          entry,
          `maxSteps=${String(base)}`,
          `maxSteps: ${String(base)} → ${String(next)} (stay in the ${String(STEP_CEILING_BAND.min)}..${String(STEP_CEILING_BAND.max)} band)`,
          evidence,
          confidence,
        ),
      }
    }
    case 'escalation': {
      const s = answer.score
      if (typeof s !== 'number') return { skip: 'no score in the answer' }
      const spr = view.stepsPerRung
      const eaf = view.escalateAfterFailures
      const current = `stepsPerRung=${String(spr)} (0 = never by count), escalateAfterFailures=${String(eaf)}`
      const prefix = `score question answered ${String(s)}/3${conf}`
      if (s === 2) return { skip: 'escalation timing right (score 2)' }
      if (s <= 1) {
        const proposed = `escalate later: controller.stepsPerRung ${String(spr)} → ${String(Math.max(spr, 2))}, controller.escalateAfterFailures ${String(eaf)} → ${String(eaf + 2)}`
        return { recommendation: makeRecommendation(entry, current, proposed, `${prefix}; climbing too eagerly costs real dollars per step`, confidence) }
      }
      const proposed = `escalate sooner: controller.escalateAfterFailures ${String(eaf)} → ${String(Math.max(1, eaf - 2))}`
      return { recommendation: makeRecommendation(entry, current, proposed, `${prefix}; grinding on a failing cheap rung burns steps`, confidence) }
    }
    case 'attention-budget': {
      const s = answer.score
      if (typeof s !== 'number') return { skip: 'no score in the answer' }
      const rb = view.reviewBudget
      const jt = view.judgeThreshold
      const meanFraction = meanOf(records.map(r => r.reviewFraction)) ?? 0
      const current = `reviewBudget=${String(round3(rb))} (default 0.1), judgeThreshold=${String(jt)} (default 2); runs surfaced ${(meanFraction * 100).toFixed(1)}% of steps on average`
      const prefix = `score question answered ${String(s)}/3${conf}`
      if (s === 2) return { skip: 'attention budget about right (score 2)' }
      if (s === 0) {
        const proposed = `tighten both: reviewBudget ${String(round3(rb))} → ${String(round3(rb / 2))}, judgeThreshold ${String(jt)} → ${String(Math.min(3, jt + 1))}`
        return { recommendation: makeRecommendation(entry, current, proposed, `${prefix}; interrupts exceed what a human would accept`, confidence) }
      }
      if (s === 1) {
        const proposed = `tighten the interrupt budget only: reviewBudget ${String(round3(rb))} → ${String(round3(rb / 2))}`
        return { recommendation: makeRecommendation(entry, current, proposed, `${prefix}; slightly chatty`, confidence) }
      }
      if (rb >= 1 && jt <= 0) return { skip: 'already as loose as the router allows' }
      const proposed = `loosen: reviewBudget ${String(round3(rb))} → ${String(round3(Math.min(1, rb * 2)))}, judgeThreshold ${String(jt)} → ${String(Math.max(0, jt - 1))}`
      return { recommendation: makeRecommendation(entry, current, proposed, `${prefix}; important steps are being rate-capped out of sight`, confidence) }
    }
    case 'tool-result-size': {
      const s = answer.score
      if (typeof s !== 'number') return { skip: 'no score in the answer' }
      const base = view.toolResultCapBytes
      const current = `tool output cap: ${String(base)} bytes per result (tools.ts DEFAULT_MAX_OUTPUT_BYTES / per-tool maxOutputBytes)`
      const prefix = `score question answered ${String(s)}/3${conf}`
      if (s <= 1) return { skip: 'tool results fit as-is (score ≤ 1)' }
      // ponytail: halving at 2 and fifthing at 3 are heuristic bands, chosen
      // because they are memorable, not measured. Ceiling: fixed factors of the
      // current cap. Upgrade path: derive the band from measured per-step
      // context occupancy once metrics expose token use per tool result.
      const bytes = s === 2 ? Math.round(base / 2) : Math.round(base / 5)
      const proposed = `cap tool results at ${String(bytes)} bytes (from ${String(base)}; per-tool maxOutputBytes)`
      return { recommendation: makeRecommendation(entry, current, proposed, `${prefix}; tools.ts caps each result at ${String(base)} bytes today`, confidence) }
    }
  }
}

/* ------------------------------------------------------------------ *
 * The entry point.
 * ------------------------------------------------------------------ */

/**
 * Duck-typed latch probe: `OnegwJudge` carries `disabledReason()` but the
 * `Judge` interface does not declare it, so we reach for it only if present.
 * Reading the latch before asking means a dead judge costs zero battery calls.
 */
function readLatch(judge: Judge): string | undefined {
  const probe = judge as { disabledReason?: unknown }
  if (typeof probe.disabledReason !== 'function') return undefined
  try {
    const reason = (probe.disabledReason as () => unknown)()
    return typeof reason === 'string' && reason.length > 0 ? `judge latched off: ${reason}` : undefined
  } catch {
    return undefined // a probe that throws tells us nothing — fall through and ask
  }
}

/**
 * Why the cost levers were suppressed, when any record reports an unpriced step.
 *
 * runlog.ts already owns the rule this enforces: non-zero `unpricedSteps` means
 * `costUSD` is an under-count, and "every cost number derived from it must be
 * suppressed rather than believed". `docs/PRD.md` §8 calls the un-metered spend
 * the largest correctness gap in the project; proposing ladder or token savings
 * off a meter reading zero is that gap wearing a recommendation hat.
 */
function unpricedSuppression(records: readonly RunRecord[]): string | undefined {
  const unpricedSteps = sumOf(records.map(r => r.unpricedSteps))
  if (unpricedSteps <= 0) return undefined
  const runs = records.filter(r => r.unpricedSteps > 0).length
  return (
    `cost levers (ladder-rung, max-tokens, tool-result-size) suppressed: `
    + `${String(unpricedSteps)} unpriced step(s) across ${String(runs)} run(s) were priced at zero because the adapter reported no usage, `
    + `so costUSD under-counts (runlog.ts: suppressed rather than believed) — `
    + `proposing savings off a zeroed meter is the failure docs/PRD.md §8 calls the largest correctness gap`
  )
}

/**
 * Ask the battery and turn the typed answers into recommendations.
 *
 * One judge call per question, in battery order — `Judge`'s declared contract
 * transports a single `{ score, error }`, so per-question calls are the only
 * shape that survives every implementation (`NO_JUDGE`, `OnegwJudge`,
 * `ChatJudge`, scripted tests) without inventing a batch method the interface
 * does not have. `ponytail:` ceiling is seven sequential round-trips per
 * optimization pass; upgrade path is one batched `/v1/systemone` call with all
 * questions once the gateway returns per-question `answers` on the declared
 * contract. Two more ceilings worth naming: `ChatJudge` keys its reply off a
 * `review_worthiness` question this battery does not ask, so it will report
 * every question as unanswered (fine — that fails toward no advice with a
 * reason); and calling the same `OnegwJudge` instance the attention router
 * uses can latch it off mid-run (fine for the router, which treats a latch as
 * detectors-only — but the upgrade path is a non-latching battery method on
 * `Judge` once Laya ships).
 *
 * Fail-offlow, in order: a latched judge or a throwing call returns
 * `{ recommendations: [], unavailable }` immediately (rule 1); the cost levers
 * are filtered out before they are even asked when the meter under-counts
 * (rule 5); each remaining question is validated on its own primitive, with
 * out-of-range scores rejected (rule 2) and `choice`/`noul` errors dropped
 * while the rest continue (rule 3); and the results are sorted by reported
 * confidence descending with the unconfident ones last and marked (rule 4).
 *
 * @param judge - the local judge; any `Judge` implementation, including `NO_JUDGE`.
 * @param records - completed runs to summarise into the state prompt.
 * @param spec - the loop spec as configured, read defensively.
 * @returns recommendations best-confidence first; `unavailable` explains any
 *          missing advice (judge outage, or suppressed cost levers).
 */
export async function proposeOptimizations(
  judge: Judge,
  records: readonly RunRecord[],
  spec: unknown,
): Promise<{ recommendations: Recommendation[]; unavailable?: string }> {
  const state = buildOptimizerState(records, spec)
  const view = readSpec(spec)

  // Rule 1: a latched judge answers nothing — say so, ask nothing.
  const latched = readLatch(judge)
  if (latched !== undefined) return { recommendations: [], unavailable: latched }

  // Rule 5: suppress cost levers BEFORE asking — a question whose answer we
  // would discard is a round-trip spent proving we cannot trust it anyway.
  const suppression = unpricedSuppression(records)
  const entries = BATTERY.filter(entry => suppression === undefined || !COST_LEVERS.has(entry.lever))

  const recommendations: Recommendation[] = []
  const skips: { lever: Lever; detail: string }[] = []

  for (const entry of entries) {
    let result: JudgeResult
    try {
      result = await judge.score(state, { [entry.lever]: entry.question })
    } catch (error) {
      // Rule 1: a throwing judge is an outage, not a partial answer — the
      // whole battery fails toward "no advice" rather than guessing.
      return { recommendations: [], unavailable: `judge threw: ${error instanceof Error ? error.message : String(error)}` }
    }
    const outcome = readAnswer(entry, result)
    if ('skip' in outcome) {
      skips.push({ lever: entry.lever, detail: outcome.skip })
      continue
    }
    const proposed = proposeFor(entry, outcome, view, records)
    if ('skip' in proposed) {
      skips.push({ lever: entry.lever, detail: proposed.skip })
      continue
    }
    recommendations.push(proposed.recommendation)
  }

  // Rule 4: no reported confidence sorts to the END and says why. Absent
  // confidence is not zero confidence — zero would be a claim; absence is a
  // gap, and a gap in evidence must read as a gap in evidence.
  for (const rec of recommendations) {
    if (rec.confidence === undefined) {
      rec.evidence = `${rec.evidence} — low confidence: the engine reported none`
    }
  }
  recommendations.sort((a, b) => (b.confidence ?? Number.NEGATIVE_INFINITY) - (a.confidence ?? Number.NEGATIVE_INFINITY))

  const parts: string[] = []
  if (recommendations.length === 0 && skips.length > 0) {
    const details = [...new Set(skips.map(s => s.detail))]
    parts.push(details.length === 1
      ? `all ${String(skips.length)} asked questions reported: ${details[0]}`
      : `no usable answers: ${skips.map(s => `${s.lever}: ${s.detail}`).join('; ')}`)
  }
  if (suppression !== undefined) parts.push(suppression)
  return parts.length > 0 ? { recommendations, unavailable: parts.join(' | ') } : { recommendations }
}
