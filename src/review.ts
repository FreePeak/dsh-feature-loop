/**
 * The review gate and the attention router.
 *
 * Two questions, deliberately kept apart:
 *
 * 1. **May this action proceed?** — `ReviewGate`, the book's `ApprovalGate`:
 *    tiered by *reversibility*, and fail-closed for any action it has no policy
 *    for. This is a safety boundary and it is not rate-limited, not sampled, and
 *    not up to a model.
 * 2. **Is this step worth a human's attention?** — `AttentionRouter`: the book's
 *    "<10% of actions that should interrupt a human". This *is* a judgement call,
 *    so it is where the local model earns its place, and it is explicitly
 *    budgeted so a chatty judge cannot turn your loop into a chat app.
 *
 * The split is the whole design. A gate that asks a model for permission is not
 * a gate; a router that only fires on arithmetic cannot tell a productive
 * unusual step from a stuck one. Each does what it is actually good at.
 *
 * @module dsh-feature-loop/review
 */

import type { Reversibility } from './spec.ts'
import type { ReviewSignal } from './signals.ts'
import { mustReview } from './signals.ts'

/**
 * What happens to an action of a given reversibility class, before any model or
 * router is consulted. Mirrors the book's `POLICIES` table.
 */
export type GatePolicy =
  /** Proceed without asking. */
  | 'auto'
  /** Proceed when the confidence estimate clears the threshold. */
  | 'auto-if-confident'
  /** Always stop for a human, whatever the confidence. */
  | 'always-approve'

/** The book's default policy table, keyed by reversibility rather than action name. */
export const DEFAULT_GATE_POLICIES: Record<Reversibility, GatePolicy> = {
  read: 'auto',
  'reversible-write': 'auto-if-confident',
  irreversible: 'always-approve',
}

/** Why the router decided what it decided. */
export type ReviewSource =
  /** A critical signal fired. Never suppressed, never rate-limited. */
  | 'signal'
  /** The reversibility policy demanded a human. */
  | 'policy'
  /** The local judge scored this step above the threshold. */
  | 'judge'
  /** The operator asked for this step. */
  | 'operator'
  /** The review budget was exhausted, so a non-critical signal was deferred. */
  | 'rate-capped'

/** One routing outcome. */
export interface ReviewDecision {
  /** Whether a human should look before the loop continues. */
  review: boolean
  source: ReviewSource
  /** One line explaining the decision, for the transcript. */
  reason: string
}

/** Router configuration. */
export interface RouterConfig {
  /** Confidence at or above which `auto-if-confident` proceeds. */
  confidenceThreshold: number
  /**
   * The local judge's score at or above which a step is surfaced. On the book's
   * 0–3 ordinal scale, 2 means "worth a look".
   */
  judgeThreshold: number
  /**
   * Fraction of steps that may be surfaced for review — the book's <10%. Not a
   * hard cap on *critical* signals, which always surface: this budgets your
   * attention, not the loop's safety.
   */
  reviewBudget: number
}

/** The book's defaults. */
export const DEFAULT_ROUTER: RouterConfig = {
  confidenceThreshold: 0.7,
  judgeThreshold: 2,
  reviewBudget: 0.1,
}

/**
 * The safety boundary. Tiered by reversibility, fail-closed on the unknown.
 *
 * The fail-closed default is the book's own (`POLICIES.get(action.type,
 * "always_approve")`) and it is the right one for a reason worth stating: a
 * gate that defaults to *open* fails only in the direction that matters, and it
 * fails silently, on the one tool nobody remembered to classify.
 */
export class ReviewGate {
  private readonly policies: Record<string, GatePolicy>
  private readonly defaults: Record<Reversibility, GatePolicy>
  private readonly confidenceThreshold: number

  /**
   * @param policies - per-tool policy overrides, by tool name.
   * @param defaults - policy by reversibility class, for tools with no override.
   * @param confidenceThreshold - the bar for `auto-if-confident`.
   */
  constructor(
    policies: Record<string, GatePolicy> = {},
    defaults: Record<Reversibility, GatePolicy> = DEFAULT_GATE_POLICIES,
    confidenceThreshold = DEFAULT_ROUTER.confidenceThreshold,
  ) {
    this.policies = policies
    this.defaults = defaults
    this.confidenceThreshold = confidenceThreshold
  }

  /**
   * Decide whether one action may proceed.
   *
   * @param tool - the tool about to run.
   * @param reversibility - its class from the spec's `actuator`.
   * @param confidence - the judge's confidence, when one was consulted.
   * @returns the decision, with the policy that produced it.
   */
  check(tool: string, reversibility: Reversibility, confidence?: number): ReviewDecision {
    // An unclassified tool is treated as the most dangerous class. This is the
    // fail-closed direction: forgetting to classify a tool must not be the way
    // it gets to run unsupervised.
    const policy = this.policies[tool] ?? this.defaults[reversibility] ?? 'always-approve'
    if (policy === 'auto') {
      return { review: false, source: 'policy', reason: `${tool}: auto (${reversibility})` }
    }
    if (policy === 'auto-if-confident') {
      if (confidence === undefined) {
        return {
          review: true,
          source: 'policy',
          reason: `${tool}: ${reversibility} needs a confidence estimate and none was available — asking rather than guessing`,
        }
      }
      if (confidence >= this.confidenceThreshold) {
        return {
          review: false,
          source: 'policy',
          reason: `${tool}: ${reversibility} cleared the confidence bar (${confidence.toFixed(2)} >= ${this.confidenceThreshold.toFixed(2)})`,
        }
      }
      return {
        review: true,
        source: 'policy',
        reason: `${tool}: ${reversibility} below the confidence bar (${confidence.toFixed(2)} < ${this.confidenceThreshold.toFixed(2)})`,
      }
    }
    return {
      review: true,
      source: 'policy',
      reason: `${tool}: ${reversibility} is always approved by a human`,
    }
  }
}

/**
 * Decides which steps are worth your eyes, under a budget.
 *
 * The order below is the whole policy, and it is ordered by what must not be
 * lost: safety first (critical signals and `always-approve` actions are never
 * rate-limited), then the judge, then the budget.
 */
export class AttentionRouter {
  private readonly config: RouterConfig
  private stepsSeen = 0
  private reviewsRequested = 0

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = { ...DEFAULT_ROUTER, ...config }
    if (this.config.reviewBudget <= 0 || this.config.reviewBudget > 1) {
      throw new Error(
        `dsh-feature-loop: reviewBudget must be in (0, 1], received ${String(this.config.reviewBudget)}`,
      )
    }
  }

  /** Record that a step completed, for the rate budget's denominator. */
  observeStep(): void {
    this.stepsSeen += 1
  }

  /** The operator asked to see this step — always honoured, and counted. */
  operatorRequest(step: number): ReviewDecision {
    this.reviewsRequested += 1
    return { review: true, source: 'operator', reason: `you asked to review step ${String(step)}` }
  }

  /**
   * Route one step.
   *
   * @param signals - everything the detectors found for this step.
   * @param gate - the safety gate's decision for the action about to run, if any.
   * @param judgeScore - the local judge's 0–3 review-worthiness score, if it ran.
   * @returns the decision, naming what produced it.
   */
  route(signals: readonly ReviewSignal[], gate?: ReviewDecision, judgeScore?: number): ReviewDecision {
    // 1. Safety. A critical signal and a policy hold are not subject to the
    //    attention budget — they are the reasons the budget can be small.
    if (mustReview(signals)) {
      const worst = signals.find(s => s.severity === 'critical')!
      this.reviewsRequested += 1
      return { review: true, source: 'signal', reason: worst.detail }
    }
    if (gate?.review === true) {
      this.reviewsRequested += 1
      return gate
    }

    // 2. The judge. Only reached when nothing deterministic already decided.
    if (judgeScore !== undefined && judgeScore >= this.config.judgeThreshold) {
      if (this.budgetRemaining()) {
        this.reviewsRequested += 1
        return {
          review: true,
          source: 'judge',
          reason: `the local judge scored this step ${judgeScore.toFixed(1)}/3 — worth a look`,
        }
      }
      return {
        review: false,
        source: 'rate-capped',
        reason: `judge scored ${judgeScore.toFixed(1)} but the ${(this.config.reviewBudget * 100).toFixed(0)}% review budget is spent`,
      }
    }

    // 3. Nothing fired.
    const warnings = signals.filter(s => s.severity === 'warning')
    if (warnings.length > 0) {
      return { review: false, source: 'signal', reason: `${String(warnings.length)} warning(s), below the review bar` }
    }
    return { review: false, source: 'policy', reason: 'no signal, judge scored below the bar' }
  }

  /** Whether the review budget still has room. */
  budgetRemaining(): boolean {
    if (this.stepsSeen === 0) return true
    return this.reviewsRequested / this.stepsSeen < this.config.reviewBudget
  }

  /** How much of the attention budget has been spent, for the run summary. */
  stats(): { steps: number; reviews: number; fraction: number } {
    return {
      steps: this.stepsSeen,
      reviews: this.reviewsRequested,
      fraction: this.stepsSeen === 0 ? 0 : this.reviewsRequested / this.stepsSeen,
    }
  }
}

/**
 * The question to ask the local judge about one step.
 *
 * Phrased as a `score` on the book's 0–3 ordinal scale rather than as free text:
 * the judge is a non-autoregressive decision engine (Laya), and asking it to
 * write a paragraph would be both slower and worse than asking it for a level.
 *
 * @param stepSummary - the step's tool, arguments preview, and outcome.
 * @param signals - what the detectors already found.
 * @returns the `state` and `questions` for `POST /v1/systemone`.
 */
export function judgeQuestion(
  stepSummary: string,
  signals: readonly ReviewSignal[],
): { state: string, questions: Record<string, { type: 'score', instructions: string, criteria: string[] }> } {
  const state = [
    `Step: ${stepSummary}`,
    signals.length === 0 ? 'Detectors: none fired.' : `Detectors: ${signals.map(s => `${s.kind} (${s.severity})`).join(', ')}.`,
  ].join('\n')
  return {
    state,
    questions: {
      review_worthiness: {
        type: 'score',
        instructions:
          'How much does this step deserve a human review before the agent continues? '
          + 'Score high when the step is irreversible, when it contradicts the stated goal, or when '
          + 'the detectors fired; score low when the step is routine, reversible, and consistent with the goal.',
        // Ordered array — Laya/Jev keep the labels as the legend; a map would
        // lose order and label the legend with the map keys instead.
        criteria: [
          'routine, reversible, no detector fired',
          'slightly unusual but clearly consistent with the goal',
          'worth a look: ambiguous, or a detector fired',
          'stop: irreversible, or contradicts the goal',
        ],
      },
    },
  }
}
