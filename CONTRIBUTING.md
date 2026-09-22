# Contributing to `@freepeak/dsh-feature-loop`

This project is a vendored fork with a pure policy layer on top of it. Both
halves have their own rules, and the rules exist because breaking them has
already cost time here. Read this before your first change; it is short.

Questions, bug reports and proposals go to
[GitHub issues](https://github.com/FreePeak/dsh-feature-loop/issues). There is
no mailing list and no chat channel.

## Prerequisites

- **Node v22.** The project runs on `node --experimental-strip-types`, so there
  is no build step for tests and no transpiler in the way. v22 is required
  because that is where type stripping is usable; older versions will not run
  the test suite.
- **pnpm**, for the scripts that wrap `tsc` and the demo. `npm` works for
  installing; the scripts are plain shell either way.
- **onegw on `:8080` with `xiaomi/mimo-v2.5`**, but only for the demo. Nothing
  else in this repository needs a network or a model.

```bash
pnpm install
```

## Running tests

```bash
node --experimental-strip-types --test test/*.test.ts   # 126 tests
pnpm test                                              # the same command
```

The policy layer is pure: `spec.ts`, `budget.ts`, `routing.ts`, `signals.ts`,
`review.ts`, `judge.ts`, `prompts.ts`, `messages.ts` and `agent-policy.ts` are
arithmetic and string handling over plain data. Nothing in the suite makes a
network call or consults a model — `tools.ts` touches the filesystem and spawns
the verify command, but it too has no network path — so the suite runs offline
and instantly: under a second for all 126 tests. You should run it before every
commit; there is no reason not to.

`test/runner.test.ts` drives the standalone loop through a scripted model
client, so the runner's control flow is covered without a gateway.

The demo has its own suite:

```bash
node --experimental-strip-types --test demo/test/*.test.ts   # 14 tests, 3 fail on the planted bug
bash demo/verify.sh                                          # exit 0 only when all pass
```

Three of those fail until the loop fixes the planted bug. That is the fixture
working, not a broken checkout. `bash demo/reset.sh` re-plants it.

## Type checking

The script is `pnpm typecheck`, which runs `tsc --noEmit`. If `tsc` is not
resolvable in your shell, run the compiler by path instead — this is the form
the README quotes:

```bash
node /Users/linh.doan/.npm/_npx/a322a253dbd59f36/node_modules/typescript/lib/tsc.js --noEmit
```

That path is machine-specific; substitute your own `typescript/lib/tsc.js`. It
checks against the prebuilt `@deepseek-ai/dsh-*` packages in `node_modules`, and
it should be clean.

## The constraint that will bite you: no parameter properties

`node --experimental-strip-types` **rejects TypeScript parameter properties**:

```ts
// REJECTED by --experimental-strip-types
constructor(private readonly root: string, private readonly budget: LoopBudget) {}
```

This is not a warning and not a lint rule. It is a parse error, and it is the
single most repeated gotcha in this repository — the vendored files inherit it
from upstream, and it is why `src/index.ts` is not loadable under
`--experimental-strip-types` at all (`agent.ts`, `assistant-stream.ts` and
`inbox.ts` use parameter properties; see the README's Known limits).

Declare the field and assign it in the body:

```ts
// fine
export class ReviewGate {
  private readonly policies: Record<string, GatePolicy>
  private readonly confidenceThreshold: number

  constructor(
    policies: Record<string, GatePolicy> = {},
    confidenceThreshold = DEFAULT_ROUTER.confidenceThreshold,
  ) {
    this.policies = policies
    this.confidenceThreshold = confidenceThreshold
  }
}
```

Two consequences worth knowing before you write code:

- **Logic you leave inside `agent.ts` is logic nothing checks.** A test cannot
  import that file. That is why the plugin's branchy decisions live in
  `agent-policy.ts` (27 tests) rather than in the agent. If you add a decision to
  the plugin path, put the decision in a module a test can import and leave the
  wiring in `agent.ts`.
- **Do not convert the vendored files to explicit fields** just to make them
  loadable. It would break byte-identity with upstream and turn every future
  `sync-upstream.sh` run into a merge. This is deferred deliberately, not
  forgotten.

## The `FORK-DELTA` convention

These files are vendored from `@deepseek-ai/dsh-agent-loop`:

```
src/agent.ts  src/index.ts  src/inbox.ts  src/tool-calls.ts
src/runtime-context.ts  src/assistant-stream.ts
src/constants.ts  src/invariant.ts
```

`scripts/sync-upstream.sh` re-vendors them from the upstream checkout and diffs
the result against what this repository holds. It cannot tell your local edit
from a new upstream release unless you mark it, and the marker is how it knows:

```bash
grep -rn "FORK-DELTA" src/
bash scripts/sync-upstream.sh   # diff against the pinned upstream commit
```

**Every local edit in a vendored file gets a `FORK-DELTA` comment.** A new one
looks like this:

```ts
/* FORK-DELTA(7): the step's routed rung is applied to the request seed here
 * rather than in the harness, because the ladder is a fork concept and upstream
 * has exactly one route. Re-apply this hunk after re-vendoring: upstream's
 * `prepareRequest` sets the model directly. */
this.stepRoute = this.ladder.forStep(step)
```

Why it matters, concretely: the sync script strips lines containing `FORK-DELTA`
from both sides before comparing (`grep -v "^.*FORK-DELTA"`). An unmarked edit
therefore shows up as "upstream has changed" on a file upstream never touched —
or worse, gets silently overwritten the next time someone re-vendors. Keep the
marker on its own line, not appended to a line of code, or the comparison will
not strip it.

The parenthesised number groups edits that belong to the same delta; the fork
currently uses `0` through `6`, and a single self-contained line may omit the
number (`/* FORK-DELTA: ... */`). Markers are currently present in `agent.ts`,
`index.ts` and `tool-calls.ts`.

`upstream.lock` pins the upstream commit (`c291e796`, v0.1.5-rc.2). Note that
`sync-upstream.sh` rewrites the lock as a side effect of running, so check
`git diff upstream.lock` before committing.

When you re-vendor, the script prints the copy command and the three steps:
copy the upstream files, re-apply the `FORK-DELTA` hunks, run the tests.

## No new dependencies

The policy layer is deliberately dependency-free, and it must stay that way:
`package.json` has one runtime dependency (`@deepseek-ai/schemastery`, required
by the plugin's config schema) and the `@deepseek-ai/*` packages are peers
supplied by the harness. Everything else — path handling, percentile arithmetic,
HTTP, the demo's percentile window — is the Node standard library on purpose.
`demo/README.md` says it outright: "No deps — `node --experimental-strip-types`
is the whole toolchain."

If you think you need a dependency, **open an issue first** and explain what the
standard library cannot do. It is usually a shorter conversation than the PR
would have been.

## Adding a detector or a policy

- **Detectors live in `src/signals.ts`.** A detector reads the step history
  (`StepObservation[]`) and returns a `ReviewSignal`. Detection is deterministic on
  purpose: a detector that runs in arithmetic cannot miss, and a model asked "is
  this worth a human?" cannot be trusted to notice a cycle it was not shown. If
  your detector needs a model call to work, it is not a detector.
- **Gate and router policy lives in `src/review.ts`.** `ReviewGate.check()` maps
  (tool, reversibility, confidence) to a decision, and `AttentionRouter.route()`
  applies the review budget. The fail-closed defaults are load-bearing; see
  `SECURITY.md` before you touch them.
- **Every non-trivial decision needs a runnable test in `test/`.** One test that
  fails if the logic breaks is the bar. The suite is cheap, so this is not a
  tradeoff.
- **Every threshold cites its provenance.** The source playbook's numbers are
  quoted in `BOOK_THRESHOLDS` in `src/signals.ts`, and the doc comment on each
  one says where it came from. A threshold with no provenance is a number
  someone liked. If your threshold is a guard rather than a playbook number —
  `toolDominanceMinSteps` is the existing example — say so, and say what goes
  wrong without it.
- **Prefer a new detector to a new knob.** A signal that always fires is noise
  that trains its reader to ignore the ones that matter.

## Commits and pull requests

Read `git log` before you write your first commit message; the style here is
observable and consistent:

```bash
git log --format='%s%n%n%b' -1
```

The subject is a sentence about what the change does. The body is long and
explanatory: what changed, **why**, what it replaced, and — this is the part that
matters — **the bugs found on the way**, each with the mechanism, not just the
symptom. `budget.spend()` returning 0 for an unpriced route is written up as the
hole it was, including why it was invisible. A commit that fixes something says
what would have gone wrong had it not been fixed.

Two conventions worth copying:

- **Say what is known not to work.** Limits are stated in the commit body and
  marked `ponytail:` in the code with an upgrade path, rather than left for
  someone to discover.
- **Explain a deferral.** "Converting them would break byte-identity with
  upstream, so it is deferred" is the shape: a decision, and the reason for it.

Pull requests: keep them focused on one change, describe the same way, and say
which commands you ran. Tests, `pnpm typecheck`, and `bash demo/run.sh` when the
change touches the loop. CI runs the tests and a `tsc --noEmit` over the
harness-free modules on every PR, so a red check is a real signal — but it cannot
typecheck the plugin path (`agent.ts`, `index.ts`, `notices.ts`), so run
`pnpm typecheck` locally when you touch those.

## What needs no discussion

Open a pull request directly:

- Typo fixes and documentation improvements.
- New tests, including tests for behaviour that is already covered — more
  coverage of the fail-closed paths is welcome.
- New detectors, with a test and a cited threshold.
- Small fixes to the demo fixture.

## What needs an issue first

Discuss before writing code, because these change the contract other people
depend on:

- **New dependencies.** See above.
- **Changes to `spec.ts`'s required dimensions.** All eight are required and
  validated at load. Making one optional, or adding a ninth, changes every
  deployment's spec — and the spec is where "name the termination" and "budget
  the loop, not the request" are enforced.
- **Changes to the gate's fail-closed defaults.** An unclassified tool being
  treated as `irreversible`, and a missing confidence estimate meaning "ask" —
  both are deliberate. A change that makes either fail *open* is a security
  issue; see `SECURITY.md`.
- **Anything that changes the public config surface** — the plugin's config
  schema in `src/index.ts`, `LoopSpec`'s shape, `RouterConfig`, the exported
  interfaces of the policy modules. A config change is a breaking change for
  every deployment even when the version number does not move.
