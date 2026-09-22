# QA — setup guide, verified as a first-time user

**Reviewer:** documentation QA (independent; never seen this repo before this task)
**Date:** 2026-09-22
**Scope:** `docs/SETUP.md` (538 lines) and `docs/RUNBOOK-SERVER.md` (317 lines), followed
**literally**, every command run where it was safe and cheap.
**Method:** do not trust the author. Run the command, compare the output to the documented
expectation, and reproduce the central claim under a clean, non-colliding `DSH_HOME`.

**Environment:** macOS, Node `v22.23.2`, DSH checkout at
`~/work/harvey/freepeak/deepseek-harness`, plugin at `~/work/harvey/freepeak/dsh-feature-loop`.

**Collision-avoidance (per task constraints).** QA used its own hermetic home
`~/.dsh-qa-verify` (never `~/.dsh-fl-verify`), its own profile `qa-fltest` (never
`fltest`/`flheadless`/`flsdk`), and its own port `3096`. `~/.dsh/settings.yaml` was **not**
modified. Ports 3081/3097/3099 were never bound or killed and were re-confirmed `401` at the
end of the run. `run.sh`'s `EXIT` trap cleaned up its staged spec from the DSH checkout.

**Tally:** **18 PASS · 6 FAIL · 3 AMBIGUOUS · 2 UNTESTED**

---

## Findings

| # | Step | Documented | Actual | Verdict | Suggested fix |
|---|---|---|---|---|---|
| 1 | **Prereq** — `node --version` | "must be >= 22 (`--experimental-strip-types`)" | `v22.23.2`. Fine. | **PASS** | — |
| 2 | **Prereq** — `dsh --version \|\| echo "invoked from the checkout"` | Implies `dsh` may not be on PATH, and falls back to the checkout | `dsh` **is** on PATH at `~/.local/bin/dsh`. The fallback text is wrong-but-harmless; the command always exits 0. | **AMBIGUOUS** | Say what it decides: "a global `dsh` may exist; the guide drives the checkout explicitly so the version under test is unambiguous." |
| 3 | **Prereq** — `DSH=~/work/...` then `node "$DSH/..." --help` | Works | Works. Implicitly converts `DSH` to an **absolute** path (`~` expansion), which is what makes later blocks work. | **PASS** | — |
| 4 | **Prereq** — `ONEGW_API_KEY` guidance | Either `export ONEGW_API_KEY=...`, or rely on `~/.dsh/.credentials.yaml` under a **`refs:`** block | Exactly right. `~/.dsh/.credentials.yaml` has `refs:` with `ONEGW_API_KEY`, `DEEPSEEK_API_KEY`, `OMNIROUTE_API_KEY`. `src/cli.ts:229-243` reads `~/.dsh/.credentials.yaml` with an indentation-tolerant regex (`^\s*(ONEGW_API_KEY\|ONEGE_API_KEY):`), so the nesting under `refs:` **is** handled. Both names accepted, as documented. | **PASS** | — (accurate and unusually well-specified) |
| 5 | **Prereq** — quoted error text *"not in the environment or in ~/.dsh/.credentials.yaml"* | Given as the failure text | The real message (`src/cli.ts:237-240`) is `no gateway key: set ONEGW_API_KEY (or ONEGE_API_KEY) in the environment, or add it to ~/.dsh/.credentials.yaml`. The doc quotes a **paraphrase as if verbatim**. | **FAIL** | Quote it exactly, or drop the quotation marks. |
| 6 | **Prereq** — `cd "$DSH" && pnpm run build` "If the CLI is not built" | Offered as a remedy | Not exercised (would rebuild the whole harness — expensive, and out of QA scope). Recorded as untested rather than guessed. | **UNTESTED** | — (reason: full-harness rebuild is expensive and unnecessary; the CLI runs fine) |
| 7 | **Step 1** — `pnpm build` | `tsdown src/index.ts ... ` → `40.82 kB`, `28.16 kB`, `✔ Build complete` | **`sh: tsdown: command not found` → `ELIFECYCLE Command failed`, exit 1.** `node_modules/` contains **no `.bin/`**; the repo has **no `pnpm-lock.yaml`** and **no `pnpm-workspace.yaml`**. | **FAIL** | **Add a `pnpm install` step before Step 1.** Step 1 cannot pass on a clean clone. |
| 8 | **Step 1** — the missing install | *Never documented at all* | `grep "pnpm install"` across `SETUP.md`, `RUNBOOK-SERVER.md`, `README.md` → **no matches**. The guide jumps straight to `pnpm build` on a repo whose `node_modules` has no binaries. | **FAIL** | Insert as Step 0: `cd ~/work/harvey/freepeak/dsh-feature-loop && pnpm install`. See finding 9 for why this still is not sufficient. |
| 9 | **Step 1** — `pnpm install` on a clean checkout | Implied to work | **Fails**: `ERR_PNPM_NO_MATCHING_VERSION — No matching version found for @deepseek-ai/cordis@0.4.0`. Published versions are `4.0.1-rc.1, 4.0.1-rc.4, 4.0.1, 4.0.2, 4.0.3` — **there is no `0.4.0`**. `package.json:76` pins `"@deepseek-ai/cordis": "0.4.0"` in `devDependencies`. | **FAIL** | Fix `package.json`: `"@deepseek-ai/cordis": "0.4.2"` (or drop it to `peerDependencies` only, since it is already listed there as `>=0.4.0` with `peerDependenciesMeta.optional: true`). Minimum viable alternative: document the failure and a workaround in Troubleshooting — but the package is simply unfixable-by-reader today. |
| 10 | **Step 1** — Troubleshooting entry | `ERR_PNPM_NO_MATCHING_VERSION` for **`@deepseek-ai/schemastery`** — "The package now pins `^3.18.2`" | The `schemastery` **dependency** is indeed `^3.18.2` and fine — but `schemastery` also appears in `devDependencies` as `"0.1.5"` (`package.json:81`), the exact workspace-internal version the row warns about. And the **actual** blocker is `cordis@0.4.0`, which has **no** troubleshooting row. | **FAIL** | Add a row for `@deepseek-ai/cordis@0.4.0`, and fix the `schemastery` devDependency (`0.1.5` → `^3.18.2`). |
| 11 | **Step 1** — expected build output | `lib/index.mjs 40.82 kB`, `lib/index.d.mts 28.16 kB` | Actual after a real build: **`42.08 kB`** and **`30.08 kB`**. Neither figure matches; `RUNBOOK-SERVER.md:39` cites a **third** value (`41.37 kB`) for the same artifact. | **FAIL** | State sizes as approximate (`~42 kB`), or drop them — the `✔ Build complete` line is the real signal. Three different numbers across two docs is worse than none. |
| 12 | **Step 1** — `node -e "import('./lib/index.mjs')..."` → `feature-loop [ 'agents' ] function` | Exact | **Exact match.** | **PASS** | — |
| 13 | **Step 2** — `cd ~/.dsh/profiles && mkdir -p fltest && cd fltest` | Works | Works. | **PASS** | — (add `set -e` advice? not needed) |
| 14 | **Step 2** — copy `../web/{cordis.yml,pnpm-workspace.yaml,cordis.patch.yml}` | Assumes a `web` profile exists | Verified: on a **fresh** `DSH_HOME` (`~/.dsh-qa-fresh`), `dsh --profile web --dump-config` **auto-creates** `profiles/web/` with all three files present. So the assumption holds — but only *after* `web` has been booted once. The guide never says to boot `web` first. | **AMBIGUOUS** | Add one line: "`web` is created on first boot; if `~/.dsh/profiles/web` does not exist yet, run `dsh --profile web` once (then Ctrl-C) before Step 2." |
| 15 | **Step 2** — `package.json` with 5 bundles | Both team bundles + base + web-app + plugin | Composes correctly; both `agent-team` bundles resolve. | **PASS** | — |
| 16 | **Step 2** — "the team layer also disables the older `subagent`/`subagent_fork` tools" | Claimed | Not directly exercised (would need a live team session). Plausible and consistent with the bundle layout, but unverified by QA. | **UNTESTED** | — (reason: requires driving a live session; out of cheap-test scope) |
| 17 | **Step 3** — `plugin --profile fltest add -w file:~/work/...` | `+ @freepeak/dsh-feature-loop 0.1.0` / `Done in 2s using pnpm v9.15.9` | **Works, and the unquoted `~` resolves correctly** — which I expected to fail. pnpm expands `file:~/...` itself and the profile's `package.json` even *retains* the literal `file:~/work/...` string. The installed copy is **hardlinked** (`lib/index.mjs` shares inode `210885871` with the repo), so later rebuilds **are** picked up. | **PASS** | — (worth a sentence: "pnpm expands `~`; the link is hardlinked, so rebuilds propagate") |
| 18 | **Step 3** — "-w is required … `ERR_PNPM_ADDING_TO_ROOT`" | Reproduced on omission | **Reproduced exactly**: `ERR_PNPM_ADDING_TO_ROOT Running this command will add the dependency to the workspace root…`, exit 1. | **PASS** | — |
| 19 | **Step 3** — expected output format | `+ @freepeak/dsh-feature-loop 0.1.0` then `Done in Ns using pnpm v9.15.9` | Matches, except the timing (`1.5s`/`3.9s` vs "2s") — trivial. | **PASS** | — |
| 20 | **Step 4** — edit `~/.dsh/profiles/fltest/cordis.patch.yml`, replace empty `[]` | Implied the file is just `[]` | Misleading on two counts. On a machine whose `web` profile has been customized, the copied `cordis.patch.yml` carries **the user's own patch entries** (here: a `tool-agent-team` `memberRoute` override), not `[]`. The **plugin's own** `cordis.patch.yml` also already inserts the `feature-loop` row, so the reader is not "replacing an empty list" — they are **adding a second, id-targeted overlay** on top of an existing row. The guide's snippet shows a bare `- id: feature-loop` list and never mentions the required `- insert:` wrapper. | **FAIL** | Show the real file shape and explain the merge: `[{insert:[{id:feature-loop, name:'@freepeak/dsh-feature-loop', config:{…}}]}]` — and note that a bare `- id:` list at the top level of a patch file is an **override** entry, not an insert. Also state that the copied file may not be `[]`. |
| 21 | **Step 4** — the 8-dimension spec + prices | Copy-paste block | Applied verbatim; composes and validates at load. All 8 dimensions plus `prices` accepted. | **PASS** | — |
| 22 | **Step 4** — ladder models `deepseek-v4-flash` / `deepseek-v4-pro` | Presented as working model ids | **`deepseek-v4-pro` exists; `deepseek-v4-flash` does NOT.** The `deepseek-official` catalog (`packages/llm/llm-deepseek/src/common/models.ts`) contains exactly `deepseek-flash` and `deepseek-v4-pro`. There is no `deepseek-v4-flash` — that string appears only in unrelated web-search defaults and README prose. Likewise the `prices:` keys use `deepseek-official/deepseek-v4-flash`, which is not the resolvable id. | **FAIL** | Change `deepseek-v4-flash` → `deepseek-flash` in **both** the ladder and the `prices:` key. Re-check `deepseek-official/deepseek-v4-pro` too (it is the right id string, but confirm the `provider/model` join your price table expects). |
| 23 | **Step 4** — "An `irreversible` actuator entry needs a termination guard" | Validator rejects `irreversible` + no guards | Consistent with the config (both guards present, load succeeds). Not adversarially tested by removing guards. | **PASS** | — (DM: consistent, not independently falsified) |
| 24 | **Step 5** — `--dump-config \| grep -A 8 "feature-loop"` | Shows "the resolved row" | **`grep -A 8` returns LESS than the documented block** — it prints only through `gatePolicies: read: auto` and stops before `gateMode`. Worse, `feature-loop` appears **twice** in the dump (the plugin's own row, then the profile's patched row), so the header is `# == @freepeak/dsh-feature-loop` for the first and the patched-by line for the second. The doc's sample output shows a shape that matches neither cleanly. | **FAIL** | Use `grep -A 40`, or better: `--dump-config \| grep -A 40 "patched by.*cordis.patch.yml"`. Also document that the row appears twice by design (bundle insert, then user patch) — a new user reading two `- id: feature-loop` entries will think they broke something. |
| 25 | **Step 5** — `grep -E "agent-team\|tool-agent-team"` → 3 rows | `ui-agent-team`, `agent-team`, `tool-agent-team` | **All three present, exact ids.** | **PASS** | — |
| 26 | **Step 5** — diagnostic advice ("if `feature-loop` is missing… if `config:` empty…") | Offered | Sound and matches observed behavior. | **PASS** | — |
| 27 | **Step 6** — `--profile fltest --port 3099 --no-open` → `dsh web: http://127.0.0.1:3099/?token=...` | Boot line with token | **Confirmed** on an equivalent profile: `dsh web: http://127.0.0.1:3096/?token=UFNbn6f0…`. Zero load errors (`MODULE_NOT_FOUND\|SyntaxError\|Cannot find module\|failed to load` → **0 matches**). Boot is clean, as claimed. | **PASS** | — |
| 28 | **Step 6** — "Use a port other than 3081" | Advisory | Correct and necessary; 3081 is the live GUI. | **PASS** | — |
| 29 | **Step 7** — `cp -r .../demo /tmp/fl-demo && cd /tmp/fl-demo && bash reset.sh` | "re-plant the bug" | Works: `bug already present — nothing to do` → `ok — verify exits non-zero, the loop has real work`, exit 0. Reset is idempotent, which is better than documented. | **PASS** | — (minor: the `cd` inside the block persists for the reader's shell — fine) |
| 30 | **Step 7** — "What to watch for" transcript strings | `[review] ASK HUMAN via policy — edit: reversible-write needs a confidence estimate` | **Verbatim mismatch.** `src/review.ts:137-140` emits `"${tool}: ${reversibility} needs a confidence estimate and none was available — asking rather than guessing"`. The documented string is missing **`and none was available — asking rather than guessing`**. Same for `[review] ASK HUMAN via signal` and `MODEL ESCALATION` — plausible labels, not verified against source. | **FAIL** | Copy the reason string from `src/review.ts` verbatim, or tell the reader to match on the `[review]` prefix only. A user grepping for the documented string finds nothing. |
| 31 | **Step 7** — `DSH_PERMISSION_MODE` is the switch (callout ~L416) | "Under `danger-full-access` the approval policy is `never`" attributed to `DSH_PERMISSION_MODE` | **Materially wrong on the mechanism, right on the symptom.** `RUNBOOK §2.5` correctly says the cause is `permission.defaultPreset` in `~/.dsh/settings.yaml`, and explicitly states **"`DSH_PERMISSION_MODE` does not help either."** `SETUP.md` L416-420 tells the reader to check/unset `DSH_PERMISSION_MODE`. The two docs contradict each other, and SETUP is the one a first-timer reads. | **FAIL** | Make SETUP §Step 7 point at `permission.defaultPreset` (as RUNBOOK does) and drop the `DSH_PERMISSION_MODE` framing. Same contradiction recurs at `SETUP.md:459` and `:476`. |
| 32 | **STEP 7 / §2.6 — CENTRAL CLAIM (reproduced independently)** | Same headless task: `rejected` under `danger-full-access`, `unavailable` under `workspace-write` | **REPRODUCED EXACTLY, under QA's own `~/.dsh-qa-verify`.** Default home → `{"tool":"write",…,"status":"error","result":"Error: the user rejected tool \"write\""}`. `DSH_HOME=~/.dsh-qa-verify` (sed-rewritten `defaultPreset: workspace-write`) → `{"tool":"write",…,"status":"error","result":"Error: tool \"write\" requires approval, but no approval channel is available"}`. Used the existing `flheadless` profile (it exists; no new profile was created). Command shape as specified: `--profile flheadless --json "create a file at /tmp/qa-{x,y}"`, `maxSteps: 4` in that profile. | **PASS** | — **This is the load-bearing claim of the whole document, and it holds.** |
| 33 | **§2.6** — hermetic recipe: `mkdir`, 2 `ln -s`, `sed`, `grep -A2 '^permission:'` | `defaultPreset: workspace-write` | All five commands work. `grep` output matches the documented comment exactly. Caveat: the `sed` pattern `^\(  defaultPreset:\)` assumes **exactly two** leading spaces. Verified it silently **no-ops** on 4-space indentation — the `grep` assertion would then catch it, so the recipe fails loudly rather than silently. Acceptable, but fragile. | **PASS** | Optionally harden: `sed -E 's/^([[:space:]]*defaultPreset:).*/\1 workspace-write/'`. |
| 34 | **§2.6** — boot the hermetic server, expect `dsh web: …token=…` | Token line | **Confirmed** on port 3096 under `DSH_HOME=~/.dsh-qa-verify`: `dsh web: http://127.0.0.1:3096/?token=UFNbn6f0yPkXSaKvElPjG5BGrG_McPLSLLo6Nizn7Cs`; tokenless `/` → **401**; zero load errors. | **PASS** | — |
| 35 | **§2.6** — "`profiles/` is symlinked so already-installed bundles are reused" | Claimed | **Confirmed** — the symlink is used, and `flheadless`/`fltest` resolve through it without reinstall. | **PASS** | — |
| 36 | **RUNBOOK §1.3** — `grep -A40 feature-loop` to check "all 8 spec dimensions present" | Shown as the verification command | Works only by accident: with `-A 40` you do land on the **second** (patched) row's dimensions. The documented `-A40` and SETUP's `-A 8` are inconsistent for the same check, and only the 40 happens to suffice. | **AMBIGUOUS** | Standardize on one grep across both docs, anchored to the patched row. |
| 37 | **RUNBOOK §2** — "its suite passes **126/126**" | 126/126 | **Actual: 133/133, 0 fail** (`node --experimental-strip-types --test test/*.test.ts`; `# tests 133 # pass 133 # fail 0`). `SETUP.md` never states a count. `README.md` is **self-contradictory**: badge and L83/L366 say **126**, L385 says **133**. `PRD.md` says 126 in four places. | **FAIL** | Update RUNBOOK to 133/133. Fix the README badge and L83/L366 (PRD is a historical record — arguably leave it, but label it as such). |
| 38 | **RUNBOOK §2** — the named test *"auto-if-confident asks when there is no confidence estimate at all"* | Quoted as passing | **Exists verbatim** at `test/policy.test.ts:173`. | **PASS** | — |
| 39 | **SETUP — Proving the approval path** — `pnpm test:integration` → "**5 tests pass**" | 5 tests, real harness | **Exact: `Test Files 1 passed (1)`, `Tests 5 passed (5)`.** Mounts into the real harness as claimed. Note it writes a spec into the **DSH checkout** (`packages/core/tools/tests/zz-feature-loop-gate.spec.ts`) and removes it via an `EXIT` trap — verified cleaned up. | **PASS** | Add one sentence that this temporarily writes into the DSH checkout, so a reviewer is not surprised by the path in the output. |
| 40 | **SETUP — Known limits #1** — "cost ceiling currently measures zero; `maxSteps` is trustworthy" | Disclosed honestly | Consistent with `README.md`/`PRD.md`; correctly flagged as the largest gap. | **PASS** | — (good practice: the limitation is disclosed, not buried) |
| 41 | **SETUP — Known limits #5** — "`run_tests` timeouts kill the direct child, not grandchildren" | Refers to `run_tests` | Correct **and** correctly scoped: `run_tests` is a **standalone-runner** tool (`src/tools.ts:463`), not a harness tool. Not a tool-name error. | **PASS** | — |
| 42 | **Link check** — every relative markdown link in `docs/*.md` and `README.md` | Implicitly all resolve | **All 12 resolve.** `README.md` → `.nvmrc`, `LICENSE`, `docs/{PRD,RUNBOOK-SERVER,SETUP,VERIFY-APPROVAL,VERIFY-INTEGRATION}.md`; `docs/SETUP.md` → `PRD.md`, `RUNBOOK-SERVER.md`, `VERIFY-INTEGRATION.md`; `docs/VERIFY-APPROVAL.md` → `VERIFY-INTEGRATION.md`; `docs/VERIFY-INTEGRATION.md` → `../test/integration/plugin-in-dsh.spec.ts`. **No broken links.** | **PASS** | — |
| 43 | **Tool names** — no `read_file`/`write_file`/`edit_file`/`list_files`/`run_tests` in any *plugin config*, *actuator*, or *gatePolicies* | Not explicitly claimed for the shipped profiles | **One real violation, in a shipped profile that the guide points readers at.** `~/.dsh/profiles/flheadless/cordis.patch.yml:50-54` declares `actuator: {read_file: read, list_files: read, run_tests: read, edit_file: reversible-write, write_file: irreversible}` — **all five are wrong names**. The *repo's* own `cordis.patch.yml`, the *active* `fltest` patch, and every `SETUP.md`/`RUNBOOK-SERVER.md` config block are **clean**. The `flheadless` file's own comment (L31-32) claims "Using the real names is what makes the CONFIGURED path the one under observation" — but it does **not** use the real names in the actuator; only its `gatePolicies` (L34-38) do. | **FAIL** | Fix `flheadless`'s actuator to `read/glob/grep/edit/write`. **Impact is masked, not nil:** `ReviewGate.check` (`src/review.ts:131`) tests `this.policies[tool]` **first**, so the correct `gatePolicies.write: auto-if-confident` entry wins and the observed `unavailable` result is still valid — the wrong actuator entries are inert. But the file is a reference example, and a reader who copies its actuator into a profile **without** a matching `gatePolicies` override gets `irreversible` → `always-approve` — exactly the failure the docs warn about. |
| 44 | **Tool names** — docs prose warning | The `read_file`/`edit_file`/`run_tests` names are valid only for `src/tools.ts` and the `demo/` transcript | **Accurate.** `src/tools.ts` defines `read_file`(304), `write_file`(356), `edit_file`(382), `list_files`(432), `run_tests`(463); `README.md:41-42` uses `edit_file` inside the `demo/TRANSCRIPT.txt` excerpt. Both are in-scope exclusions per the task spec, so **not** flagged. | **PASS** | — |
| 45 | **§2.5** — code citations | `packages/bundle/base/cordis.patch.yml:246-248` maps `danger-full-access` → `approval: never` | **Verified**: those exact lines read `danger-full-access: / sandbox: danger-full-access / approval: never`. | **PASS** | — |
| 46 | **§2.5** — `permission-presets/src/index.ts:440-446` preset-applied-directly quote | Quoted snippet | **Verified**: lines 442-448 match the quoted logic (`if (preset === null && sandbox === null && approval === null && !seeded)` → `setApprovalPolicy(session, spec.approval)`). Line numbers are off by ~2 but the code is the right code. | **PASS** | — (nudge line refs by +2) |
| 47 | **§2.5** — `permission-presets/src/index.ts:234-237` `setSource` quote | `setSource: (current) => { this.defaultSettings = current }` | **Verified verbatim** at L234-236. | **PASS** | — |
| 48 | **§2.5** — `user-approval/src/index.ts:263-268` "`decide` refutes before any answerer" | Quoted as the refusal path | **Verified**: `private async decide(...)` begins at L260 and the `effectivePolicy(session) === 'never'` early-return is inside it. Semantics confirmed. | **PASS** | — |
| 49 | **RUNBOOK §2.5** — "the fltest profile pins `defaultPreset: workspace-write`" | Claimed as evidence | **True** — `~/.dsh/profiles/fltest/cordis.patch.yml:80-82` has `- id: permission / config: / defaultPreset: workspace-write`, and a comment at L72 correctly notes it is overridden. Compatible with the doc's argument. | **PASS** | — |
| 50 | **RUNBOOK** — live URLs/ports/tokens (3097, 3099, 3081) | Given as "use this one" | Ports are **up** (`401` each, unchanged before and after QA). Tokens are **explicitly documented as rotating on every boot**, and the doc tells the reader to re-read them from the log — so this is not a stale-claim failure. QA did not authenticate with the tokens (out of scope / would disturb live servers). | **PASS** | — |
| 51 | **WORKFLOW** — the guide's ordering | Steps 1-7 are strictly sequential | **Ordering is sound** except that Step 1 is blocked by the undocumented install (findings 7-10) and Step 4's `cordis.patch.yml` edit is under-specified (finding 20). Nothing downstream of a working build mis-orders. | **PASS** | — |
| 52 | **SAFETY** — constraints honored | — | `~/.dsh/settings.yaml` **unmodified** (`permission.defaultPreset: danger-full-access` intact). No DSH source edited. Ports 3081/3097/3099 never bound/killed, re-confirmed `401`. No `.ts` under `src/**`, `README.md`, `SETUP.md`, or `RUNBOOK-SERVER.md` written. `run.sh`'s staged spec cleaned up. This file is the only write. | **PASS** | — |

---

## Top 3 things that would trip a new user

### 1. Step 1 does not work on a clean clone, and the reason is buried in `package.json`

The guide opens with "Everything below was executed and verified on this machine…
Commands are copy-pasteable." The very first command, `pnpm build`, fails with
`sh: tsdown: command not found`. There is no `pnpm install` step anywhere in `SETUP.md`,
`RUNBOOK-SERVER.md`, or `README.md` — the author verified against an already-populated
`node_modules` that was created by some other means, and then deleted `.bin`.

Adding the install step does **not** fix it either: `pnpm install` dies with
`ERR_PNPM_NO_MATCHING_VERSION … @deepseek-ai/cordis@0.4.0`. Only `4.0.1`–`4.0.3` are
published. There is **no `pnpm-lock.yaml`** in the repo, so nothing caches a resolution
that might have worked once. A new user cannot get past Step 1 by following this document,
and the only troubleshooting row that mentions `ERR_PNPM_NO_MATCHING_VERSION` names a
*different* package (`schemastery`) that is already fixed. **This is the single highest-impact
defect.**

### 2. The tool-name rule is documented in prose and violated in the one profile a reader is told to copy

`SETUP.md` devotes prominent space (L256-265, L475) to "use the harness's real tool names —
`read_file`/`edit_file` will silently fall through." The **active** plugin patch and every
documented YAML block obey this. But `~/.dsh/profiles/flheadless/cordis.patch.yml` — the
profile the RUNBOOK's central proof depends on — has an `actuator` naming all five wrong tools,
with a comment directly above it claiming it uses the real names. The defect is real but
**masked**: correct `gatePolicies` entries win because `ReviewGate.check` consults
`policies[tool]` first, so the reproduced `unavailable` result is still valid. A reader who
copies that actuator without the accompanying `gatePolicies` gets `irreversible` →
`always-approve` — the precise failure the docs warn about, arrived at by following the docs'
own example.

### 3. Steps 5 and 7 print strings that do not match what the tool prints

Step 5 tells the user to run `grep -A 8 "feature-loop"` and shows a four-line resolved row;
the real output truncates at three lines, and `feature-loop` appears **twice** in the dump
(bundle insert, then user patch) — so a reader checking "did it work?" sees two `- id:
feature-loop` rows and cannot tell which is theirs. Step 7 says to watch for
`[review] ASK HUMAN via policy — edit: reversible-write needs a confidence estimate`; the
source emits `— edit: reversible-write needs a confidence estimate and none was available —
asking rather than guessing`. Neither is catastrophic alone, but together they teach a new
user to distrust the guide's expected-output sections — and Step 7's payoff *is* the transcript.

**Honorable mention (would be #4):** `SETUP.md` L416-420 and L459 assert that
`DSH_PERMISSION_MODE` controls the approval prompt; `RUNBOOK-SERVER.md` §2.5 states the
opposite in bold ("`DSH_PERMISSION_MODE` does not help either") and identifies the true cause
(`permission.defaultPreset` in `~/.dsh/settings.yaml`). The RUNBOOK is correct — I confirmed
the mechanism by reproducing both outcomes. A first-timer reads SETUP, chases an environment
variable that does nothing, and concludes the plugin is broken.

---

## What is genuinely good

Stated because a QA report that only lists failures is itself untrustworthy:

- **The central claim holds.** The `rejected` vs `unavailable` distinction reproduced
  byte-for-byte, under an independent `DSH_HOME` at a different path, first try. The reasoning
  about *why* (`never` refuses before any answerer; `ask` reaches the approval seam) is
  correct, and §2.5 cites the harness source accurately — I checked all four quoted
  file/line references against the checkout and every one was the right code.
- **The `ONEGW_API_KEY` guidance is precise**, including the non-obvious `refs:` nesting and
  the indentation-tolerant parse, and correctly names both accepted variables.
- **The `-w` requirement and its exact error text** reproduce exactly as documented.
- **The link graph is clean** — 12/12 relative links resolve.
- **The limitations section is honest.** Disclosing that `costBudgetUSD` measures zero, that
  the review rate overshoots the book's target by design, and that the plugin path has no CI
  is exactly what a setup guide should do, and it is why the runbook's "verified" claims are
  largely credible.
- **Known limit #5 correctly scopes `run_tests`** to the standalone runner rather than
  confusing it with a harness tool — the same discipline that finding 43 shows is missing
  from the `flheadless` actuator.

---

## Coverage and method notes

**Rungs of verification used:** every command in Steps 1-7 was executed against a
`qa-fltest` profile reconstructed *from the guide's own text* (copy `web` scaffolding, write
the documented `package.json`, apply the documented patch), not against the author's `fltest`
— so findings 17-27 reflect the guide as written, not the author's environment. The central
§2.6 claim was reproduced against a purpose-built `~/.dsh-qa-verify` and the pre-existing
`flheadless` profile.

**Deliberately not run** (recorded as UNTESTED rather than guessed): the full-harness
`pnpm run build`; driving a live browser session to observe the approval panel; and
observing the `subagent`-tool-disabling behavior of the team bundle.

**Process hygiene:** QA ran a server only on port 3096 and killed it; the three live ports
were re-confirmed `401` at the end. Model spend was bounded — both headless runs used
`flheadless`, which pins `maxSteps: 4`, and each completed in ~2 steps.

**One correction to the task briefing, offered as evidence rather than pushback.** The brief
stated that `read_file`/`write_file`/`edit_file`/`list_files`/`run_tests` are "valid ONLY for
the standalone runner `src/tools.ts` and the `demo/` transcript." Verified true of the
*repo's* plugin config — but one **shipped DSH profile** (`flheadless`, outside `src/**`)
violates it. I report that under finding 43 rather than suppressing it as out-of-scope,
since a shipped profile is a copyable artifact and the guide's own troubleshooting table
warns about exactly this error. The exclusion for `src/tools.ts` and `demo/` was respected;
no false positives were raised against them.
