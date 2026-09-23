/**
 * The review-brief explainer: the model call that authors a pending
 * approval's review brief (plain prose).
 *
 * This mirrors the `Judge` / `NO_JUDGE` seam in `laya.ts` deliberately: the
 * default is a no-op so an unconfigured deployment behaves byte-identically
 * to today, and the chat implementation runs over the same OpenAI-compatible
 * `LlmClient` transport the judge already uses, with the same give-up-after-
 * repeated-failures rule.
 *
 * Two properties the dashboard depends on:
 *
 *   always resolves   `explain` never throws and never hangs: timeouts,
 *                     gateway errors, and unparseable replies all resolve to
 *                     `undefined`, and the ask's own abort signal cancels the
 *                     call. A brief that cannot be produced is a missing brief,
 *                     never a stuck approval.
 *   never authoritative the returned string is display text only. It is
 *                     normalized (and bounded) by `brief.ts` before it reaches
 *                     the page, and nothing in this module can settle an ask.
 *
 * ponytail: the brief's model call is not metered by `LoopBudget` — the
 * dashboard's spend already reads zero on the plugin path, and this call
 * bypasses the meter entirely. The ceiling is one capped call per ask
 * (`maxTokens`, `timeoutMs`), disabled by default. Upgrade path: route it
 * through the budget's `spend()` seam once briefs are metered.
 *
 * @module dsh-feature-loop/explainer
 */

import type { LlmClient } from './llm.ts'
import { briefSystemPrompt } from './brief.ts'

/** What the explainer may say about a pending ask. */
export interface BriefInput {
  toolName: string
  callId?: string
  /** The gate's reason — the most specific thing the brief can quote. */
  reason?: string
  runId?: string
  step?: number
  maxSteps?: number
  route?: string
  /** The run's current signals, as the dashboard already renders them. */
  signals?: Array<{ severity: string, kind: string, step: number, detail: string }>
  /** The gate's reversibility class for this tool. */
  reversibility?: string
}

/** The explainer contract: brief prose, or `undefined` for no brief. */
export interface Explainer {
  explain(input: BriefInput, signal?: AbortSignal): Promise<string | undefined>
}

/** The default: no model call, no brief, today's behaviour exactly. */
export const NO_EXPLAINER: Explainer = {
  explain(): Promise<undefined> {
    return Promise.resolve(undefined)
  },
}

/** Configuration for the chat explainer. */
export interface ChatExplainerConfig {
  /** The transport to ask. */
  llm: LlmClient
  /** The model id to ask, e.g. `xiaomi/mimo-v2.5`. */
  model: string
  /** Cap on the brief's own output. Default 1024. */
  maxTokens?: number
  /** Per-call deadline in ms. Default 15000. */
  timeoutMs?: number
}

/**
 * Render the user message from what the ask and the run already hold.
 *
 * Honest about its limits: the approval event carries no tool arguments, so
 * the brief explains the tool, its reversibility, the gate's reason, and the
 * run position — never the specific arguments. Anything more would be the
 * model inventing what the call does.
 */
export function briefUserMessage(input: BriefInput): string {
  const lines = [
    `Tool: ${input.toolName}`,
    ...input.callId === undefined ? [] : [`Call: ${input.callId}`],
    ...input.reason === undefined ? [] : [`Gate reason: ${input.reason}`],
    ...input.reversibility === undefined ? [] : [`Reversibility: ${input.reversibility}`],
    ...input.runId === undefined ? [] : [`Run: ${input.runId}`],
    ...input.step === undefined
      ? []
      : [`Step: ${String(input.step)}${input.maxSteps === undefined ? '' : ` / ${String(input.maxSteps)}`}`],
    ...input.route === undefined ? [] : [`Route: ${input.route}`],
  ]
  for (const signal of input.signals ?? []) {
    lines.push(`Signal [${signal.severity}] ${signal.kind} @ step ${String(signal.step)} — ${signal.detail}`)
  }
  return lines.join('\n')
}

/**
 * Create an explainer backed by a chat completion.
 *
 * Like `createChatJudge`, this does not latch off after one failure — a
 * single gateway blip must not silently disable every later brief. It does
 * stop asking after repeated failures, so a dead explainer costs a few calls
 * rather than one per ask for the rest of the process.
 *
 * @param config - transport, model, and caps.
 * @returns an explainer that always resolves.
 */
export function createChatExplainer(config: ChatExplainerConfig): Explainer {
  const failures: string[] = []
  let consecutiveFailures = 0
  /** After this many consecutive failures, stop asking for the rest of the run. */
  const giveUpAfter = 3

  return {
    async explain(input: BriefInput, signal?: AbortSignal): Promise<string | undefined> {
      if (consecutiveFailures >= giveUpAfter) return undefined
      if (signal?.aborted === true) return undefined
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 15_000)
      const onOuterAbort = (): void => controller.abort()
      signal?.addEventListener('abort', onOuterAbort, { once: true })
      try {
        const result = await config.llm.complete({
          model: config.model,
          maxTokens: config.maxTokens ?? 1024,
          messages: [
            { role: 'system', content: briefSystemPrompt() },
            { role: 'user', content: briefUserMessage(input) },
          ],
        })
        const content = result.content.trim()
        if (content === '') {
          consecutiveFailures += 1
          failures.push('chat explainer returned empty content')
          return undefined
        }
        consecutiveFailures = 0
        return content
      } catch (error: unknown) {
        consecutiveFailures += 1
        failures.push(`chat explainer call failed: ${error instanceof Error ? error.message : String(error)}`)
        return undefined
      } finally {
        clearTimeout(timeout)
        signal?.removeEventListener('abort', onOuterAbort)
      }
    },
  }
}
