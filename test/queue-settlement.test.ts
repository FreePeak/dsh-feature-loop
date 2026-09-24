import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { FeatureQueue } from '../src/feature-queue.ts'
import { settleVerifiedQueueItem } from '../src/queue-settlement.ts'
import type { ShellService } from '../src/pr-executor.ts'

function fixture(t: { after: (fn: () => void) => void }) {
  const root = mkdtempSync(join(tmpdir(), 'fl-settle-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const queue = new FeatureQueue({ baseRoot: root, campaignLimitUSD: 5 })
  queue.enqueue({
    id: 'one',
    objective: 'ship one',
    verificationCommand: 'true',
    worktreePath: join(root, '.worktrees', 'one'),
    branch: 'dsh/one',
    baseCommit: 'a'.repeat(40),
  })
  const claimed = queue.claimNext('agent-a', 1)
  assert.ok(claimed?.claimId)
  return { root, queue, claimId: claimed.claimId }
}

function shell(result: { exitCode: number, signal?: string | null }) {
  const requests: Record<string, unknown>[] = []
  const service: ShellService = {
    resolve(request) {
      requests.push(request)
      return request
    },
    async execute() {
      return { async result() { return result } }
    },
  }
  return { service, requests }
}

test('settles only after the queue verifier exits cleanly', async (t) => {
  const f = fixture(t)
  const h = shell({ exitCode: 0, signal: null })
  const result = await settleVerifiedQueueItem({
    queue: f.queue,
    featureId: 'one',
    claimId: f.claimId,
    costUSD: 0.4,
    shell: h.service,
    signal: new AbortController().signal,
    sandboxPolicy: { workspaceRoot: f.root },
  })
  assert.equal(result.kind, 'verified')
  assert.equal(f.queue.get('one')?.status, 'verified')
  assert.equal(f.queue.budgetSnapshot().spentUSD, 0.4)
  assert.equal(h.requests[0]?.command, 'true')
  assert.equal(h.requests[0]?.workdir, join(f.root, '.worktrees', 'one'))
})

test('failed verification leaves the claim and reservation active', async (t) => {
  const f = fixture(t)
  const h = shell({ exitCode: 1, signal: null })
  const result = await settleVerifiedQueueItem({
    queue: f.queue,
    featureId: 'one',
    claimId: f.claimId,
    costUSD: 0.4,
    shell: h.service,
    signal: new AbortController().signal,
  })
  assert.equal(result.kind, 'deny')
  assert.equal(f.queue.get('one')?.status, 'running')
  assert.equal(f.queue.budgetSnapshot().reservedUSD, 1)
})
