# Setup guide — feature loop + Agent Teams in DSH

A step-by-step guide to running the **feature-loop policy plugin** together with
**Agent Teams** on a small task, so you can watch budget ceilings, the review
gate, and the detectors actually fire.

Everything below was executed and verified on this machine
(macOS, Node 22.23.2, DSH checkout at
`~/work/harvey/freepeak/deepseek-harness`). Commands are copy-pasteable.

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

If the CLI is not built:

```bash
cd "$DSH" && pnpm run build        # or: pnpm run build:lib
```

---

## Step 1 — Build the plugin

The harness loads a plugin as **built JavaScript**, resolved by package name. It
does not load `.ts` sources, so the build is not optional.

```bash
cd ~/work/harvey/freepeak/dsh-feature-loop
pnpm build          # tsdown src/index.ts --format esm --dts --out-dir lib
```

Expected output:

```
lib/index.mjs        40.82 kB │ gzip: 13.34 kB
lib/index.d.mts      28.16 kB │ gzip:  9.41 kB
✔ Build complete
```

Verify the build exposes the cordis contract the harness requires:

```bash
node -e "import('./lib/index.mjs').then(m => console.log(m.name, m.inject, typeof m.apply))"
# feature-loop [ 'agents' ] function
```

If that prints `feature-loop [ 'agents' ] function`, the build is good. If it
throws, stop here — nothing downstream will work.

---

## Step 2 — Create a scratch profile

**Do not test in your working `web` profile.** Make a throwaway one; if the
plugin misbehaves, you delete a directory instead of repairing your daily setup.

```bash
cd ~/.dsh/profiles
mkdir -p fltest && cd fltest

# Copy the profile scaffolding (an empty root + your user patch layer).
cp ../web/cordis.yml          cordis.yml
cp ../web/pnpm-workspace.yaml pnpm-workspace.yaml
cp ../web/cordis.patch.yml    cordis.patch.yml
```

Now the profile manifest. This lists the bundles that compose the profile, in
order — note that **both** the team bundles and the feature-loop plugin are
present:

```bash
cat > package.json <<'JSON'
{
  "name": "dsh-profile-fltest",
  "private": true,
  "dependencies": {},
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@deepseek-ai/dsh-experimental-agent-team-web-profile",
        "@deepseek-ai/dsh-experimental-agent-team-profile",
        "@freepeak/dsh-feature-loop"
      ],
      "patchReload": "live"
    }
  }
}
JSON
```

### Why both team bundles

`agent-team-profile` inserts the team **service and tools**;
`agent-team-web-profile` adds the **UI** for them. On a server profile you want
both. The team layer also disables the older `subagent` / `subagent_fork` tools
so that direct delegation goes through `spawn_teammate` instead — that is
intentional, and it is why the delegation tool names change once teams are on.

---

## Step 3 — Install the plugin into the profile

Use the official command. It forwards to `pnpm` inside the profile directory.

```bash
DSH=~/work/harvey/freepeak/deepseek-harness
node "$DSH/apps/cli/lib/bin.js" plugin --profile fltest \
  add -w file:~/work/harvey/freepeak/dsh-feature-loop
```

> **`-w` is required.** Without it pnpm refuses with
> `ERR_PNPM_ADDING_TO_ROOT`, because a DSH profile is a single-package pnpm
> workspace root. This is the most common stumble in this setup.

Expected:

```
dependencies:
+ @freepeak/dsh-feature-loop 0.1.0
Done in 2s using pnpm v9.15.9
```

---

## Step 4 — Turn the policies on

The plugin registers itself with **no spec by default**, which means it loads and
does nothing. That is deliberate: the row is safe to add before you have decided
on a budget. Edit the profile's patch layer:

```bash
cd ~/.dsh/profiles/fltest
$EDITOR cordis.patch.yml
```

Replace the empty `[]` with:

```yaml
# Ask a human about at most 10% of steps; judge score >= 2 earns a look.
- id: feature-loop
  config:
    reviewBudget: 0.10
    judgeThreshold: 2
    gatePolicies:
      read_file: auto                # reads never interrupt
      list_files: auto
      run_tests: auto
      edit_file: auto-if-confident   # writes need a confidence estimate
      write_file: auto-if-confident
    spec:
      goal: "the failing test passes and no other test breaks"
      sensor: ["repo files", "test output"]

      controller:
        ladder:
          - { provider: deepseek-official, model: deepseek-v4-flash }  # cheap
          - { provider: deepseek-official, model: deepseek-v4-pro }    # escalated
        stepsPerRung: 5
        escalateAfterFailures: 2

      actuator:
        read_file: read
        list_files: read
        run_tests: read
        edit_file: reversible-write
        write_file: irreversible

      feedback: "all tests pass, and the diff is the smallest that achieves it"

      termination:
        successCommand: "npm test"
        guards: ["error-cascade", "tool-cycle"]

      maxSteps: 15
      costBudgetUSD: 1.00

      prices:
        deepseek-official/deepseek-v4-flash:
          inputPerMTok: 0.14
          outputPerMTok: 0.28
          cacheReadPerMTok: 0.014
        deepseek-official/deepseek-v4-pro:
          inputPerMTok: 2.50
          outputPerMTok: 10.00
```

### The three things people get wrong here

1. **All eight dimensions are required.** `validateSpec` rejects an incomplete
   spec *at load*, naming every missing dimension. If DSH refuses to boot, read
   the error — it tells you exactly which field is missing.
2. **`prices` is not optional in practice.** A cost budget measured against an
   unknown price silently reads zero. An unpriced route is a hard error by
   design.
3. **`write_file: irreversible` needs a termination guard.** Spec validation
   enforces this: if you declare an irreversible tool and provide no `guards`,
   the gate is your only containment and the validator says so. Keep
   `error-cascade` and `tool-cycle`.

---

## Step 5 — Verify the profile composes

Before booting, confirm both layers resolve. This is the cheapest check and it
catches every packaging mistake:

```bash
DSH=~/work/harvey/freepeak/deepseek-harness
node "$DSH/apps/cli/lib/bin.js" --profile fltest --dump-config \
  | grep -A 8 "feature-loop"
```

You should see the resolved row:

```yaml
- id: feature-loop
  name: '@freepeak/dsh-feature-loop'
  config:
    reviewBudget: 0.1
    judgeThreshold: 2
    gatePolicies: { read_file: auto, ... }
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

---

## Step 6 — Boot it

```bash
DSH=~/work/harvey/freepeak/deepseek-harness
node "$DSH/apps/cli/lib/bin.js" --profile fltest --port 3099 --no-open
```

Expected:

```
dsh web: http://127.0.0.1:3099/?token=...
```

Open that URL (it carries the auth token). **Use a port other than 3081** unless
you intend to replace the GUI you are already running.

A clean boot with no `MODULE_NOT_FOUND` / `SyntaxError` means the plugin loaded.

---

## Step 7 — Run a small task that exercises both

Pick something genuinely small — the point is to watch the machinery, not to
solve a hard problem. Use the bundled demo bug, which is a real one-line
off-by-one with a failing test suite:

```bash
cp -r ~/work/harvey/freepeak/dsh-feature-loop/demo /tmp/fl-demo
cd /tmp/fl-demo && bash reset.sh      # re-plant the bug
```

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
| `[review] ASK HUMAN via policy — edit_file: reversible-write needs a confidence estimate` | The gate held at the write. This is **fail-closed**: no judge ⇒ no evidence of confidence ⇒ ask. |
| `[review] ASK HUMAN via signal` | A critical detector fired (`error-cascade`, `tool-cycle`). Critical signals are never rate-limited. |
| A step count that stops at your ceiling | `maxSteps` fired as a **limit, not an invoice** — it stops *before* the expensive call. |
| `MODEL ESCALATION` in a notice | The ladder moved up a rung on evidence. |
| `spawn_teammate`, `send_message`, `team_task_*` | Agent Teams is live. |

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

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_PNPM_ADDING_TO_ROOT` | Missing `-w` | `dsh plugin --profile fltest add -w file:...` |
| `ERR_PNPM_NO_MATCHING_VERSION` for `@deepseek-ai/schemastery` | A workspace-internal version (`0.1.5`) was requested; only `3.18.x` is published | The package now pins `^3.18.2` — update if you forked it |
| `feature-loop` absent from `--dump-config` | Package not installed into *this* profile | Re-run step 3 against `--profile fltest` |
| Row present but `config:` empty | Patch layer not applied | Check your edit landed in `~/.dsh/profiles/fltest/cordis.patch.yml`, not the repo's |
| Boot fails naming a spec dimension | `validateSpec` rejected it | Add the named field; all eight are required |
| `irreversible tools ... with no termination guards` | You declared an irreversible tool with `guards: []` | Add `guards: ["error-cascade", "tool-cycle"]` |
| Nothing ever asks for review | Gate policies all `auto`, or no judge configured, or `spec` omitted | `edit_file: auto-if-confident`; omit `spec` and nothing runs at all |
| Port 3081 already in use | You are already running the main GUI | Use `--port 3099` |

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
4. **The price table is illustrative.** `mimo-v2.5` runs on a subscription, so
   marginal cost is near zero; the rates exist so a ceiling has something to
   measure against.
5. **`run_tests` timeouts kill the direct child, not grandchildren.**

---

## Quick reference

```bash
# build
cd ~/work/harvey/freepeak/dsh-feature-loop && pnpm build

# install into a profile
node "$DSH/apps/cli/lib/bin.js" plugin --profile fltest add -w file:~/work/harvey/freepeak/dsh-feature-loop

# verify composition (cheapest check)
node "$DSH/apps/cli/lib/bin.js" --profile fltest --dump-config | grep -A8 feature-loop

# boot
node "$DSH/apps/cli/lib/bin.js" --profile fltest --port 3099 --no-open

# the standalone runner — same policies, no harness at all
bash demo/run.sh
```
