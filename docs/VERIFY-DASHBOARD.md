# VERIFY — the HITL approval dashboard

**Status: verified at every level except one — a human clicking the rendered
page in a real browser.** That last check is recorded as UNVERIFIED below with
the exact steps to close it, per the repo's standing rule: report only what was
observed.

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

- **151/151 unit tests** (`node --experimental-strip-types --test test/*.test.ts`),
  including `test/dashboard.test.ts` (18 tests): config validation, token
  enforcement, SSE, the claim/delegate guard, abort → `cancelled`, timeout →
  `unavailable`, last-tab disconnect → `unavailable`, `stop()` → `unavailable` +
  socket closed, POST validation (401/400/403/409), plugin wiring
  (`{prepend: true}`, no-dashboard registers nothing, bad field fails at load),
  the greppable `feature-loop dashboard:` line, hook-fed run state.
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

## NOT verified — a human click on the rendered page

What no automated check in this session did: open the URL in an actual browser,
see the cards render, and press **Allow once** with a mouse. The HTML is served
(200, correct content-type, headline present) and the exact endpoint its
buttons call was driven successfully (step 5–6 above), but the button-to-fetch
wiring inside `src/dashboard-page.ts` has not executed in a real browser.

Close it like this (≈2 minutes):

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

Record the outcome in this file. Until then: **page rendering + click = the
single UNVERIFIED item; server, guard, fail-closed paths, auth, and both
integration surfaces = verified above.**

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
