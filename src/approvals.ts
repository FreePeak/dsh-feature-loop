/**
 * The approval registry: who is waiting, and the one way to settle them.
 *
 * This is the piece the dashboard used to bury inside its HTTP server. The
 * server is now optional — the approvals live here, and two front ends can
 * drive them: the in-UI page (`ctx.remote.featureLoop.answer`) and, if a
 * deployment still wants one, the loopback page on 8101/8102. Neither owns
 * the asks; this module does, so a click in either place settles the same
 * entry and the ask can never be answered twice.
 *
 * Split out of `dashboard.ts` for the same reason `approval-bridge.ts` is
 * pure: the claim/settle logic is the part most likely to be got subtly wrong
 * (a double settle, an ask outliving its asker, a claim with no watcher), and
 * this shape is assertable with no sockets and no browser.
 *
 * @module dsh-feature-loop/approvals
 */

import { randomUUID } from 'node:crypto'
import type { ApprovalOutcome, ApprovalQuestion, BriefNode, PendingApproval } from './dashboard.ts'
import type { DashboardState } from './dashboard.ts'

/** First line of free text, capped — the feed never takes a whole paste. */
function firstLine(text: string, max = 200): string {
  const line = text.split('\n', 1)[0] ?? ''
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

/** How the feed labels each settled outcome. */
const OUTCOME_LABEL: Record<ApprovalOutcome, string> = {
  'allowed-once': 'allowed once',
  rejected: 'rejected',
  cancelled: 'cancelled',
  unavailable: 'expired',
}

/** A pending ask plus the closure that settles it. */
interface PendingEntry extends PendingApproval {
  settle(outcome: ApprovalOutcome, feedText?: string): void
}

/** Options for {@link createApprovalRegistry}. */
export interface ApprovalRegistryOptions {
  /** Where feed lines and briefs are recorded. */
  state: DashboardState
  /** Whether a front end may answer at all. False = always delegate. */
  answers: boolean
  /** An ask with no answer within this many ms fails closed to `unavailable`. */
  answerTimeoutMs: number
  /**
   * Whether a front end is currently watching. The claim is made only then,
   * so a dashboard nobody has open can never strand an ask the composer
   * panel could have answered.
   */
  hasWatcher(): boolean
}

/** What the front ends get. */
export interface ApprovalRegistry {
  /** Claim an ask when a watcher is present; otherwise delegate down the chain. */
  answer(question: ApprovalQuestion, next: () => Promise<ApprovalOutcome>): Promise<ApprovalOutcome>
  /** Current pending entries, settle closures stripped. */
  pendingSnapshot(): PendingApproval[]
  /** Settle one ask by id. False when it is already gone. */
  settleApproval(id: string, outcome: 'allowed-once' | 'rejected', feedback?: string): boolean
  /** The brief recorder, driven by the plugin's explainer. */
  readonly briefs: {
    markBriefPending(id: string): void
    recordBrief(id: string, nodes: BriefNode[] | undefined): void
  }
  /** Settle everything `unavailable` and refuse further asks. */
  stop(): void
}

import { WATCHER_TTL_MS } from './watcher-ttl.ts'

let lastWatchedAt = 0

/**
 * Record that a front end is still on the page.
 *
 * Called by the host remote on every `live()` poll, so "is someone watching"
 * is a heartbeat rather than a socket count — the in-UI page has no persistent
 * connection to hold open.
 *
 * ponytail: ceiling is a TTL, so an ask raised in the last 15s after a page
 * closes is still claimed by the dashboard instead of the composer. Upgrade
 * path is a streaming remote method that reports attach/detach exactly.
 */
export function noteWatcher(at: number = Date.now()): void {
  lastWatchedAt = at
}

/** Whether a front end reported in within the TTL. */
export function watcherActive(at: number = Date.now()): boolean {
  return lastWatchedAt !== 0 && at - lastWatchedAt < WATCHER_TTL_MS
}

/** Forget the watcher — on unload, so a dead process never claims an ask. */
export function clearWatcher(): void {
  lastWatchedAt = 0
}

/**
 * Create the registry that owns this process's pending approvals.
 *
 * @param options - the state, the policy flags, and the watcher predicate.
 * @returns the registry the plugin and both front ends share.
 */
export function createApprovalRegistry(options: ApprovalRegistryOptions): ApprovalRegistry {
  const { state, answers, answerTimeoutMs, hasWatcher } = options
  const pending = new Map<string, PendingEntry>()
  // Tool name per ask id, kept after `pending` drops the entry: a settle line
  // arrives AFTER the ask is gone, and "expired: tool" is not a sentence.
  const toolNameOf = new Map<string, string>()
  let stopped = false

  const settleEntry = (id: string, outcome: ApprovalOutcome, feedText?: string): boolean => {
    const entry = pending.get(id)
    if (entry === undefined) return false
    entry.settle(outcome, feedText)
    return true
  }
  /** The tool an ask was for, by id. `pending` is already deleted by then. */
  const nameOf = (id: string): string => toolNameOf.get(id) ?? 'tool'

  const briefs = {
    markBriefPending(id: string): void {
      const entry = pending.get(id)
      if (entry === undefined || entry.briefState !== 'none') return
      entry.briefState = 'pending'
      state.note('note', `review brief requested: ${entry.toolName}`, entry.runId)
    },
    recordBrief(id: string, nodes: BriefNode[] | undefined): void {
      const entry = pending.get(id)
      if (entry === undefined || entry.briefState !== 'pending') return
      entry.briefState = nodes === undefined ? 'failed' : 'ready'
      if (nodes !== undefined) entry.brief = nodes
    },
  }

  const answer = async (
    question: ApprovalQuestion,
    next: () => Promise<ApprovalOutcome>,
  ): Promise<ApprovalOutcome> => {
    // The claim. Deliberately a predicate, not a connection count: the in-UI
    // page polls rather than holding a socket open, so "someone is watching"
    // is a heartbeat the front end reports, and an unwatched ask still falls
    // through to the composer panel exactly as it always did.
    if (stopped || !answers || !hasWatcher()) return next()

    const rawId = question.agent?.id
    const runId = typeof rawId === 'string' && rawId !== '' ? rawId : 'agentless'
    const id = randomUUID()
    const toolName = question.toolName

    return new Promise<ApprovalOutcome>(resolve => {
      let settled = false
      let timer: NodeJS.Timeout | undefined

      const settle = (outcome: ApprovalOutcome, feedText?: string): void => {
        if (settled) return
        settled = true
        pending.delete(id)
        if (timer !== undefined) clearTimeout(timer)
        question.signal?.removeEventListener('abort', onAbort)
        // The ask's ID goes in the feed line. It is the only way a front end
        // can tell WHICH ask ended: `expired: write` names a tool, and a run
        // with two writes in flight cannot tell which card just went blank. The
        // page renders it (`gate.resolution`), so without it an expiry is an
        // empty space where a decision used to be.
        state.note(
          'approval',
          feedText ?? `${OUTCOME_LABEL[outcome]}: ${toolName} [${id}]`,
          runId,
        )
        resolve(outcome)
      }
      // Same shape on this path as the timeout's: the id goes IN the text,
      // because this call passes its own and so bypasses the default entirely.
      const onAbort = (): void => settle(
        'cancelled',
        `cancelled: ${toolName} (the ask was withdrawn) [${id}]`,
      )

      toolNameOf.set(id, toolName)
      pending.set(id, {
        id,
        toolName,
        ...question.callId === undefined ? {} : { callId: question.callId },
        ...question.reason === undefined ? {} : { reason: question.reason },
        runId,
        askedAt: Date.now(),
        briefState: 'none',
        settle,
      })
      timer = setTimeout(
        // The default text is built WITHOUT the id and the id-carrying form is
        // the default path, so exactly one of them is written. An earlier draft
        // put the id in the DEFAULT and this timeout kept passing its own text
        // — so every expiry arrived id-less, and the page's card had no way to
        // name it. The lesson is the boring one: a default and an explicit
        // argument are two paths, and only one of them was getting the change.
        () => settle(
          'unavailable',
          `expired: ${toolName} — no answer within ${String(answerTimeoutMs)}ms [${id}]`,
        ),
        answerTimeoutMs,
      )
      timer.unref?.()
      question.signal?.addEventListener('abort', onAbort, { once: true })
      state.note(
        'approval',
        `asked: ${toolName}${question.reason === undefined ? '' : ` — ${firstLine(question.reason)}`}`,
        runId,
      )
    })
  }

  return {
    answer,
    briefs,
    pendingSnapshot: () => [...pending.values()].map(({ settle: _settle, ...rest }) => ({ ...rest })),
    settleApproval: (id, outcome, feedback) => {
      // The id is part of the TEXT on this path too, for the same reason as the
      // abort above: any call that passes `feedText` bypasses the default, and
      // this one always does whenever the operator typed a note. A page that
      // cannot read the id off the feed cannot say which card just settled.
      const note = feedback === undefined || feedback.trim() === ''
        ? ''
        : ` — ${feedback.trim()}`
      return settleEntry(id, outcome, `${OUTCOME_LABEL[outcome]}: ${nameOf(id)}${note} [${id}]`)
    },
    stop: () => {
      stopped = true
      toolNameOf.clear()
      for (const entry of [...pending.values()]) entry.settle('unavailable')
    },
  }
}
