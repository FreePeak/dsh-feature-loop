# Setup guide — feature loop + Agent Teams in DSH

A step-by-step guide to running the **feature-loop policy plugin** together with
**Agent Teams** on a small task, so you can watch budget ceilings, the review
gate, and the detectors actually fire — and approve a gated step yourself in the
browser.

Everything below was executed and verified on this machine
(macOS, Node 22.23.2, DSH checkout at
`~/work/harvey/freepeak/deepseek-harness`). Commands are copy-pasteable.

> **Already running?** A verified live instance is described in
> [`docs/RUNBOOK-SERVER.md`](RUNBOOK-SERVER.md), which opens with an
> **acceptance checklist** (§0) of what "it works" looks like, then the exact
> boot command, the URL, and §2.5-2.6 on the permission preset that silently
> disables the approval prompt. Read §0 and §2.5 before debugging a missing panel.

---

## What you are setting up

Two independent things, deliberately kept separate:

| Piece | Package | What it does |
|---|---|---|
| **Feature loop** | `@freepeak/dsh-feature-loop` | Budget ceilings, cheap-first routing, review gate, 6 stall detectors, local judge — hosted on the agent loop's own extension points |
| **Agent Teams** | `@deepseek-ai/dsh-experimental-agent-team-profile` | Parallel teammates with a durable mailbox and a shared task DAG |

They solve **different problems** and do not overlap. The feature loop governs
*one bounded loop* (when to stop, when to ask, when to spend no more). Agent
Teams governs *many agents working in parallel*. You want both when the Lead
should delegate work **and** each worker should be bounded.

Read that once more before you start: **the feature loop is not a replacement
for Agent Teams, and Agent Teams is not a replacement for the feature loop.**

**The third piece is already built and you do not write it.** The Web UI
approval panel, the roster/task-board panel, and the session views ship with DSH.
Your job is to install the plugin so the gate *reaches* them.

---

## Two ways to run this

| | Docker (**recommended**) | Local checkout |
|---|---|---|
| You need | Docker, and a gateway key | Node 22, pnpm, a harness checkout |
| Steps | one command | build the plugin, create a profile, install, patch, boot |
| Guide | [`../docker/README.md`](../docker/README.md) | this file, from Step 1 |

**Docker is the shorter path and the one that is known to work end to end.** It
installs the harness CLI and its bundles from npm, builds only this plugin, and
pins the permission preset that makes the approval panel appear. Start there
unless you specifically want to run against a local `deepseek-harness` checkout.

```bash
cd dsh-feature-loop
ONEGW_API_KEY=sk-... docker compose -f docker/docker-compose.yml up --build
docker compose -f docker/docker-compose.yml logs -f   # the URL + token
```

The rest of this file is the **local** path. One caveat up front, because it
bites on a clean clone: `pnpm build` here assumes a populated `node_modules`
(see Step 1).

---

## Prerequisites

```bash
node --version          # must be >= 22 (--experimental-strip-types)
dsh --version 2>/dev/null || echo "dsh is invoked from the checkout"
```

DSH is run from its checkout in this guide:

```bash
DSH=~/work/harvey/freepeak/deepseek-harness
node "$DSH/apps/cli/lib/bin.js" --help
```

### The gateway key, for the standalone demo only

The **plugin** path (steps 1-7) needs no key of its own — it uses whatever the
harness is configured with. The **standalone runner demo** (`bash demo/run.sh`)
does need a gateway key, read from the environment or the DSH credential store:

```bash
# either export it…
export ONEGW_API_KEY=...
# …or rely on the store DSH itself populates:
#   ~/.dsh/.credentials.yaml  ->  refs:
#                                  ONEGW_API_KEY: ...
```

Both `ONEGW_API_KEY` and `ONEGE_API_KEY` are accepted. If `demo/run.sh` fails
with:

```
no gateway key: set ONEGW_API_KEY (or ONEGE_API_KEY) in the environment,
or add it to ~/.dsh/.credentials.yaml
```

…then check the name under `refs:` in that file. The key being present under a
**different name** is the usual cause — an earlier version of `cli.ts` looked
only for `ONEGE_API_KEY` while the store records `ONEGW_API_KEY`, and reported
the key as absent from a file that contained it.

If the CLI is not built:

```bash
cd "$DSH" && pnpm run build        # or: pnpm run build:lib
```

---

## Step 1 — Install dependencies and build the plugin

The harness loads a plugin as **built JavaScript**, resolved by package name. It
does not load `.ts` sources, so the build is not optional.

```bash
cd ~/work/harvey/freepeak/dsh-feature-loop
pnpm install        # installs tsdown + typescript only
pnpm build          # tsdown src/index.ts --format esm --dts --out-dir lib
```

Expected output (sizes drift with the bundler; `Build complete` is the signal):

```
lib/index.mjs        42.08 kB │ gzip: 13.83 kB
lib/index.d.mts      30.04 kB │ gzip:  9.93 kB
✔ Build complete
```

> **`pnpm install` installs three packages, not the harness** (typescript, `@types/node`, tsdown). The `@deepseek-ai/*`
> packages in `peerDependencies` are supplied by the deployment at runtime; they
> are marked optional and `.npmrc` sets `auto-install-peers=false`, because some
> of their transitive dependencies are harness-internal (`@deepseek-ai/dsh-type-meta`)
> and are not on npm — auto-installing peers fails the whole install.
>
> This is why `pnpm install` used to be impossible here: the manifest pinned
> `@deepseek-ai/cordis@0.4.0` and `@deepseek-ai/schemastery@0.1.5`, both
> harness-monorepo *workspace* versions that were never published. They are no
> longer devDependencies.

Verify the build produced the cordis contract the harness requires:

```bash
grep -c "export {" lib/index.mjs && grep -o "apply" lib/index.mjs | head -1
# 1
# apply
```

> **Do not try to `import('./lib/index.mjs')` at this point.** It will fail with
> `ERR_MODULE_NOT_FOUND` for `@deepseek-ai/dsh-llm`, and that is expected — the
> bundle imports `MessageId` from a harness package at runtime, and harness
> packages are *peers* supplied by the deployment, which is why `pnpm install`
> deliberately does not fetch them. The import only resolves inside a DSH
> profile, which is what Step 6 boots. A clean-clone `import` failing here means
> the manifest is behaving correctly, not that the build is broken.

> **No local harness checkout?** This path needs one (Steps 2-7 install the
> plugin into a DSH profile). If you only want a working server, use the Docker
> path above — it needs no toolchain and no checkout.

---

## Step 2 — Create the profile (one command)

```bash
bash scripts/make-profile.sh fltest
```

That writes `~/.dsh/profiles/fltest/` (manifest, pnpm settings, patch layer),
runs the install, prints the resolved plugin row, and ends with the boot
command. It encodes five things this guide used to have to state one by one,
each of which is a silent failure when you get it wrong:

1. **The plugin must be in `dsh.profile.bundles`.** A dependency alone composes
   nothing — which is exactly why the `web` profile can list the plugin as a
   dependency and still run an ordinary, ungated agent loop.
2. **The profile must also depend on a harness bundle**, or the plugin's
   optional `peerDependencies` never resolve and the plugin is inert:
   `ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-llm`, the fiber never constructs,
   `apply()` never runs. The row still composes and the client bundle is still
   in the boot graph — `client-modules` reads `dsh.client` from `package.json`
   on disk and never imports the module, so **a graph row is not proof**.
3. **The harness packages are pinned in `pnpm.overrides`**, to the version the
   harness checkout itself runs (read from it, not hardcoded). Without them the
   install fails with the least readable error pnpm has:
   `ERR_PNPM_NO_MATCHING_VERSION: No matching version found for @deepseek-ai/dsh-llm@>=0.1.5 <0.2.0`,
   followed by `The latest release of @deepseek-ai/dsh-llm is "0.0.1-rc.1"` —
   which is true and useless, because the version you want is published.
4. **pnpm 9, always.** The lockfile is v9; `pnpm@11` silently re-resolves it and
   drops the peer wiring, so the install succeeds and the plugin is inert.
5. **The patch row is a REPLACE, not a merge.** The generated patch spells out
   every key it keeps. A partial override — the natural thing to write when you
   only want to change one policy — silently deletes `spec`, and a spec-less
   policy builds no gate at all.

It also prints the peer-resolution check, which reads the plugin's own entry in
the lockfile:

```
==> peers resolved (10 harness packages on the plugin's entry)
```

Without that line the install still reports success and the plugin still does
nothing. The script's full help:

```bash
bash scripts/make-profile.sh --help
#   [name] [--port N] [--dashboard-port N] [--web|--headless]
```

**Two things must be true before the first run, and neither produces an error.**

The script cannot set either one for you, because both are facts about the
machine rather than about the profile — and both were found by running this
(2026-10-01, against DSH 0.2.0-rc.1):

1. **`ONEGW_API_KEY` must be in the environment that boots the server.** The
   profile references it by name (`apiKeyEnv: ONEGW_API_KEY`), so no key is
   ever written into the profile. A server started without it boots perfectly:
   both surfaces answer, the dashboard records the run, and the *first model
   call* dies with

   ```
   llm-pi-ai: no credential for provider route "onegw"; its profile resolves
   ONEGW_API_KEY, which is not set
   ```

   That reads like a plugin failure and is not one. Start the server from a
   shell that exports it, or pass it inline.

2. **Add a Workspace.** A fresh `DSH_HOME` has none, and the Feature Loop page
   says so — correctly, since guessing which checkout to write into is the wrong
   default:

   > No workspace is registered yet — open a project folder, then start the loop.

   Use the sidebar's **Add workspace**. Everything after that is one loop:
   type a task, press **Start loop**, click **Allow once**.

**One port per process.** Each dsh process owns its own approval registry *and*
its own dashboard, so the headless twin needs a different dashboard port from
the web one:

```bash
bash scripts/make-profile.sh fltest-headless --headless --dashboard-port 8102
```

Pointing both at one port is a specific and confusing failure: the second boot
logs `EADDRINUSE`, the gate fails closed with `no approval channel is
available`, and a perfectly good dashboard sits open on the *other* port.

**And `gateMode` follows the app, because `ask` only works with a page.**
`make-profile.sh` stamps `ask` for `--web` and `deny` for `--headless`.
Measured 2026-10-03 against the hand-built `feature-loop-headless` profile with
`ask`: `dsh --profile feature-loop-headless headless "write a file"` returned

```
Error: tool "write" requires approval, but no approval channel is available
```

and the run produced no work at all — the model spent its remaining budget
reasoning about whether `Bash` was a legitimate alternative and then stopped.
Nothing is watching in `dsh headless`: no dashboard page is opened, no browser
polls `/api/state`, and `ask` fails closed by design. So the headless twin is
`deny`, which refuses the step at once and says why.

This also bites a WEB profile whose dashboard port is taken: the page on the
other port is the one answering, and the port you are looking at is dead. If
you hand-edit a row, `grep gateMode` it after any `EADDRINUSE`.

### Driving the STANDALONE dashboard by hand (the one surface no script covers)

The in-UI page is inside the harness, on the harness's origin. The standalone
dashboard is a **second origin on its own port with its own token**, and it is
the only surface where a wiring bug can hide — a click there reaches a different
server than the one the harness is serving. Nothing automates it yet, so here is
the procedure, verified 2026-10-03 against the generated `webring` profile.

**Order matters, and it is not a race.** KNOWN-ISSUES §1be: `gateMode: ask` is
refused *by the plugin* when no front end is watching, so an ask raised before the
dashboard is open never becomes a card. Open the dashboard **first** and confirm
it is watching — otherwise you will wait for a card that was never going to
appear, and the run will report a refusal with no page to click.

```bash
# 1. the server is already up; copy BOTH token lines out of its log
#    feature-loop dashboard: http://127.0.0.1:8100/?token=…
#    dsh web: http://127.0.0.1:4188/?token=…

# 2. open the dashboard in a browser and leave the tab open. Confirm:
curl -s "http://127.0.0.1:8100/api/state?token=$TOK" | grep -o '"watching":[a-z]*'
#    -> "watching":true

# 3. in the harness page: Feature Loop -> type the task -> Start loop

# 4. the card appears on the dashboard tab. Read the card's CALL id before
#    clicking — the thread keeps every ask this dashboard has seen, and an allow
#    is granted PER CALL, so clicking a stale card settles a different one.
```

Verified both directions on a live run:

```
APPROVAL REQUIRED | asked … | write | … | REVIEW REQUESTED (policy): write:
  irreversible is always approved by a human.
Allow once  -> the file exists, containing hello
Reject      -> no file
```

**Why this is not a script yet.** Writing one took seven attempts and three of
the failures were mine, not the plugin's: a stale `bash` card clicked instead of
the write, a Reject half that passed because the Allow half's file was still on
disk, and an argument off-by-one that read the dashboard URL as a tool filter.
Each was fixable and each was instructive, but a check that needs that much
care to aim is a check whose green result means less than its red one. It is
left as a procedure until it can be written once and trusted.

### Doing it by hand instead

If you would rather build it manually, the files are:

```bash
cd ~/.dsh/profiles && mkdir -p fltest && cd fltest
cp ../web/cordis.yml       cordis.yml
cp ../web/cordis.patch.yml cordis.patch.yml
```

```jsonc
// package.json — the four rows that matter
{
  "name": "dsh-profile-fltest",
  "private": true,
  "dependencies": {
    "@deepseek-ai/dsh-experimental-agent-team-profile": "0.1.5-rc.3",
    "@freepeak/dsh-feature-loop": "file:/path/to/dsh-feature-loop"
  },
  "pnpm": { "overrides": { "@deepseek-ai/dsh-llm": "<harness version>", "…": "…" } },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@deepseek-ai/dsh-experimental-agent-team-profile",
        "@freepeak/dsh-feature-loop"
      ]
    }
  }
}
```

`pnpm-workspace.yaml` needs `autoInstallPeers: true` — the shipped profiles set
it `false`, which is what makes a plugin-only profile inert — and the install
must be `npx pnpm@9.15.9 install -w`. `-w` is required: a DSH profile is a
single-package pnpm workspace root, and without it pnpm refuses with
`ERR_PNPM_ADDING_TO_ROOT`.

## Step 3 — (already done by Step 2)

`scripts/make-profile.sh` performs the install itself, because the official
command cannot do the one thing that matters:

```bash
node "$DSH/apps/cli/lib/bin.js" plugin --profile fltest add -w file:…
```

is the right command and it installs the package — but it does not know that
this profile must ALSO carry the harness peers, and `pnpm@11` will re-resolve
the lockfile and drop the peer wiring while reporting success. Use it when you
are adding the plugin to a profile that already works; for a new one, use the
script.

---



## Step 4 — (already done by Step 2 — this is where you TUNE it)

The plugin registers itself with **no spec by default**, which means it loads and
does nothing. That is deliberate: the row is safe to add before you have decided
on a budget. `scripts/make-profile.sh` has already written the full row; this
step is for changing it. Edit the profile's patch layer:

```bash
cd ~/.dsh/profiles/fltest
$EDITOR cordis.patch.yml
```

**Append** one entry to that file — do not assume it is empty:

- If the file is still the template, it is a single empty document, `[]`. Delete
  that line and put the entry below in its place. (Appending a block sequence
  after a flow `[]` is invalid YAML and the loader rejects the whole overlay:
  `failed to parse overlay ... end of the stream or a document separator is
  expected`.)
- If the profile was copied from a customized `web` profile, the file already
  holds **your own patch entries** (and a plugin's own bundle patch may also
  insert a `feature-loop` row). Keep them and append — a later entry for the same
  `id` wins, which is exactly how this activation works.

```yaml
# Ask a human about at most 10% of steps; judge score >= 2 earns a look.
- id: feature-loop
  config:
    reviewBudget: 0.10
    judgeThreshold: 2
    gatePolicies:
      read: auto                     # reads never interrupt
      glob: auto
      grep: auto
      edit: auto-if-confident        # writes need a confidence estimate
      write: auto-if-confident
    # How a review reaches a human. `ask` (the default) prompts in the Web UI
    # composer so you can allow or reject. It fails closed to a refusal when no
    # approval channel is mounted, so it is never less safe than `deny`.
    # Use `deny` for unattended/CI runs where nobody is watching.
    gateMode: ask
    spec:
      goal: "the failing test passes and no other test breaks"
      sensor: ["repo files", "test output"]

      controller:
        # Two rungs, so `MODEL ESCALATION` below is reachable at all: with one
        # rung the ladder cannot move and the notice never prints, which is why
        # this block shows two where the shipped `cordis.patch.yml` shows one.
        #
        # The ids are onegw's, and they must exist in your provider's `models:`
        # list — llm-pi-ai resolves a rung against that list, not against the
        # gateway, so an id it serves but nobody declared dies UNKNOWN_MODEL on
        # step 1 (verified 2026-10-02: `deepseek-flash` and `deepseek-v4-pro`
        # are 404 on this account's gateway AND absent from `/v1/models`, so
        # the pair below was a copy from an older harness build and could not
        # have run here).
        ladder:
          - { provider: onegw, model: execution }      # cheap
          - { provider: onegw, model: planning }       # escalated
        stepsPerRung: 5
        escalateAfterFailures: 2

      actuator:
        read: read
        glob: read
        grep: read
        bash: irreversible           # arbitrary command execution
        edit: reversible-write
        write: irreversible

      feedback: "all tests pass, and the diff is the smallest that achieves it"

      termination:
        successCommand: "npm test"
        guards: ["error-cascade", "tool-cycle"]

      maxSteps: 15
      costBudgetUSD: 1.00

      prices:
        deepseek-official/deepseek-flash:
          inputPerMTok: 0.14
          outputPerMTok: 0.28
          cacheReadPerMTok: 0.014
        deepseek-official/deepseek-v4-pro:
          inputPerMTok: 2.50
          outputPerMTok: 10.00
```

### The four things people get wrong here

1. **Use the harness's real tool names.** The model in a DSH session calls
   `read`, `write`, `edit`, `bash`, `glob`, `grep` — **not** `read_file` /
   `write_file` / `edit_file` / `list_files` / `run_tests`. The latter names
   exist only in this repo's standalone runner (`src/tools.ts`) and never appear
   in a harness session. A name that matches nothing is **not an error**: the
   tool falls through to the unclassified `irreversible` default, so the gate
   still fires — but with `always-approve` instead of the policy you meant to
   set. You would then be reading a gate that works for the wrong reason.
2. **All eight dimensions are required.** `validateSpec` rejects an incomplete
   spec *at load*, naming every missing dimension. If DSH refuses to boot, read
   the error — it tells you exactly which field is missing.
3. **`prices` is not optional in practice.** A cost budget measured against an
   unknown price silently reads zero. An unpriced route is a hard error by
   design.
4. **An `irreversible` actuator entry needs a termination guard.** Spec
   validation enforces this: if you declare an irreversible tool and provide no
   `guards`, the gate is your only containment and the validator says so. Keep
   `error-cascade` and `tool-cycle`.

---

## Step 5 — Verify the profile composes

Before booting, confirm both layers resolve. This is the cheapest check and it
catches every packaging mistake:

```bash
DSH=~/work/harvey/freepeak/deepseek-harness
node "$DSH/apps/cli/lib/bin.js" --profile fltest --dump-config \
  | grep -A 14 -m1 "id: feature-loop"
```

You should see the resolved row. Two details of the real output are worth
expecting, because both look like mistakes and are not:

- **The row you see is the merged result.** The plugin's own bundle patch and
  your profile layer both target `id: feature-loop`, and the composed dump shows
  one row carrying your spec — a later entry for the same `id` wins. (An earlier
  version of this guide claimed the row appeared twice; it does not.)
  Search for `gateMode` to confirm *your* settings took.
- **`gateMode: ask` is the line that matters.** If your row lacks it, the gate
  still asks (that is the default) but you have not configured it explicitly.

```yaml
- id: feature-loop
  name: '@freepeak/dsh-feature-loop'
  config:
    reviewBudget: 0.1
    judgeThreshold: 2
    gateMode: ask
    gatePolicies: { read: auto, edit: auto-if-confident, ... }
```

And confirm Agent Teams composed too:

```bash
node "$DSH/apps/cli/lib/bin.js" --profile fltest --dump-config \
  | grep -E "agent-team|tool-agent-team"
# - id: ui-agent-team
# - id: agent-team
# - id: tool-agent-team
```

If `feature-loop` is missing, the package did not install (step 3). If the
`config:` block is empty, your patch layer did not take (step 4).

**The row composing is not the same as the plugin working.** It is the check
above plus one more, and the second one catches the failure the first cannot:
peers unresolved. The plugin imports two harness packages at runtime; when they
do not resolve, the import throws, the fiber never constructs, and the loop runs
with default permissions — while `--dump-config` still shows all three rows.

```bash
awk '/^  \.:$/,/^packages:$/' ~/.dsh/profiles/fltest/pnpm-lock.yaml \
  | grep -A2 "dsh-feature-loop':" | tail -1
```

```
        version: file:…/dsh-feature-loop(@deepseek-ai/cordis@4.0.4)(@deepseek-ai/dsh-agent@…)…
```

Peer suffixes present = wired. A bare `file:…/dsh-feature-loop` = inert.

---

## Step 6 — Boot it

```bash
DSH=~/work/harvey/freepeak/deepseek-harness
node "$DSH/apps/cli/lib/bin.js" --profile fltest --port 4188 --no-open
```

Expected — **two** token lines, and the second is the one that matters:

```
dsh web: http://127.0.0.1:4188/?token=...
feature-loop dashboard: http://127.0.0.1:8100/?token=...
```

Open the first URL (it carries the auth token). **Use a port other than 3081**
unless you intend to replace the GUI you are already running.

- **The web URL** is the harness UI. The plugin's page lives inside it, at
  **Feature Loop** in the sidebar.
- **The dashboard URL** is the standalone approval surface, on its own origin.
  You only need it if you are driving approvals from somewhere other than the
  UI's composer — a script, or a second machine's worth of tabs.

If the second line is missing, `dashboard.standalone` is not `true` in your patch
row. `enabled: true` alone starts **no server**: the default dashboard is a page
*inside* the DSH UI, reached over the host remote, and the loopback server is
opt-in. Both readings are correct and the difference is silent.

A clean boot with no `MODULE_NOT_FOUND` / `SyntaxError` means the plugin loaded.

---

## Step 7 — Run a small task that exercises both

Pick something genuinely small — the point is to watch the machinery, not to
solve a hard problem. Use the bundled demo bug, which is a real one-line
off-by-one with a failing test suite:

```bash
rm -rf /tmp/fl-demo                       # a second `cp -r` nests demo/ inside it
cp -r ~/work/harvey/freepeak/dsh-feature-loop/demo /tmp/fl-demo
cd /tmp/fl-demo && bash reset.sh      # re-plant the bug
```

`/tmp/fl-demo` is a throwaway copy with no `.git`, and it **keeps** the agent's
fix afterwards — which is the point here, because the next step diffs it. Run the
three commands again to start over.

Now paste this into the DSH session:

> Use Agent Teams to split this between two teammates. Teammate A diagnoses the
> off-by-one in `/tmp/fl-demo/src/latency-window.ts` and reports the exact
> expression at fault. Teammate B then fixes it and runs
> `node --experimental-strip-types --test test/latency-window.test.ts` until it
> passes. Report the root cause, the diff, and the final test result. Keep it
> under 10 steps.

### What to watch for

This is the whole payoff — the policies are visible in the transcript:

| You should see | Meaning |
|---|---|
| **The approval panel in the composer** | The gate asked, and the Web UI is waiting on you. Click **Allow once** to let the step proceed, or **Reject** to refuse it. |
| `[review] ASK HUMAN via policy — edit: reversible-write needs a confidence estimate and none was available — asking rather than guessing` | Why it asked. This is **fail-closed**: no judge ⇒ no evidence of confidence ⇒ ask. (The tail is part of the real message; shortened versions in older notes were wrong.) |
| `[review] ASK HUMAN via signal` | A critical detector fired (`error-cascade`, `tool-cycle`). Critical signals are never rate-limited. |
| A step count that stops at your ceiling | `maxSteps` fired as a **limit, not an invoice** — it stops *before* the expensive call. |
| `MODEL ESCALATION` in a notice | The ladder moved up a rung on evidence. It needs **two consecutive failed steps** (`escalateAfterFailures: 2`) on a two-rung ladder — with the shipped one-rung `cordis.patch.yml` this notice cannot appear, so a run that never shows it is not misconfigured. |
| `spawn_teammate`, `send_message`, `team_task_*` | Agent Teams is live. |

### Before you expect a prompt: pick the `workspace-write` preset

> **Verified on a fresh profile, 2026-10-01 (DSH 0.2.0-rc.1).** A profile made
> by `scripts/make-profile.sh` on a machine whose global `~/.dsh` has no
> `permission` section comes up on **Workspace Write** already, and both
> surfaces ask: the plugin's own card on the Feature Loop page, *and* the
> harness's composer panel reading the plain conversation —
> `Waiting for approval · REVIEW REQUESTED (policy): write: irreversible is
> always approved by a human. · Reject · Allow once`. So the trap below is real
> but it is a property of the SETTINGS, not of this plugin or of a fresh
> profile: if you see `Danger Full Access` in the mode chip, this section is
> for you; if you see `Workspace Write`, skip it.

**This is the step that trips everyone up.** If your DSH settings set
`permission.defaultPreset: danger-full-access`, that preset maps to
`approval: never`, and a fresh session applies it *after* every config default —
so a feature-loop `ask` is refused with `Error: the user rejected tool "X"`
**before any UI is consulted**, and no panel can appear.

The fix needs no file edit: open the **permission / preset selector** in the
session (the Web UI ships one, `client-ui-permission-presets`) and choose
**workspace-write**, whose preset carries `approval: ask`. That applies per
session — nothing on disk changes.

```ts
// what that selector does, packages/interaction/permission-presets/src/index.ts
set(session, 'workspace-write')   // -> setApprovalPolicy(session, 'ask')
```

To change it for every DSH session instead, set
`~/.dsh/settings.yaml` → `permission.defaultPreset: workspace-write`. Be aware
that also relaxes your global sandbox, so writes outside the workspace begin to
require approval.

**Or change nothing globally:** run a second server under its own `DSH_HOME`,
whose private `settings.yaml` carries the right preset. That server's panel works
immediately. See [`docs/RUNBOOK-SERVER.md`](RUNBOOK-SERVER.md) §2.6 for the five
commands, and §2.5 for the full mechanism.

Full mechanism: [`docs/RUNBOOK-SERVER.md`](RUNBOOK-SERVER.md) §2.5.

### The human-in-the-loop step, concretely

This is the flow to confirm, and the whole reason the gate returns `ask`:

1. The model decides to edit a file. The plugin's gate classifies `edit`
   as `reversible-write`, finds no confidence estimate (no judge is configured),
   and returns `{kind:'ask', reason}` — **before** the tool runs.
2. DSH routes that `ask` to the approval service, which asks any composed
   answerer. In the Web UI, `@deepseek-ai/dsh-client-ui-approval` takes over the
   conversation composer and shows the reason with **Reject** / **Allow once**.
3. You click **Allow once** → the outcome is `allowed-once` → the tool
   dispatches. You click **Reject** → `rejected` → the model is told a human said
   no, and the step counts as a failure so `error-cascade` can see a loop that
   keeps hitting the same wall.
4. The approval is **one-shot**: it applies to that request only. The next write
   asks again.

> **If you get a tool error instead of a panel, check the session's permission
> preset.** If it is `danger-full-access`, that preset's approval policy is
> `never`, which rejects every request *before any UI is consulted* — you will
> see `Error: the user rejected tool "X"` and no panel. Select
> **workspace-write** in the session's preset selector (or run under a private
> `DSH_HOME` whose settings pin it). See `docs/RUNBOOK-SERVER.md` §2.5-2.6.

### Run it again with the ceiling deliberately too low

The fastest way to trust a ceiling is to watch it fire:

```yaml
maxSteps: 3
costBudgetUSD: 0.00001
```

Restart (or let `patchReload: live` pick it up) and run the same task. It must
stop early and say why. **If it runs past the ceiling, the plugin is not
loaded** — go back to step 5.

---

## Proving the approval path without a browser

You do not have to trust the panel blindly. Before or after you click it, run the
integration test — it mounts this plugin into a **real** DSH context (real tool
runtime, real approval service, real session) and drives the actual dispatch
path:

```bash
cd ~/work/harvey/freepeak/dsh-feature-loop
pnpm test:integration
```

Expected: **5 tests pass**. It asserts the four outcomes a human can produce:

| Case | What it proves |
|---|---|
| answerer returns `allowed-once` | **Your approval releases the gate and the write runs.** |
| answerer returns `rejected` | **Your refusal stops it**, and the model is told a human said no. |
| no answerer registered | Fail closed — `ask` is never less safe than `deny`. |
| `gateMode: 'deny'` | Unattended mode refuses and never even asks. |

If these pass and the browser still shows no panel, the problem is the
environment, not the plugin — check the session's permission preset (§Troubleshooting).
Full detail: [`docs/VERIFY-INTEGRATION.md`](VERIFY-INTEGRATION.md).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_PNPM_ADDING_TO_ROOT` | Missing `-w` | `dsh plugin --profile fltest add -w file:...` |
| `ERR_PNPM_NO_MATCHING_VERSION` for `@deepseek-ai/dsh-llm`, with `latest is 0.0.1-rc.1` in the message | The plugin's peers were never pinned; pnpm looked them up against `latest`, which is not the version you want | The profile's `package.json` needs `pnpm.overrides` pinning the harness packages — `scripts/make-profile.sh` writes them |
| `feature-loop` absent from `--dump-config` | Package not installed into *this* profile, or not in `dsh.profile.bundles` | Re-run `bash scripts/make-profile.sh fltest` |
| Row present, but **nothing is ever gated** | The peers did not resolve: the module import throws, the fiber never constructs | The plugin's lockfile entry has no `@deepseek-ai/…@` suffixes — see the check in Step 5 |
| Row present but `config:` empty | Patch layer not applied | Check your edit landed in `~/.dsh/profiles/fltest/cordis.patch.yml`, not the repo's |
| No `feature-loop dashboard:` line at boot | `dashboard.standalone` is not `true` | `enabled: true` alone starts no server; the default dashboard is a page inside the UI |
| `EADDRINUSE` on the dashboard port, then `no approval channel is available` | Two dsh processes share one dashboard port | One port per process — see Step 2 |
| Boot fails naming a spec dimension | `validateSpec` rejected it | Add the named field; all eight are required |
| `irreversible tools ... with no termination guards` | You declared an irreversible tool with `guards: []` | Add `guards: ["error-cascade", "tool-cycle"]` |
| `no adapter registered for provider "onegw"` | No LLM route in the profile | The generated patch has an `llm-pi-ai` row; if you overwrote it, put it back |
| Nothing ever asks for review | Gate policies all `auto`, or no judge configured, or `spec` omitted | `write: always-approve` (the shipped default); omit `spec` and nothing runs at all |
| Gate asks with `always-approve` instead of your policy | Your `gatePolicies`/`actuator` key is not a real harness tool name | Use `read`/`write`/`edit`/`bash`/`glob`/`grep`, not `write_file`/`edit_file` |
| **Tool error instead of an approval panel** | The session's permission preset is `danger-full-access`, whose approval policy `never` rejects before any UI | Select the **workspace-write** preset in the session, or run a private `DSH_HOME` with it pinned; see §2.5-2.6 of the runbook. **Check the mode chip first**: a fresh profile on this machine comes up on `Workspace Write` and both panels ask, so if you see that chip this row is not your problem |
| The **plugin's card** appears but the conversation composer is silent | Not a fault — the two are different surfaces. The Feature Loop page is this plugin's; the composer panel is the harness's, and it renders the ask only when the session itself made the tool call | Both were verified separately on a fresh profile (2026-10-01): the plugin page shows the card, and the composer shows `Waiting for approval` for a loop started from the composer |
| Approval panel appears but the run then stops | You clicked **Reject**, or the request was cancelled | Expected. Approval is one-shot and per request; the step counts as a failure |
| Port 3081 already in use | You are already running the main GUI | Use `--port 4188` |

---

## Teardown

```bash
rm -rf ~/.dsh/profiles/fltest /tmp/fl-demo
```

Removing the plugin from a profile you want to keep:

```bash
node "$DSH/apps/cli/lib/bin.js" plugin --profile <name> \
  remove @freepeak/dsh-feature-loop
```

---

## Known limits — read before you rely on this

These are real and documented in [`docs/PRD.md`](PRD.md). Setup does not fix them.

1. **Spend is not metered.** `LoopBudget.spend()` is never called with real
   usage, so the **cost ceiling currently measures zero**. `maxSteps` works and
   is trustworthy; `costBudgetUSD` does not yet. Do not rely on it to bound
   money.
2. **The plugin path has no automated test.** Both bugs found during this
   build — a detector history that was never populated (§7.1) and a **fail-open
   gate** on the irreversible path (§7.2) — were caught by reading and manual
   verification, not by CI. `src/plugin.ts` is also excluded from the CI
   typecheck (it needs harness packages CI cannot resolve).
3. **The review rate is ~20% in practice, not the book's <10%.** Critical
   signals are deliberately not rate-limited — safety is not subject to an
   attention budget — so a run with an error cascade exceeds the target by
   design.
4. **The price table is illustrative.** the gateway runs on a subscription, so
   marginal cost is near zero; the rates exist so a ceiling has something to
   measure against.
5. **`run_tests` timeouts kill the direct child, not grandchildren.**

---

## Quick reference

```bash
# build
cd ~/work/harvey/freepeak/dsh-feature-loop && pnpm build

# create a profile that actually runs the loop (install + compose check)
bash scripts/make-profile.sh fltest

# verify composition (cheapest check)
node "$DSH/apps/cli/lib/bin.js" --profile fltest --dump-config | grep -A14 -m1 "id: feature-loop"

# and that the peers resolved (the check above cannot see this)
awk '/^  \.:$/,/^packages:$/' ~/.dsh/profiles/fltest/pnpm-lock.yaml \
  | grep -A2 "dsh-feature-loop':" | tail -1

# boot — two token lines: the UI, and the standalone dashboard
node "$DSH/apps/cli/lib/bin.js" --profile fltest --port 4188 --no-open

# the standalone runner — same policies, no harness at all
bash demo/run.sh
```
