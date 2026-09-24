/**
 * Durable per-turn usage facts used by the DSH budget gate.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { TurnRunLedger, TurnRunRegistry, turnBudgetVerdict } from '../src/turn-ledger.ts'
import type { TokenUsage } from '@deepseek-ai/dsh-llm'

const PRICES = {
  'p/m': {
    inputPerMTok: 1_000_000,
    outputPerMTok: 2_000_000,
    cacheReadPerMTok: 1_000_000,
    cacheWritePerMTok: 1_000_000,
  },
} as const

function stream(usage: TokenUsage): unknown[] {
  return [{ type: 'chunk', time: 1, chunk: { type: 'usage', usage } }]
}

function ledger() {
  return new TurnRunLedger({ sessionId: 'session-a', prices: PRICES })
}

test('a final assistant message is charged exactly once from top-level usage', () => {
  const run = ledger()
  run.consume({ type: 'turn/start', data: { turn: 3 } })
  run.consume({ type: 'request/header', data: { header: { config: { provider: 'p', model: 'm' } } } })
  run.consume({ type: 'step/start', data: { turn: 3, step: 1 } })
  run.consume({
    type: 'assistant/message',
    data: {
      turn: 3,
      step: 1,
      usage: { inputTokens: 10, outputTokens: 2, cacheReadTokens: 5 },
      stream: stream({ inputTokens: 999, outputTokens: 999 }),
      message: { source: { provider: 'p', model: 'm' } },
    },
  })
  run.consume({ type: 'step/end', data: { turn: 3, step: 1 } })
  run.consume({ type: 'turn/end', data: { turn: 3, reason: { kind: 'completed' } } })

  assert.deepEqual(run.snapshot(), {
    runKey: 'session-a#3',
    turn: 3,
    started: true,
    closed: true,
    steps: 1,
    attempts: 1,
    unpricedAttempts: 0,
    spentUSD: 19,
    stopReason: undefined,
    unpricedRoutes: [],
    byRoute: { 'p/m': { attempts: 1, usd: 19 } },
  })
})

test('retry attempts use the active request route and count separately from DSH steps', () => {
  const run = ledger()
  run.consume({ type: 'turn/start', data: { turn: 1 } })
  run.consume({ type: 'request/header', data: { header: { config: { provider: 'p', model: 'm' } } } })
  run.consume({ type: 'step/start', data: { turn: 1, step: 1 } })
  run.consume({
    type: 'assistant/attempt',
    data: { turn: 1, step: 1, stream: stream({ inputTokens: 10, outputTokens: 1 }) },
  })
  run.consume({ type: 'llm/retry-started', data: { turn: 1, step: 1 } })
  run.consume({ type: 'step/end', data: { turn: 1, step: 1 } })
  run.consume({ type: 'step/start', data: { turn: 1, step: 2 } })
  run.consume({
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 2,
      usage: { inputTokens: 2, outputTokens: 1 },
      stream: [],
      message: { source: { provider: 'p', model: 'm' } },
    },
  })
  run.consume({ type: 'step/end', data: { turn: 1, step: 2 } })
  run.consume({ type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } })

  const state = run.snapshot()
  assert.equal(state.steps, 2)
  assert.equal(state.attempts, 2)
  assert.equal(state.spentUSD, 16)
  assert.deepEqual(state.byRoute['p/m'], { attempts: 2, usd: 16 })
})

test('missing, invalid, and unpriced settlements stay visible instead of becoming free', () => {
  const run = ledger()
  run.consume({ type: 'turn/start', data: { turn: 1 } })
  run.consume({ type: 'request/header', data: { header: { config: { provider: 'p', model: 'm' } } } })
  run.consume({ type: 'step/start', data: { turn: 1, step: 1 } })
  run.consume({ type: 'assistant/attempt', data: { turn: 1, step: 1, stream: [] } })
  run.consume({
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 1,
      usage: { inputTokens: -1, outputTokens: 2 },
      stream: [],
      message: { source: { provider: 'p', model: 'm' } },
    },
  })
  run.consume({
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 1,
      usage: { inputTokens: 1, outputTokens: 1 },
      stream: [],
      message: { source: { provider: 'other', model: 'unknown' } },
    },
  })

  const state = run.snapshot()
  assert.equal(state.attempts, 3)
  assert.equal(state.unpricedAttempts, 3)
  assert.equal(state.spentUSD, 0)
  assert.deepEqual(state.unpricedRoutes, ['other/unknown', 'p/m'])
})

test('next-step verdict fails closed on unpriced attempts and enforces both ceilings', () => {
  const priced = ledger()
  priced.consume({ type: 'turn/start', data: { turn: 1 } })
  priced.consume({ type: 'request/header', data: { header: { config: { provider: 'p', model: 'm' } } } })
  priced.consume({ type: 'step/start', data: { turn: 1, step: 1 } })
  priced.consume({
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 1,
      usage: { inputTokens: 10, outputTokens: 2 },
      stream: [],
      message: { source: { provider: 'p', model: 'm' } },
    },
  })
  priced.consume({ type: 'step/end', data: { turn: 1, step: 1 } })

  assert.deepEqual(turnBudgetVerdict({ maxSteps: 3, costBudgetUSD: 100 }, priced.snapshot(), 2), { kind: 'ok' })
  assert.deepEqual(turnBudgetVerdict({ maxSteps: 1, costBudgetUSD: 100 }, priced.snapshot(), 2), {
    kind: 'stop',
    reason: 'step ceiling reached (1 steps)',
  })
  assert.deepEqual(turnBudgetVerdict({ maxSteps: 3, costBudgetUSD: 10 }, priced.snapshot(), 2), {
    kind: 'stop',
    reason: 'cost ceiling reached ($14.0000 of $10.00)',
  })
  assert.equal(
    turnBudgetVerdict({ maxSteps: 3, costBudgetUSD: 20, warnAt: 0.5 }, priced.snapshot(), 2).kind,
    'warn',
  )

  const unpriced = ledger()
  unpriced.consume({ type: 'turn/start', data: { turn: 1 } })
  unpriced.consume({ type: 'assistant/attempt', data: { turn: 1, step: 1, stream: [] } })
  assert.deepEqual(turnBudgetVerdict({ maxSteps: 3, costBudgetUSD: 100 }, unpriced.snapshot(), 2), {
    kind: 'stop',
    reason: 'usage accounting incomplete for 1 attempt(s)',
  })
})

test('a session registry isolates two turns and rebuilds both from ordered events', () => {
  const runs = new TurnRunRegistry({ sessionId: 'session-a', prices: PRICES })
  const events = [
    { type: 'turn/start', data: { turn: 1 } },
    { type: 'request/header', data: { header: { config: { provider: 'p', model: 'm' } } } },
    { type: 'step/start', data: { turn: 1, step: 1 } },
    {
      type: 'assistant/message',
      data: {
        turn: 1,
        step: 1,
        usage: { inputTokens: 10, outputTokens: 2 },
        stream: [],
        message: { source: { provider: 'p', model: 'm' } },
      },
    },
    { type: 'step/end', data: { turn: 1, step: 1 } },
    { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } },
    { type: 'turn/start', data: { turn: 2 } },
    { type: 'request/header', data: { header: { config: { provider: 'p', model: 'm' } } } },
    { type: 'step/start', data: { turn: 2, step: 1 } },
    {
      type: 'assistant/message',
      data: {
        turn: 2,
        step: 1,
        usage: { inputTokens: 1, outputTokens: 1 },
        stream: [],
        message: { source: { provider: 'p', model: 'm' } },
      },
    },
    { type: 'step/end', data: { turn: 2, step: 1 } },
    { type: 'turn/end', data: { turn: 2, reason: { kind: 'completed' } } },
  ]
  for (const event of events) runs.consume(event)

  assert.deepEqual(runs.get(1), {
    runKey: 'session-a#1',
    turn: 1,
    started: true,
    closed: true,
    steps: 1,
    attempts: 1,
    unpricedAttempts: 0,
    spentUSD: 14,
    stopReason: undefined,
    unpricedRoutes: [],
    byRoute: { 'p/m': { attempts: 1, usd: 14 } },
  })
  assert.equal(runs.get(2)?.spentUSD, 3)
  assert.equal(runs.get(2)?.steps, 1)
  assert.equal(runs.get(2)?.attempts, 1)
})

test('only an explicit policy veto records a stop reason', () => {
  const run = ledger()
  assert.equal(run.snapshot().stopReason, undefined)
  run.markStop('cost ceiling')
  assert.equal(run.snapshot().stopReason, 'cost ceiling')
})
