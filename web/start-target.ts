/**
 * Which Workspace a "Start a loop" submission targets.
 *
 * Pure on purpose, and for the same reason `approval-bridge.ts` is pure: this
 * is the decision most likely to be got subtly wrong, and a wrong one runs the
 * loop against the WRONG repository — it writes files, spends money and stops
 * to ask a human, all in a directory nobody chose. The component holds the DOM;
 * every judgement below is here, where a test can reach it with no browser and
 * no harness.
 *
 * Why a Workspace and not a Session. The `main` slot is root-scoped with no
 * session binding (the slot catalog says non-`conversation` keys "receive no
 * Session binding"), so nothing is handed to the page — but a run needs a
 * concrete working directory, and a Workspace IS a directory. Offering Sessions
 * asked the user to reason about transcripts when the thing that decides which
 * files get touched is the checkout. It also made the control unusable: every
 * session in every project was listed, and the fallback was the most recently
 * touched one, which is routinely a different repository entirely.
 *
 * The host already answers "what is open": a session is retained by the main
 * view (`retainedBy.mainView > 0`), and a Workspace owns a set of session ids.
 * `openedWorkspaceId` is that same derivation the sidebar uses, so this page
 * and the sidebar agree on what "the open workspace" means.
 *
 * @module dsh-feature-loop/start-target
 */

/** The slice of a Workspace the decision and the picker need. */
export interface StartWorkspace {
  id: string
  /** User-visible name, from the host registry. */
  title: string
  /** Canonical directory — the thing a run actually writes into. */
  path: string
  /** Sessions this Workspace accounts for, in manual order. */
  sessionIds: readonly string[]
}

/** The slice of a session summary used to find the opened one. */
export interface SessionRow {
  id: string
  readonly retainedBy: Readonly<Record<string, number | undefined>>
}

/** What the control should render and submit. */
export interface StartDecision {
  /** The Workspace to run in, or undefined when none can be chosen yet. */
  target: StartWorkspace | undefined
  /** More than one Workspace, so the target is shown and can be changed. */
  ambiguous: boolean
  /** Submit is impossible. Never a silently dead button. */
  blocked: 'no-workspace' | 'choose-workspace' | 'empty-task' | undefined
  /** One line explaining `blocked`, or what the run will do. */
  note: string
}

/**
 * The Workspace the user currently has open, or undefined when nothing is.
 *
 * The host marks the open session with a main-view retention count; the owning
 * Workspace is the one whose session list contains it. Mirrors the sidebar's
 * `owningGroupKey` so the page and the sidebar agree on "open".
 *
 * @param workspaces - every Workspace the client knows about.
 * @param sessions - every session the client knows about, with retain counts.
 * @returns the open Workspace id, or undefined when no session is open.
 */
export function openedWorkspaceId(
  workspaces: readonly StartWorkspace[],
  sessions: readonly SessionRow[],
): string | undefined {
  const open = sessions.find(s => (s.retainedBy.mainView ?? 0) > 0)
  if (open === undefined) return undefined
  return workspaces.find(w => w.sessionIds.includes(open.id))?.id
}

/**
 * Decide what a start submission does.
 *
 * Preference order is deliberate and never guesses: an explicit pick, then the
 * Workspace the user has open, then the only Workspace when there is exactly
 * one. With several and none open, submit is blocked and the note says why — a
 * silent default here is how a run lands in the wrong checkout.
 *
 * @param workspaces - every Workspace the client knows about.
 * @param opened - the Workspace the user currently has open, if any.
 * @param picked - the Workspace id the user chose, when they have.
 * @param task - the draft task text.
 * @returns the target, whether a choice is required, and why submit is blocked.
 */
export function decideStart(
  workspaces: readonly StartWorkspace[],
  opened: string | undefined,
  picked: string | undefined,
  task: string,
): StartDecision {
  if (workspaces.length === 0) {
    return {
      target: undefined,
      ambiguous: false,
      blocked: 'no-workspace',
      note: 'No workspace is registered yet — open a project folder, then start the loop.',
    }
  }

  const byId = new Map(workspaces.map(w => [w.id, w]))
  // A stale pick (workspace deleted since it was chosen) falls through rather
  // than wedging the control on a target that no longer exists.
  const target = (picked !== undefined ? byId.get(picked) : undefined)
    ?? (opened !== undefined ? byId.get(opened) : undefined)
    ?? (workspaces.length === 1 ? workspaces[0] : undefined)

  const ambiguous = workspaces.length > 1

  if (target === undefined) {
    return {
      target: undefined,
      ambiguous,
      blocked: 'choose-workspace',
      note: 'Pick the workspace to run in — a loop writes files, so it is never guessed.',
    }
  }

  const empty = task.trim() === ''
  return {
    target,
    ambiguous,
    blocked: empty ? 'empty-task' : undefined,
    // The path, not just the name: the directory is what a run writes into,
    // and it is the one detail that catches "wrong project".
    note: `Runs in “${target.title}” — ${target.path}`,
  }
}
