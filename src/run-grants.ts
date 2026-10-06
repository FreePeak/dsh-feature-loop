/**
 * Run-scoped approval grants: "Allow for this run".
 *
 * `allow-always` was left out of the dashboard on purpose, because a browser
 * click must not widen the gate behind the deployment's back (see
 * `approval-bridge.ts`). This is the narrow version of the same convenience,
 * and each limit below exists to keep it from becoming that:
 *
 *  - **Per run.** A grant is keyed by the agent id, so it dies with the
 *    session. A new session, or a different agent, starts with none.
 *  - **Per tool.** `write` being granted says nothing about `edit`.
 *  - **Memory only.** Nothing is written to the config file; restarting the
 *    process drops every grant.
 *  - **Policy asks only.** A gate that fired because of `gatePolicies` can be
 *    waved through; an ask from any other source (a critical signal, the
 *    harness's own permission layer) never is, because its reason text does
 *    not carry the policy marker.
 *  - **File tools only.** `bash` is never grantable. One approved shell
 *    command says nothing about the next, and a blanket grant would be a
 *    YOLO run without YOLO's envelope. A run that wants no prompts for shell
 *    should say so with `gateMode: auto`, where the envelope is enforced.
 *
 * Pure and dependency-free, like `approval-bridge.ts`, so CI's no-install job
 * covers it.
 *
 * @module dsh-feature-loop/run-grants
 */

/** Tools whose approval a human may extend to the rest of the run. */
export const RUN_GRANTABLE_TOOLS: ReadonlySet<string> = new Set(['edit', 'write'])

/**
 * The marker `reviewText` puts on an ask raised by a `gatePolicies` rule.
 * Matching the text is deliberate: the registry sees only the question, and
 * an ask that carries no such marker is not one this plugin may waive.
 */
const POLICY_MARKER = 'REVIEW REQUESTED (policy)'

/**
 * Whether one ask may be answered "for this run".
 *
 * @param toolName - the tool the ask is about.
 * @param reason - the ask's reason text, as the gate wrote it.
 * @returns true only for a grantable tool asked under a policy rule.
 */
export function runGrantable(toolName: string, reason: string | undefined): boolean {
  return RUN_GRANTABLE_TOOLS.has(toolName) && reason !== undefined && reason.startsWith(POLICY_MARKER)
}

/** The grants one process holds. */
export class RunGrants {
  private readonly byRun = new Map<string, Set<string>>()

  /**
   * Remember that a human allowed this tool for the rest of this run.
   *
   * @param runId - the agent id the ask belongs to.
   * @param toolName - the tool granted.
   */
  grant(runId: string, toolName: string): void {
    const tools = this.byRun.get(runId) ?? new Set<string>()
    tools.add(toolName)
    this.byRun.set(runId, tools)
  }

  /**
   * Whether this tool was already allowed for this run, and may still be.
   *
   * Re-checks `runGrantable`, so a grant can never apply to an ask the rules
   * above would not have let a human grant in the first place.
   *
   * @param runId - the agent id the ask belongs to.
   * @param toolName - the tool being asked about.
   * @param reason - the new ask's reason text.
   * @returns true when the ask may be answered without a human.
   */
  covers(runId: string, toolName: string, reason: string | undefined): boolean {
    return runGrantable(toolName, reason) && this.byRun.get(runId)?.has(toolName) === true
  }

  /** The tools granted for one run, for display. */
  list(runId: string): string[] {
    return [...(this.byRun.get(runId) ?? [])].sort()
  }

  /** Drop every grant, or one run's. */
  clear(runId?: string): void {
    if (runId === undefined) this.byRun.clear()
    else this.byRun.delete(runId)
  }
}
