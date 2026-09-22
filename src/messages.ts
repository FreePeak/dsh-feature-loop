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
