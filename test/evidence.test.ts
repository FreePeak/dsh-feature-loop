/**
 * The evidence bundle: what it writes, and what it refuses to claim.
 *
 * The assertion that matters most here is the negative one — a run whose writes
 * cannot be evidenced must not render as READY. A bundle that rounds up to green
 * on unevidenced work is worse than no bundle, because it is trusted.
 *
 * Runs against a real temporary directory rather than a mock, because the thing
 * under test is partly the file layout: a report that renders correctly but
 * writes to the wrong path is a bug no pure-function test would catch.
 */

import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'

import {
  EVIDENCE_FILES,
  appendStep,
  bundleExists,
  captureArtifact,
  phaseRecord,
  renderReport,
  unverifiedSteps,
  verdictOf,
  writeBundle,
} from '../src/evidence.ts'
import type { RunRecord, StepRecord } from '../src/runlog.ts'
import type { PhaseUsage } from '../src/phase-budget.ts'

const dirs: string[] = []
function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fl-evidence-'))
  dirs.push(dir)
  return dir
}
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }) })

/** A record with every pipeline field populated, as a completed run would have. */
function record(over: Partial<RunRecord> = {}): RunRecord {
  return {
    runId: 'run-1',
    startedAt: 1_760_000_000_000,
    endedAt: 1_760_000_060_000,
    pass: 1,
    passes: 1,
    taskKey: 'abc123',
    outcome: 'goal-met',
    steps: 12,
    maxSteps: 90,
    costUSD: 0.42,
    budgetUSD: 2,
    unpricedSteps: 0,
    byRoute: {},
    stepLatencyMs: [],
    wallMs: 60_000,
    latencyKind: 'round-trip',
    signals: [],
    judgeScores: [],
    reviewFraction: 0,
    specFingerprint: 'deadbeef',
    evidenceDir: '.feature-loop/runs/run-1',
    phases: [
      { phase: 'research', startedAt: 1, endedAt: 2, steps: 3, costUSD: 0.04, budgetUSD: 0.2, outcome: 'passed', exitGate: 'research note with at least one cited source: docs/0-research.md present', exitGatePassed: true, artifacts: ['docs/0-research.md'] },
      { phase: 'implement', startedAt: 2, endedAt: 3, steps: 6, costUSD: 0.30, budgetUSD: 0.7, outcome: 'passed', exitGate: 'at least one tracked file changed: 4 file(s) changed', exitGatePassed: true, artifacts: ['src/a.ts'] },
    ],
    trajectory: [
      { index: 1, phase: 'research', tool: 'write', evidence: ['docs/0-research.md'], verified: true, costUSD: 0.02 },
      { index: 2, phase: 'research', tool: 'read' },
      { index: 3, phase: 'implement', tool: 'edit', evidence: [], verified: false, costUSD: 0.01 },
    ],
    ...over,
  }
}

describe('unverifiedSteps', () => {
  it('counts only write steps with nothing to show', () => {
    // A read step has nothing to evidence and is not a failure; conflating the
    // two would bury the real number under every file the loop ever opened.
    const steps: StepRecord[] = [
      { index: 1, phase: 'implement', tool: 'read' },
      { index: 2, phase: 'implement', tool: 'write', evidence: ['a.ts'], verified: true },
      { index: 3, phase: 'implement', tool: 'write', evidence: [], verified: false },
      { index: 4, phase: 'implement', tool: 'edit', evidence: [], verified: false },
    ]
    assert.equal(unverifiedSteps(steps), 2)
  })

  it('is zero for a run with no write steps at all', () => {
    assert.equal(unverifiedSteps([{ index: 1, phase: 'research', tool: 'read' }]), 0)
  })
})

describe('verdictOf', () => {
  it('is READY for a met goal with nothing unverified', () => {
    assert.equal(verdictOf(record({ unverifiedSteps: 0 })), 'READY')
  })

  it('is UNVERIFIED when a write cannot be evidenced, whatever the outcome', () => {
    // The interesting case: the run reached its goal AND wrote something it
    // cannot prove. Reporting READY here is the whole failure mode.
    assert.equal(verdictOf(record({ unverifiedSteps: 2 })), 'UNVERIFIED')
    assert.equal(verdictOf(record({ unverifiedSteps: 1, outcome: 'budget-stop' })), 'UNVERIFIED')
  })

  it('computes the count from the steps when the record omits it', () => {
    const r = record()
    delete (r as { unverifiedSteps?: number }).unverifiedSteps
    assert.equal(verdictOf(r), 'UNVERIFIED', 'one of the fixture steps is unverified')
  })

  it('passes through the outcome when the goal was not met and nothing is unverified', () => {
    assert.equal(verdictOf(record({ outcome: 'budget-stop', unverifiedSteps: 0 })), 'budget-stop')
  })
})

describe('renderReport', () => {
  it('leads with the verdict', () => {
    assert.match(renderReport(record({ unverifiedSteps: 0 })), /^\# Run run-1\n\n\*\*Verdict: READY\*\*/)
  })

  it('prints the unverified count in words, not as a pass', () => {
    const text = renderReport(record({ unverifiedSteps: 3 }))
    assert.match(text, /⚠️ Unverified steps/)
    assert.match(text, /\*\*3 write step\(s\) produced no captured artifact\.\*\*/)
    assert.match(text, /not reported as a success/)
  })

  it('omits the unverified section entirely when there is nothing to report', () => {
    assert.doesNotMatch(renderReport(record({ unverifiedSteps: 0 })), /Unverified steps/)
  })

  it('renders a phase table with each phase budget beside its spend', () => {
    const text = renderReport(record())
    assert.match(text, /## Phases/)
    assert.match(text, /\| `research` \| passed \| 3 \| \$0\.0400 \| \$0\.2000 \|/)
    assert.match(text, /✅ research note with at least one cited source/)
  })

  it('marks a failed gate with ❌ rather than hiding the phase', () => {
    const text = renderReport(record({
      phases: [{ phase: 'test', startedAt: 1, steps: 2, costUSD: 0.1, budgetUSD: 0.3, outcome: 'blocked', exitGate: 'the project test command exits 0: exit 1', exitGatePassed: false }],
    }))
    assert.match(text, /❌ the project test command exits 0: exit 1/)
  })

  it('lists every captured artifact with the step that produced it', () => {
    const text = renderReport(record())
    assert.match(text, /- step 1 \(`research`\) → `docs\/0-research\.md`/)
  })

  it('states that an unpriced run under-counts rather than reporting a clean total', () => {
    const text = renderReport(record({ unpricedSteps: 4 }))
    assert.match(text, /⚠️ Unpriced steps/)
    assert.match(text, /priced at \$0\.00/)
    assert.match(text, /treat it as a floor, not a total/)
  })

  it('says "not measured" rather than $0.00 for a cost it does not have', () => {
    const text = renderReport(record({ costUSD: Number.NaN }))
    assert.match(text, /not measured/)
  })

  it('lists signals with their severity, and says where the detail lives', () => {
    // `RunRecord.signals` is kind + severity only; the step and the detector's
    // one-liner stay in the feed. Rendering a blank column and implying the
    // detail is missing would be the wrong kind of tidy.
    const text = renderReport(record({
      signals: [{ kind: 'tool-cycle', severity: 'critical', detail: '3× identical edit', step: 4 }],
    }))
    assert.match(text, /\| tool-cycle \| critical \|/)
    assert.match(text, /activity feed/)
  })

  it('links the pull request when the run got one', () => {
    assert.match(renderReport(record({ prUrl: 'https://github.com/o/r/pull/7' })), /\| Pull request \| https:\/\/github\.com\/o\/r\/pull\/7 \|/)
  })

  it('omits the pull request row rather than printing a blank one', () => {
    assert.doesNotMatch(renderReport(record()), /Pull request/)
  })

  it('names the evidence directory so the bundle can be found again', () => {
    assert.match(renderReport(record()), /\| Evidence \| `\.feature-loop\/runs\/run-1` \|/)
  })
})

describe('writeBundle', () => {
  it('writes the report and the phase ledger, and creates artifacts/', () => {
    const dir = join(scratch(), 'runs', 'run-1')
    assert.equal(bundleExists(dir), false)
    writeBundle(dir, record())
    assert.equal(bundleExists(dir), true)
    assert.ok(readFileSync(join(dir, EVIDENCE_FILES.report), 'utf8').includes('Verdict: UNVERIFIED'))
    const phases = JSON.parse(readFileSync(join(dir, EVIDENCE_FILES.phases), 'utf8'))
    assert.equal(phases.runId, 'run-1')
    assert.equal(phases.phases.length, 2)
  })

  it('returns the directory it wrote', () => {
    const dir = join(scratch(), 'run-2')
    assert.equal(writeBundle(dir, record()), dir)
  })
})

describe('appendStep', () => {
  it('writes one parseable JSON line per step, appending', () => {
    const dir = scratch()
    appendStep(dir, { index: 1, phase: 'research', tool: 'write', costUSD: 0.01 })
    appendStep(dir, { index: 2, phase: 'implement', tool: 'edit', costUSD: 0.02, verified: false })
    const lines = readFileSync(join(dir, EVIDENCE_FILES.steps), 'utf8').trim().split('\n')
    assert.equal(lines.length, 2)
    assert.equal(JSON.parse(lines[1]!).verified, false)
  })

  it('creates the directory when a step arrives before anything else', () => {
    const dir = join(scratch(), 'fresh')
    appendStep(dir, { index: 1, phase: 'research' })
    assert.ok(readFileSync(join(dir, EVIDENCE_FILES.steps), 'utf8').length > 0)
  })

  it('never lets a newline inside a step split the line', () => {
    // A literal newline in the payload would corrupt the file for every later
    // reader, and only for the steps that happened to contain prose.
    const dir = scratch()
    appendStep(dir, { index: 1, phase: 'implement', tool: 'write', evidence: ['a\nb.ts'] })
    const raw = readFileSync(join(dir, EVIDENCE_FILES.steps), 'utf8')
    assert.equal(raw.trim().split('\n').length, 1)
    assert.deepEqual(JSON.parse(raw).evidence, ['a\nb.ts'])
  })
})

describe('captureArtifact', () => {
  it('writes under artifacts/ and returns a bundle-relative path', () => {
    const dir = scratch()
    const rel = captureArtifact(dir, 'research.md', '# findings')
    assert.equal(rel, 'artifacts/research.md')
    assert.equal(readFileSync(join(dir, rel), 'utf8'), '# findings')
  })

  it('sanitises a name so an artifact cannot escape the directory', () => {
    const dir = scratch()
    const rel = captureArtifact(dir, '../../etc/passwd', 'x')
    assert.ok(!rel.includes('..'), `path escaped: ${rel}`)
    assert.equal(rel, 'artifacts/etc-passwd')
  })

  it('falls back to a usable name when nothing survives sanitising', () => {
    assert.equal(captureArtifact(scratch(), '///', 'x'), 'artifacts/artifact')
  })
})

describe('phaseRecord', () => {
  const usage: PhaseUsage = {
    phase: 'test', steps: 4, spentUSD: 0.12, maxSpendUSD: 0.3, maxSteps: 14, fraction: 0.4, wallMs: 9000,
  }

  it('records the phase budget, not the run budget', () => {
    // The whole reason the phase ledger exists: a phase's spend must be read
    // beside the ceiling that would have stopped it.
    assert.equal(phaseRecord(usage, 'passed', 1, 2).budgetUSD, 0.3)
  })

  it('carries the gate verdict only when a gate ran', () => {
    assert.equal(phaseRecord(usage, 'budget-stop', 1, 2).exitGate, undefined)
    assert.equal(phaseRecord(usage, 'passed', 1, 2, { detail: 'exit 0', pass: true }).exitGatePassed, true)
  })

  it('defaults to no artifacts rather than an empty claim of work', () => {
    assert.deepEqual(phaseRecord(usage, 'passed', 1, 2).artifacts, [])
  })
})
