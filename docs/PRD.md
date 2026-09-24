# PRD — `@freepeak/dsh-feature-loop`

**Status:** Phase 2 in progress — native DSH goals, verified completion, and durable queue foundations are implemented and tested.
**Owner:** Linh Doan
**Last updated:** 2026-09-22

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
- **Spend is observed per DSH turn.** The plugin prices settled successful and
  retry attempts from the durable Session log through `TurnRunRegistry`, including
  route attribution and unpriced-attempt counts. `LoopBudget` remains the
  standalone runner's policy primitive.
- **`run_tests` timeouts kill the direct child, not grandchildren** (marked
  `ponytail:` in `tools.ts`; upgrade path is detached spawn + `kill(-pid)`).
- **The price table is an estimate.** `mimo-v2.5` runs on a subscription plan,
  so marginal cost is near zero; the rates in `cli.ts` are illustrative and
  exist so the ceiling has something to measure against.

---

## 9. Phase 2 (in progress)

1. **Done — real spend.** The plugin binds `TurnRunRegistry` to the live
   Session, replays it on resume, records final and retry attempts, and writes a
   non-zero cost to run history. The tiny-budget integration case blocks the
   second model request.
2. **Done — native `/loop`.** The command creates a DSH goal through the goal
   service. The goal-round driver owns continuation; the command never submits a
   synthetic composer turn.
3. **Done — verified completion.** `update_goal(action="complete")` is denied
   before DSH commits it unless the configured verifier exits cleanly. The
   verifier runs through the DSH shell and effective sandbox workspace.
4. **Done — integration and HITL evidence.** The real DSH tool pipeline has 14
   integration cases, including approval, dashboard delegation, native goal
   creation, final-turn spend, and budget blocking. A live isolated Web profile
   also completed a native goal with `onegw/execution` and recorded non-zero
   spend.
5. **In progress — queue and campaign flow.** `FeatureQueue` now provides a
   durable JSONL log, single-writer locking, fencing claim IDs, campaign
   reservations, human-waiting transitions, pinned base commits, and symlink-safe
   worktree admission. PR creation and merge remain intentionally outside the
   queue until Git commands have their own audited runner boundary.
6. **Next — decision on `routing.ts`.** Collapse the ladder onto DSH model
   selection or document why spec-level escalation remains distinct.

The queue is deliberately admission-only: it does not execute Git, create
worktrees, open PRs, or merge. Those operations need a separate command gate and
must never be implied by a queue record.

---

## 10. Non-goals

- **Not** an agent-teams implementation. Agent Teams
  (`packages/experimental/agent-team`) is an orthogonal axis — parallel peers
  with a mailbox and a task DAG. This package governs **one bounded loop**.
  There is no overlap to consolidate.
- **Not** a general-purpose agent framework. It is deliberately a policy layer
  with a narrow thesis: budget the loop, gate the irreversible, ask the human
  rarely, and know why you stopped.
