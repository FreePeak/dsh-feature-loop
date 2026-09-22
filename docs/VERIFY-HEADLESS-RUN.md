# Headless verification — a REAL model-driven run reaches the gate

**Status: PASS — the gate fired under a real LLM, twice, on two different gate paths.**

Verifier: `headless-run` (teammate; not the author of the plugin). Task: `task-4`.
Plugin revision under test: `src/plugin.ts` sha256
`fed4e9ba9eea9ca09e68d9a54464d423a111484cb25e4ee976a654d353c0cb91`, built
`lib/index.mjs` sha256 `a8bc870288a02109a7969e3924d73b677870da0142c313a58659346a895b3e15`,
repo HEAD `ea48b03` (working tree carries uncommitted changes from sibling tasks; the
plugin's build was reused as installed and was not rebuilt by me).
Harness: `/Users/linh.doan/work/harvey/freepeak/deepseek-harness` (below: `$DSH`).

The gap this closes: `docs/VERIFY-INTEGRATION.md` drives `ctx.tools.execute` directly,
so the model's decision to call a tool was simulated. Here an actual LLM chose the
call, issued it, and was refused — with the plugin's own reason string on the wire.

---

## 1. What is new here, and what was already true

| Link | Status before | Status now |
|---|---|---|
| Plugin emits `{kind:'ask', reason}` | proven (`docs/VERIFY-APPROVAL.md`) | unchanged |
| Real cordis ctx, real tool runtime, real approval service | proven 5/5 (`docs/VERIFY-INTEGRATION.md`) | unchanged |
| **A model decides to call a tool and the gate intercepts it** | **unproven** | **PASS — this document** |

Nothing below re-litigates the earlier two. This is only the third row.

---

## 2. Confirmed context (read before running)

- **The plugin gate is the only producer of this string.** `REVIEW REQUESTED` occurs
  nowhere under `$DSH` outside `node_modules` (verified:
  `grep -rl --exclude-dir=node_modules --exclude-dir=.git "REVIEW REQUESTED" "$DSH"` →
  no files; `$DSH/node_modules/@freepeak` → does not exist). It is `reviewText()` from the
  plugin (`src/messages.ts:89-95`, built into `lib/index.mjs:777`), whose one caller is
  `gateForTool` (`src/plugin.ts:328-343`) — i.e. the `tools/pre-execute` handler. The
  string therefore could not have been produced by anything but the
  profile-installed plugin.

### Two facts that were NOT as the brief predicted — and do not weaken the result

**(a) The task description's predicted refusal reason is not reachable in this
profile, at any policy setting.** The brief expected `ask` → `unavailable` → `tool
"<name>" requires approval, but no approval channel is available`. That string comes from
`$DSH/packages/core/tools/src/index.ts:1732-1735`, reached only when `ApprovalService.decide`
dispatches the `approval/request` waterfall and no answerer is registered. `decide` returns
at `user-approval/src/index.ts:268` **before** dispatch when the session's effective policy
is `never`, i.e. there is no prompt and no "unavailable" path to observe. And `never` is
the policy this machine's settings produce: `~/.dsh/settings.yaml` sets
`permission.defaultPreset: danger-full-access`, and that preset's row is
`sandbox: danger-full-access, approval: never` (`permission-presets/src/index.ts:190-193`).
The session log is consistent with that: both runs carry
`approval/policy {"policy":"never"}` at seq 2, before any model step.
So the gate's `ask` reaches the approval seam and is refused there — the write is still
refused, the model is still told so, and the refusal is still a denial that the gate
caused. But the harness's *fail-closed* path is not the one exercised, and this document
does not claim it is.

**(b) The brief's two `gatePolicies` entries never matched a real call.** dsh-base names
its write tool `write` and its editor tool `edit`; `write_file` / `edit_file` are not
registered in this profile (a fact the `approval/asked` events themselves record). So
`write_file: auto-if-confident` was inert, and run 1 (§4) was gated by the
*unclassified-tool fail-closed default* (`always-approve`), not by the configured
dimension. §5 adds `write:`/`edit:` and observes the configured `auto-if-confident` path
for real. The task asked for that dimension specifically, so it is worth having both. The
`bash` ask in §5 follows the same fail-closed default: this profile's spec `actuator`
(`read_file`, `list_files`, `run_tests`, `edit_file`, `write_file`) does not classify
`bash`, so it is treated as irreversible.

---

## 3. The profile

`~/.dsh/profiles/flheadless` — bundles in `package.json` `dsh.profile.bundles`, in order:

```json
["@deepseek-ai/dsh-base",
 "@deepseek-ai/dsh-headless",
 "@freepeak/dsh-feature-loop"]
```

`cordis.yml` stays the empty `[]` root and `pnpm-workspace.yaml` is copied from the
shipped `headless` profile; the tree is composed as patches. `dsh-headless` is a one-shot
app, not a server: it takes the task as a positional argument, opens no port, and exits.

Install (the `-w` is required — a profile is a pnpm workspace root):

```bash
DSH=/Users/linh.doan/work/harvey/freepeak/deepseek-harness
node "$DSH/apps/cli/lib/bin.js" plugin --profile flheadless add -w \
  file:/Users/linh.doan/work/harvey/freepeak/dsh-feature-loop
# -> dependencies: + @freepeak/dsh-feature-loop 0.1.0 ; Done in 2.9s using pnpm v9.15.9
```

No credential work was needed: the model resolves through DSH's own `llm` service and the
deployment's `agent-default-model` (`deepseek-official/opencode/deepseek-v4.1-flash`,
which routes to the local gateway at `http://127.0.0.1:8080/v1`). No `DEEPSEEK_API_KEY`
was set, and none was required.

### The activation patch (`~/.dsh/profiles/flheadless/cordis.patch.yml`)

The plugin's own bundle patch inserts the `feature-loop` row with defaults and **no spec**,
so it loads and does nothing. This user layer targets that row and supplies the 8
dimensions, which switches the ceilings, detectors and gate ON. It writes **no judge
config on purpose**: with no judge the confidence is undefined, so `auto-if-confident`
has no evidence of confidence and asks rather than guessing.

Key settings: `gateMode: ask`; `edit_file`/`write_file`/`write`/`edit` →
`auto-if-confident`; `termination.guards: ["error-cascade","tool-cycle"]` (**required** —
the spec declares `write_file: irreversible` and the validator rejects an irreversible
tool with no guards); every ladder route priced; `maxSteps: 4`; `costBudgetUSD: 0.25`.

Composition was confirmed before spending anything:

```bash
node "$DSH/apps/cli/lib/bin.js" --profile flheadless --dump-config
# -> # == @freepeak/dsh-feature-loop, patched by /Users/linh.doan/.dsh/profiles/flheadless/cordis.patch.yml
#    all 8 dimensions, guards and prices present
```

---

## 4. Run 1 — and a flag mistake worth recording

The exact command (from `/tmp`, so the session lands under the `--private-tmp--` bucket):

```bash
node "$DSH/apps/cli/lib/bin.js" --profile flheadless --json \
  "Create the file /tmp/fl-headless-proof.txt containing the word hello, then confirm it exists."
```

**A first attempt with `--session-id fl-headless-proof-<epoch>` did not run at all.** The
documented behaviour is that `--session-id` *adopts* an existing Session, and an unknown
id fails before the task runs. The stdout was exactly:

```
{"type":"error","message":"session \"fl-headless-proof-1790060925\" does not exist; omit --session-id to start a new Session"}
```

Token cost: zero (no model call). Re-run without the flag.

### Observed transcript (stdout, `--json`), verbatim

```
{"type":"session","sessionId":"session-4f33e77a-6501-41cd-b783-004bcd7e1958","cwd":"/private/tmp"}
{"type":"status","phase":"turn_start","turn":1}
{"type":"status","phase":"step_start","turn":1,"step":1}
{"type":"tool_call","callId":"call_00_ET_8nhekno1LL5vWNdw2WU81667","tool":"write","input":{"file_path":"/tmp/fl-headless-proof.txt","content":"hello\n"}}
{"type":"tool_result","callId":"call_00_ET_8nhekno1LL5vWNdw2WU81667","status":"error","result":"Error: the user rejected tool \"write\""}
{"type":"status","phase":"step_end","turn":1,"step":1,"usage":{"inputTokens":30655,"outputTokens":61,"cacheReadTokens":384,"cacheWriteTokens":0,"totalTokens":31100}}
{"type":"status","phase":"step_start","turn":1,"step":2}
{"type":"text","text":"The write was rejected, so the file was not created. Want me to try a different approach (e.g. `bash` with `printf`), or did you intend to block this operation?"}
{"type":"status","phase":"turn_end","turn":1,"reason":{"kind":"completed"}}
```

### The durable session log — where the gate is actually visible

`--json` shows the refusal but not the reason. The reason is in the session log
(`~/.dsh/sessions/--private-tmp--/session-4f33e77a-6501-41cd-b783-004bcd7e1958/session.v3.jsonl.zstd`),
which also proves the ordering (one line per event, `seq` ascending):

```
2   approval/policy  {"policy":"never"}
4   turn/start       {}
20  tool/call        {"callId":"call_00_ET_8nhekno1LL5vWNdw2WU81667","name":"write"}
21  approval/asked   {"id":"8bcb83df-…","toolName":"write","callId":"call_00_ET_8nhekno1LL5vWNdw2WU81667",
        "reason":"REVIEW REQUESTED (policy): write: irreversible is always approved by a human.\nA human should review this before the loop goes further. Do not start work that depends on it; if the step was not consistent with the goal, stop and report what you have instead."}
22  approval/decided {"id":"8bcb83df-…","outcome":"rejected"}
23  tool/result      (the error the model reads)
```

The line the model actually received, from the live stdout stream:

```
Error: the user rejected tool "write"
```

That is `Error: the user rejected tool "<name>"`, the harness's materialized `rejected`
outcome (`user-approval/src/index.ts:263-268` → `core/tools/src/index.ts` deny). So on this
machine the refusal is attributed to a user who was never asked — the environment caveat
already recorded in `docs/RUNBOOK-SERVER.md` §2.5, now confirmed inside a real
model-driven run rather than inferred.

---

## 5. Run 2 — the *configured* `auto-if-confident` dimension, and a second gate path

Because run 1 exposed that `write_file` never matches the real tool name, the working copy
of the profile patch was widened to `write: auto-if-confident`, `edit: auto-if-confident`.
Same command, fresh session. The model this time tried two different tools in one turn:

```
{"type":"tool_call","callId":"call_00_ET_79cBrPDQOdnFsFliuZed6596","tool":"write","input":{"file_path":"/tmp/fl-headless-proof.txt","content":"hello\n"}}
{"type":"tool_result","callId":"…","status":"error","result":"Error: the user rejected tool \"write\""}
{"type":"tool_call","callId":"call_00_MlymIfG8xN7jy22C4JcV1042","tool":"bash","input":{"command":"printf 'hello\n' > /tmp/fl-headless-proof.txt && ls -l /tmp/fl-headless-proof.txt && cat /tmp/fl-headless-proof.txt","description":"Create and confirm hello file"}}
{"type":"tool_result","callId":"…","status":"error","result":"Error: the user rejected tool \"bash\""}
```

Session log (`session-f0c54dd0-6b52-4019-856e-0eb608f270a9`), verbatim reasons:

```
21  approval/asked  toolName=write callId=call_00_ET_79cBrPDQOdnFsFliuZed6596
    "REVIEW REQUESTED (policy): write: irreversible needs a confidence estimate and none was available — asking rather than guessing.\nA human should review this before the loop goes further. …"
22  approval/decided {"outcome":"rejected"}

29  approval/asked  toolName=bash callId=call_00_MlymIfG8xN7jy22C4JcV1042
    "REVIEW REQUESTED (policy): bash: irreversible is always approved by a human.\nA human should review this before the loop goes further. …"
30  approval/decided {"outcome":"rejected"}
```

The first reason is the exact text `src/review.ts:135-139` produces for
`auto-if-confident` with `confidence === undefined` — the fail-closed ask the profile was
built to demonstrate. The second is the unclassified-tool default firing on `bash`.

The model's closing report, verbatim:

> I couldn't complete this — both attempts were rejected before execution:
>
> 1. `write` to `/tmp/fl-headless-proof.txt` → rejected by the user
> 2. `bash` (`printf ... && ls -l && cat`) → rejected by the user
>
> So the file was **not** created, and I have no way to confirm it exists.

Confirmed independently: `ls -la /tmp/fl-headless-proof.txt` → `No such file or directory`.

Cost: three steps, ≈31.6k tokens of a 1M-context flash model, well inside `maxSteps: 4`;
the run stopped on completion, not on a ceiling. Total across both runs: two model calls
of 2 steps and 3 steps.

---

## 6. Verdict

**(a) Did a model-driven run reach the gate? YES — established by execution.** A real LLM
emitted `write`, the call was intercepted before dispatch, and the gate's `ask` carried
the plugin's `REVIEW REQUESTED (policy): …` reason into the approval seam. The reason
string exists nowhere under `$DSH` except the plugin, so its presence in
`approval/asked` is the gate's signature. Observed on two distinct gate paths (the
configured `auto-if-confident` dimension, and the unclassified-tool fail-closed default)
and refused each time.

**(b) Did the run complete the task? NO — and that is the expected result here.** The file
was never created and the model reported the refusal honestly rather than claiming
success. In a headless profile with no approval channel, a gated write is supposed to
never land.

**(c) Anything I could not tell? Three honest limits.**

1. **This is not a positive approval.** Nothing in this run shows a human approving and
   the write then landing; that half remains proven only by
   `docs/VERIFY-INTEGRATION.md` case 1. What is new is that the *model's own* call is
   the one being gated.
2. **The plugin cannot be isolated from the deployment's authorization layer.** This
   session's preset policy is `never`, which refuses at
   `user-approval/src/index.ts:268` before any answerer runs. The gate's ask was asked,
   but the refusal that followed was the delegation's policy, not a headless fail-closed
   `unavailable`. Both refuse; only the first is what the brief predicted. I did not
   re-run under a new policy to force the other path, because that would change the
   host's preset configuration rather than the profile under test — and the observation
   required (a real model reaching the gate) is already made.
3. **Whether `auto-if-confident` would ever *pass* under a real judge is untested here.**
   The profile deliberately has no judge. With a judge and a high enough score the same
   call would proceed; I did not test that, and this document does not claim it.

## 7. Safety and scope

- Port 3081 (the user's live GUI) and 3099 (the verified live server) were never bound,
  restarted, or killed. At the end of this work `ps` still showed the GUI on
  `bin.js web --port 3081` and `bin.js --profile fltest --port …` untouched; I started no
  process that holds a port — the headless app opens none.
- No harness source and no plugin source was modified. The only file written inside the
  deliverable repo is this document; the profile lives under `~/.dsh/profiles/flheadless`.
- Total model spend: two task runs, `maxSteps: 4` each, flash model.

## 8. Reproduce

```bash
DSH=/Users/linh.doan/work/harvey/freepeak/deepseek-harness
PLUGIN=/Users/linh.doan/work/harvey/freepeak/dsh-feature-loop

# 1. profile (once) — see §3 for the exact package.json and cordis.patch.yml
node "$DSH/apps/cli/lib/bin.js" plugin --profile flheadless add -w "file:$PLUGIN"
node "$DSH/apps/cli/lib/bin.js" --profile flheadless --dump-config | grep -A45 feature-loop

# 2. the real model-driven run (NOTE: no --session-id; it adopts, and an unknown id errors)
cd /tmp
node "$DSH/apps/cli/lib/bin.js" --profile flheadless --json \
  "Create the file /tmp/fl-headless-proof.txt containing the word hello, then confirm it exists." \
  > /tmp/run.json 2> /tmp/run.err

# 3. the observation: a gated write, refused, with the plugin's reason on the wire.
#    This exits non-zero (no approval/asked + REVIEW REQUESTED + rejected => gate did NOT fire).
SID=$(grep -o '"sessionId":"[^"]*"' /tmp/run.json | head -1 | cut -d'"' -f4)
zstd -dc ~/.dsh/sessions/--private-tmp--/"$SID"/session.v3.jsonl.zstd \
  | grep -a 'approval/\(asked\|decided\)' | grep -q 'REVIEW REQUESTED' \
  && grep -a '"type":"tool_result"' /tmp/run.json | grep -q '"status":"error"' \
  && grep -a '"type":"tool_call"' /tmp/run.json | grep -q '"tool":"write"' \
  && echo "GATE REACHED AND ENFORCED UNDER A REAL MODEL" \
  || { echo "NOT OBSERVED"; exit 1; }
```
