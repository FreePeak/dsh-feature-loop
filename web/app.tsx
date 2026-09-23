/**
 * The dashboard's React shell, on assistant-ui.
 *
 * The shape of this file is the whole design in one place. assistant-ui owns
 * the approval presentation; this dashboard owns the decision. The seam
 * between them is `onRespondToToolApproval`, and everything this module does
 * is arranged so that seam is the *only* way a click becomes an authorisation:
 *
 *   pending ask (our SSE snapshot)
 *     → a tool-call message part carrying an approval gate   [approval-bridge]
 *     → assistant-ui renders the affordance
 *     → onRespondToToolApproval
 *     → POST /api/approvals/:id  (the existing guarded endpoint)
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
 * Run cards, the activity feed, and the run-state numbers are plain DOM in
 * React — they were never model-authored, and rendering them through a chat
 * primitive would be the tail wagging the dog.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
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

/**
 * One pending ask as an assistant-ui message.
 *
 * The ask becomes a synthetic tool call whose `approval` gate is the real
 * thing: assistant-ui renders it and calls back when the operator decides.
 * `args` is empty on purpose — the approval event carries no tool arguments,
 * and filling it with a guess would put invented detail in front of the
 * person deciding.
 */
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

/** The token the page was opened with. */
function token(): string {
  return window.__FL_DASHBOARD_TOKEN__ ?? ''
}

/**
 * Record a decision against the dashboard's own endpoint.
 *
 * `approvalId` comes straight from assistant-ui's own response options, so
 * there is no lookup and no chance of answering a different ask than the one
 * the operator clicked.
 *
 * The response body is deliberately not inspected beyond status: the server
 * is the authority on whether the ask still existed, and a 409 means someone
 * else answered it first — a fine outcome for this operator, not a reason to
 * keep retrying. Rejecting on anything non-2xx is what keeps assistant-ui's
 * gate open for a decision that genuinely did not land.
 */
async function respondToApproval(response: {
  approvalId: string
  approved?: boolean
  optionId?: string
}): Promise<void> {
  const outcome = outcomeForResponse(response)
  const res = await fetch(`/api/approvals/${encodeURIComponent(response.approvalId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Dashboard-Token': token() },
    body: JSON.stringify({ outcome }),
  })
  if (!res.ok) {
    throw new Error(`dashboard refused the decision: HTTP ${String(res.status)}`)
  }
}

/** Render one normalized brief node as plain DOM. */
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

/**
 * The brief, or an honest statement that there isn't one.
 *
 * `pending` and `failed` are shown rather than hidden: an operator who cannot
 * tell "no brief was requested" from "the brief is still coming" will wait for
 * something that may never arrive.
 */
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

/** One tool call in the thread: the gate, the reason, and the brief. */
function ApprovalCard(props: ToolCallMessagePartProps): React.ReactElement {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ask = ASK_BY_ID.get(props.toolCallId)
  const gate = props.approval
  const options = gate?.options ?? []

  const decide = useCallback((optionId: string) => {
    setBusy(true)
    setError(null)
    // `respondToApproval` resolves once the runtime accepted the response and
    // rejects when it could not, which is exactly the retryability we want.
    void props.respondToApproval({ optionId }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    }).finally(() => setBusy(false))
  }, [props])

  const settled = gate?.approved !== undefined || gate?.resolution !== undefined

  return (
    <div className="card">
      <div className="tool">{props.toolName}</div>
      {ask !== undefined && (
        <div className="meta">
          {ask.runId ?? 'agentless'}{ask.callId === undefined ? '' : ` · ${ask.callId}`}
        </div>
      )}
      {gate?.prompt !== undefined && <div className="reason">{gate.prompt}</div>}
      {ask !== undefined && <BriefView ask={ask} />}
      {gate?.resolution !== undefined && (
        <div className="brief-note">
          {gate.resolution === 'expired' ? 'Expired — no answer in time.' : 'Cancelled — the ask was withdrawn.'}
        </div>
      )}
      {!settled && (
        <div className="row">
          {options.map(option => (
            <button
              key={option.id}
              className={option.kind === 'allow-once' ? 'allow' : 'reject'}
              disabled={busy}
              onClick={() => decide(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {error !== null && <div className="brief-note error">{error}</div>}
    </div>
  )
}

/**
 * Ask lookup for the renderer.
 *
 * assistant-ui hands a part to a component without the domain object behind
 * it, so the card reads the ask back by id. A module-level map rather than
 * context keeps the part component a plain function of its props, which is
 * what makes it renderable in isolation.
 */
const ASK_BY_ID = new Map<string, PendingApproval>()

function useSnapshot(): DashboardSnapshot | null {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(
    () => window.__FL_DASHBOARD_SNAPSHOT__ ?? null,
  )
  // One EventSource for the page's lifetime. The ref survives effect re-runs
  // without remounting, so a double-invoked effect reuses the stream instead
  // of opening a second one — and only the final cleanup closes it.
  const stream = useRef<EventSource | null>(null)
  useEffect(() => {
    if (stream.current !== null) return
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token())}`)
    stream.current = es
    es.onmessage = (ev) => {
      try {
        setSnapshot(JSON.parse(ev.data) as DashboardSnapshot)
      } catch {
        /* a malformed frame must not kill the page; the next one retries */
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

function ApprovalThread({ pending }: { pending: PendingApproval[] }): React.ReactElement {
  // The renderer receives a part without the domain object behind it, so the
  // asks are published for lookup by id. This runs during render because the
  // map must match the messages being rendered in the same pass; it is a
  // module-level cache of the current frame, not app state.
  ASK_BY_ID.clear()
  for (const ask of pending) ASK_BY_ID.set(ask.id, ask)
  const messages = pending.map(askToMessage)
  const runtime = useExternalStoreRuntime({
    messages,
    isRunning: false,
    // Our messages are already in assistant-ui's shape; the converter is the
    // identity because there is no second message model to translate from.
    convertMessage: (message: ThreadMessageLike) => message,
    onNew: async () => {
      // The dashboard is not a chat: there is no composer, and this callback
      // exists only to satisfy the adapter contract.
    },
    onRespondToToolApproval: async (options) => {
      // `options.approvalId` is the pending ask's own id — the same value put
      // into the gate — so the decision cannot be misrouted.
      await respondToApproval({ ...options, approvalId: options.approvalId })
    },
  })
  if (pending.length === 0) {
    return <p className="empty">No pending approval requests.</p>
  }
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root>
        <ThreadPrimitive.Viewport>
          {/*
            One message per pending ask, each rendered through the message
            scope so `MessagePrimitive.Parts` can resolve it. `Parts` outside
            a message scope throws ("The current scope does not have a
            'message' property") — hence Messages-with-a-component rather
            than a bare Parts call.
          */}
          <ThreadPrimitive.Messages>
            {() => (
              <MessagePrimitive.Root>
                <MessagePrimitive.Parts components={{ tools: { Override: ApprovalCard } }} />
              </MessagePrimitive.Root>
            )}
          </ThreadPrimitive.Messages>
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}

function RunPanels({ snapshot }: { snapshot: DashboardSnapshot }): React.ReactElement {
  return (
    <>
      <section>
        <h2>Run state</h2>
        {snapshot.runs.length === 0
          ? <p className="empty">No run has reported yet.</p>
          : snapshot.runs.map((run) => (
            <div className="card" key={run.runId}>
              <div className="run">
                <div><div className="k">run</div><div className="v">{run.runId}</div></div>
                <div><div className="k">steps</div><div className="v">
                  {run.step ?? '—'}{run.maxSteps === undefined ? '' : ` / ${run.maxSteps}`}
                </div></div>
                <div><div className="k">spend (unmetered)</div><div className="v">
                  {run.spentUSD === undefined ? '—' : `$${run.spentUSD.toFixed(4)}`}
                  {run.budgetUSD === undefined ? '' : ` / $${run.budgetUSD.toFixed(2)}`}
                </div></div>
                {run.route !== undefined && <div><div className="k">route</div><div className="v">{run.route}</div></div>}
                {run.judgeScore !== undefined && <div><div className="k">judge</div><div className="v">{run.judgeScore} / 3</div></div>}
              </div>
              {(run.signals ?? []).map((signal, i) => (
                <div key={i} className={`sig ${signal.severity}`}>
                  [{signal.severity}] {signal.kind} @ step {signal.step} — {signal.detail}
                </div>
              ))}
            </div>
          ))}
        <p className="hint">Spend is not metered on the plugin path (Phase 2b), so
        <code>spent</code> can legitimately read zero; <code>maxSteps</code> is the
        trustworthy ceiling.</p>
      </section>
      <section>
        <h2>Activity</h2>
        {snapshot.feed.length === 0
          ? <p className="empty">Nothing yet.</p>
          : [...snapshot.feed].reverse().map((entry, i) => (
            <div key={i} className="feed-item">
              <span className="t">{new Date(entry.t).toLocaleTimeString()}</span>
              <span className={`kind k-${entry.kind}`}>{entry.kind}</span>
              <span>{entry.text}</span>
            </div>
          ))}
      </section>
    </>
  )
}

function App(): React.ReactElement {
  const snapshot = useSnapshot()
  if (snapshot === null) return <p className="empty">Connecting…</p>
  return (
    <>
      <section>
        <h2>Pending approvals</h2>
        <ApprovalThread pending={snapshot.pending} />
      </section>
      <RunPanels snapshot={snapshot} />
    </>
  )
}

const root = document.getElementById('root')
if (root !== null) createRoot(root).render(<App />)
