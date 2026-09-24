import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createWorktree, planWorktreeAdd } from '../src/git-worktree.ts'

function run(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } }).trim()
}

function repository(t: { after: (fn: () => void) => void }): { root: string, repo: string, commit: string } {
  const root = mkdtempSync(join(tmpdir(), 'fl-worktree-'))
  const repo = join(root, 'repo')
  mkdirSync(repo)
  run(repo, 'init', '-q')
  run(repo, 'config', 'user.email', 'queue@example.invalid')
  run(repo, 'config', 'user.name', 'Queue Test')
  writeFileSync(join(repo, 'README.md'), 'base\n')
  run(repo, 'add', 'README.md')
  run(repo, 'commit', '-q', '-m', 'base')
  const commit = run(repo, 'rev-parse', 'HEAD')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return { root, repo, commit }
}

test('plans a detached worktree without touching Git', (t) => {
  const f = repository(t)
  const plan = planWorktreeAdd({
    baseRoot: f.repo,
    worktreePath: join(f.repo, '.worktrees', 'feature'),
    branch: 'dsh/feature',
    baseCommit: f.commit,
  })
  assert.equal(plan.baseRoot, f.repo)
  assert.equal(plan.branch, 'dsh/feature')
  assert.equal(plan.baseCommit, f.commit)
  assert.throws(() => planWorktreeAdd({ ...plan, worktreePath: '/tmp/outside' }), /worktree path/)
  assert.throws(() => planWorktreeAdd({ ...plan, branch: 'main' }), /dsh\/\*/)
  assert.throws(() => planWorktreeAdd({ ...plan, baseCommit: 'abc' }), /40-character/)
})

test('creates and proves a detached worktree at the pinned commit', (t) => {
  const f = repository(t)
  const proof = createWorktree({
    baseRoot: f.repo,
    worktreePath: join(f.repo, '.worktrees', 'feature'),
    branch: 'dsh/feature',
    baseCommit: f.commit,
  })
  assert.equal(proof.commit, f.commit)
  assert.equal(proof.detached, true)
  assert.equal(readFileSync(join(proof.path, 'README.md'), 'utf8'), 'base\n')
  const symbolic = run(proof.path, 'branch', '--show-current')
  assert.equal(symbolic, '')
})

test('rejects a symlinked worktree escape before Git runs', (t) => {
  const f = repository(t)
  const outside = join(f.root, 'outside')
  mkdirSync(outside)
  mkdirSync(join(f.repo, '.worktrees'))
  symlinkSync(outside, join(f.repo, '.worktrees', 'escape'), 'dir')
  assert.throws(() => planWorktreeAdd({
    baseRoot: f.repo,
    worktreePath: join(f.repo, '.worktrees', 'escape'),
    branch: 'dsh/escape',
    baseCommit: f.commit,
  }), /symbolic link/)
})
