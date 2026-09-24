import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { FeatureQueue } from '../src/feature-queue.ts'
import { createWorktree } from '../src/git-worktree.ts'
import { planPullRequest } from '../src/pr-gate.ts'
import { executePullRequestPlan, type ShellService } from '../src/pr-executor.ts'
import { settleVerifiedQueueItem } from '../src/queue-settlement.ts'

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } }).trim()
}

test('host flow carries a claim through worktree, PR plan, and verified settlement', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'fl-host-flow-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const repo = join(root, 'repo')
  mkdirSync(repo)
  git(repo, 'init', '-q')
  git(repo, 'config', 'user.email', 'flow@example.invalid')
  git(repo, 'config', 'user.name', 'Flow Test')
  writeFileSync(join(repo, 'README.md'), 'base\n')
  git(repo, 'add', 'README.md')
  git(repo, 'commit', '-q', '-m', 'base')
  const baseCommit = git(repo, 'rev-parse', 'HEAD')
  const queue = new FeatureQueue({ baseRoot: repo, campaignLimitUSD: 5 })
  queue.enqueue({
    id: 'one',
    objective: 'ship one',
    verificationCommand: 'true',
    worktreePath: join(repo, '.worktrees', 'one'),
    branch: 'dsh/one',
    baseCommit,
  })
  const claimed = queue.claimNext('flow-agent', 1)
  assert.ok(claimed?.claimId)
  const worktree = createWorktree({
    claimId: claimed.claimId,
    baseRoot: repo,
    worktreePath: claimed.worktreePath,
    branch: claimed.branch,
    baseCommit,
  }, { claimId: claimed.claimId, scope: 'create-worktree', approvedAt: 1_000 })

  const requests: Record<string, unknown>[] = []
  const shell: ShellService = {
    resolve(request) {
      requests.push(request)
      return request
    },
    async execute() {
      return { async result() { return { exitCode: 0, signal: null } } }
    },
  }
  const pr = planPullRequest({
    claimId: claimed.claimId,
    repository: 'owner/name',
    baseBranch: 'main',
    headBranch: claimed.branch,
    title: 'Ship one',
    bodyFile: join(worktree.path, '.feature-loop/pr.md'),
    cwd: worktree.path,
  })
  const prResult = await executePullRequestPlan(shell, pr, { claimId: claimed.claimId, scope: 'create-pull-request', approvedAt: 1_000 }, new AbortController().signal)
  assert.equal(prResult.kind, 'allow')
  const settled = await settleVerifiedQueueItem({
    queue,
    featureId: 'one',
    claimId: claimed.claimId,
    costUSD: 0.4,
    shell,
    signal: new AbortController().signal,
  })
  assert.equal(settled.kind, 'verified')
  assert.equal(queue.get('one')?.status, 'verified')
  assert.equal(queue.budgetSnapshot().spentUSD, 0.4)
  assert.equal(requests.length, 2)
})
