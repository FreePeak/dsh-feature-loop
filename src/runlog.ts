/**
 * The run record: one line per completed run, the substrate everything else
 * derives from.
 *
 * Envelope derivation, the three metrics, and the optimizer are all functions
 * over this one shape. They live in their own modules and read nothing but
 * these records, which is the same seam `budget.ts` and `signals.ts` already
 * use: policy is pure, I/O is here, and a harness upgrade cannot change what a
 * number means.
 *
 * One JSONL file, append-only, Node builtins only. A new runtime dependency on
 * this path would be a new attack surface next to the dashboard's approval
 * endpoint, and a database would be a system whose only job is to remember
 * numbers this file already holds.
 *
 * @module dsh-feature-loop/runlog
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname } from 'node:path'

/** How a run ended. Mirrors `runner.ts`'s `Outcome` as a plain string union. */
export type RunOutcome =
  | 'goal-met'
  | 'budget-stop'
  | 'model-stop'
  | 'aborted'
  | 'blocked'
  | 'error'

/** Where the latency figure came from. A proxy is labelled, never presented as a measurement. */
export type LatencyKind = 'round-trip' | 'model'

/**
 * One completed run, as the envelope, the metrics and the optimizer read it.
 *
 * Every field here has exactly one consumer. If a field would be read by none,
 * it does not belong in the file: a run record that grows faster than it is
 * read becomes a log nobody trusts.
 */
export interface RunRecord {
  runId: string
  startedAt: number
  endedAt: number
  /** Which refinement pass produced this, 1-based. */
  pass: number
  /** Total refinement passes requested for the task. 1 when not refining. */
  passes: number
  /** Stable key for the goal, so envelopes are per-task rather than global. */
  taskKey: string
  outcome: RunOutcome
  steps: number
  maxSteps: number
  costUSD: number
  budgetUSD: number
  /**
   * Steps the adapter priced at zero because it reported no usage. Non-zero
   * means `costUSD` is an under-count, and every cost number derived from it
   * must be suppressed rather than believed.
   */
  unpricedSteps: number
  byRoute: Readonly<Record<string, { steps: number; usd: number }>>
  /** Per-step latency, the speed axis. Empty when the transport timed nothing. */
  stepLatencyMs: number[]
  wallMs: number
  /** Whether `stepLatencyMs` measures the whole round trip or just the model call. */
  latencyKind: LatencyKind
  signals: readonly { kind: string; severity: string }[]
  /** Every judge score for the run, 0–3. */
  judgeScores: readonly number[]
  reviewFraction: number
  /** Laya's 0–3 score on the final artifact, when one was asked for. */
  qualityScore?: number
  /** Fingerprint of the spec that produced this run, so unlike configs never mix. */
  specFingerprint: string
}

/** The default history path, relative to the workspace root. */
export const DEFAULT_HISTORY = '.feature-loop/runs.jsonl'

/**
 * A stable key for a goal.
 *
 * Hashed rather than stored verbatim: the goal is free text that routinely
 * carries file paths and code, and putting it on every line of an append-only
 * file makes the log a leak as well as a record. The hash is enough to group
 * runs by task, which is all the envelope asks of it.
 *
 * @param goal - the run's stated goal.
 * @returns a short hex digest.
 */
export function taskKeyOf(goal: string): string {
  return createHash('sha256').update(goal).digest('hex').slice(0, 16)
}

/**
 * Fingerprint a spec, so an envelope is never derived across two configs.
 *
 * Only the dimensions that change a run's shape are hashed — the ladder, the
 * ceilings, the prices and the termination guards. A run under a different
 * ladder would have a different step distribution, and mixing them would make
 * the P95 the envelope is built on a number about two different loops.
 *
 * @param spec - the shape of the config, as JSON-serialisable fields.
 * @returns a short hex digest, or `'none'` when nothing was supplied.
 */
export function specFingerprint(spec: unknown): string {
  if (spec === undefined || spec === null) return 'none'
  return createHash('sha256').update(stableStringify(spec)).digest('hex').slice(0, 12)
}

/**
 * JSON with sorted keys.
 *
 * `JSON.stringify` on an object literal follows insertion order, so two
 * configs written in a different key order would fingerprint differently and
 * split one task into two. Sorting makes the fingerprint a property of the
 * values, not of how someone typed them.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
  return `{${entries.join(',')}}`
}

/**
 * The result of reading a history file.
 *
 * `malformed` is reported rather than hidden: a partial last line means a run
 * was lost mid-append, and a log that silently drops runs produces an envelope
 * built on fewer observations than the caller believes.
 */
export interface ReadResult {
  records: RunRecord[]
  /** Lines that could not be parsed, skipped instead of throwing. */
  malformed: number
  /** Whether the file did not exist at all. */
  missing: boolean
}

/**
 * Read a history file, tolerating a torn line.
 *
 * A crash mid-append leaves a truncated final line. Throwing there would turn
 * one lost run into an unusable history, so the bad line is counted and skipped
 * and the rest of the file is used.
 *
 * @param path - the history file.
 * @returns every parseable record, plus what was skipped.
 */
export function readRecords(path: string): ReadResult {
  if (!existsSync(path)) return { records: [], malformed: 0, missing: true }
  const records: RunRecord[] = []
  let malformed = 0
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        malformed += 1
        continue
      }
      records.push(parsed as RunRecord)
    } catch {
      malformed += 1
    }
  }
  return { records, malformed, missing: false }
}

/**
 * Append one record as a single line.
 *
 * Single `O_APPEND` write of a whole line: concurrent runs interleave lines
 * rather than corrupting each other. The directory is created on demand so the
 * first run on a fresh machine does not fail for want of a folder.
 *
 * @param path - the history file.
 * @param record - the run to record.
 */
export function appendRecord(path: string, record: RunRecord): void {
  mkdirSync(dirname(path), { recursive: true })
  // One write of one line. A newline must never appear inside the payload, and
  // it cannot: JSON.stringify escapes newlines in strings.
  appendFileSync(path, `${JSON.stringify(record)}\n`, { encoding: 'utf8', flag: 'a' })
}
