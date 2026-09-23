/**
 * The check for the questioner: LLM reasoning in, validated typed questions out.
 *
 * No network, no model: a scripted `LlmClient` returns canned replies, so
 * each assertion pins one rule — shape validation per primitive, the 3-question
 * cap, the empty-object reply, fallback on generation failure, and the
 * malformed-JSON path. Live behaviour against `:8091` is recorded by hand
 * (see the module doc), never asserted here — CI has no network.
 *
 * Run: `node --experimental-strip-types --test test/questioner.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import type { LlmClient } from '../src/llm.ts'
import {
  authorQuestions,
  parseQuestions,
  questionerPrompt,
  validateQuestion,
} from '../src/questioner.ts'

/** A chat client that returns one canned reply, recording what it was asked. */
function scriptedLlm(reply: string | Error): LlmClient & { prompts: string[] } {
  const prompts: string[] = []
  return {
    prompts,
    complete(request): Promise<import('../src/llm.ts').LlmResult> {
      prompts.push(request.messages.map(m => m.content ?? '').join('\n'))
      return reply instanceof Error
        ? Promise.reject(reply)
        : Promise.resolve({ content: reply, toolCalls: [] })
    },
  }
}

const FALLBACK = () => ({
  state: 'fallback state',
  questions: {
    review_worthiness: {
      type: 'score' as const,
      instructions: 'fixed rubric',
      criteria: ['routine', 'look', 'worth a look', 'stop'],
    },
  },
})

test('validateQuestion accepts a score with an ordered array ladder', () => {
  const q = validateQuestion('k', {
    type: 'score',
    instructions: 'how risky?',
    criteria: ['routine', 'risky', 'stop'],
  })
  assert.deepEqual(q, {
    type: 'score',
    instructions: 'how risky?',
    criteria: ['routine', 'risky', 'stop'],
  })
})

test('validateQuestion coerces a numeric-key score map into an ordered array', () => {
  // LLMs often emit {"0":"low","1":"high"}; the wire wants the array so Laya
  // keeps the human labels instead of the map keys.
  const q = validateQuestion('k', {
    type: 'score',
    instructions: 'how risky?',
    criteria: { '0': 'routine', '1': 'risky', '2': 'stop' },
  })
  assert.deepEqual(q?.criteria, ['routine', 'risky', 'stop'])
})

test('validateQuestion rejects a score without a ladder', () => {
  assert.equal(validateQuestion('k', { type: 'score', instructions: 'how risky?' }), undefined)
  assert.equal(
    validateQuestion('k', { type: 'score', instructions: 'how risky?', criteria: ['only'] }),
    undefined,
  )
})

test('validateQuestion rejects a choice with fewer than two options', () => {
  assert.equal(
    validateQuestion('k', { type: 'choice', instructions: 'pick', criteria: { a: 'only' } }),
    undefined,
  )
  assert.notEqual(
    validateQuestion('k', { type: 'choice', instructions: 'pick', criteria: { a: 'x', b: 'y' } }),
    undefined,
  )
})

test('validateQuestion rejects unknown types and empty instructions; noul ignores criteria', () => {
  assert.equal(validateQuestion('k', { type: 'prose', instructions: 'x' }), undefined)
  assert.equal(validateQuestion('k', { type: 'noul', instructions: '  ' }), undefined)
  // noul needs only instructions — stray criteria are ignored, not fatal.
  assert.notEqual(
    validateQuestion('k', { type: 'noul', instructions: 'is this harmful?', criteria: { yes: '  ' } }),
    undefined,
  )
  assert.notEqual(validateQuestion('k', { type: 'noul', instructions: 'is this harmful?' }), undefined)
  assert.equal(validateQuestion('k', 'not an object'), undefined)
})

test('parseQuestions reads fenced or bare JSON, caps at 3, drops invalid', () => {
  const reply = '```json\n'
    + JSON.stringify({
      a: { type: 'noul', instructions: 'harmful?' },
      b: { type: 'score', instructions: 'risk?', criteria: ['low', 'high'] },
      bad: { type: 'score', instructions: 'no ladder' },
      c: { type: 'choice', instructions: 'pick', criteria: { x: 'ex', y: 'why' } },
      d: { type: 'noul', instructions: 'extra, dropped by the cap' },
    })
    + '\n```'
  const out = parseQuestions(reply)
  assert.deepEqual(out.map(q => q.key), ['a', 'b', 'c'])
  assert.deepEqual(out[1]?.question.criteria, ['low', 'high'])
})

test('parseQuestions treats {} and garbage as no questions, not errors', () => {
  assert.deepEqual(parseQuestions('{}'), [])
  assert.deepEqual(parseQuestions('not json at all'), [])
  assert.deepEqual(parseQuestions('[]'), [])
})

test('authorQuestions returns authored questions on a good generation', async () => {
  const llm = scriptedLlm(JSON.stringify({
    risk: { type: 'score', instructions: 'how risky is this step?', criteria: ['routine', 'risky'] },
  }))
  const out = await authorQuestions(
    { llm, model: 'test-model' },
    { reasoning: 'I am about to delete the cache', goal: 'fix the bug', signals: [] },
    FALLBACK,
  )
  assert.equal(out.authored, true)
  assert.deepEqual(Object.keys(out.questions), ['risk'])
  assert.match(llm.prompts[0] ?? '', /delete the cache/)
  assert.match(llm.prompts[0] ?? '', /fix the bug/)
})

test('authorQuestions falls back when generation fails or validates to nothing', async () => {
  const failing = scriptedLlm(new Error('gateway down'))
  const failed = await authorQuestions(
    { llm: failing, model: 'm' },
    { reasoning: 'r', goal: 'g', signals: [] },
    FALLBACK,
  )
  assert.equal(failed.authored, false)
  assert.deepEqual(Object.keys(failed.questions), ['review_worthiness'])

  const empty = scriptedLlm('{}')
  const vacuous = await authorQuestions(
    { llm: empty, model: 'm' },
    { reasoning: 'r', goal: 'g', signals: [] },
    FALLBACK,
  )
  assert.equal(vacuous.authored, false)
})

test('questionerPrompt carries reasoning, goal, signals, and the array-criteria rule', () => {
  const p = questionerPrompt({
    reasoning: 'about to write auth.ts',
    goal: 'ship the fix',
    signals: [{ kind: 'error-cascade', severity: 'critical', step: 3, detail: 'x' }],
  })
  assert.match(p, /about to write auth\.ts/)
  assert.match(p, /ship the fix/)
  assert.match(p, /error-cascade/)
  assert.match(p, /ORDERED ARRAY/)
})
