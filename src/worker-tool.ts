/**
 * The model-facing `dispatch_worker` tool.
 *
 * This is where the orchestrator's decision ("have xdev implement this") becomes
 * a process in a dsh terminal, and where the result comes back: the tool's return
 * value is the worker report, and a tool result is by construction a message in
 * the main session thread. There is no side channel to keep consistent.
 *
 * Loaded lazily by `plugin.ts` (`import()` inside a `ctx.inject(['tools',
 * 'terminals'], …)` scope) so the plugin's static import graph stays free of
 * `@deepseek-ai/dsh-tools`, which the strip-types CI job does not install.
 *
 * Gating is not done here. The tool is an `irreversible` actuator by default
 * (an unlisted tool resolves to `irreversible` in `resolveReversibility`), so
 * under `gateMode: ask` every dispatch goes to the operator with its arguments;
 * under `gateMode: auto` the YOLO envelope calls `checkDispatch` with a required
 * worktree root. This body re-checks anyway: the hook and the tool are two
 * layers, and the cheap one should not be the only one.
 *
 * @module dsh-feature-loop/worker-tool
 */

import { tmpdir } from 'node:os'

import { runWorker, terminalPortFor } from './worker-dispatch.ts'
import type { TerminalsService, WorkerEvent } from './worker-dispatch.ts'
import {
  MAX_TIMEOUT_SEC,
  WORKER_ROLES,
  WORKER_TOOL_NAME,
  checkDispatch,
  evidenceRoot,
  formatWorkerReport,
} from './workers.ts'
import type { WorkersConfig } from './workers.ts'

/** The slice of the harness context this module uses. */
export interface WorkerToolContext {
  tools: { register(definition: unknown): unknown }
  terminals: TerminalsService
}

/** Wiring from the plugin: where each agent's workspace is, and where events go. */
export interface WorkerToolDeps {
  config: WorkersConfig
  /** The agent's containment root (its YOLO worktree), when it has one. */
  worktreeRootFor(agent: unknown): string | undefined
  /** The agent's session workspace, used when the call names no `cwd`. */
  cwdFor(agent: unknown): string | undefined
  /** Lifecycle events, for the dashboard feed. */
  onEvent?(agent: unknown, event: WorkerEvent): void
}

/**
 * Register `dispatch_worker` on the context's tool registry.
 *
 * @param ctx - a context carrying `tools` and `terminals`.
 * @param deps - the config and the per-agent lookups.
 */
export async function registerWorkerTool(ctx: WorkerToolContext, deps: WorkerToolDeps): Promise<void> {
  const { defineTool } = await import('@deepseek-ai/dsh-tools')
  const { config } = deps

  ctx.tools.register(defineTool({
    name: WORKER_TOOL_NAME,
    description: [
      'Hand one bounded job to an external coding CLI running in a dsh terminal, and get its report back.',
      `Workers: ${config.allow.join(', ')}. Roles: implement (change code and tests), test (run and fix tests), validate (independent read-only review that ends in VERDICT: PASS or FAIL).`,
      'The worker starts in the run\'s workspace, cannot commit or push, and runs without a human watching, so give it a complete brief: the goal, the files to look at, and how success is checked.',
      'The report is the worker\'s own account. Verify it (run the tests, read the diff) before treating the phase as done.',
    ].join(' '),
    parameters: {
      worker: { type: 'string', required: true, enum: config.allow, description: 'Which coding CLI to run.' },
      role: { type: 'string', required: true, enum: WORKER_ROLES, description: 'What the worker is for.' },
      task: { type: 'string', required: true, description: 'The complete brief for the worker.' },
      cwd: { type: 'string', description: 'Directory to start in, inside the workspace. Defaults to the workspace root.' },
      timeoutSec: { type: 'integer', description: `Wall-clock limit in seconds (default ${config.timeoutSec}, at most ${MAX_TIMEOUT_SEC}).` },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    // Two implementers editing one worktree race; a tester or validator beside
    // an implementer reads files mid-edit. Only the read-mostly roles overlap.
    isConcurrencySafe: args => args.role !== 'implement',
    // Declarative: the deadline is enforced by `runWorker` itself.
    timeoutMs: (MAX_TIMEOUT_SEC + 60) * 1000,
    async execute(args, exec) {
      const owner = exec.agent
      if (owner === undefined) throw new Error(`${WORKER_TOOL_NAME} requires an owning agent session`)

      const worktreeRoot = deps.worktreeRootFor(owner)
      const defaultCwd = deps.cwdFor(owner)
      const checked = checkDispatch(args, {
        allow: config.allow,
        timeoutSec: config.timeoutSec,
        ...worktreeRoot === undefined ? {} : { worktreeRoot },
        ...defaultCwd === undefined ? {} : { defaultCwd },
      })
      if (!checked.ok) throw new Error(`${WORKER_TOOL_NAME} refused: ${checked.reason}`)

      const port = terminalPortFor(ctx.terminals, owner, config.backendType)
      const result = await runWorker(port, checked.request, {
        evidenceRoot: evidenceRoot(worktreeRoot, tmpdir()),
        config,
        signal: exec.signal,
        onEvent: event => deps.onEvent?.(owner, event),
      })
      return formatWorkerReport(result)
    },
    presentCall: args => ({
      card: 'terminal',
      title: `${args.worker} · ${args.role}`,
    }),
  }))
}
