<img src="assets/logo.svg" alt="dsh-feature-loop" width="344" height="80">

# @freepeak/dsh-feature-loop

[![CI](https://github.com/FreePeak/dsh-feature-loop/actions/workflows/ci.yml/badge.svg)](https://github.com/FreePeak/dsh-feature-loop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](.nvmrc)
[![Tests](https://img.shields.io/badge/tests-296%20passing-brightgreen.svg)](#quick-start)

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
# 296 tests, no network, no model call — the policy layer is pure
node --experimental-strip-types --test test/*.test.ts

# the end-to-end demo (needs onegw on :8080 and xiaomi/mimo-v2.5)
bash demo/run.sh

# watch the ceilings actually fire
bash demo/run.sh --max-steps 6        # step ceiling
bash demo/run.sh --budget 0.000001    # cost ceiling
bash demo/run.sh --judge none         # detectors only, no judge
```

`demo/run.sh` resets the planted bug first, so every run has real work to do.

### Running it

**Docker (recommended)** — one command, no toolchain, approval panel working:

```bash
make up          # build, start, and print the URL + token
make help        # all targets
```

`make up` picks the gateway key up from `~/.dsh/.credentials.yaml` when it is not
in the environment. Without make:

```bash
ONEGW_API_KEY=sk-... docker compose -f docker/docker-compose.yml up -d --build
docker compose -f docker/docker-compose.yml logs -f   # the URL + token
```

It installs the harness CLI and its bundles from npm (no monorepo build), builds
only this plugin, and pins the permission preset that makes the approval panel
appear. See **[`docker/README.md`](docker/README.md)** — including the two hosts
DSH refuses to bind, and the small relay that resolves it.

### Installing it into DSH by hand

To run the plugin inside a local harness profile — including alongside Agent
Teams — follow **[`docs/SETUP.md`](docs/SETUP.md)**. It covers the build, a
scratch profile, the cordis patch, and a small task that makes the ceilings and
the review gate visibly fire, plus the failure modes people actually hit.

```bash
pnpm build                                       # the harness loads built JS, not .ts
dsh plugin --profile <name> add -w file:$PWD     # `-w` is required for a profile
dsh --profile <name> --dump-config | grep -A8 feature-loop   # verify composition
```

Once it is running, a gated step **prompts you in the browser**: the composer
shows the reason with **Reject** / **Allow once**, and your answer decides
whether the tool runs. **This has been observed end to end** — a real browser
rendered this plugin's own `REVIEW REQUESTED` reason, **Allow once** wrote the
file, and **Reject** on the same prompt wrote nothing:
[`docs/VERIFY-E2E-APPROVAL.md`](docs/VERIFY-E2E-APPROVAL.md). You are not writing that UI — it ships with DSH as
`@deepseek-ai/dsh-client-ui-approval`; the plugin's job is to emit `ask` so it
gets reached.

- **[`docs/SETUP.md`](docs/SETUP.md)** — install and drive it end to end.
- **[`docs/RUNBOOK-SERVER.md`](docs/RUNBOOK-SERVER.md)** — the verified live
  server: an acceptance checklist, the boot command, the URL, and the
  permission-preset trap that silently disables the approval prompt.
- **[`docs/PRD.md`](docs/PRD.md)** — the audit behind the current design.
- **[`docs/VERIFY-APPROVAL.md`](docs/VERIFY-APPROVAL.md)** — independent
  verification of all five approval outcomes, with file:line evidence.
- **[`docs/VERIFY-INTEGRATION.md`](docs/VERIFY-INTEGRATION.md)** — the same
  five outcomes executed in a **real** DSH context (5/5 pass), plus the exact
  string the approval panel renders.
- **[`docs/VERIFY-DASHBOARD.md`](docs/VERIFY-DASHBOARD.md)** — the approval
  dashboard: 194 unit + 11 integration green, a live HTTP transcript (page 200,
  token 401, approve → `allowed-once`, 409, 403), the browser click verified
  via `make e2e-dashboard`, and the model-authored review brief.
- **[`docs/VERIFY-E2E-APPROVAL.md`](docs/VERIFY-E2E-APPROVAL.md)** — a real
  browser on the containerised deployment: the panel appears with this plugin's
  reason, **Allow once** writes the file, **Reject** blocks it.
- **[`docker/README.md`](docker/README.md)** — the one-command container run.

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
| Review gate | ✅ wired (blocks) | ✅ wired (`tools/pre-execute`, **asks**) |
| Human approval in the browser | ➖ console prompt | ✅ Web UI composer prompt |
| HITL approval dashboard | ➖ | ✅ optional loopback web page: pending cards, live run state, Allow/Reject (`dashboard:` config) |
| Judge | ✅ wired | ✅ wired (`agent/pre-step`, awaited) |
| Operator review | ✅ wired (blocks) | ✅ prompts, then blocks |

**The gate is decided before dispatch, and a human answers it in the browser.**
This used to be the one honest difference between the two paths, and it was a
defect: the old fork consulted the gate from its own copy of
`executeToolCalls`, so a gate-raised review arrived *one step late* — after the
tool had already run. The fork's README filed blocking approval as an unfinished
refinement.

Hosting on the harness closed it. `tools/pre-execute` is a first-class
pre-dispatch hook returning `PreToolDecision` (`allow` / `deny` / `ask`):

```ts
ctx.on('tools/pre-execute', async ({ agent, name }, next) => {
  const gate = gateForTool(policyFor(agent), name)
  if (gate.kind === 'proceed') return next()
  return { kind: 'ask', reason: gate.reason }   // answered, not dropped
})
```

`ask` routes to the deployment's approval channel — in the Web UI, the
conversation composer prompt from `@deepseek-ai/dsh-client-ui-approval`. You
approve and the tool dispatches; you reject and the model is told a human said
no. The plugin's job ends at emitting the decision; the harness
(`serviceAsk` in `@deepseek-ai/dsh-tools`) maps the outcome to allow or deny.

A blocked call is **answered**, not dropped: the assistant's tool-call block must
receive a result or session replay is invalidated. `deny` materializes a tool
error the model can read and react to.

### `gateMode` — how the human is asked

| Mode | Behaviour | Use it for |
|---|---|---|
| `ask` *(default)* | Prompts the approval channel. Fails closed to a refusal when none is mounted, or the outcome is `unavailable`. | Interactive Web UI sessions |
| `deny` | Refuses outright, never prompts. | Unattended runs and CI |

`ask` is the default because it **degrades to exactly `deny`** when there is no
approval channel — it is strictly more capable without being less safe. Set
`deny` when no human is watching.

```yaml
- id: feature-loop
  config:
    gateMode: ask          # or: deny (CI / unattended)
```

### The approval dashboard

Besides the composer prompt, the plugin can host its own **loopback web page**
(`src/dashboard.ts` + `src/dashboard-page.ts`, Node builtins only; the UI is a
vendored React bundle built from `web/app.tsx` with **assistant-ui**): pending
approval cards carrying
the gate's `REVIEW REQUESTED` reason with
**Allow once** / **Reject**, the live run state (step vs ceiling, spend, ladder
route, judge score, signals) over SSE, and an activity feed of gate decisions
and approval outcomes. A per-response nonce CSP (`default-src 'none'`,
`frame-ancestors 'none'`) states the posture: the page runs its own script
and style and nothing else.

```yaml
- id: feature-loop
  config:
    dashboard:
      enabled: true            # start the server; omitted = composer only
      # host: 127.0.0.1        # 127.0.0.1 | 0.0.0.0 — the closed set
      # port: 8100             # Docker: 0.0.0.0:8100 in-container,
      #                        # published as 127.0.0.1:3092 (loopback only)
      # answers: true          # false = observe only, composer keeps answering
      # answerTimeoutMs: 600000   # a pending ask fails closed after this
      # brief:                 # model-authored review brief, off by default
      #   enabled: false
      #   model: xiaomi/mimo-v2.5   # required when enabled
      #   maxTokens: 1024
      #   timeoutMs: 15000
```

`make up` prints the URL + token (`make dashboard` reprints it): the token is
generated per boot and required on every request. An existing Docker volume
seeded before this feature needs `FORCE_REINIT=1 make up` to pick the row up.

### The optimize block — refinement passes from measured history

`optimize:` sits beside the spec and changes nothing when omitted. When present
it is validated at load (a `loops: 30` stops the plugin from loading, naming
the field and the 3–10 band):

```yaml
- id: feature-loop
  config:
    optimize:
      loops: 3              # refinement passes, integer 3–10 (CLI `runRefined` only)
      derive: true          # accepted; the CLI's `--derive` derives envelopes, the plugin records the history they come from
      history: .feature-loop/runs.jsonl   # run-history file: the plugin appends one line per closed turn and feeds Metrics from it
      # judge: chat         # none | chat | laya — who scores across passes (CLI only)
      # totalBudgetUSD: 3.00  # refinement budget; default derived × loops × 0.6 (CLI only)
```

Two halves, split where they belong:

- **The CLI derives and advises.** Every CLI run appends one line to the
  history file (JSONL, Node builtins only). With `--derive`, the next run's
  envelope (`maxSteps`, `costBudgetUSD`) is the P95 of *this goal's* recorded
  runs plus 30% headroom — an explicit `--max-steps`/`--budget` is a pin and is
  never overridden, and the configured budget is a cap the derivation may
  tighten but never raise. The run then prints its Metrics roll-up and the
  judge's proposals. With too little history (under five usable runs) nothing
  is applied — a floor is not a measurement. Every number's provenance is
  printed.
- **The plugin records and rolls up.** On `session/event` `turn/end` — the
  exactly-once run seam, which a pre-step reject also closes through — the
  plugin appends one record built from metered numbers only (budget snapshot
  for steps/cost/unpriced steps, `latencyKind: 'round-trip'`), then refreshes
  the dashboard's **Metrics** panel from the file. The judge battery is
  deliberately NOT asked on this path: one hot-path event must stay cheap, so
  **Optimizations** proposals stay a CLI affair until a cheaper cadence exists.
  Records are written whether or not the dashboard page is up, so a headless
  deployment with `history:` still learns.

Proposals are display only — applying one means copying its snippet by hand;
there is deliberately no endpoint that lets the judge loosen its own ceilings.
`loops`/`totalBudgetUSD` are validated at load but consumed only by the CLI's
`runRefined`: iteration belongs to the caller, not to a step waterfall, so a
plugin config that granted passes from inside a hook would be a timeout wearing
a feature hat.

**The guard is the safety property.** The dashboard's answerer is registered
ahead of every other `approval/request` listener — required, because the
harness's remote forwarder holds the request without calling `next()` while a
Web UI tab is attached — but it *claims* a request only while a dashboard tab
is actually connected. No tab → it delegates, and the composer answers exactly
as before this feature existed. Every failure path (last tab closed, ask
withdrawn, timeout, shutdown) settles the pending ask `unavailable`, which the
harness maps to a refusal. Verified at every level including the browser click:
[`docs/VERIFY-DASHBOARD.md`](docs/VERIFY-DASHBOARD.md).

**The UI is assistant-ui; the decision is still ours.** The dashboard renders
through [assistant-ui](https://github.com/assistant-ui/assistant-ui): pending
asks become tool-call message parts carrying an approval gate, and
`onRespondToToolApproval` is the single callback that turns a click into a
request. That callback posts to this plugin's own guarded endpoint
(`POST /api/approvals/:id`) — the same endpoint, token, and fail-closed
behaviour the composer path uses. assistant-ui decides *how* a decision is
asked for; it never decides *whether* one is valid.

The mapping lives in `src/approval-bridge.ts`, which imports nothing at all so
it can be tested in CI's no-install job. It is deliberately narrow: only
`allow-once` and `reject-once` are offered, never `allow-always`/`reject-always`,
because a browser click must not widen the deployment's gate — that is what
`gatePolicies` and `actuator` are for. An unknown option throws rather than
resolving to an authorisation.

**The review brief is purely advisory.** With `brief.enabled`, each claimed ask
also kicks off a model call that authors plain prose (`src/brief.ts`), shown
inside the card. There is no model-authored component language any more — with
OpenUI the model emitted component calls and a parser-plus-allowlist made that
survivable; assistant-ui has no such language, so what remains is the part that
was always load-bearing: **bounds**. A brief is capped by node count, list
length, per-string length, and total size, and one that exceeds any cap is
rejected whole rather than truncated — a half-rendered brief reads as a
complete one, which is the failure that matters when the text is what a human
decides on. The brief never blocks, delays, or settles the ask: it resolves to
a card, to "brief unavailable", or to nothing at all.

**The vendored bundle is auditable and offline.** `web/build.mjs` emits
`assets/assistant-ui/dashboard.js` (~470 KB; ~142 KB gzipped) from
`web/app.tsx`, and **refuses to build** if the output carries `assistant-cloud`,
a telemetry reporter, or a phone-home — `@assistant-ui/react` depends on
assistant-cloud, which ships engagement/run reporters and tree-shakes out
today; the build turns "today" into a checked invariant. The page loads the
bundle from its own origin under a `default-src 'none'` CSP with a per-response
nonce, and the bundle contains exactly one URL (`https://react.dev`).

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
  laya.ts        Laya judge via System One / Jev (local sidecar :8091 by default)
  questioner.ts  LLM→Laya→LLM: actor uncertainty → typed questions → Laya decides
  messages.ts    notice text; imports nothing, which keeps the test suite runnable
  prompts.ts     BUG_FIX_PROMPT / FEATURE_PROMPT / REFACTOR_PROMPT

  ── the harness host ──
  plugin.ts      agent/pre-step · agent/request · tools/pre-execute
  dashboard.ts   the loopback HITL server (brief state + nonce CSP)
  dashboard-page.ts the page as a string (DOM only, no innerHTML)
  brief.ts       the brief's bounds, prompt, and normalizer (no UI language)
  approval-bridge.ts the dashboard <-> assistant-ui approval mapping (pure)
  explainer.ts   the brief's model call (NO_EXPLAINER by default)

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
| `OnegwJudge` (Laya) | $0, local | ~1–4 s cold-ish, <200 ms warm* | client ready; **verified live 2026-09-23** against a local sidecar (`scripts/laya-sidecar.py`, `~/venvs/laya`, port 8091) — all three primitives answer, full battery returns recommendations |
| `ChatJudge` | metered | ~10–40 s | **what the demo uses** |
| `NO_JUDGE` | $0 | 0 | detectors-only, a supported mode |

\* Laya-sidecar timings measured on this machine: first predict ~7 s (cold weights), then ~0.9–4 s per call warm — far above the JEV doc's 73 ms (that figure is raw forward-pass; ours includes HTTP + routing + a cold-ish process). Still 10× cheaper in wall-clock than a chat judge, and $0.

To point the demo at local Laya (the containerised sidecar on `:8091`, same
System One / Jev / TypeSafe wire):

```bash
bash demo/run.sh --judge laya --judge-base-url http://127.0.0.1:8091
# or: SYSTEMONE_BASE_URL=http://127.0.0.1:8091 bash demo/run.sh --judge laya
```

`--judge laya` defaults the judge base URL to `http://127.0.0.1:8091` (override
with `--judge-base-url` / `SYSTEMONE_BASE_URL`). The actor still talks to onegw;
only the judge URL splits. Score criteria go as ordered arrays so Laya keeps
the human labels; `noul` answers map onto `probability`.

The demo uses `ChatJudge` with `xiaomi/mimo-v2.5` because no `systemone` provider
is configured in `~/.onegw/onegw.toml`. Two measured facts argue for Laya beyond
cost:

1. **A reasoning model is a poor judge.** `mimo-v2.5` always thinks; at
   `max_tokens: 256` it returns `finish_reason: "length"` with empty content, and
   it needs ~859 thinking tokens before emitting one digit. The default is now
   2048, and the error message names the cause instead of saying "no digit".
2. **It is miscalibrated.** Asked about a routine `read_file` with no detector
   fired, it answered `SCORE=3` — the top of the scale. A purpose-built decision
   engine is the right tool; a general chat model is a fallback. Live Laya
   scored the same shape 1.409 vs 1.465 for routine-vs-dangerous — directionally
   right but near-chance, matching the JEV doc's warning that base checkpoints
   need specialisation before their levels drive policy.

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
- **`test/plugin-approval.test.ts` is not run in CI.** It imports
  `src/plugin.ts`, whose `@deepseek-ai/dsh-*` imports the no-install `test` job
  cannot resolve. Like `src/plugin.ts` it is run locally against the prebuilt
  packages; the same handshake is covered by the integration suite
  (`test/integration/plugin-in-dsh.spec.ts`), which is where the plugin's
  behaviour is exercised against the real harness.
- **Spend is metered on both paths.** `runner.ts` prices every model result into
  `LoopBudget`, and the plugin drains settled `assistant/message` events into
  `spend()` from both hooks (cursor-deduped, `assistant/attempt` retries still
  unpriced — marked `ponytail:` at the call site). The cost ceiling is
  load-bearing: a run with a deliberately tiny `costBudgetUSD` stops on cost.
- **The approval prompt depends on the session's permission preset, and the
  user's settings win.** A fresh session's approval policy comes from
  `permission.defaultPreset` in `~/.dsh/settings.yaml`, which
  `permission-presets` applies *after* any config default. On this machine it is
  `danger-full-access`, whose preset is `approval: never` — so an `ask` is
  refused with `Error: the user rejected tool "X"` **before any UI is
  consulted**, and no panel can appear. Three fixes: switch the preset in the
  session's UI selector, set that key in `settings.yaml` (global, and relaxes the
  sandbox), or run a server under a private `DSH_HOME` whose settings pin
  `workspace-write` — the last changes nothing globally. Details in
  [`docs/RUNBOOK-SERVER.md`](docs/RUNBOOK-SERVER.md) §2.5-2.6.

  This is proven, not assumed: the same headless task returns `rejected` under
  the default home and `unavailable` ("no approval channel is available") under a
  `workspace-write` home. The second is the gate's `ask` **reaching the approval
  seam**; the first is `never` refusing before any UI is consulted.
- **`gatePolicies` / `actuator` keys must be the harness's real tool names**
  (`read`, `write`, `edit`, `bash`, `glob`, `grep`). The `read_file` / `edit_file`
  / `run_tests` names belong to this repo's standalone runner and match nothing
  in a DSH session. A non-matching name is not an error — the tool falls through
  to the unclassified `irreversible` default, so the gate still fires but with
  `always-approve` rather than the policy you configured.
- **An agent-less tool call cannot prompt.** It is still gated (it no longer
  bypasses the gate), but with no agent there is no session to audit to and no UI
  to reach, so the harness resolves the `ask` to a refusal.
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
- **The dashboard's rendered page click is verified via `make e2e-dashboard`**
  (headless Chromium clicks Allow/Reject against the real page and asserts the
  ask settles). [`docs/VERIFY-DASHBOARD.md`](docs/VERIFY-DASHBOARD.md) records
  the transcript. Related: spend shown on the dashboard
  inherits the metering gap above, and a Docker volume seeded before the
  dashboard existed needs `FORCE_REINIT=1` to re-seed its profile.

---

## Phase status

- **Phase 0 — policy layer** ✅ tests, pure, no harness dependency
- **Phase 1 — loop integration** ✅ runner + CLI + tools + demo, working end to end
- **Phase 1b — plugin compiles** ✅ `tsc --noEmit` clean against prebuilt `@deepseek-ai/dsh-*`
- **Phase 2 — plugin review gate** ✅ all six detectors, the judge, the router and
  the gate are read by `src/plugin.ts`; the gate **asks before dispatch**.
- **Phase 1c — de-fork** ✅ the vendored loop is gone; the policies are hosted on
  `agent/pre-step` / `agent/request` / `tools/pre-execute`. See
  [`docs/PRD.md`](docs/PRD.md).
- **Phase 1d — human approval in the Web UI** ✅ the gate emits `ask`, DSH routes
  it to `@deepseek-ai/dsh-client-ui-approval`, and a human approves or rejects in
  the composer. `gateMode: ask | deny`. Verified live on a scratch profile with
  Agent Teams.
- **Phase 1e — HITL approval dashboard** ✅ optional loopback web surface
  (`src/dashboard.ts` + `src/dashboard-page.ts`): pending cards, live run state
  over SSE, Allow/Reject over HTTP — guarded so a tab-less deployment behaves
  byte-identically to the composer-only path. 194 unit + 11 integration tests;
  the browser click verified via `make e2e-dashboard`
  ([`docs/VERIFY-DASHBOARD.md`](docs/VERIFY-DASHBOARD.md)).
- **Phase 1f — review briefs** ✅ model-authored brief per ask
  (`src/brief.ts` + `src/explainer.ts`): plain prose, bounded, rendered inside
  the approval card — purely advisory, never blocking. Disabled by default
  (`dashboard.brief.enabled`).
- **Phase 1g — assistant-ui dashboard** ✅ the UI runs on assistant-ui
  (`web/app.tsx`, vendored as `assets/assistant-ui/`); approvals ride
  `ToolCallMessagePart.approval` and `onRespondToToolApproval`, mapped by the
  pure `src/approval-bridge.ts` onto the existing guarded endpoint.
- **Phase 2b — real spend accounting** ✅ `runner.ts` prices every model result;
  the plugin drains settled attempts from both hooks. The cost ceiling stops
  runs; `test/budget.test.ts` asserts spend is non-zero after a priced attempt.
- **Phase 2c — Laya-guided optimization** ✅ `optimize:` block, run history,
  derived envelopes, metrics, Laya-as-advisor proposals (display only),
  refinement passes with the book's < 0.05 stop rule, and SSE metrics +
  recommendations on the dashboard snapshot. Composition is wired both ways:
  the CLI derives envelopes and prints metrics + proposals (`--derive`), the
  plugin records one history line per closed turn and feeds Metrics from the
  file (`optimize.history`); proposals stay CLI-only so the hot path stays cheap.
- **Phase 3 — Laya** ✅ verified live 2026-09-23 (all three primitives + full battery via `scripts/laya-sidecar.py`); remaining: a `--judge-base-url` flag so the CLI can point at the sidecar without onegw, and calibration before levels drive policy (routine-vs-dangerous discriminated by only +0.056)

### Verifying the whole thing

```bash
node --experimental-strip-types --test test/*.test.ts   # 296 pass
pnpm test:integration                                   # 9 pass, in the real harness
tsc --noEmit                                            # clean
bash demo/run.sh                                        # goal-met
grep -rn "FORK-DELTA" src/ | wc -l                      # 0 — the fork is gone
```

`pnpm test:integration` is the one that matters for human approval: it mounts
this plugin into a **real** cordis context — real tool runtime, real approval
service, real session — and drives the actual dispatch path, asserting that
approving runs the write and rejecting stops it. See
[`docs/VERIFY-INTEGRATION.md`](docs/VERIFY-INTEGRATION.md).

### Four gaps closed along the way

- **The gate was one step late.** The fork consulted its gate from its own copy of
  `executeToolCalls`, so a gate-raised review arrived after the tool had already
  run. Hosting the gate on `tools/pre-execute` decides the call before dispatch —
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
- **The gate failed open for an agent-less call.** `policyFor` returned
  `undefined` for `agent === undefined`, so the handler delegated and the call
  dispatched **ungated**. An agent-less call now gets a shared policy and is
  gated like any other; the refusal happens downstream, where the harness denies
  an agent-less `ask`. Caught by independent verification, not by CI.
