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

/**
 * The optimization block: refinement knobs that sit *beside* the spec, not
 * inside it.
 *
 * Deliberately separate from {@link LoopSpec}: the eight dimensions describe
 * ONE run — what done means, what it may cost — while `optimize` describes
 * what happens *across* runs (re-running a task with feedback from the last
 * attempt). Folding it into the spec would make every existing valid spec
 * incomplete overnight, which would be a breaking config change for a feature
 * most deployments never turn on. An absent block must change nothing.
 */
export interface OptimizeConfig {
  /**
   * Refinement passes over one task, an integer in {@link LOOPS_RANGE}.
   *
   * The band is enforced at load, not at run time: below 3 a "trend" across
   * passes is two samples, and above 10 the refinement bill and wall-clock
   * dwarf the single run being improved — at that point the task wants a
   * rethink, not another pass. Validating early means a typo like `30` stops
   * the plugin from loading instead of quietly launching a runaway loop.
   */
  loops?: number
  /** Derive an envelope (step/cost expectations) from history before running. */
  derive?: boolean
  /** Run-history file the envelope and metrics are derived from. */
  history?: string
  /** Which judge scores artifacts across passes. `none` disables scoring. */
  judge?: 'none' | 'chat' | 'laya'
  /** Dollars the whole refinement (all passes) may spend, per task. */
  totalBudgetUSD?: number
}

/** The accepted band for `optimize.loops` — one source of truth for config and CLI. */
export const LOOPS_RANGE = { min: 3, max: 10 } as const

/**
 * Validate one `loops` count against {@link LOOPS_RANGE}.
 *
 * Shared by the config loader and the CLI flag so the two can never drift
 * apart: a band enforced in two places is a band that will eventually be
 * enforced in only one of them.
 *
 * @param value - the candidate count, as parsed.
 * @param field - the field name for the error message (`optimize.loops` from
 *   the config path, `--loops` from argv), so the reader knows where to fix it.
 * @returns the same value, for chaining.
 * @throws TypeError naming the field and the accepted band — the fail-at-load
 *   rule `validateSpec` and `parseDashboardConfig` already follow.
 */
export function parseLoops(value: number, field: string): number {
  if (!Number.isInteger(value) || value < LOOPS_RANGE.min || value > LOOPS_RANGE.max) {
    throw new TypeError(
      `${field} must be an integer in [${String(LOOPS_RANGE.min)}, ${String(LOOPS_RANGE.max)}], `
      + `received ${String(value)} — see optimize.loops in the config catalog for the accepted band`,
    )
  }
  return value
}

/**
 * Validate the `optimize` block, naming the first bad field.
 *
 * Mirrors `parseDashboardConfig` exactly: a `TypeError` whose message starts
 * with the field path, thrown even for fields nobody is using yet. A typo in
 * `judge` must stop the plugin from loading the day someone enables the block,
 * never surface as an unexplained no-op mid-run.
 *
 * @param config - the raw `optimize:` value from the patch row; absent means
 *   today's behaviour, exactly.
 * @returns the same block, for chaining.
 * @throws TypeError naming the first bad field.
 */
export function parseOptimizeConfig(config: OptimizeConfig = {}): OptimizeConfig {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new TypeError(`optimize must be a mapping of options, received ${JSON.stringify(config)}`)
  }
  if (config.loops !== undefined) parseLoops(config.loops, 'optimize.loops')
  if (config.derive !== undefined && typeof config.derive !== 'boolean') {
    throw new TypeError(`optimize.derive must be true or false, received ${JSON.stringify(config.derive)}`)
  }
  if (config.history !== undefined && (typeof config.history !== 'string' || config.history.trim() === '')) {
    throw new TypeError(`optimize.history must be a non-empty path string, received ${JSON.stringify(config.history)}`)
  }
  if (config.judge !== undefined && config.judge !== 'none' && config.judge !== 'chat' && config.judge !== 'laya') {
    throw new TypeError(
      `optimize.judge must be "none", "chat" or "laya", received ${JSON.stringify(config.judge)}`,
    )
  }
  if (config.totalBudgetUSD !== undefined
    && (!Number.isFinite(config.totalBudgetUSD) || config.totalBudgetUSD <= 0)) {
    throw new TypeError(
      `optimize.totalBudgetUSD must be > 0, received ${String(config.totalBudgetUSD)} — `
      + 'an unlimited refinement budget is not a budget',
    )
  }
  return config
}

/**
 * The `pipeline:` block — the 0→1 run's own configuration.
 *
 * Separate from the eight-dimension {@link LoopSpec} on purpose. A `LoopSpec`
 * describes *a loop*; this describes *a sequence of loops*. They answer different
 * questions and they scale differently — raising a phase's ceiling must never
 * silently raise the run's, which is the whole point of App B #82's rule that a
 * planning overrun is solved by simplifying the plan rather than stealing from
 * execution (p296).
 *
 * Every field is optional, and an absent block means "policies off", exactly as
 * an absent `spec` does today. That keeps the block safe to ship in a patch row
 * before anyone has decided on a budget.
 */
export interface PipelineConfig {
  /** Turn the five-phase pipeline on. Omitted means a plain bounded loop, as today. */
  enabled?: boolean
  /** Where run artifacts land, relative to the workspace root. Defaults to `.feature-loop/runs`. */
  runsDir?: string
  /** The project's test command, whose exit 0 is the test phase's exit gate. No default. */
  testCommand?: string
  /** Per-phase step ceilings, by phase name. Falls back to a share of `spec.maxSteps`. */
  phaseMaxSteps?: Partial<Record<string, number>>
  /**
   * Per-phase spend ceilings in USD, as absolute amounts rather than shares.
   *
   * Absolute on purpose: the shares in `PIPELINE_BUDGET` are proportions of a
   * ceiling the operator already accepted, so multiplying them out keeps the two
   * from drifting when the run budget changes.
   */
  phaseMaxSpendUSD?: Partial<Record<string, number>>
  /**
   * Wall-clock ceiling per phase, in ms. The book's Timeout Guard is independent
   * of step count on purpose: a loop that is making calls can outrun a step
   * ceiling by spending its ceiling slowly.
   */
  phaseTimeoutMs?: number
  /** Wall-clock ceiling for the whole run, in ms. */
  timeoutMs?: number
}

/** The default run-artifact directory, relative to the workspace root. */
export const DEFAULT_RUNS_DIR = '.feature-loop/runs'

/** Every phase name the config may key, in order. One source of truth for the loader's error messages. */
export const PIPELINE_PHASE_NAMES = ['research', 'prd', 'implement', 'test', 'ship'] as const

/**
 * Validate the `pipeline:` block, naming the first bad field.
 *
 * Same rule as `parseOptimizeConfig` and `parseDashboardConfig`: a `TypeError`
 * whose message starts with the field path, thrown at load so a typo never
 * becomes a mid-run no-op. The two rules it enforces beyond types are both about
 * ceilings, because an unbounded pipeline is the failure the whole package
 * exists to prevent and the cheapest moment to catch it is before the first step.
 *
 * @param config - the raw `pipeline:` value from the patch row.
 * @returns the same block, for chaining.
 * @throws TypeError naming the first bad field.
 */
export function parsePipelineConfig(config: PipelineConfig = {}): PipelineConfig {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new TypeError(`pipeline must be a mapping of options, received ${JSON.stringify(config)}`)
  }
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
    throw new TypeError(`pipeline.enabled must be true or false, received ${JSON.stringify(config.enabled)}`)
  }
  if (config.runsDir !== undefined && (typeof config.runsDir !== 'string' || config.runsDir.trim() === '')) {
    throw new TypeError(`pipeline.runsDir must be a non-empty path string, received ${JSON.stringify(config.runsDir)}`)
  }
  if (config.testCommand !== undefined && (typeof config.testCommand !== 'string' || config.testCommand.trim() === '')) {
    throw new TypeError(
      `pipeline.testCommand must be a non-empty command string, received ${JSON.stringify(config.testCommand)} — `
      + 'without it the test phase cannot pass its own exit gate',
    )
  }
  const finitePositive = (value: number, field: string): void => {
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(`${field} must be > 0, received ${String(value)} — an unlimited phase budget is not a budget`)
    }
  }
  for (const [field, value] of Object.entries({
    ...config.phaseMaxSteps ?? {},
  })) {
    if (!PIPELINE_PHASE_NAMES.includes(field as (typeof PIPELINE_PHASE_NAMES)[number])) {
      throw new TypeError(
        `pipeline.phaseMaxSteps has an unknown phase "${field}" — expected one of ${PIPELINE_PHASE_NAMES.join(', ')}`,
      )
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      throw new TypeError(`pipeline.phaseMaxSteps.${field} must be an integer >= 1, received ${JSON.stringify(value)}`)
    }
  }
  for (const [field, value] of Object.entries({ ...config.phaseMaxSpendUSD ?? {} })) {
    if (!PIPELINE_PHASE_NAMES.includes(field as (typeof PIPELINE_PHASE_NAMES)[number])) {
      throw new TypeError(
        `pipeline.phaseMaxSpendUSD has an unknown phase "${field}" — expected one of ${PIPELINE_PHASE_NAMES.join(', ')}`,
      )
    }
    if (typeof value !== 'number') {
      throw new TypeError(`pipeline.phaseMaxSpendUSD.${field} must be a number, received ${JSON.stringify(value)}`)
    }
    finitePositive(value, `pipeline.phaseMaxSpendUSD.${field}`)
  }
  for (const [name, value] of [
    ['timeoutMs', config.timeoutMs],
    ['phaseTimeoutMs', config.phaseTimeoutMs],
  ] as const) {
    if (value === undefined) continue
    if (typeof value !== 'number') {
      throw new TypeError(`pipeline.${name} must be a number, received ${JSON.stringify(value)}`)
    }
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(
        `pipeline.${name} must be > 0, received ${String(value)} — a run with no wall-clock ceiling is a loop that `
        + 'only stops when the money does',
      )
    }
  }
  return config
}
