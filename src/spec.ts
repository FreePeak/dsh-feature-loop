/**
 * The loop spec: the book's 8 dimensions, as the plugin's config surface.
 *
 * "Before writing any code: the 8-dimension loop spec" — Goal, Sensor,
 * Controller, Actuator, Feedback, Termination, Max steps, Cost budget. The
 * point of naming all eight up front is that a loop missing one of them fails
 * in a way that looks like a model problem and is actually a spec problem: no
 * `termination` is an infinite loop, no `feedback` is a loop that cannot tell
 * success from grinding, no `cost budget` is an unbounded bill.
 *
 * So the spec is not documentation here — it is the required config. You cannot
 * start this loop without answering all eight, because the eight answers are
 * what the loop reads at runtime.
 *
 * @module dsh-feature-loop/spec
 */

import type { ModelPrice } from './budget.ts'

/** One phase the loop can run: the MVP ships `bugfix` and `feature`. */
export type PhaseName = 'bugfix' | 'feature' | 'refactor'

/** How a tool may be used, which is what decides whether it needs a gate. */
export type Reversibility = 'read' | 'reversible-write' | 'irreversible'

/** Which model tier serves a step type. */
export interface ControllerSpec {
  /**
   * The cheap-first ladder. Index 0 is the tier every step starts on; the loop
   * escalates only on evidence (step count, consecutive failures, per-step
   * cost) — never on vibes.
   */
  ladder: { provider?: string; model: string; reasoningEffort?: string; maxCostUSDPerStep?: number }[]
  /** Steps to spend on each rung before escalating. */
  stepsPerRung?: number
  /** Consecutive failures on a rung before escalating. */
  escalateAfterFailures?: number
  /** Hard cap on the rung, to pin a small task to the cheap tier. */
  maxRung?: number
}

/** What "done" means, and what stops the loop besides success. */
export interface TerminationSpec {
  /**
   * The success condition, stated observably — a command whose exit code is the
   * answer, not a description of a feeling. The loop may claim `goal_met` only
   * when this is true, which is what separates success from stopping.
   */
  successCommand?: string
  /** Guard conditions that end the run without success, beyond the budget. */
  guards?: ('no-progress' | 'error-cascade' | 'tool-cycle' | 'tool-dominance')[]
}

/** The eight dimensions. All eight are required; that is the point. */
export interface LoopSpec {
  /** 1 · Goal — what "done" means, observably. */
  goal: string
  /** 2 · Sensor — what the loop reads. Advisory: names for the console and the prompt. */
  sensor: string[]
  /** 3 · Controller — which model, at which tier. */
  controller: ControllerSpec
  /** 4 · Actuator — which tools it may call, and how dangerous each one is. */
  actuator: Record<string, Reversibility>
  /** 5 · Feedback — the rubric or metric that scores each step. */
  feedback: string
  /** 6 · Termination — success condition and guard conditions. */
  termination: TerminationSpec
  /** 7 · Max steps — P95 completion from staging × 1.3. */
  maxSteps: number
  /** 8 · Cost budget — the number you are willing to lose on one run. */
  costBudgetUSD: number
  /**
   * 8b · Prices. The cost budget is not enforceable without them: a budget
   * measured against an unknown price is a budget that silently reads zero.
   * Keyed by `provider/model`.
   */
  prices?: Readonly<Record<string, ModelPrice>>
  /**
   * 8c · The price for a route the table does not know. Omitted means an unknown
   * route is a hard error — the safe default, because a loop that silently
   * prices an unknown model at zero is a loop with no ceiling.
   */
  unpricedFallback?: ModelPrice
}

/** Thrown when the spec is incomplete or self-contradictory. */
export class IncompleteSpecError extends Error {
  readonly problems: string[]

  constructor(problems: string[]) {
    super(`dsh-feature-loop: incomplete loop spec:\n  - ${problems.join('\n  - ')}`)
    this.name = 'IncompleteSpecError'
    this.problems = problems
  }
}

/**
 * Validate the eight dimensions.
 *
 * Deliberately strict and deliberately at load time: the book's whole argument
 * for naming the spec first is that a missing dimension is invisible until it
 * has already cost money. A loop that starts without a cost budget cannot be
 * given one retroactively — the money is spent.
 *
 * @param spec - the candidate spec, as configured.
 * @returns the same spec, for chaining.
 * @throws IncompleteSpecError listing every problem at once, not just the first.
 */
export function validateSpec(spec: LoopSpec): LoopSpec {
  const problems: string[] = []
  const blank = (s: string | undefined): boolean => s === undefined || s.trim().length === 0

  if (blank(spec.goal)) problems.push('goal is empty — "done" must be observable before the loop starts')
  if (spec.sensor.length === 0) problems.push('sensor is empty — name what the loop reads')
  if (blank(spec.feedback)) {
    problems.push('feedback is empty — without a rubric the loop cannot tell success from grinding')
  }
  if (spec.controller.ladder.length === 0) {
    problems.push('controller.ladder is empty — declare at least one route')
  }
  if (Object.keys(spec.actuator).length === 0) {
    problems.push('actuator is empty — a loop with no tools cannot act; declare the tool surface')
  }
  if (blank(spec.termination.successCommand) && (spec.termination.guards ?? []).length === 0) {
    problems.push(
      'termination has neither a successCommand nor guards — a loop with no termination is an infinite loop',
    )
  }
  if (!Number.isInteger(spec.maxSteps) || spec.maxSteps < 1) {
    problems.push(`maxSteps must be a positive integer, received ${String(spec.maxSteps)}`)
  }
  if (!Number.isFinite(spec.costBudgetUSD) || spec.costBudgetUSD <= 0) {
    problems.push(
      `costBudgetUSD must be > 0, received ${String(spec.costBudgetUSD)} — `
      + 'an unbounded budget is the failure the book writes the chapter about',
    )
  }

  const dangerous = Object.entries(spec.actuator).filter(([, r]) => r === 'irreversible')
  if (dangerous.length > 0 && (spec.termination.guards ?? []).length === 0) {
    // Not fatal, but the combination is worth saying out loud: irreversible
    // tools with no guards means the only thing between you and a bad write is
    // the approval gate, which is a real gate — but it is one gate, not two.
    problems.push(
      `irreversible tools (${dangerous.map(([t]) => t).join(', ')}) with no termination guards — `
      + 'the approval gate is then the only containment; add a guard or accept that',
    )
  }

  if (problems.length > 0) throw new IncompleteSpecError(problems)
  return spec
}

/**
 * Steps and dollars this spec implies, as one line for the run log. The book's
 * creed is "cost is a first-class architectural constraint", which only holds
 * if the constraint is printed where a human will see it.
 *
 * @param spec - a validated spec.
 * @returns a one-line account of the run's envelope.
 */
export function describeEnvelope(spec: LoopSpec): string {
  const rungs = spec.controller.ladder.map(r => r.model).join(' → ')
  return `<= ${String(spec.maxSteps)} steps, <= $${spec.costBudgetUSD.toFixed(2)}, routes ${rungs}`
}
