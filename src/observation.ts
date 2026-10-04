/**
 * Observing a phase: turning the world into a {@link PhaseObservation}.
 *
 * `evaluateGate` is pure — it reads an already-observed snapshot. This module is
 * the half that produces one, and it is deliberately the only place in the
 * pipeline that runs a command or reads a file on the gate path.
 *
 * Two decisions shape it.
 *
 * **The verify command does not run on every step.** A phase's `command` gate is
 * "your test suite exits 0", and running the suite after every step of an
 * implementation would cost more than the work being verified. So `verify` is
 * collected only when the caller says the phase is the one that needs it — in
 * practice, the `test` phase — and `evaluateGate` fails closed for every other
 * phase that asks. A gate that ran its command everywhere would be correct and
 * unusable.
 *
 * **Everything is bounded.** Artifact reads are capped, git output is capped, and
 * a failing probe yields `undefined` rather than throwing, because the gate's
 * contract is "absent evidence fails the gate", not "a missing file stops the
 * loop". The book is blunt that a silent failure is the worst outcome (p152), and
 * a thrown error that aborts a run reads exactly like one.
 *
 * @module dsh-feature-loop/observation
 */

import { readFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'

import type { CommandRunner } from './sandbox.ts'
import type { PhaseObservation, PipelinePhase, VerifyResult } from './phases.ts'
import { PIPELINE_PHASE_NAMES } from './spec.ts'

/** Bytes of an artifact kept for a gate that greps it. */
const MAX_ARTIFACT_BYTES = 256 * 1024

/** Lines of command output kept for the report. */
const MAX_OUTPUT_LINES = 200

/** A generous ceiling on `git diff --name-only` output, as a guard against a pathological repo. */
const MAX_CHANGED_FILES = 2_000

/** The clock and command surface the observer needs. Injected so tests need no git and no clock. */
export interface ObserverContext {
  /** The run's worktree. Every read and command is confined to it. */
  worktreeRoot: string
  /** Runs a command in the worktree. */
  run: CommandRunner
  /** Milliseconds a verify command may take before it is abandoned as still-running. */
  verifyTimeoutMs?: number
}

/**
 * Read one artifact, bounded, without throwing.
 *
 * @param root - the run's worktree.
 * @param relative - a workspace-relative path.
 * @returns the file's text, or `undefined` when it is absent or unreadable.
 */
export function readArtifact(root: string, relative: string): string | undefined {
  // Absolute paths and traversals never resolve: the observer reads the run's own
  // workspace, and a gate that could be pointed at `~/.ssh/id_rsa` by a
  // configured path would be a gate reading a credential.
  if (isAbsolute(relative)) return undefined
  const path = join(root, relative)
  if (!path.startsWith(root)) return undefined
  try {
    const text = readFileSync(path, 'utf8')
    return text.length > MAX_ARTIFACT_BYTES ? text.slice(0, MAX_ARTIFACT_BYTES) : text
  } catch {
    return undefined
  }
}

/**
 * The paths git reports as changed in the worktree.
 *
 * `git status --porcelain` rather than `git diff --name-only` because a new file
 * that is not yet tracked is exactly the case a run's first write produces, and
 * `git diff` alone does not list it. That omission would make the implement
 * phase's gate pass on a run that changed nothing.
 *
 * @param ctx - the worktree and runner.
 * @returns changed paths, workspace-relative. Empty when git fails.
 */
export function changedFiles(ctx: ObserverContext): string[] {
  const result = ctx.run('git', ['status', '--porcelain'], ctx.worktreeRoot)
  if (result.code !== 0) return []
  const paths: string[] = []
  for (const line of result.stdout.split('\n')) {
    if (line.trim().length === 0) continue
    // Porcelain is `XY <path>`, with ` -> ` for a rename. The path is whatever
    // follows the two status columns and the space.
    const arrow = line.indexOf(' -> ')
    const after = arrow >= 0 ? line.slice(arrow + 4) : line.slice(3)
    const path = after.trim()
    if (path.length > 0) paths.push(path)
    if (paths.length >= MAX_CHANGED_FILES) break
  }
  return paths
}

/**
 * Run a phase's verify command and capture its exit code.
 *
 * Returns `undefined` — not a failure — when no command is configured, because
 * `evaluateGate` treats an absent verify as a failed gate and the difference
 * matters to the report: "you configured no test command" and "your tests
 * failed" are not the same sentence.
 *
 * @param ctx - the worktree and runner.
 * @param command - the shell command; run through the runner's shell.
 * @returns the result, or `undefined` when the command is blank.
 */
export function runVerify(ctx: ObserverContext, command: string): VerifyResult | undefined {
  if (command.trim().length === 0) return undefined
  const result = ctx.run('sh', ['-c', command], ctx.worktreeRoot)
  // Both streams. A refusal writes to stderr and a failing npm test writes most
  // of its diagnosis there too, so capturing stdout alone produced an empty
  // tail — which is how a refusal came to look identical to a test failure.
  const combined = [result.stdout, result.stderr].filter(t => t.trim().length > 0).join('\n')
  return {
    command,
    exitCode: result.code,
    output: combined.split('\n').slice(0, MAX_OUTPUT_LINES).join('\n'),
  }
}

/** Options for {@link observe}. */
export interface ObserveOptions extends ObserverContext {
  /** The phase to observe. */
  phase: PipelinePhase
  /** Paths written during this phase, already known from the tool hook. */
  written?: readonly string[]
  /** Fix attempts made in this phase, for the test phase's cap. */
  attempts?: number
  /**
   * The phase's verify command, when it is the one worth running.
   *
   * Omitted for every phase except `test`, and the caller is the only thing that
   * knows that — see the module note on cost.
   */
  verifyCommand?: string
  /** Artifact paths this phase's gate may read. Defaults to every gate path in the pipeline. */
  gatePaths?: readonly string[]
}

/** Every artifact path any phase's gate can ask for, so one read pass serves them all. */
const KNOWN_GATE_PATHS: readonly string[] = [
  'docs/0-research.md',
  'docs/PRD.md',
  '.feature-loop/artifacts/pr-url.txt',
]

/**
 * Build the observation a phase's gate is evaluated against.
 *
 * @param options - the worktree, the phase, what was written, and optionally the
 *   verify command to run.
 * @returns the observation. Every field is best-effort: a probe that fails yields
 *   an absent value, which fails the gate rather than the run.
 */
export function observe(options: ObserveOptions): PhaseObservation {
  const { phase, worktreeRoot, run } = options
  const artifacts: Record<string, string | undefined> = {}
  for (const path of options.gatePaths ?? KNOWN_GATE_PATHS) {
    artifacts[path] = readArtifact(worktreeRoot, path)
  }
  return {
    phase,
    written: [...(options.written ?? [])],
    // `changed` is only meaningful for the phases whose gate counts files. Asking
    // git on the research phase costs a process spawn to answer a question nobody
    // asked, and this runs on the step path.
    changed: phase === 'implement' || phase === 'test' || phase === 'ship'
      ? changedFiles({ worktreeRoot, run })
      : [],
    artifacts,
    ...(options.verifyCommand === undefined
      ? {}
      : { verify: runVerify({ worktreeRoot, run }, options.verifyCommand) }),
    attempts: options.attempts ?? 0,
  }
}

/** Whether a name is a phase the pipeline knows, for validating a configured command target. */
export function isPipelinePhase(name: string): name is PipelinePhase {
  return (PIPELINE_PHASE_NAMES as readonly string[]).includes(name)
}
