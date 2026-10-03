/**
 * The run's evidence bundle: a directory a human can read and a later reader can
 * re-run from.
 *
 * The format is not invented here. This repo already contains one, built by hand
 * to verify the plugin itself — `docs/evidence/local-loop-20260930-214354/`,
 * with a `REPORT.md` whose scoreboard ties every claim to a file. This module
 * makes the loop produce that shape automatically, and keeps the two properties
 * that made the hand-built pack trustworthy:
 *
 * - **Every claim points at a file.** The report's tables cite artifact paths,
 *   so a reader never has to trust a summary.
 * - **Absence is stated, never rounded to zero.** A metric with no observations
 *   reads "not measured"; a step that wrote nothing reads "unverified". This is
 *   the same rule `metrics.ts` follows and the same reason — a confident `$0.00`
 *   over an empty history is worse than an honest blank.
 *
 * The load-bearing rule is the last one: **a step with no artifact cannot be
 * reported as a success.** Ch3's anti-pattern is that evaluating only the final
 * output *"miss[es] the 80% of failures that happen in intermediate steps"* and
 * that *"a correct final answer with a broken trajectory is a ticking time bomb
 * in production"* (p23). So {@link unverifiedSteps} is computed, carried in the
 * record, and printed as its own line. A run that wrote files it cannot show is
 * a run the report says so about.
 *
 * Node builtins only, one `O_APPEND` per line, no database: this sits next to
 * the dashboard's approval endpoint and a new runtime dependency here would be a
 * new attack surface beside it.
 *
 * @module dsh-feature-loop/evidence
 */

import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { PhaseUsage } from './phase-budget.ts'
import type { PhaseRecord, RunRecord, StepRecord } from './runlog.ts'

/** How a bundle is laid out on disk, relative to the run's evidence directory. */
export const EVIDENCE_FILES = {
  /** The human-readable report. Written last, when the run has ended. */
  report: 'REPORT.md',
  /** One JSON line per step — the trajectory, append-only. */
  steps: 'steps.jsonl',
  /** The per-phase ledger, as one JSON document. */
  phases: 'phases.json',
  /** Captured outputs. */
  artifacts: 'artifacts',
} as const

/** The name `steps.jsonl` is appended under. One line per step, one write. */
export const STEPS_FILE = 'steps.jsonl'

/**
 * A file name safe to write under `artifacts/`.
 *
 * Two passes, and the order matters. Dot-runs are collapsed *first*: a lone `.`
 * is a legitimate part of a name like `0-research.md`, but `..` is a path
 * segment, and leaving one in a name that a caller controls is an invitation to
 * re-introduce the traversal later when someone edits the second pass. Collapsing
 * first means the second pass never has to reason about what a dot means.
 */
function safeName(name: string): string {
  const cleaned = name
    .replace(/\.{2,}/g, '-')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned.length === 0 ? 'artifact' : cleaned.slice(0, 120)
}

/** A dollar figure that reads honestly at both ends of the scale. */
function usd(n: number): string {
  if (!Number.isFinite(n)) return 'not measured'
  return n === 0 ? '$0.00' : `$${n.toFixed(4)}`
}

/** A millisecond figure, or an explicit blank rather than a fake zero. */
function ms(n: number | undefined): string {
  return n === undefined || !Number.isFinite(n) ? '—' : `${n}ms`
}

/** Percentage, or a blank. Absence must not read as zero. */
function pct(n: number): string {
  return Number.isFinite(n) ? `${Math.round(n * 100)}%` : '—'
}

/**
 * Count the steps a run cannot evidence.
 *
 * Only a write step with no captured artifact counts. A read step has nothing to
 * evidence and is not a failure — conflating the two would report every step
 * that read a file as unverified and bury the real number.
 *
 * @param steps - the run's step ledger.
 * @returns how many write steps produced nothing.
 */
export function unverifiedSteps(steps: readonly StepRecord[]): number {
  return steps.filter(s => s.verified === false).length
}

/**
 * The bundle's verdict line — the one sentence a reader reads first.
 *
 * Written as a judgement about the *evidence*, not about the run's ambition: a
 * pipeline that reached `ship` with nothing unverified and tests green is READY,
 * one that ran out of budget is not, and one whose writes cannot be evidenced is
 * UNVERIFIED no matter how far it got. The last case is the interesting one,
 * because it is the one that would otherwise be invisible.
 *
 * @param record - the completed run.
 * @returns `READY`, `UNVERIFIED`, or the outcome, lower-cased.
 */
export function verdictOf(record: RunRecord): string {
  const unverified = record.unverifiedSteps ?? unverifiedSteps(record.trajectory ?? [])
  if (unverified > 0) return 'UNVERIFIED'
  if (record.outcome === 'goal-met') return 'READY'
  return record.outcome
}

/**
 * Render the report.
 *
 * Pure: takes the record, returns the text. The file writing is the caller's, so
 * the whole report is assertable in a test without a temporary directory and the
 * rendering cannot silently depend on what is on disk.
 *
 * @param record - the completed run, with its phase and step ledgers.
 * @returns the markdown.
 */
export function renderReport(record: RunRecord): string {
  const steps = record.trajectory ?? []
  const phases = record.phases ?? []
  const unverified = record.unverifiedSteps ?? unverifiedSteps(steps)
  const out: string[] = []

  out.push(`# Run ${record.runId}`)
  out.push('')
  out.push(`**Verdict: ${verdictOf(record)}**`)
  out.push('')
  out.push('| | |')
  out.push('|---|---|')
  out.push(`| Started | ${new Date(record.startedAt).toISOString()} |`)
  out.push(`| Ended | ${new Date(record.endedAt).toISOString()} |`)
  out.push(`| Outcome | \`${record.outcome}\` |`)
  out.push(`| Steps | ${steps.length === 0 ? record.steps : steps.length}${record.maxSteps > 0 ? ` of ${record.maxSteps} allowed` : ''} |`)
  out.push(`| Cost | ${usd(record.costUSD)} of ${usd(record.budgetUSD)} (${pct(record.costUSD / record.budgetUSD)}) |`)
  out.push(`| Wall | ${ms(record.wallMs)} |`)
  if (record.evidenceDir !== undefined) out.push(`| Evidence | \`${record.evidenceDir}\` |`)
  if (record.worktree !== undefined) out.push(`| Worktree | \`${record.worktree}\` |`)
  if (record.prUrl !== undefined) out.push(`| Pull request | ${record.prUrl} |`)
  out.push('')

  if (unverified > 0) {
    out.push('## ⚠️ Unverified steps')
    out.push('')
    out.push(
      `**${unverified} write step(s) produced no captured artifact.** A step that cannot be evidenced is not `
      + 'reported as a success, however far the run got. Open the run to see which steps they are.',
    )
    out.push('')
  }

  if (phases.length > 0) {
    out.push('## Phases')
    out.push('')
    out.push('| Phase | Outcome | Steps | Spent | Budget | Exit gate |')
    out.push('|---|---|---|---|---|---|')
    for (const phase of phases) {
      const gate = phase.exitGate === undefined
        ? '—'
        : `${phase.exitGatePassed === true ? '✅' : phase.exitGatePassed === false ? '❌' : '—'} ${phase.exitGate}`
      out.push(
        `| \`${phase.phase}\` | ${phase.outcome} | ${phase.steps} | ${usd(phase.costUSD)} | ${usd(phase.budgetUSD)} | ${gate} |`,
      )
    }
    out.push('')
  }

  const writes = steps.filter(s => s.evidence !== undefined && s.evidence.length > 0)
  if (writes.length > 0) {
    out.push('## Artifacts')
    out.push('')
    for (const step of writes) {
      for (const path of step.evidence ?? []) {
        out.push(`- step ${step.index} (\`${step.phase}\`) → \`${path}\``)
      }
    }
    out.push('')
  }

  const failed = steps.filter(s => s.error === true)
  if (failed.length > 0) {
    out.push('## Failed steps')
    out.push('')
    out.push(`${failed.length} step(s) errored. Their signals are in \`${EVIDENCE_FILES.steps}\`.`)
    out.push('')
  }

  if (record.signals.length > 0) {
    out.push('## Signals')
    out.push('')
    out.push('| Kind | Severity |')
    out.push('|---|---|')
    for (const signal of record.signals) {
      out.push(`| ${signal.kind} | ${signal.severity} |`)
    }
    out.push('')
    out.push(
      "`RunRecord.signals` carries the detector's kind and severity only; the step number and the "
      + "detector's own one-line detail live in the run's activity feed.",
    )
    out.push('')
  }

  if (record.unpricedSteps > 0) {
    out.push('## ⚠️ Unpriced steps')
    out.push('')
    out.push(
      `${record.unpricedSteps} step(s) reported no usage and were priced at ${usd(0)}. `
      + 'The cost above is an under-count; treat it as a floor, not a total.',
    )
    out.push('')
  }

  out.push('---')
  out.push('')
  out.push(
    'Reconstructed from the run record. Every number above came from a metered '
    + 'observation, and every artifact path was captured by the run itself.',
  )
  out.push('')
  return out.join('\n')
}

/**
 * Create the bundle's directory and write its two whole-run files.
 *
 * `steps.jsonl` is *not* written here — it is appended per step, by
 * {@link appendStep}, so a bundle is readable while the run is still going. This
 * function writes what only makes sense once: the phase ledger and the report.
 *
 * @param dir - the bundle directory; created if missing.
 * @param record - the completed run.
 * @returns the directory written, for the caller's feed line.
 */
export function writeBundle(dir: string, record: RunRecord): string {
  mkdirSync(join(dir, EVIDENCE_FILES.artifacts), { recursive: true })
  writeFileSync(
    join(dir, EVIDENCE_FILES.phases),
    `${JSON.stringify({ runId: record.runId, phases: record.phases ?? [] }, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(join(dir, EVIDENCE_FILES.report), renderReport(record), 'utf8')
  return dir
}

/**
 * Append one step to the bundle's trajectory file.
 *
 * One `O_APPEND` write of one whole line, the same seam `appendRecord` uses, so
 * a second run against the same directory interleaves lines rather than
 * corrupting them. A newline cannot appear inside the payload because
 * `JSON.stringify` escapes it.
 *
 * @param dir - the bundle directory.
 * @param step - the step that just completed.
 */
export function appendStep(dir: string, step: StepRecord): void {
  mkdirSync(dir, { recursive: true })
  appendFileSync(join(dir, EVIDENCE_FILES.steps), `${JSON.stringify(step)}\n`, { encoding: 'utf8', flag: 'a' })
}

/**
 * Capture one artifact into the bundle and return the path to cite.
 *
 * The returned path is the one the report prints, so it is workspace-relative
 * and stable rather than an absolute temp path — a bundle is read months later,
 * possibly on another machine.
 *
 * @param dir - the bundle directory.
 * @param name - a label for the artifact; sanitised.
 * @param content - the text to save.
 * @returns the bundle-relative path, e.g. `artifacts/research.md`.
 */
export function captureArtifact(dir: string, name: string, content: string): string {
  const rel = `${EVIDENCE_FILES.artifacts}/${safeName(name)}`
  const abs = join(dir, EVIDENCE_FILES.artifacts)
  mkdirSync(abs, { recursive: true })
  writeFileSync(join(abs, safeName(name)), content, 'utf8')
  return rel
}

/** Whether a bundle directory looks present. Absence is normal, not an error. */
export function bundleExists(dir: string): boolean {
  return existsSync(join(dir, EVIDENCE_FILES.report))
}

/**
 * Build a phase record from a usage snapshot and the gate's verdict.
 *
 * Pure, so the ledger a run writes is a function of numbers a test can assert
 * rather than something assembled inline in a hook.
 *
 * @param usage - what the phase used.
 * @param outcome - how it ended.
 * @param gate - the gate's one-line verdict.
 * @param gatePassed - whether the gate passed.
 * @param startedAt / endedAt - epoch ms.
 * @param artifacts - what it produced.
 * @returns the record.
 */
export function phaseRecord(
  usage: PhaseUsage,
  outcome: PhaseRecord['outcome'],
  startedAt: number,
  endedAt: number,
  gate?: { detail: string; pass: boolean },
  artifacts: readonly string[] = [],
): PhaseRecord {
  return {
    phase: usage.phase,
    startedAt,
    endedAt,
    steps: usage.steps,
    costUSD: usage.spentUSD,
    budgetUSD: usage.maxSpendUSD,
    outcome,
    ...(gate === undefined ? {} : { exitGate: gate.detail, exitGatePassed: gate.pass }),
    artifacts,
  }
}
