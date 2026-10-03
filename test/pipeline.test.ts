/**
 * The state machine.
 *
 * The tests here are mostly negative on purpose. A state machine earns its keep
 * by refusing moves, so the assertions that matter are the ones that prove a
 * refused move cannot be expressed.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  InvalidTransitionError,
  TERMINAL_STATES,
  VALID_TRANSITIONS,
  canTransition,
  isTerminal,
  startPipeline,
  stopPipeline,
  transition,
  transitionsFrom,
} from '../src/pipeline.ts'
import type { PipelineRun, PipelineState } from '../src/pipeline.ts'

/** A run parked on a phase, for testing one edge. */
function parkedAt(state: PipelineState, testAttempts = 0): PipelineRun {
  return { state, testAttempts, log: [] }
}

describe('the transition table', () => {
  it('gives every state an entry, including the terminal ones', () => {
    for (const state of ['research', 'prd', 'implement', 'test', 'ship', ...TERMINAL_STATES] as PipelineState[]) {
      assert.ok(Array.isArray(VALID_TRANSITIONS[state]), `${state} needs an entry, even an empty one`)
    }
  })

  it('makes the three end states terminal', () => {
    for (const state of TERMINAL_STATES) {
      assert.equal(isTerminal(state), true, `${state} must be terminal`)
      assert.deepEqual([...transitionsFrom(state)], [])
    }
  })

  it('never routes out of ship except to an end state', () => {
    // Ship ending at a PR is a scope decision expressed as an absent edge: there
    // is no merge, release or deploy in this machine at all.
    const outgoing = transitionsFrom('ship')
    assert.deepEqual([...outgoing].sort(), ['blocked', 'done', 'stopped'])
  })
})

describe('walking the spine', () => {
  it('runs research → prd → implement → test → ship → done', () => {
    const run = startPipeline()
    assert.equal(run.state, 'research')
    for (const to of ['prd', 'implement', 'test', 'ship', 'done'] as PipelineState[]) {
      assert.equal(canTransition(run, to), true, `should be able to reach ${to} from ${run.state}`)
      transition(run, to, 'gate-passed', 1000)
    }
    assert.equal(run.state, 'done')
    assert.equal(run.log.length, 5)
    assert.equal(run.log[0]?.from, 'research')
    assert.equal(run.log[0]?.to, 'prd')
  })

  it('starts in research', () => {
    assert.equal(startPipeline().state, 'research')
  })
})

describe('illegal transitions', () => {
  it('refuses to skip the prd', () => {
    const run = parkedAt('research')
    assert.equal(canTransition(run, 'implement'), false)
    assert.throws(() => transition(run, 'implement', 'gate-passed', 0), InvalidTransitionError)
    assert.equal(run.state, 'research', 'a refused transition must not move the run')
  })

  it('refuses to go backwards from ship', () => {
    const run = parkedAt('ship')
    assert.equal(canTransition(run, 'implement'), false)
    assert.throws(() => transition(run, 'implement', 'gate-passed', 0), /no such edge from ship/)
  })

  it('names the real problem when a finished run tries to continue', () => {
    const run = parkedAt('done')
    assert.throws(
      () => transition(run, 'test', 'gate-passed', 0),
      /done is terminal/,
      'the message must not say "no such edge" — it would hide that the run ended',
    )
  })

  it('leaves a terminal run untouched after a refused move', () => {
    const run = parkedAt('stopped')
    assert.throws(() => transition(run, 'research', 'gate-passed', 0))
    assert.equal(run.state, 'stopped')
  })
})

describe('the test retry edge', () => {
  it('allows test → implement and counts the attempt', () => {
    const run = parkedAt('test')
    transition(run, 'implement', 'test-failed', 0)
    assert.equal(run.state, 'implement')
    assert.equal(run.testAttempts, 1)
  })

  it('refuses the fourth attempt', () => {
    // The book's cap, enforced by control flow rather than by a prompt the model
    // can decline to follow.
    const run = parkedAt('test', 3)
    assert.equal(canTransition(run, 'implement'), false)
    assert.throws(
      () => transition(run, 'implement', 'test-failed', 0),
      /used all 3 attempts — report the failure instead of retrying/,
    )
    assert.equal(run.testAttempts, 3, 'a refused retry must not increment')
  })

  it('lets the run reach blocked rather than looping forever', () => {
    const run = parkedAt('test', 3)
    assert.equal(canTransition(run, 'ship'), true, 'a green test still ships')
    transition(run, 'blocked', 'guard', 0)
    assert.equal(run.state, 'blocked')
    assert.equal(isTerminal('blocked'), true)
  })
})

describe('the replan edge', () => {
  it('lets implement go back to prd when the plan is wrong', () => {
    // Ch5's anti-pattern is stale plan execution — a step whose output
    // contradicts a planning assumption, handled by going back rather than
    // burning the remaining budget on a plan that no longer holds.
    const run = parkedAt('implement')
    transition(run, 'prd', 'guard', 0)
    assert.equal(run.state, 'prd')
  })
})

describe('stopping', () => {
  it('is reachable from every non-terminal state', () => {
    for (const state of ['research', 'prd', 'implement', 'test', 'ship'] as PipelineState[]) {
      const run = parkedAt(state)
      assert.equal(canTransition(run, 'stopped'), true, `${state} must always be able to stop`)
      stopPipeline(run, 'ceiling', 0)
      assert.equal(run.state, 'stopped')
    }
  })

  it('is reachable from every non-terminal state by guard too', () => {
    for (const state of ['research', 'prd', 'implement', 'test', 'ship'] as PipelineState[]) {
      const run = parkedAt(state)
      stopPipeline(run, 'guard', 0)
      assert.equal(run.state, 'stopped')
    }
  })

  it('refuses to stop a run twice', () => {
    // Ending twice is a bug in the caller. Silently accepting it would hide a
    // double-counted budget or a duplicated report.
    const run = parkedAt('research')
    stopPipeline(run, 'ceiling', 0)
    assert.throws(() => stopPipeline(run, 'ceiling', 0), /stopped is terminal/)
  })

  it('lets an operator stop mid-run', () => {
    const run = parkedAt('implement')
    stopPipeline(run, 'operator', 0)
    assert.equal(run.state, 'stopped')
    assert.equal(run.log.at(-1)?.reason, 'operator')
  })
})

describe('the run log', () => {
  it('records every accepted transition with its reason', () => {
    const run = startPipeline()
    transition(run, 'prd', 'gate-passed', 10)
    transition(run, 'implement', 'gate-passed', 20)
    assert.deepEqual(run.log, [
      { from: 'research', to: 'prd', reason: 'gate-passed', at: 10 },
      { from: 'prd', to: 'implement', reason: 'gate-passed', at: 20 },
    ])
  })

  it('records nothing for a refused transition', () => {
    const run = parkedAt('research')
    assert.throws(() => transition(run, 'ship', 'gate-passed', 0))
    assert.equal(run.log.length, 0)
  })
})

describe('canTransition', () => {
  it('does not mutate the run', () => {
    const run = parkedAt('test')
    assert.equal(canTransition(run, 'implement'), true)
    assert.equal(run.testAttempts, 0)
    assert.equal(run.state, 'test')
    assert.equal(run.log.length, 0)
  })
})
