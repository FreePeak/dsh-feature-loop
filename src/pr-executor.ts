/**
 * DSH-shell execution boundary for fixed PR/merge command plans.
 *
 * The executor never invokes `gh` directly and never builds a shell string from
 * raw user input: validated plan arguments are POSIX-quoted exactly once, then
 * the command is sent through the host's sandbox-aware shell service.
 */

import { verifyLoopCompletion } from './goal-loop.ts'
import type { LoopVerificationResult } from './goal-loop.ts'
import { authorizeMerge } from './pr-gate.ts'
import type { CommandPlan, MergeApproval, MergePlan, PullRequestPlan } from './pr-gate.ts'

export interface ShellService {
  resolve(request: Record<string, unknown>): unknown
  execute(spec: unknown): Promise<{ result(): Promise<LoopVerificationResult> }>
}

export interface PullRequestApproval {
  claimId: string
  scope: 'create-pull-request'
  approvedAt: number
}

export interface FixedCommandSuccess {
  kind: 'allow'
  result: LoopVerificationResult
}

export interface FixedCommandFailure {
  kind: 'deny'
  reason: string
}

function shellQuote(value: string): string {
  return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`
}

function commandLine(plan: CommandPlan): string {
  return [plan.executable, ...plan.args].map(shellQuote).join(' ')
}

function sandboxRequest(policy: unknown): Record<string, unknown> {
  return policy === undefined ? {} : { sandboxPolicy: policy }
}

/** Execute a validated plan through DSH shell and fail closed on any bad exit. */
export async function executeCommandPlan(
  shell: ShellService,
  plan: CommandPlan,
  signal: AbortSignal,
  sandboxPolicy?: unknown,
): Promise<FixedCommandSuccess | FixedCommandFailure> {
  try {
    const running = await shell.execute(shell.resolve({
      command: commandLine(plan),
      workdir: plan.cwd,
      signal,
      ...sandboxRequest(sandboxPolicy),
    }))
    const result = await running.result()
    const decision = verifyLoopCompletion(result)
    return decision.kind === 'deny' ? decision : { kind: 'allow', result }
  } catch {
    return { kind: 'deny', reason: 'fixed command failed before a trustworthy result was available' }
  }
}

function authorizePullRequest(plan: PullRequestPlan, approval: PullRequestApproval): FixedCommandSuccess | FixedCommandFailure | undefined {
  if (approval.scope !== 'create-pull-request' || approval.claimId !== plan.claimId) return { kind: 'deny', reason: 'pull request approval does not match this feature claim' }
  if (!Number.isFinite(approval.approvedAt) || approval.approvedAt < 0) return { kind: 'deny', reason: 'pull request approval has no valid timestamp' }
  return undefined
}

/** A PR creation plan is executable only after matching claim-scoped approval. */
export async function executePullRequestPlan(
  shell: ShellService,
  plan: PullRequestPlan,
  approval: PullRequestApproval,
  signal: AbortSignal,
  sandboxPolicy?: unknown,
): Promise<FixedCommandSuccess | FixedCommandFailure> {
  const denied = authorizePullRequest(plan, approval)
  if (denied !== undefined) return denied
  return await executeCommandPlan(shell, plan, signal, sandboxPolicy)
}

/** A merge plan is executable only after matching claim-scoped human approval. */
export async function executeMergePlan(
  shell: ShellService,
  plan: MergePlan,
  approval: MergeApproval,
  signal: AbortSignal,
  sandboxPolicy?: unknown,
): Promise<FixedCommandSuccess | FixedCommandFailure> {
  const authorized = authorizeMerge(plan, approval)
  if (authorized.kind === 'deny') return authorized
  return await executeCommandPlan(shell, plan, signal, sandboxPolicy)
}
