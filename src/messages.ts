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
    // "A human should review this before the loop goes further" — and, crucially,
    // the loop DOES go further: nothing here blocks the next step, the notice is
    // a request for attention, not a stop. The second sentence said the
    // opposite — "if the step was not consistent with the goal, STOP and
    // report what you have instead" — and the model believed it.
    //
    // Measured 2026-10-04, live: the judge scored an `ls` at 1.1/3, the notice
    // went out, and the very next assistant message was "Stopping here for
    // review rather than continuing", followed by a tidy report of what it had
    // found and nothing else. The turn ended one step in, on a task whose first
    // `write` was next. The e2e reported it as "1 ask settled, 3 files absent"
    // and the run record called it `goal-met`: the notice's own wording produced
    // the failure it was reporting on.
    //
    // So the notice now says what actually happens. A judge-sourced review is a
    // curiosity flag ("look at this if you have a moment"), not a hazard; only
    // the gate's own asks — which DO stop the tool call — keep the stop wording,
    // and `gateForTool` already carries the tool name for that.
    source === 'judge'
      ? 'The loop will keep going after this notice, so nothing is waiting on you: '
        + 'it is a "worth a look" flag. Carry on with the task, and mention it if the '
        + 'flagged step turns out to matter.'
      : 'A human should review this before the loop goes further. Do not start work that '
        + 'depends on it; if the step was not consistent with the goal, stop and report '
        + 'what you have instead.',
  ].join('\n')
}
