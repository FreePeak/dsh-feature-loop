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

- **Starting a loop targets the open workspace, not a session.** The picker
  listed every session in every project — reasoning about transcripts to decide
  which checkout gets edited — and silently fell back to the most recently
  touched session, which is routinely a different repository. It now offers the
  Workspace the user has open, derived the way the sidebar derives it, and
  resolves workspace → session through the host's own
  `uiWorkspace.connectWorkspace`. With several workspaces and none open, submit
  is blocked and says why: a loop writes files.

### Fixed

- **The approval composer is usable in a narrow column.** Four nested layers of
  horizontal padding sat between the thread's edge and the composer's field — the
  thread viewport's 32px, the sticky footer's 24px, the composer card's 24px, the
  textarea's own 8px. At a 440px window (a 331px content column) that left the
  field 23px wide, with its 36px send button beside it. The viewport and the
  footer are wrappers, not insets, and now carry no horizontal padding; the field
  takes the card's inset rather than adding one. The field is 303px at 440px and
  243px at 380px, against 23px and 8px before. The harness's own composer stacks
  two layers (54px) in the same column; this one now stacks one (24px).
- **The standalone dashboard page stops measuring itself in viewport units too.**
  It is the second front end onto this stylesheet — it owns `<html>`/`<body>` — and
  it had none of the above: its thread sat outside `.fl-page`, so no query container
  was above it and every `cqh` resolved against the *smallest* container, the
  viewport. At a 1280x300 window the thread's floor came out 180px, exactly 60% of
  the window, with the composer 115px below the fold. The page is now a size
  container with a real height (`100dvh`, `dvh` because a tab can be resized
  mid-read) and `main` is its scroller: scrolling it puts the composer at 285px in a
  300px window. The height has to be on the container box itself — size containment
  means the box's size cannot come from its content, and measured against `<html>`
  it came out 0px tall with every `cqh` on the page resolving to 0, which deleted
  the floor outright rather than mis-sizing it.
- **No card is drawn outside the thread any more.** With the viewport's padding
  gone the messages had to carry the edge inset themselves, and both obvious ways
  to do it are wrong: `padding: 0 16px` took 32px out of the message's content box
  so the text sat inside a border the card draws itself, and `margin: 0 16px 14px`
  on `width: 100%` put the card's border 16px *beyond* its container — measured at
  1280, the welcome plate's right edge was 1242 inside a viewport that ended at
  1226, i.e. over the thread's own border. The messages and the welcome plate are
  now `max-width: var(--thread-max-width)` with `auto` sides, which centres under
  the thread's width and clamps to the container when that is narrower.
- **The activity and runs panes keep their own height cap below 760px.** The
  narrow-layout query released `.sidebar`/`.rail` to `position: static; height:
  auto; overflow: visible` — correct for sticky columns, but it also released the
  `overflow: hidden` panes inside them, which then grew to their content: the
  activity feed was 941px tall (11 entries) inside a 744px page, and reaching it
  meant scrolling 1483px past the approval thread. The panes are lists, so they
  take `max-height: calc(100cqh - …)` and scroll inside their cards, which is
  what the wider layouts already did.
- **The page no longer measures itself in viewport units.** `shell.css` sized
  three page-height rules in `vh`, which is the wrong axis for a page that is
  the harness's *centre column*: the window also carries the host's sidebar rail
  and the frame's top clearance, so `vh` overstates the space the page has — by a
  margin that grows as the window narrows. The worst was the approval thread's
  floor, `min-height: min(70vh, 720px)`, which is a floor rather than a ceiling:
  at a 480x560 window it resolved to 334px with only 176px above the fold, so the
  approval card — the reason a person is on the page — sat below it. It is now
  `min(420px, 60cqh)`: a floor of at most 420px and at most 60% of the page's
  own height, with the rest left to the start control, the tab row and the page's
  scroll. The two sticky columns take `100cqh` for the same reason, and the
  container is declared `container-type: size` so a height query has a height to
  resolve against. Measured after the fix, the thread is fully above the fold at
  1280x760, 1024x700 and 820x700, and the page scrolls to the rest at every
  width; the harness's own conversation page was the control in the same
  squeeze and does not overflow at 440px either.
- **The plugin page is now drawn with the harness's own metrics.** The colours
  were already bound to `--dsw-alias-*`; the geometry was not, and it showed.
  Measured on a live instance, against the harness's own pages:

  | | plugin page, before | the host's own |
  |---|---|---|
  | page inset | none | `0 clamp(24px, 4vw, 48px) 48px`, content capped at 960px |
  | page title | 15px/600, uppercase (it was inheriting the *section* micro-label) | 20px/500, 28px line |
  | tabs | 24px pills, 12px type | 28px, 13px/20px, `radius-sm`, on the translucent track (`SegmentedControl`) |
  | start input | 32px, 1px border-l2, 8px radius | 36px, 0.5px border-l4, `radius-md` (`Input`) |
  | start button | 40px measured, for a 32px spec | 36px, `radius-md` (`Button` `md`) |
  | prose | a fixed 13px | `--dsh-content-font-size`, with the title on the `+delta` ramp |
  | scrollbars | an 8px accent-gradient thumb of its own | `--dsh-scrollbar-thumb`, rebound to the l2 pair |
  | focus rings | `2px solid --dsw-alias-brand-primary` | `--dsw-alias-state-business-primary` at the host's width |

  Three of those were not preferences. (1) `shell.css` carried a bare
  `:where(.fl-page, …) button { min-height: 40px; padding: 9px 18px;
  border-radius: 999px }` rule, written for the two decision buttons and
  silently governing *every* button on the page — anchored, so
  `css-scope.test.ts` could not see it, and a `min-height` beats any smaller
  `height`, which is why a 32px start button measured 40px. It is now scoped to
  `.allow, .reject`. (2) `shell.css`'s bare `h2` scope rule matched the page
  *title's* element, and since both it and `.fl-title` are class-level, sheet
  order gave the title `text-transform: uppercase`; it is now scoped to
  `.section-head h2`. (3) `.pane-head` read `var(--chrome)`, which nothing
  declares, so the `color-mix` was invalid and the declaration fell through to
  transparent; it now reads `--panel-2`.

  `test/css-parity.test.ts` holds the numbers, each cited to the harness file
  it came from, and fails on the page gutter, the title ramp, the tab metrics,
  the control metrics, the focus colour, the bare-button and bare-`h2` rules, the
  scrollbar rebind, the type scale, an undeclared custom property, and any
  hardcoded colour in a paint property.

- **The plugin's stylesheet no longer restyles the host UI.** Folded into the
  DSH UI as a main-column page, the dashboard kept the stylesheet it had when
  it stood on its own origin: palette declared on `body`, and bare `header`,
  `main`, `h2`, `code`, `button` and `details` rules. Injected into the
  harness's `<head>`, those overrode the product — the host `<body>`'s
  background, a 56px sticky `<header>`, every `<h2>` forced to 12px uppercase,
  and every `<button>` given a 999px radius and a 40px min-height. Every rule
  is now anchored to a root the plugin owns.
- **The injected stylesheet is removed when the plugin unloads.** It was
  appended in `apply()` and never disposed, so a profile with
  `patchReload: live` stacked one copy per reload into the host's `<head>`.

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
