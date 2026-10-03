/**
 * The pipeline's state machine: the only thing allowed to change a run's phase.
 *
 * Ch3's production tip is the reason this file exists: *"Model every agent as a
 * state machine with explicit VALID_TRANSITIONS before writing a single LLM
 * call"* (p25). The book's claim for the discipline is that asking three
 * questions — what state was it in, what transition did it try, was it valid —
 * *"catches approximately 80% of loop bugs without ever reading an LLM output"*.
 *
 * So the machine is deliberately dull and deliberately small. Its job is not to
 * be clever about phase progression; its job is to make an illegal transition
 * impossible to express rather than merely discouraged in a prompt. A loop that
 * is told "stop after 3 attempts" and ignores the instruction still gets a
 * fourth attempt, because the model reading a rule is not the same as a control
 * flow checking one.
 *
 * `transition()` is the single choke point. Every caller — the plugin's step
 * hook, the runner, a test — goes through it, so one guard here covers every
 * path rather than one guard per caller.
 *
 * Pure: no cordis, no harness import, no I/O.
 *
 * @module dsh-feature-loop/pipeline
 */

import { PHASE_ORDER, testAttemptsRemain } from './phases.ts'
import type { PipelinePhase, PipelineState } from './phases.ts'

/** Why a transition was attempted. Recorded so a refused one explains itself. */
export type TransitionReason = 'gate-passed' | 'gate-failed' | 'ceiling' | 'guard' | 'test-failed' | 'operator'

/** Thrown when a run asks for a transition the machine does not have. */
export class InvalidTransitionError extends Error {
  readonly from: PipelineState
  readonly to: PipelineState

  constructor(from: PipelineState, to: PipelineState, detail: string) {
    super(`dsh-feature-loop: invalid transition ${from} → ${to}: ${detail}`)
    this.name = 'InvalidTransitionError'
    this.from = from
    this.to = to
  }
}

/**
 * Every edge, keyed by its source state.
 *
 * Terminal states map to an empty array rather than being absent, so
 * `transitionsFrom(DONE)` is a question with an answer (`[]`) instead of an
 * `undefined` a caller has to remember to special-case. That distinction is the
 * whole reason a run cannot "recover" from a ceiling by continuing.
 */
export const VALID_TRANSITIONS: Readonly<Record<PipelineState, readonly PipelineState[]>> = {
  research: ['prd', 'stopped', 'blocked'],
  prd: ['implement', 'stopped', 'blocked'],
  // TEST → IMPLEMENT is the retry edge, and the attempt cap in `phases.ts` is
  // what closes it. See `transition()`, which consults the cap before allowing it.
  implement: ['test', 'prd', 'stopped', 'blocked'],
  test: ['ship', 'implement', 'stopped', 'blocked'],
  ship: ['done', 'stopped', 'blocked'],
  done: [],
  stopped: [],
  blocked: [],
} as const

/** Every terminal state: no outgoing edges, by definition. */
export const TERMINAL_STATES: readonly PipelineState[] = ['done', 'stopped', 'blocked'] as const

/** Whether a state can still move. */
export function isTerminal(state: PipelineState): boolean {
  return (VALID_TRANSITIONS[state] ?? []).length === 0
}

/** The states reachable from one. */
export function transitionsFrom(state: PipelineState): readonly PipelineState[] {
  return VALID_TRANSITIONS[state] ?? []
}

/**
 * A run's position in the machine, and the counters the transition rules read.
 *
 * Deliberately a plain mutable object rather than a class: the plugin holds one
 * per agent alongside the budget and the step history, and those are plain
 * fields too. A class here would be the only place in the pipeline that needs
 * `this` to be bound correctly through a cordis fiber.
 */
export interface PipelineRun {
  /** Where the run is now. */
  state: PipelineState
  /** How many test-phase fix attempts have been made. */
  testAttempts: number
  /** One line per accepted transition, for the evidence bundle. */
  log: { from: PipelineState; to: PipelineState; reason: TransitionReason; at: number }[]
}

/** A fresh run, positioned at the first phase. */
export function startPipeline(): PipelineRun {
  return { state: PHASE_ORDER[0]!, testAttempts: 0, log: [] }
}

/**
 * Move the run to another state, or throw.
 *
 * Three checks, in order, and the order matters:
 *
 * 1. **Terminal states are terminal.** Checked first so the message names the
 *    real problem — a run that has stopped does not get a second chance to
 *    continue, and saying "done → test is not an edge" hides that.
 * 2. **The edge exists.** The static table decides what is structurally allowed.
 * 3. **The attempt cap.** The one dynamic edge is `test → implement`, and it is
 *    closed once the book says to close it. Doing this here rather than in the
 *    caller means no caller can forget it.
 *
 * @param run - the run to advance, mutated in place.
 * @param to - the requested next state.
 * @param reason - why, recorded in the run log.
 * @param now - epoch ms, for the log entry.
 * @throws InvalidTransitionError when the move is not allowed.
 */
export function transition(run: PipelineRun, to: PipelineState, reason: TransitionReason, now: number): void {
  const from = run.state
  if (isTerminal(from)) {
    throw new InvalidTransitionError(from, to, `${from} is terminal`)
  }
  if (!transitionsFrom(from).includes(to)) {
    throw new InvalidTransitionError(from, to, `no such edge from ${from}`)
  }
  if (from === 'test' && to === 'implement') {
    if (!testAttemptsRemain(run.testAttempts)) {
      throw new InvalidTransitionError(
        from,
        to,
        `the test phase has used all ${run.testAttempts} attempts — report the failure instead of retrying`,
      )
    }
    run.testAttempts += 1
  }
  run.state = to
  run.log.push({ from, to, reason, at: now })
}

/**
 * Whether a transition would be accepted, without performing it.
 *
 * Exists so a caller can *ask* before it acts — the plugin decides whether to
 * hand back control at a phase boundary, and asking first is cheaper than
 * catching an exception in the middle of a hook.
 *
 * @param run - the run to test against, not mutated.
 * @param to - the requested next state.
 * @returns true when {@link transition} would accept it.
 */
export function canTransition(run: PipelineRun, to: PipelineState): boolean {
  const from = run.state
  if (isTerminal(from) || !transitionsFrom(from).includes(to)) return false
  if (from === 'test' && to === 'implement') return testAttemptsRemain(run.testAttempts)
  return true
}

/**
 * Stop the run, wherever it is.
 *
 * The one transition every state shares, which is why it gets its own function:
 * a ceiling, a guard or an operator must always be able to end a run, including
 * from a state whose only other edge is forward.
 *
 * @param run - the run to end, mutated in place.
 * @param reason - why it ended.
 * @param now - epoch ms, for the log entry.
 * @throws InvalidTransitionError when the run is already terminal — ending twice
 *   is a bug in the caller, not a thing to paper over.
 */
export function stopPipeline(run: PipelineRun, reason: TransitionReason, now: number): void {
  transition(run, 'stopped', reason, now)
}
