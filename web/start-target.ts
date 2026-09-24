/**
 * Which session a "Start a loop" submission targets.
 *
 * Pure on purpose, and for the same reason `approval-bridge.ts` is pure: this
 * is the decision most likely to be got subtly wrong, and a wrong one prompts
 * the WRONG session's inbox — a silent mis-authorisation, not a crash. The
 * component holds the DOM; every judgement below is here, where a test can
 * reach it with no browser and no harness.
 *
 * Why the page resolves this at all: the `main` slot is a root-scoped, keyed
 * slot with no session binding (the slot catalog says so outright — non-
 * `conversation` keys "receive no Session binding"), and `ISessions.list`
 * carries no "current" because selection belongs to shell navigation. So the
 * target is derived here, and shown, rather than assumed.
 *
 * @module dsh-feature-loop/start-target
 */

/** The slice of a session summary this decision needs. */
export interface StartCandidate {
  id: string
  /** Human-facing title shown beside the control. */
  displayTitle: string
  /**
   * "New Session" reuse eligibility, NOT usability. A blank session is the
   * fresh inbox a first turn belongs in, so it is a perfectly good target —
   * excluding it made this control dead exactly when someone wanted to use it.
   */
  blank: boolean
  running: boolean
  /** Host ordering signal; the fallback pick is the most recently touched. */
  updatedAt: number
}

/** What the control should render and submit. */
export interface StartDecision {
  /** The session to prompt, or undefined when there is none to prompt. */
  target: StartCandidate | undefined
  /** More than one live session, so the user must choose. */
  ambiguous: boolean
  /** Submit is impossible. Never a silently dead button. */
  blocked: 'no-session' | 'empty-task' | undefined
  /** One line explaining `blocked`, or what the run will do. */
  note: string
}

/**
 * Decide what a start submission does.
 *
 * Every session is a candidate, blank ones included (see `blank` above). With
 * exactly one it is used and named; with several the most recently touched is
 * preselected but the decision is flagged `ambiguous` so the UI shows a picker,
 * because defaulting silently would put work into the wrong session.
 *
 * @param sessions - every session the client knows about.
 * @param picked - the session id the user chose, when they have.
 * @param task - the draft task text.
 * @returns the target, whether a choice is required, and why submit is blocked.
 */
export function decideStart(
  sessions: readonly StartCandidate[],
  picked: string | undefined,
  task: string,
): StartDecision {
  const live = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

  if (live.length === 0) {
    return {
      target: undefined,
      ambiguous: false,
      blocked: 'no-session',
      note: 'No open session yet — start a conversation first.',
    }
  }

  const chosen = picked === undefined ? undefined : live.find(s => s.id === picked)
  const target = chosen ?? live[0]
  const ambiguous = live.length > 1
  const empty = task.trim() === ''

  return {
    target,
    ambiguous,
    blocked: empty ? 'empty-task' : undefined,
    note: ambiguous
      ? `Runs in the selected session${target === undefined ? '' : ` — “${target.displayTitle}”`}.`
      : `Runs in “${target?.displayTitle ?? ''}”.`,
  }
}
