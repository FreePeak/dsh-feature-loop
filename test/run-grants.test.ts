/**
 * "Allow for this run" — the checks.
 *
 * The property under test is the one that makes the button safe to ship: a
 * grant must be exactly as narrow as the click that made it. It covers one run,
 * one tool, and only an ask of the kind the human saw; it never covers `bash`,
 * a non-policy ask, another run, or a forged request.
 *
 * Run: `node --experimental-strip-types --test test/run-grants.test.ts`
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { RUN_APPROVAL_OPTION, outcomeForResponse, toApprovalGate } from '../src/approval-bridge.ts'
import { createApprovalRegistry } from '../src/approvals.ts'
import { DashboardState, startDashboard } from '../src/dashboard.ts'
import type { ApprovalQuestion } from '../src/dashboard.ts'
import { RunGrants, runGrantable } from '../src/run-grants.ts'

const POLICY = 'REVIEW REQUESTED (policy): write: irreversible is always approved by a human.'
const SIGNAL = 'REVIEW REQUESTED (signal): tool-cycle: the same call three times.'

function ask(over: Partial<ApprovalQuestion> & { run?: string } = {}): ApprovalQuestion {
  const { run, ...rest } = over
  return { agent: { id: run ?? 'run-a' }, toolName: 'write', callId: 'c1', reason: POLICY, ...rest } as ApprovalQuestion
}

function registry() {
  return createApprovalRegistry({
    state: new DashboardState(), answers: true, answerTimeoutMs: 50_000, hasWatcher: () => true,
  })
}

const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 5))

test('only file tools asked under a policy rule are grantable', () => {
  assert.equal(runGrantable('write', POLICY), true)
  assert.equal(runGrantable('edit', POLICY), true)
  assert.equal(runGrantable('bash', POLICY), false, 'a shell command is never grantable')
  assert.equal(runGrantable('write', SIGNAL), false, 'a critical-signal ask is never grantable')
  assert.equal(runGrantable('write', undefined), false, 'no reason means no proof it was a policy ask')
  assert.equal(runGrantable('write', 'irreversible'), false, 'free text is not the policy marker')
})

test('RunGrants is per run and per tool', () => {
  const grants = new RunGrants()
  grants.grant('run-a', 'write')
  assert.equal(grants.covers('run-a', 'write', POLICY), true)
  assert.equal(grants.covers('run-b', 'write', POLICY), false, 'another run is not covered')
  assert.equal(grants.covers('run-a', 'edit', POLICY), false, 'another tool is not covered')
  assert.equal(grants.covers('run-a', 'write', SIGNAL), false, 'a signal ask is not covered even for a granted tool')
  grants.clear('run-a')
  assert.equal(grants.covers('run-a', 'write', POLICY), false)
})

test('the run option is offered only on a grantable ask', () => {
  const base = { id: 'a', askedAt: 1 }
  const write = toApprovalGate({ ...base, toolName: 'write', reason: POLICY })
  assert.deepEqual(write.options.map(o => o.id), ['allow-once', 'allow-run', 'reject-once'])
  const bash = toApprovalGate({ ...base, toolName: 'bash', reason: POLICY })
  assert.deepEqual(bash.options.map(o => o.id), ['allow-once', 'reject-once'], 'no run option for bash')
  const signal = toApprovalGate({ ...base, toolName: 'write', reason: SIGNAL })
  assert.deepEqual(signal.options.map(o => o.id), ['allow-once', 'reject-once'], 'no run option for a signal ask')
})

test('the run option is read by id, never by its kind', () => {
  assert.equal(outcomeForResponse({ optionId: RUN_APPROVAL_OPTION.id }), 'allowed-run')
  assert.equal(outcomeForResponse({ optionId: 'allow-once' }), 'allowed-once')
  assert.throws(() => outcomeForResponse({ optionId: 'allow-always' }), /unknown approval option/,
    'the borrowed kind is not an option id')
})

test('allow-run settles the ask and answers the next one without a prompt', async () => {
  const reg = registry()
  const first = reg.answer(ask(), async () => 'unavailable')
  await tick()
  const [pending] = reg.pendingSnapshot()
  assert.equal(reg.settleApproval(pending!.id, 'allowed-run'), true)
  assert.equal(await first, 'allowed-once', 'the harness only ever sees allowed-once')

  const second = await reg.answer(ask({ callId: 'c2' }), async () => 'unavailable')
  assert.equal(second, 'allowed-once', 'the next write needs no click')
  assert.equal(reg.pendingSnapshot().length, 0, 'and was never claimable')
})

test('a grant is honoured after the watcher is gone', async () => {
  let watching = true
  const reg = createApprovalRegistry({
    state: new DashboardState(), answers: true, answerTimeoutMs: 50_000, hasWatcher: () => watching,
  })
  const first = reg.answer(ask(), async () => 'unavailable')
  await tick()
  reg.settleApproval(reg.pendingSnapshot()[0]!.id, 'allowed-run')
  await first
  watching = false
  assert.equal(await reg.answer(ask({ callId: 'c3' }), async () => 'unavailable'), 'allowed-once',
    'closing the tab must not turn the run back into prompts')
})

test('allow-run releases the asks already queued for the same tool and run', async () => {
  const reg = registry()
  const a = reg.answer(ask({ callId: 'c1' }), async () => 'unavailable')
  const b = reg.answer(ask({ callId: 'c2' }), async () => 'unavailable')
  const other = reg.answer(ask({ callId: 'c3', run: 'run-b' }), async () => 'unavailable')
  const edit = reg.answer(ask({ callId: 'c4', toolName: 'edit' }), async () => 'unavailable')
  await tick()
  const target = reg.pendingSnapshot().find(p => p.callId === 'c1')!
  reg.settleApproval(target.id, 'allowed-run')
  assert.equal(await a, 'allowed-once')
  assert.equal(await b, 'allowed-once', 'a sibling write in the same run is released')
  assert.deepEqual(
    reg.pendingSnapshot().map(p => p.callId).sort(),
    ['c3', 'c4'],
    'another run and another tool are still waiting',
  )
  reg.stop()
  assert.equal(await other, 'unavailable')
  assert.equal(await edit, 'unavailable')
})

test('allow-run is refused for a bash ask and for a non-policy ask, and grants nothing', async () => {
  const reg = registry()
  const bash = reg.answer(ask({ toolName: 'bash' }), async () => 'unavailable')
  const signal = reg.answer(ask({ reason: SIGNAL, callId: 'c2' }), async () => 'unavailable')
  await tick()
  for (const p of reg.pendingSnapshot()) {
    assert.equal(reg.settleApproval(p.id, 'allowed-run'), false, `${p.toolName} cannot be run-allowed`)
  }
  assert.equal(reg.pendingSnapshot().length, 2, 'both are still waiting for a real decision')
  assert.deepEqual(reg.grants.list('run-a'), [], 'a refused request leaves no grant behind')
  reg.stop()
  await Promise.all([bash, signal])
})

test('a signal ask for a granted tool still reaches a human', async () => {
  const reg = registry()
  const first = reg.answer(ask(), async () => 'unavailable')
  await tick()
  reg.settleApproval(reg.pendingSnapshot()[0]!.id, 'allowed-run')
  await first
  const signal = reg.answer(ask({ reason: SIGNAL, callId: 'c9' }), async () => 'unavailable')
  await tick()
  assert.equal(reg.pendingSnapshot().length, 1, 'the signal ask is claimed, not waved through')
  reg.stop()
  assert.equal(await signal, 'unavailable')
})

test('the standalone dashboard grants too, and a forged bash grant is a 400', async () => {
  const state = new DashboardState()
  const dash = startDashboard({ enabled: true, host: '127.0.0.1', port: 0, answers: true }, state)
  await dash.ready
  // The dashboard only claims while a tab is watching: an open SSE stream is one.
  const watcher = new AbortController()
  const stream = await fetch(`${dash.url}api/events?token=${encodeURIComponent(dash.token)}`, { signal: watcher.signal })
  assert.equal(stream.status, 200)
  const post = (id: string, outcome: string): Promise<Response> => fetch(`${dash.url}api/approvals/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-dashboard-token': dash.token, origin: new URL(dash.url).origin },
    body: JSON.stringify({ outcome }),
  })
  try {
    const bash = dash.answer(ask({ toolName: 'bash' }), async () => 'unavailable')
    const write = dash.answer(ask(), async () => 'unavailable')
    await tick()
    const pending = dash.pendingSnapshot()
    const bashId = pending.find(p => p.toolName === 'bash')!.id
    const writeId = pending.find(p => p.toolName === 'write')!.id

    assert.equal((await post(bashId, 'allowed-run')).status, 400, 'forged bash grant is refused')
    assert.equal(dash.pendingSnapshot().length, 2, 'and settled nothing')
    assert.equal((await post(writeId, 'allowed-run')).status, 200)
    assert.equal(await write, 'allowed-once')
    assert.equal(await dash.answer(ask({ callId: 'c2' }), async () => 'unavailable'), 'allowed-once',
      'the next write in the same run needs no click')

    await post(bashId, 'rejected')
    assert.equal(await bash, 'rejected')
  } finally {
    watcher.abort()
    await dash.stop()
  }
})
