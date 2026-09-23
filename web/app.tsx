/**
 * The dashboard's React shell, on assistant-ui.
 *
 * Seam:
 *   pending ask  →  tool-call part with approval gate   [approval-bridge]
 *                →  ApprovalCard / composer feedback
 *                →  onRespondToToolApproval
 *                →  `source.respond(...)`
 *
 * The source is INJECTED. It used to be hardwired to this page's own HTTP
 * server (`EventSource('/api/events')` + `POST /api/approvals/:id`), which
 * only worked while the dashboard was a standalone origin. It is now a page
 * inside the DSH UI, fed by the host remote, so the transport is a parameter
 * and the components below are unchanged — the design, meters, badges and
 * workspace tree are exactly the ones that shipped.
 *
 * Two consequences worth stating, because they are easy to lose in a rewrite:
 *
 *   the buttons are not the model's   the gate's options come from
 *                                     `approval-bridge`, a module with no
 *                                     model input at all. The brief is text
 *                                     *inside* this card, never the card.
 *   a failed POST stays retryable     assistant-ui keeps the gate open when
 *                                     the callback rejects, so a 409 (someone
 *                                     else answered) or a dropped connection
 *                                     leaves the operator able to act rather
 *                                     than staring at a dead button.
 *
 * Bootstrapping: the shell inlines `window.__FL_DASHBOARD_SNAPSHOT__` and
 * `__FL_DASHBOARD_TOKEN__` before this bundle's script tag, so first paint
 * needs no fetch. SSE frames replace the snapshot after that.
 *
 * Layout: the page is an ops console — primary decision stage on the left,
 * run/activity rail on the right. Run cards, the activity feed, and the
 * run-state numbers are plain DOM in React; they were never model-authored,
 * and rendering them through a chat primitive would be the tail wagging the
 * dog.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  AssistantRuntimeProvider,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
} from '@assistant-ui/react'
import type { ThreadMessageLike, ToolCallMessagePartProps } from '@assistant-ui/react'
import { outcomeForResponse, toApprovalGate } from '../src/approval-bridge.ts'
import type { BridgeOutcome } from '../src/approval-bridge.ts'
import type { BriefNode, DashboardSnapshot, PendingApproval } from '../src/dashboard.ts'

/** Where this page gets its state and sends its decisions. */
export interface DashboardSource {
  /** The current snapshot. Rejects rather than throwing on a transport error. */
  load(): Promise<DashboardSnapshot>
  /**
   * Subscribe to Host change notifications; returns an unsubscribe.
   *
   * Optional so a source with no such transport still works — the standalone
   * page gets its push from the SSE stream, and the interval below is only a
   * net either way.
   */
  onChange?(listener: () => void): () => void
  /** Settle one ask. Rejects so the card can report a refused decision. */
  respond(id: string, outcome: BridgeOutcome, feedback: string): Promise<void>
}

declare global {
  interface Window {
    __FL_DASHBOARD_SNAPSHOT__?: DashboardSnapshot
    __FL_DASHBOARD_TOKEN__?: string
  }
}

/** One pending ask as an assistant-ui message with an approval gate. */
function askToMessage(ask: PendingApproval): ThreadMessageLike {
  const gate = toApprovalGate({
    id: ask.id,
    toolName: ask.toolName,
    ...ask.callId === undefined ? {} : { callId: ask.callId },
    ...ask.reason === undefined ? {} : { reason: ask.reason },
    ...ask.runId === undefined ? {} : { runId: ask.runId },
    askedAt: ask.askedAt,
  })
  return {
    id: `ask-${ask.id}`,
    role: 'assistant',
    createdAt: new Date(ask.askedAt),
    content: [
      {
        type: 'tool-call',
        toolCallId: ask.id,
        toolName: ask.toolName,
        args: {},
        argsText: '{}',
        approval: gate,
      },
    ],
  } as unknown as ThreadMessageLike
}

/** Operator chat bubble (local only — never model-authored). */
function userFeedbackMessage(id: string, text: string, at = Date.now()): ThreadMessageLike {
  return {
    id,
    role: 'user',
    createdAt: new Date(at),
    content: [{ type: 'text', text }],
  }
}

function token(): string {
  return window.__FL_DASHBOARD_TOKEN__ ?? ''
}

/**
 * POST a decision. Optional `feedback` is free-text from the composer;
 * the server appends it to the activity feed and ignores empty strings.
 */
async function respondToApproval(
  source: DashboardSource,
  response: {
    approvalId: string
    approved?: boolean
    optionId?: string
    feedback?: string
  },
): Promise<void> {
  const outcome = outcomeForResponse(response)
  const feedback = response.feedback?.trim() ?? ''
  await source.respond(response.approvalId, outcome, feedback)
}

function BriefNodeView({ node }: { node: BriefNode }): React.ReactElement {
  if (node.kind === 'heading') return <h3 className="brief-heading">{node.text}</h3>
  if (node.kind === 'list') {
    return <ul className="brief-list">{node.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
  }
  if (node.kind === 'code') {
    return <pre className="brief-code" data-language={node.language}>{node.code}</pre>
  }
  return <p className="brief-para">{node.text}</p>
}

function BriefView({ ask }: { ask: PendingApproval }): React.ReactElement | null {
  if (ask.briefState === 'none') return null
  if (ask.briefState === 'pending') {
    return <div className="brief-note">Writing review brief…</div>
  }
  if (ask.briefState === 'failed') {
    return <div className="brief-note">Review brief unavailable.</div>
  }
  return (
    <div className="brief">
      {(ask.brief ?? []).map((node, i) => <BriefNodeView key={i} node={node} />)}
    </div>
  )
}

/** Local wall-clock time for the "asked at" stamp. */
function formatAsked(askedAt: number): string {
  return new Date(askedAt).toLocaleTimeString()
}

/** One decision plate: eyebrow, tool, meta, reason, brief, actions. */
function ApprovalCard(props: ToolCallMessagePartProps): React.ReactElement {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ask = ASK_BY_ID.get(props.toolCallId)
  const gate = props.approval
  const options = gate?.options ?? []
  const feedback = useFeedback()

  // Card buttons go through assistant-ui's respondToApproval so the gate
  // closes correctly; feedback is attached in onRespondToToolApproval by
  // reading the shared draft (see ApprovalThread).
  const decide = useCallback((optionId: string) => {
    setBusy(true)
    setError(null)
    void props.respondToApproval({ optionId }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => setBusy(false))
  }, [props])

  const settled = gate?.approved !== undefined || gate?.resolution !== undefined
  const note = feedback.text.trim()

  return (
    <div className="card" aria-busy={busy}>
      <div className="card-top">
        <span className="eyebrow">Approval required</span>
        {ask !== undefined && <span className="asked">asked {formatAsked(ask.askedAt)}</span>}
      </div>
      <div className="tool">{props.toolName}</div>
      {ask !== undefined && (
        <div className="meta">
          <span className="meta-k">run</span>
          <span className="meta-v">{ask.runId ?? 'agentless'}</span>
          {ask.callId !== undefined && (
            <>
              <span className="meta-k">call</span>
              <span className="meta-v">{ask.callId}</span>
            </>
          )}
        </div>
      )}
      {gate?.prompt !== undefined && <div className="reason">{gate.prompt}</div>}
      {ask !== undefined && <BriefView ask={ask} />}
      {gate?.resolution !== undefined && (
        <div className="brief-note settled">
          {gate.resolution === 'expired' ? 'Expired — no answer in time.' : 'Cancelled — the ask was withdrawn.'}
        </div>
      )}
      {!settled && (
        <div className="row actions">
          {options.map(option => (
            <button
              key={option.id}
              type="button"
              className={option.kind === 'allow-once' ? 'allow' : 'reject'}
              disabled={busy}
              aria-busy={busy}
              onClick={() => decide(option.id)}
            >
              {option.label}
            </button>
          ))}
          {busy && <span className="busy-note">Submitting…</span>}
        </div>
      )}
      {error !== null && <div className="brief-note error" role="alert">{error}</div>}
    </div>
  )
}

const ASK_BY_ID = new Map<string, PendingApproval>()

function useSnapshot(source: DashboardSource): DashboardSnapshot | null {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(
    () => window.__FL_DASHBOARD_SNAPSHOT__ ?? null,
  )
  useEffect(() => {
    let alive = true
    const tick = (): void => {
      source.load()
        .then(next => { if (alive) setSnapshot(next) })
        .catch(() => { /* a failed read keeps the last good frame */ })
    }
    // The Host pushes `featureLoop/changed` and this re-reads on that signal.
    // The interval is a SAFETY NET for a dropped frame, not the mechanism: at
    // 2s the poll WAS the mechanism and the event was decoration. 30s means a
    // missed event is staleness rather than a dead page.
    tick()
    const unsubscribe = source.onChange?.(tick) ?? (() => undefined)
    const timer = setInterval(tick, 30_000)
    return () => { alive = false; clearInterval(timer); unsubscribe() }
  }, [source])
  return snapshot
}

/** Publish the pending count into the page chrome's status badge. */
function usePendingBadge(count: number): void {
  useEffect(() => {
    const el = document.getElementById('pending-count')
    if (el === null) return
    el.textContent = count === 0 ? 'idle' : `${String(count)} pending`
    el.setAttribute('data-count', String(count))
  }, [count])
}

function ApprovalThread({ pending }: { pending: PendingApproval[] }): React.ReactElement {
  // The renderer receives a part without the domain object behind it, so the
  // asks are published for lookup by id. This runs during render because the
  // map must match the messages being rendered in the same pass; it is a
  // module-level cache of the current frame, not app state.
  ASK_BY_ID.clear()
  for (const ask of pending) ASK_BY_ID.set(ask.id, ask)

  const [localMessages, setLocalMessages] = useState<ThreadMessageLike[]>([])
  const [draft, setDraft] = useState('')
  // Ref so onRespondToToolApproval can read the latest draft without
  // re-creating the runtime on every keystroke.
  const draftRef = useRef(draft)
  draftRef.current = draft

  const messages = useMemo(() => {
    const asks = pending.map(askToMessage)
    // User feedback bubbles after the live asks keep the thread chat-shaped.
    return [...asks, ...localMessages].slice(-48)
  }, [pending, localMessages])

  const commitLocal = useCallback(() => {
    const note = draftRef.current.trim()
    if (note === '') return
    setLocalMessages((prev) => [...prev, userFeedbackMessage(`feedback-${String(Date.now())}`, note)])
    // Keep draft so Allow/Reject still attaches the same note; operator can
    // clear manually. Sending into the thread is "post feedback", not settle.
  }, [])

  const feedbackApi = useMemo<FeedbackApi>(() => ({
    text: draft,
    setText: setDraft,
    clear: () => {
      setDraft('')
      draftRef.current = ''
    },
    commitLocal,
  }), [draft, commitLocal])

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning: false,
    convertMessage: (message: ThreadMessageLike) => message,
    onNew: async () => {
      // Composer is owned outside assistant-ui; adapter still requires onNew.
    },
    onRespondToToolApproval: async (options) => {
      const note = draftRef.current.trim()
      await respondToApproval(source, {
        ...options,
        approvalId: options.approvalId,
        ...note === '' ? {} : { feedback: note },
      })
      if (note !== '') {
        setLocalMessages((prev) => {
          const last = prev[prev.length - 1]
          const already = last !== undefined
            && last.role === 'user'
            && Array.isArray(last.content)
            && last.content.some(
              (p) => typeof p === 'object' && p !== null && 'text' in p && (p as { text: string }).text === note,
            )
          if (already) return prev
          return [...prev, userFeedbackMessage(`feedback-${String(Date.now())}`, note)]
        })
      }
      setDraft('')
      draftRef.current = ''
    },
  })
  if (pending.length === 0) {
    return (
      <div className="empty empty-plate">
        <p className="empty-title">No pending approval requests.</p>
        <p className="hint">When a run reaches a review gate, the ask appears here for Allow once / Reject.</p>
      </div>
    )
  }
  return (
    <div className="dashboard-shell">
      <aside className="sidebar" aria-label="Workspaces and activity">
        <div className="sidebar-top">
          <WorkspaceTree
            snapshot={snapshot}
            filter={sessionFilter}
            onSelect={setSessionFilter}
          />
        </div>
        <ActivityFeed snapshot={snapshot} filter={sessionFilter} />
      </aside>
      <section className="stage" id="approvals" aria-label="Approvals thread">
        <div className="section-head">
          <h2>Approval thread</h2>
          <span className={`section-count${snapshot.pending.length > 0 ? ' hot' : ''}`}>
            {snapshot.pending.length}
          </span>
        </div>
        <ApprovalThread pending={snapshot.pending} source={source} />
      </section>
      <aside className="rail" aria-label="Grouped runs">
        <GroupedRunPanels snapshot={snapshot} filter={sessionFilter} />
      </aside>
    </div>
  )
}

function RunPanels({ snapshot }: { snapshot: DashboardSnapshot }): React.ReactElement {
  return (
    <>
      <section id="run-state">
        <div className="section-head">
          <h2>Run state</h2>
        </div>
        {snapshot.runs.length === 0
          ? <p className="empty">No run has reported yet.</p>
          : snapshot.runs.map((run) => (
            <div className="run-card" key={run.runId}>
              <div className="run-grid">
                <div>
                  <div className="k">run</div>
                  <div className="v mono">{run.runId}</div>
                </div>
                <div>
                  <div className="k">steps</div>
                  <div className="v">
                    {run.step ?? '—'}{run.maxSteps === undefined ? '' : ` / ${run.maxSteps}`}
                  </div>
                </div>
                <div>
                  <div className="k">spend (unmetered)</div>
                  <div className="v">
                    {run.spentUSD === undefined ? '—' : `$${run.spentUSD.toFixed(4)}`}
                    {run.budgetUSD === undefined ? '' : ` / $${run.budgetUSD.toFixed(2)}`}
                  </div>
                </div>
                {run.route !== undefined && (
                  <div>
                    <div className="k">route</div>
                    <div className="v mono">{run.route}</div>
                  </div>
                )}
                {run.judgeScore !== undefined && (
                  <div>
                    <div className="k">judge</div>
                    <div className="v">{run.judgeScore} / 3</div>
                  </div>
                )}
              </div>
              {(run.signals ?? []).map((signal, i) => (
                <div key={i} className={`sig ${signal.severity}`}>
                  <span className="sig-tag">{signal.severity}</span>
                  <span>{signal.kind} @ step {signal.step} — {signal.detail}</span>
                </div>
              ))}
            </div>
          ))}
        <p className="hint rail-honesty">Spend is not metered on the plugin path (Phase 2b), so
        <code>spent</code> can legitimately read zero; <code>maxSteps</code> is the
        trustworthy ceiling.</p>
      </section>
      <section id="activity">
        <div className="section-head">
          <h2>Activity</h2>
          <span className="section-count">{snapshot.feed.length}</span>
        </div>
        {snapshot.feed.length === 0
          ? <p className="empty">Nothing yet.</p>
          : [...snapshot.feed].reverse().map((entry, i) => (
            <div key={i} className="feed-item">
              <span className="t">{new Date(entry.t).toLocaleTimeString()}</span>
              <span className={`kind k-${entry.kind}`}>{entry.kind}</span>
              <span className="text">{entry.text}</span>
            </div>
          ))}
      </section>
    </>
  )
}

function App(): React.ReactElement {
  const snapshot = useSnapshot()
  usePendingBadge(snapshot?.pending.length ?? 0)
  if (snapshot === null) return <p className="empty">Connecting…</p>
  return (
    <div className="dashboard-shell">
      <section className="stage" id="approvals">
        <div className="section-head">
          <h2>Pending approvals</h2>
          <span className={`section-count${snapshot.pending.length > 0 ? ' hot' : ''}`}>
            {snapshot.pending.length}
          </span>
        </div>
        <ApprovalThread pending={snapshot.pending} />
      </section>
      <aside className="rail" aria-label="Run context">
        <RunPanels snapshot={snapshot} />
      </aside>
    </div>
  )
}

const root = document.getElementById('root')
if (root !== null) createRoot(root).render(<App />)
