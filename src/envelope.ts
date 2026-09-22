/**
 * The loop's ceilings, derived from measured history instead of hand-authored
 * numbers.
 *
 * A hand-authored MAX_STEPS is a number someone liked. Every number this module
 * emits carries a `provenance` line naming the rule that produced it, because
 * a threshold with no provenance is exactly that. The derivation is pure —
 * records in, envelope out — on the same seam as `budget.ts` and `signals.ts`:
 * no cordis, no `@deepseek-ai` imports, testable alone with
 * `node --experimental-strip-types --test test/envelope.test.ts`.
 *
 * The one exception is `detectSuccessCommand`, which reads the filesystem. That
 * is deliberate and confined: probing a repo for its test runner is *detection*,
 * not policy — it answers "what is already true here", not "what should the loop
 * do". Detection is I/O, I/O lives at the edge, so the fs access exists in that
 * one function and reads only fixed filenames inside `root`. `deriveEnvelope`
 * stays pure unless a caller hands it a `root` to probe.
 *
 * @module dsh-feature-loop/envelope
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { RunRecord } from './runlog.ts'
import type { Reversibility } from './spec.ts'

/** Headroom on every derived ceiling: P95 × 1.3, the book's "+30%". */
const HEADROOM = 1.3

/** Fewer usable records than this cannot support a percentile — go provisional. */
const MIN_USABLE_RECORDS = 5

/** The P95 window: at most the last 50 usable records. */
const P95_WINDOW = 50

/** Cold-start cost floor, USD. Small on purpose: provisional, not measured. */
const PROVISIONAL_COST_USD = 0.1

/** The loop's derived ceilings and the audit trail that explains them. */
export interface Envelope {
  /** Hard step ceiling: clamp(ceil(P95(steps) × 1.3), min, max), guard-raised. */
  maxSteps: number
  /** Hard cost ceiling in USD: P95(costUSD) × 1.3, guard-raised. */
  costBudgetUSD: number
  /** Detected success command; `undefined` when no probe matched — never guessed. */
  successCommand?: string
  /** One line per rule that produced a number. A threshold with no provenance is a number someone liked. */
  provenance: string[]
  /** True while history is too thin to derive from (< 5 usable records). */
  provisional: boolean
}

/**
 * Nearest-rank P95 over a sample, unweighted.
 *
 * Nearest-rank rather than interpolated because every record is one real run:
 * the 95th percentile of run counts should be the step count of an actual run,
 * not a fractional blend of two.
 *
 * @param values - the sample.
 * @returns the value at rank ceil(0.95 × n), 1-based.
 */
function p95(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(0.95 * sorted.length)))
  return sorted[rank - 1]
}

/** Clamp an integer into the configured band. */
function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Derive the loop's ceilings from measured history.
 *
 * @param records - completed runs, in input order; only the majority
 *   (taskKey, specFingerprint) group is used, so an envelope is always about
 *   one loop and one config.
 * @param opts - the band the derivation may land in (`minSteps`, `maxSteps`)
 *   and, optionally, a `root` to probe for a success command.
 * @returns the ceilings plus the provenance lines that explain every one of them.
 */
export function deriveEnvelope(
  records: readonly RunRecord[],
  opts: { minSteps: number; maxSteps: number; root?: string },
): Envelope {
  const provenance: string[] = []

  // One config per envelope: group by (taskKey, specFingerprint), keep the
  // majority group (first seen wins ties). Mixing two configs would make the
  // P95 a number about two different loops — a different ladder or ceiling
  // changes the step distribution itself.
  const groups = new Map<string, RunRecord[]>()
  for (const r of records) {
    const key = `${r.taskKey}\u0000${r.specFingerprint}`
    const bucket = groups.get(key)
    if (bucket) bucket.push(r)
    else groups.set(key, [r])
  }
  let usable: readonly RunRecord[] = []
  for (const bucket of groups.values()) {
    if (bucket.length > usable.length) usable = bucket
  }

  const filtered = records.length - usable.length
  if (filtered > 0) {
    provenance.push(
      `filtered out ${filtered} of ${records.length} records with a different taskKey or specFingerprint; `
      + 'one config per envelope, or the P95 would be a number about two different loops',
    )
  }

  // Detection, not policy: only probed when a root is given, and an unmatched
  // repo keeps today's behaviour — successCommand stays undefined rather than
  // guessed.
  const successCommand = opts.root !== undefined ? detectSuccessCommand(opts.root) : undefined
  if (opts.root !== undefined) {
    provenance.push(
      successCommand !== undefined
        ? `successCommand = "${successCommand}" (first probe to match under ${opts.root})`
        : `no success command probe matched under ${opts.root}; successCommand left undefined — `
        + "an unmatched repo keeps today's behaviour",
    )
  }

  // COLD START: fewer than 5 usable records cannot support a percentile — with
  // four samples P95 is just the max of four, and a ceiling derived from that
  // is the noise of one afternoon wearing the costume of a measurement. These
  // floors are pre-derivation by design, so the never-lower guard below (which
  // governs derived ceilings) does not apply to them; the provisional flag is
  // what says "not measured yet".
  if (usable.length < MIN_USABLE_RECORDS) {
    provenance.push(
      `provisional: ${usable.length} usable record(s) < ${MIN_USABLE_RECORDS}; `
      + `floors until history accumulates (maxSteps=${opts.minSteps}, costBudgetUSD=${PROVISIONAL_COST_USD})`,
    )
    return {
      maxSteps: opts.minSteps,
      costBudgetUSD: PROVISIONAL_COST_USD,
      successCommand,
      provenance,
      provisional: true,
    }
  }

  // ponytail: P95 over at most the last 50 records, unweighted — the known
  // ceiling is a noisy baseline under ~20 runs (one outlier moves the
  // percentile several steps) and, inside the window, an old run counts as
  // much as a fresh one. Upgrade path: exponential decay weighting by
  // startedAt before taking the percentile.
  const window = usable.slice(-P95_WINDOW)
  provenance.push(`p95 window: last ${window.length} of ${usable.length} usable records, unweighted`)

  // The book's own derivation, quoted: "set MAX_STEPS to the 95th-percentile
  // completion count from staging runs, then add 30% headroom" — an agent
  // completing in 6 steps gets 9, "not 10 or 20". The 1.3 below is that 30%;
  // ceil() keeps the result a whole step count.
  const stepsP95 = p95(window.map(r => r.steps))
  const stepsRaw = Math.ceil(stepsP95 * HEADROOM)
  let maxSteps = clampInt(stepsRaw, opts.minSteps, opts.maxSteps)
  provenance.push(
    `maxSteps = clamp(ceil(P95(steps)=${stepsP95} * 1.3)=${stepsRaw}, `
    + `${opts.minSteps}, ${opts.maxSteps}) = ${maxSteps}`,
  )

  const costP95 = p95(window.map(r => r.costUSD))
  let costBudgetUSD = costP95 * HEADROOM
  provenance.push(`costBudgetUSD = P95(costUSD)=${costP95} * 1.3 = ${costBudgetUSD}`)

  // NEVER-LOWER GUARD: P95 *by construction* ignores the top 5%, so a rare
  // expensive goal-met run sits exactly where the percentile cannot see it.
  // Without this guard the ceiling would land below a run that already
  // succeeded at that height, and the loop would starve itself on its own
  // tail: every future run of that shape stops before the step that used to
  // finish the job. The guard outranks the band, because a ceiling below
  // proven success is a broken ceiling. It reads ALL usable goal-met records,
  // not just the P95 window — the guard is a floor on observed reality, and
  // reality does not expire at 50 records.
  const goalMet = usable.filter(r => r.outcome === 'goal-met')
  if (goalMet.length > 0) {
    const maxGoalSteps = Math.max(...goalMet.map(r => r.steps))
    if (maxGoalSteps > maxSteps) {
      provenance.push(
        `never-lower guard (steps): a goal-met run reached ${maxGoalSteps} steps; `
        + `raised maxSteps from ${maxSteps} so the loop never starves its own tail`,
      )
      maxSteps = maxGoalSteps
    }
    const maxGoalCost = Math.max(...goalMet.map(r => r.costUSD))
    if (maxGoalCost > costBudgetUSD) {
      provenance.push(
        `never-lower guard (cost): a goal-met run spent $${maxGoalCost}; `
        + `raised costBudgetUSD from ${costBudgetUSD} so the loop never starves its own tail`,
      )
      costBudgetUSD = maxGoalCost
    }
  }

  return { maxSteps, costBudgetUSD, successCommand, provenance, provisional: false }
}

/**
 * Probe `root` for the repo's own test command, in a fixed order, first hit
 * wins. Never guesses: no match is `undefined`, which keeps the caller on
 * today's behaviour rather than on a command that may not exist.
 *
 * The ONLY filesystem reader in this module, and it may touch nothing outside
 * `root`: detection is not policy, so the I/O exception lives here alone, while
 * the policy (`deriveEnvelope`) stays pure unless a root is passed in.
 *
 * @param root - the workspace to probe; fixed filenames only, joined to root.
 * @returns the command, or `undefined` when nothing matches.
 */
export function detectSuccessCommand(root: string): string | undefined {
  // 1. package.json with a non-empty scripts.test.
  const pkgPath = join(root, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const parsed = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: { test?: unknown } }
      const test = parsed?.scripts?.test
      if (typeof test === 'string' && test.trim().length > 0) return 'npm test'
    } catch {
      // A malformed package.json is not a hit; fall through to the next probe.
    }
  }

  // 2. A Makefile with a `test:` target. Anchored at line start so `tests:`
  // and `test-target:` do not match; a heuristic, but detection is allowed to
  // be heuristic in a way policy is not.
  const makefile = join(root, 'Makefile')
  if (existsSync(makefile) && /^test\s*:/m.test(readFileSync(makefile, 'utf8'))) return 'make test'

  // 3. pytest: a pytest config file, or a Python config that names pytest.
  if (existsSync(join(root, 'pytest.ini'))) return 'pytest'
  for (const name of ['pyproject.toml', 'setup.cfg']) {
    const path = join(root, name)
    if (existsSync(path) && readFileSync(path, 'utf8').includes('pytest')) return 'pytest'
  }

  // 4. cargo — a Cargo.toml is the whole signal.
  if (existsSync(join(root, 'Cargo.toml'))) return 'cargo test'

  // 5. go — a go.mod is the whole signal.
  if (existsSync(join(root, 'go.mod'))) return 'go test ./...'

  return undefined
}

/**
 * The HARNESS's real tool names and how reversible each one is.
 *
 * The trap this function exists to avoid: the loop looks reversibility up by
 * exact tool name, and a name that matches nothing silently degrades to the
 * fail-closed irreversible default — so a wrong name here (e.g. the demo names
 * in `tools.ts`, `read_file`/`write_file`) does not fail loudly, it quietly
 * gates every tool as irreversible. Fail-closed, never fail-open, but wrong:
 * reads behind approval gates and writes blocked outright. So: these are the
 * harness names, exactly.
 *
 * @returns a fresh map, six harness tool names to their reversibility class.
 */
export function defaultActuator(): Record<string, Reversibility> {
  return {
    read: 'read',
    glob: 'read',
    grep: 'read',
    edit: 'reversible-write',
    write: 'irreversible',
    bash: 'irreversible',
  }
}
