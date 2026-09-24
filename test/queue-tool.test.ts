import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { apply } from '../src/queue-tool.ts'

test('registers a read-only list tool and a mutation tool without settlement', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'fl-queue-tool-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const registered: { name: string, parameters: Record<string, { enum?: string[] }>, execute: (args: unknown, execution: unknown) => Promise<string> }[] = []
  const ctx = { tools: { register(tool: typeof registered[number]) { registered.push(tool) } } }
  apply(ctx as never)
  assert.deepEqual(registered.map(tool => tool.name), ['feature_queue', 'feature_queue_list'])
  const mutationSchema = JSON.stringify(registered[0].parameters)
  assert.match(mutationSchema, /enqueue/)
  assert.match(mutationSchema, /awaiting-human/)
  assert.doesNotMatch(mutationSchema, /settle/)
})

test('queue tools derive the durable path from the session workspace', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'fl-queue-tool-run-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const registered: { name: string, execute: (args: unknown, execution: unknown) => Promise<string> }[] = []
  const ctx = { tools: { register(tool: typeof registered[number]) { registered.push(tool) } } }
  apply(ctx as never)
  const queue = registered.find(tool => tool.name === 'feature_queue')!
  const list = registered.find(tool => tool.name === 'feature_queue_list')!
  const execution = { agent: { id: 'agent-1', session: { header: { cwd: root } } } }
  const enqueued = JSON.parse(await queue.execute({
    action: 'enqueue',
    id: 'one',
    objective: 'ship one',
    verificationCommand: 'true',
    branch: 'dsh/one',
    baseCommit: 'a'.repeat(40),
  }, execution)) as { id: string, status: string }
  assert.equal(enqueued.id, 'one')
  assert.equal(enqueued.status, 'queued')
  const claimed = JSON.parse(await queue.execute({ action: 'claim', reservationUSD: 1 }, execution)) as { id: string, claimId: string, status: string }
  assert.equal(claimed.id, 'one')
  assert.equal(claimed.status, 'running')
  const waiting = JSON.parse(await queue.execute({ action: 'awaiting-human', id: 'one', claimId: claimed.claimId, reason: 'review' }, execution)) as { status: string }
  assert.equal(waiting.status, 'awaiting-human')
  const listed = JSON.parse(await list.execute({}, execution)) as { id: string, status: string }[]
  assert.equal(listed[0]?.status, 'awaiting-human')
})
