# dsh-feature-loop — TODO for the next session

Read [`HANDOFF.md`](HANDOFF.md) first. It has the state of the repo, the gotchas,
and what is not established.

Priority: **P0** blocks shipping or blocks a human from approving · **P1** blocks
trusting a claim · **P2** improves something already working · **P3** deferred
on purpose.

---

## P0 — Nothing uncommitted

The "not yet committed" warning below is a leftover from a session that ended
in 2026-03; `origin/main` is `5dcad97` (v0.1.9) and every path that warning
listed is in the history. Re-checked 2026-10-01, nothing pending.

Carry-over still true: Dependabot PRs #3-#7. #3 and #4 (Actions bumps) are low
risk. #5, #6, #7 (tsdown, zod, typescript — all majors) are **not** proven safe
by green CI, because `src/plugin.ts` is excluded from the CI typecheck job. The
local `npx tsc --noEmit` covers it and runs on every commit here, but CI will
not catch it.

---

## P2 — A person should judge the UI usable (was P0, then P1)

**Mechanically closed 2026-10-01, on the current build.** The whole human path
now runs as a script against a real model and asserts the disk, in both
directions — `test/e2e-in-ui.mjs` (`make e2e-in-ui`), transcript in
[`docs/VERIFY-E2E-APPROVAL.md`](docs/VERIFY-E2E-APPROVAL.md):

| | Allow once | Reject |
|---|---|---|
| Card | `REVIEW REQUESTED (policy): write: irreversible is always approved by a human.` | same |
| Thread after | `0` | `0` |
| File | exists, `hello` | **absent** |

Three things only that run found, none of which any earlier check could:

- **The harness's Preview Notice covers the sidebar.** On a fresh instance a
  click on `Feature Loop` does nothing and reads as a dead button.
- **The card is not re-rendered under a click.** An earlier probe reported
  `element was detached from the DOM`; measuring node identity directly gave
  **0 replacements in 20s**. The symptom looks exactly like a race and is not.
- **The target is the OPENED Workspace**, so a run started from a worktree
  writes to the repo root — which is what the page says it will do, and is the
  point of the note under the button.

What is still not closed, and is not closable by a script: whether the page
*reads* as usable to a person. Every proof here is written by the author of the
thing being proven. If you open it and it confuses you, that outranks
everything in `make verify`.

```bash
node ~/work/harvey/freepeak/deepseek-harness/apps/cli/lib/bin.js \
  --profile feature-loop --port 4188 --no-open
# then: the `dsh web:` URL → Feature Loop → type a task → Start loop → click.
```

## P1 — A human should click the DASHBOARD's Allow once by hand (was P0)

Same shape, for the standalone surface. **Mechanically closed 2026-10-01**:
`make e2e-dashboard` drives the real page and both buttons resolve the
server-side ask, and it now runs with no environment variables (it used to need
`PLAYWRIGHT_CORE` and `CHROME_PATH` set by hand, and failed on a machine where
neither was where it looked). Transcript in
[`docs/VERIFY-DASHBOARD.md`](docs/VERIFY-DASHBOARD.md).

What is still missing is the human reading the page, not clicking it. Downgraded
from P0 because the mechanism has now been proven twice — over HTTP and in a
real browser — and what remains is a taste question, not a correctness one.

## P1 — Docker: isolated data mount (sessions, …)

Status: **done** — `docker-compose.yml` mounts `dsh-data:/data` (profile,
sessions, settings) plus `dsh-fl-data:/data/.feature-loop` (run history);
`make clean` resets history only, `make clean-all` resets everything;
`docker/README.md` documents the split. `make compose-check` valid.

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

Status: **done (config)** — ladder is now `onegw/execution` →
`onegw/planning` (both verified live in `/v1/models`), prices keyed to match.
Role-splitting stays in `spec.controller.ladder` (see P2 routing note:
harness `model-selection` is the mechanism, the ladder is the policy).
Remaining: a containerised run visibly routing both roles under load —
UNVERIFIED (needs a task that stalls the cheap tier).

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

## P1 — LLM reasons → Laya decides → LLM acts (dynamic quality questions)

Status: **done** — `src/questioner.ts` (validate/parse/author, 9 tests),
`--judge-base-url`/`SYSTEMONE_BASE_URL` split in `src/cli.ts` (default
`http://127.0.0.1:8091`), `questioner` seam in `LoopRunnerOptions`
(`src/runner.ts`, actor `lastAssistant` as reasoning, silent fallback to
`judgeQuestion`). Live: authored `risk` score question → Laya `1.15`;
full demo run `--judge laya` goal-met in 10 steps.

Today the questions Laya answers are **fixed in code**: `judgeQuestion()` in
`src/review.ts` (one hardcoded `review_worthiness` score rubric) and the
optimizer `BATTERY` in `src/optimizer.ts` (seven authored questions). The loop
never asks the acting LLM what *it* is unsure about. The wanted loop, per step
(or per pass):

1. **LLM reasons** — the actor's own reasoning text + detector signals + goal.
2. **Questioner builds 1–3 typed `SystemOneQuestion`s** (`score`/`choice`/`noul`)
   from that reasoning — new small module (e.g. `src/questioner.ts`), one LLM
   call with a strict output contract, shape-validated before sending (Laya
   500s on malformed questions; `score` needs a `criteria` ladder).
3. **Laya decides** — direct `POST /v1/systemone` to the local sidecar
   (see transport note below), answers feed the router/actor.
4. **LLM acts** — `score` → review threshold as today; `choice` → ladder/tool
   hint; `noul` P(yes) → gate threshold. The mapping must be explicit, one
   function, tested — not vibes.

**Transport note — Laya is the containerised sidecar on `:8091`.** Treat it
like Jev / TypeSafe: same System One wire, different base URL. Health
`GET /health` → `{"ok": true, "model": "laya", "loaded": ["english"]}`.
Ops: `cd ~/.local/share/laya-sidecar && docker compose up -d` (colima VM ≥ 4 GB).
Point the judge at `http://127.0.0.1:8091`, not onegw's `:8080`.

Status: **done** — judge URL split (`--judge-base-url` / `SYSTEMONE_BASE_URL`,
default `:8091`); score criteria are ordered arrays (maps lose ladder
labels); `noul` wire field maps onto `JudgeResult.probability`; questioner
authors 1–3 typed questions per judged step with silent fallback to
`judgeQuestion`. Live: array score → human legend; noul → probability.

Rules that already exist and still apply: judge outage → detectors-only, never
fail-closed (`laya.ts` rule 2); out-of-range scores rejected, in-range floats
rounded (`optimizer.ts`, verified live); no `/api/apply` — decisions advise,
the human (or the loop's own gate) acts.

Acceptance: a CLI run with `--judge laya --judge-base-url
http://127.0.0.1:8091` shows questioner-authored Laya decisions in the
transcript; the same run with the sidecar killed completes detectors-only.
Live checks against `:8091` are recorded by hand, never asserted in CI
(no network in CI).

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

Status: **done (documented)** — `src/routing.ts` module doc now records the
decision: harness `model-selection` is the mechanism (mutable per-agent
selection + prompt assembly), the ladder is the policy (cheap-first
escalation with rung/reason/ceiling evidence). The plugin feeds policy into
the mechanism via `agent/request` overrides; collapsing would lose the
standalone runner and priced escalation evidence. Distinct layers, one seam.

`src/routing.ts`'s `ModelLadder` overlaps the harness's
`packages/core/agent/src/model-selection.ts`, which already swaps provider/model
mid-run through `agent/request`. Retained deliberately — it drives the standalone
runner and carries spec-level escalation — but the overlap is unresolved. Either
collapse onto `model-selection`, or document why spec-level escalation is
genuinely distinct.

## P2 — `demo/` transcript drift

Status: **done** — `demo/TRANSCRIPT.txt` regenerated from a live
`--judge laya` run (goal-met, 10 steps, Laya float scores like
`review-worthiness 0.6261/3` proving the questioner→Laya→LLM loop end to
end). Regenerate rather than hand-edit on future changes.

## P3 — Deliberately deferred

- **`run_tests` timeouts kill the direct child, not grandchildren** (marked
  `ponytail:` in `src/tools.ts`; upgrade path is detached spawn + `kill(-pid)`).
- **The price table is illustrative.** `mimo-v2.5` runs on a subscription, so
  marginal cost is near zero; the rates exist so a ceiling has something to
  measure against.
- **Laya** (phase 3, verified live 2026-09-23): all three primitives + full
  battery answer via `scripts/laya-sidecar.py` (`~/venvs/laya`, port 8091).
  Remaining: a `--judge-base-url` flag so the CLI can point at the sidecar
  (onegw's `:8080` has no systemone provider), and calibration — base
  checkpoints discriminate routine-vs-dangerous by only +0.056, matching the
  JEV doc's near-chance warning.
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
- **Verify before claiming.** `296/296` + `tsc --noEmit` + the integration test
  (9/9) is the floor.
