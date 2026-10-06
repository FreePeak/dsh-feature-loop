/**
 * The `dispatch_worker` tool and its wiring into the plugin.
 *
 * Needs the harness's `@deepseek-ai/dsh-tools` (the tool is built with its real
 * `defineTool`), so like `plugin-approval.test.ts` it runs locally against the
 * installed packages and is not in the no-install CI list.
 *
 * Run: `node --experimental-strip-types --test test/worker-tool.test.ts`
 */

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'

import { apply, createPolicy, gateEnforce, gateForTool } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'
import { registerWorkerTool } from '../src/worker-tool.ts'
import type { WorkerToolContext, WorkerToolDeps } from '../src/worker-tool.ts'
import type { TerminalsService, WorkerEvent } from '../src/worker-dispatch.ts'
import { WORKER_TOOL_NAME, parseWorkersConfig } from '../src/workers.ts'
import { ShellPort, stubCli } from './worker-rig.ts'

/** The slice of a tool definition the tests drive. */
interface Definition {
  name: string
  description: string
  parameters: { properties: Record<string, { enum?: string[] }>, required: string[] }
  isConcurrencySafe(args: Record<string, unknown>): boolean
  timeoutMs: number
  execute(args: Record<string, unknown>, exec: Record<string, unknown>): Promise<string>
}

/** `ctx.terminals` over a port that runs the typed line in a real shell. */
function terminalsOver(port: ShellPort): TerminalsService {
  return {
    async spawn(_owner, request) {
      return port.open({ name: request.name ?? 'w', cwd: request.cwd ?? '', signal: new AbortController().signal })
    },
    startSend(_owner, id, request) {
      const done = port.send(id, request.text, { submit: request.submit ?? false, signal: request.signal ?? new AbortController().signal })
        .then(r => ({ waitReason: r.waitReason, sessionStatus: { kind: r.exited ? 'exited' : 'running' } }))
      return { done }
    },
    read(_owner, id, request) {
      return { text: port.read(id, request?.count ?? 100) }
    },
    async signal() { await port.interrupt() },
    async kill(_owner, id) { await port.close(id) },
  }
}

interface Rig {
  port: ShellPort
  work: string
  definition: Definition
  events: WorkerEvent[]
  owner: object
}

const ports: ShellPort[] = []
afterEach(() => {
  for (const p of ports.splice(0)) void p.close('cleanup')
})

async function rig(overrides: Partial<WorkerToolDeps> = {}, config: Record<string, unknown> = {}): Promise<Rig> {
  const root = mkdtempSync(join(tmpdir(), 'fl-tool-'))
  const bin = join(root, 'bin')
  const work = join(root, 'work')
  mkdirSync(bin)
  mkdirSync(work)
  for (const name of ['xdev', 'claude', 'opencode']) stubCli(bin, name)
  const port = new ShellPort(work, bin)
  ports.push(port)
  let definition: Definition | undefined
  const ctx: WorkerToolContext = {
    tools: { register(d) { definition = d as Definition } },
    terminals: terminalsOver(port),
  }
  const events: WorkerEvent[] = []
  await registerWorkerTool(ctx, {
    config: parseWorkersConfig({ enabled: true, timeoutSec: 20, ...config }),
    worktreeRootFor: () => work,
    cwdFor: () => work,
    onEvent: (_agent, event) => events.push(event),
    ...overrides,
  })
  assert.ok(definition !== undefined, 'the tool was registered')
  return { port, work, definition, events, owner: { id: 'agent-1' } }
}

describe('registerWorkerTool', () => {
  it('registers dispatch_worker with a closed vocabulary the model cannot widen', async () => {
    const { definition } = await rig({}, { allow: ['xdev', 'claude'] })
    assert.equal(definition.name, WORKER_TOOL_NAME)
    assert.deepEqual(definition.parameters.properties.worker!.enum, ['xdev', 'claude'])
    assert.deepEqual(definition.parameters.properties.role!.enum, ['implement', 'test', 'validate'])
    assert.deepEqual(definition.parameters.required, ['worker', 'role', 'task'])
    assert.match(definition.description, /dsh terminal/)
    assert.match(definition.description, /Verify it/)
  })

  it('lets only the read-mostly roles overlap with their siblings', async () => {
    const { definition } = await rig()
    const call = (role: string) => definition.isConcurrencySafe({ worker: 'xdev', role, task: 'x' })
    assert.equal(call('implement'), false)
    assert.equal(call('test'), true)
    assert.equal(call('validate'), true)
  })

  it('declares a tool timeout above the longest worker, so the registry never cuts one short', async () => {
    const { definition } = await rig()
    assert.ok(definition.timeoutMs > 3_600 * 1000)
  })

  it('runs a worker in the terminal and returns the report as the tool result', async () => {
    const { definition, owner, port, events } = await rig()
    const report = await definition.execute(
      { worker: 'xdev', role: 'implement', task: 'add the flag' },
      { agent: owner, signal: new AbortController().signal },
    )
    assert.match(report, /^\[worker report\] xdev · implement · COMPLETED \(exit 0\)/)
    assert.match(report, /did the work/)
    assert.match(report, /terminal: pty-1/)
    assert.deepEqual(port.closed, ['pty-1'], 'the terminal is closed when the worker is done')
    assert.deepEqual(events.map(e => e.kind), ['start', 'end'])
  })

  it('reports a failing worker as a result, not as a tool error', async () => {
    const { definition, owner } = await rig()
    const report = await definition.execute(
      { worker: 'claude', role: 'test', task: 'STUB_FAIL' },
      { agent: owner, signal: new AbortController().signal },
    )
    assert.match(report, /claude · test · FAILED \(exit 3\)/)
    assert.match(report, /tests failed: 2/)
  })

  it('refuses a directory outside the workspace and a call with no owning agent', async () => {
    const { definition, owner } = await rig()
    const exec = { agent: owner, signal: new AbortController().signal }
    await assert.rejects(
      definition.execute({ worker: 'xdev', role: 'implement', task: 'x', cwd: '/etc' }, exec),
      /dispatch_worker refused: .*outside the run's worktree/,
    )
    await assert.rejects(
      definition.execute({ worker: 'xdev', role: 'implement', task: 'x' }, { signal: new AbortController().signal }),
      /requires an owning agent session/,
    )
  })

  it('refuses a CLI the deployment did not allow: at the schema, and again in the body', async () => {
    const { definition, owner } = await rig({}, { allow: ['xdev'] })
    // The schema's enum stops it first…
    await assert.rejects(
      definition.execute({ worker: 'claude', role: 'test', task: 'x' }, { agent: owner, signal: new AbortController().signal }),
      /"worker" must be one of \["xdev"\]/,
    )
    // …and the body would refuse it anyway if a caller got past the schema.
    const { checkDispatch } = await import('../src/workers.ts')
    const r = checkDispatch({ worker: 'claude', role: 'test', task: 'x' }, { worktreeRoot: '/w', allow: ['xdev'] })
    assert.equal(r.ok, false)
  })

  it('hands the validator read-only flags and returns its verdict', async () => {
    const { definition, owner } = await rig()
    const report = await definition.execute(
      { worker: 'opencode', role: 'validate', task: 'STUB_VALIDATE' },
      { agent: owner, signal: new AbortController().signal },
    )
    assert.match(report, /verdict: FAIL/)
    assert.match(report, /stub opencode argv: run --agent plan/)
    assert.match(report, /second opinion, not the gate/)
  })
})

describe('apply wiring', () => {
  type Handler = (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>

  function fakeCtx() {
    const injected: { deps: string[], callback: (inner: unknown) => Promise<void> | void }[] = []
    const ctx = {
      on(_event: string, _fn: Handler): () => void { return () => undefined },
      inject(deps: string[], callback: (inner: unknown) => Promise<void> | void): void {
        injected.push({ deps, callback })
      },
    }
    return { ctx, injected }
  }

  const base: CreatePolicyOptions = { dashboard: { enabled: false } } as CreatePolicyOptions

  it('registers nothing without a workers block, or with one that is not enabled', () => {
    for (const workers of [undefined, {}, { enabled: false, allow: ['xdev'] }]) {
      const { ctx, injected } = fakeCtx()
      const dispose = apply(ctx as never, { ...base, ...workers === undefined ? {} : { workers } })
      assert.equal(injected.length, 0, JSON.stringify(workers))
      dispose()
    }
  })

  it('asks for the tool registry and the terminal service, and registers the tool inside that scope', async () => {
    const { ctx, injected } = fakeCtx()
    const dispose = apply(ctx as never, { ...base, workers: { enabled: true } })
    assert.equal(injected.length, 1)
    assert.deepEqual(injected[0]!.deps, ['tools', 'terminals'])

    let registered: Definition | undefined
    await injected[0]!.callback({
      tools: { register(d: unknown) { registered = d as Definition } },
      terminals: {},
    })
    assert.equal(registered?.name, WORKER_TOOL_NAME)
    dispose()
  })

  it('fails the load on a bad workers block instead of widening it', () => {
    const { ctx } = fakeCtx()
    assert.throws(() => apply(ctx as never, { ...base, workers: { enabled: true, alow: ['xdev'] } as never }), /not a known field/)
  })

  it('a context without ctx.inject still loads: the tool is simply absent', () => {
    const ctx = { on: () => () => undefined }
    assert.doesNotThrow(() => apply(ctx as never, { ...base, workers: { enabled: true } })())
  })
})

describe('the gate and dispatch_worker', () => {
  const SPEC: NonNullable<CreatePolicyOptions['spec']> = {
    goal: 'Ship the fix with a passing test.',
    sensor: ['test output'],
    controller: { ladder: [{ model: 'cheap' }] },
    actuator: { read_file: 'read' },
    feedback: 'the suite passes',
    termination: { successCommand: 'npm test', guards: ['no-progress'] },
    maxSteps: 8,
    costBudgetUSD: 1,
    prices: {},
  }
  const work = '/tmp/fl-gate/worktree'

  it('is irreversible unless the spec says otherwise, so a supervised run asks a human first', () => {
    const policy = createPolicy({ spec: SPEC, gateMode: 'ask', workers: { enabled: true } })
    assert.equal(gateForTool(policy, WORKER_TOOL_NAME).kind, 'ask')
  })

  it('under YOLO the envelope lets a worker start inside the worktree and nowhere else', () => {
    const policy = createPolicy({
      spec: SPEC,
      gateMode: 'auto',
      workers: { enabled: true, allow: ['xdev'] },
      worktree: { worktreeRoot: work, branch: 'fl/x', stopSentinel: join(work, '.feature-loop', 'STOP') },
    })
    const ok = (args: unknown) => gateEnforce(policy, WORKER_TOOL_NAME, args, false).kind
    assert.equal(ok({ worker: 'xdev', role: 'implement', task: 'x' }), 'proceed')
    assert.equal(ok({ worker: 'xdev', role: 'implement', task: 'x', cwd: `${work}/sub` }), 'proceed')
    assert.equal(ok({ worker: 'xdev', role: 'implement', task: 'x', cwd: '/' }), 'deny')
    assert.equal(ok({ worker: 'claude', role: 'implement', task: 'x' }), 'deny', 'claude is not on this deployment\'s allow-list')
    assert.equal(gateEnforce(policy, WORKER_TOOL_NAME, { worker: 'xdev', role: 'test', task: 'x' }, true).kind, 'deny', 'the kill switch stops dispatches too')
  })

  it('under YOLO with no worktree, a dispatch is denied: there is nothing to contain it', () => {
    const policy = createPolicy({ spec: SPEC, gateMode: 'auto', workers: { enabled: true } })
    assert.equal(gateEnforce(policy, WORKER_TOOL_NAME, { worker: 'xdev', role: 'test', task: 'x' }, false).kind, 'deny')
  })
})
