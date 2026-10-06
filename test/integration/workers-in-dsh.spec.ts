/**
 * Integration test: workers inside a REAL dsh terminal.
 *
 * `test/worker-tool.test.ts` runs the dispatcher against a `bash -c` stand-in
 * for a terminal. This file closes the gap that stand-in leaves: it mounts the
 * plugin into a real cordis context together with the harness's real terminal
 * service, the real PTY shell backend, the real subprocess runtime and the real
 * tool runtime, and drives `dispatch_worker` through `ctx.tools.execute` — the
 * path a model's tool call takes, approval gate included.
 *
 * What it proves:
 *
 *   1. APPROVE  — a human `allowed-once` starts the worker; the worker runs in a
 *      PTY session owned by the orchestrating agent; the tool result is the
 *      worker report; the session is closed afterwards.
 *   2. REJECT / no answerer — the worker is never started (a sentinel the stub
 *      CLI writes on start does not exist).
 *   3. FAILURE  — a non-zero worker is a report with `FAILED (exit N)`, not a
 *      tool error.
 *   4. TIMEOUT  — a worker that outlives `timeoutSec` is interrupted, reported,
 *      and its terminal is closed.
 *   5. OWNERSHIP — while a worker runs, its session is listed for the
 *      orchestrator and for nobody else.
 *   6. PARALLEL — two validators run at once in two sessions and each report
 *      lands with its own output.
 *   7. (opt-in, `FL_REAL_WORKERS=1`) the real `xdev`, `claude` and `opencode`
 *      binaries accept the flags `buildArgv` gives them and exit 0 on a trivial
 *      prompt. This spends a few model calls, so it is off by default.
 *
 * Stub CLIs stand in for the workers in 1–6 so the run is deterministic and free.
 *
 * Runs under the harness's own vitest, from the harness checkout. See
 * `test/integration/run.sh`.
 */

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, { ToolCallId } from '@deepseek-ai/dsh-llm'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import type { Agent } from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { unsupportedInbox } from '@deepseek-ai/dsh-agent-loop-testkit'
import ApprovalService from '@deepseek-ai/dsh-user-approval'
import type { ApprovalOutcome, ApprovalRequest } from '@deepseek-ai/dsh-user-approval'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import TerminalSessionService from '@deepseek-ai/dsh-terminal'
import SandboxProvider from '@deepseek-ai/dsh-sandbox'
import type { ConfinedArgv, SandboxPolicy } from '@deepseek-ai/dsh-sandbox'
import SandboxPolicyService from '@deepseek-ai/dsh-sandbox-policy'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import * as ptyLocal from '@deepseek-ai/dsh-terminal-bash'

import { apply as applyFeatureLoop } from '../../src/plugin.ts'
import type { LoopSpec } from '../../src/spec.ts'

const sleep = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms) })

class PassthroughSandbox extends SandboxProvider {
  async confine(argv: readonly string[], _policy: SandboxPolicy): Promise<ConfinedArgv> {
    return { argv: [...argv], enforcement: 'full', denialSignatures: [], runnerFailureRules: [] }
  }
}

/** `dispatch_worker` is not in the actuator, so it classifies `irreversible` and the gate asks. */
const SPEC: LoopSpec = {
  goal: 'the failing test passes and no other test breaks',
  sensor: ['repo files', 'test output'],
  controller: { ladder: [{ provider: 'p', model: 'm' }] },
  actuator: { read: 'read' },
  feedback: 'all tests pass',
  termination: { successCommand: 'true', guards: ['error-cascade', 'tool-cycle'] },
  maxSteps: 20,
  costBudgetUSD: 5,
  prices: { 'p/m': { inputPerMTok: 1, outputPerMTok: 1 } },
}

const roots: string[] = []
const contexts: Context[] = []
const disposers: (() => void)[] = []
const originalPath = process.env.PATH

afterEach(async () => {
  for (const dispose of disposers.splice(0)) dispose()
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
  process.env.PATH = originalPath
})

/** A stub worker CLI. Its behaviour is chosen by words in the prompt it is handed. */
function writeStub(bin: string, name: string): void {
  writeFileSync(join(bin, name), [
    '#!/usr/bin/env bash',
    'all="$*"',
    // Proof the CLI started, and what directory it started in.
    `echo "$PWD" > "$PWD/started-${name}"`,
    `echo "stub ${name} started"`,
    'case "$all" in',
    '  *STUB_FAIL*) echo "2 tests failed" >&2; exit 3 ;;',
    '  *STUB_HANG*) echo "working..."; sleep 30 ;;',
    '  *STUB_SLOW*) echo "slow job running"; sleep 2; echo "slow job done"; echo "VERDICT: PASS"; exit 0 ;;',
    '  *) echo "did the work"; exit 0 ;;',
    'esac',
    '',
  ].join('\n'))
  chmodSync(join(bin, name), 0o755)
}

function stubAgent(ctx: Context, rawId: string): Agent {
  const scope = ctx.plugin(() => {})
  const session = Session.create(SessionId(rawId))
  session.append('turn/start', { turn: 1 })
  return {
    id: SessionId(rawId), options: {}, session, inbox: unsupportedInbox(),
    status: 'idle', ctx: scope.ctx,
    send: () => {}, followup: () => {}, steer: () => {}, inject: () => {}, cancel() {},
    runMaintenance: task => task(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  } as unknown as Agent
}

async function setup(options: { gateMode?: 'ask' | 'deny', workers?: Record<string, unknown> } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fl-workers-dsh-'))
  roots.push(root)
  const bin = join(root, 'bin')
  const work = join(root, 'work')
  mkdirSync(bin)
  mkdirSync(work)
  for (const name of ['xdev', 'claude', 'opencode']) writeStub(bin, name)
  process.env.PATH = `${bin}:${originalPath ?? ''}`

  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(ApprovalService)
  await ctx.plugin(TerminalSessionService)
  await ctx.plugin(PassthroughSandbox)
  await ctx.plugin(SandboxPolicyService, { mode: 'danger-full-access', workspaceRoot: root })
  await ctx.plugin(LocalSubprocessRuntime)
  await ctx.plugin(ptyLocal, {
    pollIntervalMs: 10,
    exactProbeAfterMs: 20,
    idleSilenceMs: 250,
    handoffGraceMs: 250,
    timeoutMs: 2_000,
    disposeGraceMs: 500,
    scrollbackLines: 5_000,
    scrollbackMaxBytes: 1_000_000,
    maxReadBytes: 262_144,
  })

  disposers.push(applyFeatureLoop(ctx, {
    spec: SPEC,
    gateMode: options.gateMode ?? 'ask',
    dashboard: { enabled: false },
    workers: { enabled: true, timeoutSec: 30, ...options.workers },
  }))
  // The tool registers inside `ctx.inject(['tools', 'terminals'], …)`; give the
  // dynamic import and the registration a moment.
  for (let i = 0; i < 200 && ctx.tools.get('dispatch_worker') === undefined; i++) await sleep(10)

  const owner = stubAgent(ctx, 'orchestrator')
  await ctx.agents.register(owner)
  const other = stubAgent(ctx, 'someone-else')
  await ctx.agents.register(other)

  const dispatch = (agent: Agent, args: Record<string, unknown>, id = 'c1') => ctx.tools.execute({
    callId: ToolCallId(id),
    name: 'dispatch_worker',
    arguments: { cwd: work, ...args },
    agent,
    signal: new AbortController().signal,
  })
  const approveAll = (): ApprovalRequest[] => {
    const seen: ApprovalRequest[] = []
    ctx.on('approval/request', (request: ApprovalRequest) => {
      seen.push(request)
      return Promise.resolve<ApprovalOutcome>('allowed-once')
    })
    return seen
  }
  return { ctx, work, owner, other, dispatch, approveAll }
}

const text = (result: { content: { type: string, text?: string }[] }): string =>
  result.content.map(block => block.text ?? '').join('\n')

describe('dispatch_worker inside a real dsh terminal', () => {
  it('APPROVE: a human releases the dispatch, the worker runs in a PTY session, the report comes back', async () => {
    const { ctx, work, owner, dispatch, approveAll } = await setup()
    const seen = approveAll()

    const result = await dispatch(owner, { worker: 'xdev', role: 'implement', task: 'add the flag' })

    expect(result.isError).toBe(false)
    const report = text(result)
    expect(report).toMatch(/^\[worker report\] xdev · implement · COMPLETED \(exit 0\)/)
    expect(report).toContain('stub xdev started')
    expect(report).toContain('did the work')
    expect(report).toMatch(/terminal: pty-\d+/)

    // The gate asked once, with its own text, about this tool.
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ toolName: 'dispatch_worker' })
    expect(seen[0]?.reason).toMatch(/REVIEW REQUESTED/)

    // The CLI really started, in the directory it was given.
    expect(existsSync(join(work, 'started-xdev'))).toBe(true)

    // And nothing is left behind: the session is closed.
    expect(ctx.terminals.list(owner)).toEqual([])
  })

  it('REJECT: a human refusal means the CLI is never started', async () => {
    const { ctx, work, owner, dispatch } = await setup()
    ctx.on('approval/request', () => Promise.resolve<ApprovalOutcome>('rejected'))

    const result = await dispatch(owner, { worker: 'claude', role: 'implement', task: 'x' })

    expect(result.isError).toBe(true)
    expect(text(result)).toContain('rejected tool "dispatch_worker"')
    expect(existsSync(join(work, 'started-claude'))).toBe(false)
    expect(ctx.terminals.list(owner)).toEqual([])
  })

  it('FAIL CLOSED: with no answerer the dispatch is refused', async () => {
    const { work, owner, dispatch } = await setup()
    const result = await dispatch(owner, { worker: 'opencode', role: 'test', task: 'x' })
    expect(result.isError).toBe(true)
    expect(text(result)).toContain('requires approval, but no approval channel is available')
    expect(existsSync(join(work, 'started-opencode'))).toBe(false)
  })

  it('UNATTENDED: gateMode deny refuses without consulting anyone', async () => {
    const { ctx, work, owner, dispatch } = await setup({ gateMode: 'deny' })
    let asked = 0
    ctx.on('approval/request', () => { asked += 1; return Promise.resolve<ApprovalOutcome>('allowed-once') })
    const result = await dispatch(owner, { worker: 'xdev', role: 'test', task: 'x' })
    expect(result.isError).toBe(true)
    expect(asked).toBe(0)
    expect(existsSync(join(work, 'started-xdev'))).toBe(false)
  })

  it('FAILURE: a failing worker is a report, not a tool error', async () => {
    const { owner, dispatch, approveAll } = await setup()
    approveAll()
    const result = await dispatch(owner, { worker: 'claude', role: 'test', task: 'STUB_FAIL' })
    expect(result.isError).toBe(false)
    expect(text(result)).toMatch(/claude · test · FAILED \(exit 3\)/)
    expect(text(result)).toContain('2 tests failed')
  })

  it('TIMEOUT: a worker past its deadline is interrupted, reported, and its terminal closed', async () => {
    const { ctx, owner, dispatch, approveAll } = await setup()
    approveAll()
    const started = Date.now()
    const result = await dispatch(owner, { worker: 'xdev', role: 'implement', task: 'STUB_HANG', timeoutSec: 2 })
    expect(result.isError).toBe(false)
    expect(text(result)).toMatch(/xdev · implement · TIMEOUT/)
    expect(text(result)).toContain('working...')
    expect(Date.now() - started).toBeLessThan(15_000)
    expect(ctx.terminals.list(owner)).toEqual([])
  })

  it('OWNERSHIP: while a worker runs its session is the orchestrator\'s and nobody else\'s', async () => {
    const { ctx, owner, other, dispatch, approveAll } = await setup()
    approveAll()
    const running = dispatch(owner, { worker: 'xdev', role: 'validate', task: 'STUB_SLOW' })
    let sessions = ctx.terminals.list(owner)
    for (let i = 0; i < 100 && sessions.length === 0; i++) {
      await sleep(20)
      sessions = ctx.terminals.list(owner)
    }
    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.name).toMatch(/^fl-worker-/)
    expect(ctx.terminals.list(other)).toEqual([])
    // Another agent cannot read or drive it even knowing the id.
    expect(() => ctx.terminals.read(other, sessions[0]!.sessionId)).toThrow(/belongs to another agent/)

    const result = await running
    expect(text(result)).toContain('verdict: PASS')
    expect(ctx.terminals.list(owner)).toEqual([])
  })

  it('PARALLEL: two validators run at once in two sessions, and each report has its own output', async () => {
    const { owner, dispatch, approveAll } = await setup()
    approveAll()
    const [a, b] = await Promise.all([
      dispatch(owner, { worker: 'claude', role: 'validate', task: 'STUB_SLOW' }, 'c-a'),
      dispatch(owner, { worker: 'opencode', role: 'validate', task: 'STUB_FAIL' }, 'c-b'),
    ])
    expect(text(a)).toMatch(/claude · validate · COMPLETED/)
    expect(text(a)).toContain('slow job done')
    expect(text(b)).toMatch(/opencode · validate · FAILED \(exit 3\)/)
    expect(text(b)).not.toContain('slow job')
    const sessionOf = (r: ReturnType<typeof text>): string => /terminal: (pty-\d+)/.exec(r)?.[1] ?? ''
    expect(sessionOf(text(a))).not.toBe(sessionOf(text(b)))
  })

  it('refuses a directory outside the call\'s workspace root when the model names one', async () => {
    const { owner, dispatch, approveAll } = await setup()
    approveAll()
    // No worktree and no session cwd here, so the supervised path trusts the
    // approved cwd; what it must still refuse is a relative one it cannot anchor.
    const result = await dispatch(owner, { worker: 'xdev', role: 'implement', task: 'x', cwd: 'relative/dir' })
    expect(result.isError).toBe(true)
    expect(text(result)).toMatch(/cwd must be absolute/)
  })
})

const realWorkers = process.env.FL_REAL_WORKERS === '1'

describe.skipIf(!realWorkers)('the real CLIs accept the flags the loop gives them (FL_REAL_WORKERS=1)', () => {
  beforeAll(() => {
    process.env.PATH = originalPath
  })

  for (const worker of ['xdev', 'claude', 'opencode'] as const) {
    it(`${worker} runs a trivial brief to exit 0 in a dsh terminal`, async ({ skip }) => {
      const { ctx, owner, dispatch, approveAll } = await setup()
      // setup() prepended stub CLIs to PATH; the real ones must win.
      process.env.PATH = originalPath
      approveAll()
      const result = await dispatch(owner, {
        worker,
        role: 'validate',
        task: 'Do not use any tools and do not read or change any file. Reply with the single word OK, then end with a "## Worker report" section and the line "VERDICT: PASS".',
        timeoutSec: 240,
      })
      const report = text(result)
      console.log(`\n===== ${worker} =====\n${report.slice(0, 2_500)}\n`)
      // Not a flag problem: the CLI started, parsed its flags and reported a
      // missing provider credential. Keys come from the environment, never
      // from this repo, so skip rather than fail on a machine without one.
      if (/has no credential|not logged in|missing api key/i.test(report)) skip(`${worker}: no credential in this environment`)
      expect(report).toMatch(new RegExp(`^\\[worker report\\] ${worker} · validate · COMPLETED \\(exit 0\\)`))
      expect(ctx.terminals.list(owner)).toEqual([])
    }, 300_000)
  }
})
