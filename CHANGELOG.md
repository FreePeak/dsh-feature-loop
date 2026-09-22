# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **De-forked.** The package no longer vendors `@deepseek-ai/dsh-agent-loop`.
  Nine copied files (~3,064 lines) and the whole fork-maintenance apparatus —
  `scripts/sync-upstream.sh`, `upstream.lock`, `cordis.patch.yml`, and the
  `FORK-DELTA` marker convention — were removed and replaced by
  `src/plugin.ts` (368 lines) hosting the same policies on the harness's own
  extension points: `agent/pre-step`, `agent/request`, `tools/pre-execute`.
  Rationale, per-file line counts and acceptance criteria: `docs/PRD.md`.

### Fixed

- **The review gate now denies before dispatch.** The fork consulted its gate
  from a vendored copy of `executeToolCalls`, so a gate-raised review arrived
  *one step late*, after the tool had already run. Hosting the gate on
  `tools/pre-execute` — which returns a first-class `PreToolDecision`
  (`allow`/`deny`/`ask`) — denies the call before it is dispatched. This closes
  the defect the fork filed as an unfinished refinement.

### Added

- Standard open-source community documents: `LICENSE` (MIT),
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1),
  `SECURITY.md`, and this changelog.

## [0.1.0] - 2026-09-22

The first version: a pure, tested policy layer, a standalone loop that runs it
end to end against a real bug, and the same policies wired into the DSH plugin.

### Added

- **The 8-dimension loop spec** (`src/spec.ts`) — goal, sensor, controller,
  actuator, feedback, termination, max steps, cost budget. All eight are
  required and validated at load, so an incomplete spec fails where it is
  written rather than halfway through a run. Prices (`8b`) and an unpriced-route
  fallback (`8c`) are part of the spec because a cost budget measured against an
  unknown price silently reads zero.
- **Step and cost ceilings** (`src/budget.ts`) — both enforced *before* the
  expensive call, so a ceiling is a limit rather than an invoice. Includes the
  USD price table and tracking of unpriced steps.
- **Cheap-first model routing** (`src/routing.ts`) — a ladder that starts on the
  cheapest route and escalates on evidence, with a per-step cost cap.
- **Six deterministic loop-hygiene detectors** (`src/signals.ts`) — `tool-cycle`
  (3 trailing repeats), `error-cascade` (3 consecutive failures),
  `tool-dominance`, `budget`, `excessive-steps`, `quality-drop`. Every threshold
  is quoted from the source playbook in `BOOK_THRESHOLDS`, because a threshold
  with no provenance is a number someone liked.
- **Reversibility-tiered review gate and attention router** (`src/review.ts`) —
  read actions proceed, reversible writes proceed when the confidence estimate
  clears the bar, irreversible actions always stop for a human. The router keeps
  human review under 10% of steps; critical signals are deliberately not
  rate-limited, because safety is not subject to an attention budget.
- **A pluggable judge** — `OnegwJudge` (Laya, a local non-autoregressive decision
  engine, via onegw's `/v1/systemone`; the intended production path),
  `ChatJudge` (works wherever a model does), and `NO_JUDGE` (detectors-only, a
  supported mode). Laya is not deployed in onegw here, so the demo uses the chat
  judge.
- **Standalone loop runner and CLI** (`src/runner.ts`, `src/cli.ts`) — spec →
  budget → route → detectors → judge → review → model → tools → success check,
  cheapest reasons to stop first. The CLI preflights the verify command and
  refuses one that cannot run or that already passes, since both waste a whole
  run.
- **Sandboxed tool layer** (`src/tools.ts`) — `read_file`, `write_file`,
  `edit_file`, `list_files`, `run_tests`, path-confined to one root. Symlink
  escapes are caught by `realpath` on the deepest existing ancestor, because the
  leaf usually does not exist yet on a write while the smuggling symlink does.
- **Model client** (`src/llm.ts`) — an OpenAI-compatible client, plus a scripted
  client so the runner's control flow is testable without a network or a model.
- **Prompts** (`src/prompts.ts`) — `BUG_FIX_PROMPT` (6 rules), `FEATURE_PROMPT`
  (5 rules), `REFACTOR_PROMPT`.
- **`src/agent-policy.ts`** — the plugin agent's branchy decisions extracted into
  a testable module (27 tests), because `agent.ts` cannot be imported by a test
  at all: it inherits upstream's constructor parameter properties, which
  `--experimental-strip-types` rejects.
- **The demo fixture** (`demo/`) — a planted nearest-rank off-by-one that is
  wrong only when `p/100*n` lands on a whole number, a bug report written as
  symptoms only, 14 tests of which 3 fail on the bug, and `run.sh` / `reset.sh` /
  `verify.sh` plus a captured successful transcript. `demo/run.sh` resets the
  bug first, so every run has real work to do.
- **The vendored fork** — `@deepseek-ai/dsh-agent-loop` vendored with every local
  edit marked `FORK-DELTA(n):`, `scripts/sync-upstream.sh` to diff against the
  pinned upstream commit, and `upstream.lock` pinning `c291e796` (v0.1.5-rc.2).

### Fixed

- **`budget.spend()` returned 0 without resolving the price** whenever the
  adapter reported no usage, so an unpriced route was silently free and the cost
  ceiling was a fiction on any gateway that does not report usage. The price is
  now resolved unconditionally, and unpriced steps are counted in the snapshot so
  an under-count is visible rather than hidden.
- **`tool-dominance` fired on step 1**, where every tool is trivially 100% of all
  steps. A signal that always fires is noise that trains its reader to ignore the
  ones that matter; it now needs a five-step floor before it may speak.
- **The phase actuators named tools the tool layer does not provide** (`read`,
  `edit` rather than `read_file`, `edit_file`), so the gate silently fell back to
  each tool's own declaration for every call.
- **`error-cascade` could not fire in the plugin path.** Per-call `isError` was
  internal to `tool-calls.ts` and discarded at the `executeToolCalls` boundary,
  so `StepObservation.error` was never populated. Since `error-cascade` is one of
  only two critical signals, the plugin gate was silently running on four
  detectors instead of six.
- **`review.reviewBudget`'s schema accepted `0`**, which `AttentionRouter`
  rejects, so a config typo surfaced as a plugin-load crash reported from the
  wrong layer. It is now an exclusive lower bound.
- **Two inherited upstream bugs surfaced by compiling the fork against the real
  harness packages.** `import { FiberState } from '@deepseek-ai/cordis'` was a
  hard `SyntaxError` — cordis declares it as an ambient `const enum` with no
  runtime export, and it only works upstream because the bundler inlines the
  values. And `this.policy` read inside a `function*` generator was `undefined`
  at runtime, so the fork's fifth constructor argument never reached the agent.

### Changed

- **`agent.ts` now reads all six `FeatureLoopPolicy` fields.** It previously read
  two (`budget` and `ladder`): the gate, router, judge and spec were constructed
  in `index.ts`, passed to the agent, and never used, so in the plugin path the
  review layer was inert. `preStep` now runs the detectors, consults the judge
  (awaited, fail-soft), routes through the attention router and surfaces a review
  as a labelled notice.
- **`executeToolCalls` returns per-call outcomes** (`FORK-DELTA(6)`) so the step's
  observation can learn whether its tools failed.
- **The review gate is consulted from `executeToolCalls` rather than `preStep`**,
  because `preStep` runs before the model has chosen a tool. A gate-raised review
  is therefore surfaced one step late, as a notice rather than a block. This is
  marked `ponytail:` in `agent.ts` with its upgrade path: a `tools/pre-execute`
  listener that can deny the call before dispatch. Dropping the call instead
  would leave the assistant's tool-call block with no `tool/result` behind it,
  which invalidates session replay.

[Unreleased]: https://github.com/FreePeak/dsh-feature-loop/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/FreePeak/dsh-feature-loop/releases/tag/v0.1.0
