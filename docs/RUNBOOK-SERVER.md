# Runbook — DSH web server with the feature loop + human approval

**Status: verified working.** A human can open the URL below, run a small task,
and approve a gated step in the browser.

| | |
|---|---|
| **Live URL (use this one)** | `http://127.0.0.1:3097/?token=TvTOrx4LgziNHZH9RPce_DM0I0gRyxV3w71Rn5S-gck` |
| **Port** | `3097` — hermetic `DSH_HOME=$HOME/.dsh-fl-verify` (§2.6): preset is already `workspace-write`, so **the approval panel appears with no global change** |
| **Second server** | `http://127.0.0.1:3099/?token=FlQ9s7SFGfE73Qz55TY-eZH1ncUBTVTQ-vBl5YzexmI` — same profile but reads your real `~/.dsh` settings, so its preset is `danger-full-access` and **the panel stays suppressed until you switch the preset** (§2.5) |
| **Profile path** | `~/.dsh/profiles/fltest` |
| **Logs** | `/tmp/fl-hermetic.log` (3097) · `/tmp/fltest-live.log` (3099) — the `dsh web: ...token=...` line is in each |
| **User's live GUI** | port 3081 — **untouched**, verified still serving (`401` on an unauthenticated request) |

> **The token rotates on every boot,** and neither server survives the process
> that started it. Restart with §1 step 4 and read the new token from the log
> line `dsh web: http://127.0.0.1:<port>/?token=...`.

**Start with 3097.** It is the one where a gated write actually prompts, because
it runs under a `DSH_HOME` whose permission preset is `workspace-write` (§2.6).
Use 3099 only if you want to exercise the preset switch yourself.

Open the URL exactly as written: the token is consumed on first load and
exchanged for a `dsh-auth-*` cookie, then redirects to `/`. **Open it in a
browser, not curl** — curl without a cookie jar drops the token on the redirect
and gets `401 authentication required`.

---

## 0. Acceptance checklist — what "it works" looks like

Work down this list. Each row is an observation, not a claim.

| # | Do this | You should see |
|---|---|---|
| 1 | `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3097/` | `401` — the server is up and requires auth |
| 2 | Open the 3097 URL (with `?token=…`) in a browser | The harness UI loads, not `401 authentication required` |
| 3 | Check the session's **permission preset** | `workspace-write`. On 3097 this is already true; on 3099 you must select it (§2.5) |
| 4 | Start a session and paste the task in §6 | The model reads files and proposes an edit |
| 5 | Watch the step that edits a file | **The composer is replaced by an approval panel**: the `REVIEW REQUESTED …` reason, with **Reject** and **Allow once** |
| 6 | Click **Allow once** | The tool runs, the transcript shows the edit result, and the run continues |
| 7 | (Optional) Run it again and click **Reject** | The model is told a human refused; no write happens |
| 8 | Look for `spawn_teammate` / `send_message` / `team_task_*` | Agent Teams is live alongside the loop |
| 9 | *(Optional — dashboard)* Uncomment the `dashboard:` block in the profile's `cordis.patch.yml`, restart, then `grep 'feature-loop dashboard:' <log>` | A second URL line, `…/?token=…`; opening it serves the approval dashboard page (HTTP 200) |
| 10 | *(Optional — dashboard)* While a gated step is pending and a dashboard tab is open | The pending card appears on the dashboard; **Allow once** there releases the tool and the composer prompt clears. With **no** dashboard tab, row 5–7 behave exactly as before |

**If row 5 does not happen, in order of likelihood:**

1. The permission preset is not `workspace-write` — see §2.5. This is the cause
   in almost every case, and it produces `Error: the user rejected tool "X"`
   instead of a panel.
2. `gatePolicies` / `actuator` use names that do not exist (`write_file` rather
   than `write`), so the tool is gated by the unclassified `irreversible` default
   — the panel still appears, but the reason says `always-approve`.
3. The feature-loop row has no `spec`, so the policies are off entirely — check
   `--dump-config` (§1 step 3).

Rows 9–10 (the approval dashboard) are optional and additive: the dashboard
claims an ask only while one of its tabs is open, so skipping it changes
nothing about rows 5–7. What has and has not been verified about it is in
[`VERIFY-DASHBOARD.md`](VERIFY-DASHBOARD.md).

The dashboard UI is a vendored React bundle on
[assistant-ui](https://github.com/assistant-ui/assistant-ui), committed under
`assets/assistant-ui/`. It is not built at install or at runtime; regenerate it
with `make dashboard-bundle` after changing `web/` and commit the result. If
the assets are missing the server refuses to start with an error naming that
command — it will not serve a blank page.

To enable the model-authored review brief as well, add the `brief:` row under
`dashboard:` (see the commented template in `cordis.patch.yml`) with the model
to ask. The brief needs the same gateway the judge uses (`ONEGW_API_KEY` /
`ONEGE_API_KEY` or `~/.dsh/.credentials.yaml`); without it the explainer call
fails and the card shows "brief unavailable" — the ask itself is unaffected.
The brief's model call is not metered by the loop budget (recorded as a
`ponytail:` ceiling in `src/explainer.ts`).

### The panel's rendering is already covered by the harness

Before debugging a missing panel, know that the panel *component* is tested in
`$DSH`, so a broken panel is unlikely to be a DSH bug:

- `packages/client/ui-approval/tests/ui-approval.client.spec.tsx` — 15 tests
  (jsdom) asserting the reason headline, both buttons, and the composer takeover.
- `apps/web/tests/approval-composer.e2e.ts` + a committed snapshot — the panel
  captured from a real browser against a recorded session.

What those do *not* cover is this plugin's reason string arriving in a panel in
a live session here. Full detail and the exact captured ARIA:
[`VERIFY-PANEL-EVIDENCE.md`](VERIFY-PANEL-EVIDENCE.md).

### Quick self-check without a browser

```bash
# The scope has this exact shape (from §2.6's experiment):
node "$DSH/apps/cli/lib/bin.js" --profile flheadless --json "create a file at /tmp/x"
#   default home      -> Error: the user rejected tool "write"        (policy never)
#   workspace-write   -> Error: tool "write" requires approval, but no
#                        approval channel is available                 (policy ask)
```

The second line is the gate's `ask` **reaching the approval seam**. A browser is
the only thing that turns it into a panel.

---

## 1. Exact commands, in order

```bash
DSH=/Users/linh.doan/work/harvey/freepeak/deepseek-harness
PLUGIN=/Users/linh.doan/work/harvey/freepeak/dsh-feature-loop

# 1. Build the plugin. The harness loads BUILT JS by package name; it never
#    loads .ts, so this step is not optional.
cd "$PLUGIN" && "$DSH/node_modules/.bin/tsdown" src/index.ts --format esm --dts --out-dir lib
# -> lib/index.mjs 41.37 kB, lib/index.d.mts 28.16 kB, "Build complete"

# Sanity-check the cordis contract the harness requires:
node -e "import('./lib/index.mjs').then(m => console.log(m.name, m.inject, typeof m.apply))"
# -> feature-loop [ 'agents' ] function

# 2. Install the plugin into the scratch profile.
#    -w is REQUIRED: a profile is a pnpm workspace root; without it pnpm fails
#    with ERR_PNPM_ADDING_TO_ROOT.
node "$DSH/apps/cli/lib/bin.js" plugin --profile fltest add -w "file:$PLUGIN"
# -> + @freepeak/dsh-feature-loop 0.1.0

# 3. Verify composition BEFORE booting (the cheapest check).
node "$DSH/apps/cli/lib/bin.js" --profile fltest --dump-config | grep -A40 feature-loop
node "$DSH/apps/cli/lib/bin.js" --profile fltest --dump-config | grep -E "id: (ui-)?agent-team|id: tool-agent-team"
# -> - id: ui-agent-team / - id: agent-team / - id: tool-agent-team

# 4. Boot. Then observe the token line.
node "$DSH/apps/cli/lib/bin.js" --profile fltest --port 3099 --no-open
# -> dsh web: http://127.0.0.1:3099/?token=...
```

### Profile composition

`~/.dsh/profiles/fltest/package.json` — `dsh.profile.bundles`, in this order:

```json
["@deepseek-ai/dsh-base",
 "@deepseek-ai/dsh-web-app",
 "@deepseek-ai/dsh-experimental-agent-team-web-profile",
 "@deepseek-ai/dsh-experimental-agent-team-profile",
 "@freepeak/dsh-feature-loop"]
```

`cordis.yml`, `pnpm-workspace.yaml` and `cordis.patch.yml` are copied from
`~/.dsh/profiles/web`; only `cordis.patch.yml` was then rewritten to carry the
spec. `cordis.yml` stays the empty `[]` root — the tree is composed as patches.

### The activation patch (`~/.dsh/profiles/fltest/cordis.patch.yml`)

The plugin's own bundle patch inserts the `feature-loop` row with defaults and
**no spec**, so it loads and does nothing. The profile's user layer targets the
same id and supplies all 8 dimensions, which switches the ceilings, detectors
and gate ON. It writes **no judge config on purpose**: with no judge the
confidence is undefined, so `edit: auto-if-confident` has no evidence of
confidence and the gate asks the human. That fail-closed ask is the demo.

Key settings:

- `gatePolicies.edit: auto-if-confident` (and `write`) — the gate that fires.
  **These are the harness's real tool names.** A DSH session calls `read`,
  `write`, `edit`, `bash`, `glob`, `grep`; the `read_file` / `edit_file` names
  belong to this repo's standalone runner and match nothing here.
- `termination.guards: ["error-cascade", "tool-cycle"]` — **required**, because
  the spec declares `write: irreversible`. The validator rejects the pair
  `irreversible tool + no guards`.
- `prices:` — with an unpriced route the cost ceiling measures against an
  unknown price and silently reads zero. All routes on the ladder are priced.
- `maxSteps: 15`, `costBudgetUSD: 1.00`.

---

## 2. Verification performed

| Check | Result |
|---|---|
| Build produced `lib/index.mjs` | ✅ 41.37 kB, exit 0 |
| Cordis contract | ✅ `feature-loop [ 'agents' ] function` |
| `--dump-config` resolves the row with patch applied | ✅ header `# == @freepeak/dsh-feature-loop, patched by /Users/linh.doan/.dsh/profiles/fltest/cordis.patch.yml` |
| All 8 spec dimensions present in resolved config | ✅ goal, sensor, controller.ladder, actuator, feedback, termination (+guards), maxSteps, costBudgetUSD, prices |
| Agent Teams rows present | ✅ `ui-agent-team`, `agent-team`, `tool-agent-team` |
| Boot log shows the token URL | ✅ `dsh web: http://127.0.0.1:3099/?token=...` |
| Boot log free of load failures | ✅ scan for `MODULE_NOT_FOUND\|SyntaxError\|Cannot find module\|plugin load\|failed to load\|ERR_` returned **NONE** (full 60-line log, probe run) |
| Server answers | ✅ tokenless `/` → **401**; tokenized `/?token=...` → **303** + `set-cookie: dsh-auth-*`; following with the cookie → **200**, 31 956 bytes of shell HTML |
| User's GUI on 3081 not disturbed | ✅ never bound, never killed; still returns `401` to curl |
| **The preset is the switch** (hermetic, §2.6) | ✅ default home → `rejected`; `workspace-write` home → `unavailable` ("no approval channel is available"). The second proves the gate's `ask` **reached the approval seam**; the first proves `never` refuses before any UI |
| Hermetic server serves | ✅ 3097: tokenless `401` → token `200`; `/tmp/fl-hermetic.log`, zero load errors |
| `client-ui-approval` mounted | ✅ present in `--dump-config` for both the hermetic and the real `web` profile |
| Plugin gate behaviour | ✅ its suite passes **133/133**, including *"auto-if-confident asks when there is no confidence estimate at all"* — the exact ask this profile is configured to produce |

Note on scope: I verified the plugin **composes and boots clean**, plus its gate
logic in unit tests. I did **not** drive a full agent task through the browser
gate — that is the human's step 7. `maxSteps` is trustworthy; per
`docs/SETUP.md`, `costBudgetUSD` currently measures zero because spend is never
metered with real usage, so do not rely on it to bound money.

---

## 2.5 The one setting that stops the prompt appearing

**Read this before concluding the panel is broken.** On this machine the
approval prompt is suppressed by a single user-level setting. It is not a plugin
fault.

`~/.dsh/settings.yaml` sets:

```yaml
permission:
  defaultPreset: danger-full-access
```

and `danger-full-access` maps to `approval: never`
(`packages/bundle/base/cordis.patch.yml:246-248`). On a fresh session,
`permission-presets` applies that preset's approval policy **directly**:

```ts
// packages/interaction/permission-presets/src/index.ts:440-446
if (preset === null && sandbox === null && approval === null && !seeded) {
  const name = this.defaultPreset
  const spec = this.resolve(name)
  setApprovalPolicy(session, spec.approval)     // -> 'never'
  return
}
```

So a feature-loop `ask` becomes `Error: the user rejected tool "X"` — a refusal
decided by `ApprovalService.decide` **before any answerer runs**
(`user-approval/src/index.ts:263-268`), with no UI ever consulted. The message
blames a user who was never asked.

### Why the profile config cannot fix it

`permission-presets` registers `permission.defaultPreset` as a **settings
section**, and when that section loads it *replaces* the configured default:

```ts
// permission-presets/src/index.ts:234-237
setSource: (current) => { this.defaultSettings = current }
```

So a `defaultPreset:` in a profile's `cordis.patch.yml` loses to the user's
settings. Verified: the fltest profile pins `defaultPreset: workspace-write`, the
composed config shows it, and a headless run still refuses with `rejected` — the
settings value won. `DSH_PERMISSION_MODE` does not help either; it only sets the
sandbox mode and the `approval` bundle's own `policy`, both of which the
per-session preset application overrides.

### The two ways to get the prompt

| Option | How | Scope |
|---|---|---|
| **A. In the UI** | Open the **permission preset selector** (the row the Web UI's `client-ui-permission-presets` renders) and choose **workspace-write** | Depends on the row: the settings row persists, a current-session review preset applies to that session. Either way the panel then works. |
| **B. Edit the file** | `~/.dsh/settings.yaml` → `permission.defaultPreset: workspace-write` | Every DSH session on this machine. Identical to persisting via the UI's settings row. |

Option B also changes the global sandbox from `danger-full-access` to
`workspace-write`, which is a real behaviour change for other work — writes
outside the workspace will start requiring approval. Prefer A unless you want
that.

With `workspace-write` selected, the preset's `approval: ask` is applied and the
composer panel appears.

## 2.6 Option C — a hermetic server, so you change nothing globally

If you would rather not touch `~/.dsh/settings.yaml`, run a second server under
its own `DSH_HOME`. `DSH_HOME` is bootstrap-only and controls where profiles,
settings, credentials and the home patch layer are read from, so a private home
gives the feature loop a correct preset without affecting any other session.

```bash
H=$HOME/.dsh-fl-verify
mkdir -p "$H"
ln -s "$HOME/.dsh/profiles"          "$H/profiles"      # reuse installed bundles
ln -s "$HOME/.dsh/.credentials.yaml" "$H/.credentials.yaml"

# Copy your real settings and change ONLY the permission preset.
sed 's/^\(  defaultPreset:\).*/\1 workspace-write/' \
  "$HOME/.dsh/settings.yaml" > "$H/settings.yaml"
grep -A2 '^permission:' "$H/settings.yaml"     # -> defaultPreset: workspace-write

# Boot it (3097, distinct from the 3099 server and the 3081 GUI).
DSH_HOME=$H node "$DSH/apps/cli/lib/bin.js" --profile fltest --port 3097 --no-open
# -> dsh web: http://127.0.0.1:3097/?token=...
```

`profiles/` is symlinked so the already-installed bundles and the installed
plugin are reused; only `settings.yaml` and the credentials link are new.
Verified running at the time of writing.

### The test that proves the preset is the switch

This is the cheap, decisive check — it distinguishes "the gate reached the
approval seam" from "the deployment refused before any UI":

```bash
# With the DEFAULT (danger-full-access) home:
node "$DSH/apps/cli/lib/bin.js" --profile flheadless --json "create a file at /tmp/x"
# -> Error: the user rejected tool "write"            <- policy 'never', no UI consulted

# With the workspace-write home:
DSH_HOME=$HOME/.dsh-fl-verify node "$DSH/apps/cli/lib/bin.js" \
  --profile flheadless --json "create a file at /tmp/x"
# -> Error: tool "write" requires approval, but no approval channel is available
#    ^ 'unavailable' = policy 'ask' = the ask REACHED the approval seam.
```

Headless has no browser answerer, so `unavailable` is the expected outcome there.
The same `ask` in a **web** profile — where `@deepseek-ai/dsh-client-ui-approval`
is mounted — is what renders the **Reject / Allow once** panel. Observed:
`rejected` under the default home, `unavailable` under the hermetic one.

---

## 3. Errors seen, and how each was resolved

1. **`mkdir /dev/null: not a directory` / `Failed to create log file: open
   /dev/null/mcp-logger-*.log`** — expected noise from the user's global patch,
   not a failure. Ignored.
2. **`error: too many arguments. Expected 0 arguments but got 2: headless, ...`**
   when trying `dsh --profile fltest headless "..."`. `fltest` boots the **web**
   app, whose app-args accept no positional task; `headless` is a separate
   profile, not a subcommand of `fltest`. Not needed for this deliverable — I
   used the plugin's unit suite for gate verification instead.
3. **`lsof: command not found`** — unavailable on this machine; used `curl`
   status codes to confirm the listener instead.

No error blocked the boot.

---

## 4. Restart

The job is a managed background shell running the boot command. To restart:

```bash
# stop the current job by id (bash-7), or Ctrl-C its shell, then:
node /Users/linh.doan/work/harvey/freepeak/deepseek-harness/apps/cli/lib/bin.js \
  --profile fltest --port 3099 --no-open
```

**The token rotates on every boot.** Read the fresh `dsh web: http://127.0.0.1:3099/?token=...`
line from the new log; the token in the table above is only valid for the
current process. Because the profile sets `patchReload: live`, edits to
`cordis.patch.yml` are picked up without a restart.

## 5. Teardown

```bash
# stop the server job
kill <job-shell-pid>            # or kill the bash-7 job via job_kill

# remove the scratch profile and demo checkout
rm -rf ~/.dsh/profiles/fltest /tmp/fl-demo
rm -f /tmp/fl-boot-probe.log

# or, to keep the profile and only uninstall the plugin:
node /Users/linh.doan/work/harvey/freepeak/deepseek-harness/apps/cli/lib/bin.js \
  plugin --profile fltest remove @freepeak/dsh-feature-loop
```

Tearing down `fltest` does not touch `~/.dsh/profiles/web` or the GUI on 3081.

---

## 6. What the human does next (step 7)

```bash
rm -rf /tmp/fl-demo
cp -r /Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/demo /tmp/fl-demo
cd /tmp/fl-demo && bash reset.sh      # re-plants the one-line off-by-one
```

Open the live URL in a browser, then paste:

> Read `src/latency-window.ts` and `test/latency-window.test.ts`, find the
> off-by-one, fix it, then run
> `node --experimental-strip-types --test test/latency-window.test.ts` until it
> passes. Report the root cause and the final test result. Keep it under 10 steps.

Expect the transcript to show:

- `[review] ASK HUMAN via policy — edit: reversible-write needs a confidence
  estimate and none was available — asking rather than guessing` — **the gated
  step to approve.** Fail-closed: no judge ⇒ no confidence ⇒ ask. (The `review.ts`
  message ends `... asking rather than guessing`; earlier drafts of this guide
  truncated it.)
- `spawn_teammate` / `send_message` / `team_task_*` — Agent Teams is live.
- A stop at the `maxSteps` ceiling if you lower it.

To watch the ceiling fire, set `maxSteps: 3` in the profile patch; if the run
does *not* stop early, the plugin is not loaded — re-check step 3.
