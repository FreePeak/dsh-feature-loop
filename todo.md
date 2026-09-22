# dsh-feature-loop — TODO for the next session

Read [`HANDOFF.md`](HANDOFF.md) first. It has the state of the repo, the gotchas,
and what is not established.

Priority: **P0** blocks shipping or blocks a human from approving · **P1** blocks
trusting a claim · **P2** improves something already working · **P3** deferred
on purpose.

---

## P0 — Not yet committed (do this first)

**The approval + Docker work IS committed and pushed** (`04326cd`, `2f93906` on
`feat/human-approval-and-docker`, **PR #9 open**, `origin/main` still `ea48b03`).

**The approval dashboard from this session is NOT.** 13 paths (9 modified + 4
new) hold the whole feature — server, page, wiring, tests, deployment config,
docs. If this machine is lost, so is it.

```bash
cd dsh-feature-loop
git log --oneline origin/main -1     # ea48b03
git status --short | wc -l           # 13
```

The uncommitted set:

- **modified:** `.github/workflows/ci.yml`, `Makefile`, `README.md`,
  `cordis.patch.yml`, `docker/docker-compose.yml`, `docker/profile.patch.yml`,
  `src/index.ts`, `src/plugin.ts`, `test/integration/plugin-in-dsh.spec.ts`
- **new:** `src/dashboard.ts`, `src/dashboard-page.ts`,
  `test/dashboard.test.ts`, `docs/VERIFY-DASHBOARD.md`

Plan:

1. Re-run the floor first: `make verify` (compose-check + 151 tests +
   typecheck + the 9/9 integration spec) — already green this session, re-run
   before committing.
2. Commit on the SAME branch (`feat/human-approval-and-docker`) so PR #9 gains
   the dashboard; push; wait for CI (both jobs on the self-hosted runner;
   `gitStream.cm` shows `skipping` and is not a merge gate).
3. In the PR body: the dashboard is a new opt-in surface (`dashboard:` config),
   loopback + token; a tab-less deployment behaves byte-identically to the
   composer-only path (4 new integration probes prove it). The one open item:
   the rendered page's button click in a real browser
   (`docs/VERIFY-DASHBOARD.md`) — record it as UNVERIFIED until someone does it.

Older carry-overs, still true: Dependabot PRs #3-#7 are open. #3 and #4
(Actions bumps) are low risk. #5, #6, #7 (tsdown, zod, typescript — all major)
are **not** proven safe by green CI, because `src/plugin.ts` is excluded from
the CI typecheck job.

## P0 — A human should click the panel by hand

Both buttons were exercised by an **automated browser script**
(`docs/VERIFY-E2E-APPROVAL.md`). That proves the mechanism; it does not prove a
person finds the UI usable — and reaching a usable composer takes three gates:
the Internal Testing Notice, the "Add an API key" prompt, and the workspace
chooser.

Either click it yourself, or decide the automated proof is sufficient and record
that decision here. If the UI confuses you, that confusion is a real finding.

## P0 — A human should click the DASHBOARD's Allow once by hand

Same shape as the section above, for the new surface: server, guard, auth,
fail-closed paths, and the exact endpoint the buttons call are verified over
real HTTP, but no browser has executed the page's own JavaScript. The
two-minute script (bring-up + three checks) is in
[`docs/VERIFY-DASHBOARD.md`](docs/VERIFY-DASHBOARD.md); record the outcome
there.

## P1 — Docker: isolated data mount (sessions, …)

Give the container a **new, separate volume** for its data (sessions, logs,
profile state) instead of sharing/`dsh-fl-data` semantics — an isolated mount
so feature-loop data can be reset, backed up, or reused independently.
Touches `docker/docker-compose.yml` (named volume + `name:` pin, per the
existing `dsh-fl-data` lesson), `Makefile` (`VOLUME`, `clean`, `ports`
messaging), and `docker/README.md`. Keep the loopback-only posture and the
`FORCE_REINIT` re-seed story coherent when the mount point changes.

## P1 — Model routing: `execution` (executor) and `planning` (planner) from onegw

The seeded ladder in `docker/profile.patch.yml` is single-rung
(`onegw/opencode/deepseek-v4.1-flash`). Split it into the two roles:

- **executor** → the `execution` model from onegw
- **planner** → the `planning` model from onegw

Confirm the exact model ids against the gateway config before editing, update
the `prices:` keys to match, and decide where role-splitting belongs
(`spec.controller.ladder` vs a harness `model-selection` concern — see the P2
routing item below). Acceptance: a containerised run visibly routes the two
roles, and the cost ceiling still prices what actually runs.

## P1 — Meter real spend into `LoopBudget.spend()`

**The largest correctness gap.** `costBudgetUSD` currently measures **zero**:
`spend()` is never called with real usage, so the cost ceiling cannot fire.
`maxSteps` is the only trustworthy ceiling.

- `src/budget.ts` — `LoopBudget.spend()` and `priceUsage()` (the arithmetic and
  cache handling already exist; the missing part is the call site).
- `src/plugin.ts` — `routeForStep()` and the `agent/request` handler are where a
  settled attempt's usage is visible.

Acceptance: a run with a deliberately tiny `costBudgetUSD` stops on cost, and a
test asserts spend is non-zero after a priced attempt.

Status: **done on `dsh/loop-optimize`** — `plugin.ts` drains settled
`assistant/message` events into `budget.spend()` from both hooks (cursor-deduped),
`runner.ts` prices every model result and times the call, and
`test/budget.test.ts` asserts a priced attempt costs $0.168, not zero.

## P1 — Test the plugin's wiring

`src/plugin.ts` is the most harness-coupled module and the thinnest on tests
relative to its risk. Two bugs already shipped past reading-only review:

- **Detectors read nothing.** The first draft never populated `policy.history`,
  so all six detectors would have stayed silent forever — the exact
  `error-cascade` defect the removed fork had, reproduced.
- **The gate failed open.** `policyFor(agent)` returned `undefined` for an
  agent-less call, so the handler delegated and the call dispatched **ungated**.

A fake-context harness driving the three hooks (`agent/pre-step`,
`agent/request`, `tools/pre-execute`) would have caught both.
`test/plugin-approval.test.ts` covers the decisions;
`test/integration/plugin-in-dsh.spec.ts` covers a real context. Missing: a cheap
unit-level test of **the wiring itself**.

## P1 — Confirm the session-log audit trail on the web path

`docs/VERIFY-SDK-RUN.md` captured `approval/asked` and `approval/decided` from a
durable session log. Those events were **not** found on the container's volume
after the browser run — the approved file was the evidence instead. Establishing
where the web path persists sessions and grepping it would close a real audit
gap: "the approval was recorded" is currently unproven for the UI.

## P2 — Resolve `routing.ts` against `model-selection`

`src/routing.ts`'s `ModelLadder` overlaps the harness's
`packages/core/agent/src/model-selection.ts`, which already swaps provider/model
mid-run through `agent/request`. Retained deliberately — it drives the standalone
runner and carries spec-level escalation — but the overlap is unresolved. Either
collapse onto `model-selection`, or document why spec-level escalation is
genuinely distinct.

## P2 — `demo/` transcript drift

`demo/TRANSCRIPT.txt` and the README's example output predate several changes.
Two review strings had already drifted (now fixed). Regenerate the transcript
rather than hand-editing it.

## P3 — Deliberately deferred

- **`run_tests` timeouts kill the direct child, not grandchildren** (marked
  `ponytail:` in `src/tools.ts`; upgrade path is detached spawn + `kill(-pid)`).
- **The price table is illustrative.** `mimo-v2.5` runs on a subscription, so
  marginal cost is near zero; the rates exist so a ceiling has something to
  measure against.
- **Laya** (phase 3): deploy the `systemone` provider in onegw, switch
  `--judge laya`. `src/laya.ts` is written; the demo uses `ChatJudge` instead.
- **The Dockerfile pins `dsh@0.1.7-alpha.1`** because the `latest` tag is broken
  upstream. Revisit when that is fixed.

---

## Done — do not redo

| Item | Evidence |
|---|---|
| De-fork: ~3,064 vendored lines → `src/plugin.ts` | merged as `ea48b03` / PR #8 |
| Gate decides before dispatch and asks a human in the Web UI | `docs/VERIFY-E2E-APPROVAL.md` |
| Approve → the write runs; Reject → nothing written | same doc, plus `VERIFY-INTEGRATION.md` 5/5 |
| Fail-closed: no answerer → refusal; agent-less call still gated | `VERIFY-INTEGRATION.md`, `VERIFY-APPROVAL.md` |
| Real model-driven runs reach the gate (CLI **and** SDK) | `VERIFY-HEADLESS-RUN.md`, `VERIFY-SDK-RUN.md` |
| Containerised: one command, preset pinned, reports `healthy` | `docker/README.md` |
| `pnpm install` works on a clean clone | `package.json` + `.npmrc`; `QA-FINAL.md` row 1 |
| Setup guide independently QA'd; all 9 failures fixed | `QA-FINAL.md` |
| Panel rendering is covered by the harness itself | `VERIFY-PANEL-EVIDENCE.md` |
| HITL approval dashboard: guard, fail-closed, auth, POST path | `VERIFY-DASHBOARD.md` — 194 unit + 11/11 integration + live HTTP transcript + browser click verified via `make e2e-dashboard` |
| Optimize composition wired both ways: CLI derives + advises, plugin records + rolls up | `src/optimize.ts` + `test/optimize.test.ts` + plugin turn-end wiring; proposals stay CLI-only |

---

## Standing rules

- **Report only what you observed.** `UNVERIFIED` is a good answer, and so is
  "I could not test this". Do not upgrade an inference into an observation.
- **Do not vendor harness code.** Register a listener on a harness event instead.
- **Do not edit `~/.dsh/settings.yaml`** without asking — use a private
  `DSH_HOME` (`docs/RUNBOOK-SERVER.md` §2.6).
- **Never disturb ports 3081 / 3097 / 3099** if the user's GUI is running.
- **Verify before claiming.** `238/238` + `tsc --noEmit` + the integration test
  (9/9) is the floor.
