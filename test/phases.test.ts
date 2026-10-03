/**
 * The phase table and its gates.
 *
 * Pure module, no dependencies: this file runs under CI's no-install job for the
 * same reason `budget.ts` and `signals.ts` do — the policy is assertable without
 * a harness, a gateway, or a model.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  PHASE_ORDER,
  PIPELINE_BUDGET,
  PIPELINE_PHASES,
  evaluateGate,
  nextPhase,
  pipelinePhaseOf,
  renderRules,
  testAttemptsRemain,
} from '../src/phases.ts'
import type { PhaseObservation, PipelinePhase } from '../src/phases.ts'
import { parsePipelineConfig } from '../src/spec.ts'
import type { PipelineConfig } from '../src/spec.ts'

/** An observation that satisfies nothing, so each test states only what it cares about. */
function obs(over: Partial<PhaseObservation> = {}): PhaseObservation {
  return {
    phase: 'research',
    written: [],
    changed: [],
    artifacts: {},
    attempts: 0,
    ...over,
  }
}

describe('the phase table', () => {
  it('has the five phases in order', () => {
    assert.deepEqual([...PHASE_ORDER], ['research', 'prd', 'implement', 'test', 'ship'])
  })

  it('defines every phase it names', () => {
    for (const name of PHASE_ORDER) {
      const phase = pipelinePhaseOf(name)
      assert.equal(phase.name, name)
      assert.ok(phase.label.length > 0, `${name} needs a label for the dashboard rail`)
      assert.ok(phase.rules.length >= 4, `${name} needs real rules, found ${phase.rules.length}`)
      assert.ok(phase.gate !== undefined, `${name} needs an exit gate`)
      assert.ok(phase.produces.length > 0, `${name} needs an inventory of what it produces`)
    }
  })

  it('rejects an unknown phase by name rather than returning undefined', () => {
    assert.throws(() => pipelinePhaseOf('nonsense' as PipelinePhase), /unknown pipeline phase/)
  })

  it('allocates the run budget across phases and keeps a buffer', () => {
    const shares = Object.values(PIPELINE_BUDGET.phaseShares)
    assert.equal(shares.length, PHASE_ORDER.length, 'every phase needs a share')
    for (const phase of PHASE_ORDER) {
      const share = PIPELINE_BUDGET.phaseShares[phase]
      assert.ok(share > 0, `${phase} cannot have a zero share`)
      assert.ok(share < 1, `${phase} cannot have the whole budget`)
    }
    const total = shares.reduce((a, b) => a + b, 0) + PIPELINE_BUDGET.bufferShare
    assert.equal(Math.round(total * 1e9), 1e9, `shares + buffer must sum to 1, got ${total}`)
  })

  it('keeps the buffer out of every phase share', () => {
    // The buffer exists so the terminal report always has tokens (book p34).
    // A phase able to reach it would defeat the reservation.
    assert.ok(PIPELINE_BUDGET.bufferShare > 0)
    for (const phase of PHASE_ORDER) {
      assert.ok(PIPELINE_BUDGET.phaseShares[phase] <= 1 - PIPELINE_BUDGET.bufferShare)
    }
  })

  it('renders rules as a numbered block', () => {
    const text = renderRules(PIPELINE_PHASES.research)
    assert.match(text, /^1\. /)
    assert.ok(text.includes('uncited claim is unverified by definition'), 'the research citation rule must survive rendering')
  })

  it('gives ship no tool that could merge or publish', () => {
    // The phase's actuator is what the gate reads. Ship may run shell commands,
    // so the safety property cannot live here — it lives in yolo.ts. What this
    // asserts is the narrower claim: ship does not get write/edit at all.
    assert.equal(PIPELINE_PHASES.ship.actuator.write, undefined)
    assert.equal(PIPELINE_PHASES.ship.actuator.edit, undefined)
  })

  it('stops research from holding a shell', () => {
    assert.equal(PIPELINE_PHASES.research.actuator.bash, undefined)
  })
})

describe('nextPhase', () => {
  it('walks the spine and stops after ship', () => {
    assert.equal(nextPhase('research'), 'prd')
    assert.equal(nextPhase('prd'), 'implement')
    assert.equal(nextPhase('implement'), 'test')
    assert.equal(nextPhase('test'), 'ship')
    assert.equal(nextPhase('ship'), undefined, 'ship has no next phase — the machine ends there')
  })
})

describe('artifact gates', () => {
  const gate = PIPELINE_PHASES.research.gate
  assert.equal(gate.kind, 'artifact')

  it('fails closed when the artifact was never observed', () => {
    // The probe failing must not be readable as the work succeeding.
    const result = evaluateGate(gate, obs())
    assert.equal(result.pass, false)
    assert.match(result.detail, /not observed/)
  })

  it('fails closed when the artifact was observed as absent', () => {
    const result = evaluateGate(gate, obs({ artifacts: { 'docs/0-research.md': undefined } }))
    assert.equal(result.pass, false)
    assert.match(result.detail, /not observed/)
  })

  it('fails when the text does not contain what the phase must produce', () => {
    const result = evaluateGate(gate, obs({ artifacts: { 'docs/0-research.md': 'all done, no sources' } }))
    assert.equal(result.pass, false)
    assert.match(result.detail, /"http"/)
  })

  it('passes on a cited research note', () => {
    const result = evaluateGate(gate, obs({ artifacts: { 'docs/0-research.md': 'see https://example.com' } }))
    assert.equal(result.pass, true)
    assert.match(result.detail, /present/)
  })

  it('checks every required heading for the PRD, not just the file', () => {
    const prdGate = PIPELINE_PHASES.prd.gate
    assert.equal(prdGate.kind, 'artifact')
    const partial = { 'docs/PRD.md': '## Scope\n## Metrics\n' }
    const result = evaluateGate(prdGate, obs({ artifacts: partial }))
    assert.equal(result.pass, false)
    assert.match(result.detail, /"## Success"/)
  })
})

describe('changed gates', () => {
  const gate = PIPELINE_PHASES.implement.gate
  assert.equal(gate.kind, 'changed')

  it('fails when nothing changed', () => {
    const result = evaluateGate(gate, obs({ phase: 'implement', changed: [] }))
    assert.equal(result.pass, false)
    assert.match(result.detail, /only 0 changed/)
  })

  it('passes on one changed file', () => {
    const result = evaluateGate(gate, obs({ phase: 'implement', changed: ['src/a.ts'] }))
    assert.equal(result.pass, true)
  })
})

describe('command gates', () => {
  const gate = PIPELINE_PHASES.test.gate
  assert.equal(gate.kind, 'command')

  it('fails closed when no verify command was run', () => {
    // A test phase that never ran the tests must not read as a passing test phase.
    const result = evaluateGate(gate, obs({ phase: 'test' }))
    assert.equal(result.pass, false)
    assert.match(result.detail, /no verify command was run/)
  })

  it('fails on a non-zero exit', () => {
    const result = evaluateGate(gate, obs({ phase: 'test', verify: { command: 'npm test', exitCode: 1, output: '' } }))
    assert.equal(result.pass, false)
    assert.match(result.detail, /exit 1/)
  })

  it('passes on exit 0', () => {
    const result = evaluateGate(gate, obs({ phase: 'test', verify: { command: 'npm test', exitCode: 0, output: 'ok' } }))
    assert.equal(result.pass, true)
  })
})

describe('the test attempt cap', () => {
  it('allows exactly three attempts', () => {
    assert.equal(testAttemptsRemain(0), true)
    assert.equal(testAttemptsRemain(1), true)
    assert.equal(testAttemptsRemain(2), true)
    assert.equal(testAttemptsRemain(3), false, 'the fourth attempt must not exist')
    assert.equal(testAttemptsRemain(4), false)
  })

  it('matches the book constant', () => {
    assert.equal(PIPELINE_BUDGET.maxTestAttempts, 3)
  })
})

describe('the pipeline config block', () => {
  it('accepts an absent block, which means the pipeline is off', () => {
    assert.deepEqual(parsePipelineConfig(), {})
    assert.deepEqual(parsePipelineConfig({}), {})
  })

  it('rejects a non-mapping', () => {
    assert.throws(() => parsePipelineConfig([] as unknown as PipelineConfig), /must be a mapping/)
  })

  it('rejects a ceiling that is not positive', () => {
    // The whole package exists so an unbounded loop cannot run. A zero or
    // negative phase budget must stop the plugin from loading, not mean
    // "unlimited".
    assert.throws(() => parsePipelineConfig({ phaseMaxSpendUSD: { research: 0 } }), /an unlimited phase budget is not a budget/)
    assert.throws(() => parsePipelineConfig({ phaseMaxSpendUSD: { research: -1 } }), /an unlimited phase budget is not a budget/)
    assert.throws(() => parsePipelineConfig({ phaseMaxSpendUSD: { research: Number.NaN } }), /an unlimited phase budget is not a budget/)
  })

  it('rejects a phase name it does not know, naming the valid ones', () => {
    assert.throws(
      () => parsePipelineConfig({ phaseMaxSteps: { research: 4, deploy: 2 } }),
      /unknown phase "deploy" — expected one of research, prd, implement, test, ship/,
    )
  })

  it('rejects a non-integer step ceiling', () => {
    assert.throws(() => parsePipelineConfig({ phaseMaxSteps: { test: 0 } }), /must be an integer >= 1/)
    assert.throws(() => parsePipelineConfig({ phaseMaxSteps: { test: 2.5 } }), /must be an integer >= 1/)
  })

  it('requires a real test command, because the test gate depends on one', () => {
    assert.throws(() => parsePipelineConfig({ testCommand: '   ' }), /cannot pass its own exit gate/)
  })

  it('rejects a missing wall-clock ceiling', () => {
    assert.throws(() => parsePipelineConfig({ timeoutMs: 0 }), /only stops when the money does/)
    assert.throws(() => parsePipelineConfig({ phaseTimeoutMs: 0 }), /only stops when the money does/)
  })

  it('names the offending field first, so the reader knows where to look', () => {
    assert.throws(() => parsePipelineConfig({ enabled: 'yes' as unknown as boolean }), /^TypeError: pipeline\.enabled must be/)
  })
})
