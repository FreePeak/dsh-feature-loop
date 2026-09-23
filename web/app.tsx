/**
 * The dashboard's React shell, on assistant-ui.
 *
 * Seam (unchanged):
 *   pending ask (SSE snapshot)
 *     → tool-call part with approval gate   [approval-bridge]
 *     → ApprovalCard / composer feedback
 *     → onRespondToToolApproval
 *     → POST /api/approvals/:id
 *
 * Layout: stockbroker-style chat thread — assistant messages carry the
 * approval card; a sticky composer accepts free-text response/feedback.
 * Allow once / Reject still settle the gate; typed text is optional and
 * rides the same POST as `feedback` when present.
 *
 * Bootstrapping: the shell inlines `window.__FL_DASHBOARD_SNAPSHOT__` and
 * `__FL_DASHBOARD_TOKEN__` before this bundle's script tag.
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
import type { BriefNode, DashboardSnapshot, PendingApproval } from '../src/dashboard.ts'

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
async function respondToApproval(response: {
  approvalId: string
  approved?: boolean
  optionId?: string
  feedback?: string
}): Promise<void> {
  const outcome = outcomeForResponse(response)
  const feedback = response.feedback?.trim() ?? ''
  const res = await fetch(`/api/approvals/${encodeURIComponent(response.approvalId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Dashboard-Token': token() },
    body: JSON.stringify({
      outcome,
      ...feedback === '' ? {} : { feedback },
    }),
  })
  if (!res.ok) {
    throw new Error(`dashboard refused the decision: HTTP ${String(res.status)}`)
  }
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

function formatAsked(askedAt: number): string {
  return new Date(askedAt).toLocaleTimeString()
}

/**
 * Shared draft between the card actions and the thread composer.
 * Typing in the composer is the response/feedback; Allow/Reject still settle.
 */
type FeedbackApi = {
  text: string
  setText: (next: string) => void
  clear: () => void
  /** Park the current draft as a user bubble without settling the gate. */
  commitLocal: () => void
}

const FeedbackCtx = React.createContext<FeedbackApi>({
  text: '',
  setText: () => undefined,
  clear: () => undefined,
  commitLocal: () => undefined,
})

function useFeedback(): FeedbackApi {
  return React.useContext(FeedbackCtx)
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
      {!settled && note !== '' && (
        <div className="feedback-preview" aria-live="polite">
          Feedback will be sent with your decision: <em>{note}</em>
        </div>
      )}
      {error !== null && <div className="brief-note error" role="alert">{error}</div>}
    </div>
  )
}

const ASK_BY_ID = new Map<string, PendingApproval>()

function useSnapshot(): DashboardSnapshot | null {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(
    () => window.__FL_DASHBOARD_SNAPSHOT__ ?? null,
  )
  const stream = useRef<EventSource | null>(null)
  useEffect(() => {
    if (stream.current !== null) return
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token())}`)
    stream.current = es
    es.onmessage = (ev) => {
      try {
        setSnapshot(JSON.parse(ev.data) as DashboardSnapshot)
      } catch {
        /* malformed frame must not kill the page */
      }
    }
    return () => {
      if (stream.current === es) {
        stream.current = null
        es.close()
      }
    }
  }, [])
  return snapshot
}

function usePendingBadge(count: number): void {
  useEffect(() => {
    const el = document.getElementById('pending-count')
    if (el === null) return
    el.textContent = count === 0 ? 'idle' : `${String(count)} pending`
    el.setAttribute('data-count', String(count))
  }, [count])
}

/**
 * Sticky chat composer — stockbroker shape, controlled draft.
 *
 * Owned input (not ComposerPrimitive.Input) so Allow/Reject always see the
 * same text the operator typed, even without pressing Send first.
 */
function ApprovalComposer({ disabled }: { disabled: boolean }): React.ReactElement {
  const feedback = useFeedback()
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (disabled || feedback.text.trim() === '') return
    feedback.commitLocal()
  }
  return (
    <form className="hitl-composer-root" onSubmit={onSubmit}>
      <div className={`hitl-composer-shell${disabled ? ' is-disabled' : ''}`}>
        <textarea
          className="hitl-composer-input"
          placeholder={disabled
            ? 'No pending approval — waiting for the next gate…'
            : 'Add response or feedback, then Allow once / Reject — or send to post feedback into the thread…'}
          rows={2}
          aria-label="Approval response and feedback"
          disabled={disabled}
          value={feedback.text}
          onChange={(event) => feedback.setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              if (!disabled && feedback.text.trim() !== '') feedback.commitLocal()
            }
          }}
        />
        <div className="hitl-composer-actions">
          <span className="hitl-composer-hint">
            {disabled ? 'Composer idle' : 'Enter posts feedback · Shift+Enter newline · buttons decide'}
          </span>
          <button
            type="submit"
            className="hitl-composer-send"
            disabled={disabled || feedback.text.trim() === ''}
            aria-label="Send feedback"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  )
}

function UserBubble(): React.ReactElement {
  return (
    <MessagePrimitive.Root className="hitl-user-msg" data-role="user">
      <div className="hitl-user-bubble">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantBubble(): React.ReactElement {
  return (
    <MessagePrimitive.Root className="hitl-assistant-msg" data-role="assistant">
      <MessagePrimitive.Parts components={{ tools: { Override: ApprovalCard } }} />
    </MessagePrimitive.Root>
  )
}

function ApprovalThread({ pending }: { pending: PendingApproval[] }): React.ReactElement {
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
      await respondToApproval({
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

  return (
    <FeedbackCtx.Provider value={feedbackApi}>
      <AssistantRuntimeProvider runtime={runtime}>
        <ThreadPrimitive.Root className="hitl-thread-root" style={{ ['--thread-max-width' as string]: '44rem' }}>
          <ThreadPrimitive.Viewport className="hitl-thread-viewport" turnAnchor="top">
            {pending.length === 0 && localMessages.length === 0 ? (
              <div className="empty empty-plate hitl-welcome">
                <p className="empty-title">No pending approval requests.</p>
                <p className="hint">
                  When a run reaches a review gate, the ask appears in this thread.
                  Use the composer for response/feedback, then Allow once or Reject.
                </p>
              </div>
            ) : null}
            <ThreadPrimitive.Messages
              components={{
                UserMessage: UserBubble,
                AssistantMessage: AssistantBubble,
              }}
            />
            <ThreadPrimitive.ViewportFooter className="hitl-thread-footer">
              <ApprovalComposer disabled={pending.length === 0} />
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </AssistantRuntimeProvider>
    </FeedbackCtx.Provider>
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
      </section>
      <section id="activity">
        <div className="section-head">
          <h2>Activity</h2>
        </div>
        {snapshot.feed.length === 0
          ? <p className="empty">No activity yet.</p>
          : (
            <ul className="feed">
              {[...snapshot.feed].reverse().map((line, i) => (
                <li key={`${String(line.t)}-${String(i)}`}>
                  <span className="feed-t">{new Date(line.t).toLocaleTimeString()}</span>
                  <span className={`feed-k ${line.kind}`}>{line.kind}</span>
                  <span className="feed-text">{line.text}</span>
                </li>
              ))}
            </ul>
          )}
      </section>
    </>
  )
}

function App(): React.ReactElement {
  const snapshot = useSnapshot()
  usePendingBadge(snapshot?.pending.length ?? 0)
  if (snapshot === null) {
    return <p className="empty">Loading…</p>
  }
  return (
    <div className="dashboard-shell">
      <section className="stage" id="approvals" aria-label="Approvals thread">
        <div className="section-head">
          <h2>Approval thread</h2>
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
