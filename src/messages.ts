/**
 * The model-facing notice text this fork injects.
 *
 * Kept apart from `agent.ts` for one reason: this is prompt text, and prompt
 * text is the part of a fork most likely to need editing for your own taste
 * without touching vendored loop code. Editing this file never conflicts with an
 * upstream re-sync.
 *
 * **This module imports nothing, and must keep importing nothing.** The same
 * notice reaches two transports — the harness's own message list and the
 * standalone runner's OpenAI-shaped one — so the *text* is built here and each
 * transport wraps it (`notices.ts` for the harness). If a harness import crept
 * back into this file, `runner.ts` would inherit it, and the policy layer's
 * claim to be runnable with no dependencies and no network would quietly become
 * false — which is exactly what happened once, and why this split exists.
 *
 * @module dsh-feature-loop/messages
 */

/**
 * The one-step handoff prompt. Sent once when a ceiling is reached so the run
 * ends with a usable account instead of an empty stop — a bound that returns
 * "here is what I got" is worth one cheap model call.
 *
 * @param reason - which ceiling was reached, in the budget's own words.
 * @returns the notice text.
 */
export function budgetStopText(reason: string): string {
  return [
    `BUDGET REACHED: ${reason}.`,
    'This is the final step. Do not start new work and do not call any tool that writes or mutates anything.',
    'Report, in this order:',
    '1. what you completed and verified, with the exact file paths or commands that prove it;',
    '2. what remains unfinished;',
    '3. the single next action you would take, specific enough that a human can do it without re-deriving it.',
  ].join('\n')
}

/**
 * The convergence nudge. Earlier than the ceiling on purpose: a warning that
 * arrives with the stop is not a warning, it is an obituary.
 *
 * @param reason - the spend so far, in the budget's own words.
 * @returns the notice text.
 */
export function budgetWarnText(reason: string): string {
  return [
    `BUDGET WARNING: ${reason}.`,
    'Converge now: prefer the smallest change that satisfies the goal, skip optional refactors and '
    + 'extra exploration, and stop calling tools as soon as the work is verified.',
  ].join('\n')
}

/**
 * The rung-change notice. Told to the model because a silent model swap mid-run
 * is confusing: the model sees a different capability and its own earlier plan
 * may assume the cheaper one's limits.
 *
 * @param from - the route label left behind.
 * @param to - the route label now in use.
 * @param why - why the ladder moved.
 * @returns the notice text, or `undefined` when nothing changed.
 */
export function escalationText(from: string, to: string, why: string): string | undefined {
  if (from === to) return undefined
  return [
    `MODEL ESCALATION: this step runs on "${to}" instead of "${from}" (${why}).`,
    'The stronger route is available for the hard part; do not re-do work the cheaper route already '
    + 'completed and verified.',
  ].join('\n')
}

/** The marker that starts the call preview inside a review reason. */
export const CALL_PREVIEW_MARKER = 'Call: '

/**
 * One line (or a short block) saying WHAT a gated call is about to do.
 *
 * An approval card that reads "bash: irreversible is always approved by a human"
 * asks a person to say yes to a command they cannot see. The card has the tool
 * name and nothing else, so the arguments have to travel with the reason.
 *
 * Only the fields a human decides on are shown — the command, the target path,
 * the URL — and the result is capped, so a large `write` body does not turn a
 * card into a wall of text.
 *
 * @param toolName - the tool about to run.
 * @param args - the call's parsed arguments.
 * @returns the preview, or `undefined` when the arguments hold nothing to show.
 */
export function callPreview(toolName: string, args: unknown): string | undefined {
  if (typeof args !== 'object' || args === null) return undefined
  const record = args as Record<string, unknown>
  const text = (key: string): string | undefined => {
    const value = record[key]
    return typeof value === 'string' && value !== '' ? value : undefined
  }
  const limit = 600
  const cap = (value: string): string => (value.length > limit ? `${value.slice(0, limit)}…` : value)
  const detail = text('description')
  const target = text('command') ?? text('file_path') ?? text('path') ?? text('url') ?? text('query')
  if (target !== undefined) {
    return `${toolName} ${cap(target)}${detail === undefined ? '' : `\n(${detail})`}`
  }
  // A delegation (`subagent`) names no path or command: what a person approves
  // is the task it was handed, so show its title and the start of its prompt.
  const prompt = text('prompt')
  if (detail === undefined && prompt === undefined) return undefined
  return `${toolName} ${detail ?? ''}${prompt === undefined ? '' : `\n${cap(prompt)}`}`.trimEnd()
}

/**
 * The review notice: a step the router decided a human should see.
 *
 * Surfaced rather than enforced. `{kind:'reject'}` is reserved for a ceiling,
 * where continuing would spend money the deployment already said it would not;
 * a review is a request for attention, and the loop keeps its place in the queue
 * until someone answers.
 *
 * Reads correctly both when the review is raised *before* a step and when it is
 * raised at the gate, after a tool has already run — which is why it says "before
 * the loop goes further" rather than "before this runs".
 *
 * @param reason - why the step was routed, in the router's or gate's own words.
 * @param source - what produced the decision (`signal`, `judge`, `policy`, `operator`).
 * @returns the notice text.
 */
export function reviewText(reason: string, source: string): string {
  return [
    `REVIEW REQUESTED (${source}): ${reason}.`,
    'A human should review this before the loop goes further. Do not start work that depends on it; '
    + 'if the step was not consistent with the goal, stop and report what you have instead.',
  ].join('\n')
}
