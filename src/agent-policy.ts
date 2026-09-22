/**
 * The plugin agent's policy decisions, extracted so they can be tested.
 *
 * `agent.ts` is a vendored fork and inherits upstream's constructor parameter
 * properties, which Node's `--experimental-strip-types` rejects outright. So the
 * agent cannot be imported by a test, and any branching logic left inside it is
 * branching logic nothing ever checks.
 *
 * These functions are that logic — small, pure, dependency-free — so the plugin
 * path and the standalone runner can be held to the same behaviour by the same
 * kind of test. `agent.ts` calls them; the tests call them; neither has to load
 * a cordis context to find out what the loop would decide.
 *
 * This module also owns argument canonicalisation, which previously lived in
 * `runner.ts`. Importing it from there dragged `node:child_process`, `node:fs`
 * and `node:path` into the plugin's module graph for the sake of one pure
 * function — a real cost for a plugin that has no business spawning processes.
 *
 * @module dsh-feature-loop/agent-policy
 */

import { detectSignals } from './signals.ts'
import type { ReviewSignal, StepObservation } from './signals.ts'
import type { ReviewDecision, ReviewGate } from './review.ts'
import type { Reversibility } from './spec.ts'

/**
 * Canonicalise tool arguments for cycle detection.
 *
 * Keys are sorted so two calls differing only in key order compare equal — they
 * are the same call, and treating them as different is exactly how a loop hides
 * the repetition the detector exists to find.
 *
 * @param args - the parsed arguments.
 * @returns a stable string key.
 */
export function canonicalArgs(args: Record<string, unknown>): string {
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk)
    if (value !== null && typeof value === 'object') {
      const record = value as Record<string, unknown>
      return Object.fromEntries(Object.keys(record).sort().map(k => [k, walk(record[k])]))
    }
    return value
  }
  try {
    return JSON.stringify(walk(args))
  } catch {
    return String(args)
  }
}

/**
 * Canonicalise a tool call's raw argument text.
 *
 * A model may emit invalid JSON. That is not a reason to lose the call from the
 * history: the raw text is still a stable key, and two identical malformed calls
 * are exactly the repetition worth noticing. So a parse failure falls back to
 * the raw string rather than to `undefined`.
 *
 * @param raw - the argument text as the model emitted it.
 * @returns a stable key, or the empty string for absent arguments.
 */
export function argsKeyOf(raw: string | undefined): string {
  if (raw === undefined || raw.trim() === '') return ''
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return raw
    return canonicalArgs(parsed as Record<string, unknown>)
  } catch {
    return raw
  }
}

/**
 * One line describing the last step, for the judge.
 *
 * The judge is asked about the *previous* step because the current one has not
 * happened yet. Saying so explicitly when there is no previous step matters: an
 * empty summary reads as "a step that did nothing", which is a different claim.
 *
 * @param history - completed steps.
 * @returns the summary the judge sees.
 */
export function summarizeStep(history: readonly StepObservation[]): string {
  const last = history.at(-1)
  if (last === undefined) return 'the run has just started; no step has completed yet'
  const tool = last.tool ?? 'no tool'
  const verdict = last.error === true ? 'failed' : 'succeeded'
  return `the last completed step called ${tool} and ${verdict}`
}

/**
 * What the agent should ask before a step runs.
 *
 * Split into "what did the detectors find" and "should the judge be asked" so
 * the caller does not have to re-derive the second from the first — the rule is
 * that the judge is consulted when there is a reason to, or when the attention
 * budget still has room, and getting that condition wrong in either direction is
 * a silent behaviour change.
 */
export interface ReviewPreparation {
  signals: ReviewSignal[]
  /** Whether to spend a judge call on this step. */
  askJudge: boolean
  /** The summary to send the judge. */
  judgeState: string
}

/**
 * Run the deterministic detectors and decide whether the judge is worth asking.
 *
 * @param input - the history and the run's envelope.
 * @returns the signals, the judge decision, and the judge's input.
 */
export function prepareReview(input: {
  history: readonly StepObservation[]
  maxSteps: number
  costBudgetUSD: number
  spentUSD: number
  /** Whether the attention budget still has room. */
  budgetRemaining: boolean
}): ReviewPreparation {
  const signals = detectSignals(input.history, {
    maxSteps: input.maxSteps,
    costBudgetUSD: input.costBudgetUSD,
    spentUSD: input.spentUSD,
  })
  return {
    signals,
    // A critical signal is a reason on its own. So is a warning, or simply
    // having attention budget left — otherwise the judge would only ever be
    // consulted on steps the detectors already flagged, and its whole job is to
    // notice the ones they did not.
    askJudge: signals.length > 0 || input.budgetRemaining,
    judgeState: summarizeStep(input.history),
  }
}

/**
 * Resolve the reversibility the gate should use for a tool.
 *
 * The spec's `actuator` wins when it names the tool. An unclassified tool is
 * `irreversible`, which is the fail-closed direction: forgetting to classify a
 * tool must not be how it gets to run unsupervised, and a default of `read`
 * would make every unlisted tool auto-approved.
 *
 * @param toolName - the tool about to run.
 * @param actuator - the spec's tool table, when a spec was configured.
 * @returns the reversibility class to classify against.
 */
export function resolveReversibility(
  toolName: string,
  actuator: Readonly<Record<string, Reversibility>> | undefined,
): Reversibility {
  return actuator?.[toolName] ?? 'irreversible'
}

/**
 * Ask the gate about one tool call.
 *
 * `confidence` is the judge's score, or `undefined` when no judge ran. Passing
 * `undefined` through rather than substituting a number is deliberate: a
 * missing judge is not evidence of confidence, and `ReviewGate` treats an absent
 * estimate as a reason to ask rather than a reason to proceed.
 *
 * @param gate - the gate, when the deployment configured one.
 * @param toolName - the tool about to run.
 * @param reversibility - its class, from {@link resolveReversibility}.
 * @param confidence - the judge's score for this step, if any.
 * @returns the gate's decision, or `undefined` when there is no gate.
 */
export function gateDecisionFor(
  gate: ReviewGate | undefined,
  toolName: string,
  reversibility: Reversibility,
  confidence: number | undefined,
): ReviewDecision | undefined {
  if (gate === undefined) return undefined
  return gate.check(toolName, reversibility, confidence)
}

/**
 * Mark a step's observation with whether its tools failed.
 *
 * The observation is appended when the attempt settles — before the tools have
 * run — because that is the only once-per-settled-step hook the agent has. So
 * the error flag can only be filled in afterwards, here.
 *
 * Without this, `error-cascade` — three consecutive failing steps, one of the
 * two *critical* signals — could never fire in the plugin path, and the gate
 * would silently run on four detectors instead of six.
 *
 * Mutates the last observation in place, and returns whether it changed.
 *
 * @param history - the step history, mutated.
 * @param outcomes - each dispatched call's outcome, in model order.
 * @returns true when the last step was marked as an error step.
 */
export function noteToolOutcomes(
  history: StepObservation[],
  outcomes: readonly { isError: boolean }[],
): boolean {
  if (outcomes.length === 0) return false
  const last = history.at(-1)
  if (last === undefined) return false
  // A step counts as an error step when *any* of its calls failed. The detectors
  // ask "did this step make progress?", and a step whose write was rejected did
  // not.
  if (!outcomes.some(outcome => outcome.isError)) return false
  last.error = true
  return true
}
