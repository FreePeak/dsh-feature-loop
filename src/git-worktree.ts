/**
 * Small, shell-free Git worktree boundary for the durable feature queue.
 *
 * The queue supplies a pinned commit and an isolated path. This module only
 * plans and verifies Git worktrees; it does not create branches, commit, push,
 * open PRs, or merge. Callers must pass the operation through the DSH human
 * gate before invoking `createWorktree`.
 */

import { existsSync, lstatSync, realpathSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { isAbsolute, relative, resolve, sep } from 'node:path'

export interface WorktreePlan {
  claimId: string
  baseRoot: string
  worktreeRoot: string
  worktreePath: string
  branch: string
  baseCommit: string
}

export interface WorktreeApproval {
  claimId: string
  scope: 'create-worktree'
  approvedAt: number
}

export interface WorktreeProof {
  path: string
  commit: string
  repositoryRoot: string
  detached: boolean
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${label} must be a non-empty string`)
  return value.trim()
}

function branch(value: string): string {
  const result = text(value, 'worktree branch')
  if (!/^dsh\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(result) || result.includes('..')) {
    throw new TypeError('worktree branch must be a dsh/* branch without path traversal')
  }
  return result
}

function claim(value: string): string {
  const result = text(value, 'queue claim id')
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result)) throw new TypeError('queue claim id contains unsafe characters')
  return result
}

function commit(value: string): string {
  const result = text(value, 'base commit').toLowerCase()
  if (!/^[0-9a-f]{40}$/.test(result)) throw new TypeError('base commit must be a full 40-character Git SHA')
  return result
}

function safeChild(root: string, candidate: string, label: string): string {
  const rel = relative(root, candidate)
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new TypeError(`${label} must be a child of the configured worktree root`)
  }
  return candidate
}

function noSymlinkPath(candidate: string, root: string): void {
  let current = candidate
  while (current !== root) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new TypeError('worktree path must not traverse a symbolic link')
    const parent = resolve(current, '..')
    if (parent === current) break
    current = parent
  }
}

/** Validate and normalize a worktree plan without touching Git or the filesystem. */
export function planWorktreeAdd(input: {
  claimId: string
  baseRoot: string
  worktreeRoot?: string
  worktreePath: string
  branch: string
  baseCommit: string
}): WorktreePlan {
  const baseRoot = resolve(text(input.baseRoot, 'base root'))
  const worktreeRoot = resolve(input.worktreeRoot === undefined ? resolve(baseRoot, '.worktrees') : text(input.worktreeRoot, 'worktree root'))
  const worktreePath = safeChild(worktreeRoot, resolve(text(input.worktreePath, 'worktree path')), 'worktree path')
  noSymlinkPath(worktreePath, worktreeRoot)
  return { claimId: claim(input.claimId), baseRoot, worktreeRoot, worktreePath, branch: branch(input.branch), baseCommit: commit(input.baseCommit) }
}

function git(cwd: string, args: readonly string[]): { stdout: string, stderr: string } {
  const result = spawnSync('git', args, {
    cwd,
    shell: false,
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
  if (result.error !== undefined) throw new Error(`git ${args[0] ?? 'command'} failed: ${result.error.message}`)
  if (result.status !== 0) {
    const detail = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim().slice(0, 500)
    throw new Error(`git ${args[0] ?? 'command'} failed with exit code ${String(result.status)}${detail === '' ? '' : `: ${detail}`}`)
  }
  return { stdout: (result.stdout ?? '').trim(), stderr: (result.stderr ?? '').trim() }
}

function repoRoot(baseRoot: string): string {
  const root = realpathSync(baseRoot)
  if (!statSync(root).isDirectory() || !existsSync(resolve(root, '.git'))) throw new Error('base root is not a Git repository')
  return root
}

/** Verify a worktree after creation; no branch or commit mutation occurs here. */
export function verifyWorktree(plan: WorktreePlan): WorktreeProof {
  const path = realpathSync(plan.worktreePath)
  const repositoryRoot = git(path, ['rev-parse', '--show-toplevel']).stdout
  const head = git(path, ['rev-parse', 'HEAD']).stdout.toLowerCase()
  const symbolic = spawnSync('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], { cwd: path, shell: false, encoding: 'utf8', timeout: 120_000 })
  const detached = symbolic.status === 1
  if (symbolic.status !== 0 && symbolic.status !== 1) throw new Error(`git symbolic-ref failed with exit code ${String(symbolic.status)}`)
  if (head !== plan.baseCommit) throw new Error(`worktree HEAD ${head} does not match pinned base commit ${plan.baseCommit}`)
  if (resolve(repositoryRoot) !== resolve(path)) throw new Error('worktree repository root does not match its path')
  return { path, commit: head, repositoryRoot, detached }
}

/**
 * Create a detached worktree at the pinned commit and prove the result.
 *
 * The branch is intentionally not created here: branch creation is a separate
 * gated operation after the human approves the queue item.
 */
function authorizeWorktree(plan: WorktreePlan, approval: WorktreeApproval): void {
  if (approval.scope !== 'create-worktree' || approval.claimId !== plan.claimId) throw new Error('worktree approval does not match this feature claim')
  if (!Number.isFinite(approval.approvedAt) || approval.approvedAt < 0) throw new Error('worktree approval has no valid timestamp')
}

export function createWorktree(input: Parameters<typeof planWorktreeAdd>[0], approval: WorktreeApproval): WorktreeProof {
  const plan = planWorktreeAdd(input)
  authorizeWorktree(plan, approval)
  const root = repoRoot(plan.baseRoot)
  if (!existsSync(resolve(root, '.git'))) throw new Error('base root is not a Git repository')
  git(root, ['rev-parse', '--verify', `${plan.baseCommit}^{commit}`])
  if (existsSync(plan.worktreePath) && lstatSync(plan.worktreePath).isDirectory()) {
    const entries = spawnSync('git', ['-C', plan.worktreePath, 'status', '--porcelain'], { shell: false, encoding: 'utf8', timeout: 120_000 })
    if (entries.status === 0 && entries.stdout.trim() !== '') throw new Error('existing worktree path is not empty')
  }
  git(root, ['worktree', 'add', '--detach', plan.worktreePath, plan.baseCommit])
  return verifyWorktree(plan)
}
