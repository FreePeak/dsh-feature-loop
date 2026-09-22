# Integration test plan — the plugin gate inside a real DSH tool pipeline

## Why this exists

`test/plugin-approval.test.ts` drives the plugin through a **fake `ctx`** that
only captures handlers. That proves the plugin emits the right decision, but not
that the decision is *honoured* by the harness end to end.

`docs/VERIFY-APPROVAL.md` §"Not verified" recorded exactly this gap, and the one
remaining question in `todo.md` — "watch a real agent run reach the panel" —
needs it closed.

## Ground truth to model on

`$DSH/packages/core/tools/tests/tools.spec.ts:741-800` builds a real approval
context:

```ts
const ctx = new Context()
await ctx.plugin(LlmRuntime);          await ctx.plugin(SessionStore)
await ctx.plugin(SessionProjectionRegistry); await ctx.plugin(SystemPrompt)
await ctx.plugin(ToolRuntime);         await ctx.plugin(AgentRegistry)
await ctx.plugin(AgentLoop, { agents: [] })
await ctx.plugin(ApprovalService)
ctx.tools.register(echoTool)
```

Then it registers `approval/request` answerers and a `tools/pre-execute` gate,
and calls `ctx.tools.execute({ callId, name, arguments, agent, signal })`.

## The four cases to add

Mounting the REAL plugin (`@freepeak/dsh-feature-loop`) instead of a stub gate:

| # | Answerer returns | Expected tool result | What it proves |
|---|---|---|---|
| 1 | `allowed-once` | `isError: false`, tool output present | **Approve → the write runs.** The human's click actually releases the gate. |
| 2 | `rejected` | `isError: true`, `Error: the user rejected tool "X"` | **Reject → the write is stopped.** |
| 3 | *(no answerer)* | `isError: true`, "no approval channel is available" | **Fail closed.** `ask` is never less safe than `deny`. |
| 4 | `allowed-once`, but `gateMode: 'deny'` | `isError: true`, gate reason — **answerer never consulted** | **Unattended mode.** `deny` skips the approval channel entirely. |

Plus: assert the `ApprovalRequest.reason` the answerer receives is the plugin's
gate text, because that string is what `ApprovalPanel.tsx:41` renders as
`pending.reason` — the headline a human reads.

## Acceptance

- Runs under the harness's own vitest (`npx vitest run <file>` from `$DSH`).
- Cases 1-4 pass.
- The reason handed to the answerer matches `/REVIEW REQUESTED/`.
- Reported with real observed output, or reported as unrun with the exact error.

## Ownership

Lead. This closes the objective's last unverified link; it is not delegated
because it is the acceptance evidence for the whole round.
