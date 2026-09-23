/**
 * The brief normalizer's checks: the bounds hold, malformed input is refused
 * whole rather than half-rendered, and the prompt describes no component
 * language (because there is none any more).
 *
 * Run: `node --experimental-strip-types --test test/brief.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { briefSystemPrompt, normalizeBrief } from '../src/brief.ts'
import type { BriefNode } from '../src/brief.ts'

function nodesOf(text: string): BriefNode[] {
  const result = normalizeBrief(text)
  assert.ok('nodes' in result, `expected nodes, got: ${'error' in result ? result.error : '?'}`)
  return result.nodes
}

function errorOf(text: string): string {
  const result = normalizeBrief(text)
  assert.ok('error' in result, 'expected an error, got nodes')
  return result.error
}

test('prose becomes paragraphs, one per blank-line-separated block', () => {
  const nodes = nodesOf('First para line one\nline two.\n\nSecond para.')
  assert.deepEqual(nodes, [
    { kind: 'paragraph', text: 'First para line one\nline two.' },
    { kind: 'paragraph', text: 'Second para.' },
  ])
})

test('a leading heading and a list normalize', () => {
  const nodes = nodesOf('# Context\n\n- touches one file\n- adds two deps\n')
  assert.deepEqual(nodes, [
    { kind: 'heading', text: 'Context' },
    { kind: 'list', items: ['touches one file', 'adds two deps'] },
  ])
})

test('a fenced block becomes a code node with its language', () => {
  const nodes = nodesOf('Before.\n\n```text\nrm -rf build/\n```\n\nAfter.')
  assert.deepEqual(nodes, [
    { kind: 'paragraph', text: 'Before.' },
    { kind: 'code', language: 'text', code: 'rm -rf build/' },
    { kind: 'paragraph', text: 'After.' },
  ])
})

test('an unterminated fence is refused, never read to end of input', () => {
  assert.equal(errorOf('Text\n\n```sh\nrm -rf /\nmore'), 'brief had an unterminated code block')
})

test('an empty reply renders nothing rather than an empty box', () => {
  assert.equal(errorOf(''), 'brief rendered nothing')
  assert.equal(errorOf('   \n\n  \n'), 'brief rendered nothing')
})

test('an over-long single string is refused', () => {
  assert.equal(errorOf('x'.repeat(2001)), 'brief contained an over-long string')
})

test('an over-long whole brief is refused before parsing', () => {
  assert.match(errorOf('word '.repeat(5000)), /exceeded 20000 characters/)
})

test('too many list items is refused', () => {
  const list = Array.from({ length: 51 }, (_, i) => `- item ${i}`).join('\n')
  assert.equal(errorOf(list), 'brief list was too long')
})

test('too many nodes is refused', () => {
  const paras = Array.from({ length: 201 }, (_, i) => `p${i}\n`).join('\n')
  assert.equal(errorOf(paras), 'brief had too many nodes')
})

test('a heading-only brief is a valid brief', () => {
  assert.deepEqual(nodesOf('# Write file'), [{ kind: 'heading', text: 'Write file' }])
})

test('non-text input is refused, never coerced', () => {
  assert.equal(errorOf(null as never), 'brief was not text')
  assert.equal(errorOf(42 as never), 'brief was not text')
})

test('the prompt describes prose constructs and no component language', () => {
  const prompt = briefSystemPrompt()
  assert.ok(prompt.includes('# '), 'documents the heading form')
  assert.ok(prompt.includes('- '), 'documents list items')
  assert.ok(prompt.includes('```'), 'documents the code fence')
  assert.ok(!/Component|\(\)|Stack|CardHeader|Callout/.test(prompt), 'no component language remains')
  assert.ok(prompt.includes('NOT told the tool arguments'), 'forbids inventing arguments')
  assert.match(prompt, /do not tell the human to approve/i, 'keeps the decision with the operator')
})
