/**
 * DSH tools for the durable feature queue.
 *
 * Mutations are exposed as one human-gated tool; the read-only list is a
 * separate tool so ordinary inspection does not create an approval request.
 * Settlement is intentionally not a model tool: only the verifier/executor
 * boundary may settle a queue item.
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { join } from 'node:path'
import { FeatureQueue } from './feature-queue.ts'

export const name = 'feature-loop-queue'
export const inject = ['tools']

function sessionRoot(agent: unknown): string {
  const cwd = (agent as { session?: { header?: { cwd?: unknown } } } | undefined)?.session?.header?.cwd
  if (typeof cwd === 'string' && cwd !== '') return cwd
  return process.cwd()
}

function output() {
  return {
    schema: { type: 'string' as const },
    render: (_args: unknown, value: string) => [{ type: 'text' as const, text: value }],
  }
}

const action = {
  type: 'string' as const,
  required: true as const,
  enum: ['enqueue', 'claim', 'awaiting-human', 'cancel'],
  description: 'Durable queue operation; every mutation is human-gated by the feature-loop policy',
}

const id = { type: 'string' as const, description: 'Stable feature id' }
const objective = { type: 'string' as const, description: 'Feature objective' }
const verificationCommand = { type: 'string' as const, description: 'Independent verification command' }
const branch = { type: 'string' as const, description: 'dsh/* worktree branch' }
const baseCommit = { type: 'string' as const, description: 'Full pinned base commit' }
const priority = { type: 'number' as const, description: 'Higher runs first' }
const reservationUSD = { type: 'number' as const, description: 'Campaign reservation for a claim' }
const claimId = { type: 'string' as const, description: 'Fencing claim id returned by claim' }
const reason = { type: 'string' as const, description: 'Human gate reason' }

const queueTool = defineTool({
  name: 'feature_queue',
  description: 'Manage the durable feature queue. Mutations require the feature-loop human gate; settlement is not available here.',
  parameters: { action, id, objective, verificationCommand, branch, baseCommit, priority, reservationUSD, claimId, reason },
  output: output(),
  async execute(args, execution) {
    const root = sessionRoot(execution.agent)
    const queue = new FeatureQueue({ baseRoot: root, path: join(root, '.feature-loop', 'queue.jsonl') })
    const operation = String(args.action)
    const featureId = typeof args.id === 'string' ? args.id : undefined
    if (operation === 'enqueue') {
      if (featureId === undefined || typeof args.objective !== 'string' || typeof args.verificationCommand !== 'string' || typeof args.branch !== 'string' || typeof args.baseCommit !== 'string') throw new Error('enqueue requires id, objective, verificationCommand, branch, and baseCommit')
      return JSON.stringify(queue.enqueue({
        id: featureId,
        objective: args.objective,
        verificationCommand: args.verificationCommand,
        branch: args.branch,
        baseCommit: args.baseCommit,
        worktreePath: join(queue.worktreeRoot, featureId),
        ...typeof args.priority === 'number' ? { priority: args.priority } : {},
      }))
    }
    if (operation === 'claim') {
      if (typeof args.reservationUSD !== 'number') throw new Error('claim requires reservationUSD')
      const owner = (execution.agent as { id?: unknown }).id
      if (typeof owner !== 'string' || owner === '') throw new Error('claim requires an agent')
      return JSON.stringify(queue.claimNext(owner, args.reservationUSD))
    }
    if (operation === 'awaiting-human') {
      if (featureId === undefined || typeof args.claimId !== 'string' || typeof args.reason !== 'string') throw new Error('awaiting-human requires id, claimId, and reason')
      return JSON.stringify(queue.markAwaitingHuman(featureId, args.claimId, args.reason))
    }
    if (operation === 'cancel') {
      if (featureId === undefined) throw new Error('cancel requires id')
      return JSON.stringify(queue.cancel(featureId))
    }
    throw new Error(`unsupported queue action ${operation}`)
  },
})

const listTool = defineTool({
  name: 'feature_queue_list',
  description: 'List durable feature queue items and their current status; read-only.',
  parameters: {},
  output: output(),
  async execute(_args, execution) {
    const root = sessionRoot(execution.agent)
    return JSON.stringify(new FeatureQueue({ baseRoot: root, path: join(root, '.feature-loop', 'queue.jsonl') }).list())
  },
})

export function apply(ctx: Context): void {
  ctx.tools.register(queueTool)
  ctx.tools.register(listTool)
}
