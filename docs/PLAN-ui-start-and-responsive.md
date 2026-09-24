# Plan — start the loop from the page, and make it responsive

Derived from studying the harness's own client UI. Reference implementations read:
`packages/client/ui-goal` (a plugin page that mutates host state), `ui-deliverables`
and `ui-trajectory` (main-column pages that respond to their *container*, not the
viewport), `ui-layout/AppFrame.module.css` (the grid rules every page inherits),
`interaction/commands` (the submit path the composer itself uses).

## Part A — "how do I start the loop?" — the page has no input

**Diagnosis.** There is no way to begin a run from the Feature Loop page. The
surface is read-only (status, approvals, runs, feed) plus a settings form. The
only entry points are the composer (`/loop <task>`) or typing a task directly.

### Correction after reading the slot contract

The first draft of this plan said to submit `\`/loop ${task}\`` through
`remote.commands.execute`. Two things changed it:

1. **`sessionController.prompt(...)` is the better call.** It is the first-class
   "start a turn" API the composer itself uses
   (`{requestId, sessionId, mode, content}`), so it needs no command parse and
   cannot drift from the composer's behaviour. The loop's policies apply either
   way, because they hang off the agent loop's hooks rather than off who typed
   the line.
2. **A main-column page is not given a session.** The slot catalog states it
   outright — the `main` slot has `slotInject: ''` and "other keys receive no
   Session binding". `ui-goal` gets a session because it lives in the
   *session-scoped* `conversation.input.dock` slot, not the main panel. So
   there is no `sessionId` to borrow here, and `ISessions.list` carries no
   "current" — selection is owned by shell navigation.

**So the page must resolve the session explicitly, and must never guess
silently.** Picking the newest session and saying nothing would prompt the wrong
session whenever a human has more than one open, which is worse than asking.

**Recommendation — auto when unambiguous, explicit when not.**

- Candidates = live sessions with `blank === false` (a blank one has no inbox to
  prompt into).
- Exactly one candidate → the page uses it, and shows its title so the target of
  the run is visible before you press Start.
- More than one → a session picker appears, defaulting to the most recently
  updated, and the run goes to whichever is selected. Never a silent default.
- None → Start is disabled with the reason shown beside it ("no open session").

That keeps the common single-session case at one field and one button, and makes
the ambiguous case an explicit choice.

**Work**
1. `web/entry.tsx` — a "Start a loop" row above the tabs: a text field, a session
   picker when needed, and a Start button. Enter submits, Shift+Enter newlines.
2. Read candidates from `ctx.sessions.list` (the `ISessions` snapshot), and
   subscribe so the set updates as sessions open and close.
3. Submit through `sessionController.prompt` with a client-minted `requestId`.
   Success clears the field; an error renders beside it, naming what the host
   said, and the draft is kept so a failure never loses what was typed.
4. On success, surface where the run went (a link/label with the session title)
   so it is obvious the loop actually started.

**Ceiling, stated honestly.** The task is a plain user message: the loop's `goal`
in the spec still describes the run generically, so the page starts a *bounded,
gated turn* rather than re-authoring the spec per run. Making the page set a
per-run goal means a host-side goal write (the `dsh-goal` shape) — a separate piece
of work, flagged not built.

## Part B — "UI is not responsive"

**Diagnosis (the real bug).** `web/shell.css` collapses the 3-column layout at
`@media (min-width: 1100px)` — a **viewport** query. But the dashboard is not the
viewport: it renders inside the harness's main column, which is the viewport minus
the sidebar and right bar. On a 1600px window the main column can be ~1000px, so
the 3-column layout still applies inside a container that cannot hold it. The
columns crush, and nothing ever collapses.

**Recommendation — container queries, which is what the harness does.**
`ui-deliverables` and `ui-trajectory` set `container-type: inline-size` on their
page root and branch on `@container`, precisely because they are main-column
pages. The deliverables page collapses at `max-width: 620px` of *its own* width.
That is the pattern to inherit.

**Work**
1. `container-type: inline-size` on the dashboard page root.
2. Replace the viewport query with container queries on that root:
   - `>= 900px` — three columns (workspaces · thread · runs), as now.
   - `560–899px` — two columns; the left activity feed moves under the thread.
   - `< 560px` — one column, in reading order: thread, then runs, then workspaces.
3. `min-width: 0` on every grid and flex child (`AppFrame` uses it on every
   column; without it a grid child refuses to shrink below its content).
4. The settings form: the 150px label column collapses to a stacked layout under
   `520px`, so fields are never squeezed into a sliver.
5. Cap the thread's max width and let it scroll rather than force a page-level
   horizontal scrollbar.

**Verification** — the case that matters is the real main column, not a
full-width window, so: at 1600 / 1280 / 1024 / 820 / 600px, and inside the actual
DSH shell. Assert no horizontal overflow (`scrollWidth <= clientWidth`) and no
element wider than its container, then re-run the contrast audit in both themes.

## Part C — carried forward, not built now

- The 2s poll stays; the right upgrade is `ctx.remote.$on(...)` live events, the
  pattern `ui-goal` uses for goal activation. It needs the host to publish an
  event per snapshot change, which is a host change, not a UI one.
- Per-run goals from the page (Part A's ceiling).

## Order

A then B, with the build, tests, browser verification and screenshots after each,
so a regression in one is attributable.
