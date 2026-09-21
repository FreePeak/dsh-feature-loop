# @freepeak/dsh-feature-loop

A **book-shaped loop** for bug-fixing and small features, built on top of
`@deepseek-ai/dsh-agent-loop` as a vendored fork.

## What it is

This is a DSH plugin that replaces `dsh-agent-loop` with a version that carries
the book's abstractions:

- **8-dimension loop spec** — Goal, Sensor, Controller, Actuator, Feedback,
  Termination, Max steps, Cost budget. All eight are required; a missing one is
  a spec problem, not a model problem.
- **Step and cost ceilings** — `agent/pre-step` reject, enforced BEFORE the
  model call. The thing upstream deliberately does not build.
- **Cheap-first model routing** — start on the cheapest model, escalate only on
  evidence (step count, failures, per-step cost). The book's 52% saving.
- **Review gate** — reversibility-tiered approval gate (read/reversible/irreversible),
  fail-closed by default, matching the book's `ApprovalGate.POLICIES`.
- **Attention router** — the book's `<10% of actions interrupt a human` budget.
  Critical signals always surface; the local judge is rate-capped.
- **Laya local judge** — `POST /v1/systemone` via onegw, score on 0–3 scale.
  Fail-soft: if Laya is unreachable, the loop runs on detectors only.
- **Book prompts** — `BUG_FIX_PROMPT` (6 rules) and `FEATURE_PROMPT` (5 rules),
  verbatim from the playbook.

## Quick start

```bash
cd dsh-feature-loop
node --experimental-strip-types --test test/*.test.ts
# 38 tests, 0 failures
```

## How to install into a DSH profile

```bash
cd /path/to/your/deepseek-harness
dsh plugin --profile my-loop add /Users/linh.doan/work/harvey/freepeak/dsh-feature-loop
```

The `cordis.patch.yml` in this package disables the upstream `agent-loop` row
and inserts this fork's version. When the `spec` config is omitted, upstream
behaviour is reproduced exactly (no ceilings, one route).

## The book mapping

| Book concept | Module | Line of code |
|---|---|---|
| 8-dimension loop spec | `spec.ts` | `LoopSpec` interface |
| "Name the termination" | `spec.ts` | `TerminationSpec.successCommand` |
| "Budget the loop, not the request" | `budget.ts` | `LoopBudget.verdict()` |
| "Route models by step type" | `routing.ts` | `ModelLadder.forStep()` |
| "Ask the human <10% of the time" | `review.ts` | `AttentionRouter.route()` |
| Approval gate (fail-closed) | `review.ts` | `ReviewGate.check()` |
| Tool-cycle detector (threshold 3) | `signals.ts` | `trailingRepeat()` |
| Error-cascade detector (3 consecutive) | `signals.ts` | `detectSignals()` |
| Budget warning (0.8) | `budget.ts` | `warnAt` default |
| Progressive autonomy | `review.ts` | `DEFAULT_GATE_POLICIES` |
| BUG_FIX_PROMPT | `prompts.ts` | `BUG_FIX_RULES` |
| FEATURE_PROMPT | `prompts.ts` | `FEATURE_RULES` |

## The fork delta

All customisations in vendored files are marked with `FORK-DELTA`. To find them:

```bash
grep -rn "FORK-DELTA" src/
```

To sync with upstream:

```bash
bash scripts/sync-upstream.sh /path/to/deepseek-harness
```

The script checks which upstream files have changed and reports the diff. If
upstream changed, re-vendor the files and re-apply the FORK-DELTA edits.

## Architecture

```
dsh-feature-loop/
  src/
    budget.ts          ← step/cost ceilings, USD price table
    routing.ts         ← cheap-first model ladder
    spec.ts            ← the book's 8-dimension loop spec
    signals.ts         ← 6 failure detectors (deterministic, never miss)
    review.ts          ← reversibility gate + attention router
    laya.ts            ← Laya judge via onegw (fail-soft)
    messages.ts        ← budget stop/warn notices
    prompts.ts         ← BUG_FIX_PROMPT / FEATURE_PROMPT
    agent.ts           ← vendored + 8 FORK-DELTA edits
    index.ts           ← vendored + 10 FORK-DELTA edits
    inbox.ts           ← vendored verbatim
    tool-calls.ts      ← vendored verbatim
    runtime-context.ts ← vendored verbatim
    assistant-stream.ts← vendored verbatim
    constants.ts       ← vendored verbatim
    invariant.ts       ← vendored verbatim
  test/
    budget.test.ts     ← 15 tests (budget + routing)
    policy.test.ts     ← 23 tests (spec + signals + review + prompts)
  scripts/
    sync-upstream.sh   ← re-vendor from upstream, report diff
  upstream.lock        ← pinned upstream commit
```

## What you need to build

The pure policy modules (`budget`, `routing`, `spec`, `signals`, `review`,
`prompts`) are fully tested and dependency-free — they work with
`node --experimental-strip-types` alone.

The vendored loop files (`agent.ts`, `index.ts`) import `@deepseek-ai/dsh-*`
packages. To compile and mount the plugin, install the harness deps:

```bash
cd /path/to/deepseek-harness
# In the root, add this package as a workspace dependency:
pnpm add -F . /Users/linh.doan/work/harvey/freepeak/dsh-feature-loop
# Then build:
pnpm build
```

## Phase plan

### Phase 0 — Policy layer (DONE)
- budget.ts, routing.ts, spec.ts, signals.ts, review.ts, prompts.ts
- 38 tests, all passing
- Pure logic, no harness dependency

### Phase 1 — Loop integration (IN PROGRESS)
- Vendor upstream agent-loop, apply FORK-DELTA edits
- Wire budget/routing into preStep and prepareRequest
- Wire metering at the two usage settle sites
- Compile against @deepseek-ai/dsh-* dependencies

### Phase 2 — Review gate integration
- Wire signals at preStep (deterministic)
- Wire Laya judge (async, at preStep when not rate-capped)
- Wire `ctx.approval.request()` for blocking reviews
- "Jump into review any step" via operator request

### Phase 3 — MVP demo
- Bug fix loop: write failing test → confirm → minimal fix → run all tests
- Feature loop: read architecture → follow patterns → add tests → update docs
- End-to-end in the DSH loop with budget ceilings active
- Laya routes your attention to the 2-3 steps worth reviewing
