/**
 * Human-gated DSH actions for the feature-queue lifecycle.
 *
 * The model can request a detached worktree or a fixed PR/merge command, but
 * the feature-loop policy gates every mutation through the normal DSH approval
 * path. Queue settlement remains host-only.
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { join } from 'node:path'
import { FeatureQueue, type FeatureItem } from './feature-queue.ts'
import { createWorktree } from './git-worktree.ts'
import { planMerge, planPullRequest, type MergePlan, type PullRequestPlan } from './pr-gate.ts'
import { executeMergePlan, executePullRequestPlan, type ShellService } from './pr-executor.ts'

export const name = 'feature-loop-actions'
export const inject = ['tools']

function root(agent: unknown): string {
  const cwd = (agent as { session?: { header?: { cwd?: unknown } } } | undefined)?.session?.header?.cwd
  return typeof cwd === 'string' && cwd !== '' ? cwd : process.cwd()
}

function queueFor(agent: unknown): FeatureQueue {
  const baseRoot = root(agent)
  return new FeatureQueue({ baseRoot, path: join(baseRoot, '.feature-loop', 'queue.jsonl') })
}

function output() {
  return { schema: { type: 'string' as const }, render: (_args: unknown, value: string) => [{ type: 'text' as const, text: value }] }
}

const id = { type: 'string' as const, description: 'Queued feature id' }
const claimId = { type: 'string' as const, description: 'Fencing claim id returned by feature_queue' }
const repository = { type: 'string' as const, description: 'GitHub owner/name' }
const title = { type: 'string' as const, description: 'Single-line PR title' }
const pullRequest = { type: 'number' as const, required: true as const, description: 'Pull request number' }
const headCommit = { type: 'string' as const, description: 'Expected full PR head commit' }

function activeItem(agent: unknown, featureId: unknown, requestedClaim: unknown): FeatureItem & { claimId: string } {
  const item = queueFor(agent).get(String(featureId))
  if (item === undefined || item.claimId === undefined || item.claimId !== requestedClaim) throw new Error('action request is not fenced to the active queue claim')
  return item as FeatureItem & { claimId: string }
}

const worktreeTool = defineTool({
  name: 'feature_worktree_create',
  description: 'Create the detached worktree for a claimed queue item. This mutation requires the DSH human gate.',
  parameters: { id, claimId },
  output: output(),
  async execute(args, execution) {
    const item = activeItem(execution.agent, args.id, args.claimId)
    return JSON.stringify(createWorktree({
      claimId: item.claimId,
      baseRoot: root(execution.agent),
      worktreePath: item.worktreePath,
      branch: item.branch,
      baseCommit: item.baseCommit,
    }, { claimId: item.claimId, scope: 'create-worktree', approvedAt: Date.now() }))
  },
})

function prPlan(args: Record<string, unknown>, item: FeatureItem & { claimId: string }): PullRequestPlan {
  return planPullRequest({
    claimId: item.claimId,
    repository: String(args.repository),
    baseBranch: 'main',
    headBranch: item.branch,
    title: String(args.title),
    bodyFile: join(item.worktreePath, '.feature-loop', 'pr-body.md'),
    cwd: item.worktreePath,
  })
}

const prPlanTool = defineTool({
  name: 'feature_pr_plan',
  description: 'Plan a fixed, shell-free PR command for a claimed queue item without contacting a network.',
  parameters: { id, claimId, repository, title },
  output: output(),
  async execute(args, execution) {
    return JSON.stringify(prPlan(args, activeItem(execution.agent, args.id, args.claimId)))
  },
})

async function shellFor(ctx: Context): Promise<ShellService> {
  const shell = (ctx as unknown as { get?: (key: string) => unknown }).get?.call(ctx, 'shell') as ShellService | undefined
  if (shell === undefined) throw new Error('DSH shell service is unavailable')
  return shell
}

function prCreateTool(ctx: Context) {
  return defineTool({
    name: 'feature_pr_create',
    description: 'Create a fixed PR command for a claimed queue item through DSH shell. This mutation requires the DSH human gate.',
    parameters: { id, claimId, repository, title },
    output: output(),
    async execute(args, execution) {
      const item = activeItem(execution.agent, args.id, args.claimId)
      const result = await executePullRequestPlan(await shellFor(ctx), prPlan(args, item), { claimId: item.claimId, scope: 'create-pull-request', approvedAt: Date.now() }, execution.signal)
      return JSON.stringify(result)
    },
  })
}

function prMergeTool(ctx: Context) {
  return defineTool({
    name: 'feature_pr_merge',
    description: 'Merge a fixed squash PR command for a claimed queue item through DSH shell. This mutation requires the DSH human gate.',
    parameters: { id, claimId, repository, pullRequest, headCommit },
    output: output(),
    async execute(args, execution) {
      const item = activeItem(execution.agent, args.id, args.claimId)
      const plan: MergePlan = planMerge({ claimId: item.claimId, repository: String(args.repository), pullRequest: Number(args.pullRequest), targetBranch: 'main', headCommit: String(args.headCommit), cwd: item.worktreePath })
      const result = await executeMergePlan(await shellFor(ctx), plan, { claimId: item.claimId, scope: 'merge-pull-request', approvedAt: Date.now() }, execution.signal)
      return JSON.stringify(result)
    },
  })
}

export function apply(ctx: Context): void {
  ctx.tools.register(worktreeTool)
  ctx.tools.register(prPlanTool)
  ctx.tools.register(prCreateTool(ctx))
  ctx.tools.register(prMergeTool(ctx))
}
