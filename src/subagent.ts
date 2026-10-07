/**
 * Whether a session belongs to a delegated subagent rather than to the run.
 *
 * Lives in its own module with no imports so it is testable in the CI job that
 * installs nothing — the same reason `watcher-ttl.ts` does. `plugin.ts` reads
 * the header and passes it here.
 *
 * ## Why the plugin needs to know
 *
 * `createPolicy` builds one policy per agent, and a policy with a pipeline gets
 * a fresh `startPipeline()` — the 0→1 phase machine, starting at `research`,
 * with the research phase's share of the step ceiling. That is right for the
 * session that owns the goal and wrong for every helper the model spawns.
 *
 * Measured 2026-10-07 on a live headless run: the model spawned four research
 * subagents, and each one got its own phase machine. Every subagent was told
 * "you are in phase 1 of 5: RESEARCH", ran the research phase's full ceiling,
 * and was then rejected by `pipelinePreCallGuard` with `research step ceiling
 * reached (24 steps)`. All four ended `stopReason: 'refusal'`; the parent was
 * told "declined the task. It left no closing message"; the run blocked in
 * `research` with no research note written, at 2% of its budget.
 *
 * ## What is switched off, and what is not
 *
 * Only the phase machine. The gate stays ON — a subagent's `write` and `bash`
 * are exactly as irreversible as the parent's, and the gate is the thing that
 * asks a human. A subagent still runs under the run's spec, budget, ladder and
 * review gate; it simply has no phase to be in, because a phase is a property
 * of the goal, not of a hand.
 *
 * @module dsh-feature-loop/subagent
 */

/**
 * The slice of a session header this decision reads.
 *
 * Structural on purpose: the plugin must typecheck against the harness this
 * checkout has, and a test fixture carries no more than these two fields.
 */
export interface SessionHeaderSlice {
  /** Coarse product classification, set when a session is created as a subagent child. */
  readonly origin?: unknown
  /** Recursion budget: absent (zero) at top level, parent depth + 1 for a child. */
  readonly delegationDepth?: unknown
}

/**
 * Whether this header names a delegated child session.
 *
 * Two independent signals, either of which is enough: `origin: 'subagent'` (the
 * coarse classification) and a non-zero `delegationDepth` (the recursion budget,
 * persisted so a resumed child keeps it). Both are read because different parts
 * of the harness set them, and a release that moves one should not silently
 * re-enable the phase machine on every helper.
 *
 * Absent, malformed or negative values are NOT a subagent: the default for a
 * session the harness says nothing about is the run's own, which is the
 * fail-closed direction — an unclassified session keeps the phase machine it
 * would have had before this existed.
 *
 * @param header - the session header, or `undefined` when there is no session.
 * @returns true when the session is a subagent child.
 */
export function isSubagentSession(header: SessionHeaderSlice | undefined): boolean {
  if (header === undefined) return false
  if (header.origin === 'subagent') return true
  const depth = header.delegationDepth
  return typeof depth === 'number' && Number.isFinite(depth) && depth > 0
}
