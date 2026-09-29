/**
 * The check for the start-loop target decision — the judgement that decides
 * WHICH repository a run writes into.
 *
 * Run: `node --experimental-strip-types --test test/start-target.test.ts`
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { decideStart, openedWorkspaceId } from '../web/start-target.ts'
import type { SessionRow, StartWorkspace } from '../web/start-target.ts'

const w = (over: Partial<StartWorkspace> = {}): StartWorkspace => ({
  id: 'w1', title: 'app', path: '/code/app', sessionIds: ['s1'], ...over,
})
const session = (id: string, mainView = 0): SessionRow => ({
  id, retainedBy: mainView > 0 ? { mainView } : {},
})

test('no workspaces blocks with a reason, never a silent dead button', () => {
  const d = decideStart([], undefined, undefined, 'do a thing')
  assert.equal(d.target, undefined)
  assert.equal(d.blocked, 'no-workspace')
  assert.match(d.note, /no workspace is registered/i)
})

test('a single workspace is used without asking', () => {
  const d = decideStart([w()], undefined, undefined, 'go')
  assert.equal(d.target?.id, 'w1')
  assert.equal(d.ambiguous, false)
  assert.equal(d.blocked, undefined)
})

test('the OPENED workspace wins, not the first or the newest', () => {
  // The regression this replaces: the old picker listed sessions and fell back
  // to the most recently touched one, which is routinely another project.
  const d = decideStart(
    [w({ id: 'a', title: 'a' }), w({ id: 'b', title: 'b' }), w({ id: 'c', title: 'c' })],
    'c', undefined, 'go',
  )
  assert.equal(d.target?.id, 'c')
  assert.equal(d.blocked, undefined, 'the open workspace is a target, not a question')
})

test('several workspaces and none open is a choice, never a guess', () => {
  const d = decideStart([w({ id: 'a' }), w({ id: 'b' })], undefined, undefined, 'go')
  assert.equal(d.target, undefined)
  assert.equal(d.blocked, 'choose-workspace')
  assert.match(d.note, /never guessed/i, 'the note must say why submit is dead')
})

test('an explicit pick beats the opened workspace', () => {
  const d = decideStart([w({ id: 'a' }), w({ id: 'b' })], 'a', 'b', 'go')
  assert.equal(d.target?.id, 'b')
})

test('a stale pick falls back to the open workspace instead of targeting nothing', () => {
  const d = decideStart([w({ id: 'a' }), w({ id: 'b' })], 'b', 'deleted-long-ago', 'go')
  assert.equal(d.target?.id, 'b', 'a workspace that vanished must not wedge the control')
})

test('an empty task blocks submission but keeps the workspace visible', () => {
  const d = decideStart([w({ title: 'app' })], undefined, undefined, '   ')
  assert.equal(d.blocked, 'empty-task')
  assert.equal(d.target?.title, 'app', 'the target is still shown, so the block is not mysterious')
})

test('the note names the PATH, because that is what a run writes into', () => {
  const d = decideStart([w({ title: 'app', path: '/code/app' })], undefined, undefined, 'go')
  assert.match(d.note, /\/code\/app/, 'the directory is the detail that catches "wrong project"')
})

test('openedWorkspaceId finds the workspace owning the main-view session', () => {
  const id = openedWorkspaceId(
    [w({ id: 'a', sessionIds: ['s1'] }), w({ id: 'b', sessionIds: ['s2'] })],
    [session('s1'), session('s2', 1)],
  )
  assert.equal(id, 'b')
})

test('openedWorkspaceId is undefined when nothing is open', () => {
  assert.equal(openedWorkspaceId([w()], [session('s1')]), undefined)
  assert.equal(openedWorkspaceId([w()], []), undefined)
})

test('a retained session in no workspace resolves to no workspace', () => {
  // Ungrouped sessions are real; treating one as "the open workspace" would
  // send the loop somewhere the user never chose.
  assert.equal(openedWorkspaceId([w({ sessionIds: ['other'] })], [session('loose', 1)]), undefined)
})
