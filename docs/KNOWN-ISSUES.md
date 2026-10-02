# Known issues — found by testing the plugin in a real DSH instance

Everything below was found by running the plugin in a live harness, not by
reading code. Each entry says what you observe, why it happens, and what fixes
it. Everything found by running it is now fixed; what remains below is the
environment list, which is about the machine rather than the product.

The headline: **an approval that appears not to work is usually not the gate.**
In every case observed here the gate was either never loaded at all, or loaded
and correctly refused for a reason that had nothing to do with the approval UI.

---

## Fixed

### 1. The stylesheet restyled the whole host UI

**Observed:** after the dashboard was folded into the DSH UI, the host's `<body>`
background, `<header>`, every `<h2>` and every `<button>` were restyled by the
plugin.

**Why:** `web/shell.css` was written when the dashboard owned its own origin,
where `body`/`header`/`main`/bare `button` rules were correct. It rode along
inside the client bundle into the harness's `<head>` unchanged.

**Fix:** every rule is anchored to `.fl-page` (the page inside the DSH UI) or
`.fl-standalone` (the standalone page, which now marks its own `<html>`).
`:where()` is the scope prefix so specificity is unchanged. See PR #23 and
`test/css-scope.test.ts`, which fails if a bare type selector returns.

### 2. "Start a loop" listed sessions, not the opened workspace

**Observed:** the picker listed every session in every project and fell back to
the most recently touched one — routinely a different repository.

**Why:** a run's blast radius is a *directory*, and the control asked the user to
reason about transcripts to decide which checkout gets edited.

**Fix:** the target is the Workspace the user has open, derived the way the
sidebar derives it (`retainedBy.mainView`, then the owning workspace), and
workspace → session is resolved by the host's `uiWorkspace.connectWorkspace`.
With several workspaces and none open, submit is blocked and says why. PR #23.

### 3. The injected stylesheet was never removed

**Observed:** a profile with `patchReload: live` accumulated one copy of the
plugin's stylesheet per reload in the host's `<head>`.

**Why:** `apply()` appended the tag and returned a disposer that only tore down
the remote mount.

**Fix:** the tag is owned by an `ctx.effect` with a `remove()` teardown, the
same ownership the host's own theme sheets use. PR #23.

### 7. The dashboard page was only a watcher half the time

**Observed:** an approval raised while the Feature Loop page was open and
polling appeared in the composer instead — from the page you were watching,
which reads as a flaky gate.

**Why:** `web/app.tsx` re-read live state every 30s as a safety net, and that
read is exactly what calls `noteWatcher`. The registry only counts a front end as
watching for 15s (`WATCHER_TTL_MS`). So the page was a watcher for 15s out of
every 30, and a gate firing in the gap lost the claim to the composer panel.

**Fix:** the interval is now derived from the TTL (`WATCHER_POLL_MS`), and the
TTL moved to `src/watcher-ttl.ts` so the two cannot drift — it could not live in
`approvals.ts`, which imports `node:crypto` and cannot enter a browser bundle.
`test/dashboard.test.ts` asserts the interval the page actually schedules.

---

## Environment — the one that breaks everything silently

### 4. The plugin's peer dependencies were unresolved, so its module never imported

**Observed:** the plugin appeared installed — it was in the boot graph, its
`cordis.patch.yml` composed, `--dump-config` showed all three rows — and it did
absolutely nothing. No gate, no review, no approval. The loop just ran with
default permissions.

**Why:** the built plugin imports two packages at runtime:

```
@deepseek-ai/dsh-llm               (boundContextSummary, createUserMessage)
@deepseek-ai/dsh-typert-protocol   (Remote)
```

Both are `peerDependencies`, both optional, and `.npmrc` sets
`auto-install-peers: false` — so pnpm never installs them. In a profile where
nothing else supplies them:

```
ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-llm'
```

The loader creates the row, the import throws, the fiber never constructs, and
`apply()` never runs.

**The trap:** the client bundle still appears in the boot graph, because
`client-modules` reads `dsh.client` from `package.json` **on disk** and never
imports the module. A graph row proves an entry *name* exists — it is not proof
the plugin works.

**Fix (profile-level):** something in the profile must supply the harness
packages. The main `web` profile does this by also depending on
`@deepseek-ai/dsh-experimental-agent-team-profile`, which pulls the harness
packages into the shared pnpm store. You can see it in the store key:

```
@freepeak+dsh-feature-loop@file+…dsh-feature-loop                              # peers NOT resolved
@freepeak+dsh-feature-loop@file+…dsh-feature-loop_@deepseek-ai+c_q7p3s2fiohg…   # peers resolved
```

Two further gotchas when building such a profile by hand:

- **Use the same pnpm major as the lockfile.** `pnpm@11` silently re-resolved a
  v9 lockfile and dropped the peer wiring. `npx pnpm@9.15.9 install --frozen-lockfile`
  reproduced the working install.
- **Boot a named profile without an app argument.** `bin.js --profile X --port N`
  boots X's bundle tree. `bin.js web --port N` boots the default web app and
  ignores the profile's bundles — the plugin composes in `--dump-config` and is
  still never mounted.

**How to check in one second:** if the plugin's client row is in the boot graph
but nothing behaves differently, the module is not importing. Compare the pnpm
store key for a `_@deepseek-ai+…` suffix.

---

## Two dead branches in one module, found by asking a different question

Last round's finding came from asking *"is this documented behaviour actually
wired"*. Asking it again over the whole policy surface — enumerate every
exported function and method in `src/`, count call sites outside its own
definition — found two more, and the second one is the better story.

### 14. A rung change was recorded and never announced

`escalationForStep` was exported from `src/plugin.ts` and documented as
*"announce an escalation, if the ladder moved the route this step"*. No caller
outside the export list. So a DSH deployment moved rungs without the **model**
being told: the dashboard showed `ROUTE` changing, the transcript showed
nothing, and a model handed a harder turn with no warning is a model reasoning
from a conversation that has suddenly stopped making sense. The standalone
runner has done this correctly all along.

The channel is `agent/pre-step`, not `agent/request`, and getting that wrong is
instructive: the first attempt put the notice in the `agent/request` handler
and **typechecked cleanly**, because that hook returns an `LlmCallConfig`
(`{provider, model}`) — it has no `messages` for a caller to splice, so a
notice appended there is dropped without any error anywhere. A notice that
disappears quietly is exactly the failure this branch existed to prevent, in a
place nobody was looking.

### 15. `budget.stopNotice` — deleted rather than wired

`LoopBudget.stopNotice` was a second, shorter wording of the message
`budgetStopText` in `messages.ts` already builds, and which both the runner and
the plugin actually use. It had no caller. It is **deleted**, not wired: two
wordings for one event is drift waiting to happen, and the one that reached a
model was the one nobody had been reading.

### 16. The settings page stored every value and applied none of them

**Observed:** `~/.config/dshloop/config.yaml` was written with a header saying

```
# The dshloop CLI reads this same file, so a change here applies to both
# surfaces at the next plugin load.
```

Neither half is true. There is no `dshloop` CLI — the package declares no
`bin`, and the runner entry point is `demo/cli.ts`. And `apply()` builds its
policy from the **patch row alone**: `grep -n 'readSettings\|config.yaml\|settingsPath' src/plugin.ts`
returns nothing. The page's own confirmation read *"Saved. Values apply at the
next reload of this plugin."*

**Verified, not inferred.** Saving `gateMode: deny` and `read: always-approve`,
then building the policy exactly the way `apply()` does:

```
settings file says        : {"confidenceThreshold":0.99,"gateMode":"deny","gatePolicies":{"read":"always-approve"}}
policy.gateMode (from row): ask
gate on `read`           : undefined     ← proceeds, no review
```

**Why it matters more than a stale comment:** a person sets
`write: always-approve` on that page, sees it echoed back in the Status tab
(`buildStatus` merges the file over the row, so the page faithfully displays a
value nothing enforces), and watches a write sail through. The one file a
person would think is the way to change this plugin's behaviour is a file that
changes nothing about it.

**Fixed by saying so, in the two places a person reads:**

- the file's header now names what reads it (`buildStatus`) and what does not
  (`apply()`), with the patch row as the only place a setting takes effect;
- the page states it *before* the fields rather than in a dialog after a save —
  the person who needs to know is the one about to type — and the save
  confirmation says the same thing.

The values are still stored and still validated. That is deliberate: they are a
correct record of what the page showed, and wiring `apply()` to them is a small,
well-scoped piece of work that this note now describes honestly.

### It is now a check, and writing it took five wrong rules

`scripts/check-noop-config-keys.mjs` walks `src/index.ts`, `README.md` and the
two shipped YAML patches, takes the keys `parseOptimizeConfig` accepts and the
ones `src/plugin.ts` consults, and fails when a key that is consulted by no hook
is documented as doing something.

It took five attempts, and every wrong one was a *false result*, which is the
only kind worth recording because a false negative is invisible:

| attempt | what it got wrong | how it showed |
|---|---|---|
| 1 | every `\b` written as a literal backslash-b inside a template | no word boundary matched, so **nothing** could fire |
| 2 | `READ` matched only `reads\b` | `read for Metrics` — the phrase a real doc comment uses — missed |
| 3 | `READ` tested before `NOOP` | `READ BY NOTHING` counted as a promise, so it passed the exact claim it was written to catch |
| 4 | judged only *uncommented* setting lines | `# judge: chat   # who scores across passes` is commented out and still a claim, so the false claim passed again |
| 5 | judged prose and vocabulary lines | `--judge laya` in a shell command read as a promise — a false *positive* |

Attempt 5 is the one that decided the rule, and it is a judgement rather than a
pattern, so it is worth stating as one: **a setting line is any line matching
`key:`, commented or not.** A commented `# judge: chat` is documentation claiming
the key does something; if the key does nothing, the claim is wrong whether or
not it is a line someone would copy.

Verified by re-introducing both shipped false claims, in the exact files and
wording they shipped in:

```
README.md: a comment block sets 'judge' and says it does something,
  but no hook reads it (src/plugin.ts has no optimize?.judge). the optimize example
  promises behaviour that does not exist. Wire it, or say "read by nothing".
```

The seven matching cases are asserted inside the script, including both shipped
false claims and both corrected labels — the defect class now has a test rather
than a note.

### And it is wired, because a check nothing runs is a comment

It is a step in the `test` job and a line in `make check`, which is the same
argument as the CI-list checks: four scripts in this repo are only worth having
because something fails when they stop being true.

### The check that found a fourth on its first run

`scripts/check-dead-exports.mjs` walks `src/`, `test/`, `web/` and `demo/cli.ts`
and fails when an exported symbol is referenced by nothing outside its own file.
Its rules are stated in its header: the test suite counts (a test is a
specification, and a symbol no test touches is a symbol nobody has checked),
`src/index.ts` counts because it *is* the published entry point, and types are
not checked because an unreferenced exported type is documentation, not dead
code.

Run on the tree as it stood it found a **fourth**: `answerLive` in
`src/remote.ts`, which the committed version had been suppressing in a
`BY_CONSTRUCTION` allowlist with a justification that read well and was not
true — the remote class's `answer()` calls it one line away. The export was
dropped rather than the suppression widened, because a helper with exactly one
caller in its own file does not need to be part of anything's surface.

That is the point of writing the check *after* the findings rather than
instead of them: three rounds of noticing by hand, and the script that automates
the noticing immediately found something I had already, wrongly, excused.

The check is on a bare clone with no `node_modules` and passes, which matters
because it is the only one of the four that needs no toolchain at all.

### The method, since it now has four instances

Counting call sites is mechanical and caught all three. A grep for a symbol
finds its *definition*; it does not find the absence of a caller, and a
definition with a doc comment above it reads exactly like a feature.

### And the check that found them, run where CI runs it

A check is worth exactly as much as the environment it survives, so this one
was run on a **bare clone with only `npm install`** — no harness checkout, no
`DSH_HOME`, and on a second pass with a `$HOME` that has no `.dsh` at all:

| | Result |
|---|---|
| All three drift checks, `HOME=/tmp/empty-home` | pass, 0 local profiles |
| CI's exact test list, 18 files | **277 pass, 0 fail** |
| CI's exact typecheck command | exit 0 |
| `make check` on the bare clone | green |
| Does it write to a developer's machine? | **No** — scripts byte-identical after a run, and no `~/.dsh` created |
| Summary line names its half? | now: `3 shipped specs + 18 local profile(s) under ~/.dsh/profiles` |

That last row was a real fix and not a nicety. The script runs in CI *and* on a
developer's machine, and it was printing `18 local profile(s)` into a CI log
where there are none and the shipped configs are the whole claim. A number in
a log that does not mean what the log is about is a small lie, and this script's
whole value is that it is not one.

## `escalateAfterFailures` was configured everywhere and driven by nothing

**Observed:** every shipped profile sets `escalateAfterFailures: 2`, and the
`ModelLadder` class documents `recordFailure()` as "driven by the loop's step
outcome". `grep -rn recordFailure src/` returned **the definition and no caller** —
not in `runner.ts`, not in `plugin.ts`, nowhere.

**Why that is a real defect and not a missing nicety:** the ladder could
therefore only ever climb on `stepsPerRung`. A run that failed fast and early —
the exact case the failure signal exists for, and the one that is cheapest to
fix when the model is too weak for the task — stayed on the cheap model for its
entire life, and only moved up when it ran out of steps rather than when it ran
out of capability. `escalateAfterFailures` was a config key that read as a
feature and behaved as a comment.

**Fixed in both paths, from the same reading of a failed step:**

- `runner.ts` records the outcome after the tool loop: a tool that returned
  `ok: false`, arguments that would not parse, an unknown tool, or an operator
  abort. A step with *no* tool calls counts as a success — the model spoke and
  asked nothing, which is a step that happened, not one that broke.
- `plugin.ts` records it where it commits the previous step's observation, which
  is the only place a DSH deployment knows the outcome of a step it did not run
  itself. A denied call is the failure signal there.

Both are pinned by a test that drives the real loop with `stepsPerRung: 99`, so
the *only* thing that can move the ladder is the failure signal — and the exact
sequence is asserted, because a ladder that climbed on the first failure would
pass a weaker "the route changed" check. Both tests were verified to fail with
the recording removed.

And this is the second time in two rounds that a documented-but-uncalled
behaviour turned out to be dead code. `grep -rn` for the method finds the
definition; it does not find the absence of a caller.

## The same class, in the DOCS this time: a key documented as read

`check-dead-exports.mjs` catches a symbol nothing calls. It cannot catch a key
nothing reads, because the key IS read — by the validator. `parseOptimizeConfig`
validates all five keys of the `optimize:` block, so every one of them looks
live to a reference search, to a reader, and to the dead-export check.

Then the claim, in three places at once:

> "`derive` and `history` drive the run-history recording and the dashboard's
> Metrics payload"

`grep -n 'optimize?.derive' src/plugin.ts` returns **no match**. `history` alone
does all of that, and did before `derive` was ever written. The other three
(`loops`, `judge`, `totalBudgetUSD`) were honestly labelled "accepted,
intentionally not consumed"; `derive` was not, because the sentence above
claimed otherwise.

That is the expensive shape again, in the place documentation usually is
trusted: a person reads that line, sets `derive: true`, watches nothing happen,
and concludes the optimizer is broken rather than that a flag does nothing.

Corrected in the three places it was claimed — `Config.optimize`'s doc comment,
`OptimizePolicyOptions.derive`, and the example in `README.md` and
`cordis.patch.yml` — each now saying plainly that it is read by nothing and
where to look. The keys are kept, not deleted: a deployment that sets one
should not start failing validation when it is eventually honoured.

**A key that is validated and then ignored is a documented no-op. A key that is
validated, ignored, and documented as read is a lie in the one file people
trust without checking.**

## Three rounds running: the same defect class, and a check for it

Three separate findings in three rounds were the same shape — **a documented
behaviour with no caller**:

| Symbol | Documented as | Actually |
|---|---|---|
| `ModelLadder.recordFailure()` | driven by the loop's step outcome | called only by its own unit test |
| `escalationForStep()` | announce an escalation | exported, never called |
| `LoopBudget.stopNotice()` | the message for a ceiling stop | a second wording, never called |

The first one is the expensive shape: `escalateAfterFailures: 2` is in **every
shipped profile**, so a config key that reads as a feature and behaves as a
comment is a thing people copy. The ladder could only climb on step count, so a
run that failed fast and early — the cheapest case to fix by moving up a rung —
stayed on the cheap model for its whole life.

`grep -rn recordFailure src/` returns the definition. It does not return the
**absence of a caller**, and nothing else in the tree is going to notice that.
`scripts/check-dead-exports.mjs` does, on every run, in CI and in `make check`:
it fails when `src/` exports a symbol nothing outside the defining file can
reach, and names both.

Five symbols were file-local and now say so (`BUGFIX_PHASE`, `FEATURE_PHASE`,
`CHANGE_EMIT_INTERVAL_MS`, `DEFAULT_THRESHOLDS`, `DERIVED_MIN_STEPS`) — an
`export` on a constant read once by its own file is a public surface with no
user. Three are exported BY CONSTRUCTION and are named as such in the script:
`FeatureLoopRemote` is found by `markRemote()` at module load and must not be
imported, `answerLive` is the seam a socket-free caller drives, and
`attachApprovalAnswerer` is what an embedding host mounts on a context it built.

It is a regex over the tree, not an import graph, and it over-reports: a name
mentioned in a comment counts as a caller. That is the safe direction — the cost
of a miss here is a config key that lies, and the cost of a false positive is a
line of `export` nobody needed anyway.

## A config key that read as a feature and behaved as a comment

**Observed:** `escalateAfterFailures: 2` is set in every shipped profile, and
`ModelLadder.recordFailure()` is documented as *"driven by the loop's step
outcome"*. `grep -rn recordFailure src/` returned the definition and **no
caller** — not in `runner.ts`, not in `plugin.ts`, nowhere. `test/budget.test.ts`
was the only thing that ever called it, and a test is not a loop.

So the ladder could only climb on `stepsPerRung`. A run that failed **fast and
early** — the exact case the failure signal exists for, and the cheapest one to
fix when the model is too weak for the task — stayed on the cheap model for its
entire life, and only moved up when it ran out of steps rather than when it ran
out of capability. The key read as a feature and behaved as a comment.

Fixed in both paths from the same reading of a failed step: a tool returning
`ok: false`, unparseable arguments, an unknown tool, or an operator abort. **A
step with no tool calls counts as a success** — the model spoke and asked
nothing, which is a step that happened, not one that broke. In the plugin, the
signal is a denied call, recorded where the previous step's observation is
committed — the only place a DSH deployment knows the outcome of a step it did
not run itself.

Two tests drive the real loop with `stepsPerRung: 99`, so the failure signal is
the only thing that can move it, and both assert the exact sequence: a ladder
that climbed on the *first* failure would pass a weaker "the route changed"
assertion.

## The ladder check now reads your profiles too — and two of them are drifting

`scripts/check-ladder-models.mjs` used to read only the three files this repo
ships. It now reads **every profile under `$DSH_HOME/profiles`**, because a
local profile is a directory someone copies and never touches again — and the
two profiles this developer booted by hand still carried `execution`/`planning`
long after the shipped configs were fixed.

**And the severity was wrong when I first wrote it.** I reasoned that an
undeclared *upper* rung is latent — step 1 always uses the first rung — so it
warned and exited 0. That reasoning was wrong in the only way that matters, and
it was wrong because nobody made the loop climb. `stepsPerRung: 1` on that very
profile, one task, and the run died:

```
pi-ai provider "onegw" has no configured model "planning"     (UNKNOWN_MODEL)
```

**once a human had already approved a write.** `planning` is not a corner case;
it is the ladder doing the one thing a ladder is for, on a run that had
genuinely stalled. Two short tasks had reached step 1 and nothing else, which is
exactly why the bug survived as long as it did. Both profiles are fixed, and an
undeclared rung is now an **error** in a local profile as well as in the shipped
configs — proven by deleting `planning` from a copy and watching the check exit
1.

Reported as:


```
profile feature-loop: ladder rung onegw/planning names a model this profile
  does not declare.
  declared in its llm-pi-ai row: execution
  the first rung is what step 1 uses, so this hides until the loop climbs —
  and then the run dies UNKNOWN_MODEL mid-run, after a human has already
  approved work. Declare it or remove the rung.
```

**Latent is the word, and it was measured.** A short task on that profile
answers fine — the model said `hello` — and a gated write hits the gate and
stops there. The `planning` rung is only climbed to on evidence (steps spent,
consecutive failures), and neither of those tasks produced it. So an undeclared
*upper* rung is a real defect and **not** a reason to fail a check that has no
evidence it was reached: it warns and exits 0. The shipped configs still exit 1
(proven by breaking `cordis.patch.yml` and watching).

Three other corrections the same pass forced, all of which had the check
reporting nonsense on the first run:

- `declaredModels` swept in the patch's own **entry ids** (`- id: llm-pi-ai`),
  so every profile looked like it declared everything. It now reads a `models:`
  list and its items, in both the block and the inline form.
- A profile with no `prices:` at all was flagged for missing prices. One with no
  table has no cost ceiling to honour; `unpricedSteps` is the honest reading.
- A profile with no `llm-pi-ai` row at all resolves through the harness
  default, where these rungs are unreachable for a reason the check cannot see.
  It now says *skipped* rather than asserting a failure it has no evidence for.

A check that cannot fail is worse than no check, and this one did.

## Re-checked 2026-10-01 — the permission-preset trap, and what actually triggers it

`docs/SETUP.md` and `docs/RUNBOOK-SERVER.md` both lead with the same warning:
if `permission.defaultPreset` is `danger-full-access`, a feature-loop `ask` is
refused with `Error: the user rejected tool "X"` before any UI is consulted, so
no panel appears. Both describe it as the step that "trips everyone up".

**Re-tested on a fresh profile** (DSH 0.2.0-rc.1, this machine, whose global
`~/.dsh` has no `permission` section at all):

| Surface | Result |
|---|---|
| Mode chip | **`Workspace Write`** — not Danger |
| Feature Loop page card | `APPROVAL REQUIRED · write · REVIEW REQUESTED (policy): write: irreversible is always approved by a human.` |
| **The harness's own composer panel**, on a plain conversation | `Waiting for approval · REVIEW REQUESTED (policy): write: irreversible is always approved by a human. · Reject · Allow once` |
| Pending ask | the file was not written, correctly — still awaiting a human |

So the trap is real, and it is **not** the property the docs implied — it is a
property of the *settings*, not of a fresh profile or of this plugin. A new
profile on a machine without a `permission` section comes up correct, and the
harness's own composer panel does render the plugin's reason verbatim.

The second row is the one worth having: this plugin's whole premise is that it
hosts a gate on the harness's loop, and the claim that a human can approve a
step **in the harness's own conversation UI** was previously only ever proven
through a container with the preset pinned by its settings template. It holds
without that.

Two doc changes follow, both about not sending a reader after a problem they do
not have: the warning is now a verified note rather than a lead, and the
troubleshooting row tells you to read the mode chip first.

### 13. A settled card lost the reason it was raised for

**Observed:** with **two loops in flight at once**, the page rendered two
approval cards; clicking Allow on the first settled it and left the second
showing:

```
APPROVAL REQUIRED | asked 5:44:47 AM | write | RUN | session-43d540b8-…
```

and nothing else — where the live card beside it read the full
`REVIEW REQUESTED (policy): write: irreversible is always approved by a
human.` The run/call/tool were all still there. The **gate's reason** was the
thing that vanished, and with it the only text that said what the human was
actually being asked to agree to.

**Why:** a card re-materialised from its feed line has no `PendingApproval`
behind it — the ask left `pending` when it settled — so
`toApprovalGate`'s fallback prompt took over. Worse, `ASK_BY_ID.clear()` ran on
every render and only repopulated from `pending`, so after one more poll even
the tool name and run id were gone and the card read `write needs approval`.

The single-ask proofs could not see this: with one ask there is nothing to
confuse it with, and the card under test was always the live one.

**Fix:** `ASK_BY_ID` is now additive for the asks the thread is showing and
evicted by the same slice that bounds the settled list — so a re-materialised
ask keeps the tool, call, run and reason it had, and the gate text is the
plugin's own again. Both were verified with two concurrent loops through the
generated profile: one card live with buttons, the other settled with no
buttons and its full reason intact, and `d1.txt` written while `d2.txt` was
not — the click settled one ask, not whichever card happened to be first in
the DOM.

`test/assistant-ui.test.ts` pins the shape: a re-materialised ask keeps the
reason verbatim, every outcome settles the card through the right field, and
`expired` never renders as a refusal.

### 12. An ask nobody answered disappeared instead of saying so

**Observed:** with `dashboard.answerTimeoutMs: 20000` and a human who walked
away, the card went blank after 20 seconds. No outcome, no explanation, and no
buttons. The page's feed said `expired: write — no answer within 20000ms`; the
card said nothing at all. Screenshot at
[`evidence/expiry-20261001.png`](evidence/expiry-20261001.png).

**Why:** the thread is built from `pending`, and an expired ask has left it.
`ApprovalGate.resolution` and the card's own "Expired — no answer in time."
text already existed — but the field was only ever set from the response the
page itself sent, so the one path where nobody responded could not reach it.
The code for the right answer was in the file and unreachable.

**Why the feed could not carry it either:** `expired: write` names a TOOL. A
run with two writes in flight cannot say which card just went blank, and
attributing the expiry to the first live ask would put "Expired" on a card the
operator is still holding — worse than saying nothing.

**Fix, in three parts:**

1. `approvals.ts` **and `dashboard.ts`** put the ask's **id** in every settle
   line, on every path. The first attempt edited only the *default* text in one
   module, and every other path — the timeout, the abort, the POST with
   operator feedback, and the dashboard's own private registry — kept passing
   its own text. `dashboard.ts` has a second copy of the registry (the one that
   owns its asks, used when `startDashboard` is called with no shared registry)
   and it drifted exactly the same way.

   The shape of the mistake is the part worth keeping: **a default text and an
   explicit argument are two paths, and only the one you read gets the fix.**
   The test now asserts the id on all four settle paths, and it is in
   `test/dashboard.test.ts` because `startDashboard`'s private registry is not
   reachable through `createApprovalRegistry` at all.
2. `expiredOutcomeOf` (`src/approval-bridge.ts`) reads those lines back into
   ask-id → outcome. A line without an id is **ignored, not guessed at**, and
   that is asserted.
3. `web/app.tsx` re-materialises a settled ask from its feed line, with the
   outcome attached, so the card stays on screen saying *Expired* instead of
   vanishing. Bounded by the feed's retention (200 lines) and the last 12 asks.

Verified end to end at 20s: the card appears, nobody clicks, at 20s the thread
shows `Expired — no answer in time.`, the pending count returns to 0, and the
file the run wanted to write does not exist. The expiry path is the fail-closed
direction, so it is worth being explicit: **an unanswered ask writes nothing.**

## Fixed (2026-10-01) — the environment set, plus the five it was hiding

### 11. A stale checked-in bundle passed every test that claimed to check it

**Observed:** `npm run dashboard-bundle` rewrote one line of
`assets/assistant-ui/MANIFEST.txt` — the `built:` timestamp — and nothing else.
The three assets and `client.js` were byte-identical to what was committed.

**Why that is the finding, not the non-finding:** the manifest records the sizes
the build measured, and the build rounds to whole kB. So a rebuild is
*indistinguishable from a no-op*, and equally: **a stale artefact was
indistinguishable from a fresh one.** `web/entry.tsx` is a source, `assets/` is
build output, and the artefact is what the page actually serves — so editing a
stylesheet and not rebuilding leaves the page serving yesterday's CSS while every
assertion about the bundle passes, because the bundle is self-consistent.

**Fix:** `test/assistant-ui.test.ts` compares the three files against the sizes
MANIFEST.txt recorded, and names the fix in the failure message. Proven by
appending 80 kB to `dashboard.css` without rebuilding — the test failed and
named the file and the command.

The ceiling is stated in the test rather than hidden: a SIZE check cannot see a
one-line edit inside a 480 kB bundle that rounds to the same kB. It catches a
stale artefact, which is the failure that happens. A hash would be strictly
better and needs the builder to write hashes into a manifest nobody edits by
hand.

**And the exclusion it sat behind was wrong.** `test/assistant-ui.test.ts` was
in `scripts/check-test-list.mjs`'s EXCLUDED set with the note *"asserts against
the built client bundle, which is not in a bare checkout"* — but the bundle is
CHECKED IN, so it runs with no install. Verified on a bare clone with only
`npm install`, then moved into the CI list. Its 7 tests now run there (272 pure
tests, was 265). An exclusion note that was never tested is a comment with
authority, and it had removed the only test watching the artefact.

## Fixed (2026-10-01) — the environment set, plus the four it was hiding

### 10. Every demo command had been broken for six days of commits

**Observed:** `bash demo/run.sh` — the command the README opens with, and the
proof that the loop reaches `goal-met` in one command — failed with
`ERR_MODULE_NOT_FOUND: …/src/cli.ts`.

**Why:** commit `633c1e2` ("Fold the HITL dashboard into the DSH UI") deleted
`src/cli.ts` as a side effect of a change to something else. `demo/run.sh` kept
pointing at the deleted path, and so did all four npm scripts (`demo`,
`demo:steps`, `demo:cost`, `demo:nojudge`). Nothing referenced it from a test,
the typecheck list, or CI — because `src/` is a hand-listed set and the deletion
was consistent with it.

**Why it survived six days of commits:** the one thing that would have caught it
is a run, and every run in that window was `npm test` or a profile check. A demo
that cannot run is not a failing test; it is an absence of one.

**Fix:** the entry point is back as `demo/cli.ts` — the demo's, not the
published package's, since `src/` is the plugin's import closure and the CI
typecheck list is derived from what is in it. All four commands re-run against
the real model:

| Command | Outcome | Steps | Cost |
|---|---|---|---|
| `bash demo/run.sh` | `goal-met` | 6 of 15 | $0.0039 |
| `bash demo/run.sh --max-steps 6` | `budget-stop` (step ceiling) | 6 of 6 | $0.0031 |
| `bash demo/run.sh --budget 0.000001` | `budget-stop` (cost ceiling) | 2 of 15 | $0.0004 |
| `bash demo/run.sh --judge none` | `goal-met` | 4 of 15 | $0.0024 |

`scripts/check-typecheck-list.mjs` now also fails if `demo/cli.ts` goes missing
or if `run.sh` stops referencing it — the check that would have caught it,
attached to the one job already responsible for "what is checked by what".

## Fixed (2026-10-01) — the environment set, plus the three it was hiding

### 8. A ladder rung naming an undeclared model is not a config smell — it is a dead run

**Observed:** the container's loop started, the dashboard recorded the run
(`route: onegw/execution`, `step: 1`, spend metered), and then:

```
pi-ai provider "onegw" has no configured model "execution"    (UNKNOWN_MODEL)
```

**Why:** `execution` **is** a gateway alias — `/v1/models` returns it. But
**llm-pi-ai resolves a ladder rung against the provider profile's own `models:`
list, not against the gateway.** A deployment that never declared that id makes
the rung unreachable, and the run dies on step 1 with the dashboard already
showing a healthy-looking run. Nothing errors at boot; nothing errors at config
load; `validateSpec` is happy because the spec is internally consistent.

**Why it is not one deployment's mistake:** the same rung was in the shipped
`cordis.patch.yml` that every deployment inherits, and in the profile
`scripts/make-profile.sh` generates. Fixing only the container would have left
the local profile shipping the same dead rung.

**Fix:** all three now name ids their own provider profile declares, and the
`prices:` table keys the same `provider/model` strings the ladder uses — the
second half mattered just as much, because a price keyed by anything else left
the route the loop actually took unpriced (`unpricedSteps: 1` against a ceiling
that can then never stop anything).

`scripts/check-ladder-models.mjs` now fails on any shipped spec with a rung that
is undeclared, unpriced, or priced-but-unused. It ran on the repository as it
stood and fired on `cordis.patch.yml` immediately, which is the cheapest
possible proof that the check earns its place.

## Fixed (2026-10-01) — both open warts

### 5. `POST /api/approvals/:id` ignored the query token — **fixed**

**Observed:** a scripted approval using `?token=…` got
`401 missing or invalid dashboard token` while every read route accepted the
same query token.

**Why:** the settle route called `authorized(req, url, false)` — `allowQuery`
was `false` — so it took the token from the `x-dashboard-token` header only.
The read routes passed `true`. The two halves of one five-route API disagreed
about how to authenticate, and the failure was a 401 that reads as "wrong
token" when it means "wrong *mechanism*".

**Fix:** `authorized()` no longer takes the flag — every route accepts the
query token, header first. What the flag bought was nothing: the header token
sits in the same `curl`, and the real guard against a browser reaching across
an origin is `sameOrigin`, which still runs on the settle route and is still
asserted by a test with `origin: http://evil.example`. `test/dashboard.test.ts`
pins both halves: a query-token POST settles the ask, a no-token POST is still
401, and a query token from another origin is still 403.

### 6. Only an SSE client counted as a "watcher" — **fixed**

**Observed:** polling `GET /api/state` every second never let the registry
claim an ask, so in a headless run the gate's `ask` was refused with
`tool "write" requires approval, but no approval channel is available` — the
page was right there, polling, and still invisible to the claim.

**Why:** `noteWatcher()` was called only from the `/api/events` SSE handler.
A `/api/state` poll was not a watcher. The suggested fix was left undone with
the note that widening the precedence rule "risks stranding asks" — which is
true of the *silent* version and false of this one, because the client is now
told.

**Fix, both halves:** `/api/state` registers the heartbeat (the same
`noteWatcher()` the SSE route and the in-UI page's `live()` already call), and
the response carries `watching`. A client can now ask "am I currently eligible
to answer?" instead of discovering it when a gate refuses an ask minutes later.
The stranding case is bounded exactly as before — the 15s `WATCHER_TTL_MS` and
the `unavailable` settle — and `answers: false` still never registers a
heartbeat, so observe-only stays observe-only.

---

## Verified working (2026-09-29, live instance on :3188)

### The human input path, in a real browser

Driven over the Chrome DevTools Protocol (headless `--dump-dom` never returns
on this app: it holds a stream open, so the load event never settles).

| Check | Result |
|---|---|
| Feature Loop page renders | `.fl-page` present, "START A LOOP" |
| Task input + submit | input and "Start loop" button present |
| Target is the **opened workspace** | `Runs in "default-workspace" — /Users/.../default-workspace` |
| Dashboard renders | workspaces / approval thread / runs, with the pending-ask panel |
| Host chrome untouched | host `button` radius `0px`, host `h2` normal size |
| Plugin stylesheet mounted | `<style data-plugin="@freepeak/dsh-feature-loop">` in the DOM |

The last two rows are the live confirmation that issue 1 is actually fixed: on
the pre-fix build the same probe measured `999px` and `12px uppercase` on the
host's own chrome.

### The full HITL cycle, headless, against a real model

`~/.dsh-flt3188/profiles/flt-hl/hitl_cycle.py` holds `GET /api/events` open
(the watcher signal) and settles the ask over `POST /api/approvals/<id>`.

| Outcome | Gate | Decision | Result on disk | Verdict |
|---|---|---|---|---|
| `allowed-once` | fired | `{"ok":true,"outcome":"allowed-once"}` | file created, contents `hello` | **pass** |
| `rejected` | fired | `{"ok":true,"outcome":"rejected"}` | no file | **pass** |

Gate reason string, verbatim from the live run:

```
REVIEW REQUESTED (policy): write: irreversible is always approved by a human.
```

### The HITL cycle in a real browser, both directions

Driven over CDP against the :3188 instance: type a task, press **Start loop**,
the gate intercepts the model's `write`, the card appears, a human clicks.

**Allow**

| | |
|---|---|
| Card | `APPROVAL REQUIRED` — `write`, `REVIEW REQUESTED (policy): write: irreversible is always approved by a human.` |
| Controls | **Allow once** / **Reject** |
| Before click | `/tmp/fl-ui-proof.txt` **does not exist** — the call is genuinely gated |
| After click | thread `1 → 0`, card cleared, file written, contents `ui-proof` |

**Reject**

| | |
|---|---|
| Card | same card, at step 1/15 |
| After click | feed records `APPROVAL rejected: write`, thread `0`, **no file** |

Both runs reported `ROUTE ONEGW/EXECUTION`, live spend, and a judge score
(`0.9833/3`, `1.2289/3`) — the meters are real, not placeholders.

### Two things that made this hard to reach

**A patch entry for `id: feature-loop` REPLACES the whole config.** It does not
merge. A partial override — the natural thing to write when you only want to
change one policy — silently deletes `spec`, and a spec-less policy builds no
gate at all: every tool call proceeds and the loop looks perfectly healthy while
reviewing nothing. I hit this myself and lost a cycle to it. Override the whole
row, or none of it.

**`gatePolicies` is keyed by TOOL NAME, and `auto-if-confident` proceeds when
the judge is confident.** This was the shipped default for `write`, with a
working local judge, so writes were routinely auto-approved and a human saw no
approval at all. The throughput posture is real — a judge that clears
confident steps is the feature, not a bug — but as the *first* thing a new user
 sees it reads as "the gate is broken", when it was working exactly as
configured. **`write` is now `always-approve` in both shipped configs**
(`cordis.patch.yml` and `docker/profile.patch.yml`); `edit` stays
`auto-if-confident`. Put `write: auto-if-confident` back when you trust the
judge; nothing else changes.

### The browser click path, and the page's own geometry (2026-09-29, live on :4100)

A fresh isolated instance — `DSH_HOME=$HOME/.dsh-flt-4100`, profile `flt4100`,
plugin installed from a worktree by `file:` path, peers resolved — then driven
over CDP against a real model. The run was started from the plugin page's own
composer, and the decision was made by clicking the card's own button. No
scripted API in the loop.

| Check | Result |
|---|---|
| Start a run from `.fl-start-input` | the loop runs; the gate raises on `write` |
| Card in the in-UI thread | `REVIEW REQUESTED (policy): write: irreversible is always approved by a human.` with **Allow once** and **Reject** |
| **Allow once** (clicked) | tool ran, file written, contents `hello` |
| **Reject** (clicked) | `tool "write" requires approval…` — no file, byte for byte |
| Two gates in one run | a `write` then a `bash`; both settled, both took the click |
| Registry after the click | pending count 0 within 4s, in every case |
| Contrast, every text node on the page | 14/14 pass WCAG AA against the surface each one sits on |
| Responsive at 760–1440px | the dashboard collapses to one column, then two, then three; no horizontal overflow |

One thing about the reject branch, because it looks like a bug in the browser
and is not: after the click, the card stays on screen for about four seconds and
then disappears. It is not stuck. The registry is cleared immediately (pending
count 0 within one poll), and the card is unmounted by the next remote read, so
the visible card is simply the last frame the thread rendered before the new
arrived. A card still showing a *second* poll after the click is a real
re-raise, and the feed names it.

The page's geometry had drifted from the harness's own pages in nine measurable
ways; see the table in `CHANGELOG.md` under "The plugin page is now drawn with
the harness's own metrics". Three of them were defects rather than taste, and
one of those is the reason a reviewer would have seen 40px buttons on a page
that asked for 32px: `shell.css` still had a bare `button` rule. That rule is
invisible to `css-scope.test.ts` — it is anchored — so `test/css-parity.test.ts`
is what holds it gone.

### The page was taller than the window on every small window

**Observed:** at a small window the page needed scrolling to reach the approval
card, and the plugin page behaved differently from the harness's own pages in the
same column.

**Why:** `shell.css` sized three page-height rules in `vh`. The page is the
centre COLUMN, so the window's height is not the page's height — the window also
carries the host's sidebar (56px collapsed, 280px open) and the frame's top
clearance, and that gap widens as the window narrows. Two of the three were
floors, and a floor is the worst direction for this: the approval thread's
`min-height: min(70vh, 720px)` resolved to 334px at a 480x560 window with the
page's furniture already taking 384px above it, leaving 176px of the thread
visible. (`min()` also took the SMALLER of its two arguments, so the `720px`
ceiling applied only below a 1029px-tall window — the range where a ceiling was
least needed, and the floor dominated everywhere else.)

**Fix:** the thread floor is `min(420px, 60cqh)`, the sticky columns take
`100cqh`, and the page root declares `container-type: size` so a container height
is queryable at all. Measured after: the thread is fully above the fold at
1280x760, 1024x700 and 820x700; at 480x560 the page scrolls to the rest, which is
what a page that is taller than the window should do.

**What is NOT the plugin's problem, and was worth measuring before changing
anything:** below 1024px the harness auto-collapses its sidebar to a 56px rail
(`ui-layout/src/client/stores.ts`, `SIDEBAR_AUTO_COLLAPSE`), which leaves the
centre column ~460px at a 520px window. Below ~600px of window the column is
narrower than the harness's own `CENTER_MIN` of 400px and the page's own
`clamp(24px, 4vw, 48px)` gutter starts to dominate. The harness's own pages
behave the same way there — the conversation page and the plugin manager were
both measured in the same 240px and 200px columns, and both overflow. The
plugin's page gutter is deliberately the harness's own, so it is not narrowed
here to compensate for a frame the harness itself does not support at that size.

### The composer was 23px wide in a narrow column

**Observed:** at a 440px window the approval composer's textarea was 23px wide,
with a 36px send button beside it. At 380px it was 8px.

**Why:** padding stacked four deep on the way from the thread's edge to the
field. `.hitl-thread-viewport` inset 16px per side, `.hitl-thread-footer` 12px,
`.hitl-composer-shell` 12px, `.hitl-composer-input` 4px — 88px gone before a
character was typed, and every one of those is a subtraction at every width, not
only a narrow one. The harness's own composer stacks two layers
(`ui-conversation/src/client/input/editor/composer-editor.module.css`: its card
insets, its editor does not) and measures 341px in the same 384px column.

**Fix:** the viewport and the footer are wrappers, so they carry no horizontal
padding, and the field takes the card's inset. One layer, 24px. Field width in
that column: **23px → 303px**, and 8px → 243px at 380px.

**Two wrong answers on the way, both worth recording.** The edge inset the
viewport used to carry has to be given back to the messages, and:

- `padding: 0 16px` on the message takes 32px out of its *content* box, so the
  text sits 16px inside a border the card draws itself — a double inset at the
  sides and none at the top and bottom;
- `margin: 0 16px 14px` on `width: 100%` moves the *box* 16px outward, because
  100% is already the parent's content width. Measured at 1280: viewport right
  edge 1226, welcome plate right edge 1242 — the card's border over the thread's.

`max-width` with `auto` sides is the property that does both jobs: it centres the
message under the thread's `--thread-max-width` and clamps to the container when
that is narrower. Asserted by value, not by pattern — a loose `margin: … auto`
match passes either side of a duplicated declaration.

### The activity pane grew to its content below 760px

**Observed:** at a 744px page with 11 activity entries, the page scrolled 1483px
past the approval thread to reach the end of the feed.

**Why:** the `max-width: 759px` query releases `.sidebar`/`.rail` to `position:
static; height: auto; overflow: visible` — right for a sticky column, which is
meaningless once the page is one scroll. But it also released the panes inside
them, and a pane is `overflow: hidden` with no cap, so it sized to its content.
`.pane-scroll` is `flex: 1 1 auto; min-height: 0` inside a bounded parent, so in
the two-column layout the parent's cap was what bounded it; released, nothing
did.

**Fix:** the panes keep `max-height: calc(100cqh - var(--header-h) - 28px)` and
scroll inside their cards — a list that scrolls in its card is what the wider
layouts already do. Measured with 6 entries at 1024x700: page scroll 1652px
instead of 2227px, feed 481px in a 568px cap.

### The standalone page was still measuring the window

**Observed:** at a 1280x300 window the standalone dashboard's thread was sized by
60% of the *window* — 180px — with the composer 115px below the fold.

**Why:** the standalone page is the second front end onto this stylesheet, and the
whole of this branch's work was under `.fl-page`. Its thread is a direct child of
`#root`, so nothing above it was a query container, and a `cqh` with no ancestor
container resolves against the smallest container there is: the viewport. Every
other fix in this file was therefore correct on one front end and absent on the
other, which is exactly the failure mode of testing one page and calling the sheet
fixed.

**Two more traps on the way, both silent:**

- `body.fl-standalone { … }` matches **nothing**. The marker is on `<html>`
  (`src/dashboard-page.ts`), so the body is its descendant — measured
  `containerType=normal` on the live element against a stylesheet that plainly
  declared it. There is no diagnostic for a rule that does not match.
- `container-type: size` on that rule, with the `height` on `<html>` instead, put
  `html` at **0px** tall: size containment means the box cannot take its size from
  its content, and the root has no content. Every `cqh` on the page resolved to 0
  and `min(420px, 60cqh)` collapsed to 0 — the thread lost its floor entirely,
  which reads as "no floor at all" rather than as a CSS bug.

**Fix:** `html.fl-standalone body` carries the container, the `container-name`, and
`height: 100dvh` together, and `main` is the scroller. Verified at 1280x800,
1024x700, 760x700, 600x600, 440x800 and 380x760: no horizontal overflow, no element
outside its container, the composer in the viewport. At 1280x300 and 440x400 the
page scrolls and the composer is reachable (285px and 385px after scrolling) —
three panes of real content do not fit in a 300px window, and squeezing the thread
to pretend otherwise hides the composer rather than moving it.

`test/css-scope.test.ts` now fails any selector whose rightmost compound is a
document element without reaching it through `html.fl-standalone`, and pins the
container and the height on the same box.

### Still unverified

- Nothing in the two sections above. The last open item from §"Still
  unverified" — the profile-must-supply-the-peers trap of issue 4 — is now
  written down in `README.md` (installing by hand) and in `docs/SETUP.md` §Step
  2, next to the profile that would otherwise install cleanly and do nothing.

---

## Verified working

A full HITL cycle, driven end to end against a real model on a real harness:

- a model decides to call `write`
- the plugin's gate intercepts it and raises
  `REVIEW REQUESTED (policy): write: irreversible is always approved by a human.`
- a human decision arrives over `POST /api/approvals/:id`
- **allow** → the tool runs, `/tmp/fl-hitl-proof.txt` contains `hello`
- **reject** → `Error: the user rejected tool "write"`, no file created

Harness: `~/.dsh-flt3188/profiles/flt-hl` (`hitl_cycle.py`).
