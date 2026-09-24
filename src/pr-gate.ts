/**
 * Fixed command plans for the PR and merge gate.
 *
 * This module never executes `gh` or talks to a network. It validates the
 * smallest inputs needed to build shell-free commands and requires a claim-
 * scoped human approval before a merge plan can be authorized.
 */

export interface CommandPlan {
  executable: 'gh'
  args: string[]
  cwd: string
  shell: false
  networkRequired: true
}

export interface PullRequestPlan extends CommandPlan {
  kind: 'pull-request-create'
  claimId: string
  repository: string
  baseBranch: string
  headBranch: string
  title: string
  bodyFile: string
  draft: boolean
}

export interface MergePlan extends CommandPlan {
  kind: 'pull-request-merge'
  claimId: string
  repository: string
  pullRequest: number
  targetBranch: string
  headCommit: string
}

export interface MergeApproval {
  claimId: string
  scope: 'merge-pull-request'
  approvedAt: number
}

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new TypeError(`${label} must be a non-empty single-line string of at most ${max} characters`)
  }
  return value.trim()
}

function repository(value: string): string {
  const result = text(value, 'GitHub repository', 200)
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(result) || result.includes('..')) {
    throw new TypeError('GitHub repository must be owner/name')
  }
  return result
}

function branch(value: string, label: string): string {
  const result = text(value, label, 255)
  if (result.startsWith('-') || result.includes('..') || result.includes('//') || /[~^:?*[\\]/.test(result)) {
    throw new TypeError(`${label} is not a safe Git branch`)
  }
  return result
}

function commit(value: string): string {
  const result = text(value, 'head commit', 100).toLowerCase()
  if (!/^[0-9a-f]{40}$/.test(result)) throw new TypeError('head commit must be a full 40-character Git SHA')
  return result
}

function claim(value: string): string {
  const result = text(value, 'queue claim id', 200)
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result)) throw new TypeError('queue claim id contains unsafe characters')
  return result
}

function bodyFile(value: string, cwd: string): string {
  const result = text(value, 'PR body file', 2_000)
  if (!result.startsWith('/')) throw new TypeError('PR body file must be an absolute path')
  if (!result.startsWith(`${cwd}/`)) throw new TypeError('PR body file must be inside the isolated worktree')
  return result
}

/** Build a fixed `gh pr create` command; it is not executed here. */
export function planPullRequest(input: {
  claimId: string
  repository: string
  baseBranch: string
  headBranch: string
  title: string
  bodyFile: string
  cwd: string
  draft?: boolean
}): PullRequestPlan {
  const repo = repository(input.repository)
  const cwd = text(input.cwd, 'PR worktree', 2_000)
  const title = text(input.title, 'PR title', 256)
  const body = bodyFile(input.bodyFile, cwd)
  const plan = {
    executable: 'gh' as const,
    args: ['pr', 'create', '--repo', repo, '--base', branch(input.baseBranch, 'base branch'), '--head', branch(input.headBranch, 'head branch'), '--title', title, '--body-file', body],
    cwd,
    shell: false as const,
    networkRequired: true as const,
    kind: 'pull-request-create' as const,
    claimId: claim(input.claimId),
    repository: repo,
    baseBranch: branch(input.baseBranch, 'base branch'),
    headBranch: branch(input.headBranch, 'head branch'),
    title,
    bodyFile: body,
    draft: input.draft === true,
  }
  if (plan.draft) plan.args.push('--draft')
  return plan
}

/** Build a fixed squash-merge command; authorization is separate and explicit. */
export function planMerge(input: {
  claimId: string
  repository: string
  pullRequest: number
  targetBranch: string
  headCommit: string
  cwd: string
}): MergePlan {
  if (!Number.isSafeInteger(input.pullRequest) || input.pullRequest < 1) throw new TypeError('pull request number must be a positive integer')
  const repo = repository(input.repository)
  const target = branch(input.targetBranch, 'merge target branch')
  const head = commit(input.headCommit)
  return {
    executable: 'gh',
    args: ['pr', 'merge', String(input.pullRequest), '--repo', repo, '--squash', '--match-head-commit', head],
    cwd: text(input.cwd, 'merge worktree', 2_000),
    shell: false,
    networkRequired: true,
    kind: 'pull-request-merge',
    claimId: claim(input.claimId),
    repository: repo,
    pullRequest: input.pullRequest,
    targetBranch: target,
    headCommit: head,
  }
}

/** Return the merge command only when the human approval matches its claim. */
export function authorizeMerge(plan: MergePlan, approval: MergeApproval): { kind: 'allow', plan: MergePlan } | { kind: 'deny', reason: string } {
  if (approval.scope !== 'merge-pull-request') return { kind: 'deny', reason: 'merge approval scope does not match this operation' }
  if (approval.claimId !== plan.claimId) return { kind: 'deny', reason: 'merge approval belongs to another feature claim' }
  if (!Number.isFinite(approval.approvedAt) || approval.approvedAt < 0) return { kind: 'deny', reason: 'merge approval has no valid timestamp' }
  return { kind: 'allow', plan }
}
