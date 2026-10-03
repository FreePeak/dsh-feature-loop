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

**The numbered entries below are this session's findings, in the order they
were made.** They are numbered by discovery, not by severity, and two of them (1i, 1s)
were both "1i" until a cross-reference caught it — which is why the map is here
rather than a list of letters:

| § | finding |
|---|---|
| 1a | nothing in this repo ran on the model it was supposed to run on |
| 1b | `peers resolved` was reported as "your profile is ready" |
| 1c | `make profile` hung for nine minutes with the registry unreachable |
| 1d | the settings page wrote a file nothing decided with — and said so |
| 1e | two shapes of a bad number in the same settings file behaved differently |
| 1f | `make check` could not run where it was meant to, and `make test` lied |
| 1g | a safety schema that was never run — and a throw that is loud but not fatal |
| 1h | `make up` reported a dead container as up — and no HTTP probe can fix it |
| 1i | the ladder check named three files and the repo has four |
| 1j | naming a bug while a no-op call would have made the export look used |
| 1k | a hand-edited settings file can name a tool that does not exist — silently |
| 1l | picking a posture discards the hand-set fields without saying so |
| 1m | the settings page called the strictest gate the loosest one |
| 1n | a MIXED policy file was shown one posture's copy, which was true of one class |
| 1o | the demo's committed transcript was two runs spliced into one |
| 1p | a ceiling row that proved nothing about the ceiling |
| 1q | a call that ran and failed was invisible to the ladder |
| 1r | a helper whose doc claimed a detector was impossible, tested by the helper |
| 1s | five of six detectors reach a DSH deployment; the sixth cannot |
| 1t | KNOWN-ISSUES had two sections numbered 1i, and nothing noticed |
| 1u | the runbook's sandbox is a throwaway copy, and never said so |
| 1bb | The headless profile asked a question nobody was there to answer |
| 1bc | The judge and the brief asked a model nothing here had ever run |
| 1bd | Eight profiles were running bytes nobody could name |
| 1be | The harness's fail-closed told the model the wrong thing |
| 1bf | The settings page's claim was true, and I checked it anyway |
| 1bg | A clean clone cannot typecheck `src/plugin.ts`, and the script said why — wrongly |
| 1bh | A green integration run was partly a property of this machine |
| 1bi | The README's first command failed on a fresh clone |
| 1bj | The check that guards §1t could not see a third of the file |
| 1bk | `byRoute: {}` beside a real `costUSD` taught the optimizer every route was free |
| 1bl | The usability check had only ever asked one question |
| 1bm | Five cards that said the same thing, and a lost run record hiding in plain sight |
| 1bn | One gate, three tables, and nothing that compared them |
| 1bo | The release workflow produced a tag and nothing else |
| 1bp | An 87% success rate, computed from turns that did nothing |
| 1bq | Two rates that were one number |
| 1br | A typical run costs $0.00 and takes 0 steps |
| 1bs | The human-escalation alert that could never fire |
| 1bt | Zero milliseconds, round-trip |
| 1bu | The speed axis, empty since the day it was written |
| 1bv | The plugin path's wall clock, hiding in the event it was already reading |
| 1bw | Open: the run record still does not land on the harness path |


### 1a. Nothing in this repo ran on the model it was supposed to run on

**Observed:** every deployment and the demo ran on concrete model ids —
`opencode/deepseek-v4.1-flash`, then `xai/grok-4.7`, and `xiaomi/mimo-v2.5` in
the demo — while onegw's own `execution` EXECUTION role alias sat declared in
`/v1/models` and unused. Switching the default to `execution` then produced a
run that died on step 1: `404 unknown provider onegw`.

**Why, in two parts that had to be found separately:**

1. *The alias was not running* because commit `d9464b9` fixed a real
   `UNKNOWN_MODEL` bug — `execution` named in a ladder, absent from the
   deployment's own `models:` list — by replacing the alias with concrete ids
   everywhere, including the demo. The fix was correct for the bug and left the
   repo on a model nobody here had ever run. "Resolves" and "tested" are
   different questions, and only the first one had a check.
2. *The alias could not run from the demo* because a route key is not a gateway
   id. Every route here is `provider/model` — that is what a ladder rung names
   and what the price table keys on — but onegw's role aliases sit at the top
   level of its id space:

   ```
   POST /v1/chat/completions {"model":"execution"}        -> 200
   POST /v1/chat/completions {"model":"onegw/execution"}  -> 404 unknown provider onegw
   ```

   The plugin path never hits this: `llm-pi-ai` resolves a rung through its own
   catalog and puts `entry.id` on the wire. Only the standalone transport sent
   the route key verbatim.

**Fix:** one tested route, `onegw/execution`, in `cordis.patch.yml`,

Also measured on the wire, the two refusals are NOT equal in cost. Same
profile, same build, same one-line task:

| mode | the model did |
|---|---|
| `ask`, nobody watching | read the plugin sentence and **stopped in one step** |
| `deny` | read the bare review text and **retried** the write with |
| | `sandbox_permissions: workspace-write` before stopping |

So naming the true reason is also the cheaper refusal: it does not spend a
second call re-asking a gate that has already answered. This is the reason
the message carries what to do about it, not only what happened.
`docker/profile.patch.yml`, `docker/settings.template.yaml`,
`scripts/make-profile.sh` and the demo — with `execution` declared in every
`models:` list so the alias resolves, each price table rekeyed to match, and
`TESTED_ROUTE` in `scripts/check-ladder-models.mjs` asserting that no shipped
ladder names anything else. `createOnegwClient` drops the `onegw/` prefix at the
transport, and `test/llm.test.ts` pins that.

**Verified:** `bash demo/run.sh` -> `goal-met - 4 steps - $0.0039`, every step
labelled `onegw/execution`, against the live gateway. Both new assertions were
proven to FIRE by reverting each one and watching it fail, not merely to pass.

### 1b. `peers resolved` was reported as "your profile is ready"

**Observed:** `scripts/make-profile.sh` printed `==> peers resolved (10 harness
packages on the plugin's entry)` and `==> compose check` passed, then a real
`dsh headless` run on that profile wrote the file it was asked for with
**nothing gated**. The boot carried one line of warning —
`feature-loop (@freepeak/dsh-feature-loop): failed to import` — and the loader
continued past it, which is by design.

**Why:** two necessary conditions were being read as a sufficient one. The peers
resolve, so the plugin is inert. The cause was `lib/` absent from the installed
copy: the package ships built ESM in `lib/`, `lib/` is `.gitignore`d, and a
`file:` dependency installs whatever happens to be on disk — so an unbuilt
checkout yields a profile whose plugin cannot import, and whose diagnostics
name neither the plugin nor the operator. The script's pre-flight guard
compounded it: it *refused* ("`$REPO/lib` is missing — run `pnpm build` first")
instead of building, turning a fixable state into a dead end.

**Fix:** the script now builds `lib/`, then imports the package FROM INSIDE
the profile — the only place its `@deepseek-ai/*` peers resolve — and exits
non-zero naming the fix if either step fails. That is the check that turns "the
row composed" into "the module loads". `docker/Dockerfile` has run the same
import since the container shipped with the same silent failure.

**Verified:** the failure reproduced by removing `lib/` from an installed
profile (`import FAILED: Cannot find module .../lib/index.mjs`) and the pass
after restoring it; then a real run on a generated profile with the gate live —
`write` raised `REVIEW REQUESTED (policy): write: irreversible is always
approved by a human.`, Allow once produced the file, Reject did not. The two
`docs/evidence/in-ui-*.png` frames were re-taken against that run, because the
committed ones came from a boot where nothing was gated.

**And the same defect one layer out, in the tarball.** `package.json` `files`
ships `lib/`, `lib/` is `.gitignore`d, and every entry in `exports` points at
`./lib/*.mjs` — so `npm pack` on a clean tree produced a tarball with 14 files
and **zero** `lib/` entries. Fixed with `prepack: npm run build` (`prepack`, not
`prepare`: prepare also runs on `npm install` in a consumer's tree, where there
are no sources to build from).

It had stayed invisible because the release workflow only tags and creates a
GitHub release — it does not publish to npm, so no install had ever consumed
the artifact. Verified end to end the way a consumer would: `npm pack` on this
branch, install the **tarball** into a fresh profile with pnpm 9, then a real
`dsh headless` run — `IMPORT OK`, no import warning, and `REVIEW REQUESTED
(policy): write: irreversible is always approved by a human.` with the file
absent. Deleting `lib/` from that same installed tarball reproduces
`Cannot find module .../lib/index.mjs`, which is the proof the `prepack` is
what carried it.

### 1bb. The headless profile asked a question nobody was there to answer

**Observed:** against the hand-built `~/.dsh/profiles/feature-loop-headless`
(which the docs still point people at), `dsh --profile feature-loop-headless
headless "create a file"` returned

```
Error: tool "write" requires approval, but no approval channel is available
```

and produced no work. The web twin, same machine, same gateway, gates and asks
perfectly well — so the difference is not the plugin.

**Why:** the two profiles were built at different times and `gateMode: ask` was
copied into both. `ask` needs a MOUNTED ANSWERER, and in `dsh headless` nothing
ever mounts one: no dashboard page is opened and no browser polls
`/api/state`, so every ask resolves "no answerer available". The gate then fails
closed — which is the correct behaviour and a useless outcome, because the run
has no way forward. The model spent its remaining budget reasoning about whether
`Bash` was a legitimate alternative and then stopped.

The same trap has a second door: a WEB profile whose dashboard port is already
taken also has no answerer on the port you are looking at, and the working
dashboard is on the other one.

**Fix:** `gateMode` follows the app. `scripts/make-profile.sh` stamps `ask` for
`--web` and `deny` for `--headless` — `deny` refuses the step at once with an
honest reason, which is strictly better than a refusal reported as a sandbox
denial, and it is what the docs already recommend for unattended runs. Both live
profiles fixed by hand, each carrying the measurement in a comment beside the
line it changes.

**Verified:** the same headless command that failed above now returns
`REVIEW REQUESTED (policy): write: irreversible is always approved by a human.`
with the file absent and no error, and the web profile still asks and still gets
answered.

**And the check that keeps it from coming back.** `scripts/check-ladder-models.mjs`
— the script that already reads every local profile, because two of them were
still carrying dead rungs — now also reads each profile's `package.json` and
fails a headless profile that still says `gateMode: ask`. On this machine it
named `flheadless` and `flproof`, both of which had the defect and neither of
which anything had looked at since they were created. Proven to fire by putting
`ask` back and watching it exit 1.

Which app a profile boots is read from the `dsh.profile.bundles` the harness
itself reads, not guessed from the profile's name — `flproof` says nothing about
being headless, and `feature-loop-headless` would say something that could be a
typo.

### 1bc. The judge and the brief asked a model nothing here had ever run

**Observed:** `src/plugin.ts` carried `config.judgeModel ?? 'xiaomi/mimo-v2.5'`
and `cordis.patch.yml`'s documented brief example said
`model: xiaomi/mimo-v2.5`. A deployment that set `judge: chat` without also
setting `judgeModel` — or that enabled `dashboard.brief` by copying the
documented example — was asking a concrete id this repo does not declare
anywhere and no shipped config names.

**Why:** §1a's exact shape, one rung over. That fix made `execution` the only
ladder route and added a check for ladder rungs. But the ladder is not the only
place a model id is hard-coded, and the other two places were never looked at.
The id resolved perfectly on the gateway (`POST /v1/chat/completions
{"model":"xiaomi/mimo-v2.5"}` → 200, verified 2026-10-03), so it failed
silently — *resolves* and *tested* are different questions and this one had no
check of either kind. Nothing reads a judge's model except the judge itself,
which is why it was invisible: the gate, the dashboard, and every test were all
perfectly healthy while the judge quietly asked something else.

**Fix:** both defaults are `execution`, and `check-ladder-models.mjs` now asks
the second question about both — a hard-coded model default must be the tested
route. It reads them from source rather than keeping a list, because a list is a
promise somebody has to keep and that is how all four of these drifted.

The first version of the check swept every `?? '<string>'` in `src/plugin.ts`
and reported `ask`, `none`, `.feature-loop/runs.jsonl` and `laya` as model
defaults — three false positives on the first run, the same lesson
`declaredModels` learned when it swept in the patch's own entry ids. The field
name is the discriminator: a default MODEL is the one passed to something that
asks a gateway.

**Verified:** both halves proven to fire by restoring each default in turn —
`src/plugin.ts` and `cordis.patch.yml` each exit 1 naming the file and the id.

### 1bd. Eight profiles were running bytes nobody could name

**Observed:** every installed profile on this machine carried a `client.js`
that matched no build in any checkout. Two of them installed a worktree that
no longer exists.

**Why:** a `file:` dependency is installed, not watched. `pnpm` copies (or
hardlinks) the package at install time, so a rebuild in the source tree, a
commit, and a branch switch all leave the profile serving the bytes it was
installed with. Nothing errors, the row composes, the gate works — on the
wrong build. Measured on this machine: `flheadless` and `flui` installed
`.worktrees/fix-message-ownership`, which does not exist and never will again;
the profile is running the last bytes that tree ever produced and a reinstall
would only fail.

**Fix:** `check-ladder-models.mjs` now compares each profile's installed
`client.js` against the tree that profile DECLARES it installs — not against
whichever checkout the reader is standing in, which would report a profile
pinned to another branch as stale for the crime of being pinned. Two cases,
different severities: a hash mismatch is reported and a reinstall fixes it; a
`file:` spec pointing at a tree that is gone is an ERROR, because reinstalling
cannot fix that. All six affected profiles repaired on the spot.

**The measurement that changed the design.** pnpm **hardlinks** a `file:`
dependency out of its store, so a profile's `client.js` and the source tree's
can be the same inode (`nlink 9`, verified). Content comparison cannot see a
difference between two names for one file — and that is not a defect, there is
nothing to report. The check therefore exempts the same-inode case explicitly
rather than comparing hashes that are equal by construction. `lib/` cannot
serve as the signal instead: tsdown's chunk names are content-hashed
(`approvals-05MIOAcj.mjs`) and change on every build.

Proven to fire by rebuilding the SOURCE tree under an installed profile and
watching the check exit 1 naming it.

### 1be. The harness's fail-closed told the model the wrong thing

**Observed:** with `gateMode: ask` and no front end open, a gated `write`
came back as

```
tool "write" requires approval, but no approval channel is available
```

which the model then reported as **the sandbox denying the write** — and spent
its remaining budget reasoning about whether `Bash` was a legitimate
alternative, before producing no work at all. The refusal was correct; the
sentence it came back in was not.

**Why:** that string is the harness's (`packages/core/tools/src/index.ts`,
the `unavailable` branch of the approval outcome), and from there it is
accurate — the harness genuinely has no channel. It is answering for itself,
not for the deployment. The model receives it as a *tool* verdict, so it reads
"the filesystem objected" and goes looking for a narrower tool.

This plugin can see the answerer directly. `noteWatcher` is called by every
`/api/state` poll and every `remote.live()` — the in-UI page and the standalone
dashboard both heartbeat through it — so `watcherActive()` is a 15-second TTL
fact, not a prediction. §1bb fixed the headless profile by telling operators to
set `gateMode: deny`; that is the right config and it is also a documentation
answer to a defect this plugin can answer properly.

**Fix:** `gateForTool` now refuses an `ask` itself when no watcher is active,
and the refusal says what is true and what to do:

```
REVIEW REQUESTED (policy): write: irreversible is always approved by a human —
nobody is watching: this run has no open dashboard or composer, so no human can
answer an approval. Open the Feature Loop page or set gateMode: deny to refuse
up front.
```

Nothing changes when a page IS open: the watcher is a TTL-kept fact, and an ask
raised within 15s of a page closing still routes as an ask.

**Verified:** unit tests both directions (watcher on → `ask`, watcher off →
`deny` with both phrases in the reason), and on the wire — the same headless
task that produced the harness sentence now produces the plugin's, verbatim,
with the file absent.

**The integration spec was still testing the old world.** §1be touched only the
unit suites; the spec that runs the gate inside a REAL harness kept driving it
with no front end at all, so five of its eleven cases had quietly become tests
of something else — and four of them either asserted the harness's sentence or
HUNG for the registry's 10-minute `answerTimeoutMs`, because with the registry
claiming an ask `next()` (the composer path) is unreachable and nothing ever
settles it. A case that hangs instead of failing is the worst shape a test can
have, and it was the direct consequence of the fix, not a flake. Fixed by
stating BOTH facts a case needs — the watcher, and `dashboard.answers: false`
so the claim is declined — and by asserting the refusal the model now gets.

**Measured on a profile generated from this HEAD** (not a hand-edited one):
`ask` + nobody watching returns the plugin's sentence verbatim in the tool
result, no file is created, and the model stops in one step reporting that no
human is available — rather than retrying with a wider sandbox permission.

**A trap this change walked into, and the tests had to be fixed for it.** The
watcher is process-global with a TTL, so it leaks between tests in a file. Four
existing tests asserted `ask` and started passing or failing depending on which
test ran first — and one of them **passed when run alone** and failed in the
suite. Both test helpers now state the watcher explicitly (`noteWatcher()` or
`clearWatcher()`) rather than inheriting it.

### 1bf. The settings page's claim was true, and I checked it anyway

**Observed:** none. That is the point of this entry.

§1be changed what the gate does when nobody is watching. The settings page
claims — in the file header, in its notice, and in `userSettings`'s own doc —
that the settings file WINS over the patch row on the nine keys it owns. That
claim was written in an earlier round and never exercised against a running
harness, and this repo has a long record of a claim reading like a feature
because nothing ever ran it.

**Measured, with the generated profile's row deliberately set to `deny` and
the settings file set to each value in turn:**

| settings file | the run did |
|---|---|
| `gateMode: deny` | denied with the plain gate reason |
| `gateMode: ask` | refused by §1be — "nobody is watching … refuse up front" |
| no settings file | denied with the plain gate reason (the row wins) |

So the precedence is real, in the direction documented, and the row still wins
where the file is silent. Recorded because the measurement is what makes the
claim true *now*, and because `--dump-config` cannot answer it: that command
prints the PATCH TREE, which never contains the settings file at all — the
merge happens at plugin load, inside `apply`. Three earlier greps of
`--dump-config` said the opposite of the truth and looked convincing.

**The trap worth naming:** the first version of this probe put the settings
file in `~/.config/dshloop/` while the profile booted with a different
`XDG_CONFIG_HOME` in a previous shell, so the first two runs read the REAL
file while I believed they read the probe — and `settings=ask` still looked
like the row winning, because the message I was grepping for is the model's
paraphrase of the refusal rather than the refusal itself. The model reports
"approval policy: ask, no answerer", not "nobody is watching". Grepping for my
own wording proved nothing; the table above greps for behaviour.

### 1bg. A clean clone cannot typecheck `src/plugin.ts`, and the script said why — wrongly

**Observed:** `git clone` + `npm install` + `make check` is green in a bare
checkout — 306 tests over CI's 21 files, every drift check, the exact CI
typecheck command. The six suites that import `src/plugin.ts` do not run there,
and neither does `tsc` over `plugin.ts`. Both are excluded with a written
reason, so both are expected, and nothing claims otherwise.

**Why it is still worth writing down:** `scripts/typecheck.sh`'s header said the
whole-`src/` check works "from a harness checkout's node_modules **or this
repo's own** (its devDependencies carry dsh-llm/dsh-tools, which is what
Dependabot's majors actually break)". That has never been true. `devDependencies`
carries exactly one `@deepseek-ai/*` package — `dsh-typert-protocol` — and adding
the others fails `ERESOLVE` against the harness's own peer graph:

```
dsh-agent@0.2.0-rc.2  wants dsh-invariants@0.2.0-rc.2
dsh-brand@0.0.1-rc.1  wants dsh-invariants@^0.0.1-rc.1
```

So the premise was false AND unfixable in `package.json`, and the comment named
a mechanism ("Dependabot's majors") that pointed at the wrong file. A developer
reading it would spend an hour adding dependencies that cannot resolve.

**Verified** by trying, on this branch, in this order: cordis 0.4.4 → ERESOLVE
(`dsh-agent` wants cordis 4.0.2); cordis 4.0.4 + dsh-agent 0.2.0-rc.2 → ERESOLVE
(the `dsh-invariants` conflict above). The header now states the one place that
works, names the two measured conflicts, and says what the CI list covers
instead.

### 1bh. A green integration run was partly a property of this machine

**Observed:** `make verify` in a fresh `git clone` of this branch fails the
integration step outright, while the same command in the worktree has passed 11/11
all session:

```
Could not resolve "@deepseek-ai/dsh-llm" imported by
"@freepeak/dsh-feature-loop"
 Test Files  1 failed (1)
      Tests  no tests
```

**Why:** the staged spec imports `src/plugin.ts` by ABSOLUTE path, and Vite
resolves that file's own bare specifiers from the DIRECTORY WALK above the
plugin — not from the harness checkout where the spec is staged. The plugin
declares all five harness packages as OPTIONAL peers and `.npmrc` sets
`auto-install-peers=false`, so a clean install never provides them. A worktree
inherits them by walking up into the MAIN checkout's `node_modules`, which on this
machine is a symlink into a hand-built profile
(`~/.dsh-flt-4100/profiles/flt4100/…`). A clone under `/tmp` has no such parent.

So every "11/11 integration green" this session was partly true because of a
directory that happens to exist on one laptop. The suite is real and it does
pass; the *claim* was doing more work than the evidence supported.

**Fix:** `test/integration/run.sh` now resolves the package the way Node and
Vite do — `createRequire(resolve('src/plugin.ts')).resolve('@deepseek-ai/dsh-llm')`
— and exits 2 with the reason when it cannot, instead of letting Vite report
"no tests ran". The walk crosses the worktree boundary on purpose: this file
lives in `.worktrees/exec-rung/`, whose own `node_modules` carries no harness
package, and the real one resolves two directories up.

Verified both ways: the worktree still runs 11/11, and the clone now stops at
the precondition with a sentence naming the missing package.

### 1bi. The README's first command failed on a fresh clone

**Observed:** `git clone`, `npm install`, then the command the README opens with:

```
$ node --experimental-strip-types --test test/*.test.ts
# tests 373
# pass 367
# fail 6
```

Six failures, all `ERR_MODULE_NOT_FOUND: Cannot find package
'@deepseek-ai/dsh-llm'`. The same command in a worktree — where the harness
packages happen to resolve by directory walk, per §1bh — passes 454/454.

**Why:** the glob includes six suites that import `src/plugin.ts`, and
`plugin.ts` reaches four `@deepseek-ai/*` packages the plugin declares as
OPTIONAL peers. A clean install therefore cannot run them, by design: the
deployment supplies them, and `.npmrc` sets `auto-install-peers=false` so the
install does not fail trying.

That is all correct, and it was still wrong as the FIRST thing a reader runs.
The comment above it said "no network, no model call — the policy layer is pure",
which is true of the 367 and false of the six, and `check-test-list.mjs` had
already written down which twenty-one files need no harness. The README simply
was not reading it.

**Fix:** the quick start now says `make ci-tests` — "exactly what CI runs" —
and says plainly, right below, why not the glob and what the six failures mean.
Verified by pasting the new README into a fresh clone and running its first
command: green.

### 1bl. The usability check had only ever asked one question

**Observed:** `test/e2e-in-ui.mjs` drove the real page against a task that
creates ONE file. One ask, one click, one assertion. Every number it could
report — and it reported none — was therefore about the cheapest possible run.

**Why that matters:** "a human can use this" is not a property of a one-ask
run. It is a property of a run that needs a human SEVERAL times, where the
costs show up: how long each card takes to appear after the model calls the
tool, whether the card says WHICH call it is about, and whether the NEXT ask
arrives at all once this one is settled. The script could not answer any of
those — it clicked one card and asserted one file.

**Fix:** the default task is now a three-file fixing task, the script settles
EVERY ask in turn (matching each by its own `askedAt`, waiting for it to leave
the screen before looking for the next), and it prints the wait for each.

**Measured, real browser, real model, against a profile generated from this
branch — the numbers this had never produced:**

```
e2e-in-ui (allow): 5 × Allow once → 3 file(s) written, waits 66, 34, 30, 47, 45ms
e2e-in-ui (reject): 2 × Reject → no file written, waits 50, 48ms
```

Three things fall out of that which no previous run could show:

- **The page is not the slow part.** Every card was on screen in tens of
  milliseconds. The gaps the human feels are the 12–57 SECOND model steps
  between them, so latency work belongs in the loop, not in the approval UI.
- **The gate asks more than it needs to.** Five asks for three files: two were
  `bash` (mkdir / ls) before any write. Under the generated profile
  `resolveReversibility` defaults an unknown tool to `irreversible`, so every
  shell call is gated too. That is SAFE and it is also noise — a human who
  clicks through `bash` on autopilot has stopped reading the cards, which is
  the property the gate exists to have. The next thing to look at is the
  actuator table, not the approval flow.

- **The cards could not be told apart.** Five asks, three of them `write`, and
  every card read `write: irreversible is always approved by a human`. A person
  cannot tell ask 3 from ask 4 without reading the run, and a gate whose cards
  are indistinguishable trains the click that makes it worthless. `tools/pre-execute`
  already receives the parsed arguments, so the path was in hand and discarded;
  the reason now carries it (or the command, for `bash`). On the wire:

  ```
  REVIEW REQUESTED (policy): write: irreversible is always approved by a human
  — write /private/tmp/hw/h5.txt.
  ```

  Deliberately not the file CONTENTS: that is what the human has not decided
  about, and a diff on the card invites approving one nobody read.

Also fixed while measuring: the `finally` block that cleans up the proof threw
`ERR_INVALID_ARG_TYPE` when a run failed BEFORE the page had named its target,
which replaced the real failure with a `join(undefined, …)` — the one failure
mode you must never hide.

### 1bj. The check that guards §1t could not see a third of the file

**Observed:** `node scripts/check-known-issues.mjs` printed

```
known-issues: 21 sections, index and cross-references agree
```

on a file with **29** sections. The eight entries numbered `§1bb`…`§1bi` — a
third of everything recorded here, and every finding this session produced —
had no headings, no index rows and no validated cross-references, as far as the
check was concerned.

**Why:** every pattern in the script was `1[a-z]` — ONE letter. It was written
for §1t, the duplicate `§1i`, and that fix was correct at the time; the `1b`
sub-family arrived later, one commit at a time, and the regexes were never
widened. The failure is the file's own recurring shape (§1t, §1u, §1be, this):
a check written for one instance, and a second instance arriving one character
away from where the check could see it.

Worse than blind: it reported SUCCESS. "21 sections … agree" is a sentence that
reads as an audit and is not one.

**Fix:** one `LETTER = '1[a-z]{1,2}'` used by all three patterns, and index rows
for the eight `1b` sections — generated from each section's own heading, so a row
cannot drift from the title it claims to list.

**Verified** both ways, because a check that has just been fixed is exactly the
check that gets believed. Renumbering `§1bi` to `§1bh` — the §1t failure —
exits 1 naming both sections. Repointing an index row at a letter with no
section exits 1. And the count it prints went from 21 to 29, which is the
number it should have been saying all along.

### 1bk. `byRoute: {}` beside a real `costUSD` taught the optimizer every route was free

**Observed:** the two observations the handoff left open, both closed by
measurement rather than by reading:

| open question | measured |
|---|---|
| `demo/run.sh --judge none` timed out with exit 124 | **it completes.** `goal-met · 6 steps · $0.0042`, `judgeScores: []`, six `[judge] unavailable (no judge configured)` lines. Nothing hangs. |
| run records carried spend but empty `byRoute` | **real, and 27 of 29 records had it** — 25 of them with `costUSD > 0`. |

**Why the second one matters:** `routeSummary` in `src/optimizer.ts` reads
`record.byRoute` and nothing else, and the optimizer state is a PROMPT the judge
reads to choose a rung. `stepsByRoute.size === 0` returns the string
`none recorded` — so a deployment with twenty-five spending runs handed the
optimizer `none recorded`, which is not "we have no data", it is "no route has
ever cost anything". The field was missing, not the value.

The three records that DO carry `byRoute` are the three written after the
ledger was read instead of a literal, which is the shape of the whole finding:
this was never a serialization bug, it was a record written from
`byRoute: {}` at the call site.

**Verified, not asserted.** `buildOptimizerState` over the real 29-record
history now prints `routes: onegw/execution (12 steps)` where it previously
would have printed `none recorded` for a history where every run spent money.
Two runs and a wall-clock measurement, both directions.

**Fixed, and it is one field.** `LoopRunResult` now carries `byRoute` from the
same ledger that produces `spentUSD` — it always did, one call away in the same
function — `refine.ts` records it instead of a literal `{}`, and a test fails if
`byRoute` goes back to empty beside a real `costUSD`. Reverted the one-line
change and watched it go red, then restored it. On the wire:

```
$ bash demo/run.sh --judge none
  outcome goal-met · 6 steps · $0.004824
  record  byRoute {"onegw/execution": {"steps": 6, "usd": 0.00482385}}   # was {}
```

The pattern worth naming, because it recurred three times in one round: a
missing value is written down as a zero, and the zero is accepted because
nothing reads it *at the moment it is written*. It is read later, by something
that trusts it.

### 1bm. Five cards that said the same thing, and a lost run record hiding in plain sight

**Observed:** one live run against the generated web profile, five asks, three
files — and every card began the same way:

```
REVIEW REQUESTED (policy): write: irreversible is always approved by a human.
```

Three of them were `write`, about three different files, and the card named
none of them. A person cannot tell ask 3 from ask 4 without reading the run.

The same run's feed also carried one line that had nothing to do with the
task:

```
run history append failed: cannot get property "agents" without inject
```

**Why the first one:** `tools/pre-execute` receives the call's PARSED ARGUMENTS
— this file stores their key for the step record two lines above the gate call —
and `gateForTool(policy, toolName)` threw them away before deciding. The fact a
reviewer needs was in hand and discarded.

**Why the second one:** `ctx.agents` is a cordis PROXY, and reading it on a
fiber where `AgentRegistry` has not mounted THROWS rather than returning
undefined. `resolveAgent` read `(ctx as { agents?: … }).agents` — a type that
promised `undefined` and delivered an exception — so one missing service cost a
whole turn record. The plugin's own catch printed the failure rather than
swallowing it, which is how it was found; but "visible, not fatal" is the wrong
posture when the visible thing is the history itself.

**Fix:** `subjectOf(toolName, args)` names the call from `file_path` / `path` /
`filePath` / `command`, or adds nothing. It is deliberately narrow: never the
file's contents, never a multi-line string, never over 120 characters — a card
should not quote back the thing nobody has decided about. `resolveAgent` is a
`try`/`catch`, because "no agent found" is already a supported answer (the
agent-less policy) and a throwing getter is that same answer with noise on it.

**Verified, live, both directions.** After the fix, five asks, five distinct
cards, and the three files written:

```
bash  — bash pwd && ls -la . notes 2>&1
write — write /private/tmp/tarp-work/notes/first.md
write — write /private/tmp/tarp-work/notes/second.md
write — write /private/tmp/tarp-work/notes/third.md
bash  — bash ls -l notes && wc -c notes/*.md
```

`e2e-in-ui (allow): 5 × Allow once → 3 file(s) written`. Reject direction: three
rejects, zero files. And `history append failures: 0` on both runs, where the
run before this change carried one.

The regression test was proven to bite: removing only the `try`/`catch` fails
`a THROWING ctx.agents still records the turn`, restoring it passes. The subject
is covered the same way — six assertions, including that two writes produce two
different cards and that the file's contents never reach one.

**A cost worth naming:** `pnpm install --frozen-lockfile --prefer-offline` is
the only reinstall that works on this machine right now. `--offline` alone fails
`ERR_PNPM_NO_OFFLINE_META` on `@deepseek-ai/dsh-agent@0.2.0-rc.2`, and plain
`pnpm install` sits on a TLS handshake for minutes and exits on a network
timeout. Recorded here because "my rebuild did not reach the profile" is the
exact class of bug this file keeps re-finding, and this time the answer was a
flag rather than a rebuild.

### 1bn. One gate, three tables, and nothing that compared them

**Observed:** measured on the live five-ask run, one ask was `job_list` — a
tool whose entire job is to *read* a list of background jobs, gated as
`irreversible` and asking a person to approve it.

`resolveReversibility` returns `'irreversible'` for anything the `actuator` table
does not name. That is the right default for `write` and pure noise for a
progress check, and it is silent: the card looks like every other card.

**Why it was missed:** the table ships in three hand-edited files —

| file | deployment |
|---|---|
| `cordis.patch.yml` | the default profile the package installs |
| `docker/profile.patch.yml` | the container profile |
| `scripts/make-profile.sh` | the generated profile |

— and **nothing compared them**. They had already diverged: the docker copy was
missing `task`, so a container deployment gated every delegated HITL call while
a generated one did not. One deployment, two policies, discoverable only by
reading two files side by side. `job_list` was missing from all three, which is
why the live run asked about it.

**Fix, both halves.** `job_list`, `job_output` and `job_kill` are now classified
in all three copies — read, read, and `reversible-write` respectively (a
cancellation a re-run can undo, which is what `reversible-write` means
elsewhere). And `scripts/check-actuator-tables.mjs` compares the three mappings,
because the fix is not a third careful edit, it is a comparison.

**Verified both directions.** The check reports `10 tools, identical in all 3
copies`. Deleting one row from the docker copy exits 1 naming the tool and
saying which file classifies it and which does not; reclassifying `job_list` in
one copy exits 1 naming both classifications.

**Verified end to end, live.** The same three-file task against a web profile
carrying the fixed table, real browser, real model:

```
write — write /private/tmp/tarp-work/notes/first.md
write — write /private/tmp/tarp-work/notes/second.md
write — write /private/tmp/tarp-work/notes/third.md
```

`e2e-in-ui (allow): 3 × Allow once → 3 file(s) written`, waits 39–58ms, and
**zero** `job_list` asks where the same task produced one before. The card is now
both distinguishable AND only ever about a real write.

**The pattern, fourth time.** §1t (duplicate section letters), §1bd (eight
profiles running bytes nobody could name), §1bi (the README's first command),
this. A fact written in several places with nothing asserting the copies agree.
The fix that has worked each time is not "be more careful" — it is a script that
fails, wired into `make check` and CI.

**And the lesson from re-verifying it, which cost five attempts.** Getting the
fixed table into a live profile by hand-editing its YAML produced a file the
generator could never have written: four rounds of indentation arithmetic, each
one making it slightly worse, ending in a duplicate-key parse error. The
generator's own heredoc is the source of truth and was correct the whole time —
the fix was to rewrite the file from the template, which took one command. Hand
transcription of generated YAML is a fifth instance of the same mistake, and the
same rule answers it: use the thing that generates it.

### 1bo. The release workflow produced a tag and nothing else

**Observed:** `.github/workflows/release.yml` computed a version, bumped
`package.json`, pushed a commit, tagged, and created a GitHub release. It never
ran `npm publish`. The package has therefore never been published, and the
README's npm badge pointed at a version that does not exist.

**Why nobody noticed:** every part of it works. The run is green, the tag
appears, the GitHub release has generated notes. The failure is a *missing
effect*, which is the one kind of bug that looks identical to success from every
angle you would normally check — including a `gh run list` showing green.

This is §1b's exact shape one level up: "peers resolved" reported as "your
profile is ready". A step reporting done, for something it did not do.

**Fix:** a publish step, guarded three ways because each guard answers a
question this repo has already been bitten by:

- `npm view …@$VERSION` first, so a retry after a mid-run failure does not E403
  on a version that already exists. The tag is not the authority about npm; npm
  is.
- the TARBALL is inspected before publishing, not the working tree — `lib/` is
  gitignored build output, and a clean-tree pack once shipped with zero `lib/`
  entries (§1's own reason `prepack` exists). Checked on the artifact that
  actually ships.
- `--provenance` with `id-token: write`, because that is what ties the tarball
  to this run; and `registry-url` on `setup-node`, because without it there is no
  `.npmrc` and `npm publish` fails E401 on a package the run is ready for.

**Verified, not assumed.** `actionlint` clean. The lib-entry guard measured in
both directions: a real `npm pack` carries 21 entries and passes; a pack with
`--ignore-scripts` (which is exactly the empty-lib shape, reached by bypassing
`prepack`) carries 0 and the guard refuses. The first draft of the step also had
a real bug caught before it ever ran — it read `$VERSION` under `set -u` with no
`env:` carrying it, which fails on an unset variable rather than publishing the
wrong one.

**Not published.** The step needs `NPM_TOKEN` and an OIDC-enabled npm project;
both are the maintainer's to create. Nothing here has run against the registry.

### 1bp. An 87% success rate, computed from turns that did nothing

**Observed:** the Metrics roll-up over the run history committed on `main`
reported:

```
runs 15,  goalMetRate 0.867,  meanQuality 0.846
```

Read that as "this loop succeeds 87% of the time" and it is a good number. It is
not one. Of those 15 records, **13 had `steps: 0` and `costUSD: 0`**, and 12 of
them said `goal-met`.

**Why:** `outcomeOf` mapped the harness's `completed` straight to `goal-met`,
with the ceiling as the only thing that could say otherwise. But `completed` means
**the transport closed** — it does not mean the loop worked. The loop's own
success check lives in the CLI runner, which is not in this path at all. So a
turn that opened, did nothing, and closed was recorded as a success, and
`summarize` counted it faithfully. Every other number in the roll-up was correct;
this one was a claim about work that never happened.

This is the sixth instance of this file's shape, and the first one where the
*number* is the defect rather than the code: nothing crashed, nothing was
silently skipped, and the arithmetic was exact.

**Fix:** `outcomeOf` takes the step count, and a turn with no steps is
`model-stop`. Measured on the same 15 records:

| | goalMetRate |
|---|---|
| before | 0.867 |
| after | 0.067 |

**Verified both ways.** `a closed turn appends exactly one run record` now
asserts `model-stop` for the zero-step turn and the comment says why; removing
the guard fails it. And the other half is covered too — `a turn that ran steps
keeps goal-met`, because a guard that turned real runs into failures would be
worse than the bug.

**Two things this found on the way, both recorded because they are the trap
rather than the fix.** The test had to be written in `plugin-wiring.test.ts`
because that is the only file with a priced-session fixture; moving it into
`plugin-approval.test.ts` meant duplicating `settledSession` and `PRICED_MSG`,
which is worse than putting the test where the fixture lives. And `ctx.agents`
has to be wired BEFORE `apply` — the plugin resolves the session's agent when it
records the turn, and the assignment silently did nothing when it came after.

### 1bq. Two rates that were one number

**Observed:** the same roll-up that reported `goalMetRate 0.867` also reported
`firstPassRate 0.867` — on a history where **all 15 records had `pass: 1`**.

`firstPassRate` is documented as "the fraction the loop got right without buying
a retry". A reader seeing two rates in the same block takes that as two pieces
of evidence. It was one number twice: `recordTurn` hardcodes `pass: 1`, and a
`pass: 2` record comes only from the CLI's `runRefined`, which is not on the
harness path. So `met.filter(r => r.pass === 1)` was the same set as `met`,
always, by construction.

**Why nobody noticed:** the number was not wrong. It was correct arithmetic over
a set that never varies — which is the harder version of this file's recurring
shape, and the second time in two turns that a *derived* figure has been the
defect rather than the code that produced it.

**Fix:** `firstPassRate` is `undefined` unless some record reports `pass > 1`,
and it answers normally the moment one does — a real multi-pass history from
`runRefined` still gets the metric. Absent is distinguishable from a real `0`,
which is the whole point: `0` would mean "no run ever landed on its first pass".

**Verified.** Both directions in one test: two single-pass `goal-met` records
give `goalMetRate 1, firstPassRate undefined`; adding a `pass: 2` record gives
`goalMetRate 1, firstPassRate 0.5`. The empty-history case now asserts `undefined`
rather than `0`, with the reason inline.

Measured on the committed history, after both this and §1bp:

```
goalMet 0.067,  firstPass undefined
```

### 1br. A typical run costs $0.00 and takes 0 steps

**Observed:** the third figure from the same committed history, and the same
question §1bp and §1bq each asked of one number. Once §1bp stopped calling the
13 no-op turns successes, the axes still counted them:

```
runs 15,  steps.p50 0,  cost.perRun.p50 0,  goalMetCost $0.00048
```

`steps.p50 = 0` reads as *a typical run takes no steps*. What it meant was *most
of the recorded runs never ran at all*.

**Why:** every axis was computed over `records` — all 15 closed turns — and a
turn that took no step contributes a zero to steps, cost and wall-time. That is
correct arithmetic over a population that is mostly non-runs, and it describes
the population rather than the loop. `goalMetCost` was the same bug once more:
the mean of the `goal-met` set, which was 13 zero-cost no-ops plus 2 real runs,
so the "price of success" read **$0.00048** when the two runs that actually
succeeded averaged **$0.0056** — a tenth of the truth.

**Fix:** the cost/speed axes are computed over `ran` (records with `steps > 0`),
`goalMetCost` over `ranMet` (met *and* ran), and `measuredRuns` is reported
beside `runs` so the narrowing is visible rather than silent. After:

```
runs 15,  measuredRuns 2
steps p50 8 / p95 10
cost perRun p50 $0.00496 / p95 $0.00623
goalMetCost $0.00623
```

**Verified.** One test builds the 13-no-op history and asserts every figure above;
removing the filter fails it. And when nothing ran at all, `goalMetCost` is
`undefined` — a price of success is not invented from zero-cost non-runs.

**The trap in my own first assertion, recorded because it is the same one three
entries running.** At n=2, `percentile` returns the *lower* of the two values,
so `p50 > 0.004` failed against a correct `0.004`. The code was right and the
test's expectation was wrong — which is the failure mode this file keeps
documenting, wearing a different hat.

### 1bs. The human-escalation alert that could never fire

**Observed:** `reviewFraction` — documented as "the human-escalation rate", and
the input to `summarize`'s **"Human escalation rate > 15%" alert** — was written
as a literal `0` by `recordTurn`. Measured 2026-10-04 on the committed history:
14 of 15 records said `0`, and the 15th (`0.1`) came from the CLI runner, which
is a different code path.

So no harness-path record could ever exceed 0, and **the alert could not fire** —
not rarely, not under load, not ever. A run that surfaced every single step for
review would report a 0% escalation rate and light no bulb.

**Why:** `AttentionRouter` has counted reviews since it was written —
`reviewsRequested`, incremented in all five places a review can originate
(`operatorRequest`, `checkpoint`, critical signal, gate hold, judge) — and
exposes the number through its own `stats()`. The plugin then wrote `0` into the
record instead of reading it, two objects away from where the count already was.

**Fix:** `reviewFraction: policy.router.stats().fraction`.

**Verified.** Two tests. The router half asserts the arithmetic through
`createPolicy` (2 steps, checkpoint at 1 → `fraction 0.5`). The record half
drives the real `session/event` listener with `ctx.agents` wired before `apply`
— without it the turn is recorded against the agent-less policy, a *different*
policy whose router never saw the reviews — and asserts the record says `1`.
Reverting the fix fails the second one.

**And two mistakes of my own, recorded because the entry above them is about a
number being wrong.** My first poll loop was `while (readFileSync(path) === '')`,
which throws ENOENT on a file that does not exist yet — the poll itself was the
failure, so the test could never pass no matter what the plugin wrote. And my
first expectation was `0.5` where the real answer is `1`: the checkpoint fires at
step 1, before `observeStep` has seen both steps, so the fraction is taken at the
moment of recording. Both were the test's fault and both looked like the plugin's.

### 1bt. Zero milliseconds, round-trip

**Observed:** §1bp, §1bq, §1br and §1bs each found ONE figure from the same
sweep. Asking the question systematically — *which fields are computed from a set
that is empty, constant, or never written by this path?* — found the rest at
once:

```
wallMs p50 0 / p95 0 / latest 0,  for all 15 records
latencyMs  p50 0 / p95 0,          for all 15 records
latencyKind "round-trip",          for all 15 records
```

A panel reading that says a run took **0 ms** and its latency was measured
**round-trip**. Every harness-path record claimed a measurement that was never
taken.

**Why:** unlike §1bs, there is nothing here to read — `AttentionRouter` had a
count, but the plugin has no seam that times a step, so `wallMs: 0` and
`latencyKind: 'round-trip'` were literals standing in for an absence. **The type
was the defect**: `wallMs: number` and a required `latencyKind` have no way to
say "not measured", so the absence had to wear a number's clothes.

**Fix:** `RunRecord.wallMs` and `RunRecord.latencyKind` are optional. The
harness path writes `undefined` for both; `summarize` averages wall-clock over
records that timed something and reports `latencyKind: undefined` when none did;
`buildOptimizerState` says `wall mean n/a` rather than `0ms`. The `ponytail`
note that documented the old compromise — "`LatencyKind` has no 'none' value …
upgrade path: widen `LatencyKind`" — is now the thing that was done, which is
the outcome a `ponytail:` note is supposed to produce.

**Verified.** Three assertions in three files, each of which fails if the field
goes back to a literal: the record test asserts `wallMs === undefined` and
`latencyKind === undefined`; a metrics test asserts an unmeasured run does not
put a zero in the wall axis and that one timed run is enough to name the kind;
the empty-history test asserts no kind is declared. Reverting `wallMs: 0` fails
the first.

### 1bu. The speed axis, empty since the day it was written

**Observed:** §1bt made `wallMs` and `latencyKind` optional, because the harness
path has no seam that times anything. That was true — and it was also only half
the finding. The **CLI runner** does time every step, and has since it was
written:

```ts
const callStartedAt = performance.now()
// … the model call …
const latencyMs = performance.now() - callStartedAt
history.push({ index: step, …, latencyMs })
```

That measurement went onto `StepObservation` and **stopped there**. `runLoop` did
not return it, so `refine.ts` — which assembles a `RunRecord` from a
`LoopRunResult` — had nothing to write and wrote `stepLatencyMs: []`. The speed
axis has been empty on the one path that measures it, for as long as both have
existed.

**Why it survived §1bt.** §1bt asked "which fields are empty or constant on the
harness path" and the answer was honest for that path. It did not ask the
follow-up: *is there a path where they are not?* There was.

**Fix.** `LoopRunResult` carries `stepLatencyMs`, `wallMs` and `latencyKind`.
The samples come from a `callLatencies` array pushed inside the timing window —
**not** from `history`, because `history` only grows when a step dispatches a
tool, and a model-only step would then report "no measurement" for a step that
was measured. `wallMs` is one clock started before the run's first step.

**Verified, on a real run.** `bash demo/run.sh`:

```
stepLatencyMs [1343, 2261, 3256, 2306, 1470, 8618]   ms
wallMs        62314 ms
latencyKind   round-trip
```

That is the first record in this repo's history with a populated speed axis, and
`summarize` now reports `latencyMs p50 2261 / p95 8618 ms` over a history where
it previously reported 0. Two tests, each failing if its half is reverted: one
drives `runLoop` end to end and asserts the samples are real durations, one
asserts the record carries them.

### 1bv. The plugin path's wall clock, hiding in the event it was already reading

**Observed:** §1bt made `wallMs` optional with the note "this path has no seam
that times a step". §1bu gave the *runner* a real one. The plugin path was
assumed to have none — and it does not need one, because it is not missing data,
it was **not reading what it already had**.

Every `SessionEvent` carries `time` (Unix epoch ms, stamped by the harness), and
`turn/start` and `turn/end` are both logged. `recordTurn` receives the
`turn/end` event and was reading its `type` and `data`, and writing
`wallMs: undefined`.

**Fix.** `asTurnEnd` also returns the event's `time`; `turnStartTime` walks back
through the session log for this turn's `turn/start`; the record reports
`event.time - openedAt`, and its `startedAt`/`endedAt` are now the harness's
times rather than "the moment we wrote the file".

**Verified.** Two tests, and the second is the one that matters: a turn whose
`turn/start` is **not** in the log must report `wallMs: undefined`, not `0`.
That is §1bt's exact defect, so the guard against reintroducing it is asserted
directly. Reverting `openedAt` to the listener's default fails the first test;
reverting `wallMs` to `0` fails **three**.

**Still absent, deliberately.** `stepLatencyMs` and `latencyKind`: the plugin has
no seam around a model call — only the turn boundary — so there is no honest
per-step sample, and `latencyKind` would be a label for a resolution that does not
exist. `undefined` on both is the finding from §1bt, not a leftover.

**The turn, not the loop.** Worth being precise about what this measures: a
`turn` is one harness turn, so a loop run of many steps reports the span of the
turn it closed. That is what the field has always meant on this path (one record
per closed turn) and it is the duration a reader of the record is asking about.

### 1bw. Open: the run record still does not land on the harness path

**Status: unresolved, and every claim below is measured.** Recorded so the next
person does not re-derive it.

**Measured on a real `dsh web` run** (2026-10-04, generated web profile, real
model, real browser, five asks settled, three files written):

| observation | value |
|---|---|
| `session/event` listener reached? | **yes** — 70 events for one session |
| `turn/end` among them? | **yes** — exactly 1 |
| `asTurnEnd` verdict on it | **accepted** |
| `recordTurn` entered? | **yes** — its first statement printed a feed line |
| run record written? | **no** — the history file is unchanged, and `metrics` is absent from `/api/state` |

**What narrowed it, by reading the harness rather than by probing again.** Two
facts, both from source:

- `Session.append` dispatches `session/event` **synchronously**, inside the
  append, and `invokeContainedSessionObservers` wraps each callback in
  try/catch — so a throw before the first `await` would be swallowed with a
  warning in the harness's own log. There is no such warning.
- In a **web** run the turn stays open while the page sits idle. `Agent.turn()`
  appends `turn/end` in its `finally`, after the step loop drains, and a web
  session is not finished until the next message or teardown. So the record
  lands when the *next* turn starts — not while the run is being watched.

That second fact explains the live runs on its own, and it is consistent with the
one run in which a `turn/end` *did* arrive during measurement. It is the reason
no probe fired in the later runs: `turn/end` had not happened yet, so
`recordTurn` was never entered — which is exactly what the feed shows.

**Still not established:** whether the append completes once a turn does end. The
measurement above stops at "the turn had not ended", and closing that gap needs a
second turn in the same session, which the probe scripts do not send. Recorded as
the open half rather than guessed.

**What the fix is for, then, if not for this.** Both changes stand on their own
and neither is cosmetic: a listener that a scope filter can drop is a silent
failure, and a dynamic load that can never settle is a worse one. But the entry
above is honest that neither is the cause of the missing record — which is what
makes them worth keeping. A fix that does not fix the thing it is named after is
either a different fix or a lie.

**What this changes about the earlier entries.** §1bp through §1bv each read a
figure off a file and found it wrong. That work stands on its own — the figures
were wrong. What is **not** established is the causal claim I attached to them:
that the harness path had never written a record at all. That was an inference
from "no record exists", and the listener is demonstrably running. Correct the
chain, do not discard it.

**What did change, and is verified:** the listener is now registered with
`{ global: true }` (the documented switch for "receive regardless of context
filter checks"), and `runlog.ts` is imported **statically** rather than through
`await import(...)` inside the turn closer. The dynamic import was justified as
keeping `node:fs` out of the plugin's graph — which stopped being true when
`readFileSync` became a static import at the top of the file — and a load that
never settles loses the record with no rejection, so nothing catches it. A
static import resolves at load, before any run. Both are improvements either way;
neither is the cause, because both were in place for the run above.

### 1c. `make profile` hung for nine minutes with the registry unreachable

**Observed:** `bash scripts/make-profile.sh webz --port 4596` printed
`==> install (pnpm 9 …)` and then produced nothing at all — no error, no
progress, no timeout, for nine minutes. Every other network in the box was fine.

**Why:** the install was not slow, it was waiting. Measured: the pnpm process
burned **1.2 seconds of CPU across those nine minutes**, and `sample` put every
one of its threads in `uv__io_poll` on five half-open sockets to
`104.16.x:443`. TCP to that address connected, `github.com` answered 200, DNS
resolved — the stall is the **TLS handshake after connect**, which pnpm sits on
until its own fetch timeout with no output. To a person watching the terminal
this is indistinguishable from a hung script, and the useful question ("is the
network down or is my config wrong?") has no answer in the output.

**Fix:** `--prefer-offline` on the install. Every package a profile needs is
already in the local store from a previous profile, so pnpm resolves from disk
and touches the network only for what is genuinely missing. The same install
against the warm store now finishes in **1.4s**; a full `make profile` for the
web app is **1m47s** end to end including the build and the in-profile import.

The general form of this bug, and the fourth instance of it in this file: a
silent failure that is *silent about being silent*. The plugin that failed to
import, the ladder rung that resolved but was never tested, the profile that
composed with nothing gated — none of them printed the thing that would have
identified them. A hang is the same failure wearing a different mask.

### 1d. The settings page wrote a file nothing decided with — and said so

**Observed:** the Feature Loop settings page wrote
`~/.config/dshloop/config.yaml`, displayed the saved value back, and the file's
own header read:

```
# READ BY: the settings page only (buildStatus merges it over the patch row).
# NOT READ BY: apply() — the running gate is built from the profile patch
#   row alone, so nothing here changes policy until that is wired.
```

**Why it matters anyway:** the warning was **accurate**. That is the trap. A page
that saves a setting, shows it, and admits it does nothing teaches the operator
that the whole surface is a mock — so nobody uses it, and the correct fix (wire
it) never gets prioritised over "remove the dead page". Honest documentation of
an unimplemented feature is still shipping an unimplemented feature.

**Fix:** `mergeRowAndSettings` in `remote.ts` applies the file OVER the patch row
on the nine keys the page owns, and `index.ts` calls it on the way into `apply`.
Three rules, each load-bearing:

- **the file wins** — the page exists so someone can widen or tighten their own
  gate without editing a shared patch layer other profiles inherit;
- **an allowlist of keys**, not a denylist — a denylist silently starts applying
  whatever the next version of the page adds, which is how a status page becomes
  policy without anyone deciding it should be;
- **`router` is merged, not replaced** — a file that sets only `reviewBudget`
  must not erase the row's `judgeThreshold`.

`spec`, `dashboard` and `optimize` stay row-only: the page offers no control for
them, and a half-applied ceilings block with no price table is worse than a clear
boundary.

**Verified live on a generated profile, both directions, with the row disagreeing
each time:**

| settings file | row says | what happened |
|---|---|---|
| `gatePolicies: {write: auto}` | `write: always-approve` | the model wrote `proof.txt` with **no approval demanded** |
| `gateMode: deny` | `write: always-approve` | **refused** — `denied pending review`, no file |

And the nine new tests were proven to fail before being trusted: reversing the
merge order in `remote.ts` breaks all three wiring cases, and turning the
allowlist into a pass-everything breaks the boundary case. The merge lives in
`remote.ts` rather than `index.ts` precisely so those tests import no harness
package and CI actually runs them.

### 1e. `policy.judge.score is not a function` — a string where an object belongs

**Observed:** a settings file naming `judge: laya` booted a generated profile
clean and then died on the first step:

```
dsh: UNKNOWN: policy.judge.score is not a function
```

**Why:** the merge was spread into `apply`'s options **after** the constructed
`judge:`. `judge: laya` in the file is a STRING; the policy wanted a `Judge`
object; the spread put the string last, so it won. Nothing complains at load —
the object is still a valid value for the config schema — and nothing complains
until a step asks the judge for a score.

This is the same class as 1a–1d one level over: **a value that is wrong in a
place nothing looks at until it is looked at.** It is also the specific hazard
of a shallow merge over a config that mixes scalars and objects: `spec`,
`dashboard`, `optimize` and `judge` are the four non-scalars, and a spread does
not know which is which.

**Fix:** the judge is resolved FROM the merged config, and the options spread
names the three keys that must keep their own values — `judge` (an object),
`dashboard` and `optimize` (blocks the file may not touch). Three of them are
still silently orderable in one spread, which is why they are named rather than
left to a future edit.

**The instructive part is the test.** The first version called `resolveJudge`
directly, which is the function under suspicion — and it **passed against the
live bug**. A test that exercises the helper proves the helper works, not that
the helper is reached correctly. Rewritten to drive `apply`, it now fails when
the spread is put back in its live position:

```
with the merge spread after `judge:` — the live crash:
not ok 17 - apply builds a Judge from the settings file, not the string in it
```

That is the third time in this file that a test proved a function works while
the wiring to it was broken. Counting call sites (8b211d1), reaching the last
hop (1d), and driving the call site rather than the callee are three different
checks, and this bug needed the third.

### 1f. `make check` could not run where it was meant to, and `make test` lied

**Observed**, on a bare clone with only `npm install` (2026-10-03):

```
$ make test
# pass 345
# fail 6
$ echo $?
0                      ← six suites died on `Cannot find package '@deepseek-ai/dsh-llm'`

$ make check
make: *** [test] Error 1     ← stopped before the typecheck and all six drift checks
```

**Two separate defects, and the second one hides the first.**

1. **The exit code was thrown away.** The recipe ended in `| tail -8`, and a
   pipeline's status is its LAST command's — always 0. A green `make test` over
   six red suites is worse than no target, because it is believed.

2. **`check` depended on `test`**, which needs the harness packages. So the
   checks that exist *because* they need no toolchain — the four drift checks —
   were behind a toolchain. `make check` on a fresh clone had never run them,
   and a row in this very file claimed "`make check` on the bare clone | green".
   It was green for the wrong reason: `make` printed the failing line and the
   row never re-read the exit code.

**Fix.** `make check` now depends on a new `ci-tests`, which runs exactly the
files CI runs (the list read from the workflow, not copied — a copy is how it
drifted before). `make test` still runs everything and now exits non-zero on
failure.

`.SHELLFLAGS := -o pipefail -c` is the obvious fix for (1) and it **does not
work on this make**: measured here, a `@false | tail -1` recipe exits 0 with
it and 2 with an inline `set -o pipefail` or an explicit `bash -o pipefail -c`.
So every recipe that pipes says so itself. A general setting that measures as
ineffective is worse than four explicit ones, because it reads as covered.

**Verified on a bare clone:** `make check` exits 0, running all 21 CI files, the
typecheck and all six drift checks with no harness on the path; `make test`
exits 2 there and 0 in the full worktree. The `check-test-list.mjs` boundary was
proven in both directions — dropping the demo suite from ci.yml fails it by name.

### 1g. `plugin.ts` is not typechecked by anything, and the README said it was

**Claimed, in the README's own verification block, for months:**

```
npx tsc --noEmit    # clean, all of src/ incl. plugin.ts
```

**Measured (2026-10-03):** eleven errors, all in `src/plugin.ts`:

```
src/plugin.ts(1302,19): error TS2345: Argument of type '"session/event"' is not
                           assignable to parameter of type 'keyof Events'.
src/plugin.ts(1318,30): error TS2345: Argument of type '"agent/pre-step"' …
src/plugin.ts(1318,57): error TS7031: Binding element 'agent' implicitly has 'any' type.
…                                    (11 in total)
```

**Why they are there, and why nothing caught them.** `plugin.ts` needs
`@deepseek-ai/dsh-llm`'s `Events` augmentation, and that package is **not in this
repo's `node_modules`**. It lives in the harness monorepo under
`packages/llm/llm-deepseek`, which is not published as `@deepseek-ai/dsh-llm`
into `node_modules/@deepseek-ai/` — only 15 packages are linked there and it is
not one of them. So:

- `scripts/typecheck.sh` guards on `[ -d node_modules/@deepseek-ai/dsh-llm ]`,
  that test is **false**, and the script falls through to CI's file list — which
  excludes `plugin.ts` by name, with a reason.
- So `plugin.ts` is typechecked by **nothing**: not CI, not `make check`, not
  `npx tsc --noEmit`. It typechecks only inside a DSH profile, where the
  package resolves, and `make profile` does not run a typecheck.

The errors are harmless today — `ctx.on` is `any`-shaped at runtime and the
events do exist — but the README claimed a clean typecheck of a file that no
typecheck reaches. That is the same claim-versus-run gap as §1f, one layer up:
**the number in the docs was copied from the CI list's scope and attributed to
all of `src/`.**

**What is NOT proposed here:** making `plugin.ts` typecheck in a bare clone
would mean vendoring the harness's `Events` augmentation — which §"the approval
seam" already does deliberately, for the one package that owns an event this
plugin uses. Widening that to `dsh-llm` is a real change with a real
maintenance cost, and it is the kind of decision a maintainer should make on
purpose rather than a drive-by fix at the end of a session.

**Fixed here:** the claim. The README now says what `tsc` actually checks, and
`make check`'s output already said it (`typecheck clean (CI file list;
plugin.ts needs the harness packages)`) — which is the part that was right and
the part nobody read.

### 1h. `make up` reported a dead container as up — and no HTTP probe can fix it

**Observed (2026-10-03), starting from this branch's own `make up FORCE_REINIT=1`:**

```
[entrypoint] booting 'dsh-fl' on 127.0.0.1:3099 (DSH_HOME=/data)
dsh web: http://127.0.0.1:3099/?token=…
error: unknown option '--host'
…
  up (HTTP 401)
  open: http://127.0.0.1:3090/?token=…
```

`make up` printed an open URL for a container whose harness process had exited.

**Why the check could never have caught it.** The published host port is a
**relay** — `docker/entrypoint.sh` binds the app to loopback (the harness refuses
`0.0.0.0`) and forwards from the container's own interface. So the old exit
condition, "the published port answers 401 or 200", was satisfied by the relay
answering 401 **forever**, and three separate probes all reported a healthy
dead app:

| probe | with the harness dead |
|---|---|
| `make up`'s host-port poll | `401` → "up (HTTP 401)" |
| the container healthcheck (`fetch 127.0.0.1:8099/`) | `healthy` |
| `docker inspect … RestartCount` | `0` |

**And then the obvious fix was also wrong, which is the part worth keeping.**
The natural repair — take the token from the `dsh web:` line and require a `200`
with it — was measured and abandoned:

- a live app answers a fresh token with **303 + Set-Cookie**, then `200` on the
  redirect, so "200 only" fails on a *healthy* container;
- more decisively, `kill -STOP 1` inside the container left every HTTP probe
  working: a token request returned **303 three times in a row** against a
  harness that could not execute a single instruction. **No HTTP probe
  distinguishes a live app from a wedged one**, because the relay keeps
  answering from the last thing it saw.

So a token probe is not a liveness signal either; it is a better-looking lie.

**What `make up` asserts now**, and the ceiling is stated in the recipe:

1. the relay answers 401 or 200 on the published port;
2. the harness printed a `dsh web:` line in **this boot's** log.

(2) is the harness's own "I got as far as booting" record, and its absence is
exactly the failure above — an older CLI in a stale image refusing `--host`,
which printed the dashboard line and then died before the UI existed. Proven to
fire by pointing `COMPOSE` at a stub whose `logs` is empty: exit 2, naming the
branch.

**Not fixed here.** The healthcheck probing the relay instead of the app is a
real defect in `docker/docker-compose.yml`, and fixing it needs a liveness
signal that does not go through the relay — a `pid 1 is the dsh process` check,
or an app-side health endpoint. Both belong with whoever owns the container, and
both are recorded rather than guessed at.

**A note on what this box actually had running**, because it changes how the
evidence reads: the `dsh-feature-loop` container was started 12 hours earlier
from `.worktrees/prod-warts/docker/`, still on the OLD ladder
(`opencode/deepseek-v4.1-flash` → `xai/grok-4.7`), and `make up` from this
branch targets a *different* compose project — so it never touched it.
`docker inspect` on the container names its `working_dir`. **A container found
by `make up` is not necessarily the one you built.**

**Blocked, and then not.** The rebuild failed first — three
`ERR_PNPM_META_FETCH_FAIL … Socket timeout` — and the cause was diagnosed rather
than worked around. Bisected with `openssl s_client` against Cloudflare's edge:

| SNI on 104.16.0.34:443 | result |
|---|---|
| `example.com` | `CONNECTION ESTABLISHED` |
| `registry.yarnpkg.com` | `CONNECTION ESTABLISHED` |
| `registry.npmjs.org` | **stalls** |
| `npmjs.com` | **stalls** |

TCP connects, DNS resolves, `github.com` answers — so it is **SNI filtering on
this network path**, and `nc -z 443` succeeding is exactly why it presents as a
hang rather than a failure. `registry.npmmirror.com` answers the same API and was
verified to carry what this repo installs (`yaml` latest; `@deepseek-ai/dsh`,
29 versions, including `0.2.0-rc.2`).

`NPM_REGISTRY` is now a build **argument** in both Dockerfile stages and a
compose `args:` entry — empty by default, so the ordinary build is unchanged, and
set only by whoever is behind a filtered network. Not a committed `.npmrc` line:
a mirror in a checked-in file silently changes where every package on a
developer's machine comes from, which is a supply-chain decision nobody asked
for. With it set, `docker compose build --build-arg NPM_REGISTRY=…` completes and
`#21 … feature-loop imports`.

**Two more defects the rebuild then exposed**, both of which had made the
container path unverifiable rather than wrong:

1. **`FORCE_REINIT=1` re-seeded the patch but NOT the settings.** The harness
   renames a legacy `settings.yaml` to `settings.yaml.imported` on first import,
   so a volume seeded by an older image keeps that file forever and the entry
   point's "already present" guard skips the re-render. Measured: after
   `FORCE_REINIT=1` the patch row carried this branch's ladder
   (`model: execution`) while `settings.yaml.imported` still declared four
   concrete ids and no `execution` — the patch right, the resolver wrong, and
   the run dies `UNKNOWN_MODEL` on step 1. Exactly the 2026-10-01 bug with a
   fresh coat of paint. `FORCE_REINIT` now removes the marker too.

2. **`test/probe-container.mjs` declared the dead concrete ids itself.** It is the
   *third* place to carry them, and it is why the container probe still failed
   `UNKNOWN_MODEL` even with the patch row and the settings both correct: the
   probe builds its own profile, and the settings import is one-shot so that
   profile gets no settings of its own and resolves rungs against the list in
   the probe's own patch. It now declares `execution` first, like every other
   shipped deployment.

**Now verified for real:** with the mirror, a rebuilt image, and the patch and
settings in agreement, `make e2e-container` passes all three directions inside
the container:

```
==> 1/3  fail-closed: refused, no file ✓
==> 2/3  allow:       settle {"outcome":"allowed-once"}, written: "hello" ✓
==> 3/3  audit trail: 1 approval/asked, 1 approval/decided=allowed-once ✓
probe passed
```

and the probe profile's composed ladder is `{ provider: onegw, model: execution }`
— this branch's route, in a container, on a real gated run.

### 1i. The ladder check named three files and the repo has four

**Found by asking the check a question it had never been asked.** Three shipped
specs are covered — `cordis.patch.yml`, `docker/profile.patch.yml`,
`scripts/make-profile.sh` — and every one of them was moved to `execution` in
this branch. The **demo** was not in the list, and it ran `xiaomi/mimo-v2.5` for
the six months before this branch, which is the exact drift the check exists to
prevent, sitting in a fourth file nobody had enumerated.

**Why a named list is the weak part.** The check's whole argument is "every
shipped deployment is covered". That is only true if the enumeration is right,
and an enumeration is a claim a person has to remember to extend. A row added
later is invisible by construction.

**Fix.** `demo/cli.ts` is a fourth case, and its answer is *read out of the
source* — the default is a TS string (`model: 'onegw/execution'`), so the case
asserts the route rather than parsing a ladder. Copying the route into the check
would have been a second answer to "which model does the demo run", which is the
drift class inside the drift check. Proven to fire by putting `xiaomi/mimo-v2.5`
back: `demo/cli.ts: the default route is xiaomi/mimo-v2.5, not onegw/execution`,
exit 1.

**And the fifth: the container probe.** `test/probe-container.mjs` composes a
profile at run time and declares its own `models:` list, because the settings
import is one-shot and belongs to `dsh-fl` — so that list, not the container's
settings template, decides whether a probe run can resolve a rung. It had no
`ladder:` of its own (it copies `dsh-fl`'s row), so the rung side is inherited;
the resolver side is its own, and it was carrying the dead concrete ids until
§1h found them by cost. It is a case here too, asserting the half that is its
own: that the route the inherited ladder names is resolvable from the ids it
writes. Proven by removing `execution` from the probe's list:

```
test/probe-container.mjs: declares no model for the route onegw/execution.
  declared here: opencode/deepseek-v4.1-flash, xai/grok-4.7
  resolver — a run on onegw/execution dies UNKNOWN_MODEL on step 1.
```

### 1j. A safety schema that was never run — and a throw that is loud but not fatal

`src/index.ts` exports `Config`, a schemastery schema, because cordis's plugin
contract asks for it. It looked like a guard:

```ts
gateMode: z.union([z.const('ask'), z.const('deny')]),
```

**It is a type. Nothing runs it.** Measured 2026-10-03, on a profile generated by
`scripts/make-profile.sh` and then edited to `gateMode: auto`:

| step | result |
|---|---|
| `--dump-config` | composes, shows `gateMode: auto` (documented since 2026-10-01) |
| live boot | the plugin **loads** and the loop **runs** — `say hi` came back |

So an operator who typo'd the one setting that decides whether a human is ever
asked got a working-looking loop that never asks — and measured, not inferred:
`gateMode: auto`, a task to write one file, and `gm-proof.txt` appeared in the
run's working directory containing `hello`. The gate asked nobody. The reason it did not *run
ungated* is `createPolicy`'s `gateMode: options.gateMode ?? 'ask'` plus `ask`
failing closed with no answerer — the right direction for a safety setting, and
the wrong substitute for a rejection. `docker/README.md` had already recorded
that `--dump-config` cannot catch a bad gate; the load path could not either, and
that was the new half.

**Two fixes, and only one of them is a fix.**

1. `apply` now throws on an unrecognised `gateMode`, naming the field and both
   valid values. Verified live:

   ```
   feature-loop (@freepeak/dsh-feature-loop): Error: gateMode must be "ask" or
   "deny", received "auto". …
   ```

2. **But the throw does not stop the run.** The harness prints a failed plugin's
   error as a *warning*, the plugin never constructs, and the turn **still
   answers** — measured on the same profile, immediately after. So the sentence
   is what the throw buys; the protection is still the safe default underneath.

That is worth stating plainly rather than shipping as "fixed": a loud error the
operator may not see is a better message, not a gate. The thing that actually
keeps a typo from disarming the loop is `?? 'ask'` and `ask` refusing, and that
is unchanged and was measured again in both directions (`ask` → denied, no file).

### 1k. A hand-edited settings file can name a tool that does not exist — silently

The settings page validates `gatePolicies` against the six known classes:

```
gatePolicies: unknown tool class "wrong_tool_name"; expected one of
read, glob, grep, edit, write, bash
```

**A hand-edited `~/.config/dshloop/config.yaml` is not validated at all**, and
that is the file this branch made authoritative. Measured 2026-10-03 on a
generated profile, `gatePolicies: { wrong_tool_name: auto }`:

| settings | what happened |
|---|---|
| `{ wrong_tool_name: auto }` | run **denied** the write, no file — silently |
| `{ write: auto }` | run **wrote** the file, no approval |

So the direction is fail-closed, which is the right direction and not the same
thing as correct: `ReviewGate.check` reads `this.policies[tool]`, an unknown key
is simply never looked up, and the run falls through to the defaults. The
operator typed a setting, saw it saved, and it did nothing — with no message
anywhere saying so.

This is §1a's shape one level down: a value that is wrong in a place nothing
looks at. The ladder check reads rungs from files; nothing reads the settings
file's KEYS.

**Fixed, after measuring which half actually mattered.** An unknown tool CLASS
was the harmless half — it is never looked up, so the run falls through to the
defaults. An unknown policy VALUE was the dangerous one, and the reason is
structural: `ReviewGate.check` compares the value against three known strings
and every comparison misses, so the call falls through to its final
`review: true`. Measured on a row that said `write: auto`:

```
row: write: auto + file: {write: definitely-yes}   ->  the run DENIED the write
```

Right answer, **by luck**: it depends on that chain having three links. Add a
fourth branch and the same typo becomes an ungated write, with no test in the
repo to notice.

So `userSettings` now filters both — unrecognised classes and values are DROPPED
rather than fatal. Dropping restores the row's own policy, which is the
fail-closed direction; refusing to boot would turn a typo in a file nobody
validates into an outage. Four tests, three of them proven to fail when the
filter is removed, and the fourth asserting a VALID file passes through
byte-for-byte so this is a guard and not a second policy layer.

Verified live on a generated profile, row `write: always-approve`:

| settings file | outcome |
|---|---|
| `{write: definitely-yes}` | **denied** — the row's policy stands |
| `{write: auto}` | allowed (the operator asked for it, in the file the page writes) |
| `{bogus_tool: auto}` | **denied** — a file the gate cannot act on does not widen it |

### 1l. Two shapes of a bad number in the same setting file behaved differently

Measured 2026-10-03 on a generated profile, `reviewBudget` out of its band vs. not
a number at all:

| settings file | what happened |
|---|---|
| `reviewBudget: 0` | the plugin **throws** — `dsh-feature-loop: reviewBudget must be in (0, 1], received 0` — exit **1** |
| `reviewBudget: "x"` | the value is **silently dropped**, the row's own `0.1` stands, the run answers, exit **0** |

Both directions are the right one for the wrong reasons. The first is
`AttentionRouter`'s own constructor guard, and it is excellent. The second was
`userSettings`'s `typeof value !== 'number'` → `continue`: fail-closed, invisible,
and on a file a human is invited to edit by hand (§1d made it authoritative).

So the router keys are now validated in `userSettings`, with the same band
`AttentionRouter` uses and a sentence that names the key and the value:

```
settings: reviewBudget must be a finite number, received "x". The Feature Loop
settings page writes one; a hand-edited file must match.
```

**And it is still not fatal**, which is §1j's finding again rather than a new
one: the harness prints the plugin's error as a warning, the plugin never
constructs, and the turn answers anyway — `Hi! 👋` came back, exit 0. The
sentence reaches the operator through the same channel as every other plugin
error, which is the most this plugin can do about a load-time throw.

**The deliberate asymmetry**, because two behaviours in one place read as an
oversight until they are stated:

| bad value | behaviour | why |
|---|---|---|
| `gatePolicies: {write: not-a-policy}` | **dropped** | it cannot widen the gate — the row's own policy stands — so silence is safe |
| `reviewBudget: "x"`, `gateMode: maybe` | **thrown** | it silently changes how often a human is asked, or which posture the gate takes, and nothing else would say so |

A test asserts each half, and the `gatePolicies` one is the earlier case
restated with its reasoning attached rather than quietly rewritten.

**And then the same question was asked of the other five keys**, because fixing
two is not a pattern. Measured, each of these passed straight through
`userSettings` unexamined: `confidenceThreshold: "high"`, `checkpointAtStep:
soon`, `judge: telepathy`, `systemOneModel: 7`, `gateMode: maybe`. Every one of
them was the safe direction **by luck** — `gateMode === 'deny'` is the only
branch, so anything unrecognised is `ask`, and a non-number router key fell
through to the row's value.

So the constrained keys are in one table — `gateMode`, `judge`,
`confidenceThreshold`, `checkpointAtStep` — and `systemOneModel` is
deliberately **absent** from it: it is a provider's own alias, this repo cannot
know the set, and a table that listed it would be a check that forbids the
truth. A test asserts that absence, because "why isn't this one checked?" is the
question the next reader asks.

Five tests, two proven to fail when the table is disconnected. The general form:
**a hand-edited file is validated by the page's validator only when the page
wrote it.** One table, checked at the one function every consumer goes through.

### 1m. The settings page called the strictest gate in a hand-edited file the loosest one

**Observed, 2026-10-03, on a generated profile whose settings file is what the
harness actually honours** (§1d made it authoritative):

```
gatePolicies: { write: auto, edit: auto, bash: auto }
```

No write class asks. `approvalModeFor` counted `always-approve` entries instead,
so `asked === 0 ≠ 3` and the page showed **"Review at risky steps"** — whose own
policies are `edit/write/bash: auto-if-confident`. The file was **looser** than
the posture it was labelled with, and the run sided with the file: the write went
through with no approval demanded. The page was describing a gate that was not
running.

**Fix.** `auto` is the only value that never reaches a human, so it is the one
that decides: `auto` on every write class is `approve-every-step`, anything else
(including nothing named, because `ReviewGate`'s default for an unclassified tool
is `always-approve`) is `review-risky`. Two tests, proven to fail with the old
counting restored.

**And the second half is a real UI consequence, still open.** The two postures'
own maps are on OPPOSITE ends of the line — `review-risky` asks about every
write class, so classifying it now yields `approve-every-step`, and vice versa.
The page renders `<select value={approvalMode}>`, so a file the operator just
wrote with `approve-every-step` selected opens showing **the other option**, and
a Save with nothing touched writes the other policies.

**And then it was fixed anyway, because the copy decision turned out to be
small.** The third position is now a named posture:

| posture | the map it writes | label |
|---|---|---|
| `review-risky` | every write class `auto-if-confident` | Review at risky steps |
| `approve-every-step` | every write class `always-approve` | Approve every step |
| `never-ask` | every write class `auto` | **Never ask (gate off)** |

`never-ask` is named for what it does rather than for a reassuring reading of it,
because this is the posture a **typo** produces — §1m measured a hand-edited
`write: auto` over a row saying `always-approve`, and the write went through.
Labelling it "Approve every step" is the label that lies in the dangerous
direction. A test asserts the label and the detail line, so the copy cannot be
softened without someone failing a test deliberately.

With three postures the round trip **holds**: each maps to itself, so the page's
`<select value={approvalMode}>` opens on the option the file means and a Save
with nothing touched writes the same policies back. That round trip is asserted
in both `test/approval-bridge.test.ts` and `test/remote.test.ts`, and both were
proven to fail when the posture is folded back in.

The lesson is the one I wrote last round and then did not act on: I recorded
"three positions exist and two postures cannot name the middle one" as a reason
to stop, when the thing missing was a NAME, not a mechanism. The copy was an
hour's work and the decision behind it — does the operator get told the gate is
off — was the decision worth making, not deferring.

Measured and not assumed: `{write: auto, edit: auto, bash: auto}` -> the write
succeeded with no approval demanded; `{write: always-approve}` alone ->
`review-risky`, correctly, because `edit` and `bash` still run unattended.

### 1n. A MIXED policy file was shown one posture's copy, which was true of one class and false of the others

Last round added the third posture (§1m) and the round trip held. The next
question is what a hand-edited file looks like when it is a **mixture**, which is
what a person actually types — three postures bracket the space and most maps are
between them.

Measured 2026-10-03 on a generated profile with

```
gatePolicies: { write: always-approve, edit: auto, bash: auto }
```

The write asked and was refused. The edit and the shell command **did not ask at
all**. The page showed **"Review at risky steps"**, whose hint reads:

> Reads never interrupt. A write is reviewed when the loop has no confidence to
> judge it.

That sentence is a claim about `write`, and `bash: auto` is the opposite claim
about every command the loop runs. Two of the three write classes were
unsupervised while the page described one of them as reviewed.

**Fix.** `approvalModeLabel` marks any map that is not EXACTLY a posture's own —
`' — mixed with the fields below'` — and the page prefixes its hint with "Not one
of the postures — the per-tool fields below are what runs." The test is exact map
equality rather than a count of `always-approve`, so a partial map (`{write:
auto}`, where `edit` and `bash` fall back to `ReviewGate`'s default of
`always-approve`) is marked too: it is not a mixture of postures but it is also
not one, and being marked is the safe direction because it sends the reader to
the fields.

Three tests, two proven to fail when the marker is removed. And the honesty
matters in the naming: the marker says "mixed with the fields below", not "you have
misconfigured this" — the page cannot know which of the two it is.

**And then the marker was driven in a real browser, which found the other half.**
Against a running profile with the mixed file above, the tab renders:

```
When to stop and ask   [review-risky ▾]
Not one of the postures — the per-tool fields below are what runs.
Reads never interrupt. A write is reviewed when the loop has no confidence to judge it.
```

Three more measurements from the same session, because the questions the unit
tests cannot answer are about the FILE and the OPERATOR:

| action | what the file became |
|---|---|
| **Save**, nothing touched | the mixed map, unchanged — the draft comes from `buildStatus`'s merged config, so preservation is by construction and not luck |
| **Save** on a *partial* map (`{write: auto}`) | unchanged; `edit`/`bash` are still unset, so the gate's own defaults apply and the marker is still on screen |
| **pick** `approve-every-step`, then Save | the posture's map — `read/glob/grep: auto`, `edit/write/bash: always-approve` |

The third is correct and unsurprising, and the page never said it: a person who
has hand-set `bash: auto`, sees "mixed", and picks the strict option has just
discarded their per-tool values without being told. So the hint now says **"Picking
an option here REPLACES every one of them."** That is the whole UI contract for a
mixed file — the marker says what is running, this sentence says what the control
does — and neither half is discoverable without a browser.

**And the marker was wrong in a way only the browser could have told me.** The
first version tested EXACT map equality, which marked the **shipped row** as
mixed. Every generated profile writes

```
{ read: auto, glob: auto, grep: auto, edit: auto-if-confident, write: always-approve }
```

— no `bash`, because the spec's `actuator` already classifies it `irreversible`.
That is not `review-risky`'s map verbatim (its `write` differs), so the
default row on a profile nobody had touched carried "mixed with the fields
below". A marker that fires on the shipped default is a marker nobody reads.

It now keys off BEHAVIOUR: a map is marked when it says `auto` for a write
class and classifies as something other than `never-ask`. So the shipped row is
unmarked (every write class asks), each posture's own map is unmarked, the mixed
map and a partial `{write: auto}` are marked, and `{}`/`undefined` are unmarked
because nothing named means `ReviewGate`'s `always-approve` default — the
strictest gate there is.

**And the sentence pointed at fields that do not exist.** "The per-tool fields
below are what runs" — the Settings tab has three selects (judge, gate mode,
posture) and **nothing that edits one class**. A hand-written map is invisible in
the UI, so the hint now names the FILE:

> Not one of the postures, and this page has no per-tool fields: it lives in
> `~/.config/dshloop/config.yaml`. Picking an option here REPLACES every class in
> that file.

All of this is asserted by `test/e2e-settings.mjs`, which is the only place the
rendered strings exist. Its own first version was wrong three times — a tab
switch instead of **Reload** (the draft is fetched once on mount, so it measured a
stale render), a `../..` subtree that swept in the next field's hint, and a
fixture that captured the "restored" file *after* hand-editing it. Each was found
because the assertion failed, and each is recorded in the script.

Frame: `docs/evidence/settings-mixed.png`.

### 1o. The demo's committed transcript was two runs spliced into one, and the prose described neither

**Observed, 2026-10-03, reading what the README claims the product does.**

The quick start shows a transcript under "The demo works":

```
── step 4 · onegw/execution · spent $0.0023
[run-end] goal-met · 4 steps · $0.0030 · 1 review(s) (25% of steps)

[run-end] goal-met · 12 steps · $0.0066 · 1 review(s) (8% of steps)
```

**Two different runs in one code fence**, the second from a session that no
longer exists, with no marker between them. The prose underneath then described
neither: "was stopped for review **twice** (once by a critical signal, once by the
write gate)" and "the judge scored the step `0/3`". The run shown has ONE review
and a judge score of `2.0/3`, and no critical signal. So a reader could not tell
which half was the run, and the claims underneath matched neither.

**And `demo/TRANSCRIPT.txt` — which the README points at as "full transcript" —
was stale in a way that reads as current.** Captured from
`.worktrees/loop-optimize/` (a worktree that no longer exists), on
`xiaomi/mimo-v2.5` (a model this branch stopped running), showing a planted bug
`Math.ceil((p / 100) * sorted.length)` that this branch replaced with the integer
form. Nothing regenerates it: no script writes it, and
`scripts/check-typecheck-list.mjs` watches `demo/cli.ts` but not the transcript
it is the output of.

**Fixed.** The spliced line is deleted; the prose now describes the run actually
shown — 4 steps, one judge review at 2.0/3, a `tool-dominance` signal, a one-line
fix. The transcript is regenerated from a live run on this branch's route, with
the two machine-specific lines (sandbox path, history path) removed and a header
that says plainly what a capture is and when it was taken.

**The standing part.** A committed transcript is a claim about a run, and it goes
stale the moment the route, the bug, or the judge changes — with nothing failing.
So it is labelled as a capture with its date and route, the README says it is one
rather than current output, and the claim that it makes ("the shape does not
vary") is backed by `make check`, which fails if the planted bug and the fix stop
agreeing. That is the difference between an artefact and a claim: the artefact can
age, the claim is checked.

### 1p. A ceiling row that proved nothing about the ceiling

**Observed 2026-10-03, re-running the four terminal paths the README's "Verified
runs" table claims.**

| Command | the table claimed | what it does |
|---|---|---|
| `demo/run.sh` | `goal-met` 6 of 15, $0.0039, 0 reviews | `goal-met` 6 of 15, $0.0047, **1 review** |
| `demo/run.sh --max-steps 6` | **`budget-stop` 6 of 6** | **`goal-met` at 5 steps** |
| `demo/run.sh --budget 0.000001` | `budget-stop` 2 of 15, $0.0004 | same |
| `demo/run.sh --judge none` | `goal-met` 4 of 15, $0.0024 | `goal-met` 4 of 15, $0.0027 |

The second row is the finding. It was captioned "(step ceiling)" and quoted
`6 of 6` — which reads as the ceiling stopping the run at the sixth step. Re-run,
the task **finishes in 5**, so the ceiling never bound and the row demonstrated
nothing about the ceiling at all. `--max-steps 3` and `--max-steps 4` both stop
(`budget-stop` at 3 of 3 and 4 of 4), which is the claim worth making.

**Why this is the same class as §1o and not a smaller version of it.** "I ran it
once and it stopped" is the weakest possible evidence that a limit works: a run
that finishes *before* the ceiling looks identical to one the ceiling stopped
until somebody reads the outcome word. The table had the outcome word in it, and
it was wrong — which means the table was copied from an earlier session's output
rather than re-read, exactly like the spliced transcript.

**Fixed.** Every row is re-measured, the step-ceiling row is `--max-steps 4`
(`budget-stop` 4 of 4, $0.0028), `demo/run.sh`'s own header comment matches, and
the prose says why both ceiling rows were re-measured rather than assuming the
old ones were close enough.

**And the stale table in §11 is marked rather than deleted**, for the same reason
every other entry here is: a reader who arrives at the old number needs to see
that it was wrong and why, not to find a gap.

**And the four re-runs turned up a defect the table could never show.** Running
the demo plants the bug (`reset.sh`) and the loop fixes it — so the tree after a
run is not the tree before it, and a SECOND run starts by planting the bug again.
Measured, on the two shapes where that survives:

| | no trap | with the trap |
|---|---|---|
| `demo/run.sh --max-steps 2` (ceiling, never reaches the fix) | `budget-stop` exit 1, **bug planted**, `git status` dirty | exit 1, bug restored, clean |
| `Ctrl-C` partway through | exit **-2**, **bug planted**, dirty | exit **130**, bug restored, clean |

So `demo/run.sh` now restores the one file the loop is allowed to change, on
every exit path. Two details that had to be right for it to work at all:

- **`exec` had to go.** `exec node …` replaces the shell, so the EXIT trap would
  never have fired — the restore would have been the one part of the file that
  silently did nothing. node runs as a child now and the script's exit status is
  propagated explicitly, which is what the `-2` / `130` difference above records:
  130 is bash reporting an interrupt it handled, -2 is the signal arriving with
  nothing to handle it.
- **`trap … EXIT INT TERM`,** because the case a person actually hits is Ctrl-C,
  and a demo that leaves the tree dirty after the case somebody stopped watching
  is the worst possible place for it.

The bug is *restored*, not the tree: `git checkout --` on one named file. A
stash would also swallow whatever else the loop wrote, and this demo's whole point
is that its output is disposable.

### 1q. A call that ran and failed was invisible to the ladder — escalation meant "the gate stopped us"

**Observed 2026-10-03, following §1n's `MODEL ESCALATION` note.** SETUP.md tells a
reader to watch for it; the demo walkthrough showed a ladder with two rungs. Neither
could produce it.

Measured, on a generated profile with two rungs, the gate open for `bash`, and
`escalateAfterFailures: 1`: two runs of `cat /nonexistent-file-xyz` (exit 1, twice)
produced **no escalation notice**.

**Why.** `policy.pending.error` was set in exactly one branch of
`tools/pre-execute`: the one where the **gate blocks** a call. A call that
*executed* and returned a failure never touched it. So `reviewStep`'s `failed` read
a failed command as a successful step, and in a DSH deployment:

- the ladder climbed only when the gate stopped the loop, never when the work
  failed — a run failing fast and early stayed on the cheap model for the whole
  task;
- `error-cascade` never counted a run that was visibly failing, so the detector
  built for that case had nothing to count.

The standalone runner records the same outcome from its own tool result, which is
why the bug exists in one path and not the other and why every test passed:
**the plugin path had no source for the signal at all.**

**Fix.** `tools/post-execute` is now subscribed — the only event that reports
`isError` — and it flips `pending.error` for that agent's policy. The event is
declared locally beside `approval/request`, for the same reason: the package that
owns it is not among this repo's installed peers, so its `Events` augmentation is
absent and `ctx.on('tools/post-execute', …)` would not typecheck at all.

**And the regression test had to be built twice, which is the part worth
keeping.** The first version asserted the climb and PASSED with the flip removed —
because `bash` is absent from the test `SPEC`'s actuator, so it resolved
`irreversible`, the **gate blocked it**, and a blocked call sets `pending.error` on
its own. The test was measuring the gate, not the listener. It only became an
assertion once `gatePolicies: {bash: 'auto', …}` was passed, leaving
`tools/post-execute` as the sole thing that can mark the step failed. Verified by
removing the flip with the gate open: `not ok 18`, and green again with it back.

The general form, and the third time in this session it has appeared: **an
assertion that survives the removal of the thing it names is not an assertion.**
A passing test proves the code works; a test that fails when you break the code
proves the test does.

### 1r. A helper whose doc claimed a detector was impossible, tested by the helper itself

§1q fixed the ladder. The same flag also feeds `error-cascade` — one of only two
**critical** signals — and that turned out to need nothing more. Which left
`noteToolOutcomes` in a strange state:

- its own doc said `error-cascade` "could never fire in the plugin path, and the
  gate would silently run on four detectors instead of six";
- **nothing in `src/` called it**;
- its only test, `'error-cascade can fire in the plugin path now that errors are
  recorded'`, built the history itself and called the helper directly — so it
  proved the DETECTOR and claimed the PLUGIN PATH.

Both claims were false, in opposite directions. `error-cascade` could fire in the
plugin path before §1q, because `policy.pending.error` reaches the committed
observation through `reviewStep`; and this helper is not what made it possible.

**Measured, both ways** — removing the helper call AND the `pending` flip fails the
cascade test; with only the flip it passes. So the helper was left uncalled and its
doc corrected, rather than wired in to make an export look used. Wiring a call that
changes nothing is the same defect as dead code wearing a call site.

**The real gap was the test seam, not the helper.** The signals live inside
`prepareReview`'s return value, so there was no way for a test to read what the
plugin path actually detected. `CreatePolicyOptions.onSignals` is now an optional
sink — not for deployments, documented as such — and
`test/plugin-wiring.test.ts` drives the real hooks and reads the real signals:

```
error-cascade fires in the plugin path: three failed CALLS raise the critical signal
```

Four failed steps, because the observation for step N is committed at N+1 — which
is the "one step late" the old helper's doc warned about, now visible as a fact
about the ordering rather than a gap.

The old test keeps its coverage and loses its claim: it is named for what it
proves (the detector), and the plugin-path proof is named as the other test. **A
test that names the wrong subject is worse than one that names none**, because it
discharges the obligation to prove that subject.

**And the seam then answered a question nobody had asked.** With the signals
readable, "which detectors can actually raise in a DSH deployment?" became
answerable. Measured through the real `reviewStep` with this plugin's spec, over a
28-step mixed run plus a repeating tail:

| detector | reachable? | why |
|---|---|---|
| `error-cascade` | ✅ | three consecutive failed **calls** (§1q) |
| `tool-cycle` | ✅ | three trailing identical `(tool, argsKey)` pairs |
| `tool-dominance` | ✅ | one tool owning >60% of a **mixed** run, from step 6 |
| `excessive-steps` | ✅ | history past 20 |
| `budget` | ✅ on demand | needs ≥80% of the ceiling **spent**; these steps spend nothing |
| `quality-drop` | ❌ **not at all** | needs `baselineScore`, which `prepareReview` is never given here, AND a per-step `score`, which nothing in `src/` writes |

So the old doc's "four detectors instead of six" was **five**, and the fifth
failure is `quality-drop` — for two independent reasons, either of which alone
silences it. Both are asserted, with a control that supplies a baseline and a
falling score and shows the detector still cannot fire, so the reason is pinned
rather than guessed.

The run needed **two shapes**, because two detectors have incompatible
requirements: 25 identical `bash` calls leave `tool-dominance` nothing to compare
against, and a mixed tail never produces `tool-cycle`. Forcing one run to satisfy
both proves neither — the same trap as §1n's ceiling row, where a run that
finished *below* the limit looked like one the limit stopped.

### 1s. Five of six detectors reach a DSH deployment, and the sixth cannot

§1r gave the plugin path a readable signals sink. The first question worth asking
of a seam is not "does it work" but **"what can I now see that I could not
see before?"** — and this is the answer.

Measured through the real `reviewStep` with this plugin's own spec, over a
28-step mixed run plus a repeating tail:

| detector | reachable in a DSH deployment? | needs |
|---|---|---|
| `error-cascade` | ✅ | three consecutive failed **calls** — only since §1q |
| `tool-cycle` | ✅ | three trailing identical `(tool, argsKey)` pairs |
| `tool-dominance` | ✅ | one tool owning >60% of a **mixed** run, from step 6 |
| `excessive-steps` | ✅ | history past 20 |
| `budget` | ✅ | ≥80% of the ceiling **spent**, measured in `test/plugin-wiring.test.ts` |
| `quality-drop` | ❌ **not reachable at all** | a `baselineScore` **and** a per-step `score` |

So the claim in §1r's old doc — "`error-cascade` could never fire, so the gate
would silently run on **four** detectors instead of six" — was wrong in the
count: it is **five**, and `quality-drop` is the one that cannot fire.

**And it is silenced for two independent reasons**, which matters because fixing
either one would look like progress:

1. `prepareReview` is called in `plugin.ts` **without** `baselineScore`, so the
   detector's first condition is false;
2. nothing in `src/` writes `StepObservation.score`, so even a baseline would
   find no score to compare.

Both are asserted in `test/plugin-wiring.test.ts`, together with a **control**
that hands the policy a baseline and a falling score and shows the detector still
cannot fire — which pins the reason instead of asserting a guess. And the whole
table is proven to move: raising `excessive-steps` past the run length fails it.

**The measurement needed two run shapes**, because two detectors have
incompatible requirements. Twenty-five identical `bash` calls leave
`tool-dominance` nothing to compare against (it counts distinct tools, and there
is one); a mixed tail never produces `tool-cycle` (it needs three trailing
identical pairs). Forcing one run to satisfy both proves neither — which is the
§1n trap in a new place: a shape that looks like the thing can be the shape that
hides it.

**And the row that was "on demand" was the one that needed measuring.** It had
no plugin-path test, which is §1n's shape: a claim in a table that reads like a
measurement. Measured — and the first attempt failed, for a reason worth
recording:

```
40 priced attempts × $0.30 = $12 spent
ceiling $10  ->  120%  ->  the CEILING rejects at step 1, no signal is produced
ceiling $15  ->   80%  ->  `budget` fires and the run continues
```

**A ceiling that stops the run before `reviewStep` means the signal never gets a
chance** — and the test read as "unreachable" rather than "the ceiling got there
first". The fixture now sits the ceiling *above* the spend, and both behaviours
are asserted: `budget` fires at $15, and moving the ceiling back to $10 fails the
assertion. This is §1n's trap once more, in the most expensive form yet — a
guard that stops the very thing it is supposed to warn about.

**What is deliberately not done.** `quality-drop` is the detector the book cares
about most, and making it live means deciding what the plugin's per-step `score`
IS: the judge's review-worthiness is not it (that scores the *previous* step), and
a rubric the loop does not otherwise compute is a feature, not a fix. Recorded
rather than invented.

### 1t. Two sections of this file were numbered 1i, and the reader was the only detector

**Found while renaming one and reading the other.** §1i is the ladder check's
enumeration of model-deciding files; §1s is the detector inventory. Both were
`1i` until this entry, so **every `§1i` in this file resolved to whichever came
first** — and three of the four references happened to mean the ladder check, so
nothing read as wrong. A cross-reference that lands on the wrong section is worse
than no cross-reference: the reader has no reason to distrust it.

**This file is the record of everything the session got wrong**, which makes it
the last place that should need a check for its own errors. It is also a plain
markdown file, for the same reason `README.md` is — and markdown has no
cross-reference validation, so "every reference resolves" was a thing a person
was supposed to notice and never had.

**Fixed with `scripts/check-known-issues.mjs`**, in CI and in `make check`, for
the three failures this file has actually had:

1. a **duplicate letter** — two sections, one name (the live bug);
2. a section with **no index row**, which is an entry nobody can find;
3. an index row with **no section**, which is a promise nothing delivers.

Each proven by introducing it: duplicating `1i`, deleting `1p`'s index row, and
deleting `1p`'s heading respectively — all three exit 1 with the section named.
The check also resolves every section reference in the prose, which caught a
literal `§` + `1x` used as a *placeholder* in the new index header and sent me
looking for a section that did not exist — so the header says "the numbered
entries" instead.

| § | finding |
|---|---|
| 1i | the ladder check named three files and the repo has four |
| 1s | five of six detectors reach a DSH deployment; the sixth cannot |
| 1t | KNOWN-ISSUES had two sections numbered 1i, and nothing noticed |

The index the check maintains is the table at the top of this section, so the map
a reader uses and the map the check verifies are the same rows rather than two
things that can disagree.

### 1u. The walkthrough's sandbox keeps the fix on purpose, and neither guide said so

§1p made `bash demo/run.sh` restore the file the loop edits, so a run leaves the
repository's tree clean. Verified here by running it: `git status` empty, the only
other artefact the gitignored `.feature-loop/runs.jsonl`.

**But the docs' own walkthrough does not run the demo — it copies it:**

```bash
cp -r …/demo /tmp/fl-demo
cd /tmp/fl-demo && bash reset.sh
```

`/tmp/fl-demo` is **not a git checkout**, so `run.sh`'s `git -C "$ROOT" checkout
-- …` cannot run there. The loop's fix simply stays. Measured: the copy has no
`.git`, and the restore is `|| true`, so it fails silently and correctly.

That is the **intent**, and neither guide said it — while both tell the operator
to ask the agent to *"report the root cause, **the diff**, and the final test
result"*. The diff is visible *only because* the copy keeps the fix. A reader who
took §1p's "runs leave the tree clean" as applying to the walkthrough would
expect the opposite, and could conclude the restore is broken.

Two doc fixes, in both guides:

- the copy is disposable, has no `.git`, and **keeps** the fix — which is how you
  see the one-line change;
- **`rm -rf /tmp/fl-demo` first.** `RUNBOOK-SERVER.md` had it; `SETUP.md` did not,
  and a second `cp -r` into an existing directory nests a `demo/` inside it, so
  the agent edits a tree the reader is not looking at. That is the §1n trap in a
  `cp -r`: the second run looks like the first and works on the wrong path.

Neither changes a line of code, which is the point worth recording. §1p fixed the
**repository's** tree and created a silent asymmetry between it and the sandbox the
docs tell people to work in. A fix that only holds on one of the two paths a
document names is half a fix, and the half that is invisible is the half a reader
trusts.

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

### A check CI stopped running is worse than no check — so CI's shape is checked too

Five checks now each claim a place they run, and every one of those claims is a
thing that can silently stop being true: a step gets deleted, a target gets
narrowed, a job starts installing. The script still passes on every machine and
protects nothing, and the failure is invisible because the script itself is
fine.

`scripts/check-ci-shape.mjs` closes that, and it is the FIRST step of the `test`
job because every other check is a claim about that job:

| claim | verified by |
|---|---|
| every `scripts/check-*.mjs` is invoked by `ci.yml` | deleting a step → fails, naming the script |
| every one is also in `make check` | deleting a line → fails, "make check must not be quietly weaker than CI" |
| every invocation names a file that exists | a typo in a step → fails, naming the missing file |
| the `test` job installs nothing | adding `npm install` there → fails, with the reason that install is what the list is testing |

The fourth one found its own bug on the first run. The job-extraction regex
stopped at the first two-space `name:` line, and on this file that matched at a
point past the end of the `test` job — so the check passed on a job that DID
install. The job is now sliced by its own boundaries. That is the same lesson
the other four checks taught, and it is the reason this one asserts the
behaviour rather than the shape: a regex that silently examines nothing looks
exactly like a regex that found nothing wrong.

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
| `make check` on the bare clone | green — **but it never ran the drift checks**: `check` depended on `test`, which needs the harness packages, and `test`'s exit code was swallowed by a pipe. Corrected in §1f; `make check` now runs CI's list and is green there for the right reason |
| Does it write to a developer's machine? | **No** — scripts byte-identical after a run, and no `~/.dsh` created |
| Summary line names its half? | yes — and it now reads `5 shipped specs`, because the demo and the container probe are cases too (§1i). The `18` was this machine's profile count at the time, not an assertion. |

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

### 16. c57f2d8's fix silenced the noise and the news

**Follows §15, and is the other half of the same fix.**

§15 verified that a brief which is off by default no longer prints
`unavailable` on every card. Reading the change rather than only running it
shows it silenced one case too many:

```diff
-  if (ask.briefState === 'none') return null
+  if (ask.briefState === 'none' || ask.briefState === 'failed') return null
```

`failed` is not "briefs are off". It is "briefs were asked for and the call
did not come back" — so the new version also silenced a **real** failure on
every deployment that HAS enabled `dashboard.brief`, which is exactly the
deployment whose operator needs to hear that the model call failed.

**The distinction is in the config, not the card.** `dashboard.brief.enabled`
is part of the `config` the status payload already carries
(`buildStatus` → `DashboardSource.status()`), so the page can ask. It now does:

- `briefsOn === false` → `failed` renders nothing. The noise is gone, for the
  reason it was noise.
- `briefsOn === true` → `failed` renders *"Review brief unavailable — the
  approval itself is unaffected."* The news is back.
- `status()` absent (the standalone loopback dashboard has none) → treated as
  unknown and `failed` keeps rendering, which is the old behaviour: on a
  surface that cannot tell us, silence for a feature that may be on is the
  worse default.

Verified live, both directions, against `~/.dsh/profiles/feature-loop`:

| deployment | brief elements | says `unavailable` |
|---|---|---|
| briefs off (the shipped row) | 0 | no |
| `brief.enabled: true`, model returns a brief | 1 (the brief text) | no |

**The failed-brief branch is then asserted, not left to the reasoning that
produced the bug.** Reasoning got this wrong once already, so it does not get
to be the regression test: `test/assistant-ui.test.ts` pins the decision as a
table of `(briefState, briefsOn) → rendered`, covering all four cases —
including `briefsOn: undefined`, the standalone loopback dashboard where
`DashboardSource.status()` does not exist and the page must therefore keep
rendering a failure rather than assume briefs are off.

Two of the three branches are observed in a browser; the third is a table.
That is what is claimed.

**All three are now observed.** The setup is two edits, not three: on the
**web** profile, `dashboard.brief.enabled: true` with an unresolvable model id.
The dead judge endpoint turned out to be unnecessary — `resolveBriefExplainer`
needs a gateway *key*, which the profile has, not a reachable System One.

Observed, in a browser, on `~/.dsh/profiles/feature-loop`:

```
briefStates=["failed"]   briefDOM=["brief-note error"]
text: Review brief unavailable — the approval itself is unaffected.
```

Frame at [`evidence/brief-failed-20261002.png`](evidence/brief-failed-20261002.png).
The live profile was restored afterwards (`brief:` count back to 0) and the proof
file removed.

**Getting there found a real gap in the fix itself.** The page asked
`DashboardSource.status()` whether briefs were enabled, `web/app.tsx` declared
it, and `useBriefsEnabled` called it — and `remoteSource()` in `web/entry.tsx`,
which is what actually backs the in-UI page, **never forwarded `status()`**. So
the answer was permanently "unknown" on the one surface where the question
mattered, and `unknown` is defined to render the failure line... which is why
this branch still renders correctly by accident rather than by wiring.

The remote has had `status()` since the settings page shipped. `remoteSource`
now forwards it. Had the observation not been made, the page would have shipped
with a three-way branch whose middle case was dead on the only surface that has
briefs at all — and the unit table would have kept passing.

**The lesson, and it is the sibling of §14's.** A fix that stops a false
positive will happily create a false negative, and this one was verified only
in the direction that had been reported. Reading the diff found the other
direction in the same three seconds it took to run the test that could not.

### 15. The brief fix that the stale bundle had been hiding is now verified LIVE

**Follows §14, and it closes the loop on that entry.**

§14 established that `c57f2d8`'s fix — a brief that is off by default was
rendering `unavailable` as a red line on **every approval card** — shipped
without a rebuild, so the committed artefact never contained it. Re-running the
in-UI check against a live profile AFTER the rebuild, twice, with the gate
holding both times:

```
brief elements on the card: 0 (must be 0 — briefs are off by default)
mentions "unavailable": false
card: APPROVAL REQUIRED | asked 1:58:56 PM | write | RUN | session-7c3def3e-…
allowed  → brief-proof.txt written
```

That is the assertion the code change was for, expressed the way the failure
looked: **zero brief elements on a card whose deployment never enabled briefs.**
The fix is not just committed, it is observed — which is the first time on this
branch that a change I made to `web/app.tsx` has been verified in a browser
rather than inferred from a green suite.

It is also the second consecutive time the artefact, not the source, was the
problem. Worth noting for whoever reads this file next: two of the fourteen
entries here would not have been written at all if anyone had compared
`assets/` against `web/` before writing a paragraph about it.

### 14. The staleness check had a documented ceiling that a commit walked straight through

**Found 2026-10-02.** `test/assistant-ui.test.ts` compared the bundle's
recorded **size** against the file, and its comment said plainly that a one-line
edit inside a 462 kB bundle could round to the same kB and slip through. That
was documented, believed, and wrong.

It was walked through in `c57f2d8` — a commit on this branch, three weeks after
the check landed:

```
+  if (ask.briefState === 'none' || ask.briefState === 'failed') return null
```

A brief that is off by default was rendering `unavailable` as a red line on
**every approval card**, on every deployment that never enabled it. The fix
shipped without a rebuild. `client.js` changed by two lines inside 462 kB, the
size check passed, and the committed artefact did not contain the fix.

**Fixed with the thing the ceiling said was needed.** `web/build.mjs` now
records `sources-sha256:` — a hash over the five source inputs, in a fixed
order — and the test recomputes it. Eight lines of `node:crypto`, no dependency,
and it fails on the first character of any source change:

```
the bundle is stale: web/ has changed since it was built. Run
`make dashboard-bundle` and commit the result — otherwise the page serves the
old code while every other check passes.
```

The size check stays, as the other direction: an artefact edited or truncated
without a rebuild. It fails differently ("does not match the size"), and both
were proven to fire by doing exactly that.

**The lesson, and it is the sharpest one in this file.** A ceiling you have
written down is not a decision — it is a bet that the code around you will not
change while it holds. This repository changed that line in the same week, in a
commit whose subject line is about config keys lying to people. The comment was
honest; the honest comment was still a gap, and the gap was the size of the
thing the check exists to catch.

### 13. A "skipped" profile is not a checked profile

**Found 2026-10-02.** `scripts/check-ladder-models.mjs` reported four of the
eighteen local profiles as `skipped — no models declared here` and moved on.
Two of them (`flsdk`, `headless`) declare a ladder rung naming `onegw`, and
**neither declares an `llm-pi-ai` row, and `~/.dsh` declares none either** — the
composed `--dump-config` for `flsdk` shows the row with no `config:` at all.

So those profiles carry exactly the defect this check was written to find — a
rung whose provider is not configured — and the check called it *skipped*.

**Why the earlier version was right to be silent, and why it is now wrong:**
it could not read a profile's `settings.yaml`, so it could not know whether
`onegw` was configured there. That is still true. What it CAN know is which
PROVIDER the rungs name, and that `dsh-base` ships
`agent-default-model: deepseek-official/deepseek-flash` — so a rung naming any
*other* provider is unresolved unless something outside this file says
otherwise. The check now names the rung, names the provider, and says the one
sentence that matters:

```
profile flsdk: rung onegw/opencode/deepseek-v4.1-flash names provider onegw,
and this profile declares no llm-pi-ai row of its own. Its model list lives
in settings, which this check does not read — verify that provider is
configured there, or the run dies UNKNOWN_MODEL.
```

Two profiles (`flheadless`, `flproof`) name `deepseek-official`, which IS the
harness default, and are correctly silent. So the line distinguishes the two
cases by arithmetic, not by a guess.

**The lesson, which is now four deep in this file:** a check that cannot verify
a thing must not be silent about it, because silence and a pass are
indistinguishable in an exit code. Every previous instance here was a skip
(`no models declared here`, `change-event.ts` in the typecheck list, an
exclusion note that was never tested) read as "nothing to see".

Not fixed in the profiles themselves — they are the developer's own machines and
not this package's business. Fixed in the check, which is.

## CLOSED 2026-10-02 — CI was running 138 of 277, and said so once asked

**Found 2026-10-01. Cause never identified. Closed by measuring instead.**

The `test` job now runs **one file per process in a shell loop** and sums the
per-file `# pass` counts:

```
== 277 tests passed across 19 files          ← run 36971963637, SHA 144be86
```

277 in CI, 277 locally, 19 files either way. The batched form WAS the cause,
whatever the mechanism — and CI no longer depends on knowing it.

The loop earns its place for a reason unrelated to this puzzle: with 19 paths in
one `node --test`, a file that fails to *load* takes the other eighteen with it.
One file, one process, one line of output. Verified locally both ways: the loop
totals 277, and a deliberately failing file stops it there with `# fail 1`.

**The original report, kept because the measurement is the useful part:**

`ci.yml`'s `test` job names 19 files and its own summary reports:

```
# tests 138   # pass 138   # fail 0   # suites 8
```

The same command, on the same tree (`79b07ef`), on the **same node version**
(v22.23.3, downloaded and re-run to eliminate that), with no `node_modules`
anywhere — reproduces exactly here at **277 tests, 0 fail**.

What has been ruled out, one at a time:

| hypothesis | how it was eliminated |
|---|---|
| CI is on an older node | CI logs `node: v22.23.3`; installed and ran locally — 277 |
| the `test` job is on a stale SHA | the run's `headSha` is `79b07ef`, this branch's HEAD |
| the tree differs | `git diff 79b07ef -- test/` is empty |
| the step's multi-line continuations break | pasted verbatim into a shell; 277 |
| a missing `node_modules` skips files | `/tmp` copy of the tree with no `node_modules`; 277 |
| CI is failing and hiding it | `# fail 0`, `# cancelled 0` |
| the checker's count is the wrong one | it counts list MEMBERS, and the list has 19 |

The 139-test gap is exactly the tests of the eight files
`agent-policy`, `approvals`, `budget`, `judge`, `metrics`, `policy`,
`questioner`, `runner` — all present on ci.yml's run step, none of them
appearing anywhere in the CI log. The other eleven files' tests are all
there.

The exact split, re-measured on run `36971045027` (SHA `a406b90`):

| ran in CI | contributed nothing |
|---|---|
| approval-bridge, assistant-ui, brief, envelope, explainer, optimize, optimizer, refine, runlog, start-target, tools | agent-policy, approvals, budget, judge, metrics, policy, questioner, runner |

The seven hypotheses eliminated, and how, are the durable part of this
entry. Seven is a lot of wrong guesses, and each one is a shape the next
person would otherwise try again:

| hypothesis | how it was eliminated |
|---|---|
| CI is on an older node | CI logs `node: v22.23.3`; downloaded and ran it — 277 |
| the job ran a stale SHA | the run's `headSha` is this branch's HEAD |
| the tree differs | `git diff <sha> -- test/` is empty |
| the multi-line continuations break | pasted verbatim into a shell; 277 |
| a missing `node_modules` skips files | a `/tmp` copy with none; 277 |
| CI is failing and hiding it | `# fail 0`, `# cancelled 0` |
| the checker's count is the wrong one | it counts list MEMBERS; the list has 19 |

And what made it visible at all: **reading the CI log instead of its exit
code.** Every check in this repo reports through its exit status, so a job that
runs half its list is a job that reports SUCCESS — and nothing else in the
tree could ever have said so.

The file list was never the problem: it is correct, and 19 of 19 files exist
in the checked-out SHA.

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
| `bash demo/run.sh --max-steps 6` | `budget-stop` (step ceiling) | 6 of 6 | $0.0031 | — **not reproducible**: re-run 2026-10-03, this reaches `goal-met` at 5 steps, so the ceiling never bound. Corrected to `--max-steps 4` -> `budget-stop` 4 of 4, $0.0028 (§1p) |
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
