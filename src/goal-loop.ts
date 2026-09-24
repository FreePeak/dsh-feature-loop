/**
 * Native-goal loop command and completion-verifier policy.
 *
 * The harness goal service owns continuation; this module only prepares a safe
 * objective and judges one verifier result. It never executes a shell command or
 * exposes command text in user-visible denial reasons.
 */

/** Non-secret guidance added to the durable goal objective. */
export const COMPLETION_NOTICE = 'Completion is independently verified by the loop; do not claim completion until verification passes.'

export type LoopCommandOutcome =
  | { kind: 'success', objective: string }
  | { kind: 'error', text: string }

/** Build a durable goal objective, failing closed when no verifier is configured. */
export function createLoopObjective(input: { rawInput: string, successCommand?: string }): LoopCommandOutcome {
  const task = input.rawInput.trim()
  if (task === '') {
    return { kind: 'error', text: 'Usage: /loop <objective> — describe the bounded feature-loop goal.' }
  }
  if (input.successCommand === undefined || input.successCommand.trim() === '') {
    return { kind: 'error', text: 'Feature loop is unavailable: configure spec.termination.successCommand before starting /loop.' }
  }
  return { kind: 'success', objective: `${task}\n\n${COMPLETION_NOTICE}` }
}

export interface LoopVerificationResult {
  readonly exitCode: number | null
  readonly signal?: string | null
  readonly timedOut?: boolean
  readonly aborted?: boolean
  readonly sandbox?: { readonly denied?: boolean, readonly runnerFailed?: boolean }
}

export type LoopVerificationDecision =
  | { kind: 'allow' }
  | { kind: 'deny', reason: string }

/** Judge one shell result without echoing the configured verifier command. */
export function verifyLoopCompletion(result: LoopVerificationResult): LoopVerificationDecision {
  if (result.timedOut === true) return { kind: 'deny', reason: 'Completion denied: verification timed out.' }
  if (result.aborted === true) return { kind: 'deny', reason: 'Completion denied: verification was aborted.' }
  if (result.signal !== undefined && result.signal !== null) {
    return { kind: 'deny', reason: `Completion denied: verification was terminated by ${result.signal}.` }
  }
  if (result.sandbox?.denied === true) {
    return { kind: 'deny', reason: 'Completion denied: verification was blocked by the sandbox.' }
  }
  if (result.sandbox?.runnerFailed === true) {
    return { kind: 'deny', reason: 'Completion denied: the sandbox runner failed during verification.' }
  }
  if (result.exitCode !== 0) {
    const suffix = result.exitCode === null ? '' : ` ${String(result.exitCode)}`
    return { kind: 'deny', reason: `Completion denied: verification exited with${suffix || ' no status'}.` }
  }
  return { kind: 'allow' }
}
