/**
 * The check for the runner's control flow.
 *
 * Every case here uses the scripted client, so the loop's *decisions* are
 * tested without a model or a network. That is the point of the scripted
 * client's existence: a loop whose control flow can only be exercised against a
 * live model is a loop whose control flow is not tested.
 *
 * Run: `node --experimental-strip-types --test test/runner.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runLoop, canonicalArgs, buildSystemPrompt } from '../src/runner.ts'
import type { LoopRunnerOptions, ReviewRequest } from '../src/runner.ts'
import { createScriptedClient } from '../src/llm.ts'
import type { LlmResult } from '../src/llm.ts'
import { createTools } from '../src/tools.ts'
import { phaseOf } from '../src/prompts.ts'
import type { LoopSpec } from '../src/spec.ts'

/** A spec that runs fast and never touches the network. */
function spec(overrides: Partial<LoopSpec> = {}): LoopSpec {
  return {
    goal: 'the verify command exits 0',
    sensor: ['files', 'test output'],
    controller: { ladder: [{ provider: 'xiaomi', model: 'mimo-v2.5' }] },
    actuator: { read_file: 'read', edit_file: 'reversible-write', run_tests: 'read' },
    feedback: 'verify exits 0',
    termination: { successCommand: 'true', guards: ['tool-cycle'] },
    maxSteps: 10,
    costBudgetUSD: 1,
    prices: { 'xiaomi/mimo-v2.5': { inputPerMTok: 1, outputPerMTok: 1 } },
    ...overrides,
  }
}

/** A tool that records what it was asked to do. */
function recordingTools(calls: string[]) {
  return [{
    name: 'read_file',
    description: 'read',
    parameters: { type: 'object' as const, properties: { path: { type: 'string' as const, description: 'p' } }, required: ['path'] },
    reversibility: 'read' as const,
    run(args: Record<string, unknown>) {
      calls.push(String(args.path))
      return Promise.resolve({ ok: true, output: `contents of ${String(args.path)}` })
    },
  }]
}

/** A tool call result, reporting usage as a real gateway does. */
function callTool(name: string, args: Record<string, unknown>): LlmResult {
  return {
    content: '',
    toolCalls: [{ id: `c${String(Math.random())}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }],
    usage: { inputTokens: 100, outputTokens: 20 },
  }
}

test('goal-met: the run ends the moment the success condition holds', async () => {
  const llm = createScriptedClient([
    callTool('read_file', { path: 'a.ts' }),
    callTool('read_file', { path: 'b.ts' }),
  ])
  let checks = 0
  const result = await runLoop({
    spec: spec(),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => {
      checks += 1
      return Promise.resolve({ ok: checks >= 2, output: 'ok' })
    },
  })
  assert.equal(result.outcome, 'goal-met')
  // Two model calls, and the loop stopped as soon as the check passed rather
  // than waiting for the model to declare itself finished.
  assert.equal(llm.calls.length, 2)
  assert.equal(result.steps, 2)
})

test('budget-stop: the step ceiling stops the run before the model is called', async () => {
  const llm = createScriptedClient([callTool('read_file', { path: 'a.ts' })])
  const result = await runLoop({
    spec: spec({ maxSteps: 2 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    // Never succeeds, so only the ceiling can stop it.
    checkSuccess: () => Promise.resolve({ ok: false, output: 'still failing' }),
  })
  assert.equal(result.outcome, 'budget-stop')
  assert.equal(result.steps, 2)
  // Crucially: no third model call was made. A run over its ceiling must not
  // spend money discovering that.
  assert.equal(llm.calls.length, 2)
})

test('budget-stop: a cost ceiling stops the run even with steps remaining', async () => {
  const llm = createScriptedClient(Array.from({ length: 10 }, () => callTool('read_file', { path: 'a.ts' })))
  const result = await runLoop({
    spec: spec({ maxSteps: 10, costBudgetUSD: 0.0000001 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'still failing' }),
  })
  assert.equal(result.outcome, 'budget-stop')
  assert.ok(result.spentUSD > 0, 'the run must have recorded spend before the ceiling stopped it')
})

test('tool-cycle: three identical calls raise a critical signal', async () => {
  const llm = createScriptedClient(Array.from({ length: 6 }, () => callTool('read_file', { path: 'same.ts' })))
  const result = await runLoop({
    spec: spec({ maxSteps: 6 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'still failing' }),
  })
  const cycle = result.signals.find(s => s.kind === 'tool-cycle')
  assert.ok(cycle !== undefined, 'a repeated identical call must raise a cycle signal')
  assert.equal(cycle.severity, 'critical')
})

test('a critical signal routes to a human, and the operator can abort', async () => {
  const llm = createScriptedClient(Array.from({ length: 6 }, () => callTool('read_file', { path: 'same.ts' })))
  const requests: ReviewRequest[] = []
  const result = await runLoop({
    spec: spec({ maxSteps: 6 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'still failing' }),
    onReview: (request) => {
      requests.push(request)
      return Promise.resolve({ kind: 'abort', reason: 'stuck in a loop' })
    },
  })
  assert.equal(result.outcome, 'aborted')
  assert.ok(requests.length >= 1, 'the operator must have been asked')
  assert.equal(requests[0]!.decision.source, 'signal')
  assert.equal(requests[0]!.signals.some(s => s.kind === 'tool-cycle'), true)
})

test('the reversibility gate asks before a write and does not ask before a read', async () => {
  const llm = createScriptedClient([
    callTool('read_file', { path: 'a.ts' }),
    callTool('edit_file', { path: 'a.ts' }),
  ])
  const requests: ReviewRequest[] = []
  const tools = [
    ...recordingTools([]),
    {
      name: 'edit_file',
      description: 'edit',
      parameters: { type: 'object' as const, properties: { path: { type: 'string' as const, description: 'p' } }, required: ['path'] },
      reversibility: 'reversible-write' as const,
      run: () => Promise.resolve({ ok: true, output: 'edited' }),
    },
  ]
  await runLoop({
    spec: spec({ maxSteps: 2 }),
    phase: phaseOf('bugfix'),
    tools,
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'still failing' }),
    onReview: (request) => {
      requests.push(request)
      return Promise.resolve({ kind: 'continue' })
    },
  })
  // The read is auto; the write is asked about because no confidence estimate
  // was supplied and `reversible-write` defaults to auto-if-confident.
  const writeAsk = requests.find(r => r.pending.includes('edit_file'))
  assert.ok(writeAsk !== undefined, 'a reversible write with no confidence estimate must be asked about')
  assert.equal(requests.some(r => r.pending.includes('read_file')), false, 'a read must not interrupt the human')
})

test('a premature stop is not treated as success', async () => {
  const llm = createScriptedClient([
    { content: 'I have fixed the bug!', toolCalls: [] },
    { content: 'It is definitely fixed.', toolCalls: [] },
    { content: 'Trust me.', toolCalls: [] },
    { content: 'Still nothing.', toolCalls: [] },
  ])
  const result = await runLoop({
    spec: spec({ maxSteps: 10 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    // The observable condition never holds, so the model's claims are not
    // evidence. This is the book's "separate success from stopping".
    checkSuccess: () => Promise.resolve({ ok: false, output: 'the bug is still there' }),
    maxPrematureStops: 2,
  })
  assert.equal(result.outcome, 'model-stop')
  assert.notEqual(result.outcome, 'goal-met')
})

test('an unpriceable route is refused rather than silently priced at zero', async () => {
  const llm = createScriptedClient([callTool('read_file', { path: 'a.ts' })])
  await assert.rejects(
    runLoop({
      spec: spec({ prices: {}, unpricedFallback: undefined }),
      phase: phaseOf('bugfix'),
      tools: recordingTools([]),
      llm,
      checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
    }),
    /unpriceable|no price/i,
  )
})

test('a transport error ends the run as an error instead of looping forever', async () => {
  const failing = {
    complete: () => Promise.reject(new Error('gateway exploded')),
  }
  const result = await runLoop({
    spec: spec(),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm: failing,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
  })
  assert.equal(result.outcome, 'error')
  assert.equal(result.steps, 1)
})

test('an unknown tool is reported to the model, not thrown at it', async () => {
  const llm = createScriptedClient([
    callTool('does_not_exist', { path: 'a.ts' }),
    callTool('read_file', { path: 'a.ts' }),
  ])
  const result = await runLoop({
    spec: spec({ maxSteps: 2 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
  })
  // The run continued past the bad call rather than dying on it.
  assert.equal(result.steps, 2)
  assert.equal(llm.calls.length, 2)
})

test('malformed tool arguments do not crash the loop', async () => {
  const llm = createScriptedClient([
    { content: '', toolCalls: [{ id: 'x', type: 'function', function: { name: 'read_file', arguments: '{not json' } }] },
    callTool('read_file', { path: 'a.ts' }),
  ])
  const result = await runLoop({
    spec: spec({ maxSteps: 2 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
  })
  assert.equal(result.steps, 2)
})

test('canonicalArgs ignores key order, so a reordered repeat is still a cycle', () => {
  assert.equal(canonicalArgs({ a: 1, b: 2 }), canonicalArgs({ b: 2, a: 1 }))
  assert.notEqual(canonicalArgs({ a: 1 }), canonicalArgs({ a: 2 }))
})

test('the model id sent is provider/model, never double-prefixed', async () => {
  // A full gateway id in `model` plus a provider would send
  // `xiaomi/xiaomi/mimo-v2.5`, which is a different model name — and one the
  // gateway may resolve to something else, or reject. Guard the join.
  const llm = createScriptedClient([callTool('read_file', { path: 'a.ts' })])
  await runLoop({
    spec: spec({ controller: { ladder: [{ provider: 'xiaomi', model: 'mimo-v2.5' }] } }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
  })
  assert.equal(llm.calls[0], 'xiaomi/mimo-v2.5')
})

test('a provider-less route sends the bare model id, with no stray slash', async () => {
  const llm = createScriptedClient([callTool('read_file', { path: 'a.ts' })])
  await runLoop({
    spec: spec({
      controller: { ladder: [{ model: 'local-model' }] },
      prices: { 'default/local-model': { inputPerMTok: 1, outputPerMTok: 1 } },
    }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
  })
  assert.equal(llm.calls[0], 'local-model')
})

test('the review budget holds the human to the configured fraction', async () => {
  // Ten identical calls: cycle signals fire, but the router must not ask on
  // every single step.
  const llm = createScriptedClient(Array.from({ length: 10 }, () => callTool('read_file', { path: 'same.ts' })))
  let asked = 0
  await runLoop({
    spec: spec({ maxSteps: 10 }),
    phase: phaseOf('bugfix'),
    tools: recordingTools([]),
    llm,
    router: { reviewBudget: 0.1 },
    checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
    onReview: () => {
      asked += 1
      return Promise.resolve({ kind: 'continue' })
    },
  })
  // A critical signal always surfaces, so asks are driven by the signal rather
  // than the budget here; the budget's own behaviour is covered in policy.test.ts.
  assert.ok(asked >= 1)
})

test('the system prompt carries the phase rules and the goal', () => {
  const prompt = buildSystemPrompt(spec({ goal: 'make auth.spec.ts pass' }), phaseOf('bugfix'))
  assert.match(prompt, /make auth\.spec\.ts pass/)
  assert.match(prompt, /1\. First, write a failing test/)
  assert.match(prompt, /at most 10 steps/)
})

test('the sandbox confines a tool to the root — an escape is a failed step, not a crash', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-runner-'))
  try {
    await writeFile(join(root, 'inside.txt'), 'hello\n')
    const tools = createTools({ root })
    const llm = createScriptedClient([
      callTool('read_file', { path: '../../etc/passwd' }),
      callTool('read_file', { path: 'inside.txt' }),
    ])
    const result = await runLoop({
      spec: spec({ maxSteps: 2 }),
      phase: phaseOf('bugfix'),
      tools,
      llm,
      checkSuccess: () => Promise.resolve({ ok: false, output: 'no' }),
    })
    // The escape attempt was recorded as a failed step; the run carried on.
    const escaped = result.transcript.find(e => e.kind === 'tool' && e.preview.includes('escape'))
    assert.ok(escaped !== undefined, 'an escaping path must be reported as a failure')
    assert.equal(result.steps, 2)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
