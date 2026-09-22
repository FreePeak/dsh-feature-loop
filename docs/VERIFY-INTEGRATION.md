# Integration verification — the gate inside a real DSH pipeline

**Status: PASS — 5/5, executed against the real harness.**

This closes the last unverified link in the human-approval objective. Previous
evidence (`docs/VERIFY-APPROVAL.md`) proved the plugin *emits* the right
`PreToolDecision` through a fake `ctx`, and separately read the harness source to
show it *honours* it. This run proves both halves together, in one process, with
the real tool runtime, real approval service, real session and the real plugin.

---

## What was run

The spec is [`test/integration/plugin-in-dsh.spec.ts`](../test/integration/plugin-in-dsh.spec.ts).
It mounts the actual plugin with `applyFeatureLoop(ctx, {...})` into a context
composed exactly like the harness's own approval suite
(`packages/core/tools/tests/tools.spec.ts:741-753`):

```ts
await ctx.plugin(LlmRuntime);              await ctx.plugin(SessionStore)
await ctx.plugin(SessionProjectionRegistry); await ctx.plugin(SystemPrompt)
await ctx.plugin(ToolRuntime);             await ctx.plugin(AgentRegistry)
await ctx.plugin(AgentLoop, { agents: [] })
await ctx.plugin(ApprovalService)
ctx.tools.register(writeTool)
applyFeatureLoop(ctx, { spec, gateMode, gatePolicies })   // <- the plugin
```

Then it drives the real dispatch path:

```ts
await ctx.tools.execute({ callId, name: 'write_file', arguments, agent, signal })
```

The spec must run inside the harness checkout, because `@deepseek-ai/dsh-*`
resolve through the harness's 455-entry `tsconfig.base.json` paths map. The
harness's own `vitest.config.ts` cannot collect it (its `include` globs only match
`packages/*/*/tests`), so it was copied to
`packages/core/tools/tests/`, run, and removed. `test/integration/vitest.dsh.config.ts`
is the standalone config for the same purpose.

```bash
cd $DSH
cp ~/work/harvey/freepeak/dsh-feature-loop/test/integration/plugin-in-dsh.spec.ts \
   packages/core/tools/tests/zz-feature-loop-gate.spec.ts
npx vitest run packages/core/tools/tests/zz-feature-loop-gate.spec.ts
rm packages/core/tools/tests/zz-feature-loop-gate.spec.ts
```

## Result

```
✓ |thread-safe| packages/core/tools/tests/zz-feature-loop-gate.spec.ts (5 tests) 125ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```

| # | Case | Asserted | Verdict |
|---|---|---|---|
| 1 | **Approve** — answerer returns `allowed-once` | `isError: false`, content `wrote /tmp/x`, answerer called once with `toolName: 'write_file'` | **PASS** |
| 2 | **Reject** — answerer returns `rejected` | `isError: true`, `Error: the user rejected tool "write_file"` | **PASS** |
| 3 | **Fail closed** — no answerer registered | `isError: true`, `...no approval channel is available` | **PASS** |
| 4 | **Unattended** — `gateMode: 'deny'` | `isError: true`, gate reason returned, **answerer never called** (`asked === 0`) | **PASS** |
| 5 | **Auto tool** — `gatePolicies: { write_file: 'auto' }` | `isError: false`, answerer never called | **PASS** |

Case 1 is the objective: a human's approval **releases the gate and the write
runs**. Case 4 is the safety property in the other direction: `deny` does not
merely refuse, it never even asks.

## The exact string a human reads

Captured from the live `ApprovalRequest.reason` the answerer received. This is
the same value `ApprovalPanel.tsx:41` renders as `pending.reason`, the panel's
headline:

```
REVIEW REQUESTED (policy): write_file: irreversible is always approved by a human.
A human should review this before the loop goes further. Do not start work that depends on it; if the step was not consistent with the goal, stop and report what you have instead.
```

Buttons rendered beneath it (`locales.ts:20-21`): **Reject** / **Allow once**.

## What this does and does not claim

**Proven by execution:**

- The plugin's `ask` reaches the harness's approval seam with the tool name, the
  call id, and the human-readable reason.
- Each of the four outcomes changes the tool result as documented.
- `gateMode: 'deny'` bypasses the approval channel entirely.
- An unconfigured/auto tool is not gated.

**Still not observed:**

- **The rendered panel in a browser.** This proves the data path the panel
  consumes; it does not prove that THIS plugin's reason string reached a
  rendered panel in a live session. (The panel component's own rendering is
  covered by harness tests and a committed browser snapshot — see
  `VERIFY-PANEL-EVIDENCE.md` — so what remains is the junction.) That remains the human's step, and
  `docs/RUNBOOK-SERVER.md` gives the URL and the task to run.
- **A full model-driven agent run** reaching the gate. This drives
  `ctx.tools.execute` directly, so the model's decision to call `write_file` is
  simulated, not produced by an LLM.

**Environment caveat carried forward:** under
`DSH_PERMISSION_MODE=danger-full-access` the approval policy is `never`, which
returns `rejected` *before any answerer runs* — so a panel never appears. See
`docs/RUNBOOK-SERVER.md` §2.5. The profile used for the live server resolves to
`ask`, which is what makes case 1 observable there.
