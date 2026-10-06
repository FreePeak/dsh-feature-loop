# Workers — dsh orchestrates, coding CLIs do the work

The feature loop's session is the **orchestrator**. It plans, gates and decides.
When the work is to write code, run the suite or check a change, it hands a
bounded brief to a **worker**: `xdev`, `claude` (Claude Code) or `opencode`,
started inside a **dsh terminal session**. What the worker did comes back as
the `dispatch_worker` tool result — a message in the orchestrator's own thread.

```
                       ┌──────────────── dsh session (orchestrator) ───────────────┐
 user intent ─────────▶│ plan · gate · decide                                      │
                       │   │ dispatch_worker({worker, role, task, cwd?})           │
                       │   ▼                                                       │
                       │ tools/pre-execute  ── gate: human approves (ask) or the   │
                       │   │                   YOLO envelope checks cwd + allow    │
                       │   ▼                                                       │
                       │ ctx.terminals.spawn ──▶ ┌───── dsh terminal (PTY) ─────┐  │
                       │   │                     │ xdev | claude | opencode     │  │
                       │   │  poll scrollback    │ prompt in a file, output tee │  │
                       │   │◀────────────────────│ begin/end markers, exit code │  │
                       │   ▼                     └──────────────────────────────┘  │
 thread ◀──────────────│ [worker report] … status · exit · output · verdict        │
                       └────────────────────────────────────────────────────────────┘
```

## Roles

| role        | what the worker is told                                              | flags the loop passes (no bypass flag, ever)                         |
|-------------|----------------------------------------------------------------------|----------------------------------------------------------------------|
| `implement` | make the change described in the brief, inside the worktree          | `xdev -approval-mode write` · `claude --permission-mode acceptEdits` (+ `Bash(<testCommand>)` when set, so it can check its own work) |
| `test`      | run the project's test command, fix nothing unasked, report results  | same as implement                                                     |
| `validate`  | review read-only, end with `VERDICT: PASS` or `VERDICT: FAIL`        | `xdev -plan` · `claude --permission-mode plan` · `opencode --agent plan` |

`implement` runs one at a time; `test` and `validate` are concurrency-safe, so
the orchestrator can run several validators in parallel. A validator's verdict
(the last `VERDICT:` line wins) is a second opinion — the phase gate still
decides.

## Configuration

Off by default. In `cordis.patch.yml` (or the plugin's options):

```yaml
workers:
  enabled: true
  allow: [xdev, claude, opencode]   # narrow to what you trust
  backendType: shell                # terminal backend type to open
  timeoutSec: 900                   # default deadline, max 3600
  maxOutputChars: 12000             # cap on the report in the thread
  testCommand: npm test             # what a `test` worker runs
  models: { claude: sonnet }        # optional per-CLI model
```

Unknown keys fail loudly at load.

Credentials are never configured here. Each CLI reads its own (`ONEGW_API_KEY`,
`~/.dsh/.credentials.yaml`, its own login). A worker that has none reports the
CLI's own error, in the thread.

## Profile requirements

`dispatch_worker` needs a **root-level** `terminals` service. Which bundle gives
you one matters:

| bundle                  | root `terminals`? | what to do                                              |
|-------------------------|-------------------|---------------------------------------------------------|
| `dsh-headless`          | no                | add the two rows below                                  |
| `dsh-web-app`           | no — its terminals live inside each agent preset's *isolated* group, which a root plugin cannot see | add the two rows below |

```yaml
# profile cordis.patch.yml — root-level terminal service for the workers
- insert:
    - id: pty
      name: '@deepseek-ai/dsh-terminal'
    - id: terminal-bash
      name: '@deepseek-ai/dsh-terminal-bash'
      config:
        timeoutMs: 300000
```

Both packages ship inside the dsh runtime; do not `dsh plugin add` them (the
registry carries only old, incompatible versions). The sandbox, subprocess and
sandbox-policy plugins the bash backend needs are already in the base bundle.

If `workers.enabled` is set and no such service appears, the plugin says so on
stderr after 15 seconds instead of silently not registering the tool; when it
does register, it logs `dsh-feature-loop: dispatch_worker registered`.

A ready-made interactive profile for this is `flweb` (web UI, `gateMode: ask`,
all three CLIs allowed): `DSH_PERMISSION_MODE=danger-full-access dsh --profile flweb`.

## Permissions and credentials

A worker runs **inside dsh's own sandbox**. dsh's default permission mode is
`workspace-write`; under it a CLI cannot read its login or write its own state
directory (measured against the real tools: `claude` → `401 OAuth access token
has expired`, `opencode` → `EPERM … ~/.local/share/opencode/log/opencode.log`).
The report says so with a `hint:` line, because the orchestrator would otherwise
read it as "the brief was wrong" and retry.

To let workers run you must start dsh in a mode that lets them reach their own
state:

```bash
DSH_PERMISSION_MODE=danger-full-access dsh --profile flweb
```

This lifts the sandbox for **every** tool in that session, not just workers, so
the feature loop's own gates are what stands between the model and your machine:
keep `gateMode: ask` (each dispatch is approved by a human), keep `allow` as
short as you can, and keep the profile's gate policies. Do not combine it with
`gateMode: deny` and a `dispatch_worker: auto` override on a machine you care
about — that override exists for the test below, not for daily use.

## Safety model

- **Every dispatch is gated.** `dispatch_worker` is unlisted, so it resolves to
  `irreversible`: under `gateMode: ask` a human approves each one; under `deny`
  or with no answerer, the CLI is never started.
- **YOLO (`gateMode: auto`)** allows a dispatch only when the run has a
  worktree, the CLI is in `allow`, and `cwd` is inside that worktree. Anything
  else is denied.
- **Containment.** `cwd` must be absolute and inside the worktree; the allow
  list is enforced both in the envelope and in the tool body.
- **No shell injection.** The brief goes to the CLI through a file, every argv
  word is single-quote escaped, and the typed terminal line is a fixed script
  path.
- **Evidence outside the worktree.** Prompt, script and full log live in
  `<repo>/.feature-loop/workers/<runId>` (or `$TMPDIR/dsh-feature-loop/workers`),
  so the ship phase's `git add -A` never commits them.
- **Redacted and clipped.** Secret-shaped strings are masked and long output is
  clipped head+tail before it reaches the thread.
- **Bounded.** A deadline interrupts the worker (SIGINT, grace, report); a
  cancelled orchestrator turn does the same. The terminal session is always
  closed, and sessions are owner-scoped, so one orchestrator cannot read or
  signal another's workers.

Failures are reports, not exceptions: `COMPLETED`, `FAILED (exit N)`, `TIMEOUT`,
`ABORTED` or `ERROR` is returned with the tail of the output so the orchestrator
can decide what to do next.

## What the dashboard shows

Each worker adds two lines to the HITL dashboard feed (and nothing else needs
opening to follow it):

```
worker claude (implement) started in terminal pty-1 [5ddb46f7] — Goal: make `node hello.js` print exactly …
worker claude (implement) COMPLETED exit 0 in 21.7s [5ddb46f7] — … Files changed: hello.js … · evidence /tmp/dsh-feature-loop/workers/5ddb46f7-claude-implement
worker opencode (validate) COMPLETED exit 0 in 20.1s · verdict PASS [9386b997] — … VERDICT: PASS · evidence …
```

The line carries the task preview, status, exit code, duration, the validator's
verdict, the last few hundred characters of output (colour codes stripped,
secrets redacted) and the path to the full log.

## How the orchestrator is told

`phaseNotice` adds a short block when workers are enabled: in *implement* the
session is "the orchestrator" and delegates the change; in *test* it runs the
suite itself, delegates fixes, and asks a *different* worker to validate.
Research, PRD and ship phases are unchanged.

## Verify it

```bash
# pure + fake-terminal tests (no model, no network)
node --experimental-strip-types --test test/workers.test.ts \
  test/worker-dispatch.test.ts test/worker-tool.test.ts

# the real dsh harness: real PTY sessions, real approval, stub CLIs
bash test/integration/run.sh

# the real xdev / claude / opencode, one trivial call each (spends a few model
# calls; a CLI with no credential on this machine is skipped, not failed)
FL_REAL_WORKERS=1 bash test/integration/run.sh
```

### Verified end to end in a real dsh

A real `dsh` boot (0.2.0-rc.2, `onegw` model, the profile above with
`DSH_PERMISSION_MODE=danger-full-access`) was given: *dispatch `claude` to
change `hello.js` to print `hello, dsh`, then dispatch `opencode` to validate
it, then summarise.* The model called `dispatch_worker` twice; `claude` made the
edit, `opencode` ran the program and ended `VERDICT: PASS`; both reports arrived
in the thread and the model's final answer summarised them. Under the default
`workspace-write` mode the same run returned two honest `FAILED` reports (the
credential and `EPERM` failures above) and the model reported them as
environmental rather than claiming success.
