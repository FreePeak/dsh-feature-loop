<img src="assets/logo.svg" alt="dsh-feature-loop" width="344" height="80">

# @freepeak/dsh-feature-loop

[![CI](https://github.com/FreePeak/dsh-feature-loop/actions/workflows/ci.yml/badge.svg)](https://github.com/FreePeak/dsh-feature-loop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](.nvmrc)
[![Tests](https://img.shields.io/badge/tests-126%20passing-brightgreen.svg)](#quick-start)

A **book-shaped policy layer** for bug-fixing and small features: budget
ceilings, cheap-first routing, a step-level review gate, and a local judge that
decides which steps are worth your attention.

Hosted on `@deepseek-ai/dsh-agent-loop`'s own extension points
(`agent/pre-step`, `agent/request`, `tools/pre-execute`) rather than forking it,
plus a standalone runner that exercises the same policies without a harness
build.

> **De-forked.** This package used to vendor a copy of the agent loop. It no
> longer does — the harness publishes an extension point for every policy this
> package adds, so ~3,064 lines of forked code were removed and replaced by
> `src/plugin.ts`. See [`docs/PRD.md`](docs/PRD.md) for the audit and the
> acceptance criteria.

---

## The demo works

```
$ bash demo/run.sh
...
── step 10 · xiaomi/mimo-v2.5 · spent $0.0044
[signal:critical] error-cascade — 3 consecutive failing steps — the first failure is the one to read
[review] ASK HUMAN via signal — 3 consecutive failing steps — the first failure is the one to read

── step 12 · xiaomi/mimo-v2.5 · spent $0.0047
[judge] review-worthiness 0/3
[model] 3 failures, all in the `percentile` method. The doc comment says nearest-rank uses
        `ceil(p/100*n) - 1`, but the code uses `Math.floor((p/100) * n)`. These differ when
        `p/100*n` is an integer — `floor` gives that index, but `ceil(n)-1` gives one before.
[review] ASK HUMAN via policy — edit_file: reversible-write below the confidence bar (0.00 < 0.70)
[tool] edit_file (reversible-write) ok — Replaced 1 occurrence in src/latency-window.ts at line 88
[check] GOAL MET

[run-end] goal-met · 12 steps · $0.0066 · 1 review(s) (8% of steps)
```

The loop read the bug report, found the root cause in the source, was stopped for
review twice (once by a critical signal, once by the write gate), made a one-line
fix, and proved it with the test suite. Full transcript in `demo/TRANSCRIPT.txt`.

Two details worth noticing. The loop **diagnosed the bug precisely** — it read
the module's doc comment, compared the stated formula against the code, and
identified the exact condition under which they diverge. And the gate held it at
the write: the judge scored the step `0/3`, which is below the confidence bar, so
the gate asked instead of assuming. That is the fail-closed direction working,
even though the judge's score was itself wrong.

### Verified runs

All three terminal paths, against the real model through onegw:

| Command | Outcome | Steps | Cost | Reviews |
|---|---|---|---|---|
| `bash demo/run.sh` | `goal-met` | 12 of 15 | $0.0066 | 1 (8%) |
| `bash demo/run.sh --max-steps 5` | `budget-stop` (step ceiling) | 5 of 5 | $0.0039 | 1 (20%) |
| `bash demo/run.sh --budget 0.00001` | `budget-stop` (cost ceiling) | 2 of 10 | $0.0002 | 0 |

The step-ceiling run stops at 5 without spending a sixth call — the ceiling is a
limit, not an invoice. The cost-ceiling run stops after 2 steps because the
budget was $0.00001 and it had already spent $0.000232.

Repeat runs land between 9 and 12 steps and **8–20% review rate**, depending on
whether an error cascade happens to trip. The book's target is <10%; critical
signals are deliberately not rate-limited, so a run with a cascade will exceed it
and that is the intended behaviour, not a miss.

---

## Quick start

```bash
# 126 tests, no network, no model call — the policy layer is pure
node --experimental-strip-types --test test/*.test.ts

# the end-to-end demo (needs onegw on :8080 and xiaomi/mimo-v2.5)
bash demo/run.sh

# watch the ceilings actually fire
bash demo/run.sh --max-steps 6        # step ceiling
bash demo/run.sh --budget 0.000001    # cost ceiling
bash demo/run.sh --judge none         # detectors only, no judge
```

`demo/run.sh` resets the planted bug first, so every run has real work to do.

### Installing it into DSH

To run the plugin inside a real harness profile — including alongside Agent
Teams — follow **[`docs/SETUP.md`](docs/SETUP.md)**. It covers the build, a
scratch profile, the cordis patch, and a small task that makes the ceilings and
the review gate visibly fire, plus the failure modes people actually hit.

```bash
pnpm build                                       # the harness loads built JS, not .ts
dsh plugin --profile <name> add -w file:$PWD     # `-w` is required for a profile
dsh --profile <name> --dump-config | grep -A8 feature-loop   # verify composition
```

The audit behind the current design is in **[`docs/PRD.md`](docs/PRD.md)**.

---

## The book mapping

| Book concept | Module | Where |
|---|---|---|
| 8-dimension loop spec | `spec.ts` | `LoopSpec` — all 8 required, validated at load |
| "Name the termination" | `spec.ts` | `TerminationSpec.successCommand` |
| "Budget the loop, not the request" | `budget.ts` | `LoopBudget.verdict()` |
| "Route models by step type" | `routing.ts` | `ModelLadder.forStep()` |
| "Ask the human <10% of the time" | `review.ts` | `AttentionRouter.route()` |
| Approval gate, tiered by reversibility | `review.ts` | `ReviewGate.check()` |
| Tool-cycle detector (threshold 3) | `signals.ts` | `trailingRepeat()` |
| Error-cascade detector (3 consecutive) | `signals.ts` | `detectSignals()` |
| Budget warning (0.8) | `budget.ts` | `warnAt` default |
| Progressive autonomy | `review.ts` | `DEFAULT_GATE_POLICIES` |
| `BUG_FIX_PROMPT` (6 rules) | `prompts.ts` | `BUG_FIX_RULES` |
| `FEATURE_PROMPT` (5 rules) | `prompts.ts` | `FEATURE_RULES` |
| "Separate success from stopping" | `runner.ts` | success check after every step |

Every threshold is quoted from the playbook in `BOOK_THRESHOLDS`, because a
threshold with no provenance is a number someone liked.

---

## Two paths, one policy layer

The policies are shared. Only transport and session state differ.

| | Standalone runner (`src/runner.ts`, `src/cli.ts`) | DSH plugin (`src/plugin.ts`) |
|---|---|---|
| Transport | `src/llm.ts` → onegw | harness `llm` service |
| Budget ceilings | ✅ wired | ✅ wired (`agent/pre-step`, `reject`) |
| Cheap-first ladder | ✅ wired | ✅ wired (`agent/request`) |
| Metering | ✅ wired | ⚠️ see "Known limits" |
| Signals | ✅ wired | ✅ wired (`agent/pre-step`) |
| Review gate | ✅ wired (blocks) | ✅ wired (`tools/pre-execute`, **denies**) |
| Judge | ✅ wired | ✅ wired (`agent/pre-step`, awaited) |
| Operator review | ✅ wired (blocks) | ✅ surfaces as a notice |

**The gate now denies before dispatch.** This used to be the one honest
difference between the two paths, and it was a defect: the old fork consulted the
gate from its own copy of `executeToolCalls`, so a gate-raised review arrived
*one step late* — after the tool had already run. The fork's README filed
blocking approval as an unfinished refinement.

Hosting on the harness closed it. `tools/pre-execute` is a first-class
pre-dispatch hook returning `PreToolDecision` (`allow` / `deny` / `ask`), so the
plugin can deny the call *before* it is dispatched:

```ts
ctx.on('tools/pre-execute', async ({ agent, name }, next) => {
  const gate = gateForTool(policyFor(agent), name)
  if (gate.allowed) return next()
  return { kind: 'deny', reason: gate.notice }   // answered, not dropped
})
```

A denied call is **answered**, not dropped: the assistant's tool-call block must
receive a result or session replay is invalidated. `deny` materializes a tool
error the model can read and react to.

---

## Architecture

```
src/
  ── the product: pure policy, no harness import ──
  spec.ts        the book's 8 dimensions, validated at load
  budget.ts      step/cost ceilings, USD price table, unpriced-step tracking
  routing.ts     cheap-first ladder, escalation on evidence
  signals.ts     6 deterministic detectors — cycle, cascade, dominance, budget, steps, quality
  review.ts      reversibility gate + attention router (<10% budget)
  agent-policy.ts the plugin agent's decisions, extracted so they are testable
  judge.ts       chat judge (works anywhere)
  laya.ts        Laya judge via onegw /v1/systemone (the intended production path)
  messages.ts    notice text; imports nothing, which keeps the test suite runnable
  prompts.ts     BUG_FIX_PROMPT / FEATURE_PROMPT / REFACTOR_PROMPT

  ── the harness host ──
  plugin.ts      agent/pre-step · agent/request · tools/pre-execute

  ── the standalone proof: the same policies, no harness ──
  runner.ts      spec → budget → route → judge → review → model → tools
  llm.ts         OpenAI-compatible client + scripted client for tests
  tools.ts       sandboxed read/write/edit/list/run_tests, path-confined
  cli.ts         the demo entry point
demo/
  src/latency-window.ts   the planted bug (nearest-rank off-by-one)
  test/                  14 tests, 3 of which fail on the bug
  README.md              the bug report the loop is given
  verify.sh              exit 0 = goal met
  reset.sh               re-plant the bug
  run.sh                 reset + run, one command
  TRANSCRIPT.txt         a captured successful run
```

---

## The judge

The router's question — "does this step deserve a human's eyes?" — is a
classification, so it has three implementations behind one interface:

| Judge | Cost | Latency | Status |
|---|---|---|---|
| `OnegwJudge` (Laya) | $0, local | ~73 ms warm | client ready; **Laya is not deployed in onegw here** |
| `ChatJudge` | metered | ~10–40 s | **what the demo uses** |
| `NO_JUDGE` | $0 | 0 | detectors-only, a supported mode |

The demo uses `ChatJudge` with `xiaomi/mimo-v2.5` because no `systemone` provider
is configured in `~/.onegw/onegw.toml`. Two measured facts argue for Laya beyond
cost:

1. **A reasoning model is a poor judge.** `mimo-v2.5` always thinks; at
   `max_tokens: 256` it returns `finish_reason: "length"` with empty content, and
   it needs ~859 thinking tokens before emitting one digit. The default is now
   2048, and the error message names the cause instead of saying "no digit".
2. **It is miscalibrated.** Asked about a routine `read_file` with no detector
   fired, it answered `SCORE=3` — the top of the scale. A purpose-built decision
   engine is the right tool; a general chat model is a fallback.

To use Laya once deployed: `--judge laya`.

---

## Fork delta — removed

This package used to vendor nine files from `@deepseek-ai/dsh-agent-loop` and
mark every customisation `FORK-DELTA` (35 markers), pinned via `upstream.lock`
to `c291e796` (v0.1.5-rc.2) and reconciled by `scripts/sync-upstream.sh`.

**All of that is gone.** The harness publishes an extension point for every
policy this package adds, so the vendored loop, the sync script, the lock and
`cordis.patch.yml` were deleted and replaced by `src/plugin.ts`.

| Removed | Lines | Upstream diff |
|---|---|---|
| `src/agent.ts` | 968 | 364 changed lines |
| `src/index.ts` | 1069 | 222 changed lines |
| `src/tool-calls.ts` | 328 | 46 changed lines |
| `src/inbox.ts` | 247 | 7 changed lines |
| `src/runtime-context.ts` | 159 | **0 — byte-identical** |
| `src/assistant-stream.ts` | 140 | **0 — byte-identical** |
| `src/constants.ts` | 6 | **0 — byte-identical** |
| `src/invariant.ts` | 65 | **0 — byte-identical, imported by nothing** |
| `src/notices.ts` | 82 | wrapper for the vendored `inbox.ts` |
| `scripts/sync-upstream.sh`, `upstream.lock`, `cordis.patch.yml` | 140 | fork machinery |

≈3,064 lines out, one 368-line plugin in. The full audit is in
[`docs/PRD.md`](docs/PRD.md).

Two genuine bugs were found in the fork while it existed, both now moot:

- `import { FiberState } from '@deepseek-ai/cordis'` was a hard `SyntaxError` —
  cordis declares it as an ambient `const enum` with no runtime export. It only
  works upstream because the bundler inlines the values. (Inherited from upstream.)
- `this.policy` read inside a `function*` generator was `undefined` at runtime,
  so the fork's fifth constructor argument never reached the agent.

---

## Known limits

- **`src/plugin.ts` is not typechecked in CI.** It imports `@deepseek-ai/dsh-*`
  at versions CI cannot resolve (there is no lockfile, and
  `@deepseek-ai/cordis@0.4.0` has no published version). It is typechecked
  locally against the prebuilt packages.
- **Spend is observed, not metered by the plugin.** `LoopBudget.spend()` must be
  called with real usage for the cost ceiling to mean anything; the plugin
  currently reads spend from the budget snapshot rather than pricing each settled
  attempt. **This is the largest correctness gap** and is Phase 2 work.
- **The plugin path needs a build.** It imports `@deepseek-ai/dsh-*`; the
  standalone runner does not.
- **Review rate is 20% in the demo, not the book's <10%.** Critical signals are
  deliberately not rate-limited — safety is not subject to an attention budget —
  so a run with an error cascade will exceed the target. The budget governs
  judge-driven reviews only.
- **`run_tests` timeouts kill the direct child, not grandchildren** (marked
  `ponytail:` in `tools.ts`; upgrade path is detached spawn + `kill(-pid)`).
- **The price table is an estimate.** `mimo-v2.5` runs on a subscription plan,
  so marginal cost is near zero; the rates in `cli.ts` are illustrative and
  exist so the ceiling has something to measure against.

---

## Phase status

- **Phase 0 — policy layer** ✅ 126 tests, pure, no harness dependency
- **Phase 1 — loop integration** ✅ runner + CLI + tools + demo, working end to end
- **Phase 1b — plugin compiles** ✅ `tsc --noEmit` clean against prebuilt `@deepseek-ai/dsh-*`
- **Phase 2 — plugin review gate** ✅ all six detectors, the judge, the router and
  the gate are read by `src/plugin.ts`; the gate **denies before dispatch**.
- **Phase 1c — de-fork** ✅ the vendored loop is gone; the policies are hosted on
  `agent/pre-step` / `agent/request` / `tools/pre-execute`. See
  [`docs/PRD.md`](docs/PRD.md).
- **Phase 2b — real spend accounting** ⬜ price each settled attempt into
  `LoopBudget` so the cost ceiling is load-bearing (the largest open gap).
- **Phase 3 — Laya** ⬜ deploy the `systemone` provider in onegw, switch `--judge laya`

### Verifying the whole thing

```bash
node --experimental-strip-types --test test/*.test.ts   # 126 pass
node /Users/linh.doan/.npm/_npx/a322a253dbd59f36/node_modules/typescript/lib/tsc.js --noEmit   # clean
bash demo/run.sh                                        # goal-met
grep -rn "FORK-DELTA" src/ | wc -l                      # 0 — the fork is gone
```

### Three gaps closed along the way

- **The gate was one step late.** The fork consulted its gate from its own copy of
  `executeToolCalls`, so a gate-raised review arrived after the tool had already
  run. Hosting the gate on `tools/pre-execute` denies the call before dispatch —
  the fix the fork could not reach without forking.
- **`error-cascade` could not fire in the plugin path.** `StepObservation.error`
  was never populated: per-call `isError` was internal to `tool-calls.ts` and
  thrown away at the `executeToolCalls` boundary. Since `error-cascade` is one of
  only two *critical* signals, the plugin gate was silently running on four
  detectors instead of six. `plugin.ts` records the outcome from the tool
  boundary, so the step's observation learns the result.
- **`tool-dominance` fired on step 1.** At one or two steps every tool is
  trivially 100% of all steps, so the detector fired on the first step of every
  run — a signal that always fires is noise that trains its reader to ignore the
  real ones. It now needs a five-step floor before it is allowed to speak.
