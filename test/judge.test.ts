/**
 * The check for the attention router's judge.
 *
 * The interesting cases are the ones a reasoning model actually produces: a
 * reply that quotes the rubric we sent it, or one whose content is empty because
 * every token went to thinking. Both look like a score to a careless parser, and
 * both would silently route the wrong steps to a human.
 *
 * Run: `node --experimental-strip-types --test test/judge.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { createChatJudge, parseScore } from '../src/judge.ts'
import type { LlmClient, LlmResult } from '../src/llm.ts'
import { judgeQuestion } from '../src/review.ts'

const QUESTIONS = judgeQuestion('read_file src/auth.ts', []).questions

test('a labelled answer is read', () => {
  assert.equal(parseScore('SCORE=2'), 2)
  assert.equal(parseScore('SCORE: 0'), 0)
  assert.equal(parseScore('score = 3'), 3)
})

test('a bare digit is read only when the whole reply is the digit', () => {
  assert.equal(parseScore('2'), 2)
  assert.equal(parseScore('  3  '), 3)
  assert.equal(parseScore('```\n1\n```'), 1)
})

test('the rubric text is NOT read back as the answer', () => {
  // This is the failure that matters: we send the model a rubric containing
  // "0 = routine", "3 = stop". A parser that grabs the first bare digit reads
  // the rubric, not the reply.
  const echoedRubric = 'Scale:\n  0 = routine, reversible, no detector fired\n  3 = stop: irreversible'
  assert.equal(parseScore(echoedRubric), undefined)
})

test('an empty reply is not a score of zero', () => {
  // A thinking model whose entire token budget went to reasoning returns empty
  // content. Treating that as 0 would make the judge look calm when it is
  // actually unavailable.
  assert.equal(parseScore(''), undefined)
  assert.equal(parseScore('   \n  '), undefined)
})

test('an out-of-range labelled value is refused, not clamped', () => {
  assert.equal(parseScore('SCORE=7'), undefined)
  assert.equal(parseScore('SCORE=9'), undefined)
})

test('a thinking reply that ends with the answer is read correctly', () => {
  const thinking = [
    'The step is a reversible write to a source file.',
    'It is consistent with the goal.',
    'No detector fired.',
    'SCORE=1',
  ].join('\n')
  assert.equal(parseScore(thinking), 1)
})

test('the chat judge returns the score the model labelled', async () => {
  const llm: LlmClient = {
    complete: (): Promise<LlmResult> => Promise.resolve({ content: 'SCORE=2', toolCalls: [] }),
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  const result = await judge.score('state', QUESTIONS)
  assert.equal(result.score, 2)
  assert.equal(result.error, undefined)
})

test('the chat judge asks for enough tokens that a thinking model can answer', async () => {
  let seenMaxTokens: number | undefined
  const llm: LlmClient = {
    complete: (request): Promise<LlmResult> => {
      seenMaxTokens = request.maxTokens
      return Promise.resolve({ content: 'SCORE=1', toolCalls: [] })
    },
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  await judge.score('state', QUESTIONS)
  // A cap of a few tokens is consumed entirely by reasoning, which is exactly
  // how the judge went silently unavailable on every step of the first demo run.
  assert.ok((seenMaxTokens ?? 0) >= 64, `expected a workable cap, got ${String(seenMaxTokens)}`)
})

test('an unparseable reply is reported as an error rather than a score', async () => {
  const llm: LlmClient = {
    complete: (): Promise<LlmResult> => Promise.resolve({ content: '', toolCalls: [] }),
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  const result = await judge.score('state', QUESTIONS)
  assert.equal(result.score, undefined)
  assert.match(result.error ?? '', /empty content/)
})

test('a judge that ran out of tokens thinking says so, not "no digit"', async () => {
  // Measured against xiaomi/mimo-v2.5: max_tokens 256 returns finish_reason
  // "length" with empty content. The operator needs that sentence, because the
  // fix is a bigger cap or a non-reasoning judge — not a different prompt.
  const llm: LlmClient = {
    complete: (): Promise<LlmResult> => Promise.resolve({ content: '', toolCalls: [], finishReason: 'length' }),
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  const result = await judge.score('state', QUESTIONS)
  assert.equal(result.score, undefined)
  assert.match(result.error ?? '', /exhausted its \d+-token budget while thinking/)
  assert.match(result.error ?? '', /Laya/)
})

test('a judge that returned prose without a label is quoted back for diagnosis', async () => {
  const llm: LlmClient = {
    complete: (): Promise<LlmResult> => Promise.resolve({ content: 'I think this is fine.', toolCalls: [], finishReason: 'stop' }),
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  const result = await judge.score('state', QUESTIONS)
  assert.equal(result.score, undefined)
  assert.match(result.error ?? '', /without a SCORE=<digit> line/)
})

test('the chat judge gives up after repeated failures instead of asking every step', async () => {
  let calls = 0
  const llm: LlmClient = {
    complete: (): Promise<LlmResult> => {
      calls += 1
      return Promise.reject(new Error('gateway down'))
    },
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  for (let i = 0; i < 6; i += 1) await judge.score('state', QUESTIONS)
  // Three attempts, then it stops: a dead judge costs a few calls, not one per
  // step for the rest of the run.
  assert.equal(calls, 3)
  const last = await judge.score('state', QUESTIONS)
  assert.match(last.error ?? '', /gave up/)
})

test('a transient failure does not permanently disable the judge', async () => {
  let calls = 0
  const llm: LlmClient = {
    complete: (): Promise<LlmResult> => {
      calls += 1
      if (calls === 1) return Promise.reject(new Error('blip'))
      return Promise.resolve({ content: 'SCORE=0', toolCalls: [] })
    },
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  const first = await judge.score('state', QUESTIONS)
  assert.equal(first.score, undefined)
  const second = await judge.score('state', QUESTIONS)
  assert.equal(second.score, 0, 'one blip must not downgrade the whole run to detectors-only')
})

test('a missing question is reported rather than answered with a guess', async () => {
  const llm: LlmClient = {
    complete: (): Promise<LlmResult> => Promise.resolve({ content: 'SCORE=3', toolCalls: [] }),
  }
  const judge = createChatJudge({ llm, model: 'test-model' })
  const result = await judge.score('state', {})
  assert.equal(result.score, undefined)
  assert.match(result.error ?? '', /no review_worthiness question/)
})
