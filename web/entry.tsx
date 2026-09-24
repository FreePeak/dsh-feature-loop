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
import type { BridgeOutcome } from '../src/approval-bridge.ts'
import { decideStart } from './start-target.ts'
import type { StartCandidate } from './start-target.ts'

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
      const answer = await svc.answer(id, outcome, feedback)
      if (!answer.ok) throw new Error(answer.error.message)
      if (!answer.value.settled) throw new Error('that approval was already settled')
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
      setNotice({ kind: 'ok', text: 'Saved. Values apply at the next reload of this plugin.' })
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

  return (
    <div className="fl-panel">
      {notice === null ? null : <div className="fl-notice" data-kind={notice.kind}>{notice.text}</div>}

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
   the session-scoped `conversation.input.dock`. `ISessions.list` carries no
   "current" either; selection belongs to shell navigation.

   So the target is resolved explicitly, never guessed silently: one live
   session is used and shown; several offer a picker; none disables the button
   and says why. The call itself is `sessionController.prompt` — the same
   first-class turn submission the composer uses — so the loop's policies apply
   because they hang off the agent loop's hooks, not off who typed the line. */
interface SessionSummary {
  id: string
  displayTitle: string
  blank: boolean
  running: boolean
  updatedAt: number
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

  const sessions = useMemo<StartCandidate[]>(() => {
    const svc = host.get('sessions') as SessionsService | undefined
    if (svc === undefined) return []
    const { ids, byId } = svc.list.getSnapshot()
    return ids.map(id => byId[id]).filter((s): s is StartCandidate => s !== undefined)
  }, [host, picked])

  // Every judgement — which session, whether a choice is required, why submit
  // is blocked — lives in `decideStart`, where it is unit-tested. This
  // component only renders and submits.
  const decision = decideStart(sessions, picked, task)
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
      // Name the run before submitting, so the dashboard's first frame already
      // says what this run is for instead of listing a raw agent id.
      const fl = host.get('remote.featureLoop') as FeatureLoopService | undefined
      try { await fl?.labelRun(target.id, task.trim()) } catch { /* naming is cosmetic; never block a run on it */ }
      const answer = await controller.prompt({
        // Client-minted, persisted on the accepted user message.
        requestId: globalThis.crypto.randomUUID(),
        sessionId: target.id,
        mode: 'queue',
        content: [{ type: 'text', text: task.trim() }],
      })
      if (!answer.ok) { setResult({ kind: 'error', text: answer.error.message }); return }
      setResult({ kind: 'ok', text: `Running in “${target.displayTitle}” — the composer has the transcript.` })
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
        <label className="fl-start-session">
          <span className="fl-start-sessionlabel">Session</span>
          <select value={target?.id ?? ''} onChange={ev => setPicked(ev.target.value)}>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.displayTitle}{s.running ? ' (running)' : ''}</option>)}
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
  inject: ['slots', 'locale', 'remote'],
  apply(ctx: Host) {
    // The designed shell's CSS travels with the bundle: one file, no second
    // origin to style from, and the page looks identical wherever it mounts.
    const style = document.createElement('style')
    style.dataset.plugin = '@freepeak/dsh-feature-loop'
    style.textContent = `${assistantShellCss}\n${dashboardCss}\n${pluginCss}`
    document.head.append(style)

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
