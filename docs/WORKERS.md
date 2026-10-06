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
| `implement` | make the change described in the brief, inside the worktree          | `xdev -approval-mode write` · `claude --permission-mode acceptEdits` |
| `test`      | run the project's test command, fix nothing unasked, report results  | same as implement; `claude` is pinned to `Bash(<testCommand>)`       |
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

Unknown keys fail loudly at load. The profile must carry the terminal plugins
(`@deepseek-ai/dsh-terminal`, `dsh-terminal-bash`, `dsh-subprocess-local`,
`dsh-sandbox-local`, `dsh-sandbox-policy`); without them the plugin still
loads and `dispatch_worker` is simply not registered.

Credentials are never configured here. Each CLI reads its own (`ONEGW_API_KEY`,
`~/.dsh/.credentials.yaml`, its own login). A worker that has none reports the
CLI's own error, in the thread.

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
