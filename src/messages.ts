/**
 * The model-facing notices this fork injects.
 *
 * Kept apart from `agent.ts` for one reason: they are prompt text, and prompt
 * text is the part of a fork most likely to need editing for your own taste
 * without touching vendored loop code. Editing this file never conflicts with
 * an upstream re-sync.
 *
 * @module dsh-feature-loop/messages
 */

import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { MessageSource } from '@deepseek-ai/dsh-llm'

/**
 * The `{kind:'plugin'}` source stamped on every notice this loop injects.
 * Load-bearing: an unlabeled context message renders as a user prompt in
 * derived history, which would let the loop talk to itself as if a human had.
 */
export const FEATURE_LOOP_SOURCE: MessageSource = { kind: 'plugin', plugin: 'feature-loop' }

/**
 * The one-step handoff prompt. Sent once when a ceiling is reached so the run
 * ends with a usable account instead of an empty stop — a bound that returns
 * "here is what I got" is worth one cheap model call.
 *
 * @param reason - which ceiling was reached, in the budget's own words.
 * @returns the user-role notice the loop appends to the final step.
 */
export function budgetStopMessage(reason: string) {
  const text = [
    `BUDGET REACHED: ${reason}.`,
    'This is the final step. Do not start new work and do not call any tool that writes or mutates anything.',
    'Report, in this order:',
    '1. what you completed and verified, with the exact file paths or commands that prove it;',
    '2. what remains unfinished;',
    '3. the single next action you would take, specific enough that a human can do it without re-deriving it.',
  ].join('\n')
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: { ...FEATURE_LOOP_SOURCE, form: 'notice', summary: 'budget reached — converge and report' },
  })
}

/**
 * The convergence nudge, sent once when the budget crosses its warn threshold.
 * Earlier than the ceiling on purpose: a warning that arrives with the stop is
 * not a warning, it is an obituary.
 *
 * @param reason - the spend so far, in the budget's own words.
 * @returns the user-role notice the loop appends to the current step.
 */
export function budgetWarnMessage(reason: string) {
  const text = [
    `BUDGET WARNING: ${reason}.`,
    'Converge now: prefer the smallest change that satisfies the goal, skip optional refactors and '
    + 'extra exploration, and stop calling tools as soon as the work is verified.',
  ].join('\n')
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: { ...FEATURE_LOOP_SOURCE, form: 'notice', summary: 'budget warning — converge' },
  })
}

/**
 * The rung-change notice. Told to the model because a silent model swap mid-run
 * is confusing: the model sees a different capability and its own earlier plan
 * may assume the cheaper one's limits.
 *
 * @param from - the route label left behind.
 * @param to - the route label now in use.
 * @param why - why the ladder moved.
 * @returns the user-role notice, or `undefined` when nothing changed.
 */
export function escalationMessage(from: string, to: string, why: string) {
  if (from === to) return undefined
  const text = [
    `MODEL ESCALATION: this step runs on "${to}" instead of "${from}" (${why}).`,
    'The stronger route is available for the hard part; do not re-do work the cheaper route already '
    + 'completed and verified.',
  ].join('\n')
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: { ...FEATURE_LOOP_SOURCE, form: 'notice', summary: `${from} → ${to}` },
  })
}
