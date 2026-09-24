# HANDOFF — current feature-loop implementation

This file records the state of the implementation worktree, not the old
container or another session's uncommitted work.

## State

- Worktree: `.worktrees/feature-loop-trust-seams`
- Branch: `dsh/feature-loop-trust-seams`
- Base: latest `origin/main` captured as `af24efca`
- Current implementation tip: `41b625d` plus any uncommitted documentation
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
  - symlink escape rejection;
  - DSH `feature_queue` mutations routed through the human gate and a separate
    read-only `feature_queue_list` tool;
  - DSH `feature_worktree_create`, `feature_pr_create`, and `feature_pr_merge`
    actions routed through the same human gate, with `feature_pr_plan` kept
    read-only.
- Packed npm artifacts include all generated runtime chunks.
- `git-worktree.ts` runs fixed, shell-free Git commands to create a detached
  worktree at the pinned base commit and proves its HEAD and ownership. It does
  not create branches, push, open PRs, or merge.
- `pr-gate.ts` builds fixed shell-free `gh pr create` and squash-merge plans,
  validates repository/branch/commit/body inputs, and requires claim-scoped
  human approval. `pr-executor.ts` sends those fixed plans through the DSH
  sandbox-aware shell service, POSIX-quotes every argument, and never invokes
  `gh` directly. `queue-settlement.ts` runs the item verifier through that
  same DSH shell and settles campaign funds only after a clean result; it is not
  a model tool.

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

- unit: 409 passed, 0 failed
- DSH integration: 16 passed
- build: passed
- security scan: clean
- live isolated Web profile: native `/loop` reached
  `Completed successfully`, verifier passed, and run history recorded non-zero
  spend. A second isolated Web run drove the model through the real
  `feature_queue` mutation tool, clicked its human approval, listed the queue,
  and completed the goal; the temporary queue artifact was removed afterward.
  A third isolated Web run used the real `feature_worktree_create` and
  `feature_pr_plan` actions on a temporary Git workspace, clicked the human
  gates, and completed without creating a network PR or merge. All temporary
  workspace artifacts were removed afterward. The main `3081` profile was not
  started or changed.

## Queue boundary

`FeatureQueue` is admission and accounting only. DSH exposes queue mutations,
worktree creation, PR creation, and PR merge through separate human-gated
tools; queue listing and PR planning are read-only. The detached worktree runner
creates and verifies an isolated checkout after claim-scoped approval. The
PR/merge executor and settlement bridge run only after matching human approval;
settlement is not exposed as a model action. No queue record is proof that a PR
was opened or merged.

## Next work

1. Decide whether `routing.ts` collapses onto DSH model selection.
2. If PR/merge rollout is enabled, run a separately approved isolated network
   acceptance test; never use the main profile for that test.
