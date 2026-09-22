# QA-FINAL — re-verification of the fixed setup guide + the Docker path

Verifier: `qa-final` (fresh eyes, no prior context).
Task: `task-7`. Date of run: 2026-09-22.
Host: macOS/arm64, Node **v22.23.2**, pnpm **9.15.9**, Docker **29.5.2**.
Repo: `dsh-feature-loop`. Harness checkout: `deepseek-harness` (CLI `0.1.6-alpha.2`).

Nothing in this pass was taken on trust: every PASS below is backed by a command that
was actually run. Evidence is quoted verbatim. Proposed fixes are **not applied** —
this file is the only thing written.

**Tally: PASS 39 · FAIL 9 · UNTESTED 2** (rows counted once, where the finding first
appears). FAIL-1 … FAIL-4 are SETUP.md defects; FAIL-5, FAIL-6, FAIL-7 land in
`docker/README.md` (they reappear in the §3 table as `FAIL-5`/`FAIL-6`/`FAIL-7`
cross-references, not as new rows); FAIL-8 is RUNBOOK-SERVER.md; FAIL-9 is the settings
template. The narrative repeats the reasoning — it does not add rows.

---

## 1. The six previously-failing checks

| # | Claim (as documented) | How checked | Status | Suggested fix |
|---|---|---|---|---|
| 1 | **Clean-clone build works** — `pnpm install && pnpm build` after copying `src/ package.json tsconfig.json cordis.patch.yml .npmrc` outside the repo | Copied to `/tmp/fl-clean` (outside the repo), ran both | **PASS** | none |
| 2 | Build sizes `30.04 kB` / `42.08 kB` | Same run, raw output | **PASS** | none — exact match |
| 3 | Test counts are 133 (README badge + text, PRD, RUNBOOK), or 126 is explicitly marked as the de-fork-time count | Grepped all four docs; ran the suite | **PASS** — see §4 for the row-by-row table |
| 4 | Gateway-key error is quoted from `src/cli.ts` and says **both** names are accepted | `src/cli.ts:223,236`; compared byte-for-byte with SETUP lines 99–102 | **PASS** |
| 5 | `deepseek-v4-flash` gone from SETUP.md + cordis.patch.yml; the two legitimate occurrences stay | `grep -rn deepseek-v4-flash` across the repo | **PASS** — see §5 |
| 6 | Step 4 handles a **non-empty** patch file (append, not "assume `[]`") | Emulated Step 4 verbatim in a scratch `DSH_HOME`; also reproduced the error the guide warns about | **PASS** |

### Verbatim output — check 1 (clean clone)

```
$ cd /tmp/fl-clean && pnpm install
dependencies:
+ @deepseek-ai/schemastery 3.18.2
devDependencies:
+ tsdown 0.23.0
+ typescript 5.9.3 (7.0.2 is available)
Done in 4s using pnpm v9.15.9
=== INSTALL EXIT: 0 ===
$ pnpm build
ℹ lib/index.mjs         42.08 kB │ gzip: 13.83 kB
ℹ lib/index.d.mts       30.04 kB │ gzip:  9.93 kB
✔ Build complete in 3956ms
=== BUILD EXIT: 0 ===
```

The old failure (`sh: tsdown: command not found`, then `ERR_PNPM_NO_MATCHING_VERSION`
for `@deepseek-ai/cordis@0.4.0`) is gone. `pnpm install` now installs from the public
registry only, and `pnpm build` works from zero. The root-cause fix is in the manifest
itself: `cordis`/`schemastery` are no longer *dev* pins on unpublished workspace
versions (`cordis` is now an optional peer `>=0.4.0`), and `.npmrc`'s
`auto-install-peers=false` keeps the harness-internal peers out of the install.

**But the check does not end there** — the guide's *next* command cannot pass on that
same clean clone. See FAIL-1.

---

## 2. FAILs and the UNTESTED items

| # | Claim | How checked | Status | Suggested fix |
|---|---|---|---|---|
| FAIL-1 | Step 1 verification command prints `feature-loop [ 'agents' ] function`, and "if it throws, stop here" | Ran it in the clean clone and in the repo | **FAIL** | Add "needs the harness packages from your checkout" or move the check after Step 3 |
| FAIL-2 | Step 5: "`feature-loop` appears twice" | Counted rows in `--dump-config`, local + container | **FAIL** | Say the two layers **merge** into one resolved row |
| FAIL-3 | Quick reference `grep -A8 feature-loop` verifies the activation | Compared offset with real output (row is 16 lines) | **FAIL** | Use `-A14`, as Step 5 already does |
| FAIL-4 | "`pnpm install` installs two packages" (SETUP + Dockerfile) | Counted the install: 3 direct, `schemastery` imported at runtime (`src/index.ts:15`) | **FAIL** | Say "the build toolchain and `schemastery`" |
| FAIL-5 | `docker/README.md` ports: log line `0.0.0.0:3099`, "host 3090 maps to container 3099" | Live run: log says `127.0.0.1`, `docker port` says `8099/tcp` | **FAIL** | Two-line edit (`127.0.0.1`; relay `8099`) |
| FAIL-6 | `docker/README.md`: "`npm install` also cannot run inside the plugin checkout" | Ran `npm install` + `npm run build` in a copy | **FAIL** | Delete the paragraph |
| FAIL-7 | `entrypoint.sh`: "Idempotent … changes nothing"; README: "delete `/data/settings.yaml`" | Restarted with the same volume, twice | **FAIL** | Guard on `settings.yaml.imported` too; fix both docs |
| FAIL-8 | RUNBOOK "expect the transcript to show" the review string | Compared with `src/runner.ts:513` + `src/review.ts:140` | **FAIL** | Paste the full string |
| FAIL-9 | `docker/settings.template.yaml:3` says "Rendered with `envsubst`" | `entrypoint.sh:52` uses `sed` (deliberately, and says so) | **FAIL** | Say `sed` |
| UNTESTED-A | The approval panel actually renders | Needs a human click | **UNTESTED** | none — flagged, not claimed |
| UNTESTED-B | `ValidationError: … $.host expected "127.0.0.1" \| "0.0.0.0" but got "172.17.0.4"` | Could not reproduce that boot state | **UNTESTED** | none — flagged, not claimed |

Detail for each follows.

### FAIL-1 — Step 1's verification command cannot pass on a clean clone (first-step blocker)

SETUP.md lines 149–155 tell the reader to run, right after `pnpm install && pnpm build`:

```bash
node -e "import('./lib/index.mjs').then(m => console.log(m.name, m.inject, typeof m.apply))"
# feature-loop [ 'agents' ] function
```
and then: *"If it throws, stop here — nothing downstream will work."*

On a clean clone it **always** throws, because the build deliberately keeps
`@deepseek-ai/*` external and the guide's own Step 1 has just removed those packages
from `node_modules` (`auto-install-peers=false`):

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@deepseek-ai/dsh-llm' imported from /private/tmp/fl-clean/lib/index.mjs
EXIT: 1
```

Run inside the repo (populated `node_modules`) the same command prints the documented
line exactly: `feature-loop [ 'agents' ] function`. So the *build* is fine and the
*documented path is wrong* — and the instruction that follows ("stop here") will send
a compliant reader away from a working build.

**Fix:** either move this check to after Step 3 (inside the profile, where the harness
packages resolve), or keep it in Step 1 with one added sentence — *"this needs the
harness packages from your checkout's `node_modules`; on a clean clone it throws
`ERR_MODULE_NOT_FOUND` by design — a clean exit 0 from `pnpm build` is the build signal."*

### FAIL-2 — "`feature-loop` appears twice" in `--dump-config` is not reproducible

SETUP.md lines 353–356 (Step 5):

> **`feature-loop` appears twice.** Once from the plugin's own bundle patch (defaults,
> no spec) and once from your profile layer. The second wins … Use `-m1` to read only
> the first, or search for `gateMode` …

Reproduced in a scratch `DSH_HOME` (`/tmp/qa-home`, harness CLI 0.1.6-alpha.2), plugin
installed from this repo, then Step 4's patch appended verbatim: the resolved dump has
**one** row. Also one in the container (CLI 0.1.7-alpha.1), before *and* after the
profile layer:

```
=== AFTER patch: row count ===
1
=== grep -A14 -m1 "id: feature-loop" ===
- id: feature-loop
  name: '@freepeak/dsh-feature-loop'
  config:
    reviewBudget: 0.1
    judgeThreshold: 2
    gatePolicies:
      read: auto
      glob: auto
      grep: auto
      edit: auto-if-confident
      write: auto-if-confident
    gateMode: ask
    spec:
```

The bundle row and the profile row share an `id` and the loader resolves them into one
entry, so `-m1` shows the *merged* row (which is why the command works at all).
Harmless but misleading: a reader who goes looking for two rows may conclude their
patch did not land.

**Fix:** reword to *"the plugin's own bundle patch and your profile layer both target
`id: feature-loop`, and the loader merges them into a single resolved row — your
`gateMode`/`spec` values appear on it."* Drop the `-m1`-reads-the-first-row advice.

### FAIL-3 — Step 5 quick reference truncates the row before `gateMode`

Line 601 (`Quick reference`): `... --dump-config | grep -A8 feature-loop`. In the real
output `gateMode` is the **11th** line of the row, so `-A8` cuts it off. The Step 5
command itself uses `-A14` and is correct.

**Fix:** make the quick reference match Step 5 (`-A14`), or grep for `gateMode` explicitly.

### FAIL-4 — Step 1 says `pnpm install` installs "two packages"

SETUP.md lines 124/136–145 and the identical claim in `docker/Dockerfile` lines 26–29.
Actual install: **three** direct packages — `@deepseek-ai/schemastery 3.18.2`,
`tsdown`, `typescript` — and `schemastery` is not a bystander: `src/index.ts:15` does
`import z from '@deepseek-ai/schemastery'`, so it is a real runtime dependency.

**Fix:** "installs the build toolchain and one runtime dependency (`schemastery`); the
`@deepseek-ai/*` packages in `peerDependencies` are supplied by the deployment."

### FAIL-5 — `docker/README.md` documents the wrong ports in two places

| Doc | Says | Reality |
|---|---|---|
| line 18 | "host port **3090** maps to the container's **3099**" | maps to the **relay 8099**; the container's 3099 is loopback-only |
| line 14 | `dsh web: http://0.0.0.0:3099/?token=...` | real log line: `dsh web: http://127.0.0.1:3099/?token=...` |

Everything else in the same file agrees with the code (line 97 `"127.0.0.1:3090:8099"`
and line 192 `8099/tcp -> 127.0.0.1:3090`), so lines 14 and 18 are simply wrong halves
of an otherwise-correct story. Verified live: `docker port dsh-feature-loop` →
`8099/tcp -> 127.0.0.1:3190` on the spare port used for this test, and the container log
printed `http://127.0.0.1:3099/?token=...`.

**Fix:** line 14 → `127.0.0.1`; line 18 → "host port `3090` publishes the container's
relay `8099`, which forwards to the UI on `127.0.0.1:3099`."

### FAIL-6 — `docker/README.md` "npm install cannot run inside the plugin checkout" is stale

Lines 41–44 claim npm aborts because *"its devDependencies pin
`@deepseek-ai/cordis@0.4.0`, which is unpublished"*. There is no such pin any more, and
the claim is contradicted by the repo's own Dockerfile (stage 1 runs `npm install`):

```
$ npm install --no-audit --no-fund      # in a copy of src/ package.json tsconfig.json cordis.patch.yml .npmrc
added 37 packages in 11s
=== NPM INSTALL EXIT: 0 ===
$ npm run build
ℹ lib/index.mjs 42.08 kB  ℹ lib/index.d.mts 30.04 kB  ✔ Build complete
EXIT: 0
```

**Fix:** delete the paragraph (or replace with: *"npm works too; `.npmrc`'s
`auto-install-peers=false` is a pnpm setting npm ignores, but the harness peers are
marked optional so npm does not install them either."*)

### FAIL-7 — `docker/README.md`/`entrypoint.sh` "idempotent" claim; settings are re-rendered every boot

`docker/entrypoint.sh:9` says *"Idempotent: re-running with the same volume changes
nothing"*, and README line 236 tells you to *"delete `/data/settings.yaml` and
restart"*. Observed on restart with the same volume:

```
[entrypoint] profile 'dsh-fl' already present — leaving it untouched
[entrypoint] rendering settings.yaml (preset: workspace-write, so the approval panel works)
```

The profile half *is* idempotent. The settings half is not: the harness imports/renames
the file to `settings.yaml.imported` (that is the only settings file that exists on
disk after first boot), so the entrypoint's `[ ! -f "$DSH_HOME/settings.yaml" ]` guard is
true again on every start and re-renders from the template. A user who edits
`settings.yaml` loses the edit at the next `restart`/`up`.

**Fix:** make the guard `[ ! -f "$DSH_HOME/settings.yaml" ] && [ ! -f "$DSH_HOME/settings.yaml.imported" ]`,
and update README line 236 to name `settings.yaml.imported`.

### FAIL-8 — `docker/README.md` Step-7-adjacent RUNBOOK quote is still the *shortened* message

`docs/RUNBOOK-SERVER.md:365–366` shows:

```
- `[review] ASK HUMAN via policy — edit: reversible-write needs a
  confidence estimate` — **the gated step to approve.**
```

The real message (verified against `src/runner.ts:513` + `src/review.ts:140`, and quoted
correctly in SETUP.md line 432) ends `… needs a confidence estimate and none was
available — asking rather than guessing`. RUNBOOK is presented as *"Expect the transcript
to show"*, so a reader comparing against their transcript sees a mismatch that no longer
exists. This is the same shortened-copy defect this round fixed in SETUP.md.

**Fix:** paste the full string (or mark the `…` as elided).

### FAIL-9 — `docker/settings.template.yaml` says it is rendered with `envsubst`

`docker/settings.template.yaml:3` says *"Rendered with `envsubst`"*, but the entrypoint
substitutes with `sed` (deliberately, per its own comment). One-word fix.

### The two UNTESTED items (UNTESTED-A, UNTESTED-B)

The panel needs a human click; the preset that makes it appear (`workspace-write`) is
pinned and verified, and the composition is verified, but the paint itself was not
observed. Also UNTESTED: the exact rendering of the quoted
`ValidationError: … $.host expected "127.0.0.1" | "0.0.0.0" but got "172.17.0.4"`
(docker/README lines 79–82) — the *other* quoted fence, `--host 0.0.0.0 …`, was
reproduced verbatim (below).

---

## 3. Docker path — claim-by-claim (check 9)

| Claim | How checked | Status |
|---|---|---|
| `docker/README.md` table of pinned versions: CLI `@deepseek-ai/dsh@0.1.7-alpha.1` | `docker run --rm --entrypoint sh … 'dsh --version'` → `0.1.7-alpha.1` | **PASS** |
| Image exists as `dsh-feature-loop:local` | `docker images dsh-feature-loop:local` → present, 374 MB content | **PASS** |
| `docker compose config` validates | `docker compose -f docker/docker-compose.yml config` → exit 0, publishes `127.0.0.1:3090→8099` | **PASS** |
| "What is inside the image" paths | `docker run … 'ls -la /opt/feature-loop /opt/templates /opt/dsh-home/profiles'` → `/opt/feature-loop/{package.json,cordis.patch.yml,lib}`, `/opt/templates/{profile.patch.yml,settings.template.yaml}`, `/opt/dsh-home/profiles/dsh-fl`, `/opt/dsh`, `/usr/local/bin/entrypoint.sh` — all present, entrypoint executable | **PASS** |
| Container boots and serves `401` | Ran on a **spare** port (`DSH_HOST_PORT=3190 docker compose … up -d`), then `curl -o /dev/null -w '%{http_code}' http://127.0.0.1:3190/` → `401`; `docker compose ps` showed `(healthy)` | **PASS** |
| Auth flow token → `303` + `dsh-auth-*` cookie → `200` | `curl -i "http://127.0.0.1:3190/?token=$TOKEN"` → `HTTP/1.1 303 See Other`, `set-cookie: dsh-auth-…`, authority `127.0.0.1:3190` | **PASS** |
| `docker port` → `8099/tcp -> 127.0.0.1:3090` (host loopback only) | `docker port dsh-feature-loop` → `8099/tcp -> 127.0.0.1:3190` (3090 is the default, 3190 the spare port) | **PASS** |
| Composition inside the container: `feature-loop` + `gateMode: ask`, 4 Agent Teams rows, `dsh-client-ui-approval` mounted | `docker exec … 'dsh --profile dsh-fl --dump-config'` → `- id: feature-loop`, `gateMode: ask`, rows `agent-team`, `tool-agent-team`, `ui-agent-team`, `ui-agent-team`, approval UI match ×1 | **PASS** |
| Permission preset `workspace-write` pinned | `docker/settings.template.yaml:33` + boot/health behaviour | **PASS** |
| "The running container needs no npm registry access" | `docker run -d --network none …` → booted fully, printed `dsh web: http://127.0.0.1:3099/?token=…`, no registry/ETARGET errors | **PASS** |
| Build-time composition assertion (line 188) | `Dockerfile:89–91` adds the plugin then pipes `--dump-config` through `grep -q 'feature-loop'`; a broken bundle fails the build | **PASS** |
| No harness-monorepo build; bundles from npm | Dockerfile stages read; runtime image contains no `deepseek-harness` source | **PASS** |
| `--host 0.0.0.0` refusal quoted correctly (lines 74–76) | Ran it: `error: --host 0.0.0.0 is intentionally not supported yet for safety: it would expose remote code execution to the network; use 127.0.0.1 instead` (exit 1) | **PASS** |
| `172.17.0.4` `ValidationError` quote (lines 79–82) | not reproduced | **UNTESTED-B** |
| Log line `http://0.0.0.0:3099/…` (line 14) | real line is `127.0.0.1` | **FAIL-5** |
| "host 3090 maps to the container's 3099" (line 18) | maps to relay 8099 | **FAIL-5** |
| "npm install cannot run inside the plugin checkout" (lines 41–44) | npm install + build both exit 0 | **FAIL-6** |
| Entrypoint "idempotent … changes nothing" | settings re-rendered on every restart | **FAIL-7** |
| `/data` volume = "profile copy, settings, sessions, logs" (line 155) | first boot produced `profiles/`, `settings.yaml.imported`, `.credentials.yaml`, `.anonymous-user-id`, `storages/` — no `logs/` (logs go to stdout) | **PASS** (loose wording) |

Bonus evidence not claimed by the doc: the plugin **inside the image** is
byte-identical to a fresh clean-clone build of the current `src/` and to the repo's
committed `lib/` — `sha256 = a8bc870288a02109a7969e3924d73b677870da0142c313a58659346a895b3e15`
(all three). The image is not stale, and the build is reproducible.

The container, its network and the `docker_dsh-data` volume created for this test were
removed with `docker compose … down -v`; nothing was left running.

---

## 4. Test counts (check 5)

| Claim | Where | Status |
|---|---|---|
| Badge `tests-133 passing` | README.md:8 | **PASS** |
| `# 133 tests, no network, no model call` | README.md:83 | **PASS** |
| `✅ 133 tests` (Phase 0) | README.md:380 | **PASS** |
| `… --test test/*.test.ts   # 133 pass` | README.md:399 | **PASS** |
| `These ≈3,556 lines, with 133 tests` | PRD.md:90 | **PASS** |
| `✅ 133 pass, 0 fail (126 at the time of the de-fork; the plugin tests were added later)` | PRD.md:176 | **PASS** — 126 explicitly scoped to de-fork time |
| `tests 126/126 pass (the count at that time)` / `(then)` | PRD.md:190,195 | **PASS** — labelled as historical |
| `its suite passes 133/133` | RUNBOOK-SERVER.md:172 | **PASS** |
| The suite really is 133 | Ran it: `# tests 133 / # pass 133 / # fail 0` | **PASS** |

No stale unlabelled `126` remains in README/PRD/RUNBOOK/SETUP.

## 5. Model ids (check 4) and catalog consistency

| Claim | How checked | Status |
|---|---|---|
| `deepseek-v4-flash` is gone from `docs/SETUP.md` | `grep -rn deepseek-v4-flash docs/SETUP.md` → no match | **PASS** |
| `deepseek-v4-flash` is gone from `cordis.patch.yml` | `grep -rn` on the file → no match; the commented ladder uses `deepseek-flash` + `deepseek-v4-pro` under `deepseek-official` | **PASS** |
| The two legitimate occurrences are present and unflagged | `docker/settings.template.yaml:43` (`onegw` catalog), `docs/QA-SETUP.md:48` (historical finding) | **PASS** |
| `docker/profile.patch.yml` ids agree with `settings.template.yaml` | `provider: onegw` / `opencode/deepseek-v4.1-flash` in both | **PASS** |

Observation, not a FAIL: `test/budget.test.ts` uses `deepseek/deepseek-v4-flash`
repeatedly (lines 15, 23, 73, 80, 84, 96, 164–176). That is an invented fixture id under
an invented `deepseek/` provider used to drive the price/spend math, not a claim about
the `deepseek-official` catalog — but it is the same string the previous pass flagged, so
a "yes, on purpose" note in that file would save the next verifier the same double-take.

## 6. Things checked and found genuinely correct (worth keeping)

| Claim | How checked | Status |
|---|---|---|
| Gateway-key error (check 3) | SETUP lines 99–102 vs `src/cli.ts:236–237` — identical, including the wrap; `resolveApiKey()` (`src/cli.ts:223`) accepts **both** names | **PASS** |
| Step 4 on a non-empty patch (check 6) | Deleted the template's `[]`, appended the block, `--dump-config` resolved; the guide's YAML reasoning is correct | **PASS** |
| The error Step 4 warns about is real | Ran it: `dsh: failed to parse overlay /tmp/bad-patch.yml: YAMLException: end of the stream or a document separator is expected (2:1)` | **PASS** |
| Step 5's Agent Teams grep | Prints exactly `ui-agent-team`, `agent-team`, `tool-agent-team` as documented; bundles in `dsh.profile.bundles` resolve without a separate profile install | **PASS** |
| Step 7's review string (check 8) | SETUP.md:432 is complete and exact vs `src/runner.ts:513` + `src/review.ts:140` (RUNBOOK still shortens it — FAIL-8) | **PASS** |
| Step 3's expected output shape | Reproduced: `dependencies:` / `+ @freepeak/dsh-feature-loop 0.1.0` | **PASS** |

---

## Top 3 remaining issues

1. **FAIL-1 — SETUP.md Step 1's verification command cannot pass on a clean clone**
   (`ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-llm'`), and the text
   right after it says "stop here". The build itself now works; the check is the last
   remnant of the old clean-clone failure and it is placed where it cannot run.
2. **FAIL-5 — `docker/README.md` documents the wrong ports** (`0.0.0.0` instead of
   `127.0.0.1` for the log line; "3090 maps to 3099" instead of the relay `8099`). Two
   one-line edits, and they are on the first screen a Docker user reads.
3. **FAIL-6 — `docker/README.md` says `npm install` cannot run in the plugin checkout.**
   It does: 37 packages, then a build whose sizes match the doc exactly — and the repo's
   own Dockerfile runs that install on every image build.

Runner-up worth folding into the same edit pass: **FAIL-7** (settings are re-rendered on
every restart, so an edited `settings.yaml` is silently replaced) and **FAIL-2** (the
"appears twice" claim).

## Method / artifacts

- Clean clone: `/tmp/fl-clean` (pnpm) and `/tmp/fl-npm` (npm) — copies of
  `src/ package.json tsconfig.json cordis.patch.yml .npmrc`, both outside the repo.
  The real repo was never installed into or built into.
- Local harness profile used for the `--dump-config` checks: `/tmp/qa-home`
  (`DSH_HOME` override; `~/.dsh` was not written to).
- Docker: container `dsh-feature-loop` on spare host port **3190** only, with
  `--cpus=2 --memory=4g`; removed afterwards along with `docker_dsh-data` and the
  `docker_default` network.
- Ports 3081/3096/3097/3099 and `~/.dsh/settings.yaml` / `~/.dsh/profiles/*` were not
  touched.
- Only file written in the repo: `docs/QA-FINAL.md`.
