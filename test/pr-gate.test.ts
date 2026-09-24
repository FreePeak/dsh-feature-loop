import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { authorizeMerge, planMerge, planPullRequest } from '../src/pr-gate.ts'

const claimId = 'claim-123'
const cwd = '/tmp/isolated-worktree'

test('plans a shell-free draft PR command with fixed arguments', () => {
  const plan = planPullRequest({
    claimId,
    repository: 'FreePeak/dsh-feature-loop',
    baseBranch: 'main',
    headBranch: 'dsh/feature-123',
    title: 'Ship feature 123',
    bodyFile: `${cwd}/.feature-loop/pr-body.md`,
    cwd,
    draft: true,
  })
  assert.deepEqual(plan.args, [
    'pr', 'create', '--repo', 'FreePeak/dsh-feature-loop', '--base', 'main',
    '--head', 'dsh/feature-123', '--title', 'Ship feature 123',
    '--body-file', `${cwd}/.feature-loop/pr-body.md`, '--draft',
  ])
  assert.equal(plan.executable, 'gh')
  assert.equal(plan.shell, false)
  assert.equal(plan.networkRequired, true)
})

test('rejects shell-like branch, repository, and body inputs at planning time', () => {
  assert.throws(() => planPullRequest({
    claimId,
    repository: 'owner/name;rm',
    baseBranch: 'main',
    headBranch: 'dsh/good',
    title: 'safe',
    bodyFile: `${cwd}/body.md`,
    cwd,
  }), /owner\/name/)
  assert.throws(() => planMerge({
    claimId,
    repository: 'owner/name',
    pullRequest: 1,
    targetBranch: '--repo',
    headCommit: 'a'.repeat(40),
    cwd,
  }), /safe Git branch/)
  assert.throws(() => planPullRequest({
    claimId,
    repository: 'owner/name',
    baseBranch: 'main',
    headBranch: 'dsh/good',
    title: 'safe',
    bodyFile: '/tmp/outside.md',
    cwd,
  }), /inside the isolated worktree/)
})

test('merge authorization is claim-scoped and approval-scoped', () => {
  const plan = planMerge({
    claimId,
    repository: 'owner/name',
    pullRequest: 42,
    targetBranch: 'main',
    headCommit: 'B'.repeat(40),
    cwd,
  })
  assert.deepEqual(plan.args, [
    'pr', 'merge', '42', '--repo', 'owner/name', '--squash', '--match-head-commit', 'b'.repeat(40),
  ])
  assert.deepEqual(authorizeMerge(plan, { claimId, scope: 'merge-pull-request', approvedAt: 1_000 }), { kind: 'allow', plan })
  assert.equal(authorizeMerge(plan, { claimId: 'other', scope: 'merge-pull-request', approvedAt: 1_000 }).kind, 'deny')
  assert.equal(authorizeMerge(plan, { claimId, scope: 'merge-pull-request', approvedAt: -1 }).kind, 'deny')
})
