# HANDOFF — read this first in a new session

Written 2026-09-22 at the end of the session that de-forked this plugin, added
human approval, containerised it, and verified it end to end in a browser.

**Everything below is true on this machine and on no other.** Read "State of the
repo" before you do anything.

---

## 1. State of the repo — the single most important fact

**Two sessions of work sit on an open PR; the newest session's work sits
uncommitted in the working tree.**

- `origin/main` is at `ea48b03` (PR #8, the de-fork) — **nothing after it is
  merged**.
- Branch `feat/human-approval-and-docker` holds the approval + Docker session's
  work, committed and pushed (`04326cd`, `2f93906`) as **PR #9 (open)**.
- **The approval dashboard work is UNCOMMITTED**: 13 paths (9 modified + 4 new)
  — `src/dashboard.ts`, `src/dashboard-page.ts`, `test/dashboard.test.ts`,
  `docs/VERIFY-DASHBOARD.md`, plus wiring in `src/plugin.ts` / `src/index.ts`,
  deployment config (compose, profile patch, cordis patch, Makefile, ci.yml)
  and doc updates. If this machine is lost, so is the dashboard.

```bash
cd dsh-feature-loop
git log --oneline origin/main -1     # ea48b03
git status --short | wc -l           # 13
```

On a fresh clone of `origin/main` you would get **none** of it: no approval
panel, no Docker path, no dashboard, no runbook, and `pnpm install` would still
fail on the unpublished `@deepseek-ai/cordis@0.4.0`.

Commit/PR plan for the uncommitted dashboard set: [`todo.md`](todo.md) §"Not yet
committed".

---

## 2. What exists, and where to read it

Start with whichever question you have; every file below is in this repo.

| Question | Read |
|---|---|
| How do I run this? | [`docker/README.md`](docker/README.md) — one command; no toolchain, no monorepo build |
| How do I install it by hand into a DSH profile? | [`docs/SETUP.md`](docs/SETUP.md) |
| It is running — how do I know it works? | [`docs/RUNBOOK-SERVER.md`](docs/RUNBOOK-SERVER.md) §0 acceptance checklist |
| Why is the approval panel not appearing? | [`docs/RUNBOOK-SERVER.md`](docs/RUNBOOK-SERVER.md) §2.5-2.6 — **the permission preset**; this is the cause in almost every case |
| What is the design and why? | [`docs/PRD.md`](docs/PRD.md) |
| What is proven, and how? | the `docs/VERIFY-*.md` files, table below |
| What is still broken or unproven? | [`todo.md`](todo.md) and §5 below |

### The evidence set

| Doc | Proves |
|---|---|
| [`VERIFY-E2E-APPROVAL.md`](docs/VERIFY-E2E-APPROVAL.md) | **A real browser**: the panel renders this plugin's reason; **Allow once** writes the file; **Reject** writes nothing |
| [`VERIFY-DASHBOARD.md`](docs/VERIFY-DASHBOARD.md) | The approval dashboard: 151 unit + 9/9 integration green, live HTTP transcript (page 200 / no-token 401 / approve → `allowed-once` / 409 / 403); the one browser click is recorded UNVERIFIED |
| [`VERIFY-INTEGRATION.md`](docs/VERIFY-INTEGRATION.md) | 5/5 in a real cordis context — approve, reject, fail-closed, `deny` mode, auto |
| [`VERIFY-SDK-RUN.md`](docs/VERIFY-SDK-RUN.md) | A real model-driven run via the **SDK** reached the gate; session log quoted |
| [`VERIFY-HEADLESS-RUN.md`](docs/VERIFY-HEADLESS-RUN.md) | A real model-driven run via the **CLI** reached the gate |
| [`VERIFY-APPROVAL.md`](docs/VERIFY-APPROVAL.md) | The five outcomes, with harness file:line |
| [`VERIFY-PANEL-EVIDENCE.md`](docs/VERIFY-PANEL-EVIDENCE.md) | The harness already covers panel rendering (15/15 component tests + a committed browser snapshot) |
| [`QA-FINAL.md`](docs/QA-FINAL.md) | Independent QA of the guide — 39 PASS / 9 FAIL, all 9 since fixed |
| [`QA-SETUP.md`](docs/QA-SETUP.md) | The *earlier* QA pass; its findings were the 9 that got fixed. Historical |
| [`E2E-BROWSER-PLAN.md`](docs/E2E-BROWSER-PLAN.md) | Browser-launch and selector patterns to reuse for UI automation |

`docs/INTEGRATION-PLAN.md` is a planning note, not a result.

---

## 3. Verified state — run these before you trust anything

```bash
cd dsh-feature-loop
make verify        # compose-check + 151 tests + typecheck + the 9/9 integration spec
```

Or individually:

```bash
make test          # 151 pass, 0 fail
make typecheck     # mirrors the CI file list (now incl. src/dashboard*.ts)
make integration   # 9 pass (needs a harness checkout; set DSH_HARNESS to move it)
make compose-check # the compose file is valid
```

`test/integration/run.sh` stages a spec into `$DSH/packages/core/tools/tests/`,
runs it, and removes it. It needs the harness checkout; pass the path as `$1` or
set `DSH_HARNESS`. It cleans up after itself — if you `kill` it mid-run, delete
`$DSH/packages/core/tools/tests/zz-feature-loop-gate.spec.ts` by hand.

### To bring up a working server

```bash
cd dsh-feature-loop
make up        # build, start, wait for the UI, print the URL + token
make help      # every target
```

`make up` reads the gateway key from `~/.dsh/.credentials.yaml` when it is not in
the environment, so it usually needs no arguments. `make url`, `make dashboard`
(the approval dashboard's URL + token), `make health`, `make logs`, `make down`
(keeps the volume) and `make clean` (removes it, asks first) cover the rest.
`make ports` shows which of 3081/3097/3099/3090/3092 are in use without
touching them.

There is **one** service and **one** compose file: `docker/docker-compose.yml`,
service `dsh-feature-loop`, volume `dsh-fl-data` (pinned — compose would
otherwise prefix it with the directory name).

The image is already built locally as `dsh-feature-loop:local`, and a container
named `dsh-feature-loop` may still be running on host port **3090**. Check
`docker ps` before starting another.

---

## 4. Gotchas that cost real time

Each of these was hit and diagnosed. Do not re-derive them.

1. **`@deepseek-ai/dsh@latest` is broken.** It pins
   `@deepseek-ai/dsh-client-ui-sidebar-documentpreview@^0.1.5-rc.3`, which was
   never published → ETARGET. Use `0.1.7-alpha.1` (what the image pins).

2. **The approval panel needs `permission.defaultPreset: workspace-write`.**
   `permission-presets` applies the default preset's approval policy *directly*
   on a fresh session, **after** every config default, and it is a settings
   section — so a profile's `cordis.patch.yml` **cannot** override it. Under
   `danger-full-access` the policy is `never` and a feature-loop `ask` becomes
   `Error: the user rejected tool "X"` with **no panel**. `DSH_PERMISSION_MODE`
   does not help; it only sets the sandbox mode and the `approval` bundle's own
   `policy`. Full mechanism: `docs/RUNBOOK-SERVER.md` §2.5.

3. **DSH refuses two binds.** `--host 0.0.0.0` is rejected by the CLI ("would
   expose remote code execution"), and the webserver schema accepts only
   `127.0.0.1` or `0.0.0.0` — so binding the container's own IP fails too. The
   image binds `127.0.0.1` and relays; see `docker/entrypoint.sh`.

4. **Use the harness's real tool names.** `read`, `write`, `edit`, `bash`,
   `glob`, `grep`. The names `read_file` / `write_file` / `edit_file` /
   `run_tests` belong to this repo's **standalone runner** (`src/tools.ts`) and
   match nothing in a DSH session. A non-matching name is **not an error** — the
   tool falls through to the unclassified `irreversible` default, so the gate
   still fires but with `always-approve` instead of your configured policy. That
   is the "working for the wrong reason" trap.

5. **A composer element exists before a workspace is chosen, but is inert.**
   A UI script keying off "is the composer present?" will type into it, submit
   nothing, and then wait forever for a panel that was never requested. Key off
   the UI's own `Choose a workspace to start` prompt.

6. **The harness cannot launch its own browser specs here.** They expect
   `chromium_headless_shell-1228`; the cached `chromium-1228` is a stub.
   `chromium.launch({ channel: 'chrome' })` with `locale: 'en-US'` works.

7. **`pnpm install` was impossible until this session** — the manifest pinned
   harness-monorepo *workspace* versions (`cordis@0.4.0`,
   `schemastery@0.1.5`) that were never published. Now fixed; harness packages
   are optional peers and `.npmrc` disables peer auto-install (some transitive
   peers are unpublished).

---

## 5. What is NOT established

Stated plainly so nobody inherits a false belief. These are also in
[`todo.md`](todo.md).

- **`costBudgetUSD` measures zero.** `LoopBudget.spend()` is never called with
  real usage, so the cost ceiling is decorative. **`maxSteps` is the only
  trustworthy ceiling.** This is the largest correctness gap.
- **`src/plugin.ts` had no automated test until this session**, and the two new
  test files cover the decisions and a real cordis context — but the *wiring* is
  still thin. Two bugs already shipped past reading-only review (detectors that
  never saw history; a gate that failed open for an agent-less call).
- **Nobody has clicked the panel by hand.** Both buttons were exercised by an
  automated browser script. That proves the mechanism, not that a person finds
  the UI usable — and the flow needs three gates (testing notice, API-key
  prompt, workspace chooser) before the composer is usable.
- **Session-log persistence through the web path** was not confirmed on the
  container volume. The approved *file* is the evidence instead.
- **`routing.ts` overlaps `model-selection`** in the harness. Retained
  deliberately (it drives the standalone runner and carries spec-level
  escalation), but unresolved.
- **Branch drift risk:** PRs #3-#7 (Dependabot) are still open. #5 (tsdown 0.5 →
  0.23), #6 (zod 3 → 4) and #7 (typescript 5.9 → 7) are major jumps; CI green
  on them does **not** prove the plugin still typechecks, because `src/plugin.ts`
  is excluded from the CI typecheck job.

---

## 6. Rules this repo holds itself to

- **No vendored harness code.** If you find yourself copying a file out of
  `deepseek-harness`, stop and register a listener on a harness event instead.
  The fork was removed on purpose; `CONTRIBUTING.md` §"The de-fork" says why.
- **Report only what you observed.** "UNVERIFIED", "did not work", and "I could
  not test this" are expected answers and appear throughout `docs/`. Do not
  upgrade an inference into an observation.
- **Thresholds cite provenance.** Every detector threshold is quoted in
  `BOOK_THRESHOLDS` (`src/signals.ts`) from the source playbook.
- **Do not edit `~/.dsh/settings.yaml`** without asking. Use a private
  `DSH_HOME` instead — the recipe is `docs/RUNBOOK-SERVER.md` §2.6.

---

## 7. Ownership of the work

This session was run with an Agent Teams setup. For continuity, the shared task
board used these ids:

| Task | Subject | Outcome |
|---|---|---|
| task-1 | Wire the gate to `ask` | done |
| task-2 | Verify the approval paths | done → `VERIFY-APPROVAL.md` |
| task-3 | Run the DSH web server | done → `RUNBOOK-SERVER.md` |
| task-4 | Model-driven run reaches the gate (headless) | done → `VERIFY-HEADLESS-RUN.md` |
| task-5 | Same via the SDK | done → `VERIFY-SDK-RUN.md` |
| task-6 | QA the setup guide | done → `QA-SETUP.md` |
| task-7 | Re-verify the fixed guide + Docker path | done → `QA-FINAL.md` |
| task-8 | Strongest non-browser panel evidence | done → `VERIFY-PANEL-EVIDENCE.md` |
| task-9 | Browser-e2e patterns | done → `E2E-BROWSER-PLAN.md` |

The board does not persist across sessions; this table is the record.

---

## 8. Where to start

If you have 5 minutes: run the four verification commands in §3.

If you have half an hour: commit and push the dashboard work so PR #9 carries
it (§1 of `todo.md` has the plan) — leaving it uncommitted is the biggest risk
to it.

If you have a browser: click the dashboard's **Allow once** by hand — the
single UNVERIFIED item, and `docs/VERIFY-DASHBOARD.md` §"NOT verified" has the
two-minute script.

If you want to improve the product: fix the cost ceiling (§5, first bullet).
