/**
 * The observer and the driver.
 *
 * These are the two modules that do I/O on the gate path, so the tests here are
 * the ones that care most about failure modes: an absent file, a git that errors,
 * a test command that hangs, a path that points outside the worktree. Every one
 * of those must degrade to "gate did not pass" rather than to a thrown error or,
 * worse, a silent pass.
 */

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'

import { changedFiles, observe, readArtifact, runVerify } from '../src/observation.ts'
import type { ObserverContext } from '../src/observation.ts'
import type { CommandRunner } from '../src/sandbox.ts'
import { PhaseAllocator } from '../src/phase-budget.ts'
import { startPipeline } from '../src/pipeline.ts'
import { advancePhase, gateCurrentPhase, observeCurrentPhase, runShip } from '../src/driver.ts'
import type { DriverOptions } from '../src/driver.ts'

const dirs: string[] = []
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }) })

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fl-obs-'))
  dirs.push(dir)
  return dir
}

/** A runner that answers per command prefix. */
function fakeRun(over: Record<string, { code: number; stdout?: string; stderr?: string }> = {}): {
  run: CommandRunner
  calls: { command: string; args: string[] }[]
} {
  const calls: { command: string; args: string[] }[] = []
  return {
    calls,
    run: (command, args) => {
      calls.push({ command, args: [...args] })
      const key = command === 'git' ? `git ${args[0] ?? ''}` : command
      const answer = over[key] ?? over[command]
      return { code: answer?.code ?? 0, stdout: answer?.stdout ?? '', stderr: answer?.stderr ?? '' }
    },
  }
}

describe('readArtifact', () => {
  it('reads a file inside the worktree', () => {
    const root = scratch()
    writeFileSync(join(root, 'note.md'), '# hello')
    assert.equal(readArtifact(root, 'note.md'), '# hello')
  })

  it('returns undefined for an absent file rather than throwing', () => {
    // A gate that reads a missing artifact must FAIL the gate, not abort the run.
    assert.equal(readArtifact(scratch(), 'nope.md'), undefined)
  })

  it('refuses an absolute path — a gate must never read outside the worktree', () => {
    const root = scratch()
    assert.equal(readArtifact(root, '/etc/passwd'), undefined)
  })

  it('refuses a traversal out of the worktree', () => {
    const root = scratch()
    assert.equal(readArtifact(root, '../../etc/passwd'), undefined)
  })

  it('bounds a very large artifact', () => {
    const root = scratch()
    writeFileSync(join(root, 'big.md'), 'x'.repeat(300 * 1024))
    const text = readArtifact(root, 'big.md')
    assert.ok((text?.length ?? 0) <= 256 * 1024)
  })
})

describe('changedFiles', () => {
  const ctx = (run: CommandRunner): ObserverContext => ({ worktreeRoot: '/wt', run })

  it('parses porcelain output including untracked files', () => {
    // `git diff` alone would miss an untracked new file, which is exactly what a
    // run's first write produces.
    const { run } = fakeRun({ 'git status': { code: 0, stdout: ' M src/a.js\n?? src/new.js\nA  src/added.js\n' } })
    assert.deepEqual(changedFiles(ctx(run)), ['src/a.js', 'src/new.js', 'src/added.js'])
  })

  it('takes the destination of a rename', () => {
    const { run } = fakeRun({ 'git status': { code: 0, stdout: 'R  old.js -> new.js\n' } })
    assert.deepEqual(changedFiles(ctx(run)), ['new.js'])
  })

  it('returns empty when git fails, so the changed gate fails rather than throws', () => {
    const { run } = fakeRun({ git: { code: 128, stderr: 'not a repository' } })
    assert.deepEqual(changedFiles(ctx(run)), [])
  })
})

describe('runVerify', () => {
  it('captures the exit code and output', () => {
    const { run } = fakeRun({ sh: { code: 1, stdout: '1 failing\n' } })
    const result = runVerify({ worktreeRoot: '/wt', run }, 'npm test')
    assert.equal(result?.exitCode, 1)
    assert.match(result?.output ?? '', /1 failing/)
  })

  it('records which command ran, so the report does not have to guess', () => {
    const { run } = fakeRun()
    assert.equal(runVerify({ worktreeRoot: '/wt', run }, 'make check')?.command, 'make check')
  })

  it('returns undefined for a blank command', () => {
    const { run } = fakeRun()
    assert.equal(runVerify({ worktreeRoot: '/wt', run }, '   '), undefined)
  })
})

describe('observe', () => {
  it('reads every known gate path, absent ones as undefined', () => {
    const root = scratch()
    mkdirSync(join(root, 'docs'), { recursive: true })
    writeFileSync(join(root, 'docs/PRD.md'), '## Scope')
    writeFileSync(join(root, 'docs/0-research.md'), 'see https://x.test')
    const obs = observe({ phase: 'prd', worktreeRoot: root, run: fakeRun().run })
    assert.match(obs.artifacts['docs/0-research.md'] ?? '', /https/)
    assert.equal(obs.artifacts['docs/PRD.md'], '## Scope')
    // The ship gate's path is read even though this run is nowhere near ship —
    // one read pass serves every gate, and an absent one must be `undefined`
    // rather than missing, because `in` and `!== undefined` disagree.
    assert.ok('.feature-loop/artifacts/pr-url.txt' in obs.artifacts)
    assert.equal(obs.artifacts['.feature-loop/artifacts/pr-url.txt'], undefined)
  })

  it('skips git on a phase whose gate does not count files', () => {
    // Asking git spawns a process. On the research phase it would answer a
    // question no gate asks, on every step.
    const { run, calls } = fakeRun()
    observe({ phase: 'research', worktreeRoot: scratch(), run })
    assert.equal(calls.length, 0)
  })

  it('asks git on the phases whose gate does count files', () => {
    const { run, calls } = fakeRun()
    observe({ phase: 'implement', worktreeRoot: scratch(), run })
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.command, 'git')
  })

  it('runs the verify command only when one is supplied', () => {
    // `test` also asks git what changed (its gate counts files), so the count
    // here is of `sh` calls specifically: a suite run per step would cost more
    // than the phase it is verifying.
    const without = fakeRun()
    observe({ phase: 'test', worktreeRoot: scratch(), run: without.run })
    assert.equal(without.calls.filter(c => c.command === 'sh').length, 0, 'no command configured means no verify spawn')
    const withCmd = fakeRun()
    observe({ phase: 'test', worktreeRoot: scratch(), run: withCmd.run, verifyCommand: 'npm test' })
    assert.equal(withCmd.calls.filter(c => c.command === 'sh').length, 1)
  })
})

function driver(over: Partial<DriverOptions> = {}): DriverOptions {
  const run = startPipeline()
  return {
    repoRoot: '/repo',
    goal: 'Add a CSV converter',
    runId: 'run-1',
    run,
    budget: new PhaseAllocator({ runBudgetUSD: 1, runMaxSteps: 90 }),
    config: {},
    runner: fakeRun().run,
    ...over,
  }
}

const SANDBOX = { worktreeRoot: '/wt', branch: 'fl/x', stopSentinel: '/wt/.feature-loop/STOP' }

describe('gateCurrentPhase', () => {
  it('fails the research gate when the note cites nothing', () => {
    const root = scratch()
    mkdirSync(join(root, 'docs'), { recursive: true })
    writeFileSync(join(root, 'docs/0-research.md'), 'no sources here')
    const result = gateCurrentPhase(driver(), { ...SANDBOX, worktreeRoot: root })
    assert.equal(result.pass, false)
    assert.match(result.detail, /missing "http"/)
  })

  it('passes the research gate on a cited note', () => {
    const root = scratch()
    mkdirSync(join(root, 'docs'), { recursive: true })
    writeFileSync(join(root, 'docs/0-research.md'), 'source: https://example.test')
    assert.equal(gateCurrentPhase(driver(), { ...SANDBOX, worktreeRoot: root }).pass, true)
  })

  it('fails the test gate when no test command is configured', () => {
    const opts = driver()
    opts.run.state = 'test'
    const result = gateCurrentPhase(opts, { ...SANDBOX, worktreeRoot: scratch() })
    assert.equal(result.pass, false)
    assert.match(result.detail, /no verify command was run/)
  })

  it('fails the test gate when the command exits non-zero', () => {
    const root = scratch()
    const { run } = fakeRun({ sh: { code: 1, stdout: 'failing' } })
    const opts = driver({ runner: run, config: { testCommand: 'npm test' } })
    opts.run.state = 'test'
    assert.match(gateCurrentPhase(opts, { ...SANDBOX, worktreeRoot: root }).detail, /exit 1/)
  })

  it('passes the test gate when the command exits zero', () => {
    const root = scratch()
    const { run } = fakeRun({ sh: { code: 0, stdout: 'ok' } })
    const opts = driver({ runner: run, config: { testCommand: 'npm test' } })
    opts.run.state = 'test'
    assert.equal(gateCurrentPhase(opts, { ...SANDBOX, worktreeRoot: root }).pass, true)
  })
})

describe('advancePhase', () => {
  it('moves forward on a passing gate', () => {
    const opts = driver()
    const { moved } = advancePhase(opts, { pass: true, detail: 'ok' })
    assert.equal(moved, true)
    assert.equal(opts.run.state, 'prd')
    assert.equal(opts.run.log.at(-1)?.reason, 'gate-passed')
  })

  it('stands still on a failing gate', () => {
    const opts = driver()
    const { moved, note } = advancePhase(opts, { pass: false, detail: 'no file' })
    assert.equal(moved, false)
    assert.equal(opts.run.state, 'research')
    assert.match(note, /gate not satisfied/)
  })

  it('walks research → prd → implement → test → ship → done', () => {
    const opts = driver()
    const seen: string[] = [opts.run.state]
    for (let i = 0; i < 5; i += 1) {
      advancePhase(opts, { pass: true, detail: 'ok' })
      seen.push(opts.run.state)
    }
    assert.deepEqual(seen, ['research', 'prd', 'implement', 'test', 'ship', 'done'])
  })

  it('sends a failed test back to implement and counts the attempt', () => {
    const opts = driver()
    opts.run.state = 'test'
    const { moved, note } = advancePhase(opts, { pass: false, detail: 'exit 1' })
    assert.equal(moved, true)
    assert.equal(opts.run.state, 'implement')
    assert.equal(opts.run.testAttempts, 1)
    assert.match(note, /back to implement/)
  })

  it('blocks after the book\'s three attempts instead of looping', () => {
    const opts = driver()
    opts.run.state = 'test'
    opts.run.testAttempts = 3
    const { moved } = advancePhase(opts, { pass: false, detail: 'exit 1' })
    assert.equal(moved, true)
    assert.equal(opts.run.state, 'blocked', 'a loop that cannot give up must be stopped by control flow')
  })

  it('does not borrow a phase budget when it retries', () => {
    const opts = driver()
    opts.run.state = 'test'
    const before = opts.budget.usage('implement').steps
    advancePhase(opts, { pass: false, detail: 'exit 1' })
    assert.equal(opts.budget.usage('implement').steps, before)
  })
})

describe('runShip', () => {
  it('writes the PR url where the ship gate can find it', () => {
    // Without this file the ship phase's own gate cannot pass, so a run that
    // opened no PR must not proceed as though it had.
    const root = scratch()
    const { run } = fakeRun({
      'git diff': { code: 1 },
      'git rev-parse': { code: 0, stdout: 'abc1234\n' },
      gh: { code: 0, stdout: 'https://github.com/o/r/pull/9\n' },
    })
    const opts = driver({ runner: run, repoRoot: root })
    const result = runShip(opts, { ...SANDBOX, worktreeRoot: root }, [], 0)
    assert.equal(result.outcome, 'shipped')
    assert.equal(
      readArtifact(root, '.feature-loop/artifacts/pr-url.txt')?.trim(),
      'https://github.com/o/r/pull/9',
    )
  })

  it('writes no file when the PR could not be opened, so the gate stays shut', () => {
    const root = scratch()
    const { run } = fakeRun({ 'git diff': { code: 1 }, gh: { code: 127, stderr: 'gh missing' } })
    const opts = driver({ runner: run, repoRoot: root })
    const result = runShip(opts, { ...SANDBOX, worktreeRoot: root }, [], 0)
    assert.equal(result.outcome, 'committed')
    assert.equal(readArtifact(root, '.feature-loop/artifacts/pr-url.txt'), undefined)
  })
})
