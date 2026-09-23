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

function useSnapshot(source: DashboardSource): DashboardSnapshot | null {
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

/** Fraction 0–1 → meter tone (Cursor progress green → warn → bad). */
function meterTone(ratio: number): 'ok' | 'warn' | 'bad' {
  if (ratio >= 0.9) return 'bad'
  if (ratio >= 0.7) return 'warn'
  return 'ok'
}

function Meter({
  value,
  max,
  label,
  className,
}: {
  value: number
  max: number
  label: string
  className?: string
}): React.ReactElement | null {
  if (!(max > 0) || !Number.isFinite(value) || !Number.isFinite(max)) return null
  const ratio = Math.max(0, Math.min(1, value / max))
  const tone = meterTone(ratio)
  const pct = Math.round(ratio * 1000) / 10
  return (
    <div
      className={`meter ${tone}${className ? ` ${className}` : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      aria-label={label}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

function severityTagClass(severity: string): string {
  if (severity === 'critical') return 'tag tag-bad sig-tag'
  if (severity === 'warning') return 'tag tag-warn sig-tag'
  if (severity === 'info' || severity === 'notice') return 'tag tag-cyan sig-tag'
  return 'tag tag-ghost sig-tag'
}

function feedKindTagClass(kind: string): string {
  if (kind === 'approval') return 'tag tag-warn feed-k'
  if (kind === 'gate') return 'tag tag-bad feed-k'
  if (kind === 'judge') return 'tag tag-ok feed-k'
  if (kind === 'signals') return 'tag tag-cyan feed-k'
  if (kind === 'route' || kind === 'step') return 'tag tag-accent feed-k'
  return 'tag tag-ghost feed-k'
}

const UNGROUPED = 'Ungrouped'

type SessionFilter = 'all' | string

interface WorkspaceGroup {
  key: string
  label: string
  cwd?: string
  sessions: DashboardSnapshot['runs']
}

function shortSessionId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…`
}

function buildWorkspaceTree(runs: DashboardSnapshot['runs']): WorkspaceGroup[] {
  const map = new Map<string, WorkspaceGroup>()
  for (const run of runs) {
    const label = run.workspaceLabel?.trim() || UNGROUPED
    const key = run.cwd && run.cwd !== '' ? run.cwd : label
    let group = map.get(key)
    if (group === undefined) {
      group = {
        key,
        label,
        ...run.cwd === undefined || run.cwd === '' ? {} : { cwd: run.cwd },
        sessions: [],
      }
      map.set(key, group)
    }
    group.sessions.push(run)
  }
  const groups = [...map.values()]
  for (const g of groups) {
    g.sessions.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }
  groups.sort((a, b) => {
    if (a.label === UNGROUPED && b.label !== UNGROUPED) return 1
    if (b.label === UNGROUPED && a.label !== UNGROUPED) return -1
    return a.label.localeCompare(b.label)
  })
  return groups
}

function WorkspaceTree({
  snapshot,
  filter,
  onSelect,
}: {
  snapshot: DashboardSnapshot
  filter: SessionFilter
  onSelect: (next: SessionFilter) => void
}): React.ReactElement {
  const pendingByRun = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of snapshot.pending) {
      if (p.runId === undefined || p.runId === '') continue
      counts.set(p.runId, (counts.get(p.runId) ?? 0) + 1)
    }
    return counts
  }, [snapshot.pending])

  const groups = useMemo(() => buildWorkspaceTree(snapshot.runs), [snapshot.runs])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Expand groups that hold the selection or a pending session by default.
  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev }
      for (const g of groups) {
        const hasPending = g.sessions.some((s) => (pendingByRun.get(s.runId) ?? 0) > 0)
        const hasSelected = filter !== 'all' && g.sessions.some((s) => s.runId === filter)
        if (hasPending || hasSelected) next[g.key] = false
        else if (next[g.key] === undefined) next[g.key] = false
      }
      return next
    })
  }, [groups, filter, pendingByRun])

  if (snapshot.runs.length === 0) {
    return (
      <section id="workspaces" aria-label="Workspaces">
        <div className="section-head">
          <h2>Workspaces</h2>
          <span className="section-count">0</span>
        </div>
        <p className="empty">No live sessions yet.</p>
      </section>
    )
  }

  return (
    <section id="workspaces" aria-label="Workspaces">
      <div className="section-head">
        <h2>Workspaces</h2>
        <span className="section-count">{groups.length}</span>
      </div>
      <div className="ws-tree scroll-beauty" role="tree">
        <button
          type="button"
          className={`ws-all${filter === 'all' ? ' is-active' : ''}`}
          role="treeitem"
          aria-current={filter === 'all' ? 'true' : undefined}
          onClick={() => onSelect('all')}
        >
          All sessions
          <span className="tag tag-ghost">{snapshot.runs.length}</span>
        </button>
        {groups.map((group) => {
          const folded = collapsed[group.key] === true
          const pendingInGroup = group.sessions.reduce(
            (n, s) => n + (pendingByRun.get(s.runId) ?? 0),
            0,
          )
          return (
            <div key={group.key} className="ws-group" role="group">
              <button
                type="button"
                className="ws-group-head"
                aria-expanded={!folded}
                onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !folded }))}
                title={group.cwd ?? group.label}
              >
                <span className="ws-chevron" aria-hidden="true">{folded ? '▸' : '▾'}</span>
                <span className="ws-group-label">{group.label}</span>
                <span className="tag tag-ghost">{group.sessions.length}</span>
                {pendingInGroup > 0 && (
                  <span className="tag tag-warn">{pendingInGroup}</span>
                )}
              </button>
              {!folded && (
                <ul className="ws-sessions">
                  {group.sessions.map((session) => {
                    const pending = pendingByRun.get(session.runId) ?? 0
                    const selected = filter === session.runId
                    const label = session.sessionId ?? session.runId
                    return (
                      <li key={session.runId}>
                        <button
                          type="button"
                          className={`ws-session${selected ? ' is-active' : ''}${pending > 0 ? ' is-pending' : ''}`}
                          role="treeitem"
                          aria-current={selected ? 'true' : undefined}
                          title={session.cwd ? `${label}\n${session.cwd}` : label}
                          onClick={() => onSelect(session.runId)}
                        >
                          <span className="ws-session-id mono">{shortSessionId(label)}</span>
                          {session.step !== undefined && (
                            <span className="tag tag-ghost">s{session.step}</span>
                          )}
                          {pending > 0 && (
                            <span className="tag tag-warn">{pending}</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RunCard({ run }: { run: DashboardSnapshot['runs'][number] }): React.ReactElement {
  return (
    <div className="run-card">
      <div className="run-grid">
        <div>
          <div className="k">run</div>
          <div className="v mono" title={run.runId}>{shortSessionId(run.sessionId ?? run.runId)}</div>
        </div>
        <div>
          <div className="k">steps</div>
          <div className="v">
            {run.step ?? '—'}{run.maxSteps === undefined ? '' : ` / ${run.maxSteps}`}
          </div>
          {run.step !== undefined && run.maxSteps !== undefined && (
            <Meter
              value={run.step}
              max={run.maxSteps}
              label={`Step ${run.step} of ${run.maxSteps}`}
            />
          )}
        </div>
        <div>
          <div className="k">spend</div>
          <div className="v">
            {run.spentUSD === undefined ? '—' : `$${run.spentUSD.toFixed(4)}`}
            {run.budgetUSD === undefined ? '' : ` / $${run.budgetUSD.toFixed(2)}`}
          </div>
          {run.spentUSD !== undefined && run.budgetUSD !== undefined && (
            <Meter
              value={run.spentUSD}
              max={run.budgetUSD}
              label={`Spend $${run.spentUSD.toFixed(4)} of $${run.budgetUSD.toFixed(2)}`}
            />
          )}
        </div>
        {run.route !== undefined && (
          <div>
            <div className="k">route</div>
            <div className="v">
              <span className="tag tag-accent" title={run.route}>{run.route}</span>
            </div>
          </div>
        )}
        {run.judgeScore !== undefined && (
          <div>
            <div className="k">judge</div>
            <div className="v">
              <span className={`tag ${run.judgeScore >= 2 ? 'tag-ok' : run.judgeScore >= 1 ? 'tag-warn' : 'tag-bad'}`}>
                {run.judgeScore} / 3
              </span>
            </div>
            <Meter
              value={run.judgeScore}
              max={3}
              label={`Judge score ${run.judgeScore} of 3`}
              className="accent"
            />
          </div>
        )}
      </div>
      {(run.signals ?? []).map((signal, i) => (
        <div key={i} className={`sig ${signal.severity}`}>
          <span className={severityTagClass(signal.severity)}>{signal.severity}</span>
          <span className="tag tag-ghost">{signal.kind}</span>
          <span>@ step {signal.step} — {signal.detail}</span>
        </div>
      ))}
    </div>
  )
}

/** Right rail: runs grouped by workspace, independent scroll. */
function GroupedRunPanels({
  snapshot,
  filter,
}: {
  snapshot: DashboardSnapshot
  filter: SessionFilter
}): React.ReactElement {
  const runs = filter === 'all'
    ? snapshot.runs
    : snapshot.runs.filter((r) => r.runId === filter)
  const groups = useMemo(() => buildWorkspaceTree(runs), [runs])

  return (
    <section id="run-state" className="pane pane-runs">
      <div className="section-head pane-head">
        <h2>Runs</h2>
        <span className="section-count">{runs.length}</span>
        {filter !== 'all' && (
          <span className="tag tag-accent" title={filter}>{shortSessionId(filter)}</span>
        )}
      </div>
      <div className="pane-scroll scroll-beauty">
        {runs.length === 0
          ? (
            <p className="empty">
              {filter === 'all' ? 'No run has reported yet.' : 'No run state for this session.'}
            </p>
          )
          : groups.map((group) => (
            <div key={group.key} className="run-group">
              <div className="run-group-head" title={group.cwd ?? group.label}>
                <span className="run-group-label">{group.label}</span>
                <span className="tag tag-ghost">{group.sessions.length}</span>
              </div>
              <div className="run-group-body">
                {group.sessions.map((run) => (
                  <RunCard key={run.runId} run={run} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}

/** Left sidebar activity ledger — filtered feed, independent scroll. */
function ActivityFeed({
  snapshot,
  filter,
}: {
  snapshot: DashboardSnapshot
  filter: SessionFilter
}): React.ReactElement {
  const feed = filter === 'all'
    ? snapshot.feed
    : snapshot.feed.filter((line) => line.runId === filter)

  return (
    <section id="activity" className="pane pane-activity">
      <div className="section-head pane-head">
        <h2>Activity</h2>
        <span className="section-count">{feed.length}</span>
      </div>
      <div className="pane-scroll scroll-beauty">
        {feed.length === 0
          ? (
            <p className="empty">
              {filter === 'all' ? 'No activity yet.' : 'No activity for this session.'}
            </p>
          )
          : (
            <ul className="feed">
              {[...feed].reverse().map((line, i) => (
                <li key={`${String(line.t)}-${String(i)}`} className="feed-item">
                  <span className="feed-t t">{new Date(line.t).toLocaleTimeString()}</span>
                  <span className={feedKindTagClass(line.kind)}>{line.kind}</span>
                  <span className="feed-text text">{line.text}</span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </section>
  )
}

function App(): React.ReactElement {
  const snapshot = useSnapshot()
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all')
  usePendingBadge(snapshot?.pending.length ?? 0)

  // Drop selection if the run disappeared (eviction / restart).
  useEffect(() => {
    if (sessionFilter === 'all' || snapshot === null) return
    if (!snapshot.runs.some((r) => r.runId === sessionFilter)) {
      setSessionFilter('all')
    }
  }, [snapshot, sessionFilter])

  if (snapshot === null) {
    return <p className="empty">Loading…</p>
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
        <ApprovalThread pending={snapshot.pending} />
      </section>
      <aside className="rail" aria-label="Grouped runs">
        <GroupedRunPanels snapshot={snapshot} filter={sessionFilter} />
      </aside>
    </div>
  )
}

const root = document.getElementById('root')
if (root !== null) createRoot(root).render(<App />)
