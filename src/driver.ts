/**
 * The run driver: what actually moves a run through its phases.
 *
 * Everything here composes modules that are individually tested and individually
 * pure — {@link observe} fills the snapshot, {@link evaluateGate} judges it,
 * {@link transition} moves the machine — and adds the two I/O touches that have
 * no pure equivalent: creating the worktree, and running the ship phase.
 *
 * The order is deliberate and is the whole design of a YOLO run:
 *
 * 1. **Sandbox first.** The worktree is created before the first step, because
 *    the envelope's containment is the safety property, and containment that
 *    starts one step late is containment that does not exist.
 * 2. **Gate, then transition.** A phase advances only when its gate passed, never
 *    on the model's say-so. A failed gate stops the phase where it stands.
 * 3. **Ship last, and only once.** `ship()` is invoked by the machine, not by the
 *    model, so the run cannot decide that it has finished.
 *
 * @module dsh-feature-loop/driver
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { evaluateGate, renderRules, pipelinePhaseOf } from './phases.ts'
import { PIPELINE_PHASE_NAMES } from './spec.ts'
import type { GateResult, PhaseObservation, PipelinePhase, VerifyResult } from './phases.ts'
import { canTransition, transition } from './pipeline.ts'
import type { PipelineRun, TransitionReason } from './pipeline.ts'
import { observe } from './observation.ts'
import type { ObserveOptions } from './observation.ts'
import { createSandbox, SandboxError } from './sandbox.ts'
import type { CommandRunner, Sandbox } from './sandbox.ts'
import { ship, prBody } from './ship.ts'
import type { ShipResult } from './ship.ts'
import { captureArtifact, phaseRecord } from './evidence.ts'
import type { PhaseRecord } from './runlog.ts'
import type { PhaseUsage } from './phase-budget.ts'
import type { PhaseAllocator } from './phase-budget.ts'

/** Everything the driver needs. One object, so a run's whole environment is visible in one place. */
export interface DriverOptions {
  /** Where the repository the run works on lives. */
  repoRoot: string
  /** The run's stated goal. Slugged into the branch name and shown in the report. */
  goal: string
  /** The run's id. Names the worktree and the branch. */
  runId: string
  /** The phase machine and its ceilings. */
  run: PipelineRun
  budget: PhaseAllocator
  /** Per-phase ceilings and timeouts, as configured. */
  config: {
    /** The project's test command, whose exit 0 is the test phase's gate. */
    testCommand?: string
    /** Where run artifacts land. */
    runsDir?: string
    /** Per-phase step ceilings, by phase. */
    phaseMaxSteps?: Partial<Record<string, number>>
  }
  /** Runs a command. Injected so the driver is testable with no git and no clock. */
  runner: CommandRunner
  /** Epoch ms. Injected so a test can drive the wall clock. */
  now?: () => number
}

/** What a drive produced. */
export interface DriveResult {
  /** The worktree the run was confined to, when one was created. */
  sandbox?: Sandbox
  /** The run's final state. */
  state: PipelineRun['state']
  /** One ledger line per phase. */
  phases: PhaseRecord[]
  /** The ship phase's result, when it ran. */
  ship?: ShipResult
  /** Everything the run produced, for the report. */
  evidenceDir?: string
  /** One line per decision, for the dashboard feed and the report. */
  notes: string[]
}

/** Raised when a YOLO run cannot be given a worktree. Never swallowed: see `sandbox.ts`. */
export { SandboxError }

/**
 * Create the run's worktree and hand back the sandbox.
 *
 * Refuses outside a git repository rather than degrading — an unattended run with
 * no containment must not start, because the envelope would then allow writes
 * against an undefined root.
 *
 * @param options - the driver options.
 * @returns the sandbox.
 * @throws SandboxError when the path is not a repository, or git refuses.
 */
export function startSandbox(options: DriverOptions): Sandbox {
  return createSandbox(options.repoRoot, options.goal, options.runId, options.runner)
}

/**
 * Build the observation for the run's current phase.
 *
 * The verify command is attached only to the `test` phase. Every other phase's
 * gate is either an artifact check or a changed-file count, both of which are
 * free, and running the suite on the research phase to answer a question its
 * gate never asks would cost more than the whole phase's budget.
 *
 * @param options - the driver options.
 * @param sandbox - the worktree.
 * @param written - paths written during this phase.
 * @returns the observation.
 */
export function observeCurrentPhase(
  options: DriverOptions,
  sandbox: Sandbox,
  written: readonly string[] = [],
): PhaseObservation {
  const phase = options.run.state as PipelinePhase
  const isTest = phase === 'test'
  const observeOptions: ObserveOptions = {
    phase,
    worktreeRoot: sandbox.worktreeRoot,
    run: options.runner,
    written,
    attempts: options.run.testAttempts,
    ...(isTest && options.config.testCommand !== undefined ? { verifyCommand: options.config.testCommand } : {}),
  }
  return observe(observeOptions)
}

/**
 * Judge the current phase's gate.
 *
 * @param options - the driver options.
 * @param sandbox - the worktree.
 * @param written - paths written during this phase.
 * @returns the gate's verdict.
 */
export function gateCurrentPhase(
  options: DriverOptions,
  sandbox: Sandbox,
  written: readonly string[] = [],
): GateResult {
  const phase = options.run.state as PipelinePhase
  return evaluateGate(pipelinePhaseOf(phase).gate, observeCurrentPhase(options, sandbox, written))
}

/**
 * Advance the run past its current phase, if the gate allows it.
 *
 * The one place a phase ever changes. It checks the edge before acting rather
 * than catching afterwards, because a refusal here is ordinary — the test phase
 * going back to implement is a normal retry — and an exception on that path would
 * be a control-flow bug dressed as a policy decision.
 *
 * @param options - the driver options.
 * @param gate - the current phase's gate verdict.
 * @returns whether the run moved, and one line saying why either way.
 */
export function advancePhase(options: DriverOptions, gate: GateResult): { moved: boolean; note: string } {
  const state = options.run.state
  const now = options.now ?? Date.now

  if (state === 'test' && !gate.pass) {
    // A failed test is the retry edge, and it is capped by `transition`.
    if (!canTransition(options.run, 'implement')) {
      transition(options.run, 'blocked', 'guard', now())
      return { moved: true, note: `test failed after ${options.run.testAttempts} attempts — blocked: ${gate.detail}` }
    }
    transition(options.run, 'implement', 'test-failed', now())
    options.budget.enterPhase('implement')
    return { moved: true, note: `test failed (${gate.detail}) — back to implement, attempt ${options.run.testAttempts + 1}` }
  }

  if (!gate.pass) {
    return { moved: false, note: `gate not satisfied: ${gate.detail}` }
  }

  const next = options.run.state === 'ship' ? 'done' : (PIPELINE_PHASE_NAMES[PIPELINE_PHASE_NAMES.indexOf(state as PipelinePhase) + 1] as PipelinePhase | undefined)
  if (next === undefined || !canTransition(options.run, next)) {
    return { moved: false, note: `no transition from ${state}` }
  }
  transition(options.run, next, 'gate-passed', now())
  if (next !== 'done') options.budget.enterPhase(next)
  return { moved: true, note: `${state} gate passed — now ${next}` }
}

/**
 * Run the ship phase and record the pull request for the gate.
 *
 * Invoked by the machine when the run reaches `ship`, never by the model. The PR
 * URL is written into `artifacts/pr-url.txt` because that file is the ship phase's
 * own exit gate: without it the phase cannot pass, and a run that opened no PR
 * must not proceed as though it had.
 *
 * @param options - the driver options.
 * @param sandbox - the worktree.
 * @param phases - the ledger so far, for the PR body.
 * @param unverified - unevidenced write steps, surfaced at the top of the body.
 * @returns the ship result.
 */
export function runShip(
  options: DriverOptions,
  sandbox: Sandbox,
  phases: readonly PhaseRecord[],
  unverified: number,
): ShipResult {
  const result = ship({
    worktreeRoot: sandbox.worktreeRoot,
    branch: sandbox.branch,
    goal: options.goal,
    body: prBody({
      goal: options.goal,
      reportPath: `${options.config.runsDir ?? '.feature-loop/runs'}/${options.runId}/REPORT.md`,
      phases: phases.map(p => ({
        phase: p.phase,
        outcome: p.outcome,
        costUSD: p.costUSD,
        budgetUSD: p.budgetUSD,
        ...(p.exitGatePassed === undefined ? {} : { exitGatePassed: p.exitGatePassed }),
      })),
      unverified,
    }),
    run: options.runner,
    stopSentinel: sandbox.stopSentinel,
  })
  if (result.prUrl !== undefined) {
    const dir = join(sandbox.worktreeRoot, '.feature-loop', 'artifacts')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'pr-url.txt'), `${result.prUrl}\n`, 'utf8')
  }
  return result
}

/**
 * Close a phase into its ledger line.
 *
 * @param usage - what the phase used.
 * @param outcome - how it ended.
 * @param startedAt / endedAt - epoch ms.
 * @param gate - the gate verdict, when one ran.
 * @param artifacts - what it produced.
 * @returns the ledger line.
 */
export function closePhase(
  usage: PhaseUsage,
  outcome: PhaseRecord['outcome'],
  startedAt: number,
  endedAt: number,
  gate?: GateResult,
  artifacts: readonly string[] = [],
): PhaseRecord {
  return phaseRecord(usage, outcome, startedAt, endedAt, gate, artifacts)
}

/**
 * Capture the run's artifacts into its evidence bundle.
 *
 * @param dir - the bundle directory.
 * @param name - a label.
 * @param content - the text.
 * @returns the bundle-relative path.
 */
export function capture(dir: string, name: string, content: string): string {
  return captureArtifact(dir, name, content)
}

/** Re-exported so a caller building a driver needs one import for the verify type. */
export type { VerifyResult }
