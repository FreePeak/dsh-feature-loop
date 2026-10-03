/**
 * The sandbox: a run's containment, and the refusal to start without one.
 *
 * Asserts the exact `git` argv rather than merely that "git ran", because the
 * argument list *is* the containment: `git worktree add <path> -b <branch>` in
 * the repo root, never in the user's own checkout. A test that only checked the
 * exit code would pass on a command that created the worktree in the wrong place.
 */

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'

import {
  BRANCH_PREFIX,
  SandboxError,
  branchFor,
  createSandbox,
  isGitRepository,
  removeSandbox,
} from '../src/sandbox.ts'
import type { CommandRunner } from '../src/sandbox.ts'

const dirs: string[] = []
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }) })

/** A scratch directory that looks like a git repository. */
function fakeRepo(withGit = true): string {
  const dir = mkdtempSync(join(tmpdir(), 'fl-sandbox-'))
  dirs.push(dir)
  // A file, not a directory — that is what a linked worktree's `.git` looks
  // like, and `isGitRepository` must accept both shapes.
  if (withGit) writeFileSync(join(dir, '.git'), 'gitdir: /elsewhere/.git/worktrees/x\n')
  else mkdirSync(join(dir, 'src'), { recursive: true })
  return dir
}

/** A runner that records what it was asked and can be told to fail. */
function recorder(result: { code: number; stderr?: string } = { code: 0 }): {
  run: CommandRunner
  calls: { command: string; args: string[]; cwd: string }[]
} {
  const calls: { command: string; args: string[]; cwd: string }[] = []
  return {
    calls,
    run: (command, args, cwd) => {
      calls.push({ command, args, cwd })
      return { code: result.code, stdout: '', stderr: result.stderr ?? '' }
    },
  }
}

describe('branchFor', () => {
  it('slugs the goal into a branch the loop can push', () => {
    assert.equal(branchFor('Add a CSV converter', '3f9a2b1c'), 'fl/add-a-csv-converter-3f9a2b1c')
  })

  it('strips characters git would refuse', () => {
    // The goal is free text: quotes, slashes and newlines all reach it, and all
    // of them end up in a branch name. The `fl/` prefix is the only slash that
    // should survive.
    const branch = branchFor('Fix "foo/bar"\nfor real', 'abcd1234')
    assert.equal(branch, 'fl/fix-foo-bar-for-real-abcd1234')
    assert.doesNotMatch(branch.slice(BRANCH_PREFIX.length), /[/"'\\]/)
  })

  it('falls back to the run id when the goal has nothing sluggable', () => {
    assert.equal(branchFor('!!!', 'abcd1234'), 'fl/abcd1234')
    assert.equal(branchFor('', 'abcd1234'), 'fl/abcd1234')
  })

  it('keeps every branch inside the fl/ namespace', () => {
    for (const goal of ['a', 'Do the thing!!', 'x'.repeat(300)]) {
      assert.ok(branchFor(goal, 'abc123').startsWith(BRANCH_PREFIX), `escaped the namespace: ${goal}`)
    }
  })

  it('bounds the goal so a paragraph does not become a 300-character ref', () => {
    assert.ok(branchFor('x'.repeat(300), 'abc123').length < 70, 'git refs get awkward well before this')
  })

  it('is stable for the same goal and run', () => {
    assert.equal(branchFor('same goal', 'id1'), branchFor('same goal', 'id1'))
  })
})

describe('isGitRepository', () => {
  it('accepts a repository whose .git is a file, as a linked worktree has', () => {
    assert.equal(isGitRepository(fakeRepo(true)), true)
  })

  it('rejects a plain directory', () => {
    assert.equal(isGitRepository(fakeRepo(false)), false)
  })
})

describe('createSandbox', () => {
  it('creates the worktree in the repo, on its own branch', () => {
    const repo = fakeRepo()
    const { run, calls } = recorder()
    const sandbox = createSandbox(repo, 'Add a CSV converter', 'run-7', run)
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.command, 'git')
    assert.deepEqual(calls[0]?.args, [
      'worktree', 'add',
      join(repo, '.feature-loop', 'worktrees', 'run-7'),
      '-b',
      'fl/add-a-csv-converter-run7',
    ])
    assert.equal(calls[0]?.cwd, repo, 'git must run in the repo, not in the worktree it is creating')
    assert.equal(sandbox.worktreeRoot, join(repo, '.feature-loop', 'worktrees', 'run-7'))
    assert.equal(sandbox.branch, 'fl/add-a-csv-converter-run7')
  })

  it('points the stop sentinel inside the worktree', () => {
    const repo = fakeRepo()
    const sandbox = createSandbox(repo, 'x', 'run-1', recorder().run)
    assert.ok(sandbox.stopSentinel.startsWith(sandbox.worktreeRoot), 'the sentinel must live where the run can see it')
  })

  it('refuses to start outside a git repository rather than degrading', () => {
    // The whole point: an unattended run with no containment must not start.
    const { run, calls } = recorder()
    assert.throws(
      () => createSandbox(fakeRepo(false), 'x', 'run-1', run),
      (err: unknown) => {
        assert.ok(err instanceof SandboxError)
        assert.match((err as Error).message, /not a git repository/)
        assert.match((err as Error).message, /gateMode: ask/, 'the message should offer the supervised alternative')
        return true
      },
    )
    assert.equal(calls.length, 0, 'nothing may run before the containment check')
  })

  it('surfaces git\'s own error rather than reporting a sandbox that does not exist', () => {
    const repo = fakeRepo()
    const { run } = recorder({ code: 128, stderr: "fatal: 'fl/x' already exists" })
    assert.throws(
      () => createSandbox(repo, 'x', 'run-1', run),
      /git worktree add failed \(exit 128\): fatal: 'fl\/x' already exists/,
    )
  })

  it('gives distinct branches to two runs on the same goal', () => {
    const repo = fakeRepo()
    const a = createSandbox(repo, 'same goal', 'run-1', recorder().run)
    const b = createSandbox(repo, 'same goal', 'run-2', recorder().run)
    assert.notEqual(a.branch, b.branch, 'two concurrent runs must not collide on one branch')
  })
})

describe('removeSandbox', () => {
  it('removes the worktree by path, not the branch', () => {
    const repo = fakeRepo()
    const { run, calls } = recorder()
    assert.equal(removeSandbox(repo, join(repo, '.feature-loop', 'worktrees', 'run-1'), run), true)
    assert.deepEqual(calls[0]?.args, [
      'worktree', 'remove', '--force',
      join(repo, '.feature-loop', 'worktrees', 'run-1'),
    ])
    assert.ok(!calls[0]?.args.includes('fl/anything'), 'the branch carries the work; removing it would destroy it')
  })

  it('forces past a dirty tree, because an unattended run leaves one', () => {
    const { run, calls } = recorder()
    removeSandbox('/repo', '/repo/wt', run)
    assert.ok(calls[0]?.args.includes('--force'))
  })

  it('reports failure rather than claiming the worktree is gone', () => {
    const { run } = recorder({ code: 1, stderr: 'not a working tree' })
    assert.equal(removeSandbox('/repo', '/repo/wt', run), false)
  })
})
