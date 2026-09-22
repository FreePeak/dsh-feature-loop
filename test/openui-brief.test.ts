/**
 * The review brief's checks: the OpenUI allowlist is enforced at parse time,
 * normalization fails whole on anything malformed, and the prompt the model
 * is told is generated from the same library the parser enforces.
 *
 * Run: `node --experimental-strip-types --test test/openui-brief.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { briefSystemPrompt, normalizeBrief } from '../src/openui-brief.ts'
import type { BriefNode } from '../src/openui-brief.ts'

function nodesOf(code: string): BriefNode[] {
  const result = normalizeBrief(code)
  assert.ok('nodes' in result, `expected nodes, got error: ${'error' in result ? result.error : '?'}`)
  return result.nodes
}

function errorOf(code: string): string {
  const result = normalizeBrief(code)
  assert.ok('error' in result, 'expected an error, got nodes')
  return result.error
}

test('a well-formed brief normalizes to typed nodes', () => {
  const nodes = nodesOf([
    'root = Stack([h, risk, body])',
    'h = CardHeader("write: package.json")',
    'risk = Callout("warning", "Irreversible: edits 1 file")',
    'body = TextContent("No backup exists.")',
  ].join('\n'))
  assert.deepEqual(nodes, [
    { kind: 'heading', text: 'write: package.json' },
    { kind: 'callout', tone: 'warning', text: 'Irreversible: edits 1 file' },
    { kind: 'paragraph', text: 'No backup exists.' },
  ])
})

test('tables and code blocks normalize', () => {
  const nodes = nodesOf([
    'root = Stack([t, c])',
    't = Table(["step", "ceiling"], [["4", "12"]])',
    'c = CodeBlock("text", "rm -rf build/")',
  ].join('\n'))
  assert.equal(nodes.length, 2)
  assert.equal(nodes[0]?.kind, 'table')
  assert.equal(nodes[1]?.kind, 'code')
})

test('a model-emitted Button never becomes a node', () => {
  const result = normalizeBrief('root = Stack([b])\nb = Button("Approve", "act1")')
  assert.ok('error' in result, 'Button must not normalize')
  assert.ok((result.details ?? []).some(d => d.includes('Unknown component "Button"')))
})

test('a model-emitted Form never becomes a node', () => {
  assert.equal(errorOf('root = Stack([f])\nf = Form("x")').length > 0, true)
})

test('a truncated stream fails whole, never half-renders', () => {
  assert.equal(errorOf('root = Stack([h])\nh = CardHeader("write: pack'), 'brief stream was truncated')
})

test('reactive props are dropped, never coerced', () => {
  const result = normalizeBrief('root = Stack([h])\nh = CardHeader($tone)')
  assert.ok('error' in result, 'a $ref title must fail normalization')
})

test('an unknown root fails with the parser errors attached', () => {
  const result = normalizeBrief('root = CardHeader("hi")')
  assert.ok('error' in result)
  assert.equal(result.error, 'brief has no Stack root')
})

test('an empty brief fails rather than rendering an empty box', () => {
  assert.equal(errorOf('root = Stack([])'), 'brief rendered nothing')
})

test('garbage input fails with a parse error, never throws', () => {
  const result = normalizeBrief('((((not openui lang')
  assert.ok('error' in result)
})

test('the system prompt is generated from the library, not hand-written', () => {
  const prompt = briefSystemPrompt()
  for (const name of ['Stack', 'CardHeader', 'TextContent', 'Callout', 'Table', 'CodeBlock']) {
    assert.ok(prompt.includes(name), `prompt must name ${name}`)
  }
  assert.ok(!prompt.includes('Button'), 'prompt must not offer Button')
  assert.ok(!prompt.includes('Form'), 'prompt must not offer Form')
})
