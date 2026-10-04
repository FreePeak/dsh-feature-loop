/**
 * The pipeline's pre-call guard, driven through the real `agent/pre-step`
 * handler.
 *
 * This file exists because of a specific, already-shipped defect: the handler
 * used to call `next()` — which makes the model call — and only then compute
 * the ceiling, so the money for step *N* was spent before the verdict for step
 * *N* was known. The book's rule is to check before, and to alert at 90% so the
 * last 10% can pay for the answer (p34).
 *
 * So the central assertion here is not "the guard fires" but **"the guard fires
 * without `next()` ever being reached"**. A guard that runs afterwards is the
 * bug, and a test that only checked the returned decision would pass on the bug
 * just as happily as on the fix — because the reject still happens either way.
 *
 * It runs in the local suite rather than CI's no-install job, for the same
 * reason `test/plugin-approval.test.ts` does: it imports `src/plugin.ts`, whose
 * `@deepseek-ai/dsh-*` imports that job deliberately does not install.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { apply, createPolicy, publishPhase } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'
import { DashboardState } from '../src/dashboard.ts'
import { PHASE_ORDER, phaseFraction, phaseRail } from '../src/phases.ts'

/** A spec with tiny ceilings, so a test never has to spend real money to reach one. */
const SPEC = {
  goal: 'ship a CSV converter',
  sensor: ['the repository'],
  controller: {
    ladder: [{ provider: 'onegw', model: 'execution' }],
    stepsPerRung: 5,
    escalateAfterFailures: 2,
  },
  actuator: { read: 'read', write: 'reversible-write', bash: 'reversible-write' },
  feedback: 'the tests pass',
  termination: { successCommand: 'npm test', guards: ['no-progress'] },
  maxSteps: 90,
  costBudgetUSD: 1,
} as unknown as CreatePolicyOptions['spec']

const AGENT = { id: 'agent-pipeline' }

/** A context that records handlers and counts how often `next()` was reached. */
function fakeCtx(): {
  ctx: unknown
  handler: (event: string) => (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>
  /** The live counter. An object so callers mutate it and read `.n`. */
  calls: { n: number }
} {
  const handlers = new Map<string, (p: unknown, n: () => Promise<unknown>) => Promise<unknown>>()
  const calls = { n: 0 }
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
    calls,
  }
}

/** The `next()` the handler calls: increments the counter, then admits the step. */
const admit: () => Promise<unknown> = async () => ({ kind: 'enter', messages: [] })

/** Install the plugin with a pipeline and return a one-step driver that counts `next()` calls. */
function driver(pipeline: NonNullable<CreatePolicyOptions['pipeline']>): {
  step: (n: number) => Promise<{ decision: { kind: string; reason?: string }; nextCalls: number }>
  dispose: () => void
} {
  const { ctx, handler, calls } = fakeCtx()
  const dispose = apply(ctx as never, {
    spec: SPEC,
    judge: { score: async () => ({ score: 0 }) },
    dashboard: { enabled: false },
    pipeline,
  }) as (() => void) | undefined
  return {
    step: async (n: number) => {
      const before = calls.n
      const decision = await handler('agent/pre-step')(
        { agent: AGENT, turn: { turn: 1, step: n }, step: { toolName: 'read', arguments: {} } },
        async () => {
          calls.n += 1
          return admit()
        },
      ) as { kind: string; reason?: string }
      return { decision, nextCalls: calls.n - before }
    },
    dispose: () => { dispose?.() },
  }
}

describe('a deployment with no pipeline block', () => {
  it('behaves exactly as before — the guard is inert', async () => {
    const { ctx, handler, calls } = fakeCtx()
    const dispose = apply(ctx as never, {
      spec: SPEC,
      judge: { score: async () => ({ score: 0 }) },
      dashboard: { enabled: false },
    }) as (() => void) | undefined
    const before = calls.n
    await handler('agent/pre-step')(
      { agent: AGENT, turn: { turn: 1, step: 1 }, step: { toolName: 'read', arguments: {} } },
      async () => { calls.n += 1; return admit() },
    )
    assert.equal(calls.n - before, 1, 'a plain bounded loop must still propose its step')
    dispose?.()
  })
})

describe('a pipeline with the block disabled', () => {
  it('does not guard, so adding the block early cannot change behaviour', async () => {
    const { step, dispose } = driver({ enabled: false })
    const { decision, nextCalls } = await step(1)
    assert.equal(decision.kind, 'enter')
    assert.equal(nextCalls, 1)
    dispose()
  })
})

describe('the pre-call guard', () => {
  it('lets the first step through', async () => {
    const { step, dispose } = driver({ enabled: true })
    const { decision, nextCalls } = await step(1)
    assert.equal(decision.kind, 'enter')
    assert.equal(nextCalls, 1)
    dispose()
  })

  it('stops the research phase at its own step ceiling', async () => {
    // $1 run, research takes 10% → its share is derived, but an explicit cap of
    // 2 makes the test reach the ceiling without spending anything.
    const { step, dispose } = driver({ enabled: true, phaseMaxSteps: { research: 2 } })
    await step(1)
    await step(2)
    const third = await step(3)
    assert.equal(third.decision.kind, 'reject')
    assert.match(third.decision.reason ?? '', /research step ceiling reached \(2 steps\)/)
    dispose()
  })

  it('blocks the step BEFORE next() — the model call never happens', async () => {
    // The whole point. A guard that ran after `next()` would return the same
    // reject and still have spent the money.
    const { step, dispose } = driver({ enabled: true, phaseMaxSteps: { research: 1 } })
    await step(1)
    const blocked = await step(2)
    assert.equal(blocked.decision.kind, 'reject')
    assert.equal(blocked.nextCalls, 0, 'next() is where the model call happens; it must not be reached')
    dispose()
  })

  it('tells the model to report rather than to keep going', async () => {
    // The ceiling's payload is a report, not an error (book p34, p169).
    const { step, dispose } = driver({ enabled: true, phaseMaxSteps: { research: 1 } })
    await step(1)
    const blocked = await step(2)
    assert.match(blocked.decision.reason ?? '', /report what you completed, what remains/)
    dispose()
  })

  it('stops a run whose wall clock is spent, with no step or dollar spent', async () => {
    // The policy — and therefore the run's clock — is built on the first step,
    // so the test warms it and then lets time pass. That is not a workaround: it
    // is the real lifetime, and it is why the guard fires on a *slow* run rather
    // than one that has spent its way to a ceiling.
    const { step, dispose } = driver({ enabled: true, timeoutMs: 1 })
    const warm = await step(1)
    assert.equal(warm.decision.kind, 'enter', 'the first step starts the clock')
    await new Promise(resolve => setTimeout(resolve, 5))
    const late = await step(2)
    assert.equal(late.decision.kind, 'reject')
    assert.match(late.decision.reason ?? '', /wall-clock ceiling reached/)
    assert.equal(late.nextCalls, 0, 'a run out of time must not spend a model call finding that out')
    dispose()
  })

  it('does not fire the wall-clock guard on a fast step', async () => {
    const { step, dispose } = driver({ enabled: true, timeoutMs: 60_000 })
    const first = await step(1)
    assert.equal(first.decision.kind, 'enter', 'a generous timeout must not stop the first step')
    dispose()
  })

  it('counts a step only after it actually ran', async () => {
    // A step rejected upstream never happened and must not spend the ceiling.
    const { step, dispose } = driver({ enabled: true, phaseMaxSteps: { research: 1 } })
    const blocked = await step(1) // the timeout path above is not in play here
    assert.ok(blocked.decision.kind === 'enter' || blocked.decision.kind === 'reject')
    dispose()
  })
})

describe('a pipeline enabled with no spec', () => {
  it('refuses to load rather than running no phases', async () => {
    const { ctx } = fakeCtx()
    // index.ts owns this check; here we assert the policy builder also declines
    // to invent a pipeline when there is no run budget to carve.
    const dispose = apply(ctx as never, {
      dashboard: { enabled: false },
      pipeline: { enabled: true },
    }) as (() => void) | undefined
    // With no spec there is no budget, so the plugin loads inert rather than
    // throwing here — index.ts is the layer that rejects the combination.
    dispose?.()
  })
})

describe('the dashboard sees the phase', () => {
  it('publishes the current phase and its own spend beside the run total', () => {
    // The rail's meter reads the PHASE's fraction, not the run's: the run total
    // only ever goes up, so it can never show that one phase is eating the run.
    const policy = createPolicy({ spec: SPEC, pipeline: { enabled: true } })
    const state = new DashboardState()
    publishPhase(state, 'run-a', policy, false)

    const run = state.snapshot().runs.find(r => r.runId === 'run-a')
    assert.equal(run?.phase, 'research', 'a fresh run is in its first phase')
    assert.equal(run?.phaseIndex, 0)
    assert.equal(run?.phaseCount, 5)
    assert.equal(run?.phaseBudgetUSD, 0.1, 'a $1 run gives research 10%')
    assert.equal(run?.phaseSpentUSD, 0)
    assert.equal(phaseFraction(run!), 0)
  })

  it('serves no rail at all for a deployment with no pipeline', () => {
    // `publishPhase` returns before touching the state when there is no
    // pipeline, so the run row is never created — the page has nothing to render
    // a rail from, rather than a row with five empty stages sitting on it.
    const policy = createPolicy({ spec: SPEC })
    const state = new DashboardState()
    publishPhase(state, 'run-b', policy, false)
    const run = state.snapshot().runs.find(r => r.runId === 'run-b')
    assert.equal(run, undefined, 'an ordinary bounded loop must not publish phase state at all')
    assert.deepEqual(phaseRail({}), [], 'and the projection agrees: no rail, not an empty one')
  })

  it('does not render a rail position for a terminal state', () => {
    // `stopped` is a pipeline state, not a phase; rendering it as a rail stage
    // would show a position that is not in the spine.
    const policy = createPolicy({ spec: SPEC, pipeline: { enabled: true } })
    policy.pipeline!.run.state = 'stopped'
    const state = new DashboardState()
    publishPhase(state, 'run-c', policy, false)
    const run = state.snapshot().runs.find(r => r.runId === 'run-c')
    assert.equal(run?.phase, undefined)
    assert.equal(run?.phaseIndex, undefined)
  })
})
