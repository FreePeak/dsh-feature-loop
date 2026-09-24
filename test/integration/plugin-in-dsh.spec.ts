/**
 * Integration test: the feature-loop gate inside a REAL DSH tool pipeline.
 *
 * `test/plugin-approval.test.ts` drives the plugin through a fake `ctx` that
 * only captures handlers. That proves the plugin emits the right decision; it
 * does not prove the harness honours it. This file closes that gap by mounting
 * the actual plugin into a real cordis context with the real tool runtime, real
 * approval service, and real session — the same composition the harness's own
 * `packages/core/tools/tests/tools.spec.ts` approval suite uses.
 *
 * What it proves, in order of what the objective needs:
 *
 *   1. Approve (`allowed-once`)  -> the tool RUNS.  A human's click releases it.
 *   2. Reject  (`rejected`)      -> the tool is STOPPED, model told a human said no.
 *   3. No answerer at all        -> STOPPED anyway. `ask` is never less safe.
 *   4. `gateMode: 'deny'`        -> STOPPED, and the answerer is never consulted.
 *   5. The reason the answerer receives is the gate's own text — which is the
 *      string `ApprovalPanel.tsx` renders as the headline a human reads.
 *   6. Dashboard enabled, no tab -> the composer answerer still answers:
 *      byte-identical fallback, counted by the existing surface.
 *   7. Dashboard enabled, tab open, POST allow -> the tool RUNS and the
 *      composer answerer is never consulted: one surface wins, decided by the
 *      guard (a connected tab), not by listener order.
 *   8. Dashboard enabled, tab open, POST reject -> STOPPED, same as case 2.
 *   9. Dashboard enabled, no tab, no composer -> STOPPED: the dashboard never
 *      weakens fail-closed, it only participates when it can answer.
 *  10. Dashboard + stalled explainer, tab open, POST allow -> the tool RUNS:
 *      the brief is advisory and can never gate the approval.
 *  11. Dashboard + resolving explainer -> normalized brief nodes land on the
 *      pending card, built from the ask's own fields only.
 *
 * Cases 6–9 drive the exact HTTP code path the browser page calls
 * (`POST /api/approvals/:id`), so they are the browser checks minus the
 * rendering of the page itself — which docs/VERIFY-DASHBOARD.md records
 * separately. The one property NOT covered here is prepend against the Host's
 * remote forwarder: that forwarder only exists when a Web UI tab is attached
 * to a full harness host, so it needs the Docker/browser probe, not this
 * in-process composition.
 *
 * Runs under the harness's own vitest, from the harness checkout, because it
 * needs the harness packages. See docs/INTEGRATION-PLAN.md.
 *
 *   cd $DSH && npx vitest run <path-to-this-file>
 */

import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { createUserMessage, ToolCallId } from '@deepseek-ai/dsh-llm'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import AgentRegistry, { type Agent } from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import ApprovalService, { type ApprovalOutcome, type ApprovalRequest } from '@deepseek-ai/dsh-user-approval'
import Commands from '@deepseek-ai/dsh-commands'
import Goal from '@deepseek-ai/dsh-goal'
import ToolRuntime, { defineTool } from '@deepseek-ai/dsh-tools'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MockAdapter, textResponse, toolCallResponse } from '../../agent-loop/tests/mock-adapter.ts'

// The real plugin under test, resolved through this repo's package export.
// `test/integration/run.sh` rewrites ONLY these two import specifiers when it
// stages this file into the harness tree — every other import (including the
// dashboard types, re-exported through `plugin.ts`) must ride along with them.
import { apply as applyFeatureLoop } from '../../src/plugin.ts'
import * as CommandLoop from '../../src/command.ts'
import type { DashboardSnapshot } from '../../src/plugin.ts'
import type { LoopSpec } from '../../src/spec.ts'

const testToolSignal = new AbortController().signal

/**
 * `write_file` is classified `irreversible` and the spec declares a guard, so
 * the gate has something real to classify. No judge is configured anywhere in
 * this file, which is the point: with no confidence estimate the
 * `auto-if-confident` policy has no evidence and must ask.
 */
const SPEC: LoopSpec = {
  goal: 'the failing test passes and no other test breaks',
  sensor: ['repo files', 'test output'],
  controller: { ladder: [{ provider: 'p', model: 'm' }] },
  actuator: { write_file: 'irreversible' },
  feedback: 'all tests pass',
  termination: { successCommand: 'true', guards: ['error-cascade', 'tool-cycle'] },
  maxSteps: 20,
  costBudgetUSD: 5,
  prices: { 'p/m': { inputPerMTok: 1, outputPerMTok: 1 } },
}

const writeTool = defineTool({
  name: 'write_file',
  description: 'write a file',
  parameters: { path: { type: 'string' } },
  output: {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: value }],
  },
  async execute(args) {
    return `wrote ${args.path ?? ''}`
  },
})

function fakeAgent(): Agent {
  const session = Session.create(SessionId('feature-loop-approval-agent'))
  session.append('turn/start', { turn: 1 })
  return { session } as unknown as Agent
}

/** The dashboard's address and token, as parsed from its greppable log line. */
interface DashboardProbe {
  url: URL
  token: string
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms) })

async function waitForRunRecord(path: string): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 400; attempt++) {
    try {
      return JSON.parse(readFileSync(path, 'utf8').trim().split('\n').at(-1) ?? '{}') as Record<string, unknown>
    } catch {
      await sleep(10)
    }
  }
  throw new Error('run history record never landed')
}

/** Fetch `/api/state`; the same read the page makes over SSE. */
async function apiState(probe: DashboardProbe): Promise<DashboardSnapshot> {
  const res = await fetch(`${probe.url.origin}/api/state`, {
    headers: { 'x-dashboard-token': probe.token },
  })
  expect(res.status).toBe(200)
  return await res.json() as DashboardSnapshot
}

/**
 * Poll until the harness's ask has landed in the dashboard's queue.
 *
 * Polling, not a callback: the point of these cases is that the ask travelled
 * the REAL `ApprovalService.request` waterfall and only then arrived here —
 * an event of whose timing this test does not own.
 */
async function waitForPending(probe: DashboardProbe, count: number): Promise<DashboardSnapshot['pending']> {
  for (let attempt = 0; attempt < 400; attempt++) {
    const state = await apiState(probe)
    if (state.pending.length >= count) return state.pending
    await sleep(10)
  }
  throw new Error(`dashboard never received ${count} pending approval(s)`)
}

/** The exact call the browser's Allow/Reject buttons make. */
async function postDecision(
  probe: DashboardProbe,
  id: string,
  outcome: 'allowed-once' | 'rejected',
): Promise<Response> {
  return fetch(`${probe.url.origin}/api/approvals/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-dashboard-token': probe.token,
      origin: probe.url.origin,
    },
    body: JSON.stringify({ outcome }),
  })
}

/** Open an SSE tab — the connection that flips the answerer's guard on. */
async function openTab(probe: DashboardProbe): Promise<() => void> {
  const controller = new AbortController()
  const res = await fetch(
    `${probe.url.origin}/api/events?token=${encodeURIComponent(probe.token)}`,
    { signal: controller.signal },
  )
  expect(res.status).toBe(200)
  return () => controller.abort()
}

/**
 * A real DSH context with the feature-loop plugin mounted, plus a real
 * approval service and a real tool runtime.
 *
 * @param options - the plugin config: gate mode, gate policies, dashboard.
 * @returns the ready context, the disposer, and — when enabled — the
 * dashboard's probe. Tests that start a dashboard MUST call `dispose()`, or
 * the server outlives the test.
 */
async function featureLoopSetup(options: {
  gateMode?: 'ask' | 'deny'
  gatePolicies?: Record<string, 'auto' | 'auto-if-confident' | 'always-approve'>
  dashboard?: boolean
  explainer?: { explain: (input: unknown) => Promise<string | undefined> }
  spec?: LoopSpec
  history?: string
} = {}): Promise<{ ctx: Context, dispose: () => void, dashboard?: DashboardProbe }> {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(ApprovalService)
  ctx.tools.register(writeTool)

  // The startup line is printed from the `listening` event, AFTER `apply`
  // returns — so the console stays captured until it arrives, and `dispose`
  // is produced inside the same window. Restoring or asserting too early is
  // how this helper previously leaked servers and hung the suite.
  const lines: string[] = []
  const originalLog = console.log
  let dispose: () => void = () => {}
  let line: string | undefined
  try {
    if (options.dashboard === true) {
      console.log = (...args: unknown[]) => { lines.push(args.join(' ')) }
    }
    // The plugin under test. Returning `{kind:'ask'}` here is the whole change.
    dispose = applyFeatureLoop(ctx, {
      spec: options.spec ?? SPEC,
      gateMode: options.gateMode ?? 'ask',
      gatePolicies: options.gatePolicies ?? {},
      ...options.history === undefined ? {} : { optimize: { history: options.history } },
      ...options.explainer === undefined ? {} : { explainer: options.explainer as never },
      ...(options.dashboard === true ? { dashboard: { enabled: true, port: 0 } } : {}),
    })
    if (options.dashboard === true) {
      for (let attempt = 0; attempt < 300 && line === undefined; attempt++) {
        line = lines.find(text => text.startsWith('feature-loop dashboard: '))
        if (line === undefined) await sleep(10)
      }
    }
  } finally {
    console.log = originalLog
  }

  let dashboard: DashboardProbe | undefined
  if (line !== undefined) {
    const url = new URL(line.slice('feature-loop dashboard: '.length))
    dashboard = { url, token: url.searchParams.get('token') ?? '' }
  } else if (options.dashboard === true) {
    throw new Error('dashboard enabled but no "feature-loop dashboard:" line was logged')
  }
  return { ctx, dispose, dashboard }
}

describe('feature-loop gate inside a real DSH pipeline', () => {
  it('APPROVE: allowed-once lets the gated write run', async () => {
    const { ctx } = await featureLoopSetup()
    const seen: ApprovalRequest[] = []
    ctx.on('approval/request', (req) => {
      seen.push(req)
      return Promise.resolve<ApprovalOutcome>('allowed-once')
    })

    const result = await ctx.tools.execute({
      callId: ToolCallId('c-approve'),
      name: 'write_file',
      arguments: { path: '/tmp/x' },
      agent: fakeAgent(),
      signal: testToolSignal,
    })

    // The human approved, so the tool actually ran.
    expect(result.isError).toBe(false)
    expect(result.content[0]).toMatchObject({ text: 'wrote /tmp/x' })

    // And the human was asked exactly once, about this tool.
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ toolName: 'write_file', callId: 'c-approve' })

    // The reason is the gate's own text. ApprovalPanel.tsx renders
    // `pending.reason` as the headline, so this IS what a human reads.
    expect(seen[0]?.reason).toMatch(/REVIEW REQUESTED/)
    expect(seen[0]?.reason).toContain('write_file')
  })

  it('REJECT: a human refusal stops the write and tells the model', async () => {
    const { ctx } = await featureLoopSetup()
    ctx.on('approval/request', () => Promise.resolve<ApprovalOutcome>('rejected'))

    const result = await ctx.tools.execute({
      callId: ToolCallId('c-reject'),
      name: 'write_file',
      arguments: { path: '/tmp/y' },
      agent: fakeAgent(),
      signal: testToolSignal,
    })

    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({ text: 'Error: the user rejected tool "write_file"' })
  })

  it('FAIL CLOSED: with no answerer the ask still refuses', async () => {
    const { ctx } = await featureLoopSetup()
    // Deliberately register no `approval/request` answerer.

    const result = await ctx.tools.execute({
      callId: ToolCallId('c-none'),
      name: 'write_file',
      arguments: { path: '/tmp/z' },
      agent: fakeAgent(),
      signal: testToolSignal,
    })

    // This is the safety property: `ask` with no channel is exactly as safe as
    // `deny`. It must never silently proceed.
    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({
      text: 'Error: tool "write_file" requires approval, but no approval channel is available',
    })
  })

  it('UNATTENDED: gateMode deny refuses without ever consulting the answerer', async () => {
    const { ctx } = await featureLoopSetup({ gateMode: 'deny' })
    let asked = 0
    ctx.on('approval/request', () => {
      asked += 1
      return Promise.resolve<ApprovalOutcome>('allowed-once')
    })

    const result = await ctx.tools.execute({
      callId: ToolCallId('c-deny'),
      name: 'write_file',
      arguments: { path: '/tmp/w' },
      agent: fakeAgent(),
      signal: testToolSignal,
    })

    expect(result.isError).toBe(true)
    // Even an answerer willing to grant everything is never reached.
    expect(asked).toBe(0)
    expect(result.content[0]).toMatchObject({ text: expect.stringContaining('REVIEW REQUESTED') })
  })

  it('an auto tool is not gated at all', async () => {
    const { ctx } = await featureLoopSetup({
      gatePolicies: { write_file: 'auto' },
    })
    let asked = 0
    ctx.on('approval/request', () => {
      asked += 1
      return Promise.resolve<ApprovalOutcome>('allowed-once')
    })

    const result = await ctx.tools.execute({
      callId: ToolCallId('c-auto'),
      name: 'write_file',
      arguments: { path: '/tmp/a' },
      agent: fakeAgent(),
      signal: testToolSignal,
    })

    expect(result.isError).toBe(false)
    expect(asked).toBe(0)
  })

  it('DASHBOARD DELEGATE: enabled with no tab, the composer answerer still wins', async () => {
    const { ctx, dispose, dashboard } = await featureLoopSetup({ dashboard: true })
    try {
      expect(dashboard).toBeDefined()
      let composerAsked = 0
      ctx.on('approval/request', () => {
        composerAsked += 1
        return Promise.resolve<ApprovalOutcome>('allowed-once')
      })

      const result = await ctx.tools.execute({
        callId: ToolCallId('c-dash-delegate'),
        name: 'write_file',
        arguments: { path: '/tmp/dash-delegate' },
        agent: fakeAgent(),
        signal: testToolSignal,
      })

      // Byte-identical to the dashboard-doesn't-exist behaviour: the ask
      // travelled on to the registered answerer, the tool ran.
      expect(result.isError).toBe(false)
      expect(result.content[0]).toMatchObject({ text: 'wrote /tmp/dash-delegate' })
      expect(composerAsked).toBe(1, 'a dashboard with no tab open must delegate, not claim')
      expect((await apiState(dashboard!)).pending).toHaveLength(0)
    } finally {
      dispose()
    }
  })

  it('DASHBOARD APPROVE: a tab claims the ask, POST allow runs the tool, composer never consulted', async () => {
    const { ctx, dispose, dashboard } = await featureLoopSetup({ dashboard: true })
    try {
      expect(dashboard).toBeDefined()
      const closeTab = await openTab(dashboard!)
      let composerAsked = 0
      // Registered AFTER the dashboard's own listener — if precedence were
      // decided by registration order rather than by the guard, this
      // answerer would sit in the wrong place; either way it must not fire
      // once a tab has claimed.
      ctx.on('approval/request', () => {
        composerAsked += 1
        return Promise.resolve<ApprovalOutcome>('rejected')
      })

      const execution = ctx.tools.execute({
        callId: ToolCallId('c-dash-approve'),
        name: 'write_file',
        arguments: { path: '/tmp/dash-approve' },
        agent: fakeAgent(),
        signal: testToolSignal,
      })

      const pending = await waitForPending(dashboard!, 1)
      expect(pending[0]).toMatchObject({
        toolName: 'write_file',
        callId: 'c-dash-approve',
        runId: 'agentless',
      })
      // The gate's own text rides all the way to the queue the page renders.
      expect(pending[0]?.reason).toMatch(/REVIEW REQUESTED/)
      expect((await apiState(dashboard!)).answers).toBe(true)

      const res = await postDecision(dashboard!, pending[0]!.id, 'allowed-once')
      expect(res.status).toBe(200)

      const result = await execution
      expect(result.isError).toBe(false)
      expect(result.content[0]).toMatchObject({ text: 'wrote /tmp/dash-approve' })
      expect(composerAsked).toBe(0, 'one surface wins: the claimed ask never reaches the next listener')
      expect((await apiState(dashboard!)).pending).toHaveLength(0)
      closeTab()
    } finally {
      dispose()
    }
  })

  it('DASHBOARD REJECT: POST rejected stops the write, exactly like the composer reject', async () => {
    const { ctx, dispose, dashboard } = await featureLoopSetup({ dashboard: true })
    try {
      expect(dashboard).toBeDefined()
      const closeTab = await openTab(dashboard!)

      const execution = ctx.tools.execute({
        callId: ToolCallId('c-dash-reject'),
        name: 'write_file',
        arguments: { path: '/tmp/dash-reject' },
        agent: fakeAgent(),
        signal: testToolSignal,
      })

      const pending = await waitForPending(dashboard!, 1)
      const res = await postDecision(dashboard!, pending[0]!.id, 'rejected')
      expect(res.status).toBe(200)

      const result = await execution
      // Same observable as case 2: the human said no, the model is told so.
      expect(result.isError).toBe(true)
      expect(result.content[0]).toMatchObject({ text: 'Error: the user rejected tool "write_file"' })
      closeTab()
    } finally {
      dispose()
    }
  })

  it('DASHBOARD FAIL CLOSED: enabled with no tab and no composer still refuses', async () => {
    const { ctx, dispose, dashboard } = await featureLoopSetup({ dashboard: true })
    try {
      expect(dashboard).toBeDefined()
      // No tab and no other answerer: the dashboard's guard delegates into
      // the empty waterfall, which must land on the same refusal as case 3.
      const result = await ctx.tools.execute({
        callId: ToolCallId('c-dash-none'),
        name: 'write_file',
        arguments: { path: '/tmp/dash-none' },
        agent: fakeAgent(),
        signal: testToolSignal,
      })

      expect(result.isError).toBe(true)
      expect(result.content[0]).toMatchObject({
        text: 'Error: tool "write_file" requires approval, but no approval channel is available',
      })
      expect((await apiState(dashboard!)).pending).toHaveLength(0)
    } finally {
      dispose()
    }
  })

  it('DASHBOARD BRIEF: a stalled explainer never gates the approval', async () => {
    // The explainer hangs forever; the brief must stay `pending` while the
    // human's POST still settles the ask. This is the property the whole
    // brief feature leans on: advisory, never authoritative.
    const { ctx, dispose, dashboard } = await featureLoopSetup({
      dashboard: true,
      explainer: { explain: () => new Promise<string | undefined>(() => {}) },
    })
    try {
      expect(dashboard).toBeDefined()
      const closeTab = await openTab(dashboard!)

      const execution = ctx.tools.execute({
        callId: ToolCallId('c-dash-brief-stall'),
        name: 'write_file',
        arguments: { path: '/tmp/dash-brief-stall' },
        agent: fakeAgent(),
        signal: testToolSignal,
      })

      const pending = await waitForPending(dashboard!, 1)
      const res = await postDecision(dashboard!, pending[0]!.id, 'allowed-once')
      expect(res.status).toBe(200)

      const result = await execution
      expect(result.isError).toBe(false)
      expect(result.content[0]).toMatchObject({ text: 'wrote /tmp/dash-brief-stall' })
      closeTab()
    } finally {
      dispose()
    }
  })

  it('DASHBOARD BRIEF: a resolving explainer lands normalized nodes on the card', async () => {
    const seen: unknown[] = []
    const { ctx, dispose, dashboard } = await featureLoopSetup({
      dashboard: true,
      explainer: {
        explain: async (input: unknown) => {
          seen.push(input)
          // Plain prose now: there is no model-authored component language
          // after the move to assistant-ui.
          return '# write_file\n\nTouches one file.'
        },
      },
    })
    try {
      expect(dashboard).toBeDefined()
      const closeTab = await openTab(dashboard!)

      const execution = ctx.tools.execute({
        callId: ToolCallId('c-dash-brief-ready'),
        name: 'write_file',
        arguments: { path: '/tmp/dash-brief-ready' },
        agent: fakeAgent(),
        signal: testToolSignal,
      })

      const pending = await waitForPending(dashboard!, 1)
      // The explainer saw the ask's own fields — and nothing invented.
      expect(seen).toHaveLength(1)
      expect(seen[0]).toMatchObject({ toolName: 'write_file', callId: 'c-dash-brief-ready' })
      for (let attempt = 0; attempt < 400; attempt++) {
        const state = await apiState(dashboard!)
        if (state.pending[0]?.briefState === 'ready') break
        await sleep(10)
        if (attempt === 399) throw new Error('brief never reached ready')
      }
      const ready = await apiState(dashboard!)
      expect(ready.pending[0]?.brief).toEqual([
        { kind: 'heading', text: 'write_file' },
        { kind: 'paragraph', text: 'Touches one file.' },
      ])

      const res = await postDecision(dashboard!, pending[0]!.id, 'allowed-once')
      expect(res.status).toBe(200)
      const result = await execution
      expect(result.isError).toBe(false)
      closeTab()
    } finally {
      dispose()
    }
  })

  it('GOAL COMMAND: /loop creates and arms a native DSH goal without a direct followup', async () => {
    const { ctx, dispose } = await featureLoopSetup()
    try {
      await ctx.plugin(Commands)
      await ctx.plugin(Goal)
      await ctx.plugin(CommandLoop)
      const agent = await ctx.agentLoop.create(SessionId('goal-command'), { provider: 'mock', model: 'mock' })

      const execution = await ctx.commands.execute(agent, '/loop ship the queue', [], new AbortController().signal)
      expect(execution?.result.kind).toBe('success')
      const goal = ctx.goals.get(agent)
      expect(goal).toMatchObject({ phase: 'active', activation: 'armed' })
      expect(goal?.objective).toContain('ship the queue')
      expect(goal?.objective).toContain('independently verified')
      const events = agent.session.snapshotEvents()
      expect(events.filter(event => event.type === 'goal/change')).toHaveLength(1)
      expect(events.filter(event => event.type === 'user/message')).toHaveLength(0)
    } finally {
      dispose()
    }
  })

  it('BUDGET FINAL: a final text turn records real spend without inventing a stop', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-final-budget-'))
    const history = join(dir, 'runs.jsonl')
    const adapter = new MockAdapter([textResponse('done')])
    const { ctx, dispose } = await featureLoopSetup({
      spec: { ...SPEC, costBudgetUSD: 0.000001 },
      history,
    })
    try {
      ctx.llm.registerAdapter(['p'], adapter)
      const agent = await ctx.agentLoop.create(SessionId('budget-final'), { provider: 'mock', model: 'mock' })
      agent.followup(createUserMessage({ content: [{ type: 'text', text: 'finish' }], source: { kind: 'user' } }))
      await agent.whenIdle()
      const record = await waitForRunRecord(history)
      expect(adapter.requests).toHaveLength(1)
      expect(record.runId).toBe('budget-final#1')
      expect(record.steps).toBe(1)
      expect(record.costUSD).toBeGreaterThan(0)
      expect(record.outcome).toBe('goal-met')
    } finally {
      dispose()
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('BUDGET STOP: a priced first step blocks the second model request and records the veto', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-budget-stop-'))
    const history = join(dir, 'runs.jsonl')
    const adapter = new MockAdapter([
      toolCallResponse('cost-call', 'write_file', { path: '/tmp/cost' }),
      textResponse('must not run'),
    ])
    const { ctx, dispose } = await featureLoopSetup({
      spec: { ...SPEC, costBudgetUSD: 0.000001 },
      gatePolicies: { write_file: 'auto' },
      history,
    })
    try {
      ctx.llm.registerAdapter(['p'], adapter)
      const agent = await ctx.agentLoop.create(SessionId('budget-stop'), { provider: 'mock', model: 'mock' })
      agent.followup(createUserMessage({ content: [{ type: 'text', text: 'work' }], source: { kind: 'user' } }))
      await agent.whenIdle()
      const record = await waitForRunRecord(history)
      expect(adapter.requests).toHaveLength(1)
      expect(record.steps).toBe(1)
      expect(record.costUSD).toBeGreaterThan(0)
      expect(record.outcome).toBe('budget-stop')
    } finally {
      dispose()
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
