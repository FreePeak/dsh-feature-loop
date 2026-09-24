# HANDOFF — current feature-loop implementation

This file records the state of the implementation worktree, not the old
container or another session's uncommitted work.

## State

- Worktree: `.worktrees/feature-loop-trust-seams`
- Branch: `dsh/feature-loop-trust-seams`
- Base: latest `origin/main` captured as `af24efca`
- Current implementation tip: `adc96a9` plus any uncommitted documentation
  changes in this worktree
- Main checkout and DSH profile at `http://127.0.0.1:3081/` were not modified.
- Do not edit the original `hitl-pro-ui` worktree; its WIP was reconciled into
  this branch.

## Implemented

- Tool calls use authoritative `tools/result.isError`, keyed by immutable
  `callId`; parallel calls aggregate to one model step.
- Human approval is available in the composer panel, the in-UI Feature Loop
  remote, and the standalone dashboard. Watcher ownership is source-scoped and
  fail-closed.
- `/loop <objective>` is a native DSH goal command. It calls `goals.create`; the
  DSH goal-round driver owns continuation.
- `update_goal(action="complete")` is independently verified through the DSH
  shell and effective sandbox workspace. A non-zero, aborted, timed-out, denied,
  or failed verifier cannot complete a goal.
- Per-turn `TurnRunRegistry` pricing includes final attempts, retries, route
  attribution, unpriced attempts, replay, and explicit stop reasons. Web-profile
  turns are recorded at the agent idle boundary as well as the session event
  feed.
- `CampaignBudget` reserves and settles shared campaign funds idempotently.
- `FeatureQueue` is a durable, single-writer JSONL queue with:
  - strict event parsing and torn-line rejection;
  - exclusive lock file per operation;
  - fencing `claimId` values;
  - no automatic timeout retry;
  - priority ordering;
  - human-waiting transitions;
  - full base-commit pinning;
  - worktree paths constrained below `.worktrees`;
  - symlink escape rejection.
- Packed npm artifacts include all generated runtime chunks.
- `git-worktree.ts` runs fixed, shell-free Git commands to create a detached
  worktree at the pinned base commit and proves its HEAD and ownership. It does
  not create branches, push, open PRs, or merge.
- `pr-gate.ts` builds fixed shell-free `gh pr create` and squash-merge plans,
  validates repository/branch/commit/body inputs, and requires claim-scoped
  human approval for merge authorization. It does not execute `gh` or contact a
  network.

## Evidence

Run from this worktree:

```bash
pnpm typecheck
pnpm test
pnpm build
DSH_HARNESS=/Users/linh.doan/work/harvey/freepeak/deepseek-harness pnpm test:integration
bash .githooks/pre-commit --all
git diff --check
```

Current verified result before the documentation-only update:

- unit: 396 passed, 0 failed
- DSH integration: 14 passed
- build: passed
- security scan: clean
- live isolated Web profile: native `/loop` reached
  `Completed successfully`, verifier passed, and run history recorded non-zero
  spend. The main `3081` profile was not started or changed.

## Queue boundary

`FeatureQueue` is admission and accounting only. The detached worktree runner
creates and verifies an isolated checkout. The PR/merge module only plans fixed
commands and authorizes a merge after a matching human approval. None of these
components executes `gh`, pushes code, opens a PR, or merges. Those operations
must remain behind the DSH human gate and a separately audited runner. Queue
records are not proof that a PR was opened.

## Next work

1. Add the DSH-shell-backed executor for the already-fixed PR/merge plans.
2. Connect that executor to the queue only after proving the pinned base commit,
   isolated branch, and claim-scoped approval.
3. Decide whether `routing.ts` collapses onto DSH model selection.
4. Keep the main `3081` profile unchanged until a final isolated acceptance run
   covers queue → worktree → human gate → verifier → PR/merge gate.
