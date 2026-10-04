/**
 * Per-phase budgets.
 *
 * The property these tests exist to defend is **no borrowing**: a phase that
 * reaches its own ceiling stops, even with the run budget barely touched. A run
 * total that only ever goes up cannot catch a phase that ate the implementation
 * budget during research, and a test that only checks the run total would pass
 * on exactly the bug this module exists to prevent.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { PhaseAllocator, allocate, InvalidAllocationError } from '../src/phase-budget.ts'
import type { PhaseAllocatorConfig } from '../src/phase-budget.ts'
import { PHASE_ORDER } from '../src/phases.ts'

/** A clock the tests drive by hand, so no test sleeps. */
function clock(start = 0): { now: () => number; advance: (ms: number) => void } {
  let t = start
  return { now: () => t, advance: (ms: number) => { t += ms } }
}

/** A $1 run over 90 steps — plenty for one phase, not for all five. */
function config(over: Partial<PhaseAllocatorConfig> = {}): PhaseAllocatorConfig {
  return { runBudgetUSD: 1, runMaxSteps: 90, ...over }
}

describe('allocate', () => {
  it('gives every phase a ceiling and holds a buffer back', () => {
    const run = allocate(config())
    assert.equal(run.phases.length, PHASE_ORDER.length)
    assert.ok(run.bufferUSD > 0, 'the buffer must be withheld from every phase')
    assert.equal(Math.round(run.bufferUSD * 1e6), 100_000, 'a $1 run holds back $0.10')
  })

  it('never lets the phases plus the buffer exceed the run budget', () => {
    const run = allocate(config({ runBudgetUSD: 12.5 }))
    const total = run.phases.reduce((sum, p) => sum + p.maxSpendUSD, 0) + run.bufferUSD
    assert.ok(Math.abs(total - 12.5) < 1e-9, `expected $12.50 allocated, got $${total}`)
  })

  it('rejects a run budget that cannot be split', () => {
    assert.throws(() => allocate(config({ runBudgetUSD: 0 })), InvalidAllocationError)
    assert.throws(() => allocate(config({ runBudgetUSD: Number.NaN })), InvalidAllocationError)
    assert.throws(() => allocate(config({ runMaxSteps: 0 })), InvalidAllocationError)
  })

  it('rejects shares that do not leave room for the buffer', () => {
    // A share set summing past 1 would let a phase reach into the reservation,
    // which defeats the buffer entirely.
    const over = Object.fromEntries(PHASE_ORDER.map(p => [p, 0.2])) as Record<string, number>
    assert.throws(() => allocate(config({ shares: over })), /must equal 1/)
  })

  it('names every problem at once rather than the first', () => {
    assert.throws(
      () => allocate(config({ runBudgetUSD: -1, runMaxSteps: -1 })),
      err => (err as Error).message.includes('runBudgetUSD') && (err as Error).message.includes('runMaxSteps'),
    )
  })

  it('rejects a non-integer per-phase step cap', () => {
    assert.throws(() => allocate(config({ maxSteps: { test: 2.5 } })), /maxSteps for test must be an integer/)
  })

  it('lets an explicit step cap override the derived one', () => {
    const run = allocate(config({ maxSteps: { research: 3 } }))
    assert.equal(run.phases.find(p => p.phase === 'research')?.maxSteps, 3)
    // The other phases keep their derived caps rather than collapsing.
    assert.ok((run.phases.find(p => p.phase === 'implement')?.maxSteps ?? 0) > 1)
  })
})

describe('per-phase ceilings', () => {
  it('stops a phase at its own ceiling while the run still has room', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 10, maxSteps: { research: 2 } }))
    allocator.enterPhase('research')
    allocator.countStep('research')
    assert.equal(allocator.verdict('research').kind, 'ok')
    allocator.countStep('research')
    const verdict = allocator.verdict('research')
    assert.equal(verdict.kind, 'stop')
    assert.match(verdict.reason, /research step ceiling reached \(2 steps\)/)
    assert.ok(allocator.totalSpent() === 0, 'the run budget is untouched — this is a phase stop, not a run stop')
  })

  it('stops a phase on cost even when the run has plenty left', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 10 }))
    allocator.enterPhase('research')
    const researchCeiling = allocator.ceilingFor('research').maxSpendUSD
    allocator.spend('research', researchCeiling)
    const verdict = allocator.verdict('research')
    assert.equal(verdict.kind, 'stop')
    assert.match(verdict.reason, /research cost ceiling reached/)
    assert.ok(allocator.totalSpent() < 10, 'the run budget must still have room, proving the stop is the phase\'s')
  })

  it('warns before it stops', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 10 }))
    const ceiling = allocator.ceilingFor('research').maxSpendUSD
    allocator.spend('research', ceiling * 0.85)
    const verdict = allocator.verdict('research')
    assert.equal(verdict.kind, 'warn')
    assert.match(verdict.reason, /85% spent/)
  })

  it('does not let a later phase spend an earlier phase\'s leftover', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 10 }))
    allocator.spend('research', allocator.ceilingFor('research').maxSpendUSD * 2)
    // Research is wildly over its share. Implement must not inherit the surplus.
    assert.equal(allocator.verdict('implement').kind, 'ok')
    allocator.spend('implement', allocator.ceilingFor('implement').maxSpendUSD)
    assert.equal(allocator.verdict('implement').kind, 'stop')
  })
})

describe('the pre-call guard', () => {
  it('lets work proceed below the guard fraction', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 1 }))
    allocator.spend('implement', 0.5)
    assert.equal(allocator.preCallGuard().kind, 'ok')
  })

  it('stops new work at 90% of the working share, keeping the buffer', () => {
    // The book: alert at 90%, not 100%, because the last 10% pays for the answer.
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 1 }))
    allocator.spend('implement', 0.81) // 90% of the $0.90 working share
    const verdict = allocator.preCallGuard()
    assert.equal(verdict.kind, 'stop')
    assert.match(verdict.reason, /reserved for the report/)
  })

  it('is enforced by verdict(), so no caller can skip it', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 1 }))
    allocator.spend('ship', 0.9)
    assert.equal(allocator.verdict('ship').kind, 'stop')
  })

  it('honours a custom guard fraction', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 1, callGuardFraction: 0.5 }))
    allocator.spend('implement', 0.46)
    assert.equal(allocator.preCallGuard().kind, 'stop')
  })

  it('rejects a guard fraction outside (0, 1]', () => {
    assert.throws(() => new PhaseAllocator(config({ callGuardFraction: 0 })), /must be in \(0, 1\]/)
    assert.throws(() => new PhaseAllocator(config({ callGuardFraction: 1.5 })), /must be in \(0, 1\]/)
  })
})

describe('wall-clock ceilings', () => {
  it('stops a phase that is slow rather than busy', () => {
    // The reason a step ceiling alone is not a bound: a loop making slow calls
    // never spends its way to a step limit.
    const c = clock()
    const allocator = new PhaseAllocator(config({ phaseTimeoutMs: 60_000, now: c.now }))
    allocator.enterPhase('implement')
    c.advance(60_000)
    const verdict = allocator.verdict('implement')
    assert.equal(verdict.kind, 'stop')
    assert.match(verdict.reason, /implement wall-clock ceiling reached \(1\.0min of 1\.0min\)/)
  })

  it('stops a run whose total time is spent even with steps and dollars left', () => {
    const c = clock()
    const allocator = new PhaseAllocator(config({ timeoutMs: 30_000, now: c.now }))
    c.advance(30_000)
    assert.equal(allocator.verdict('research').kind, 'stop')
    assert.match(allocator.verdict('research').reason, /run wall-clock ceiling reached/)
  })

  it('checks the run clock before the phase clock', () => {
    const c = clock()
    const allocator = new PhaseAllocator(config({ timeoutMs: 30_000, phaseTimeoutMs: 60_000, now: c.now }))
    c.advance(30_000)
    assert.match(allocator.verdict('research').reason, /run wall-clock/, 'a run that is out of time cannot be rescued by the phase')
  })

  it('does not fire early', () => {
    const c = clock()
    const allocator = new PhaseAllocator(config({ phaseTimeoutMs: 60_000, now: c.now }))
    allocator.enterPhase('implement')
    c.advance(59_999)
    assert.equal(allocator.verdict('implement').kind, 'ok')
  })

  it('restarts a phase clock on re-entry', () => {
    const c = clock()
    const allocator = new PhaseAllocator(config({ phaseTimeoutMs: 60_000, now: c.now }))
    allocator.enterPhase('implement')
    c.advance(59_000)
    allocator.enterPhase('implement') // the TEST → IMPLEMENT retry
    c.advance(59_000)
    assert.equal(allocator.verdict('implement').kind, 'ok', 'the retry must not inherit the failed attempt\'s clock')
  })

  it('reports phase wall time', () => {
    const c = clock()
    const allocator = new PhaseAllocator(config({ now: c.now }))
    allocator.enterPhase('prd')
    c.advance(1_500)
    assert.equal(allocator.usage('prd').wallMs, 1_500)
  })
})

describe('usage accounting', () => {
  it('prices steps into their phase and totals across phases', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 1 }))
    allocator.spend('research', 0.02)
    allocator.spend('implement', 0.03)
    assert.equal(allocator.usage('research').spentUSD, 0.02)
    assert.ok(Math.abs(allocator.totalSpent() - 0.05) < 1e-9)
  })

  it('counts steps per phase', () => {
    const allocator = new PhaseAllocator(config())
    allocator.countStep('research')
    allocator.countStep('research')
    allocator.countStep('prd')
    assert.equal(allocator.usage('research').steps, 2)
    assert.equal(allocator.usage('prd').steps, 1)
  })

  it('treats a negative or non-finite cost as zero rather than crediting the phase', () => {
    // A budget that can be credited is a budget a provider error can drain.
    const allocator = new PhaseAllocator(config())
    allocator.spend('research', -5)
    allocator.spend('research', Number.NaN)
    assert.equal(allocator.usage('research').spentUSD, 0)
  })

  it('reports a fraction, not a percentage', () => {
    const allocator = new PhaseAllocator(config({ runBudgetUSD: 10 }))
    allocator.spend('research', allocator.ceilingFor('research').maxSpendUSD / 2)
    assert.equal(allocator.usage('research').fraction, 0.5)
  })

  it('lists every phase in spine order', () => {
    const allocator = new PhaseAllocator(config())
    assert.deepEqual(allocator.allUsage().map(u => u.phase), [...PHASE_ORDER])
  })
})

describe('phase tracking', () => {
  it('remembers which phase it thinks is running', () => {
    const allocator = new PhaseAllocator(config())
    assert.equal(allocator.currentPhase, undefined)
    allocator.enterPhase('prd')
    assert.equal(allocator.currentPhase, 'prd')
  })
})
