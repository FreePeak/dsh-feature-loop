/**
 * The Feature Loop client entry — the plugin's page inside the DSH UI.
 *
 * This is what `package.json`'s `./client` export ships, built by
 * `web/build.mjs`. It replaces the hand-written `client.js` that predated the
 * fold-in: the dashboard UI is no longer a separate page on its own origin,
 * it is the main-column view registered here, rendering the SAME components
 * that used to be served from loopback — assistant-ui thread, meters, badges,
 * workspace tree, activity feed — with the transport supplied by the host
 * remote instead of by this page's own HTTP server.
 *
 * Two views behind one sidebar entry:
 *   Dashboard  the designed approval/run surface (web/app.tsx, unchanged)
 *   Settings   judge, attention and gate configuration over the same remote
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import z from '@deepseek-ai/schemastery'
import { DashboardApp } from './app.tsx'
import type { DashboardSource } from './app.tsx'
import { APPROVAL_MODES, approvalModeFor } from '../src/approval-bridge.ts'

import { assertSettleAccepted } from '../src/approval-bridge.ts'
import type { ApprovalModeName, BridgeOutcome } from '../src/approval-bridge.ts'
import { decideStart, openedWorkspaceId } from './start-target.ts'
import type { SessionRow, StartWorkspace } from './start-target.ts'

import dashboardCss from '../assets/assistant-ui/dashboard.css'
import assistantShellCss from '../assets/assistant-ui/shell.css'
import pluginCss from './plugin.css'

/* The host-remote shapes the browser sees. Kept local: the client cannot
 * import the host module, and these are the only two it touches. */
type RemoteAnswer<T> = { ok: true, value: T } | { ok: false, error: { message: string } }
interface FeatureLoopService {
  status(): Promise<RemoteAnswer<{
    enabled: boolean
    config: Record<string, unknown>
    configPath: string
    judge: { kind: string, baseURL: string, model: string, reachable: boolean, detail: string }
    dashboardURL: string
    embedded: boolean
  }>>
  live(): Promise<RemoteAnswer<import('../src/dashboard.ts').DashboardSnapshot>>
  answer(id: string, outcome: string, feedback: string): Promise<RemoteAnswer<{ settled: boolean }>>
  labelRun(sessionId: string, task: string): Promise<RemoteAnswer<unknown>>
  save(settings: Record<string, unknown>): Promise<RemoteAnswer<Record<string, unknown>>>
}

/**
 * The host services this page reads, narrowed to the members it calls.
 *
 * `workspaces` is the Host-authoritative Workspace registry and `uiWorkspace`
 * the navigation facade over it. Both are the harness's own client services
 * (dsh-api-workspace-controller and the ui-workspace browser half), declared
 * here structurally because the client bundle cannot import host modules.
 */
interface WorkspacesService {
  list: { getSnapshot(): { items: readonly WorkspaceRow[] } }
}
interface UiWorkspaceService {
  /** Reuse-or-create the blank Session for a Workspace, and address it. */
  connectWorkspace(workspaceId: string): Promise<string>
}
interface WorkspaceRow {
  workspaceId: string
  path: string
  title: string
  sessionIds: readonly string[]
}

interface Host {
  get(name: string): unknown
  slots: { inject(name: string, fn: () => unknown): void; register(name: string, spec: Record<string, unknown>, Icon?: unknown): unknown }
  locale: { register(ns: string, dict: Record<string, Record<string, string>>): () => void }
  remote: { $mount(contribution: unknown): Promise<(dispose?: () => void) => void> }
  effect(fn: () => unknown, label: string): void
}

/** The page's data seam, backed by the host remote. */
function remoteSource(host: Host): DashboardSource {
  return {
    /**
     * Called when the Host says the state changed; re-reads rather than
     * carrying a payload. The event is empty on purpose, so the browser can
     * never render a snapshot that disagrees with the Host's own.
     */
    onChange(listener) {
      const remote = host.get('remote') as { $on?(event: string, fn: () => void): () => void } | undefined
      if (remote?.$on === undefined) return () => undefined
      return remote.$on('featureLoop/changed', listener)
    },
    async load() {
      const svc = host.get('remote.featureLoop')
      if (svc === undefined) throw new Error('feature-loop host remote is not mounted')
      const answer = await svc.live()
      if (!answer.ok) throw new Error(answer.error.message)
      return answer.value
    },
    async respond(id: string, outcome: BridgeOutcome, feedback: string) {
      const svc = host.get('remote.featureLoop')
      if (svc === undefined) throw new Error('feature-loop host remote is not mounted')
      // A settle that reports the ask was already resolved is NOT a failure:
      // the ask is closed either way, and rejecting here is what stranded the
      // card with live buttons. See assertSettleAccepted.
      assertSettleAccepted(await svc.answer(id, outcome, feedback))
    },
    // Added with `DashboardSource.status?()` in mind, and it is what makes the
    // `failed` brief state renderable at all on THIS surface: the page asks
    // whether `dashboard.brief.enabled` is set, and without this method the
    // answer is always "unknown", so a deployment that turned briefs on and
    // whose model call failed saw nothing. The remote has had `status()` since
    // the settings page shipped; `remoteSource` simply never forwarded it.
    async status() {
      const svc = host.get('remote.featureLoop')
      if (svc === undefined) throw new Error('feature-loop host remote is not mounted')
      const answer = await svc.status()
      if (!answer.ok) throw new Error(answer.error.message)
      return { config: answer.value.config }
    },
  }
}

function Icon({ size }: { size?: number }): React.ReactElement {
  const s = size ?? 16
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden>
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.5 1.8V5h-3.2" />
      <path d="M8 5.6v4.8" />
    </svg>
  )
}

type Status = Awaited<ReturnType<FeatureLoopService['status']>> extends { ok: true, value: infer V } ? V : never

function Field({ label, hint, children }: { label: string, hint?: string, children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <div className="fl-row">
        <label className="fl-label">{label}</label>
        {children}
      </div>
      {hint !== undefined ? <div className="fl-hint">{hint}</div> : null}
    </div>
  )
}

/** Approval postures, in the order the page lists them. */
const APPROVAL_MODE_NAMES = Object.keys(APPROVAL_MODES) as ApprovalModeName[]

function SettingsPanel({ host }: { host: Host }): React.ReactElement {
  const [status, setStatus] = useState<Status | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error', text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)

  const load = useCallback(async () => {
    try {
      const svc = host.get('remote.featureLoop')
      if (svc === undefined) { setNotice({ kind: 'error', text: 'feature-loop host remote is not mounted.' }); return }
      const answer = await svc.status()
      if (!answer.ok) { setNotice({ kind: 'error', text: `status: ${answer.error.message}` }); return }
      setStatus(answer.value)
      setDraft({
        judge: answer.value.judge.kind,
        judgeBaseURL: answer.value.judge.baseURL,
        systemOneModel: answer.value.judge.model,
        judgeThreshold: Number(answer.value.config.judgeThreshold ?? 2),
        reviewBudget: Number(answer.value.config.reviewBudget ?? 0.1),
        gateMode: String(answer.value.config.gateMode ?? 'ask'),
        gatePolicies: answer.value.config.gatePolicies as Record<string, unknown> | undefined,
        checkpointAtStep: Number(answer.value.config.checkpointAtStep ?? 0) || '',
      })
    } catch (error) {
      setNotice({ kind: 'error', text: `status failed: ${(error as Error).message}` })
    }
  }, [host])

  useEffect(() => { void load() }, [load])

  const save = useCallback(async () => {
    if (draft === null) return
    setBusy(true); setNotice(null)
    try {
      const svc = host.get('remote.featureLoop')
      if (svc === undefined) return
      const answer = await svc.save(draft)
      if (!answer.ok) { setNotice({ kind: 'error', text: `save: ${answer.error.message}` }); return }
      // Verified 2026-10-02: these values now reach the gate. The saved file is
      // applied OVER the profile patch row on the keys this page owns, so the
      // RUNNING gate changes at the next plugin load — which is a restart of the
      // harness, not a page reload, and the difference is worth naming: until
      // then the previous row is still what decides.
      //
      // The earlier notice said the file was display-only. It was true when
      // written, which is exactly why it was dangerous: it taught the operator
      // that saving here is a no-op, so nobody saved here.
      setNotice({
        kind: 'ok',
        text: 'Saved to config.yaml and applied over the profile patch row — this '
          + 'takes effect at the next plugin load (restart the harness to apply it).',
      })
      await load()
    } catch (error) {
      setNotice({ kind: 'error', text: `save failed: ${(error as Error).message}` })
    } finally { setBusy(false) }
  }, [draft, host, load])

  if (status === null || draft === null) {
    return <div className="fl-panel"><div className="fl-empty">{notice?.text ?? 'Loading feature loop status…'}</div></div>
  }
  const set = (key: string, value: unknown): void => setDraft(prev => ({ ...prev, [key]: value }))
  const judgeDisabled = draft.judge !== 'laya'
  // An absent map is the shipped default, which is the safe posture — so an
  // unset profile reads as "review at risky steps" rather than as nothing.
  const approvalMode = approvalModeFor(draft.gatePolicies as never)

  return (
    <div className="fl-panel">
      {notice === null ? null : <div className="fl-notice" data-kind={notice.kind}>{notice.text}</div>}

      {/*
        Stated before the fields, not in a dialog, because it names WHERE the
        decision comes from — and that sentence was the opposite of the truth
        for its first three weeks. It said "stored, not applied", accurately:
        `apply()` read the patch row and nothing else. An honest warning about
        an unimplemented feature is still shipping the feature, and worse, it
        teaches the operator the page is a mock.
      */}
      <div className="fl-notice" data-kind="info" role="note">
        These fields are <strong>applied over your profile&rsquo;s</strong>{' '}
        <code>cordis.patch.yml</code> row, so this file wins wherever the two
        disagree. They take effect at the next <strong>plugin load</strong> —
        restart the harness to apply them, since the running gate was built when
        it booted. The Status section below shows what is stored.
      </div>

      <div className="fl-section">
        <h3 className="fl-section-title">Status</h3>
        <div className="fl-row">
          <span className="fl-label">Policies</span>
          <span className="fl-badge" data-ok={status.enabled}>
            <span className="fl-dot" />
            {status.enabled ? 'on — spec configured' : 'off — no spec, detectors inactive'}
          </span>
        </div>
        <div className="fl-row">
          <span className="fl-label">Judge</span>
          <span className="fl-badge" data-ok={status.judge.kind === 'none' ? undefined : status.judge.reachable}>
            <span className="fl-dot" />
            {status.judge.kind}{status.judge.kind === 'laya' ? ` · ${status.judge.model} @ ${status.judge.baseURL}` : ''}
          </span>
        </div>
        {status.judge.detail === '' ? null : <pre className="fl-pre">{status.judge.detail}</pre>}
        <div className="fl-row">
          <span className="fl-label">Standalone page</span>
          {status.dashboardURL === ''
            ? <span className="fl-hint" style={{ margin: 0 }}>off — this page is the dashboard; set <code>dashboard.standalone: true</code> to also serve it on loopback</span>
            : <a className="fl-link" href={status.dashboardURL} target="_blank" rel="noreferrer">{status.dashboardURL}</a>}
        </div>
        <div className="fl-row">
          <span className="fl-label">Settings file</span>
          <code className="fl-pre" style={{ flex: 1 }}>{status.configPath}</code>
        </div>
      </div>

      <div className="fl-section">
        <h3 className="fl-section-title">Judge</h3>
        <Field label="Kind" hint="laya is local, free and needs no key. chat is metered and needs a gateway key. none leaves the detectors alone.">
          <select value={String(draft.judge)} onChange={ev => set('judge', ev.target.value)}>
            <option value="laya">laya — local System One</option>
            <option value="none">none — detectors only</option>
            <option value="chat">chat — metered model</option>
          </select>
        </Field>
        <Field label="Base URL" hint="Same wire for Laya, Jev and TypeSafe — swapping providers changes only this URL and the model alias.">
          <input type="text" value={String(draft.judgeBaseURL)} disabled={judgeDisabled} onChange={ev => set('judgeBaseURL', ev.target.value)} />
        </Field>
        <Field label="Model alias">
          <input type="text" value={String(draft.systemOneModel)} disabled={judgeDisabled} onChange={ev => set('systemOneModel', ev.target.value)} />
        </Field>
        <Field label="Threshold" hint="Score (0–3) that earns a human look. Laya scores ~0.5–1.4 in practice, so a value at or above 2 means the advisor never fires on its own.">
          <input type="number" step="0.1" min="0" max="3" value={Number(draft.judgeThreshold)} onChange={ev => set('judgeThreshold', Number(ev.target.value))} />
        </Field>
      </div>

      <div className="fl-section">
        <h3 className="fl-section-title">Attention</h3>
        <Field label="Review budget" hint="Fraction of steps a human may be asked about, in (0, 1].">
          <input type="number" step="0.05" min="0.01" max="1" value={Number(draft.reviewBudget)} onChange={ev => set('reviewBudget', Number(ev.target.value))} />
        </Field>
        <Field label="Gate mode" hint="ask prompts you in the composer and here. deny refuses outright — for unattended and CI runs.">
          <select value={String(draft.gateMode)} onChange={ev => set('gateMode', ev.target.value)}>
            <option value="ask">ask — prompt a human</option>
            <option value="deny">deny — refuse, never prompt</option>
          </select>
        </Field>
      </div>

      <div className="fl-section">
        <h3 className="fl-section-title">Approval</h3>
        <Field
          label="When to stop and ask"
          hint={APPROVAL_MODES[approvalMode].detail}
        >
          <select
            value={approvalMode}
            onChange={ev => {
              const mode = ev.target.value as ApprovalModeName
              set('gatePolicies', { ...APPROVAL_MODES[mode].policies })
            }}
          >
            {APPROVAL_MODE_NAMES.map(name => (
              <option key={name} value={name}>{APPROVAL_MODES[name].label}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Review checkpoint at step"
          hint="The run pauses once at this step and waits for you — the 'built and tested, now look at it' moment. Approve to let it continue. Empty disables it."
        >
          <input
            type="number"
            min="1"
            value={String(draft.checkpointAtStep ?? '')}
            placeholder="none"
            onChange={ev => {
              const raw = ev.target.value
              set('checkpointAtStep', raw === '' ? undefined : Number(raw))
            }}
          />
        </Field>
      </div>

      <div className="fl-actions">
        <button type="button" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" data-kind="ghost" disabled={busy} onClick={() => void load()}>Reload</button>
      </div>
    </div>
  )
}

function FeatureLoopPage({ host }: { host: Host }): React.ReactElement {
  const [tab, setTab] = useState<'dashboard' | 'settings'>('dashboard')
  const source = useMemo(() => remoteSource(host), [host])
  return (
    <div className="fl-page">
      <StartLoop host={host} />
      <div className="fl-pagehead">
        <div className="fl-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'dashboard'} data-active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button type="button" role="tab" aria-selected={tab === 'settings'} data-active={tab === 'settings'} onClick={() => setTab('settings')}>Settings</button>
        </div>
      </div>
      {tab === 'dashboard'
        ? <div className="fl-dashboard"><DashboardApp source={source} /></div>
        : <SettingsPanel host={host} />}
    </div>
  )
}

/* ── start a loop ────────────────────────────────────────────────────────────
   The page is a main-column slot, and the slot catalog is explicit that a
   non-`conversation` key receives NO session binding ("slotInject: ''"), so
   there is no sessionId to borrow — `ui-goal` has one only because it lives in
   the session-scoped `conversation.input.dock`.

   So the target is a WORKSPACE, and it is the one the user already has open.
   A Workspace is a directory, and the directory is what a loop writes into, so
   it is the only target worth showing: the previous session picker asked people
   to choose between transcripts to decide which checkout got edited, listed
   every session in every project, and fell back to the most recently touched
   one — routinely the wrong repository.

   Resolution is the host's own, not ours: `uiWorkspace.connectWorkspace`
   reuses that workspace's blank session or creates one, and hands back a
   session id to prompt. The turn then goes through `sessionController.prompt`
   — the same first-class submission the composer uses — so the loop's policies
   apply because they hang off the agent loop's hooks, not off who typed it. */
interface SessionSummary {
  id: string
  readonly retainedBy: Readonly<Record<string, number | undefined>>
}
interface SessionsService {
  list: { getSnapshot(): { ids: readonly string[], byId: Record<string, SessionSummary> } }
}
interface SessionControllerService {
  prompt(request: {
    requestId: string
    sessionId: string
    mode: 'queue' | 'steer'
    content: readonly { type: 'text', text: string }[]
  }): Promise<{ ok: true, value: unknown } | { ok: false, error: { message: string } }>
}

interface StartResult { kind: 'ok' | 'error', text: string }

function StartLoop({ host }: { host: Host }): React.ReactElement {
  const [task, setTask] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<StartResult | null>(null)
  const [picked, setPicked] = useState<string | undefined>(undefined)

  // Re-read on every render: both stores are plain snapshots with no React
  // subscription here, and a stale one would name a workspace that has since
  // been closed. Cheap, and it cannot go stale mid-session.
  const { workspaces, opened } = useMemo(() => {
    const wsSvc = host.get('workspaces') as WorkspacesService | undefined
    const rows = wsSvc?.list.getSnapshot().items ?? []
    const spaces: StartWorkspace[] = rows.map(w => ({
      id: w.workspaceId, title: w.title, path: w.path, sessionIds: w.sessionIds,
    }))
    const sessSvc = host.get('sessions') as SessionsService | undefined
    const { ids, byId } = sessSvc?.list.getSnapshot() ?? { ids: [], byId: {} }
    const rowsIn: SessionRow[] = ids.map(id => byId[id]).filter((s): s is SessionRow => s !== undefined)
    return { workspaces: spaces, opened: openedWorkspaceId(spaces, rowsIn) }
  }, [host, picked])

  // Every judgement — which workspace, whether a choice is required, why submit
  // is blocked — lives in `decideStart`, where it is unit-tested. This
  // component only renders and submits.
  const decision = decideStart(workspaces, opened, picked, task)
  const { target, ambiguous, note, blocked } = decision
  const disabled = busy || blocked !== undefined

  const start = useCallback(async () => {
    if (target === undefined || task.trim() === '') return
    setBusy(true)
    setResult(null)
    try {
      // The remote's NAMESPACE is `session` (its service is `sessionController`) —
      // see the typert descriptor in @deepseek-ai/dsh-session-controller/remote.
      const controller = host.get('remote.session') as SessionControllerService | undefined
      if (controller === undefined) { setResult({ kind: 'error', text: 'the session controller is not available' }); return }
      const nav = host.get('uiWorkspace') as UiWorkspaceService | undefined
      if (nav === undefined) { setResult({ kind: 'error', text: 'the workspace controller is not available' }); return }
      // The host resolves workspace → session (reuse the blank one, else create
      // it), so the page never has to guess which inbox belongs to this project.
      const sessionId = await nav.connectWorkspace(target.id)
      // Name the run before submitting, so the dashboard's first frame already
      // says what this run is for instead of listing a raw agent id.
      const fl = host.get('remote.featureLoop') as FeatureLoopService | undefined
      try { await fl?.labelRun(sessionId, task.trim()) } catch { /* naming is cosmetic; never block a run on it */ }
      const answer = await controller.prompt({
        // Client-minted, persisted on the accepted user message.
        requestId: globalThis.crypto.randomUUID(),
        sessionId,
        mode: 'queue',
        content: [{ type: 'text', text: task.trim() }],
      })
      if (!answer.ok) { setResult({ kind: 'error', text: answer.error.message }); return }
      setResult({ kind: 'ok', text: `Running in “${target.title}” — the composer has the transcript.` })
      setTask('')
    } catch (error) {
      setResult({ kind: 'error', text: (error as Error).message })
    } finally { setBusy(false) }
  }, [host, target, task])

  return (
    <div className="fl-start">
      <div className="fl-start-head">
        <h2 className="fl-title">Start a loop</h2>
        <p className="fl-sub">
          Describe the task. It runs as a normal turn, so the step and cost ceilings,
          the detectors and the review gate all apply — and approvals arrive on this page.
        </p>
      </div>

      {ambiguous ? (
        <label className="fl-start-workspace">
          <span className="fl-start-wspacelabel">Workspace</span>
          <select value={target?.id ?? ''} onChange={ev => setPicked(ev.target.value)}>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.title === '' ? w.path : `${w.title} — ${w.path}`}</option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="fl-start-row">
        <input
          className="fl-start-input"
          type="text"
          value={task}
          placeholder="e.g. fix the failing test in test/budget.test.ts"
          aria-label="Task to run through the feature loop"
          onChange={ev => setTask(ev.target.value)}
          onKeyDown={ev => {
            if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); void start() }
          }}
        />
        <button type="button" className="fl-start-button" disabled={disabled} onClick={() => void start()}>
          {busy ? 'Starting…' : 'Start loop'}
        </button>
      </div>

      <p className="fl-start-note">{note}</p>

      {result === null ? null : (
        <p className="fl-start-result" data-kind={result.kind} role="status">{result.text}</p>
      )}
    </div>
  )
}

/* ── the host-remote contract, hand-authored like the harness's own client bundles ── */
/*
 * Codecs, and the choice is load-bearing in both directions.
 *
 * RESULT → `src-json`. The protocol has a mode for ordinary JSON, and it passes
 * the subtree through untouched. The previous hand-authored codecs used
 * `mode: 'strict'` with a no-op `create`, which the gateway treats as a real
 * schema — so it PROJECTED the result and silently dropped fields it could not
 * account for. Symptom: every feed line rendered "Invalid Date", because the
 * timestamp never survived the boundary.
 *
 * PARAMETER → `strict` with a real schema. `src-json` is rejected here
 * ("field … has no strict codec"), so each parameter gets a schema for exactly
 * what this client sends: strings are `z.string()`, and the settings bag is
 * `z.any()` because its keys are the plugin's own and change with its settings
 * form. Schemas are memoized the way the generated remotes do, so the shape is
 * built once per boundary rather than per call.
 */
let _stringSchema: { parse(v: unknown): unknown } | undefined
const stringSchema = (): { parse(v: unknown): unknown } => (_stringSchema ??= z.string())
let _anySchema: { parse(v: unknown): unknown } | undefined
const anySchema = (): { parse(v: unknown): unknown } => (_anySchema ??= z.any())

const stringParam = (name: string, typeSymbol: string): Record<string, unknown> => ({
  name,
  wire: name,
  source: 'json',
  codec: { mode: 'strict', typeSymbol, create: stringSchema },
})
const anyParam = (name: string, typeSymbol: string): Record<string, unknown> => ({
  name,
  wire: name,
  source: 'json',
  codec: { mode: 'strict', typeSymbol, create: anySchema },
})
const jsonResult: Record<string, unknown> = { mode: 'src-json' }

const TYPERT_REMOTE = {
  package: '@freepeak/dsh-feature-loop',
  descriptors: [
    { id: '@freepeak/dsh-feature-loop#featureLoop/status', service: 'featureLoop', namespace: 'featureLoop', method: 'status', invocation: { kind: 'direct' }, parameters: [], result: jsonResult },
    { id: '@freepeak/dsh-feature-loop#featureLoop/live', service: 'featureLoop', namespace: 'featureLoop', method: 'live', invocation: { kind: 'direct' }, parameters: [], result: jsonResult },
    { id: '@freepeak/dsh-feature-loop#featureLoop/answer', service: 'featureLoop', namespace: 'featureLoop', method: 'answer', invocation: { kind: 'direct' }, parameters: [stringParam('id', 'string'), stringParam('outcome', 'string'), stringParam('feedback', 'string')], result: jsonResult },
    { id: '@freepeak/dsh-feature-loop#featureLoop/save', service: 'featureLoop', namespace: 'featureLoop', method: 'save', invocation: { kind: 'direct' }, parameters: [anyParam('settings', 'object')], result: jsonResult },
    { id: '@freepeak/dsh-feature-loop#featureLoop/labelRun', service: 'featureLoop', namespace: 'featureLoop', method: 'labelRun', invocation: { kind: 'direct' }, parameters: [stringParam('sessionId', 'string'), stringParam('task', 'string')], result: jsonResult },
  ],
}

export default {
  // `workspaces` and `uiWorkspace` are the harness's own client services: the
  // Workspace registry and the navigation facade that maps a workspace to a
  // session. Injected (not merely read) so the page is never mounted before
  // they exist — a start submission with no workspace controller is a dead
  // control, and a dead control is the bug this replaced.
  inject: ['slots', 'locale', 'remote', 'workspaces', 'uiWorkspace'],
  apply(ctx: Host) {
    // The designed shell's CSS travels with the bundle: one file, no second
    // origin to style from, and the page looks identical wherever it mounts.
    //
    // Owned by an effect, not by `apply` directly, so the tag lives exactly as
    // long as the plugin does. Appending it here leaked one copy per reload: a
    // profile with `patchReload: live` re-applies this plugin on every change,
    // and a stylesheet nobody removes stacks up in the host's <head>, each copy
    // fighting the last. Same ownership the host's own theme sheets use
    // (`ui-theme/src/client/styles.ts`).
    ctx.effect(() => {
      const style = document.createElement('style')
      style.dataset.plugin = '@freepeak/dsh-feature-loop'
      style.dataset.pluginCss = '@freepeak/dsh-feature-loop/dashboard'
      style.textContent = `${assistantShellCss}\n${dashboardCss}\n${pluginCss}`
      document.head.append(style)
      return () => { style.remove() }
    }, 'dsh-feature-loop: dashboard stylesheet')

    ctx.effect(() => ctx.locale.register('featureLoop', {
      zh: { 'featureLoop.panel': 'Feature Loop' },
      en: { 'featureLoop.panel': 'Feature Loop' },
    }), 'dsh-feature-loop: dictionaries')

    const ready = ctx.remote.$mount(TYPERT_REMOTE)
      .then(dispose => dispose)
      .catch((error: unknown) => {
        console.error('dsh-feature-loop: remote mount failed', error)
        return undefined
      })

    window.__dshFeatureLoop = Object.freeze({
      ready,
      call: (namespace: string, method: string, ...args: unknown[]) => {
        const service = ctx.get(`remote.${namespace}`)
        if (service === undefined) throw new Error(`remote.${namespace}.${method} not available`)
        return (service as unknown as Record<string, (...a: unknown[]) => unknown>)[method]?.(...args)
      },
    })

    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
      name: 'sidebar.panellist', id: 'feature-loop', order: 11, label: 'Feature Loop', locale: 'featureLoop',
    }, Icon))

    ctx.slots.inject('main', () => ctx.slots.register({
      name: 'main', key: 'feature-loop', locale: 'featureLoop',
    }, () => <FeatureLoopPage host={ctx} />))

    return () => { void ready.then(dispose => dispose?.()).catch(() => {}) }
  },
}
