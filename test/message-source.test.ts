/**
 * The check that this plugin's injected messages survive V4 session admission.
 *
 * `agent/pre-step` returns a `PreStepDecision` whose `messages` are spliced
 * into the durable session log. V4 admission (`assertV4MessageSources` in
 * `@deepseek-ai/dsh-session-format-v3-to-v4`) refuses any message whose
 * `source.kind` is the bare string `plugin`:
 *
 *   format v4 message requires a producer-owned source kind
 *
 * `plugin` is the retired V3 wrapper, kept only so the migration can lift old
 * rows. Emitting it from a V4 producer is not merely imprecise — it makes the
 * whole turn fail to persist, which is what a gated step did to a live session.
 *
 * So this test drives the real `apply` through a real review (the only path
 * that produces a notice) and asserts the kind the harness will accept. It is
 * out of the CI no-install list for the same reason as
 * `test/plugin-approval.test.ts`: it imports `src/plugin.ts`, which carries a
 * runtime `@deepseek-ai/dsh-llm` import.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { apply } from '../src/plugin.ts'
import type { CreatePolicyOptions, Decision, PreStepDecision } from '../src/plugin.ts'

/** A review that the gate must raise, so `reviewStep` produces a notice. */
const SPEC = {
  goal: 'ship it',
  sensor: ['the repository'],
  controller: {
    ladder: [{ provider: 'onegw', model: 'execution' }],
    stepsPerRung: 5,
    escalateAfterFailures: 2,
  },
  actuator: { read: 'read', write: 'irreversible' },
  feedback: 'the tests pass',
  termination: { successCommand: 'true', guards: ['error-cascade', 'tool-cycle'] },
  maxSteps: 5,
  costBudgetUSD: 1,
} as unknown as CreatePolicyOptions['spec']

const AGENT = { id: 'agent-source-kind' }

/** The V4 rule, restated from the harness so the test fails for the right reason. */
const V4_ACCEPTED = (kind: unknown): boolean =>
  typeof kind === 'string' && kind.length > 0 && kind !== 'plugin'

/** A context that records handlers instead of dispatching them. */
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
 * Drive one step through `agent/pre-step` under a gate that must review.
 *
 * The review is produced by a stub judge scoring at the top of its 0–3 scale,
 * which is the only trigger on this path that needs no session log, no priced
 * usage, and no detector history — so the test asserts the notice's shape and
 * not the timing of any particular detector.
 *
 * @returns the decision the handler returned.
 */
async function step(): Promise<PreStepDecision> {
  const { ctx, handler } = fakeCtx()
  const dispose = apply(ctx as never, {
    spec: SPEC,
    judge: { score: async () => ({ score: 3 }) },
    dashboard: { enabled: false },
  })
  const decision = await handler('agent/pre-step')(
    {
      agent: AGENT,
      turn: { turn: 1, step: 1 },
      step: { toolName: 'write_file', arguments: { path: 'a.ts' } },
    },
    async () => ({ kind: 'enter', messages: [] }),
  ) as PreStepDecision
  dispose()
  return decision
}

test('a gated step injects messages that V4 session admission accepts', async () => {
  const decision = await step()

  // Precondition: this step really did produce a notice to inject. Without it
  // the assertions below would pass vacuously against an empty list.
  assert.ok(decision.messages.length > 0, 'expected the review to inject at least one message')

  for (const message of decision.messages) {
    const kind = (message.source as { kind?: unknown } | undefined)?.kind
    assert.ok(
      V4_ACCEPTED(kind),
      `injected message carries source.kind ${JSON.stringify(kind)}, which V4 admission refuses`,
    )
  }
})

test('the injected source names this plugin as its producer', async () => {
  // The kind must identify the producer, not merely be some accepted string:
  // it is what a reader attributes the notice to, and what the transcript
  // groups by.
  const decision = await step()
  const kinds = new Set(decision.messages.map(m => (m.source as { kind?: string }).kind))
  assert.deepEqual([...kinds], ['plugin:feature-loop'])
})

test('the notice source is a form the transcript can collapse', async () => {
  // `form: 'notice'` is what lets the transcript show a one-line summary
  // instead of pasting the whole review into a conversation the model re-reads
  // on every following turn.
  const decision = await step()
  for (const message of decision.messages) {
    const source = message.source as { form?: string, summary?: string }
    assert.equal(source.form, 'notice')
    assert.equal(typeof source.summary, 'string')
    assert.ok((source.summary?.length ?? 0) > 0, 'a notice form needs a summary to show')
  }
})
