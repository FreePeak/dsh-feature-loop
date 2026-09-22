/**
 * The harness-transport wrappers for this fork's notices.
 *
 * `messages.ts` builds the *text* and imports nothing, so the policy layer and
 * the standalone runner stay runnable with no dependencies at all. This module
 * is the other half: it wraps that same text in a DSH user message, which is
 * what the plugin path appends to its session.
 *
 * The split is not tidiness. Before it, `runner.ts` reached `messages.ts` for a
 * string and inherited `@deepseek-ai/dsh-llm` through it, so a clean checkout
 * could not run the test suite without installing a harness package first. One
 * import in a "pure" module is enough to make the whole purity claim false.
 *
 * Only `agent.ts` imports this, and only the plugin path needs it.
 *
 * @module dsh-feature-loop/notices
 */

import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { MessageSource } from '@deepseek-ai/dsh-llm'

import { budgetStopText, budgetWarnText, escalationText, reviewText } from './messages.ts'

/**
 * The `{kind:'plugin'}` source stamped on every notice this loop injects.
 * Load-bearing: an unlabeled context message renders as a user prompt in
 * derived history, which would let the loop talk to itself as if a human had.
 */
export const FEATURE_LOOP_SOURCE: MessageSource = { kind: 'plugin', plugin: 'feature-loop' }

/**
 * The one-step handoff prompt as a DSH user message.
 * @param reason - which ceiling was reached, in the budget's own words.
 * @returns the user-role notice the loop appends to the final step.
 */
export function budgetStopMessage(reason: string) {
  return createUserMessage({
    content: [{ type: 'text', text: budgetStopText(reason) }],
    source: { ...FEATURE_LOOP_SOURCE, form: 'notice', summary: 'budget reached — converge and report' },
  })
}

/**
 * The convergence nudge as a DSH user message.
 * @param reason - the spend so far, in the budget's own words.
 * @returns the user-role notice the loop appends to the current step.
 */
export function budgetWarnMessage(reason: string) {
  return createUserMessage({
    content: [{ type: 'text', text: budgetWarnText(reason) }],
    source: { ...FEATURE_LOOP_SOURCE, form: 'notice', summary: 'budget warning — converge' },
  })
}

/**
 * The rung-change notice as a DSH user message.
 * @param from - the route label left behind.
 * @param to - the route label now in use.
 * @param why - why the ladder moved.
 * @returns the user-role notice, or `undefined` when nothing changed.
 */
export function escalationMessage(from: string, to: string, why: string) {
  const text = escalationText(from, to, why)
  if (text === undefined) return undefined
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: { ...FEATURE_LOOP_SOURCE, form: 'notice', summary: `${from} → ${to}` },
  })
}

/**
 * The review notice as a DSH user message.
 * @param reason - the router's or the gate's own words for the decision.
 * @param source - what produced it (`signal`, `judge`, `policy`, `operator`, …).
 * @returns the user-role notice the loop appends.
 */
export function reviewNotice(reason: string, source: string) {
  return createUserMessage({
    content: [{ type: 'text', text: reviewText(reason, source) }],
    source: { ...FEATURE_LOOP_SOURCE, form: 'notice', summary: `review requested (${source})` },
  })
}
