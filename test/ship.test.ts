/**
 * The ship phase.
 *
 * The assertions are on the **exact argv** for every branch, because the argument
 * list is what the phase does. A test that only checked "git ran" would pass on a
 * command that pushed to the wrong ref, committed the wrong files, or opened a PR
 * with an empty body — and those are the failures that only surface on the one
 * run that mattered.
 *
 * No git, no network, no `gh`: the runner is injected and records what it was
 * asked.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parsePrUrl, prBody, pushAllowed, ship } from '../src/ship.ts'
import type { ShipOptions } from '../src/ship.ts'

const WT = '/tmp/fl-run/worktree'

interface Call { command: string; args: string[]; cwd: string }

/**
 * A runner that answers per-command, defaulting to success.
 *
 * One deliberate exception: `git diff --cached --quiet` defaults to exit **1**,
 * because that is git's own convention for "there are staged changes". Answering
 * 0 by default would make every test take the nothing-staged path, which is the
 * one branch where nothing happens.
 */
function fakeRun(over: Record<string, { code: number; stdout?: string; stderr?: string }> = {}): {
  run: (command: string, args: string[], cwd: string) => { code: number; stdout: string; stderr: string }
  calls: Call[]
} {
  const calls: Call[] = []
  return {
    calls,
    run: (command, args, cwd) => {
      calls.push({ command, args: [...args], cwd })
      const answer = over[command]
      if (answer !== undefined) return { code: answer.code, stdout: answer.stdout ?? '', stderr: answer.stderr ?? '' }
      if (command === 'git' && args[0] === 'diff') return { code: 1, stdout: '', stderr: '' }
      return { code: 0, stdout: 'abc1234\n', stderr: '' }
    },
  }
}

/** A successful `gh pr create`. */
function ghOk(url = 'https://github.com/o/r/pull/42'): Record<string, { code: number; stdout?: string }> {
  return { gh: { code: 0, stdout: `Creating pull request for fl/x into main\n${url}\n` } }
}

function opts(over: Partial<ShipOptions> = {}): ShipOptions {
  return {
    worktreeRoot: WT,
    branch: 'fl/add-a-csv-tool',
    goal: 'Add a CSV converter',
    body: '## What this is\n\nAdd a CSV converter',
    run: fakeRun().run,
    ...over,
  }
}

describe('the happy path', () => {
  it('stages, commits, pushes and opens a PR — in that order', () => {
    const { run, calls } = fakeRun(ghOk())
    const result = ship(opts({ run }))
    // add · diff --cached --quiet · commit · rev-parse · push, then gh.
    assert.deepEqual(calls.map(c => c.command), ['git', 'git', 'git', 'git', 'git', 'gh'])
    assert.deepEqual(calls[0]?.args, ['add', '-A'])
    assert.deepEqual(calls[2]?.args, ['commit', '-m', 'feat: Add a CSV converter'])
    assert.deepEqual(calls[4]?.args, ['push', '-u', 'origin', 'fl/add-a-csv-tool'])
    assert.equal(calls[5]?.args[0], 'pr')
    assert.equal(calls[5]?.args[1], 'create')
    assert.equal(result.outcome, 'shipped')
    assert.equal(result.prUrl, 'https://github.com/o/r/pull/42')
  })

  it('runs every command in the worktree, never in the user\'s checkout', () => {
    const { run, calls } = fakeRun(ghOk())
    ship(opts({ run }))
    for (const call of calls) assert.equal(call.cwd, WT)
  })

  it('stages the paths it was given rather than everything', () => {
    const { run, calls } = fakeRun(ghOk())
    ship(opts({ run, paths: ['src', 'docs'] }))
    assert.deepEqual(calls[0]?.args, ['add', 'src', 'docs'])
  })

  it('records the commit sha from rev-parse, and reads it from that call alone', () => {
    const { run, calls } = fakeRun(ghOk())
    const result = ship(opts({ run }))
    assert.equal(result.commitSha, 'abc1234')
    const revParse = calls.find(c => c.args[0] === 'rev-parse')
    assert.deepEqual(revParse?.args, ['rev-parse', 'HEAD'])
  })

  it('puts the goal in the subject, prefixed once', () => {
    const { run, calls } = fakeRun(ghOk())
    ship(opts({ run, goal: 'feat: already prefixed' }))
    assert.equal(calls[2]?.args[2], 'feat: already prefixed', 'a doubled prefix reads as a mistake')
  })

  it('collapses a multi-line goal into one commit subject', () => {
    const { run, calls } = fakeRun(ghOk())
    ship(opts({ run, goal: 'line one\nline two' }))
    assert.equal(calls[2]?.args[2], 'feat: line one line two')
  })

  it('bounds a very long subject', () => {
    const { run, calls } = fakeRun(ghOk())
    ship(opts({ run, goal: 'x'.repeat(300) }))
    const subject = calls[2]?.args[2] ?? ''
    assert.ok(subject.length <= 78, `subject too long: ${subject.length}`)
  })
})

describe('degrading instead of failing', () => {
  it('reports nothing-to-commit rather than opening an empty PR', () => {
    // `git diff --cached --quiet` exits 0 when there is nothing staged.
    const { run, calls } = fakeRun({ git: { code: 0, stdout: 'abc\n' } })
    const result = ship(opts({ run }))
    assert.equal(result.outcome, 'committed')
    assert.equal(result.prUrl, undefined)
    assert.match(result.detail, /nothing was staged/)
    assert.ok(!calls.some(c => c.command === 'gh'), 'no PR may be opened with no changes')
  })

  it('keeps the commit and reports the sha when the push fails', () => {
    const { run } = fakeRun({ gh: { code: 0, stdout: 'x\n' } })
    let gitCalls = 0
    const result = ship(opts({
      run: (command, args, cwd) => {
        if (command === 'git' && args[0] === 'push') {
          gitCalls += 1
          return { code: 128, stdout: '', stderr: 'remote rejected' }
        }
        return command === 'git' && args[0] === 'diff'
          ? { code: 1, stdout: '', stderr: '' }
          : { code: 0, stdout: 'abc1234\n', stderr: '' }
      },
    }))
    assert.equal(gitCalls, 1)
    assert.equal(result.outcome, 'committed')
    assert.equal(result.commitSha, 'abc1234')
    assert.match(result.detail, /push it yourself to finish/)
  })

  it('keeps the commit and names the branch when gh is missing', () => {
    const result = ship(opts({
      run: (command, args) => command === 'git' && args[0] === 'diff'
        ? { code: 1, stdout: '', stderr: '' }
        : command === 'gh'
          ? { code: 127, stdout: '', stderr: 'gh: command not found' }
          : { code: 0, stdout: 'abc1234\n', stderr: '' },
    }))
    assert.equal(result.outcome, 'committed')
    assert.equal(result.prUrl, undefined)
    assert.match(result.detail, /gh: command not found/)
    assert.match(result.detail, /fl\/add-a-csv-tool/, 'the operator needs to know which branch to push')
  })

  it('says so when gh succeeds but prints no URL', () => {
    // gh's own shape, but reporting a PR that cannot be linked to would be worse
    // than saying the URL is missing.
    const result = ship(opts({
      run: (command, args) => command === 'git' && args[0] === 'diff'
        ? { code: 1, stdout: '', stderr: '' }
        : command === 'gh'
          ? { code: 0, stdout: 'something else entirely\n', stderr: '' }
          : { code: 0, stdout: 'abc\n', stderr: '' },
    }))
    assert.equal(result.outcome, 'committed')
    assert.match(result.detail, /printed no pull request URL/)
  })

  it('never reports a PR it did not get', () => {
    for (const gh of [{ code: 1, stderr: 'boom' }, { code: 0, stdout: 'no url here' }]) {
      const result = ship(opts({
        run: (command, args) => command === 'git' && args[0] === 'diff'
          ? { code: 1, stdout: '', stderr: '' }
          : command === 'gh'
            ? { code: gh.code, stdout: gh.stdout ?? '', stderr: gh.stderr ?? '' }
            : { code: 0, stdout: 'abc\n', stderr: '' },
      }))
      assert.equal(result.prUrl, undefined)
    }
  })

  it('stops before staging when the sentinel is set', () => {
    const { run, calls } = fakeRun(ghOk())
    const result = ship(opts({ run, stopArmed: () => true }))
    assert.equal(calls.length, 0, 'a stopped run must not touch git at all')
    assert.match(result.detail, /stop sentinel/)
  })

  it('passes the PR body through to gh verbatim', () => {
    const { run, calls } = fakeRun(ghOk())
    ship(opts({ run, body: 'body with **markdown** and\nnewlines' }))
    assert.equal(calls.at(-1)?.args.at(-1), 'body with **markdown** and\nnewlines')
  })

  it('logs every command it ran, so the report can show them', () => {
    const { run } = fakeRun(ghOk())
    const result = ship(opts({ run }))
    assert.equal(result.log.length, 6)
    assert.equal(result.log[4]?.command, 'git')
    assert.deepEqual(result.log[4]?.args.slice(0, 2), ['push', '-u'])
  })
})

describe('parsePrUrl', () => {
  it('finds the URL in gh output', () => {
    assert.equal(parsePrUrl('https://github.com/o/r/pull/9\n'), 'https://github.com/o/r/pull/9')
  })

  it('returns nothing rather than a fragment when there is no URL', () => {
    assert.equal(parsePrUrl('no url here'), undefined)
    assert.equal(parsePrUrl(''), undefined)
  })
})

describe('pushAllowed', () => {
  it('allows the run\'s own branch', () => {
    assert.equal(pushAllowed('fl/add-a-csv-tool'), true)
  })

  it('refuses a protected branch before anything runs', () => {
    // A misconfigured branch must be refused up front, not denied mid-sequence
    // with the commit already made.
    for (const branch of ['main', 'master', 'release']) {
      assert.equal(pushAllowed(branch), false, `${branch} must be refused`)
    }
  })
})

describe('prBody', () => {
  const body = (over: Partial<Parameters<typeof prBody>[0]> = {}): string =>
    prBody({
      goal: 'Add a CSV converter',
      reportPath: '.feature-loop/runs/run-1/REPORT.md',
      phases: [
        { phase: 'research', outcome: 'passed', costUSD: 0.04, budgetUSD: 0.2, exitGatePassed: true },
        { phase: 'test', outcome: 'blocked', costUSD: 0.12, budgetUSD: 0.3, exitGatePassed: false },
      ],
      unverified: 0,
      ...over,
    })

  it('states what the run was for, in the operator\'s words', () => {
    assert.match(body(), /Add a CSV converter/)
  })

  it('puts the phase table with budgets and gate results in it', () => {
    assert.match(body(), /\| research \| passed \| ✅ passed \| \$0\.0400 \| \$0\.2000 \|/)
    assert.match(body(), /\| test \| blocked \| ❌ did not pass \|/)
  })

  it('leads the reviewer with the unverified count when there is one', () => {
    const text = body({ unverified: 4 })
    assert.match(text, /⚠️ Read this before merging/)
    assert.match(text, /\*\*4 write step\(s\)/)
    assert.match(text, /treat the unverified steps as unreviewed/)
  })

  it('omits the warning entirely when nothing is unverified', () => {
    assert.doesNotMatch(body(), /Read this before merging/)
  })

  it('points at the evidence bundle', () => {
    assert.match(body(), /\.feature-loop\/runs\/run-1\/REPORT\.md/)
  })

  it('says plainly that no human reviewed the run', () => {
    assert.match(body(), /No human reviewed this run before it was opened/)
  })

  it('renders a phase with no gate result as a dash rather than a pass', () => {
    assert.match(
      prBody({ goal: 'g', reportPath: 'r', unverified: 0, phases: [{ phase: 'ship', outcome: 'passed', costUSD: 0, budgetUSD: 0 }] }),
      /\| ship \| passed \| — \|/,
    )
  })
})
