# Plan — close the open issues

Deep dive done against the harness's own implementations. Two open issues were
flagged earlier; both turned out to be tractable, and one had a blocker that had
to be removed first.

## Issue 1 — the dashboard polls every 2s

**What exists.** The client calls `remote.featureLoop.live()` on a 2s interval.
That is a `ponytail:` ceiling I wrote: polling instead of push, with "upgrade path
is a streaming remote method".

**Is the upgrade real?** Yes, and the harness already ships the exact pattern.
Three reference points, all read:

- `packages/api/session-controller/src/types.ts:602` — an event declared on
  cordis `Events` with `@mode emit`, which is what makes it forwardable.
- `packages/api/session-controller/src/remote-events.ts` — a package opts an
  event in with `TypertRemoteEventSelection extends Record<Event, true>`.
- `packages/api/session-controller/src/index.ts:181` — the host emits it
  (`ctx.emit('api-session/status', agent.id, running)`) from an existing hook.
- `ui-goal` consumes the mirror image client-side with
  `ctx.remote.$on('goal/activation-changed', …)`.

**The blocker.** `DashboardState` carries a single listener slot, commented
"One slot is enough: one dashboard serves one process" — and the standalone
server's SSE broadcast already owns it. A second subscriber (the event bridge)
would silently replace the first. So the state must grow a subscriber set before
the bridge can exist.

**Work**
1. `src/dashboard.ts` — `onChange` becomes a subscriber `Set`. The existing
   single-caller call sites keep working; `onChange(undefined)` is replaced by a
   documented `clearListeners()` rather than left as a trap.
2. `src/plugin.ts` — subscribe once, and `ctx.emit('featureLoop/changed')` on
   change. **Coalesced**: a step can mutate state many times, and one event per
   mutation would flood the browser. At most one emit per 250ms, with a trailing
   emit so the last change is never lost.
3. Event declaration + `TypertRemoteEventSelection` opt-in, mirroring the
   session-controller shape.
4. `web/entry.tsx` — subscribe with `ctx.remote.$on`, reload on event. The poll
   stays but drops to a slow safety net (30s) for a dropped event, so a
   missed frame degrades to staleness rather than to a dead page.

**Ceiling that remains.** The 30s net still polls. Removing it entirely would
mean a durable stream with resume, which is a harness concern, not ours.

## Issue 2 — the start field submits a task, not a per-run goal

**What exists.** The control sends the task through `sessionController.prompt`,
so the spec's `goal` stays generic for every run.

**Should I build the real thing?** The harness has a per-session goal mechanism
(`dsh-goal`: `GoalRef {id, revision}` with CAS, session projections, its own
remote, `goal/activation-changed`). Integrating with it is a genuine feature —
new service wiring, CAS semantics, projection keys. It is **not** a bug fix and
I am not going to fake a per-run goal field that quietly does nothing.

**What I will do instead, and why it is honest.** The run row already carries a
`runId` that is a raw agent id, so the workspace tree lists runs a human cannot
name. Recording the submitted task as the run's label makes each run self-
describing — the thing a person actually needs when the dashboard lists runs.
That is a real improvement, truthfully scoped.

**Work**
5. `src/remote.ts` — `noteRun(sessionId, task)` records the task as the run's
   display label through the same `recordMeta` path that already carries cwd.
6. `web/entry.tsx` — call it before prompting, so the label is in place by the
   time the first frame arrives.
7. Leave the real `dsh-goal` integration written down as future work, not
   half-built.

## Issue 3 — nothing is committed

Every change since the fold-in is uncommitted in the worktree, including a
rebuilt `client.js` artifact. Commit on the existing branch with the bundle.

## Verification

- New unit tests: subscriber set (add/clear/many), coalescing (a burst produces
  one trailing emit), and the run label round-trip.
- Full suite + typecheck.
- Browser: dashboard updates on an event without the 2s poll doing the work
  (assert frames arrive sooner than the net), start-run still works end to end,
  contrast audit in both themes, and the run row shows the task label.

## Report

`docs/REPORT.html` — a standalone, self-contained page: what was built, what was
verified with the measured numbers, what is still open, and how to run it.
