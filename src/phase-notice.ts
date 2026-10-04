/**
 * Telling the model which phase it is in.
 *
 * The phase machine, the budgets and the gates all exist, and a live run showed
 * what that is worth on its own: the loop did the work correctly — fixed the
 * bug, made the tests pass, `outcome: goal-met` — and produced **no**
 * `docs/0-research.md`, no `docs/PRD.md` and no pull request. The pipeline was
 * correct about everything it measured and completely silent about what it
 * wanted.
 *
 * A state machine nobody is told about is not a pipeline. So the phase's own
 * rules are handed to the model as a notice on the first step of each phase, the
 * same way the plugin already delivers budget warnings and review requests: as a
 * user-role message that the transcript collapses to a summary line.
 *
 * The rules come from `phases.ts` unchanged, which is the point — the phase
 * table is the single place that says what a phase means, so what the model
 * reads and what the gate checks cannot drift apart.
 *
 * @module dsh-feature-loop/phase-notice
 */

import { PHASE_ORDER, pipelinePhaseOf, renderRules } from './phases.ts'
import { PIPELINE_PHASE_NAMES } from './spec.ts'
import type { PipelinePhase, PipelineState } from './phases.ts'

/** One line naming where the run is, so the notice reads as progress and not as noise. */
function header(phase: PipelinePhase, index: number, of: number): string {
  return `0→1 PIPELINE — phase ${index + 1} of ${of}: ${phase.toUpperCase()}`
}

/**
 * The instruction block for the phase a run has just entered.
 *
 * Says what the phase is for, what "done" looks like as something checkable, and
 * what happens if the phase's budget runs out — because a model told "research"
 * with no definition of finished will read files until the ceiling stops it, and
 * then hand back a phase that never gated.
 *
 * @param phase - the phase just entered.
 * @returns the notice text, or `undefined` for a state that is not a phase.
 */
export function phaseNotice(phase: PipelinePhase): string | undefined {
  const index = PHASE_ORDER.indexOf(phase)
  if (index < 0) return undefined
  const def = pipelinePhaseOf(phase)
  const done = def.gate.kind === 'command'
    ? `The phase is done when \`${def.gate.label}\` — run the project's configured verify command and read its exit code.`
    : def.gate.kind === 'changed'
      ? `The phase is done when ${def.gate.label}.`
      : `The phase is done when ${def.gate.label}: write \`${def.gate.path}\`.`
  return [
    header(phase, index, PHASE_ORDER.length),
    '',
    def.rules.map((rule, i) => `${String(i + 1)}. ${rule}`).join('\n'),
    '',
    done,
    'Do not start the next phase — the loop checks the gate and moves you on.',
    'If the phase ceiling or its wall clock stops you, report what you completed and what remains rather than continuing.',
  ].join('\n')
}

/**
 * The block delivered when a run enters its FIRST phase, naming the whole goal.
 *
 * Separate from {@link phaseNotice} because it is the only notice that carries
 * the user's original words, and a five-phase run can drift a long way from them
 * by the time it reaches `ship`.
 *
 * @param goal - the run's stated goal.
 * @returns the notice text.
 */
export function goalNotice(goal: string): string {
  return [
    '0→1 PIPELINE — the loop is taking this product from a goal to a pull request.',
    '',
    `Goal: ${goal}`,
    '',
    'Five phases run in order, each with its own budget and its own checkable exit gate: '
      + `${PIPELINE_PHASE_NAMES.join(' → ')}.`,
    'You are told which phase you are in as it starts. Finish the phase you are in.',
  ].join('\n')
}

/**
 * The notice for a terminal state, so a stopped run says why in the model's own
 * last turn rather than ending on a bare rejection.
 *
 * @param state - where the run ended.
 * @param detail - why, from the gate or the ceiling.
 * @returns the notice text.
 */
export function terminalNotice(state: PipelineState, detail: string): string | undefined {
  if (state !== 'stopped' && state !== 'blocked' && state !== 'done') return undefined
  const what = state === 'done'
    ? 'The pipeline reached its end.'
    : state === 'blocked'
      ? 'The pipeline stopped this phase rather than retry it again.'
      : 'The pipeline hit a ceiling.'
  return `0→1 PIPELINE — ${state.toUpperCase()}. ${what}\n\n${detail}\n\n`
    + 'Write your final report: what you completed, what you verified, what remains, and the single next action.'
}

export { renderRules }
