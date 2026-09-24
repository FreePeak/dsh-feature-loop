/**
 * The Feature Loop sidebar entry + main panel — this bundle's `./client` export.
 *
 * Served through the `dsh.client` contract and loaded with the published
 * registration protocol (hand-authored like apps/web's fixture-live-client:
 * external bundles ship a browser file directly, since the harness's tsdown
 * client preset only builds in-repo packages).
 *
 * Host state flows over `ctx.remote.featureLoop.*` (src/remote.ts): `status()`
 * drives the whole panel, `save()` persists the settings form.
 *
 * **What this page is for.** The policies run on the harness's own agent loop,
 * so there is no separate "start a run" button: you type in the normal composer
 * and the loop is bounded and gated around you. This page exists to answer the
 * two questions that flow raises — *is it actually on?* and *why did (or didn't)
 * it ask me?* — and to make the judge, budget and gate settings reachable
 * without hand-editing YAML.
 */
window.__ModuleLoader__.load({
  id: '@freepeak/dsh-feature-loop',
  factory(require) {
    const React = require('react')
    const e = React.createElement
    const { useState, useEffect, useCallback } = React

    const NS = 'featureLoop'
    const PANEL_ID = 'feature-loop'

    const style = document.createElement('style')
    style.dataset.plugin = '@freepeak/dsh-feature-loop'
    style.textContent = `
      [data-fl-panel] { display: flex; flex-direction: column; height: 100%; overflow-y: auto; background: var(--color-bg, #101114); color: var(--color-fg, #e6e6e6); font-size: 13px; }
      [data-fl-head] { padding: 16px 18px 10px; border-bottom: 1px solid #26272b; }
      [data-fl-title] { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
      [data-fl-sub] { color: #9a9aa0; line-height: 1.5; margin: 0; }
      [data-fl-section] { padding: 14px 18px; border-bottom: 1px solid #1d1e22; }
      [data-fl-section-title] { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #9a9aa0; margin: 0 0 10px; }
      [data-fl-row] { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
      [data-fl-label] { flex: 0 0 150px; color: #b9b9c0; }
      [data-fl-row] input[type="text"], [data-fl-row] input[type="number"], [data-fl-row] select {
        flex: 1; min-width: 0; background: #17181c; color: inherit; border: 1px solid #2f3035;
        border-radius: 7px; padding: 6px 9px; font: inherit;
      }
      [data-fl-row] input:disabled, [data-fl-row] select:disabled { opacity: 0.5; }
      [data-fl-hint] { color: #7e7e87; font-size: 11.5px; line-height: 1.5; margin: -4px 0 10px 160px; }
      [data-fl-badge] { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; border-radius: 6px; padding: 3px 9px; border: 1px solid #2f3d5c; background: #1b2333; color: #cfe1ff; }
      [data-fl-badge][data-ok="true"] { border-color: #2c5c3a; background: #16281b; color: #a9e5bb; }
      [data-fl-badge][data-ok="false"] { border-color: #5c2b2b; background: #3a1d1d; color: #ffb4b4; }
      [data-fl-dot] { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
      [data-fl-actions] { display: flex; align-items: center; gap: 10px; padding: 14px 18px; }
      [data-fl-actions] button { border: 1px solid #2f3035; background: #2a3550; color: #cfe1ff; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 600; font: inherit; }
      [data-fl-actions] button:disabled { opacity: 0.5; cursor: not-allowed; }
      [data-fl-actions] button[data-kind="ghost"] { background: transparent; color: inherit; font-weight: 400; }
      [data-fl-notice] { padding: 9px 18px; font-size: 12px; }
      [data-fl-notice][data-kind="error"] { background: #3a1d1d; color: #ffb4b4; }
      [data-fl-notice][data-kind="ok"] { background: #16281b; color: #a9e5bb; }
      [data-fl-pre] { background: #17181c; border: 1px solid #26272b; border-radius: 7px; padding: 9px 11px; font-family: ui-monospace, monospace; font-size: 11.5px; white-space: pre-wrap; word-break: break-all; color: #b9b9c0; margin: 0; }
      [data-fl-empty] { color: #9a9aa0; margin: auto; text-align: center; padding: 30px; }
      [data-fl-link] { color: #7fb0ff; text-decoration: none; word-break: break-all; }
    `
    document.head.append(style)

    /** Sidebar glyph: a bounded loop — a ring with a gate. */
    function FeatureLoopIcon({ size }) {
      const s = size ?? 16
      return e('svg', {
        width: s, height: s, viewBox: '0 0 16 16', 'data-fl-icon': '', fill: 'none',
        stroke: 'currentColor', 'stroke-width': 1.5, 'stroke-linecap': 'round',
      },
        e('path', { d: 'M13.5 8a5.5 5.5 0 1 1-1.6-3.9' }),
        e('path', { d: 'M13.5 1.8V5h-3.2' }),
        e('path', { d: 'M8 5.6v4.8' }))
      }

    /** One labelled field row. */
    function Row({ label, hint, children }) {
      return e('div', null,
        e('div', { 'data-fl-row': '' },
          e('label', { 'data-fl-label': '' }, label),
          children),
        hint === undefined ? null : e('div', { 'data-fl-hint': '' }, hint))
    }

    /** A status pill. `ok` undefined renders the neutral checking state. */
    function Badge({ ok, children }) {
      return e('span', { 'data-fl-badge': '', ...ok === undefined ? {} : { 'data-ok': String(ok) } },
        e('span', { 'data-fl-dot': '' }), children)
    }

    /** The main panel: status, then the settings form. */
    function FeatureLoopPanel({ host }) {
      const [status, setStatus] = useState(null)
      const [notice, setNotice] = useState(null)
      const [busy, setBusy] = useState(false)
      const [draft, setDraft] = useState(null)

      const load = useCallback(async () => {
        try {
          const svc = host.get('remote.featureLoop')
          if (svc === undefined) {
            setNotice({ kind: 'error', text: 'feature-loop host remote is not mounted.' })
            return
          }
          const answer = await svc.status()
          if (!answer.ok) {
            setNotice({ kind: 'error', text: `status: ${answer.error.message}` })
            return
          }
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
          setNotice({ kind: 'error', text: `status failed: ${error.message}` })
        }
      }, [host])

      useEffect(() => { void load() }, [load])

      const save = useCallback(async () => {
        if (draft === null) return
        setBusy(true)
        setNotice(null)
        try {
          const svc = host.get('remote.featureLoop')
          const answer = await svc.save(draft)
          if (!answer.ok) {
            setNotice({ kind: 'error', text: `save: ${answer.error.message}` })
            return
          }
          setNotice({ kind: 'ok', text: 'Saved. The new values apply at the next reload of this plugin.' })
          await load()
        } catch (error) {
          setNotice({ kind: 'error', text: `save failed: ${error.message}` })
        } finally {
          setBusy(false)
        }
      }, [draft, host, load])

      if (status === null) {
        return e('div', { 'data-fl-panel': '' },
          e('div', { 'data-fl-empty': '' }, notice?.text ?? 'Loading feature loop status…'))
      }

      const set = (key, value) => setDraft(prev => ({ ...prev, [key]: value }))
      const judgeDisabled = draft.judge !== 'laya'

      return e('div', { 'data-fl-panel': '' },
        e('div', { 'data-fl-head': '' },
          e('h2', { 'data-fl-title': '' }, 'Feature Loop'),
          e('p', { 'data-fl-sub': '' },
            'The loop policies run on the harness’s own agent loop. Type your request in the normal composer — '
            + 'cost ceilings, the detectors, the review gate and the dashboard apply to it automatically.')),
        notice === null ? null : e('div', { 'data-fl-notice': '', 'data-kind': notice.kind }, notice.text),

        // ── status ────────────────────────────────────────────────────────
        e('div', { 'data-fl-section': '' },
          e('h3', { 'data-fl-section-title': '' }, 'Status'),
          e('div', { 'data-fl-row': '' },
            e('span', { 'data-fl-label': '' }, 'Policies'),
            e(Badge, { ok: status.enabled },
              status.enabled ? 'on — spec configured' : 'off — no spec, detectors inactive')),
          e('div', { 'data-fl-row': '' },
            e('span', { 'data-fl-label': '' }, 'Judge'),
            e(Badge, { ok: status.judge.kind === 'none' ? undefined : status.judge.reachable },
              `${status.judge.kind}${status.judge.kind === 'laya' ? ` · ${status.judge.model} @ ${status.judge.baseURL}` : ''}`)),
          status.judge.detail === '' ? null : e('pre', { 'data-fl-pre': '' }, status.judge.detail),
          e('div', { 'data-fl-row': '', style: { marginTop: '10px' } },
            e('span', { 'data-fl-label': '' }, 'Dashboard'),
            status.dashboardURL === ''
              ? e('span', { 'data-fl-hint': '', style: { margin: 0 } },
                  'not reported — its URL is printed as “feature-loop dashboard:” in the host log')
              : e('a', { 'data-fl-link': '', href: status.dashboardURL, target: '_blank', rel: 'noreferrer' }, status.dashboardURL)),
          e('div', { 'data-fl-row': '' },
            e('span', { 'data-fl-label': '' }, 'Settings file'),
            e('code', { 'data-fl-pre': '', style: { flex: 1 } }, status.configPath))),

        // ── judge ─────────────────────────────────────────────────────────
        e('div', { 'data-fl-section': '' },
          e('h3', { 'data-fl-section-title': '' }, 'Judge'),
          e(Row, { label: 'Kind', hint: 'laya is local, free and needs no key. chat is metered and needs a gateway key. none leaves the detectors alone.' },
            e('select', { value: draft.judge, onChange: ev => set('judge', ev.target.value) },
              e('option', { value: 'laya' }, 'laya — local System One'),
              e('option', { value: 'none' }, 'none — detectors only'),
              e('option', { value: 'chat' }, 'chat — metered model'))),
          e(Row, { label: 'Base URL', hint: 'Same wire for Laya, Jev and TypeSafe — swapping providers changes only this URL and the model alias.' },
            e('input', {
              type: 'text', value: draft.judgeBaseURL, disabled: judgeDisabled,
              onChange: ev => set('judgeBaseURL', ev.target.value),
            })),
          e(Row, { label: 'Model alias' },
            e('input', {
              type: 'text', value: draft.systemOneModel, disabled: judgeDisabled,
              onChange: ev => set('systemOneModel', ev.target.value),
            })),
          e(Row, { label: 'Threshold', hint: 'Score (0–3) that earns a human look. Laya scores ~0.5–1.4 in practice, so values at or above 2 mean the advisor never fires on its own and only the detectors raise reviews.' },
            e('input', {
              type: 'number', step: '0.1', min: '0', max: '3', value: draft.judgeThreshold,
              onChange: ev => set('judgeThreshold', Number(ev.target.value)),
            }))),

        // ── attention ─────────────────────────────────────────────────────
        e('div', { 'data-fl-section': '' },
          e('h3', { 'data-fl-section-title': '' }, 'Attention'),
          e(Row, { label: 'Review budget', hint: 'Fraction of steps a human may be asked about, in (0, 1].' },
            e('input', {
              type: 'number', step: '0.05', min: '0.01', max: '1', value: draft.reviewBudget,
              onChange: ev => set('reviewBudget', Number(ev.target.value)),
            })),
          e(Row, { label: 'Gate mode', hint: 'ask prompts you in the composer and on the dashboard. deny refuses outright — for unattended and CI runs.' },
            e('select', { value: draft.gateMode, onChange: ev => set('gateMode', ev.target.value) },
              e('option', { value: 'ask' }, 'ask — prompt a human'),
              e('option', { value: 'deny' }, 'deny — refuse, never prompt')))),

        e('div', { 'data-fl-actions': '' },
          e('button', { type: 'button', disabled: busy, onClick: () => void save() }, busy ? 'Saving…' : 'Save'),
          e('button', { type: 'button', 'data-kind': 'ghost', disabled: busy, onClick: () => void load() }, 'Reload')))
    }

    /**
     * This package's Host-Remote contribution (the form the typert generator
     * emits as `./remote` — external bundles hand-author it). The harness's own
     * remotes assembly doesn't know external packages, so the page mounts its
     * own. `codec.create().parse()` is the only schema call the gateway makes,
     * so identity parses are full-fidelity for JSON-source parameters.
     */
    const identity = () => ({ parse: value => value })
    const jsonCodec = typeSymbol => ({ mode: 'strict', typeSymbol, create: identity })
    const param = (name, typeSymbol) => ({ name, wire: name, source: 'json', codec: jsonCodec(typeSymbol) })
    const result = typeSymbol => jsonCodec(typeSymbol)
    const TYPERT_REMOTE = {
      package: '@freepeak/dsh-feature-loop',
      descriptors: [
        {
          id: '@freepeak/dsh-feature-loop#featureLoop/status',
          service: 'featureLoop', namespace: 'featureLoop', method: 'status',
          invocation: { kind: 'direct' },
          parameters: [],
          result: result('@freepeak/dsh-feature-loop#FeatureLoopStatus'),
        },
        {
          id: '@freepeak/dsh-feature-loop#featureLoop/save',
          service: 'featureLoop', namespace: 'featureLoop', method: 'save',
          invocation: { kind: 'direct' },
          parameters: [param('settings', '@freepeak/dsh-feature-loop#FeatureLoopSettings')],
          result: result('object'),
        },
      ],
    }

    return {
      // 'remote.featureLoop' is NOT injected: this bundle mounts the
      // contribution itself in apply, so waiting for the namespace before apply
      // would deadlock.
      inject: ['slots', 'locale', 'remote'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, {
          zh: { 'featureLoop.panel': 'Feature Loop' },
          en: { 'featureLoop.panel': 'Feature Loop' },
        }), 'dsh-feature-loop: dictionaries')
        // Mount this package's Host-Remote contribution. Reads go through
        // ctx.get — direct property access throws "without inject" by design.
        const ready = ctx.remote.$mount(TYPERT_REMOTE)
          .then(dispose => dispose)
          .catch(error => { console.error('dsh-feature-loop: remote mount failed', error); return undefined })
        // Console/debug hook: call any mounted remote namespace from devtools.
        window.__dshFeatureLoop = Object.freeze({
          ready,
          call: (namespace, method, ...args) => {
            const service = ctx.get(`remote.${namespace}`)
            if (service === undefined || typeof service[method] !== 'function') {
              throw new Error(`remote.${namespace}.${method} not available`)
            }
            return service[method](...args)
          },
        })
        // Sidebar entry: the sidebar owns the button; `id` selects this panel.
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 11,
          label: 'Feature Loop',
          locale: NS,
        }, FeatureLoopIcon))
        // The main-column page itself.
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, () => e(FeatureLoopPanel, { host: ctx })))
        // Unmount this package's namespaces with the fiber.
        return () => { void ready.then(dispose => dispose?.()).catch(() => {}) }
      },
    }
  },
})
