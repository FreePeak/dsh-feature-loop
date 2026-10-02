/**
 * The check that fails when the transport sends the wrong id to the gateway.
 *
 * Run: `node --experimental-strip-types --test test/llm.test.ts`
 * No harness, no network: `fetch` is replaced, and the assertion is on the body
 * the gateway would have received.
 *
 * Why it exists. Every route in this repo is a `provider/model` KEY —
 * `onegw/execution` — because that is what a ladder rung names and what the
 * price table keys on. onegw's own id space has no such prefix: its role
 * aliases (`execution`, `dev`, `planning`) sit at the top level beside the
 * concrete ids. Verified against the live gateway 2026-10-02 —
 *
 *   POST /v1/chat/completions {"model":"execution"}         → 200
 *   POST /v1/chat/completions {"model":"onegw/execution"}   → 404 unknown provider onegw
 *
 * So the demo ran on `xiaomi/mimo-v2.5` and could not run on the route it was
 * configured for: switching the default to the tested route produced a run that
 * died on step 1 with a 404. The prefix is dropped in `createOnegwClient` and
 * nowhere else, which is what these three cases pin.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { LlmCallError, createOnegwClient, readUsage } from '../src/llm.ts'

/** Capture what `fetch` was called with, and answer with one canned choice. */
function capturingFetch(models: string[]): typeof globalThis.fetch {
  const stub = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    models.push((JSON.parse(String(init?.body)) as { model: string }).model)
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: 'ok', tool_calls: [] }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 2, prompt_tokens_details: { cached_tokens: 4 } },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }
  return stub as unknown as typeof globalThis.fetch
}

test('a route key reaches the gateway as a BARE id, or the call 404s', async () => {
  const sent: string[] = []
  const real = globalThis.fetch
  globalThis.fetch = capturingFetch(sent)
  try {
    const client = createOnegwClient({ baseURL: 'http://127.0.0.1:8080/v1', apiKey: 'k' })
    for (const model of ['onegw/execution', 'execution', 'xiaomi/mimo-v2.5']) {
      await client.complete({ model, messages: [{ role: 'user', content: 'hi' }] })
    }
  } finally {
    globalThis.fetch = real
  }
  assert.deepEqual(sent, ['execution', 'execution', 'xiaomi/mimo-v2.5'])
})

test('usage is read from the response, and the loop prices cache reads', async () => {
  const real = globalThis.fetch
  globalThis.fetch = capturingFetch([])
  try {
    const client = createOnegwClient({ baseURL: 'http://127.0.0.1:8080/v1', apiKey: 'k' })
    const result = await client.complete({
      model: 'onegw/execution',
      messages: [{ role: 'user', content: 'hi' }],
    })
    // 10 prompt tokens, 4 of them cached → 6 fresh input, 2 output.
    assert.deepEqual(result.usage, { inputTokens: 6, outputTokens: 2, cacheReadTokens: 4 })
    assert.equal(result.finishReason, 'stop')
  } finally {
    globalThis.fetch = real
  }
})

test('a gateway refusal surfaces its status, because a bare 404 names no cause', async () => {
  const real = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response('{"error":{"code":"404","message":"unknown provider onegw"}}', {
      status: 404,
    })) as unknown as typeof globalThis.fetch
  try {
    const client = createOnegwClient({ baseURL: 'http://127.0.0.1:8080/v1', apiKey: 'k' })
    await assert.rejects(
      client.complete({ model: 'onegw/execution', messages: [{ role: 'user', content: 'hi' }] }),
      (error: unknown) => error instanceof LlmCallError && error.status === 404,
    )
  } finally {
    globalThis.fetch = real
  }
})

test('readUsage reports what the gateway said, not what it meant', () => {
  assert.equal(readUsage(undefined), undefined)
  assert.equal(readUsage(null), undefined)
  assert.equal(readUsage({}), undefined)
  // Reasoning tokens are a breakdown OF outputTokens, never a fourth line: the
  // output multiplication already bills them, so a separate line double-counts.
  assert.deepEqual(
    readUsage({ prompt_tokens: 10, completion_tokens: 6, completion_tokens_details: { reasoning_tokens: 5 } }),
    { inputTokens: 10, outputTokens: 6, reasoningTokens: 5 },
  )
})
