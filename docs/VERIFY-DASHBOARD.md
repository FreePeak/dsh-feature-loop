# VERIFY — the HITL approval dashboard

**Status: verified at every level, including the browser click** — the gap
below was closed 2026-09-23 by `make e2e-dashboard` (Playwright + Chromium
against the real page; transcript at the end of this file). Per the repo's
standing rule: report only what was observed.

Run date: 2026-03-25 (session evidence; re-run `make verify` to reproduce
everything except the live smoke, whose transcript is preserved verbatim).

## What was verified, with evidence

### 1. The full check suite — `make verify` green

```
compose config valid
# tests 151   # pass 151   # fail 0          ← unit suite (133 existing + 18 dashboard)
compiler: harness checkout
typecheck clean (CI file list)               ← now includes src/dashboard.ts, src/dashboard-page.ts
9 passed (9)                                 ← integration, real cordis + real ApprovalService
verify passed
```
(Historical transcript at dashboard-ship time. Current counts after the
assistant-ui migration: 194 unit + 11 integration, `make verify` green.)

- **151/151 unit tests** (`node --experimental-strip-types --test test/*.test.ts`),
  including `test/dashboard.test.ts` (18 tests): config validation, token
  enforcement, SSE, the claim/delegate guard, abort → `cancelled`, timeout →
  `unavailable`, last-tab disconnect → `unavailable`, `stop()` → `unavailable` +
  socket closed, POST validation (401/400/403/409), plugin wiring
  (`{prepend: true}`, no-dashboard registers nothing, bad field fails at load),
  the greppable `feature-loop dashboard:` line, hook-fed run state.
  (Historical baseline at dashboard-ship time; briefs and the assistant-ui
  migration grew the suite to 194 unit + 11 integration — see the
  re-verification section below.)
- **9/9 integration tests** under the harness's own vitest
  (`test/integration/plugin-in-dsh.spec.ts`, through `run.sh`): the original 5
  (APPROVE / REJECT / FAIL-CLOSED / DENY / AUTO) plus 4 dashboard probes
  against the real tool pipeline:
  - **DELEGATE** — dashboard enabled, no tab → the composer answerer is asked
    exactly once, tool runs: byte-identical fallback.
  - **APPROVE** — tab open → the ask lands in the dashboard queue (through the
    real `ApprovalService.request` waterfall), `POST allowed-once` runs the
    tool, the composer answerer is never consulted: one surface wins.
  - **REJECT** — `POST rejected` stops the write with the same model-facing
    error as the composer reject.
  - **FAIL CLOSED** — enabled, no tab, no composer → same refusal as no
    answerer at all.

### 2. Live smoke over real HTTP (external client, outside any test runner)

A standalone process ran `startDashboard` with demo run state and one pending
ask; every step below was driven by `curl`/`node` from a separate shell —
the same requests the browser page's JavaScript issues:

| # | Request | Result |
|---|---|---|
| 1 | `GET /?token=…` | **200**, `text/html`, 11 850 bytes, contains `HITL approvals` |
| 2 | `GET /` (no token) | **401** |
| 3 | `GET /api/state` (no token) | **401** |
| 4 | `GET /api/state` + `X-Dashboard-Token` | **200** — `answers:true`, `pending:1` (the claim **held** with a reading tab), run card `smoke-run step 4/12, spend $0.02/1, route onegw/execution, judge 2, feed:2`, reason `REVIEW REQUESTED (policy): write: irreversible` |
| 5 | `POST /api/approvals/:id` allow (token + same origin) | **200** `{"ok":true,"outcome":"allowed-once"}` |
| 6 | server-side `answer()` promise | resolved **`allowed-once`** |
| 7 | late second POST to the settled id | **409** |
| 8 | POST with `Origin: http://evil.example` | **403** |

Two diagnostic findings from building this transcript, kept because they are
properties of the design, not of the smoke:

- **First smoke attempt: no tab open → `answer()` delegated instantly to
  `unavailable`.** The guard firing exactly as specified — a dashboard nobody
  is looking at is not an answerer.
- **Second attempt: an SSE `fetch` whose body was never consumed got GC'd, the
  socket dropped, and the server settled the pending ask `unavailable` ~8 s
  later** — fail-closed on last-tab-gone, also as specified. The page itself is
  immune: it uses `EventSource`, which reads its stream (and reconnects on
  drop, re-arming the guard).

### 3. Deployment config

- `docker/profile.patch.yml` seeds `dashboard: {enabled, host: 0.0.0.0, port: 8100}`.
- `docker/docker-compose.yml` publishes `127.0.0.1:${DSH_DASHBOARD_PORT:-3092}:8100`
  — loopback-only end to end, same posture as the UI.
- `make dashboard` rebuilds the host URL + token from the log line
  (`feature-loop dashboard: http://…/?token=…`); `make up` prints it next to
  the UI URL. `compose config valid` (part of `make verify`).
- `cordis.patch.yml` carries the commented `dashboard:` block for non-Docker
  profiles.

## Browser click — VERIFIED via `make e2e-dashboard`

`test/e2e-dashboard.mjs` (opt-in, not part of `make verify` — it needs a
browser) drives the real page in headless Chromium via Playwright: it opens
the token URL, waits for the pending card, clicks the button, and asserts the
server-side `answer()` promise resolves with the clicked outcome. It also
asserts no `.brief` section renders when no brief was requested.

Transcript (verbatim, run in the `dsh/openui-brief` worktree):

```
$ node --experimental-strip-types test/e2e-dashboard.mjs allow
feature-loop dashboard: http://127.0.0.1:55359/?token=d5a6cb1a034e654d371047c3e41ca739a8def55994ecbd4f
e2e-dashboard (allowed-once): the Allow once click resolved the ask allowed-once
$ node --experimental-strip-types test/e2e-dashboard.mjs reject
feature-loop dashboard: http://127.0.0.1:55370/?token=bb2f666978c5a702567c52cad0bc2e6f16b3b0b3376514c3
e2e-dashboard (rejected): the Reject click resolved the ask rejected
```

## Re-verified on assistant-ui (this branch)

The UI moved from OpenUI to [assistant-ui](https://github.com/assistant-ui/assistant-ui),
so the browser claim was re-established against the new shell rather than
inherited. `make verify` is green at **194 unit + 11 integration**, and
`make e2e-dashboard` passes both directions repeatedly:

```
$ node --experimental-strip-types test/e2e-dashboard.mjs allow
e2e-dashboard (allowed-once): the Allow once click resolved the ask allowed-once
$ node --experimental-strip-types test/e2e-dashboard.mjs reject
e2e-dashboard (rejected): the Reject click resolved the ask rejected
```

A captured frame of the three card states (brief ready / still writing /
unavailable) is committed at [`assistant-ui-dashboard.png`](assistant-ui-dashboard.png).

What changed in the mechanism, and why it is still the same guarantee: the
approval card is now rendered by assistant-ui's `MessagePrimitive.Parts` with a
`tools.Override` component, and the click reaches the server through
`onRespondToToolApproval` → `src/approval-bridge.ts` →
`POST /api/approvals/:id`. The endpoint, token check, cross-origin refusal, and
fail-closed paths are unchanged and still covered by the unit and integration
suites. The bridge is pure and is asserted in CI's no-install job.

Measured properties of the served artifact (checked by
`test/assistant-ui.test.ts` and enforced at build time by `web/build.mjs`):

| Property | Value |
|---|---|
| `dashboard.js` | ~470 KB (~142 KB gzipped) |
| `dashboard.css` | ~106 KB (~11 KB gzipped) |
| telemetry / `assistant-cloud` in bundle | **absent** (build refuses otherwise) |
| URLs in bundle | 1 (`https://react.dev`) |
| assets served without a token | yes (they hold no secret; page + API still 401) |

Two honest limits on this evidence: the browser is headless Chromium, not a
human's mouse — and the ask is synthetic (`startDashboard` + `answer`
directly), not one raised through a live Web UI session. What it does prove
is the exact wiring that was unverified: the page's JavaScript renders the
card from the SSE snapshot and the button's `fetch` settles the real ask.

## Professional revamp (2026-09-23, branch `dsh/hitl-dashboard-pro`)

Presentation-only: `web/shell.css`, `web/app.tsx`, `src/dashboard-page.ts`,
rebuilt assets. The approval seam, snapshot schema, token CSP, and
`approval-bridge` vocabulary are unchanged. What was observed after the
change:

- `make verify` — green (194 unit + 11 integration, typecheck, compose).
- `make e2e-dashboard` — allow and reject both resolve the real ask.
- Headless structural pass (Chromium against `startDashboard` + `answer`):
  stage+rail grid at 1440, sticky header, mono tool id, `.card .tool` +
  role-named buttons, `Allow once` via keyboard Enter → `allowed-once`,
  `Reject` click → `rejected`, `#pending-count` reads `1 pending`, skip
  link present, no horizontal scroll at 390.
- Full-page screenshot of the live page with one pending ask + brief:
  `docs/hitl-dashboard-revamp.png`.
- `demo/hitl-open.mjs` starts a seeded demo (run metrics, feed, pending ask
  with brief) and opens it in the default browser; that is the "new
  dashboard" URL, not the container's older bundle on :3092.

Still true: headless Chromium, synthetic ask, no human click in this pass —
same ceilings as above.

The manual composer-interplay steps (≈2 minutes) remain a valid deeper check:

```bash
FORCE_REINIT=1 make up        # re-seed the profile: the volume predates the dashboard
make dashboard                # prints http://127.0.0.1:3092/?token=…
```

Then, in the Web UI on `make url`'s address, give the loop a task that gates
(`write` under the seeded `auto-if-confident` policy does it — no judge means
no confidence evidence, so the gate asks). While the composer shows the ask:

1. Open the dashboard URL → a pending card appears with the gate's reason.
2. Press **Allow once** → the composer prompt disappears and the tool runs
   (or the reverse from **Reject**: the model is told a human said no).
3. Reload with no tab open and repeat → the composer panel answers instead —
   the fallback.

## Known ceilings (deliberate, with upgrade paths)

- **Spend shown on the dashboard is as un-metered as the budget itself**
  (`plugin-path never meters` — Phase 2b). `spentUSD` renders what the
  snapshot reports; `maxSteps` remains the only load-bearing ceiling.
- **Prepend against the harness remote forwarder** is asserted as a registration
  fact (`{prepend: true}` in the unit suite) and exercised through the real
  in-process waterfall (integration), but the forwarder's
  holds-the-request-without-`next()` path only exists when a Web UI tab is
  attached to a full host — that interplay rides on the browser check above.
- **Token in the URL query** (for `EventSource`, which cannot set headers):
  loopback-only bind plus per-boot rotation is the accepted posture; header
  auth (`X-Dashboard-Token`) covers everything else, including all POSTs.
