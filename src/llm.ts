/**
 * A minimal OpenAI-compatible chat client, for the standalone loop runner.
 *
 * This is deliberately not the DSH LLM service. The DSH plugin path reaches a
 * model through the harness's own `llm` service, with its credential store,
 * retry policy, and adapter registry. This client exists for the *demo* path:
 * a loop you can run end to end from a terminal, against an OpenAI-compatible
 * gateway (onegw), with no harness build in the way.
 *
 * The two paths share every policy module — budget, routing, signals, review —
 * and differ only in who owns the transport. Keeping that seam explicit is the
 * point: the loop's behaviour should not depend on which transport is under it.
 *
 * @module dsh-feature-loop/llm
 */

import type { UsageReading } from './budget.ts'

/** One tool call the model asked for. */
export interface LlmToolCall {
  id: string
  type: 'function'
  function: { name: string, arguments: string }
}

/** One message in the conversation. */
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  /** `null` on an assistant message that only carries tool calls. */
  content: string | null
  /** Present on assistant messages that requested tools. */
  tool_calls?: LlmToolCall[]
  /** Present on tool result messages, matching the call's id. */
  tool_call_id?: string
}

/** A tool advertised to the model. */
export interface LlmToolSpec {
  type: 'function'
  function: { name: string, description: string, parameters: unknown }
}

/** One completion's result. */
export interface LlmResult {
  content: string
  toolCalls: LlmToolCall[]
  /** Adapter-reported usage, when the gateway reported any. */
  usage?: UsageReading
  /**
   * Why the model stopped. `length` is the one that matters to the judge: a
   * reasoning model that exhausts its budget returns empty content with
   * `length`, which is indistinguishable from a refusal unless it is reported.
   */
  finishReason?: string
}

/** The transport contract the runner depends on. */
export interface LlmClient {
  complete(request: {
    /** The full model id, e.g. `xiaomi/mimo-v2.5`. */
    model: string
    messages: LlmMessage[]
    tools?: LlmToolSpec[]
    maxTokens?: number
  }): Promise<LlmResult>
}

/** Configuration for the onegw client. */
export interface OnegwClientConfig {
  /** Gateway base URL, e.g. `http://127.0.0.1:8080/v1`. */
  baseURL: string
  /** Bearer key. */
  apiKey: string
  /** Per-call deadline in ms. Default 120000. */
  timeoutMs?: number
}

/** Raised when the gateway refuses or fails a call. */
export class LlmCallError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'LlmCallError'
    this.status = status
  }
}

/**
 * Read a usage block from an OpenAI-compatible response.
 *
 * The field names are mapped rather than passed through because the loop's
 * budget prices cache reads and writes separately, and a gateway that reports
 * `prompt_tokens_details.cached_tokens` would otherwise be priced as if every
 * prompt token were a fresh input token — which overstates cost on exactly the
 * runs that are cheapest to make long.
 *
 * @param raw - the response's `usage` object, if any.
 * @returns the loop's own usage reading, or `undefined` when absent.
 */
export function readUsage(raw: unknown): UsageReading | undefined {
  if (raw === null || typeof raw !== 'object') return undefined
  const u = raw as Record<string, unknown>
  const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
  const prompt = num(u.prompt_tokens)
  const completion = num(u.completion_tokens)
  if (prompt === undefined && completion === undefined) return undefined
  const promptDetails = (u.prompt_tokens_details ?? {}) as Record<string, unknown>
  const completionDetails = (u.completion_tokens_details ?? {}) as Record<string, unknown>
  const cached = num(promptDetails.cached_tokens)
  return {
    inputTokens: (prompt ?? 0) - (cached ?? 0),
    outputTokens: completion ?? 0,
    ...cached === undefined ? {} : { cacheReadTokens: cached },
    ...num(completionDetails.reasoning_tokens) === undefined
      ? {}
      : { reasoningTokens: num(completionDetails.reasoning_tokens) },
  }
}

/**
 * Create an OpenAI-compatible client pointed at onegw.
 *
 * @param config - gateway URL, key, and deadline.
 * @returns a client whose `complete` never silently swallows a gateway error.
 */
export function createOnegwClient(config: OnegwClientConfig): LlmClient {
  const timeoutMs = config.timeoutMs ?? 120_000
  const url = `${config.baseURL.replace(/\/$/, '')}/chat/completions`

  return {
    async complete(request) {
      const controller = new AbortController()
      const timer = setTimeout(() => { controller.abort() }, timeoutMs)
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: request.model,
            messages: request.messages,
            ...request.tools === undefined || request.tools.length === 0 ? {} : { tools: request.tools },
            ...request.maxTokens === undefined ? {} : { max_tokens: request.maxTokens },
          }),
          signal: controller.signal,
        })
        if (!response.ok) {
          const body = await response.text().catch(() => '')
          throw new LlmCallError(
            `gateway returned ${String(response.status)}: ${body.slice(0, 400)}`,
            response.status,
          )
        }
        const payload = await response.json() as {
          choices?: { message?: { content?: string | null, tool_calls?: LlmToolCall[] }, finish_reason?: string }[]
          usage?: unknown
        }
        const choice = payload.choices?.[0]
        if (choice?.message === undefined) {
          throw new LlmCallError('gateway returned a response with no choices[0].message')
        }
        const message = choice.message
        const usage = readUsage(payload.usage)
        return {
          content: message.content ?? '',
          toolCalls: Array.isArray(message.tool_calls) ? message.tool_calls : [],
          ...usage === undefined ? {} : { usage },
          ...choice.finish_reason === undefined ? {} : { finishReason: choice.finish_reason },
        }
      } catch (error: unknown) {
        if (error instanceof LlmCallError) throw error
        if (error instanceof Error && error.name === 'AbortError') {
          throw new LlmCallError(`model call timed out after ${String(timeoutMs)}ms`)
        }
        throw new LlmCallError(`model call failed: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

/**
 * A scripted client for tests: returns queued results, then a plain stop.
 *
 * Its existence is what lets the runner's own control flow — budget stops,
 * escalation, cycle detection — be tested without a network or a model. A loop
 * whose control flow can only be tested against a live model is a loop whose
 * control flow is not tested.
 */
export function createScriptedClient(script: LlmResult[]): LlmClient & { calls: string[] } {
  const queue = [...script]
  const calls: string[] = []
  return {
    calls,
    complete(request) {
      calls.push(request.model)
      const next = queue.shift()
      return Promise.resolve(next ?? { content: 'done', toolCalls: [] })
    },
  }
}
