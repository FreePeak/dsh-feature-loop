/**
 * Authoritative DSH tool-outcome wiring.
 *
 * Run: `node --experimental-strip-types --test test/plugin-tool-outcomes.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { configureLoopVerifier } from '../src/plugin.ts'
import { apply } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'

type Decision = { kind: string, messages?: unknown[] }
type WaterfallHandler = (payload: unknown, next: () => Promise<Decision>) => Promise<Decision>
type ResultHandler = (exec: unknown, result: { isError: boolean }) => void
type SessionHandler = (session: unknown, event: unknown) => void

const SPEC: NonNullable<CreatePolicyOptions['spec']> = {
  goal: 'Observe every final tool outcome.',
  sensor: ['tool results'],
  controller: {
    ladder: [
      { model: 'cheap', reasoningEffort: 'low' },
      { provider: 'p', model: 'strong', reasoningEffort: 'high' },
    ],
    escalateAfterFailures: 1,
  },
  actuator: {
    read_file: 'read',
    write_file: 'irreversible',
  },
  feedback: 'the final tool results are observed',
  termination: { successCommand: 'true', guards: ['error-cascade'] },
  maxSteps: 20,
  costBudgetUSD: 1,
  prices: {},
}

interface Harness {
  agent: object
  dispose: () => void
  preStep: (step: number) => Promise<Decision>
  request: (step: number) => Promise<Decision>
  preTool: (callId: string, name: string, args?: object) => Promise<Decision>
  result: (callId: string, isError: boolean) => void
  turnEnd: (turn: number) => void
  states: string[]
}

function harness(sessionId = 'a1'): Harness {
  const handlers = new Map<string, (...args: never[]) => unknown>()
  const states: string[] = []
  const agent = { id: sessionId }
  const ctx = {
    agents: { get: (id: string) => id === sessionId ? agent : undefined },
    on(event: string, handler: (...args: never[]) => unknown): () => void {
      handlers.set(event, handler)
      return () => { handlers.delete(event) }
    },
  }
  const dispose = apply(ctx as never, {
    spec: SPEC,
    dashboard: { enabled: false },
    optimize: { history: '' },
    judge: {
      async score(state) {
        states.push(state)
        return { score: 0 }
      },
    },
  })
  const handler = <T>(event: string): T => {
    const found = handlers.get(event)
    assert.ok(found !== undefined, `missing handler for ${event}`)
    return found as T
  }
  return {
    agent,
    dispose,
    states,
    async preStep(step) {
      return await handler<WaterfallHandler>('agent/pre-step')(
        { agent, turn: 1, step },
        async () => ({ kind: 'enter', messages: [] }),
      )
    },
    async request(step) {
      return await handler<WaterfallHandler>('agent/request')(
        { agent, step },
        async () => ({ kind: 'base', provider: 'base', model: 'base' }),
      )
    },
    async preTool(callId, name, args = {}) {
      return await handler<WaterfallHandler>('tools/pre-execute')(
        { agent, callId, name, arguments: args },
        async () => ({ kind: 'allow' }),
      )
    },
    result(callId, isError) {
      handler<ResultHandler>('tools/result')({ agent, callId }, { isError })
    },
    turnEnd(turn) {
      handler<SessionHandler>('session/event')(
        { id: sessionId },
        { type: 'turn/end', data: { turn, reason: { kind: 'completed' } } },
      )
    },
  }
}

function completionHarness(result: { exitCode: number | null, signal?: string | null, timedOut?: boolean, aborted?: boolean, sandbox?: { denied?: boolean, runnerFailed?: boolean } }) {
  const handlers = new Map<string, (...args: never[]) => unknown>()
  const requests: Record<string, unknown>[] = []
  const agent = { id: 'goal-session', session: { header: { cwd: '/session/workspace' } } }
  const shell = {
    resolve(request: Record<string, unknown>) {
      requests.push(request)
      return request
    },
    async execute() {
      return { async result() { return result } }
    },
  }
  const ctx = {
    agents: { get: () => agent },
    get: (key: string) => key === 'shell'
      ? shell
      : key === 'sandboxPolicy'
        ? { resolve: () => ({ workspaceRoot: '/sandbox/workspace' }) }
        : undefined,
    on(event: string, handler: (...args: never[]) => unknown): () => void {
      handlers.set(event, handler)
      return () => { handlers.delete(event) }
    },
  }
  const dispose = apply(ctx as never, { spec: SPEC, dashboard: { enabled: false }, optimize: { history: '' } })
  const handler = handlers.get('tools/pre-execute') as WaterfallHandler | undefined
  assert.ok(handler !== undefined)
  return {
    agent,
    requests,
    dispose,
    async complete() {
      return await handler(
        {
          agent,
          callId: 'goal-call',
          name: 'update_goal',
          arguments: { goal_id: 'g1', revision: 1, action: 'complete' },
          signal: new AbortController().signal,
        },
        async () => ({ kind: 'allow' }),
      )
    },
  }
}

test('goal completion runs the verifier in the effective sandbox workspace before human gating', async (t) => {
  const h = completionHarness({ exitCode: 0, signal: null })
  t.after(h.dispose)
  const decision = await h.complete()
  assert.equal(decision.kind, 'ask', 'passing verification still reaches the normal irreversible gate')
  assert.equal(h.requests.length, 1)
  assert.equal(h.requests[0]?.command, 'true')
  assert.equal(h.requests[0]?.workdir, '/sandbox/workspace')
  assert.deepEqual(h.requests[0]?.sandboxPolicy, { workspaceRoot: '/sandbox/workspace' })
})

test('failed or unavailable verification denies update_goal complete before the human gate', async (t) => {
  const failed = completionHarness({ exitCode: 1, signal: null })
  t.after(failed.dispose)
  assert.equal((await failed.complete()).kind, 'deny')

  const unavailable = completionHarness({ exitCode: 0 })
  unavailable.dispose()
  configureLoopVerifier(undefined)
  const decision = await unavailable.complete()
  assert.equal(decision.kind, 'deny')
  assert.match((decision as { reason: string }).reason, /no independent verifier/)
})

test('a provider-less ladder rung preserves the resolved provider and applies reasoning effort', async (t) => {
  const h = harness()
  t.after(h.dispose)

  await h.preStep(1)
  const routed = await h.request(1) as { provider?: string, model?: string, reasoningEffort?: string }

  assert.equal(routed.provider, 'base')
  assert.equal(routed.model, 'cheap')
  assert.equal(routed.reasoningEffort, 'low')
})

test('three failed parallel-safe steps trigger error-cascade and failure escalation', async (t) => {
  const h = harness()
  t.after(h.dispose)

  for (let step = 1; step <= 4; step += 1) {
    await h.preStep(step)
    if (step < 4) {
      const callId = `call-${String(step)}`
      await h.preTool(callId, 'read_file', { path: `${String(step)}.txt` })
      h.result(callId, true)
    }
  }

  assert.match(h.states.at(-1) ?? '', /error-cascade \(critical\)/)
  const routed = await h.request(4) as { kind: string, provider?: string, model?: string, reasoningEffort?: string }
  assert.equal(routed.provider, 'p')
  assert.equal(routed.model, 'strong')
  assert.equal(routed.reasoningEffort, 'high')
})

test('an approved ask that succeeds is not recorded as failed', async (t) => {
  const h = harness()
  t.after(h.dispose)

  await h.preStep(1)
  const decision = await h.preTool('approved', 'write_file', { path: 'safe.txt' })
  assert.equal(decision.kind, 'ask')
  h.result('approved', false)
  await h.preStep(2)

  assert.match(h.states.at(-1) ?? '', /write_file and succeeded/)
  assert.doesNotMatch(h.states.at(-1) ?? '', /failed/)
})

test('parallel calls aggregate into one failed step without clobbering call ids', async (t) => {
  const h = harness()
  t.after(h.dispose)

  await h.preStep(1)
  await h.preTool('read-ok', 'read_file', { path: 'a.txt' })
  await h.preTool('write-bad', 'write_file', { path: 'b.txt' })
  h.result('write-bad', true)
  h.result('read-ok', false)
  await h.preStep(2)

  assert.match(h.states.at(-1) ?? '', /read_file\+write_file and failed/)
})

test('turn end commits the final step before the next turn reviews history', async (t) => {
  const h = harness()
  t.after(h.dispose)

  await h.preStep(1)
  await h.preTool('final', 'read_file', { path: 'final.txt' })
  h.result('final', true)
  h.turnEnd(1)
  await h.preStep(1)

  assert.match(h.states.at(-1) ?? '', /read_file and failed/)
})
