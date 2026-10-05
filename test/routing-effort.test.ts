/**
 * The check that a route change cannot carry a reasoning effort onto a model
 * that never offered one.
 *
 * A live desktop session picked `space-bunny-free` at effort `high`, then the
 * ladder rewrote the route to `onegw/execution` — and the effort rode along,
 * so every turn died with `UNSUPPORTED_REASONING_EFFORT` before the model was
 * reached. The plugin had two halves to that bug: `routeForStep` dropped a rung's
 * own `reasoningEffort` even though the ladder advertises the field, and the
 * `agent/request` merge (`{ ...resolved, ...routed }`) kept every key `routed`
 * does not mention — the session's effort among them.
 *
 * Both halves are asserted here against the real handlers, because each one on
 * its own still leaves the failure: restoring the hand-off without clearing the
 * inherited key breaks the same session, and clearing the key without the
 * hand-off silently discards a rung the deployment configured.
 *
 * Run: `node --experimental-strip-types --test test/routing-effort.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { apply } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'

/**
 * A spec whose ladder routes to a model that declares no reasoning at all —
 * the `onegw/execution` shape, which resolves `reasoning === undefined` in the
 * harness and therefore refuses any explicit effort.
 */
const SPEC: CreatePolicyOptions['spec'] = {
  goal: 'the tests pass',
  sensor: ['test output'],
  controller: { ladder: [{ provider: 'onegw', model: 'execution' }] },
  actuator: { read: 'read' },
  feedback: 'the suite passes',
  termination: { successCommand: 'npm test', guards: ['no-progress'] },
  maxSteps: 8,
  costBudgetUSD: 1,
} as unknown as NonNullable<CreatePolicyOptions['spec']>

/** A spec whose single rung does declare an effort of its own. */
const EFFORT_SPEC = {
  ...SPEC,
  controller: {
    ladder: [{ provider: 'onegw', model: 'execution', reasoningEffort: 'high' }],
  },
} as unknown as NonNullable<CreatePolicyOptions['spec']>

/**
 * A context that records handlers instead of dispatching them.
 *
 * @returns the fake context and a reader for one captured handler.
 */
function fakeCtx(): {
  ctx: unknown
  handler: (event: string) => (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>
} {
  const handlers = new Map<string, (p: unknown, n: () => Promise<unknown>) => Promise<unknown>>()
  const ctx = {
    on: (event: string, fn: (p: unknown, n: () => Promise<unknown>) => Promise<unknown>) => {
      handlers.set(event, fn)
      return () => { handlers.delete(event) }
    },
    plugin: () => undefined,
    set: () => undefined,
  }
  return {
    ctx,
    handler: (event: string) => {
      const fn = handlers.get(event)
      assert.ok(fn !== undefined, `no handler registered for ${event}`)
      return fn
    },
  }
}

/**
 * Drive one `agent/request` dispatch with the config the harness resolved.
 *
 * @param spec - the deployment spec whose ladder routes the step.
 * @param resolved - the request config the harness's own handlers produced.
 * @returns the config the plugin hands back to `prepareCall`.
 */
async function request(
  spec: NonNullable<CreatePolicyOptions['spec']>,
  resolved: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { ctx, handler } = fakeCtx()
  const dispose = apply(ctx as never, { spec, dashboard: { enabled: false } })
  const result = await handler('agent/request')(
    { agent: { id: 'agent-routing-effort' }, turn: 1, step: 1 },
    async () => resolved,
  ) as Record<string, unknown>
  dispose()
  return result
}

test('a route change does not carry the session\'s effort onto the rung', async () => {
  // Precondition: the session really was on an effort. Without it the
  // assertion below would pass vacuously against a config that never had one.
  const resolved = {
    provider: 'deepseek-official',
    model: 'opencode/space-bunny-free',
    reasoningEffort: 'high',
  }
  assert.equal(resolved.reasoningEffort, 'high')

  const proposed = await request(SPEC, resolved)

  assert.equal(proposed.provider, 'onegw')
  assert.equal(proposed.model, 'execution')
  assert.ok(
    !('reasoningEffort' in proposed),
    `the routed model was sent effort ${JSON.stringify(proposed.reasoningEffort)}; `
    + 'onegw/execution offers no effort, so this is the UNSUPPORTED_REASONING_EFFORT turn',
  )
})

test('a rung that declares an effort hands that one over', async () => {
  const proposed = await request(EFFORT_SPEC, {
    provider: 'deepseek-official',
    model: 'opencode/space-bunny-free',
    reasoningEffort: 'low',
  })

  assert.equal(proposed.reasoningEffort, 'high', "the rung's own effort, not the session's")
})

test('a rung with no effort leaves the rest of the resolved config alone', async () => {
  // maxTokens is the other request control a caller may have set; the merge must
  // not become a replacement that silently drops it.
  const proposed = await request(SPEC, {
    provider: 'deepseek-official',
    model: 'opencode/space-bunny-free',
    maxTokens: 4096,
  })

  assert.equal(proposed.maxTokens, 4096)
  assert.equal(proposed.model, 'execution')
})