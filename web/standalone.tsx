/**
 * The standalone page's entry — the opt-in loopback surface
 * (`dashboard.standalone: true`), as a SECOND build target beside
 * `web/entry.tsx`.
 *
 * Why this file exists. Commit `633c1e2` folded the dashboard into the DSH UI:
 * the transport moved out of `web/app.tsx` into a host-only entry, and
 * `web/build.mjs` was repointed at `web/entry.tsx` with its `outfile` line
 * dropped. The fold kept `assets/assistant-ui/dashboard.js` in the tree because
 * the standalone opt-in was meant to keep working — but nothing could build it
 * any more, and the committed artefact stayed frozen at the last commit that
 * still generated it (`3973e3a`, 2026-09-23). Measured on that artefact: it
 * mounts and renders the thread and the run list, and has carried NO metrics
 * pane and NO proposals pane ever since, on a loopback page whose whole purpose
 * is watching a run without the harness UI.
 *
 * The seam is already right for this. `DashboardApp` takes a `DashboardSource`
 * and knows nothing about transports; `web/entry.tsx` supplies the Host-remote
 * one. So this entry supplies the loopback one, over the three endpoints the
 * standalone server already serves, and nothing else changes:
 *
 *   GET  /api/events            SSE, one `data: <snapshot>` frame per change
 *   POST /api/approvals/:id     the decision, plus optional free-text feedback
 *   the shell inlines           `__FL_DASHBOARD_SNAPSHOT__` for the first paint
 *
 * Deliberately NOT implemented: `status()`. `useBriefsEnabled` treats an absent
 * `status` as UNKNOWN and keeps the old behaviour — render a failed brief as a
 * line rather than hide it — which is the right default for a loopback server
 * that exposes no config endpoint. Adding one would mean inventing a config
 * route for one boolean.
 *
 * React is EXTERNAL here exactly as in the host entry: this page runs in a
 * browser with no other React, so it bundles its own — the opposite of the
 * in-UI case, where a second reconciler inside the harness's tree does not
 * render reliably. `web/build.mjs` passes the externals per target for exactly
 * this reason, so "no externals" is stated here and not inferred.
 *
 * ponytail: 60 lines, no new transport abstraction, no shared-source file. The
 * upgrade path is a `DashboardSource` factory both entries call once the host
 * remote has a shape worth mirroring; ponytail today is that a third surface
 * would copy this block again, and two is the point where that starts costing.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { DashboardApp } from './app.tsx'
import type { DashboardSource } from './app.tsx'
import { assertSettleAccepted } from '../src/approval-bridge.ts'
import type { BridgeOutcome } from '../src/approval-bridge.ts'
import type { DashboardSnapshot } from '../src/dashboard.ts'

/**
 * The loopback token, stashed by the page shell before this script loads.
 *
 * Same key the shell writes (`src/dashboard-page.ts`), read the same way the
 * host entry reads its Host remote: the query string first, the stashed value
 * as the fallback so a reload does not lose it.
 */
function token(): string {
  const q = new URLSearchParams(window.location.search).get('token')
  if (q !== null && q !== '') return q
  return window.__FL_DASHBOARD_TOKEN__ ?? ''
}

/** Reject rather than throw, so a card can report a refused decision. */
async function read(res: Promise<Response>, what: string): Promise<unknown> {
  const r = await res
  if (!r.ok) throw new Error(`standalone dashboard: ${what} refused HTTP ${String(r.status)}`)
  return await r.json()
}

/**
 * The loopback `DashboardSource`.
 *
 * Push-first: the SSE stream is the transport, and `/api/state` is only the
 * 30s safety net for a dropped frame. Polling alone would also work — the
 * server treats a state poll as a watcher — but it would make this tab claim
 * asks only while a poll was in flight, which is the §1be defect class on a
 * different surface. Holding the stream open is what "someone is watching"
 * means here, so it is the primary path.
 */
function loopbackSource(): DashboardSource {
  const listeners = new Set<() => void>()
  const emit = (): void => { for (const l of listeners) l() }

  return {
    async load(): Promise<DashboardSnapshot> {
      return await read(
        fetch(`/api/state?token=${encodeURIComponent(token())}`),
        'reading the snapshot',
      ) as DashboardSnapshot
    },
    onChange(listener: () => void): () => void {
      listeners.add(listener)
      const es = new EventSource(`/api/events?token=${encodeURIComponent(token())}`)
      es.onmessage = () => { emit() }
      // A dropped stream is recovered by the 30s net inside `DashboardApp`
      // (the `WATCHER_POLL_MS` safety poll it schedules itself), so `onerror`
      // deliberately does NOT re-open: EventSource already reconnects with the
      // `retry: 2000` the server writes, and a second stream would put this
      // tab in the client set twice.
      return () => {
        listeners.delete(listener)
        es.close()
      }
    },
    async respond(id: string, outcome: BridgeOutcome, feedback: string): Promise<void> {
      const trimmed = feedback.trim()
      const res = await fetch(`/api/approvals/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Dashboard-Token': token() },
        body: JSON.stringify({ outcome, ...trimmed === '' ? {} : { feedback: trimmed } }),
      })
      if (!res.ok) throw new Error(`standalone dashboard: the decision was refused (HTTP ${String(res.status)})`)
      // The server answers `{settled: true}` for an ask that a racing tab
      // already settled, which is success and not a failure — settling twice
      // must not be reported as an error the operator has to act on.
      assertSettleAccepted(await res.json() as { ok: boolean, settled: boolean, error: { message: string } })
    },
  }
}

function StandalonePage(): React.ReactElement {
  const source = useMemo(loopbackSource, [])
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  // Before the effect runs the shell's inlined snapshot is the only snapshot
  // there is, and `DashboardApp` renders its own "no snapshot yet" state — so
  // this one frame is a brief skeleton, never an error.
  return <>{mounted ? <DashboardApp source={source} /> : null}</>
}

const root = document.getElementById('root')
if (root !== null) createRoot(root).render(<StandalonePage />)