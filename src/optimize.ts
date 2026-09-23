/**
 * The composition seam: history in, a planned run and an advisory out.
 *
 * `runlog.ts` reads and writes records, `envelope.ts` derives ceilings from
 * them, `metrics.ts` summarizes them and `optimizer.ts` asks a judge what to
 * change. Each of those is pure and independently tested, and each of them,
 * alone, changes nothing about a running loop. This module is the one place
 * that joins them to a caller, in the two directions the feature is for:
 *
 * - **before a run** — {@link planEnvelope} derives the step and cost ceilings
 *   from this task's history, so `maxSteps` stops being a number someone liked.
 * - **after runs** — {@link advisoryFor} produces the dashboard's Metrics and
 *   Optimizations payloads from the same records.
 *
 * Deliberately not a class and not a service: every function here is a pure
 * transformation except two filesystem reads, which are the reads
 * `runlog.ts` already owns and which this module calls rather than reimplements.
 *
 * @module dsh-feature-loop/optimize
 */

import { resolve } from 'node:path'

import { deriveEnvelope } from './envelope.ts'
import type { Envelope } from './envelope.ts'
import { summarize } from './metrics.ts'
import type { MetricsSummary } from './metrics.ts'
import { proposeOptimizations } from './optimizer.ts'
import type { Recommendation } from './optimizer.ts'
import type { Judge } from './laya.ts'
import { DEFAULT_HISTORY, readRecords, specFingerprint, taskKeyOf } from './runlog.ts'
import type { ReadResult, RunRecord } from './runlog.ts'
import type { LoopSpec } from './spec.ts'

/**
 * The floor a derived step ceiling may land on.
 *
 * Three is the same floor `optimizer.ts`'s `STEP_CEILING_BAND` moves within,
 * quoted from the book's own band: below three a "completion count" cannot
 * separate a loop that works from one that never started. The *upper* bound is
 * the configured `maxSteps`, which is the operator's stated willingness — a
 * derived ceiling may tighten that but never quietly exceed it.
 */
export const DERIVED_MIN_STEPS = 3

/** The default history path, resolved against the invoking workspace. */
export function defaultHistoryPath(cwd: string = process.cwd()): string {
  return resolve(cwd, DEFAULT_HISTORY)
}

/**
 * The records for one task, in file order.
 *
 * `deriveEnvelope` groups by `(taskKey, specFingerprint)` itself and keeps the
 * majority group, which is right when it is handed a milestone. A per-task
 * envelope wants one task's runs specifically: with three goals in the log the
 * majority group may well belong to another one, and an envelope is a promise
 * about *this* goal. Filtering here rather than inside the kernel keeps that
 * kernel's contract ("one config per envelope") intact.
 *
 * @param records - every record read from the history file.
 * @param taskKey - the task to keep.
 * @returns the matching records, in the order they were read.
 */
export function recordsForTask(records: readonly RunRecord[], taskKey: string): RunRecord[] {
  return records.filter(r => r.taskKey === taskKey)
}

/** A run's ceilings, planned from history before the run starts. */
export interface EnvelopePlan {
  /** The spec the run should use: the input spec, with derived ceilings applied. */
  spec: LoopSpec
  /** The derived envelope, when derivation ran; absent when no records existed. */
  envelope?: Envelope
  /** One line per decision, including the ones that left the config alone. */
  provenance: string[]
  /** This task's records, the ones the envelope and the advisory are derived from. */
  records: RunRecord[]
  /** Lines the history file had that could not be parsed. */
  malformed: number
  /** Whether the history file did not exist at all (a first run, not an error). */
  missing: boolean
}

/**
 * Plan a run's ceilings from recorded history.
 *
 * Two knobs the operator owns outrank the derivation, deliberately:
 *
 * - an **explicitly pinned** flag (`--max-steps`, `--budget`) is an instruction,
 *   not a default, and a derivation that overrode it would be the tool arguing
 *   with its operator;
 * - the **configured cost budget is a cap, not a target**. `deriveEnvelope`'s
 *   never-lower guard may raise a derived ceiling above what history says is
 *   needed, and raising it past the dollars the operator said they were willing
 *   to lose would spend money the config never authorised. So the derived cost
 *   is clamped *down* to the configured value and the clamp is recorded.
 *
 * A provisional envelope (fewer than five usable records) is not applied at
 * all: it is a floor wearing a measurement's costume, and its own module says
 * not to believe it yet.
 *
 * @param input - the history path, the task identity, the spec and the pins.
 * @returns the spec to run, plus the provenance of every ceiling decision.
 */
export function planEnvelope(input: {
  historyPath: string
  goal: string
  spec: LoopSpec
  /** Which ceilings the operator set explicitly, and therefore owns. */
  pinned?: { maxSteps?: boolean, costBudgetUSD?: boolean }
  /** Workspace the run edits — only used to probe for a success command. */
  root?: string
}): EnvelopePlan {
  const { historyPath, goal, spec, pinned, root } = input
  const taskKey = taskKeyOf(goal)
  const read: ReadResult = readRecords(historyPath)
  const records = recordsForTask(read.records, taskKey)
  const provenance: string[] = []

  if (read.missing) {
    provenance.push(
      `history ${historyPath} does not exist yet: first run for this goal, `
      + 'so the configured ceilings stand and this run becomes the first record',
    )
  } else if (read.malformed > 0) {
    provenance.push(
      `${read.malformed} line(s) in ${historyPath} could not be parsed and were skipped — `
      + 'a torn last line means a run was lost mid-append, so the envelope rests on fewer observations than the file suggests',
    )
  }
  if (read.records.length > records.length) {
    provenance.push(
      `${read.records.length - records.length} of ${read.records.length} record(s) belong to other goals; `
      + 'an envelope is a promise about this task, so they are excluded',
    )
  }

  const envelope = deriveEnvelope(records, {
    minSteps: DERIVED_MIN_STEPS,
    maxSteps: Math.max(spec.maxSteps, DERIVED_MIN_STEPS),
    ...(root === undefined ? {} : { root }),
  })
  provenance.push(...envelope.provenance)

  if (envelope.provisional) {
    provenance.push(
      `not applied: ${records.length} usable record(s) cannot support a percentile, `
      + 'so the configured ceilings stand (a floor is not a measurement)',
    )
    return { spec, envelope, provenance, records, malformed: read.malformed, missing: read.missing }
  }

  let maxSteps = spec.maxSteps
  if (pinned?.maxSteps === true) {
    provenance.push(`maxSteps stays ${spec.maxSteps}: --max-steps pinned it explicitly`)
  } else if (envelope.maxSteps === spec.maxSteps) {
    provenance.push(`maxSteps stays ${spec.maxSteps}: the derivation agreed with the config`)
  } else {
    maxSteps = envelope.maxSteps
    provenance.push(`maxSteps ${spec.maxSteps} → ${maxSteps} (derived)`)
  }

  let costBudgetUSD = spec.costBudgetUSD
  if (pinned?.costBudgetUSD === true) {
    provenance.push(`costBudgetUSD stays $${spec.costBudgetUSD.toFixed(4)}: --budget pinned it explicitly`)
  } else if (envelope.costBudgetUSD >= spec.costBudgetUSD) {
    // The cap case, and it is the common one: derivation wanted more room than
    // the config authorised. Kept as a named branch rather than a Math.min so
    // the log says *why* the number did not move.
    provenance.push(
      `costBudgetUSD stays $${spec.costBudgetUSD.toFixed(4)}: the derivation wanted `
      + `$${envelope.costBudgetUSD.toFixed(4)}, and the configured budget is what the operator said they were willing to lose — a cap, not a target`,
    )
  } else {
    costBudgetUSD = envelope.costBudgetUSD
    provenance.push(
      `costBudgetUSD $${spec.costBudgetUSD.toFixed(4)} → $${costBudgetUSD.toFixed(4)} (derived, `
      + 'tightened from history; the never-lower guard keeps it at or above every goal-met run)',
    )
  }

  return {
    spec: { ...spec, maxSteps, costBudgetUSD },
    envelope,
    provenance,
    records,
    malformed: read.malformed,
    missing: read.missing,
  }
}

/** What the dashboard's Metrics and Optimizations panels render, in one value. */
export interface Advisory {
  /** The roll-up over the records, for the Metrics panel. */
  metrics: MetricsSummary
  /** One card per proposal, for the Optimizations panel. Display only. */
  recommendations: Recommendation[]
  /** Why there is no advice, when there is none. Absent when the judge answered. */
  unavailable?: string
}

/**
 * Produce the dashboard's advisory payloads from recorded history.
 *
 * `malformed` is threaded through from the read rather than defaulted: a torn
 * log must never be presented as a quiet loop, which is the stance
 * `readRecords` and `summarize` already take between them.
 *
 * Proposals cost a judge round trip each (the battery is short, and the
 * caller decides how often to pay it — see the plugin's cadence), while the
 * metrics roll-up is free and can be refreshed as often as the caller likes.
 *
 * @param input - the records, the count of unparseable lines, the spec and the judge.
 * @returns the metrics, the proposals, and the reason when there are none.
 */
export async function advisoryFor(input: {
  records: readonly RunRecord[]
  malformed?: number
  spec: unknown
  judge: Judge
}): Promise<Advisory> {
  const { records, malformed, spec, judge } = input
  const metrics = summarize(records, malformed === undefined ? undefined : { malformed })
  const { recommendations, unavailable } = await proposeOptimizations(judge, records, spec)
  return {
    metrics,
    recommendations,
    ...(unavailable === undefined ? {} : { unavailable }),
  }
}

/** Re-exported so a caller composing these never imports the same module twice. */
export { specFingerprint, taskKeyOf }
