/**
 * The check for this plugin's durable message attribution.
 *
 * Run: `node --experimental-strip-types --test test/message-source.test.ts`
 *
 * The bug this exists to prevent is a hard turn failure, not a cosmetic one.
 * The v4 session format refuses `source.kind === 'plugin'` as a retired wrapper
 * (`session-format-v3-to-v4/src/message-sources.ts`), so a notice carrying one
 * kills the turn with:
 *
 *   format v4 message requires a producer-owned source kind
 *
 * That is exactly what shipped once, and it broke every session the plugin
 * touched. The assertions below are the harness's own admission rule, restated.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { featureLoopSource } from '../src/plugin.ts'

/** The harness's retired catch-all — refused at the log boundary. */
const RETIRED_KIND = 'plugin'

test('the source kind is producer-owned, not the retired catch-all', () => {
  const source = featureLoopSource('review: 3 consecutive failing steps')
  assert.notEqual(
    source.kind,
    RETIRED_KIND,
    'kind "plugin" is refused by the v4 format — see message-sources.ts:9',
  )
  assert.equal(source.kind, 'feature-loop')
})

test('the kind is a non-empty string, which is what the format checks', () => {
  // The harness's admission test is: is an object, kind is a string, it is not
  // empty, and it is not "plugin". Assert the whole predicate, not just a field.
  const { kind } = featureLoopSource('x')
  assert.equal(typeof kind, 'string')
  assert.ok(kind.length > 0)
})

test('a notice carries its one-line summary, as the form requires', () => {
  const source = featureLoopSource('budget ceiling reached: $1.00 of $1.00')
  assert.equal(source.form, 'notice')
  assert.equal(source.summary, 'budget ceiling reached: $1.00 of $1.00')
})

test('the summary is bounded to the harness limit', () => {
  // CONTEXT_SUMMARY_MAX_CHARS is 120; exceeding it would put an unbounded
  // caller string into the durable log.
  const source = featureLoopSource('x'.repeat(5_000))
  assert.ok(source.summary.length <= 120, `summary was ${String(source.summary.length)} chars`)
})

test('the summary is collapsed to one line', () => {
  const source = featureLoopSource('line one\n\n  line two\t line three')
  assert.equal(source.summary, 'line one line two line three')
  assert.doesNotMatch(source.summary, /\n/)
})

test('an empty notice still produces an admissible source', () => {
  // Edge case worth pinning: the format checks the source, not the text, so an
  // empty summary must still be a valid attribution rather than a crash.
  const source = featureLoopSource('')
  assert.equal(source.kind, 'feature-loop')
  assert.equal(source.summary, '')
})
