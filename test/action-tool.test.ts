import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { apply } from '../src/action-tool.ts'
import { FeatureQueue } from '../src/feature-queue.ts'

test('registers worktree and PR actions with a read-only plan path', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'fl-action-tool-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const registered: { name: string, execute: (args: unknown, execution: unknown) => Promise<string> }[] = []
  const ctx = { tools: { register(tool: typeof registered[number]) { registered.push(tool) } }, get: () => undefined }
  apply(ctx as never)
  assert.deepEqual(registered.map(tool => tool.name), ['feature_worktree_create', 'feature_pr_plan', 'feature_pr_create', 'feature_pr_merge'])
  const queue = new FeatureQueue({ baseRoot: root, path: join(root, '.feature-loop', 'queue.jsonl') })
  queue.enqueue({ id: 'one', objective: 'ship one', verificationCommand: 'true', worktreePath: join(root, '.worktrees', 'one'), branch: 'dsh/one', baseCommit: 'a'.repeat(40) })
  const claimed = queue.claimNext('agent-1', 1)
  assert.ok(claimed?.claimId)
  const plan = registered.find(tool => tool.name === 'feature_pr_plan')!
  const execution = { agent: { id: 'agent-1', session: { header: { cwd: root } } } }
  const result = JSON.parse(await plan.execute({ id: 'one', claimId: claimed.claimId, repository: 'owner/name', title: 'Ship one' }, execution)) as { kind: string, args: string[] }
  assert.equal(result.kind, 'pull-request-create')
  assert.deepEqual(result.args.slice(0, 4), ['pr', 'create', '--repo', 'owner/name'])
})
