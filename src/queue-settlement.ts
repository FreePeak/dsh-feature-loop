/**
 * Host-only settlement bridge for verified queue items.
 *
 * This is deliberately not a model tool. The caller must provide the DSH shell
 * service, the exact claim fencing ID, observed spend, and the session signal;
 * the bridge runs the queue item's pinned verifier and only then settles the
 * campaign reservation.
 */

import { verifyLoopCompletion } from './goal-loop.ts'
import type { LoopVerificationResult } from './goal-loop.ts'
import type { FeatureItem, FeatureQueue } from './feature-queue.ts'
import type { ShellService } from './pr-executor.ts'

export interface QueueSettlementSuccess {
  kind: 'verified'
  item: FeatureItem
  result: LoopVerificationResult
}

export interface QueueSettlementFailure {
  kind: 'deny'
  reason: string
  item?: FeatureItem
}

export async function settleVerifiedQueueItem(input: {
  queue: FeatureQueue
  featureId: string
  claimId: string
  costUSD: number
  shell: ShellService
  signal: AbortSignal
  sandboxPolicy?: unknown
}): Promise<QueueSettlementSuccess | QueueSettlementFailure> {
  const item = input.queue.get(input.featureId)
  if (item === undefined) return { kind: 'deny', reason: 'queue item does not exist' }
  if (item.claimId !== input.claimId || (item.status !== 'running' && item.status !== 'awaiting-human')) {
    return { kind: 'deny', reason: 'queue claim is not active for this settlement', item }
  }
  try {
    const running = await input.shell.execute(input.shell.resolve({
      command: item.verificationCommand,
      workdir: item.worktreePath,
      signal: input.signal,
      ...input.sandboxPolicy === undefined ? {} : { sandboxPolicy: input.sandboxPolicy },
    }))
    const result = await running.result()
    const decision = verifyLoopCompletion(result)
    if (decision.kind === 'deny') return { kind: 'deny', reason: decision.reason, item }
    const settled = input.queue.settle(input.featureId, input.claimId, input.costUSD, 'verified')
    return { kind: 'verified', item: settled, result }
  } catch {
    return { kind: 'deny', reason: 'queue verifier failed before a trustworthy result was available', item }
  }
}
