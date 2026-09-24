import { strict as assert } from 'node:assert'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { FeatureQueue } from '../src/feature-queue.ts'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'fl-queue-'))
  return {
    root,
    path: join(root, '.feature-loop', 'queue.jsonl'),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  }
}

function queue(f: ReturnType<typeof fixture>, now = () => 1_000) {
  return new FeatureQueue({ path: f.path, baseRoot: f.root, campaignLimitUSD: 10, now })
}

const item = (root: string, id: string, priority = 0) => ({
  id,
  objective: `ship ${id}`,
  verificationCommand: 'true',
  worktreePath: join(root, '.worktrees', id),
  branch: `dsh/${id}`,
  baseCommit: 'a'.repeat(40),
  priority,
})

test('claims the highest-priority feature and reserves shared campaign funds', (t) => {
  const f = fixture()
  t.after(f.cleanup)
  const q = queue(f)
  const low = q.enqueue({ ...item(f.root, 'low', 1), worktreePath: join(f.root, '.worktrees', 'low') })
  q.enqueue({ ...item(f.root, 'high', 9), worktreePath: join(f.root, '.worktrees', 'high') })
  const claimed = q.claimNext('agent-a', 5)
  assert.equal(claimed?.id, 'high')
  assert.equal(q.get(low.id)?.status, 'queued')
  assert.equal(q.budgetSnapshot().reservedUSD, 5)
  assert.equal(q.claimNext('agent-b', 2)?.id, 'low')
})

test('a second coordinator instance cannot claim an already-durable item', (t) => {
  const f = fixture()
  t.after(f.cleanup)
  const first = queue(f)
  const second = queue(f)
  first.enqueue(item(f.root, 'one'))
  assert.equal(first.claimNext('agent-a', 2)?.id, 'one')
  assert.equal(second.claimNext('agent-b', 2), undefined)
  assert.equal(second.budgetSnapshot().reservedUSD, 2)
})

test('replays claims, human gates, and settlements from the durable log', (t) => {
  const f = fixture()
  t.after(f.cleanup)
  const first = queue(f)
  first.enqueue({ ...item(f.root, 'one'), worktreePath: join(f.root, '.worktrees', 'one') })
  const claimed = first.claimNext('agent-a', 3)
  assert.ok(claimed)
  assert.ok(claimed.claimId)
  first.markAwaitingHuman('one', claimed.claimId!, 'review required')
  first.settle('one', claimed.claimId!, 0.75, 'verified')

  const resumed = queue(f)
  assert.equal(resumed.get('one')?.status, 'verified')
  assert.equal(resumed.get('one')?.spentUSD, 0.75)
  assert.equal(resumed.budgetSnapshot().spentUSD, 0.75)
  assert.equal(resumed.budgetSnapshot().reservedUSD, 0)
})

test('rejects unsafe worktrees, branches, and feature ids at admission', (t) => {
  const f = fixture()
  t.after(f.cleanup)
  const q = queue(f)
  assert.throws(() => q.enqueue({ ...item(f.root, 'root'), worktreePath: f.root }), /worktree path/)
  assert.throws(() => q.enqueue({ ...item(f.root, 'outside'), worktreePath: '/tmp/outside' }), /worktree path/)
  assert.throws(() => q.enqueue({ ...item(f.root, 'branch'), branch: 'main', worktreePath: join(f.root, '.worktrees', 'branch') }), /dsh\/\*/)
  assert.throws(() => q.enqueue({ ...item(f.root, '../escape'), worktreePath: join(f.root, '.worktrees', 'escape') }), /feature id/)
  assert.throws(() => q.enqueue({ ...item(f.root, 'command'), verificationCommand: 'true\nrm -rf /tmp/x' }), /single-line/)
  mkdirSync(join(f.root, '.worktrees'), { recursive: true })
  const outside = join(f.root, 'outside')
  mkdirSync(outside)
  symlinkSync(outside, join(f.root, '.worktrees', 'escape-link'), 'dir')
  assert.throws(() => q.enqueue({ ...item(f.root, 'link'), worktreePath: join(f.root, '.worktrees', 'escape-link') }), /symbolic link/)
})

test('settlement is idempotent while a mismatched duplicate is rejected', (t) => {
  const f = fixture()
  t.after(f.cleanup)
  const q = queue(f)
  q.enqueue({ ...item(f.root, 'one'), worktreePath: join(f.root, '.worktrees', 'one') })
  const claimed = q.claimNext('agent-a', 2)
  assert.ok(claimed?.claimId)
  assert.equal(q.settle('one', claimed!.claimId!, 0.4, 'verified').status, 'verified')
  assert.equal(q.settle('one', claimed!.claimId!, 0.4, 'verified').status, 'verified')
  assert.throws(() => q.settle('one', claimed!.claimId!, 0.5, 'verified'), /not active/)
})

test('malformed queue logs fail loudly instead of dropping queued work', (t) => {
  const f = fixture()
  t.after(f.cleanup)
  mkdirSync(join(f.root, '.feature-loop'), { recursive: true })
  writeFileSync(f.path, '{"type":"enqueued"}\nnot-json\n')
  assert.throws(() => queue(f), /corrupt at line 1/)
  writeFileSync(f.path, '{"type":"enqueued"}')
  assert.throws(() => queue(f), /final newline/)
})
