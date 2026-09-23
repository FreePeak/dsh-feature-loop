/**
 * The check that fails when the record, its keys, or the history file break.
 *
 * Run: `node --experimental-strip-types --test test/runlog.test.ts`
 * No harness, no network, no model call — appends go to a throwaway temp dir.
 */

import { strict as assert } from 'node:assert'
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import type { RunRecord } from '../src/runlog.ts'
import { appendRecord, readRecords, specFingerprint, taskKeyOf } from '../src/runlog.ts'

let runSeq = 0

/** A valid RunRecord with defaults; override only what a test is about. */
function rec(p: Partial<RunRecord> = {}): RunRecord {
  runSeq += 1
  return {
    runId: `run-${runSeq}`,
    startedAt: 0,
    endedAt: 1,
    pass: 1,
    passes: 1,
    taskKey: 'task-a',
    outcome: 'goal-met',
    steps: 5,
    maxSteps: 20,
    costUSD: 0.05,
    budgetUSD: 1,
    unpricedSteps: 0,
    byRoute: {},
    stepLatencyMs: [],
    wallMs: 100,
    latencyKind: 'round-trip',
    signals: [],
    judgeScores: [],
    reviewFraction: 0,
    specFingerprint: 'fp-a',
    ...p,
  }
}

test('append/read round trip: records come back in order on a temp file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'runlog-'))
  try {
    const path = join(dir, 'runs.jsonl')
    const a = rec({ runId: 'a' })
    const b = rec({ runId: 'b' })
    appendRecord(path, a)
    appendRecord(path, b)

    const { records, malformed, missing } = readRecords(path)
    assert.equal(missing, false)
    assert.equal(malformed, 0)
    assert.deepEqual(records, [a, b])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('malformed-line tolerance: a torn last line is skipped and counted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'runlog-'))
  try {
    const path = join(dir, 'runs.jsonl')
    appendRecord(path, rec({ runId: 'kept' }))
    // A crash mid-append leaves a truncated final line with no newline.
    appendFileSync(path, '{"runId":"torn",', { encoding: 'utf8' })

    const { records, malformed, missing } = readRecords(path)
    assert.equal(missing, false)
    assert.equal(malformed, 1)
    assert.equal(records.length, 1)
    assert.equal(records[0]?.runId, 'kept')

    // A missing file is not an error: empty history, nothing skipped.
    const absent = readRecords(join(dir, 'absent.jsonl'))
    assert.deepEqual(absent, { records: [], malformed: 0, missing: true })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('taskKeyOf stability: the same goal always maps to the same key', () => {
  assert.equal(taskKeyOf('ship the fix'), taskKeyOf('ship the fix'))
  assert.notEqual(taskKeyOf('ship the fix'), taskKeyOf('ship another fix'))
})

test('specFingerprint key-order insensitivity: reordered keys hash the same', () => {
  const a = { ladder: [1, 2], ceilings: { steps: 10, cost: 0.5 }, guards: true }
  const b = { guards: true, ceilings: { cost: 0.5, steps: 10 }, ladder: [1, 2] }
  assert.equal(specFingerprint(a), specFingerprint(b))
  assert.notEqual(specFingerprint(a), specFingerprint({ ...a, guards: false }))
  assert.equal(specFingerprint(null), 'none')
  assert.equal(specFingerprint(undefined), 'none')
})
