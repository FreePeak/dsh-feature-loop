# PRD — `@freepeak/dsh-feature-loop`

**Status:** Phase 1 complete (de-fork executed). Phase 2 not started.
**Owner:** Linh Doan
**Last updated:** 2026-10-07 (the 0→1 pipeline ran end to end through the web
UI, headless, for the first time — `goal-met`, 30 steps, $0.1648, five phases,
a landing page that builds and whose assistant-ui chat answers. Getting there
took three fixes, each invisible until the previous one landed: the standalone
dashboard's SSE ping never refreshed the watcher flag, so an ask raised in the
gap went to a composer panel a headless run does not have and the turn hung;
`/product` and `/loop` returned their task as result text, which the harness
renders as a notice, so no turn ever started; and every subagent got its own
phase machine, so the model's four research helpers each burned the research
ceiling and reported "declined the task", blocking the run at 2% of budget. See
§7.3, §8 and `test/dashboard.test.ts`, `test/loop-command.test.ts`,
`test/subagent.test.ts`)

Earlier: 2026-10-05 (a run record is no longer written one attempt
short: the `turn/end` listener now drains settled usage itself, because the
turn's closing model call is only settled by `agent/request` as that handler
returns — after this listener ran. Measured in the Desktop app: `steps`
equalled the session log's `assistant/message` count minus one in 8 of 8 runs,
and the missing step is the turn's most expensive one. See §8 and
`test/plugin-approval.test.ts` § "the closing drain")

Earlier: 2026-09-30 (the cheap-first ladder no longer carries a model's
reasoning effort onto the wrong route — `routeForStep` hands the rung's own
effort over and a rung with none drops the session's, so a profile whose rungs
are gateway aliases works beside a UI selection instead of failing every turn
with `UNSUPPORTED_REASONING_EFFORT`. See §8 and
`test/routing-effort.test.ts`)

Earlier: 2026-09-29 (plugin page brought onto the harness's own design
metrics; browser click path driven end to end on an isolated instance — see
[`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) § "The browser click path, and the page's
own geometry" and `test/css-parity.test.ts`)

---

## 1. Summary

`@freepeak/dsh-feature-loop` is a **policy layer** for bug-fixing and small
features on the DeepSeek Harness: budget ceilings, cheap-first model routing, a
step-level review gate, deterministic stall detectors, and a local judge that
decides which steps deserve a human's attention.

It was originally built as a **vendored fork** of `@deepseek-ai/dsh-agent-loop`,
carrying a standalone runner alongside it. An audit established that the fork
was redundant — the harness already publishes extension points for every policy
the fork inserted — and the fork has been removed. The package now **hosts its
policies on the harness's own loop** and keeps the standalone runner as an
independent proof that the policies work with no harness build.

---

## 2. Problem

An agent loop that runs unattended against a real codebase has three failure
modes that the base harness does not address:

1. **Unbounded spend.** A loop can burn an arbitrary amount of money before
   anyone notices. The harness meters tokens (`ctx.tokenMeter`) but does not
   price them or stop on a dollar amount.
2. **Unbounded stopping.** The upstream loop's exit conditions are structural
   (`blocked`, `completed`, inbox empty). Nothing expresses "the goal is
   observably met, stop", and nothing notices a loop that is spinning.
3. **Unreviewed irreversible action.** A model may attempt a destructive write
   with no gate between intent and effect.

---

## 3. Audit: what was redundant

The original repo was two separable things. Only one was redundant.

### 3.1 Redundant — the vendored loop (removed)

| Artifact | Lines | Why redundant |
|---|---|---|
| `src/agent.ts` | 968 | Hard fork of upstream `agent.ts` (620 upstream lines, **364 changed**). Every upstream loop fix required manual reconciliation. |
| `src/index.ts` | 1069 | Hard fork of upstream `index.ts` (**222 changed**) owning the `AgentFactory` slot. |
| `src/tool-calls.ts` | 328 | Fork of upstream (**46 changed**), only to surface per-call `isError` to the detectors. |
| `src/inbox.ts` | 247 | Fork of upstream (**7 changed**). |
| `src/runtime-context.ts` | 159 | **Byte-identical** to upstream (0 diff). Pure copy burden. |
| `src/assistant-stream.ts` | 140 | **Byte-identical** to upstream (0 diff). Pure copy burden. |
| `src/constants.ts` | 6 | **Byte-identical** to upstream (0 diff). Pure copy burden. |
| `src/invariant.ts` | 65 | **Byte-identical** to upstream (0 diff), and imported by nothing at all. |
| `src/notices.ts` | 82 | Existed only to wrap text for the vendored `inbox.ts`. |
| `scripts/sync-upstream.sh` | 70 | Fork-maintenance machinery, obsolete once there is no fork. |
| `upstream.lock` | 10 | Pinned `c291e796` / `v0.1.5-rc.2` while the harness had moved to `0.1.6-alpha.2`. |
| `cordis.patch.yml` | 60 | Disabled upstream's `agent-loop` row and substituted the fork. |
| **Total** | **≈3,064** | |

### 3.2 Redundant — the routing ladder

`src/routing.ts`'s `ModelLadder` overlaps the harness's own
`packages/core/agent/src/model-selection.ts`, which already swaps provider and
model mid-run through the `agent/pre-step` → `agent/request` waterfall and emits
a model-switch notice. **Retained for now** (it drives the standalone runner and
carries spec-level escalation semantics), but flagged as a Phase 2 candidate for
collapsing onto `model-selection`.

### 3.3 Not redundant — the policy layer (retained)

Grepping the entire harness checkout for `LoopBudget`, `ReviewGate`,
`AttentionRouter`, `detectSignals`, `successCommand`, `costBudgetUSD`,
`inputPerMTok` returns **zero hits**. None of the following exists upstream:

| Capability | Module |
|---|---|
| 8-dimension `LoopSpec`, validated at load | `spec.ts` |
| Step and cost ceilings in USD | `budget.ts` |
| Six deterministic stall detectors | `signals.ts` |
| Reversibility gate + attention router (<10% review budget) | `review.ts` |
| Plugin decisions, extracted so they are testable | `agent-policy.ts` |
| Chat judge + Laya judge behind one interface | `judge.ts`, `laya.ts` |
| Notice text, dependence-free | `messages.ts` |
| Phase prompts | `prompts.ts` |
| Standalone loop, sandboxed tools, CLI, demo | `runner.ts`, `tools.ts`, `cli.ts`, `llm.ts` |

These ≈3,556 lines, with 133 tests, are the product. **The fork was never the
product; it was the scaffolding that hosted the product.**

---

## 4. Decision

**De-fork. Keep the policies. Host them on the harness.**

The harness publishes an extension point for every policy the fork inserted:

| Policy | Harness extension point | Evidence |
|---|---|---|
| Step/cost ceilings | `agent/pre-step` → return `{kind:'reject', reason}` | `packages/core/agent-loop/src/agent.ts:241-258` |
| Cheap-first routing | `agent/request` → override provider/model | `packages/core/agent/src/model-selection.ts:87-106` |
| Review gate | **`tools/pre-execute` → return `{kind:'deny', reason}`** | `packages/core/tools/lib/types/index.d.ts:38,419-424` |
| Termination | `agent/turn-stopping` | `packages/core/agent/src/runtime-types.ts:381` |

### 4.1 The finding that justified the rewrite

The harness exposes `tools/pre-execute`, a **first-class pre-dispatch decision
hook** returning `PreToolDecision` (`allow` / `deny` / `ask`). The fork's README
documented that its gate was delivered **one step late** — after the tool had
already run — and filed blocking approval as an unimplemented refinement:

> "Phase 2 … Blocking approval via `tools/pre-execute` is the remaining
> refinement (see the `ponytail:` note)."

Wiring the gate onto `tools/pre-execute` **closes that known defect outright**.
The gate now denies before dispatch. This is a behaviour *improvement* the fork
could not reach without forking, and it is the concrete payoff of de-forking.

### 4.2 Cost, stated honestly

This was not free:

- The plugin must construct `UserMessage` values itself — `MessageId` branding
  plus `ContentBlock[]` — where the fork's vendored `inbox.ts` did it.
- The harness's real signatures differ from the ones a reader would guess
  (`RouteDecision` has `reason`, not `escalatedFrom`; `AttentionRouter` exposes
  `budgetRemaining()`, not `hasBudget()`; `judgeQuestion` returns
  `{state, questions}`, not `questions`). Every one of these was caught by
  typechecking against the real `.d.ts` files **before** deletion.
- `src/plugin.ts` remains the one harness-coupled module, so it stays outside
  the harness-free CI typecheck job.

---

## 5. Architecture (post-de-fork)

```
src/
  ── the product: pure policy, no harness import ──
  spec.ts          the 8 dimensions, validated at load
  budget.ts        step/cost ceilings, USD price table, unpriced-step tracking
  routing.ts       cheap-first ladder, escalation on evidence
  signals.ts       6 deterministic detectors
  review.ts        reversibility gate + attention router
  agent-policy.ts  the decisions, extracted so they are testable
  judge.ts         chat judge
  laya.ts          Laya judge via onegw /v1/systemone
  messages.ts      notice text (imports nothing — keeps the suite runnable)
  prompts.ts       BUG_FIX / FEATURE / REFACTOR prompts

  ── the harness host (replaced the fork) ──
  plugin.ts        agent/pre-step · agent/request · tools/pre-execute

  ── the standalone proof ──
  runner.ts        spec → budget → route → judge → review → model → tools
  llm.ts           OpenAI-compatible client + scripted client for tests
  tools.ts         sandboxed read/write/edit/list/run_tests, path-confined
  cli.ts           the demo entry point
```

**Two paths, one policy layer.** The policies are shared; only transport and
session state differ. The runner proves the policies are separable from the
harness; the plugin proves they integrate with it.

---

## 6. Acceptance criteria

Phase 1 is complete when **all** hold:

| # | Criterion | Result |
|---|---|---|
| 1 | The test suite passes unchanged | ✅ 133 pass, 0 fail (126 at the time of the de-fork; the plugin tests were added later) |
| 2 | `tsc --noEmit` is clean against the real harness packages | ✅ exit 0 |
| 3 | `bash demo/run.sh` still reaches `goal-met` | ✅ (see §7) |
| 4 | No file in `src/` imports a deleted module | ✅ verified |
| 5 | `grep -rn "FORK-DELTA" src/` returns nothing | ✅ |
| 6 | The plugin typechecks against real `.d.ts`, not assumed signatures | ✅ |
| 7 | Removing the fork is behaviour-preserving for the runner path | ✅ criteria 1 + 3 |

---

## 7. Verification performed

Baseline captured **before** any deletion:

- tests **126/126 pass** (the count at that time), `tsc --noEmit` exit 0
- `bash demo/run.sh` → `goal-met`, 8 steps, $0.0053, 1 review (13%)

After removal and the plugin rewrite:

- tests **126/126 pass** (then) — the suite never touched the vendored files
- `tsc --noEmit` exit 0 — including `src/plugin.ts`
- demo → `goal-met` (re-run recorded in the Phase 1 commit)

The import graph was verified to be a **closed cluster** before deleting:
every vendored file was imported only by `agent.ts` or `index.ts`, and those
were imported by nothing. `invariant.ts` was imported by nothing at all.

### 7.1 A bug found in the replacement, by reviewing it

The first draft of `src/plugin.ts` **never populated `policy.history`** — the
array every detector reads. It registered the ceiling check and the gate but had
no code path writing step observations, so all six detectors would have read an
empty history and stayed silent forever.

That is precisely the defect the fork had with `error-cascade`, reproduced in the
replacement: a plugin that *looks* wired and runs zero detectors. It was caught
by re-reading the module rather than by a test, because `plugin.ts` has no test
(see §9.4).

The fix commits an observation at each step boundary from a `pending` record
captured at `tools/pre-execute` — the only point where a tool's name and parsed
arguments are both known. Two details are deliberate:

- **A step that ran no tool still gets an observation.** "A step that did
  nothing" is itself worth detecting; skipping it would let a silent spin loop
  look like a healthy one.
- **A denied call is recorded as a failure.** Treating a gate block as success
  would let a repeatedly-blocked loop read as a healthy one.

Verified by a throwaway smoke script (since deleted): after three consecutive
recorded failures, step 4 raises a critical `REVIEW REQUESTED (signal)` with the
message *"3× identical edit call with the same arguments — the loop is not
making progress."* (The smoke script drove the handler with a synthetic tool
named `edit_file` and a hand-written `pending` record; a real DSH session calls
`edit`. See `docs/SETUP.md` on the two name spaces.) Detectors now fire.

**This is the strongest argument for §9.4:** the plugin path has no test, and
this bug is exactly what a test would have caught.

### 7.2 A fail-open gap found while writing the setup guide

Verifying the plugin against a real profile exposed a second wiring bug: the
`tools/pre-execute` handler read its policy straight from the per-agent
`WeakMap`, and policies were **only created in `agent/pre-step`**. A tool call
arriving before any step — a resumed session, or a nested dispatch — therefore
found no policy and returned `next()` unchanged.

That is **fail-open on the security-relevant path**: an irreversible write could
be dispatched ungated purely because of the order in which the harness happened
to emit its events.

Fixed by resolving every hook's policy through a single `policyFor(agent)`
helper that builds the policy on first sight. The gate now fails closed — an
unseen agent gets the deployment's real policies, not a pass.

Verified: with no prior `agent/pre-step`, a write-class call with no confidence
estimate is now **denied** rather than dispatched.

### 7.3 The headless run, and the three bugs it took to get one

On 2026-10-07 the 0→1 pipeline was driven end to end through the **web UI** —
headless Chrome over CDP, the composer typed into and submitted with real key
events, the dashboard as the approval channel — for the first time. It reached
`goal-met`: 30 steps, $0.1648 of $2.00, all five phases passed, and an artifact
that builds (`next build` → 3/3 static pages) whose embedded assistant-ui chat
answers.

Three bugs had to be found and fixed first. Each was invisible until the one
before it landed, and **none was caught by the unit suite**, which passed
throughout:

1. **The dashboard's SSE ping never refreshed the watcher flag.** `openSse`
   registered a watcher on connect and then pinged every 25s without calling
   `noteWatcher` again, against a 15s TTL — so a tab open for minutes counted as
   a watcher 60% of the time, and an ask raised in the 10s gap was delegated to
   the composer panel. With no UI tab attached there is no panel, so the turn
   hung: the session log held `approval/asked`, `lsof` showed the SSE connection
   ESTABLISHED, and `GET /api/state` reported `pending: []` for 10+ minutes while
   every settle POST answered 409. Fixed by making the ping the heartbeat it was
   meant to be, moving `SSE_KEEPALIVE_MS` beside the TTL it must stay under, and
   raising the TTL to 60s. `test/dashboard.test.ts` fails on the old code and on
   a 25s TTL.

2. **`/product` and `/loop` never started a turn.** The handler returned the task
   text as a `success` result on the assumption that "the composer submits the
   returned text as the turn". Measured on harness 0.2.0-rc.2, it does not: the
   claimed-command path calls `commands.execute()` and `onSubmitSettled` renders
   a success result's `text` as an inline notice. A live `/product` produced
   `command/run` + `command/done` and **no `turn/start` at all**. Fixed by doing
   what `dsh headless` does — `agent.followup(createUserMessage(...))` — without
   awaiting `whenIdle()`, because a five-phase pipeline runs for minutes and the
   composer's submit transaction would hold the input bar for all of it.
   `test/loop-command.test.ts` fails with the handler reverted.

3. **Every subagent ran its own phase machine.** `createPolicy` builds one policy
   per agent, so each helper the model spawned got a fresh `startPipeline()`.
   The model spawned four research subagents; each was told "you are in phase 1
   of 5: RESEARCH", ran the research phase's full 24-step ceiling, and was
   rejected by `pipelinePreCallGuard` — all four ended
   `stopReason: 'refusal'`, the parent was told "declined the task. It left no
   closing message", and the run blocked in `research` with no research note
   written, at 2% of its budget. Fixed by clearing only `policy.pipeline` for a
   session whose header says `origin: 'subagent'` or a non-zero
   `delegationDepth`; the gate, spec, budget and containment all stay, because a
   subagent's writes are exactly as irreversible as the parent's.
   `test/subagent.test.ts` fails with the `policyFor` branch reverted.

The method is the finding: all three were found by **driving the real thing and
reading what it actually did**, and all three survived a suite of 800+ passing
tests. §7.1 and §7.2 said the same thing about wiring bugs found by reading; this
is the same lesson from the other direction.

---

## 8. Known limits

- **Review rate is 20% in the demo, not the book's <10%.** Critical signals are
  deliberately not rate-limited — safety is not subject to an attention budget —
  so a run with an error cascade will exceed the target. The budget governs
  judge-driven reviews only.
- **`src/plugin.ts` is not typechecked in CI.** It imports `@deepseek-ai/dsh-*`
  at versions CI cannot resolve. It is typechecked locally against the prebuilt
  packages. Closing this needs a lockfile, which needs published harness
  versions.
- **Spend is observed, not metered by the plugin.** `LoopBudget.spend()` is
  called with the real usage of every settled attempt, but the *cadence* was
  wrong until 2026-10-05: `agent/pre-step` and `agent/request` both drain, and
  a turn's last attempt is settled only as the `agent/request` handler returns
  — after `turn/end` had already snapshotted the budget. Every record was
  therefore one attempt short (8 of 8 runs in the Desktop app), losing the
  turn's most expensive step. `turn/end` now drains before it builds the
  record. The ceiling is still bounded by step count, not by spend alone.
- **A reasoning effort belongs to a model, so a route change must drop it.**
  `Route.reasoningEffort` is the rung's own, and the harness refuses any explicit
  effort a model does not advertise (`UNSUPPORTED_REASONING_EFFORT`, thrown
  before provider I/O). A session that picked a model *with* an effort and then
  met the ladder lost every turn: the rung rewrote provider/model, the merge kept
  the session's effort, and that effort arrived at a model which never offered it.
  Fixed — a rung that declares an effort applies it, and a rung that declares
  none drops the inherited one. The deployment consequence is in
  `cordis.patch.yml`: a hand-written provider model needs `reasoningEfforts`
  declared, or pi-ai falls back to the installed catalog, reports no reasoning
  capability at all, and refuses every explicit effort.
- **`run_tests` timeouts kill the direct child, not grandchildren** (marked
  `ponytail:` in `tools.ts`; upgrade path is detached spawn + `kill(-pid)`).
- **"Is a front end watching?" is a heartbeat window, not a connection count.**
  Both halves are TTLs now — the in-UI page's poll and the standalone server's
  SSE ping — and both are checked against `WATCHER_TTL_MS` by
  `test/dashboard.test.ts`, which is what caught the 25s-ping-against-15s-TTL
  bug in §7.3. It is still an approximation: a tab that is open but wedged
  reads as watching for up to one TTL. The upgrade path is a streaming remote
  method that reports attach/detach exactly, which is what
  [`PLAN-close-open-issues.md`](PLAN-close-open-issues.md) §1 already plans for
  the dashboard's own state.
- **`verify.sh` is the model's own gate, and it is weaker than a build.** The
  `fl-live` workspace's gate asserts that a landing page exists and references
  assistant-ui. The first run passed that gate with a page that **would not
  build** — `app/layout.tsx` imported `./globals.css` and no CSS file was ever
  written. The gate is deployment configuration rather than plugin code, but the
  lesson generalises: a gate that checks shape rather than a successful build
  can pass work that does not run. The second run wrote the CSS and builds
  clean, so this is a known weakness of that gate rather than an open bug.
- **A run's own `maxSteps` is per phase, and the model cannot see the ceiling
  it is about to hit.** `maxSteps: 240` gives research 24 steps (a 10% share),
  and both live runs spent 23–24 of them. The run that succeeded did so by
  converging in 23; the detector fired `excessive-steps` as a warning at step 21
  in both. Nothing is wrong here, but a 10% research share on a 240-step budget
  is tight for a research phase that fetches primary sources, and it is
  configuration rather than a defect — recorded so the next tuning starts from
  the measurement rather than from the default.
- **The price table is an estimate.** `mimo-v2.5` runs on a subscription plan,
  so marginal cost is near zero; the rates in `cli.ts` are illustrative and
  exist so the ceiling has something to measure against.

---

## 9. Phase 2 (not started)

1. **Wire real spend into `LoopBudget`.** Price each settled attempt from the
   `agent/request` response usage so the cost ceiling is load-bearing rather
   than decorative. Closes the gap in §8.
2. **Decide the fate of `routing.ts`.** Either collapse the ladder onto
   `model-selection` or document why spec-level escalation is distinct.
3. **Reach `agent/turn-stopping`** so `spec.termination.successCommand` drives
   termination rather than the runner checking it after each step.
4. **Test the plugin path.** `src/plugin.ts` still has no test of its own — it
   carries runtime `@deepseek-ai/dsh-*` imports that no CI install can fetch, so
   the hooks themselves are only reachable locally. §7.1 and §7.2 are the
   evidence that this matters: one wiring bug silently disabled every detector,
   and another left the gate **fail-open** on the irreversible path.

   Three wirings gained coverage on 2026-10-07 (§7.3) by asserting the *shape of
   the source* from a pure test file — comments stripped first, since an
   assertion that reads prose is an assertion about the prose:
   `test/loop-command.test.ts` (the command handler submits a turn),
   `test/subagent.test.ts` (a subagent policy drops only the pipeline), and
   `test/dashboard.test.ts` (the SSE ping refreshes the watcher). That is a
   weaker instrument than a fake context — it cannot catch a bug in a branch it
   does not name — and it is what a file with harness imports allows.

   Still open, and still the highest-value remaining work: a **fake-context
   harness driving the three hooks** (`agent/pre-step`, `agent/request`,
   `tools/pre-execute`) with a stub Agent carrying a real session header. That
   would cover the class §7.3 found three times over — wiring that only shows up
   when the real harness runs it.
5. **Phase 3 — Laya.** Deploy the `systemone` provider in onegw, switch
   `--judge laya`.

---

## 10. Non-goals

- **Not** an agent-teams implementation. Agent Teams
  (`packages/experimental/agent-team`) is an orthogonal axis — parallel peers
  with a mailbox and a task DAG. This package governs **one bounded loop**.
  There is no overlap to consolidate.
- **Not** a general-purpose agent framework. It is deliberately a policy layer
  with a narrow thesis: budget the loop, gate the irreversible, ask the human
  rarely, and know why you stopped.
