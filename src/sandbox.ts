/**
 * The sandbox a YOLO run lives in.
 *
 * App B #22 states the principle: *"Code execution tools run in Docker
 * containers. File operations happen in a restricted directory."* A local
 * single-user deployment takes the second half — the container already exists.
 * The run happens in a **git worktree**, which is this repo's own standing rule
 * in `AGENTS.md` applied to the loop itself.
 *
 * A worktree rather than a plain directory for two reasons beyond convenience:
 * the run gets a real branch, so "what did the loop actually do" is a diff; and
 * it can be removed with one command that leaves the user's checkout untouched,
 * which is what makes an unattended run safe to start at all.
 *
 * This is the one module on the plugin path that shells out to `git` outside the
 * ship phase's own commands, and it is deliberately isolated here so
 * `node:child_process` has a single home. Everything the *policy* needs is
 * decided by the pure functions in `yolo.ts`; this module only moves directories.
 *
 * @module dsh-feature-loop/sandbox
 */

import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/** How a command runs. Injected so this module is testable with no git. */
export type CommandRunner = (command: string, args: string[], cwd: string) => { code: number; stdout: string; stderr: string }

/** What {@link createSandbox} produced. */
export interface Sandbox {
  /** Absolute path the run may write to. The envelope's containment root. */
  worktreeRoot: string
  /** The branch the run commits to. Always under `fl/`. */
  branch: string
  /** Where the sentinel the kill switch watches lives. */
  stopSentinel: string
}

/** Where worktrees go, relative to the repository root. */
const WORKTREE_DIR = '.feature-loop/worktrees'

/** The namespace a run's branch lives in, so cleanup can find every one. */
export const BRANCH_PREFIX = 'fl/'

/**
 * A branch name for one run, from its goal.
 *
 * Slugged to a short, boring, collision-resistant name. The goal is free text
 * that routinely carries quotes, slashes and newlines, and it ends up in a branch
 * name that git will refuse — or worse, accept in a shape nobody expects.
 *
 * @param goal - the run's stated goal.
 * @param runId - the run's id, used as the uniquifier.
 * @returns e.g. `fl/add-csv-converter-3f9a2b1c`.
 */
export function branchFor(goal: string, runId: string): string {
  const slug = goal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
  const id = runId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase() || 'run'
  return slug.length === 0 ? `${BRANCH_PREFIX}${id}` : `${BRANCH_PREFIX}${slug}-${id}`
}

/**
 * Thrown when a run cannot be given a sandbox, with what to do about it.
 *
 * A distinct type rather than a bare `Error` because this is the one failure that
 * makes YOLO itself impossible, and the caller must not be able to continue past
 * it — an unattended run with no containment is the exact scenario the envelope
 * was written to prevent.
 */
export class SandboxError extends Error {
  constructor(reason: string) {
    super(`dsh-feature-loop: cannot create a sandbox — ${reason}`)
    this.name = 'SandboxError'
  }
}

/**
 * Whether a directory is inside a git work tree.
 *
 * A shallow check by design — `.git` is a directory in a normal checkout and a
 * *file* in a linked worktree, so the test is "does this path exist", not "is it
 * a directory". Anything deeper would mean importing `node:child_process` to run
 * `git rev-parse`, and the sandbox's own existence proves we are in a work tree.
 *
 * @param root - the candidate repository root.
 * @returns true when `root/.git` exists.
 */
export function isGitRepository(root: string): boolean {
  return existsSync(join(root, '.git'))
}

/**
 * Create the worktree a YOLO run works in.
 *
 * Refuses rather than degrading: a run with no containment must not start, so
 * every failure here is a {@link SandboxError} and the caller stops. "Carry on
 * without a worktree" would be worse than not starting, because the envelope
 * would still allow writes and the root it compared against would be undefined —
 * a boundary that only exists when it is inconvenient.
 *
 * @param repoRoot - the repository the run targets. Must be a git work tree.
 * @param goal - the run's stated goal, slugged into the branch name.
 * @param runId - the run's id.
 * @param run - the command runner; injected so tests assert argv without git.
 * @returns the sandbox the run is confined to.
 * @throws SandboxError when the path is not a repository, or git refuses.
 */
export function createSandbox(repoRoot: string, goal: string, runId: string, run: CommandRunner): Sandbox {
  if (!isGitRepository(repoRoot)) {
    throw new SandboxError(
      `${repoRoot} is not a git repository. YOLO mode runs in a throwaway worktree so an unattended run cannot `
      + 'touch your checkout — run it against a repository, or use gateMode: ask for a supervised run.',
    )
  }
  const branch = branchFor(goal, runId)
  const worktreeRoot = join(repoRoot, WORKTREE_DIR, runId)
  mkdirSync(join(repoRoot, WORKTREE_DIR), { recursive: true })

  const result = run('git', ['worktree', 'add', worktreeRoot, '-b', branch], repoRoot)
  if (result.code !== 0) {
    throw new SandboxError(
      `git worktree add failed (exit ${result.code}): ${(result.stderr || result.stdout).trim() || 'no output'}`,
    )
  }
  return { worktreeRoot, branch, stopSentinel: join(worktreeRoot, '.feature-loop', 'STOP') }
}

/**
 * Remove a run's worktree.
 *
 * `git worktree remove --force` because an unattended run may have left the tree
 * dirty, and refusing to clean up because of that would leave the operator
 * deleting directories by hand after every failed run. The commit history is in
 * the branch, which is not touched here — this removes the working copy, not the
 * work.
 *
 * @param repoRoot - the repository the worktree belongs to.
 * @param worktreeRoot - the worktree to remove.
 * @param run - the command runner.
 * @returns true when the worktree is gone, false when git kept it.
 */
export function removeSandbox(repoRoot: string, worktreeRoot: string, run: CommandRunner): boolean {
  const result = run('git', ['worktree', 'remove', '--force', worktreeRoot], repoRoot)
  return result.code === 0
}
