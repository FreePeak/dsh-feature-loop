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
 *
 * Runs under the harness's own vitest, from the harness checkout, because it
 * needs the harness packages. See docs/INTEGRATION-PLAN.md.
 *
 *   cd $DSH && npx vitest run <path-to-this-file>
 */

import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { ToolCallId } from '@deepseek-ai/dsh-llm'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import AgentRegistry, { type Agent } from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import ApprovalService, { type ApprovalOutcome, type ApprovalRequest } from '@deepseek-ai/dsh-user-approval'
import ToolRuntime, { defineTool } from '@deepseek-ai/dsh-tools'

// The real plugin under test, resolved through this repo's package export.
import { apply as applyFeatureLoop } from '../../src/plugin.ts'
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

/**
 * A real DSH context with the feature-loop plugin mounted, plus a real
 * approval service and a real tool runtime.
 *
 * @param options - the plugin config: gate mode and gate policies.
 * @returns the ready context.
 */
async function featureLoopSetup(options: {
  gateMode?: 'ask' | 'deny'
  gatePolicies?: Record<string, 'auto' | 'auto-if-confident' | 'always-approve'>
} = {}): Promise<Context> {
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

  // The plugin under test. Returning `{kind:'ask'}` here is the whole change.
  applyFeatureLoop(ctx, {
    spec: SPEC,
    gateMode: options.gateMode ?? 'ask',
    gatePolicies: options.gatePolicies ?? {},
  })
  return ctx
}

describe('feature-loop gate inside a real DSH pipeline', () => {
  it('APPROVE: allowed-once lets the gated write run', async () => {
    const ctx = await featureLoopSetup()
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
    const ctx = await featureLoopSetup()
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
    const ctx = await featureLoopSetup()
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
    const ctx = await featureLoopSetup({ gateMode: 'deny' })
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
    const ctx = await featureLoopSetup({
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
})
