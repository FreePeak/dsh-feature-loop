<img src="assets/logo.svg" alt="dsh-feature-loop" width="344" height="80">

# @freepeak/dsh-feature-loop

[![CI](https://github.com/FreePeak/dsh-feature-loop/actions/workflows/ci.yml/badge.svg)](https://github.com/FreePeak/dsh-feature-loop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](.nvmrc)
[![Tests](https://img.shields.io/badge/tests-126%20passing-brightgreen.svg)](#quick-start)

A **book-shaped loop** for bug-fixing and small features: budget ceilings,
cheap-first routing, a step-level review gate, and a local judge that decides
which steps are worth your attention.

Built on `@deepseek-ai/dsh-agent-loop` as a vendored fork, plus a standalone
runner that exercises the same policies without a harness build.

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

| | Standalone runner (`src/runner.ts`, `src/cli.ts`) | DSH plugin (`src/agent.ts`, `src/index.ts`) |
|---|---|---|
| Transport | `src/llm.ts` → onegw | harness `llm` service |
| Budget ceilings | ✅ wired | ✅ wired |
| Cheap-first ladder | ✅ wired | ✅ wired |
| Metering | ✅ wired | ✅ wired |
| Signals | ✅ wired | ✅ wired (`preStep`) |
| Review gate | ✅ wired | ✅ wired, one step late (see below) |
| Judge | ✅ wired | ✅ wired (`preStep`, awaited) |
| Operator review | ✅ wired (blocks) | ✅ surfaces as a notice |

**One honest difference.** In the plugin path a review is *surfaced*, not
*enforced*: it arrives as a labelled notice in the step's message batch, which is
the channel that reaches both the model and the human reading the transcript.
`{kind:'reject'}` stays reserved for a ceiling, where continuing would spend
money the deployment already said it would not.

The gate specifically is consulted from `executeToolCalls` rather than `preStep`,
because `preStep` runs *before* the model has chosen a tool — there is no tool
name to classify yet. That means a gate-raised review is delivered one step late,
after the tool has already run. It is marked `ponytail:` in `agent.ts` with its
upgrade path: a `tools/pre-execute` listener registered where the loop context is
built, which can deny the call before dispatch. Dropping the call here instead
would leave the assistant's tool-call block with no `tool/result` behind it,
which invalidates session replay.

`tools/execute` — where the gate conceptually belongs — is dispatched one layer
below this file inside `@deepseek-ai/dsh-tools`, and `agent.ts` has no view of it.

---

## Architecture

```
src/
  spec.ts        the book's 8 dimensions, validated at load
  budget.ts      step/cost ceilings, USD price table, unpriced-step tracking
  routing.ts     cheap-first ladder, escalation on evidence
  signals.ts     6 deterministic detectors — cycle, cascade, dominance, budget, steps, quality
  review.ts      reversibility gate + attention router (<10% budget)
  agent-policy.ts the plugin agent's decisions, extracted so they are testable
  judge.ts       chat judge (works anywhere)
  laya.ts        Laya judge via onegw /v1/systemone (the intended production path)
  messages.ts    notice text, wrapped for both DSH and OpenAI-shaped transports
  prompts.ts     BUG_FIX_PROMPT / FEATURE_PROMPT / REFACTOR_PROMPT
  runner.ts      the standalone loop: spec → budget → route → judge → review → model → tools
  llm.ts         OpenAI-compatible client + scripted client for tests
  tools.ts       sandboxed read/write/edit/list/run_tests, path-confined
  cli.ts         the demo entry point
  agent.ts       vendored upstream + FORK-DELTA
  index.ts       vendored upstream + FORK-DELTA
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

## Fork delta

Every customisation in vendored code is marked `FORK-DELTA`:

```bash
grep -rn "FORK-DELTA" src/          # 35 markers: 18 in agent.ts, 12 in index.ts, 5 in tool-calls.ts
bash scripts/sync-upstream.sh       # diff against the pinned upstream commit
```

`upstream.lock` pins `c291e796` (v0.1.5-rc.2).

Two genuine bugs were found and fixed while compiling the fork against the real
harness packages:

- `import { FiberState } from '@deepseek-ai/cordis'` was a hard `SyntaxError` —
  cordis declares it as an ambient `const enum` with no runtime export. It only
  works upstream because the bundler inlines the values. (Inherited from upstream.)
- `this.policy` read inside a `function*` generator was `undefined` at runtime,
  so the fork's fifth constructor argument never reached the agent.

---

## Known limits

- **`src/index.ts` is not loadable under `--experimental-strip-types`** —
  `agent.ts`, `assistant-stream.ts` and `inbox.ts` use parameter properties,
  which strip-types rejects. The policy modules and the runner are unaffected.
  Converting them would break byte-identity with upstream, so it is deferred.
- **The DSH plugin path needs a build.** It imports `@deepseek-ai/dsh-*`; the
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
  the gate are read by `agent.ts`; reviews surface as notices. The decisions live
  in `agent-policy.ts` (27 tests) because `agent.ts` cannot be imported by a test
  at all — it inherits upstream's parameter properties, which
  `--experimental-strip-types` rejects. Blocking approval via `tools/pre-execute`
  is the remaining refinement (see the `ponytail:` note).
- **Phase 3 — Laya** ⬜ deploy the `systemone` provider in onegw, switch `--judge laya`

### Verifying the whole thing

```bash
node --experimental-strip-types --test test/*.test.ts   # 126 pass
node /Users/linh.doan/.npm/_npx/a322a253dbd59f36/node_modules/typescript/lib/tsc.js --noEmit   # clean
bash demo/run.sh                                        # goal-met
grep -rn "FORK-DELTA" src/ | wc -l                      # 35 markers
```

### Two gaps closed while wiring Phase 2

- **`error-cascade` could not fire in the plugin path.** `StepObservation.error`
  was never populated: per-call `isError` was internal to `tool-calls.ts` and
  thrown away at the `executeToolCalls` boundary. Since `error-cascade` is one of
  only two *critical* signals, the plugin gate was silently running on four
  detectors instead of six. `executeToolCalls` now returns per-call outcomes
  (`FORK-DELTA(6)`) and the step's observation learns the result.
- **`tool-dominance` fired on step 1.** At one or two steps every tool is
  trivially 100% of all steps, so the detector fired on the first step of every
  run — a signal that always fires is noise that trains its reader to ignore the
  real ones. It now needs a five-step floor before it is allowed to speak.
