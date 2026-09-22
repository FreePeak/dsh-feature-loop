# SDK-run verification — a REAL model-driven run reaches the gate through the SDK

**Status: verified working.** A real LLM, driven by the harness's own TypeScript
SDK client against a purpose-built profile, called a mutating tool, and the
feature-loop gate intercepted the call and recorded its `REVIEW REQUESTED`
reason in the durable session log.

| | |
|---|---|
| **Driver** | `@deepseek-ai/dsh-sdk-client` — `DeepSeekHarness.run()` over stdio JSON-RPC |
| **Client source** | `$DSH/packages/sdk/client/lib/index.js` (built lib, imported by absolute path) |
| **Runtime launched** | `node $DSH/apps/cli/lib/bin.js --profile flsdk` |
| **Profile** | `~/.dsh/profiles/flsdk` — bundles `dsh-base` + `dsh-sdk-app` + `@freepeak/dsh-feature-loop` |
| **Route** | `onegw / opencode/deepseek-v4.1-flash`, `maxTokens: 2048` |
| **Session** | `session-6d32813ce3da46ee89d47e70580d3eb5`, cwd `/tmp`, `turn/end` reason `completed` |
| **Durable log** | `~/.dsh-fl-verify/sessions/--tmp--/session-6d32813ce3da46ee89d47e70580d3eb5/session.v3.jsonl.zstd` |
| **Gate events** | **3× `approval/asked`** with `REVIEW REQUESTED (policy): …`, each followed by `approval/decided {"outcome":"unavailable"}` |
| **Did the write happen?** | **No.** `/tmp/fl-sdk-proof.txt` does not exist; the model reported the block instead of faking success |
| **Model spend** | one turn, 3 steps, ≤4 (`maxSteps: 4`); the run ended on completion, not on a ceiling |

Verdict: **the gate fires under a real model on the SDK execution path**, and the
proof is the session log, not an assertion. The ask resolved to `unavailable`
because the SDK protocol has no approval surface at all — that is the *expected*
outcome and it is precisely what shows the ask reached the approval seam.

---

## 1. What this adds

The plugin's gate was already verified three ways. This is the fourth, and it is
a genuinely different execution path: the runtime is a **child process driven
over the wire by another program**, not the CLI's own launcher and not an
in-process `ctx.tools.execute`.

| Evidence | Path exercised | Model really chose the tool? |
|---|---|---|
| `test/plugin-approval.test.ts` | unit — the decision function | no |
| `test/integration/plugin-in-dsh.spec.ts` + `docs/VERIFY-INTEGRATION.md` | real cordis context, `ctx.tools.execute` | no |
| `docs/VERIFY-HEADLESS-RUN.md` | `dsh --profile flheadless` (in-process CLI) | **yes** |
| **this document** | **`DeepSeekHarness.run()` → stdio JSON-RPC → SDK-app runtime subprocess** | **yes** |

`REVIEW REQUESTED` is the plugin's own string. It exists nowhere in the harness:

```bash
grep -rl --exclude-dir=node_modules --exclude-dir=.git "REVIEW REQUESTED" "$DSH"
# -> (no output)
grep -rl --exclude-dir=node_modules --exclude-dir=.git "REVIEW REQUESTED" "$PLUGIN" | grep lib
# -> lib/index.mjs, lib/index.mjs.map   (the plugin's built output — the only planted source)
```

So a session log that contains that string under a real model run records the
plugin's decision, not the host's.

---

## 2. Why `unavailable` is the only possible outcome on this path

The SDK wire protocol is small, and it has **no approval method**. Verbatim, the
server's whole dispatcher
(`packages/sdk/server/src/server.ts:247-256`):

```ts
switch (method) {
  case 'initialize':
    return this.initialize(params as unknown as InitializeParams)
  case 'session/prompt':
    return this.prompt(params as unknown as SessionPromptParams)
  case 'shutdown':
    return this.shutdown()
  default:
    throw new Error(`unknown DeepSeek Harness SDK runtime method: ${method}`)
}
```

The SDK client's own README states the same limit: *"Client→server notifications
and server→client requests are unimplemented on both wire ends; the transport
carries them for future approval flows."* No answerer can be mounted, so the
approval seam resolves every ask to `unavailable` and fails closed. A CLI or web
profile can at least be *configured* into a refusal (`rejected`) before the seam;
this path cannot even do that, which makes it the cleanest demonstration that
the `ask` came from the plugin and travelled into the host's approval service.

---

## 3. The profile — `~/.dsh/profiles/flsdk`

Created for this task, modelled on `~/.dsh/profiles/fltest` (`cordis.yml` and
`pnpm-workspace.yaml` copied verbatim; the tree is composed as patches, so
`cordis.yml` stays the empty `[]` root).

`package.json` — note the bundle list: `dsh-sdk-app` **is** required (it inserts
the `@deepseek-ai/dsh-sdk-jsonrpc-server` row; without a server row, client
initialization fails), and nothing else from the web profile is.

```json
{
  "name": "dsh-profile-flsdk",
  "private": true,
  "dependencies": {
    "@freepeak/dsh-feature-loop": "file:/Users/linh.doan/work/harvey/freepeak/dsh-feature-loop"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-sdk-app",
        "@freepeak/dsh-feature-loop"
      ]
    }
  }
}
```

Install (the `-w` is **required** — a profile is a pnpm workspace root):

```bash
DSH=/Users/linh.doan/work/harvey/freepeak/deepseek-harness
PLUGIN=/Users/linh.doan/work/harvey/freepeak/dsh-feature-loop
node "$DSH/apps/cli/lib/bin.js" plugin --profile flsdk add -w "file:$PLUGIN"
# -> + @freepeak/dsh-feature-loop 0.1.0
```

`cordis.patch.yml` supplies the 8-dimension spec to the `feature-loop` row the
plugin's own bundle patch inserts (that row carries defaults and **no spec**, so
it loads and does nothing until this patch lands). The parts that matter for the
gate:

```yaml
- id: feature-loop
  config:
    reviewBudget: 0.10
    judgeThreshold: 2
    gateMode: ask
    gatePolicies:
      read: auto                 # reads never interrupt
      glob: auto
      grep: auto
      edit: auto-if-confident    # writes need a confidence estimate -> ASK
      write: auto-if-confident
    spec:
      goal: "the requested file exists with the requested contents"
      sensor: ["session tool results", "workspace files"]
      controller:
        ladder:
          - { provider: onegw, model: opencode/deepseek-v4.1-flash }  # cheap, single rung
        stepsPerRung: 2
        escalateAfterFailures: 2
      actuator:
        read: read
        glob: read
        grep: read
        bash: irreversible
        edit: reversible-write
        write: irreversible
      feedback: "the file exists and nothing else changed"
      termination:
        successCommand: "true"
        guards: ["error-cascade", "tool-cycle"]   # required: irreversible tools are declared
      maxSteps: 4
      costBudgetUSD: 0.05
      prices:
        onegw/opencode/deepseek-v4.1-flash: { inputPerMTok: 0.14, outputPerMTok: 0.28, cacheReadPerMTok: 0.014 }
```

Two deliberate choices:

- **No `judge:` config.** With no judge the confidence is undefined, so
  `write: auto-if-confident` has no evidence of confidence and must ask. That
  fail-closed ask is the whole point.
- **Real harness tool names.** The gate policies use `read` / `glob` / `grep` /
  `edit` / `write`. The model-facing roster in the captured `request/header`
  proves these are the live names in this run:

  ```
  TOOL_COUNT 24
  bash,create_goal,edit,exit_plan_mode,get_goal,glob,grep,interrupt_agent,job_kill,job_list,
  job_output,list_agents,read,read_image,send_message,skill,subagent,subagent_fork,todo_write,
  update_goal,web_fetch,web_search,workflow,write
  ```

  `write_file` / `edit_file` (this repo's standalone-runner names) match nothing
  here.

Composition check before spending anything on a model:

```bash
node "$DSH/apps/cli/lib/bin.js" --profile flsdk --dump-config > /tmp/flsdk-dump.txt
grep -n "sdk-app-startup\|sdk-jsonrpc-server" /tmp/flsdk-dump.txt
# -> 354:- id: sdk-app-startup      (name: '@deepseek-ai/dsh-sdk-app')
# -> 358:- id: sdk-jsonrpc-server   (name: '@deepseek-ai/dsh-sdk-jsonrpc-server')
grep -n "@freepeak/dsh-feature-loop, patched by" /tmp/flsdk-dump.txt
# -> 367:# == @freepeak/dsh-feature-loop, patched by /Users/linh.doan/.dsh/profiles/flsdk/cordis.patch.yml
```

The resolved `feature-loop` row (dump lines 368-410) contains all eight
dimensions: `goal`, `sensor`, `controller.ladder`, `actuator`, `feedback`,
`termination` (+ `guards`), `maxSteps`, `costBudgetUSD`, `prices`.

---

## 4. The run

### 4.1 DSH home

The run used the **hermetic home already documented in `docs/RUNBOOK-SERVER.md`
§2.6** (`~/.dsh-fl-verify`: `profiles` and `.credentials.yaml` symlinked to the
real `~/.dsh`, `settings.yaml` copied) rather than the default home. `~/.dsh/settings.yaml`
must not be touched, and the hermetic home pins the preset that makes the gate's
ask visible instead of pre-refused. Its full diff against the real settings is
two lines — verified, not assumed:

```bash
diff ~/.dsh/settings.yaml ~/.dsh-fl-verify/settings.yaml
# 46c46
# <   model: execution
# ---
# >   model: kilocode/kilo-auto/free
# 48c48
# <   defaultPreset: danger-full-access
# ---
# >   defaultPreset: workspace-write
```

The first difference is `agent-default-model`, which this run never consults: the
SDK `initialize` handshake names the route explicitly (`onegw /
opencode/deepseek-v4.1-flash`, confirmed in §5's captured `request/header`). The
second is the preset that matters, and the session log records its effect:

```
permission/preset seq=0 {"preset":"workspace-write"}
sandbox/mode      seq=1 {"mode":"workspace-write"}
approval/policy   seq=2 {"policy":"ask"}
```

Because `profiles` is a symlink, the `flsdk` profile installed above is resolved
from it; only the settings file differs.

### 4.2 Driver script (`/tmp/fl-sdk-driver.mjs`, scratch — not part of the plugin)

```js
import { DeepSeekHarness } from '/Users/linh.doan/work/harvey/freepeak/deepseek-harness/packages/sdk/client/lib/index.js'

const harness = new DeepSeekHarness({
  dshBin: '/Users/linh.doan/work/harvey/freepeak/deepseek-harness/apps/cli/lib/bin.js',
  profile: 'flsdk',
  dshHome: process.env.FL_DSH_HOME,
  cwd: '/tmp',
  provider: 'onegw',
  model: 'opencode/deepseek-v4.1-flash',
  maxTokens: 2048,
})

try {
  const result = await harness.run(
    'Create the file /tmp/fl-sdk-proof.txt whose contents are exactly: hello',
    { onNotification: (n) => { /* print every approval/* session.event live */ } },
  )
  console.log('SESSION', result.sessionId)
  console.log('EVENT_TYPES', result.events.map((e) => e.type).join(','))
  console.log('FINAL', JSON.stringify(result.finalResponse))
} finally {
  await harness.close()
}
```

`dshBin` is passed explicitly (the client's default resolution targets the
installed `@deepseek-ai/dsh` package, which is not this checkout). `cwd: '/tmp'`
is the wire workspace cwd; the prompt is tiny on purpose.

### 4.3 Command

```bash
rm -f /tmp/fl-sdk-proof.txt
cd /tmp && FL_DSH_HOME=/Users/linh.doan/.dsh-fl-verify timeout 300 node /tmp/fl-sdk-driver.mjs
```

Empty stderr; exit 0. Nothing was written to stdout of the child except protocol
frames (the SDK bundle reserves stdout for JSON-RPC), which is why this works at
all with a plugin loaded.

---

## 5. Verbatim session-log evidence

Read directly from the durable log:

```bash
L=~/.dsh-fl-verify/sessions/--tmp--/session-6d32813ce3da46ee89d47e70580d3eb5/session.v3.jsonl.zstd
zstd -dc "$L" | grep -E 'approval/asked|REVIEW REQUESTED'
```

### 5.1 The gate's asks — 3 of them, reason quoted in full

Values are verbatim; the layout is reformatted for reading, with the JSON-escaped
`\n` in each `reason` shown as a real newline.

```text
SEQ 16 toolName=write
reason: REVIEW REQUESTED (policy): write: irreversible needs a confidence estimate and none was available — asking rather than guessing.
        A human should review this before the loop goes further. Do not start work that depends on it; if the step was not consistent with the goal, stop and report what you have instead.

SEQ 23 toolName=bash
reason: REVIEW REQUESTED (policy): bash: irreversible is always approved by a human.
        A human should review this before the loop goes further. Do not start work that depends on it; if the step was not consistent with the goal, stop and report what you have instead.

SEQ 30 toolName=write
reason: REVIEW REQUESTED (policy): write: irreversible needs a confidence estimate and none was available — asking rather than guessing.
        A human should review this before the loop goes further. Do not start work that depends on it; if the step was not consistent with the goal, stop and report what you have instead.
```

Each reason is plugin policy text for the tool the **model itself** chose — and
the two distinct texts prove two distinct gate paths fired:
`write` (declared `irreversible` in `actuator`, asked through
`auto-if-confident` with undefined confidence) and `bash` (irreversible, asked
unconditionally). As raw JSONL, the first one is:

```json
{"type":"approval/asked","seq":16,"time":1790062599687,"data":{"id":"a10fcd0d-2f3f-491f-8f14-46e90e5ae346","toolName":"write","callId":"call_00_ET_ufL3xUiRhz6iGXtLFbxI7956","reason":"REVIEW REQUESTED (policy): write: irreversible needs a confidence estimate and none was available — asking rather than guessing.\nA human should review this before the loop goes further. Do not start work that depends on it; if the step was not consistent with the goal, stop and report what you have instead."}}
```

(The `\n` inside `reason` is JSON-escaped; the text above is the decoded value.)

### 5.2 The model's own tool calls, and the decisions

Every field shown below is copied verbatim from the log; a bare `…` marks a
field this excerpt omits (`time`, and the `message.id` / envelope fields inside
`tool/result`). The gate's `reason` strings are quoted in full in §5.1.

```json
{"type":"tool/call","seq":15,"data":{"turn":1,"step":1,"callId":"call_00_ET_ufL3xUiRhz6iGXtLFbxI7956","name":"write","arguments":"{\"content\":\"hello\\n\",\"file_path\":\"/tmp/fl-sdk-proof.txt\"}"}}
{"type":"approval/asked","seq":16, … "toolName":"write" …}
{"type":"approval/decided","seq":17,"data":{"id":"a10fcd0d-…","outcome":"unavailable"}}
{"type":"tool/result","seq":18,"data":{"turn":1,"step":1,"message":{… "content":[{"type":"tool-result",… "content":[{"type":"text","text":"Error: tool \"write\" requires approval, but no approval channel is available"}],"isError":true}]…}}}

{"type":"tool/call","seq":22,"data":{"turn":1,"step":2,"callId":"call_00_1eDsxc1LeLIXdxcRMS5M0563","name":"bash","arguments":"{\"command\":\"printf 'hello\\\\n' > /tmp/fl-sdk-proof.txt && cat /tmp/fl-sdk-proof.txt\"}"}}
{"type":"approval/asked","seq":23, … "toolName":"bash" …}
{"type":"approval/decided","seq":24,"data":{"id":"2c310fff-6e12-41c6-9d45-f46c776abe28","outcome":"unavailable"}}
{"type":"tool/result","seq":25, … "Error: tool \"bash\" requires approval, but no approval channel is available" …}

{"type":"tool/call","seq":29,"data":{"turn":1,"step":3,"callId":"call_00_O4ttHngZAyGDp1KguvTz8539","name":"write","arguments":"{\"content\":\"hello\\n\",\"file_path\":\"/tmp/fl-sdk-proof.txt\",\"justification\":\"The write tool was denied by the approval gate with no approval channel; /tmp is inside the workspace-write sandbox, so a wider mode (or an approved retry) is the only remaining path to create the requested file.\",\"sandbox_permissions\":\"workspace-write\"}"}}
{"type":"approval/asked","seq":30, … "toolName":"write" …}
{"type":"approval/decided","seq":31,"data":{"id":"c1a78c64-9b32-4b06-87a0-608efbd873f5","outcome":"unavailable"}}
```

Note how the gate changed the model's behaviour: on the third step the model
attached a `justification` arguing the sandbox should allow the write — and the
gate asked anyway, because the plugin's confidence signal, not the sandbox mode,
is what it consults. That is the installed policy doing its job.

The loop's own detector also produced a signal, `user/message seq=35`:

```
REVIEW REQUESTED (signal): 3 consecutive failing steps — the first failure is the one to read.
```

### 5.3 The run's end state

```
TURN_END {"turn":1,"reason":{"kind":"completed"}}
COUNTS {"session":1,"permission/preset":1,"sandbox/mode":1,"approval/policy":1,
        "agent/inbox/spliced":2,"turn/start":1,"step/start":4,"system/message":1,
        "user/message":4,"request/header":1,"request/context":1,"session/title":1,
        "assistant/message":4,"tool/call":3,"approval/asked":3,"approval/decided":3,
        "tool/result":3,"step/end":4,"turn/end":1}
```

The model's closing report (verbatim excerpt; it stopped and reported instead of
claiming success):

> **Goal:** create `/tmp/fl-sdk-proof.txt` containing exactly `hello`.
>
> **What happened (3 failures, all the same root cause):**
> 1. `write` → `Error: tool "write" requires approval, but no approval channel is available`
> 2. `bash` (`printf 'hello\n' > /tmp/fl-sdk-proof.txt`) → same error text — the shell is gated too
> 3. `write` escalated once with `sandbox_permissions: workspace-write` → same error
>
> **State:** `/tmp/fl-sdk-proof.txt` was not created. No partial or alternate file
> was written; nothing else in the workspace was touched.

Confirmed on disk: `ls /tmp/fl-sdk-proof.txt` → `No such file or directory`.

---

## 6. The check that fails if this logic breaks

One runnable check; it exits non-zero when no SDK-driven session recorded the
gate. It is scoped to the `--tmp--` cwd bucket, which held **no** session before
this task (the two pre-existing sessions in that home live under
`--Users-linh.doan-work-harvey-freepeak-deepseek-harness--`, from the CLI
headless verification).

```bash
H=$HOME/.dsh-fl-verify
hits=0
for f in $(find "$H/sessions/--tmp--" -name 'session.v3.jsonl.zstd'); do
  if zstd -dc "$f" 2>/dev/null | grep -q 'REVIEW REQUESTED (policy)' \
     && zstd -dc "$f" 2>/dev/null | grep -q '"type":"approval/asked"'; then
    hits=$((hits+1)); echo "GATE FIRED in $f"
  fi
done
if [ "$hits" -ge 1 ]; then echo "PASS: $hits SDK-driven session(s) reached the gate"
else echo "FAIL: no SDK-driven session recorded approval/asked + REVIEW REQUESTED"; exit 1; fi
```

Observed:

```
GATE FIRED in /Users/linh.doan/.dsh-fl-verify/sessions/--tmp--/session-6d32813ce3da46ee89d47e70580d3eb5/session.v3.jsonl.zstd
PASS: 1 SDK-driven session(s) reached the gate
```

---

## 7. Honest limits of this evidence

1. **The preset explains the outcome word, not whether the gate fired.** This run
   used the hermetic home pinned to `workspace-write`, whose `approval: ask`
   policy lets the ask reach the seam and resolve to `unavailable`. Under the
   default deployment preset (`danger-full-access` → `approval: never`, per
   `~/.dsh/settings.yaml`) the same ask is pre-refused and the recorded outcome
   would be `rejected` — as already documented for the CLI path in
   `docs/VERIFY-HEADLESS-RUN.md`. **I did not re-run the SDK path under the
   default home**, so the SDK-path `rejected` variant is unverified here; the
   `approval/asked` + `REVIEW REQUESTED` evidence would be the same either way,
   since the gate emits the ask before any policy decision.
2. **No human approval happened, and none can on this path.** The protocol has
   three methods and no approval surface, so `unavailable` is terminal here. This
   document proves the gate is *reached* by a real model over the SDK wire; it
   does not and cannot show an approver consuming the ask. The browser panel case
   is `docs/RUNBOOK-SERVER.md`; the CLI case is `docs/VERIFY-HEADLESS-RUN.md`.
3. **Not the SDK client's default launch resolution.** `dshBin` was passed
   explicitly, so the client's same-version `@deepseek-ai/dsh` resolution was
   bypassed. Profile selection, the `initialize` handshake, `session/prompt`,
   notification subscription and teardown are all the real client's.
4. **This profile is not the web profile.** It carries `dsh-base` + `dsh-sdk-app`
   + the plugin only — no Agent Teams bundle rows, no MCP servers (the hermetic
   home has no home patch layer), and therefore no `mcp_*` tools in the roster.
   Gate behaviour is unaffected: `write`/`bash` are base tools.
5. **Model spend.** One turn, 3 steps of `onegw/opencode/deepseek-v4.1-flash`,
   `maxTokens: 2048`. `costBudgetUSD` was set to `0.05` but, as `docs/SETUP.md`
   notes, spend is not metered from real usage, so the ceiling that actually
   bounded this run was `maxSteps: 4` (and the run finished before it anyway).
6. **Nothing under `$DSH` was modified**, no ports were touched (the live
   servers on 3081 / 3097 / 3099 were never bound or killed), and the only file
   this task wrote in the plugin repo is this document. The profile lives at
   `~/.dsh/profiles/flsdk`; the driver script is scratch at
   `/tmp/fl-sdk-driver.mjs`.

---

## 8. Reproduce from scratch

```bash
DSH=/Users/linh.doan/work/harvey/freepeak/deepseek-harness
PLUGIN=/Users/linh.doan/work/harvey/freepeak/dsh-feature-loop

# 1. profile (once) — see §3 for the exact package.json and cordis.patch.yml
node "$DSH/apps/cli/lib/bin.js" plugin --profile flsdk add -w "file:$PLUGIN"
node "$DSH/apps/cli/lib/bin.js" --profile flsdk --dump-config | grep -A45 'id: feature-loop'

# 2. hermetic home with approval: ask (RUNBOOK-SERVER.md §2.6)
H=$HOME/.dsh-fl-verify
ls "$H/settings.yaml" && grep -A2 '^permission:' "$H/settings.yaml"   # -> defaultPreset: workspace-write

# 3. the real SDK-driven model run
rm -f /tmp/fl-sdk-proof.txt
cd /tmp && FL_DSH_HOME=$H node /tmp/fl-sdk-driver.mjs     # §4.2 has the script

# 4. the evidence
zstd -dc "$H"/sessions/--tmp--/session-*/session.v3.jsonl.zstd | grep -c '"type":"approval/asked"'
# -> 3
zstd -dc "$H"/sessions/--tmp--/session-*/session.v3.jsonl.zstd | grep -c 'REVIEW REQUESTED (policy)'
# -> 3
test ! -e /tmp/fl-sdk-proof.txt && echo "write never happened — the gate held"
```
