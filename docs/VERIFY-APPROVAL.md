# Independent verification: does the feature-loop gate reach a human decision?

Verifier: `verify-approval` (not the author of the ask-mode change).
Verified revision of the plugin: `src/plugin.ts` sha256 `257a22c68f043603c1b45ca2d06068fceeff1a4610a92f08c972226a51b8f0c4`.
Harness: `/Users/linh.doan/work/harvey/freepeak/deepseek-harness` (referred to below as `$DSH`).

## Ground truth confirmed present

Every file named in the task exists and was read at the cited lines.

| Claim | Evidence |
| --- | --- |
| `tools/pre-execute` waterfall, and `prepareExecution` | `$DSH/packages/core/tools/src/index.ts:146` (event signature), `:1470-1516` (the waterfall plus ask resolution), `:1482-1485` (the `{ kind: 'allow' }` terminus) |
| `serviceAsk` | `$DSH/packages/core/tools/src/index.ts:1698-1738` |
| `PreToolDecision` includes `ask` | `$DSH/packages/core/tools/src/index.ts:589-593` |
| Approval outcome vocabulary | `$DSH/packages/interaction/user-approval/src/types.ts:32` — `'allowed-once' \| 'rejected' \| 'cancelled' \| 'unavailable'` |
| Browser prompt presentation | `$DSH/packages/client/ui-approval/src/client/ApprovalPanel.tsx:26,41,45,48`; `.../src/client/locales.ts:16-21` |
| `user-approval` mounted | `$DSH/packages/bundle/base/cordis.patch.yml:231-234` |
| `ui-approval` mounted | `$DSH/packages/bundle/web-app/cordis.patch.yml:272-273` |

## What was verified, and by what means

The approval handshake has two halves, and they were verified differently:

| Half | Owner | Means | Confidence |
| --- | --- | --- | --- |
| Emit `{kind:'ask', reason}` for a gate-raised review | this plugin (`src/plugin.ts`) | Executed: `test/plugin-approval.test.ts` drives the registered `tools/pre-execute` handler through a fake `ctx` | High |
| Map `ask` → `ApprovalOutcome` → allow/deny, and materialize the model-facing result | the harness (`$DSH/packages/core/tools/src/index.ts`) | Read the source, and ran the harness's own specs for these paths | High for the mapping; see "Not verified" |

The plugin's responsibility ends at the `PreToolDecision`. Nothing in this report claims the plugin performs the outcome mapping.

Commands run:

- `cd dsh-feature-loop && node --experimental-strip-types --test test/*.test.ts` → **133 pass, 0 fail** (126 pre-existing + 7 new). The pre-existing suite is unbroken.
- `cd $DSH && npx vitest run packages/core/tools/tests/tools.spec.ts -t "ask"` → **9 passed, 0 failed** (128 skipped), including the `ask routing through ctx.approval` block at `tools.spec.ts:734`.
- `cd $DSH && npx vitest run packages/interaction/user-approval/tests/approval.spec.ts -t "never"` → **5 passed, 0 failed**.

## UPDATE — the gap this document recorded is now CLOSED

This document's "Not verified" section says the browser panel and a full
end-to-end run were unobserved. The first half of that gap is now closed by an
executed integration test: `test/integration/plugin-in-dsh.spec.ts` mounts the
real plugin into a real cordis context (real tool runtime, real approval service,
real session) and drives `ctx.tools.execute`. **5/5 pass.**

See [`docs/VERIFY-INTEGRATION.md`](VERIFY-INTEGRATION.md) for the run, the five
cases, and the exact reason string the approval panel renders.

Still not claimed: that *this plugin's* reason string appeared in a rendered
panel in a live session on this machine. Note that the panel **rendering itself**
is separately covered by the harness — component tests (15/15, jsdom) and a
committed browser snapshot — so the remaining gap is the junction, not the
component. See [`VERIFY-PANEL-EVIDENCE.md`](VERIFY-PANEL-EVIDENCE.md).

---

## The plugin half

`src/plugin.ts:429-442` (verified revision) consults the gate and answers:

```
const gate = gateForTool(policy, toolName)
if (gate.kind === 'proceed') return next()
...
return gate.kind === 'deny'
  ? { kind: 'deny', reason: gate.reason }
  : { kind: 'ask', reason: gate.reason }
```

`gateForTool` (`src/plugin.ts:328-343`) builds that reason with `reviewText(decision.reason, decision.source)` and selects `ask` unless `policy.gateMode === 'deny'`; the default is `ask` (`src/plugin.ts:200`, `gateMode: options.gateMode ?? 'ask'`). The harness's `PreToolDecision` union accepts it: `$DSH/packages/core/tools/src/index.ts:589-593` defines `{ kind: 'ask'; reason?: string }` — and the JSDoc at `:581-588` states the intended semantics in the harness's own words: "`ask` runs only after an approval service returns `allowed-once` and otherwise denies."

## The five paths

Verdicts are for the harness behavior as observed, plus what the plugin contributes.

### 1. approve → `'allowed-once'` → tool dispatches — **PASS**

- Harness mapping: `serviceAsk` at `$DSH/packages/core/tools/src/index.ts:1722-1723` returns `{ decision: { kind: 'allow' }, approvalCancelled: false }`.
- `prepareExecution` at `:1496` then finds `denialReason === undefined` and falls through to `:1512` `next({ kind: 'dispatch', exec })`.
- Observed: `tools.spec.ts:755-775` ("dispatches the tool when the answerer grants allowed-once") passes, asserting `isError: false` and the real tool content, and that `agent`/`toolName`/`callId`/`reason`/`signal` reach the answerer.
- Plugin: **correct** — it emits `ask`, and the grant is what authorizes dispatch.

### 2. reject → `'rejected'` → deny, model told a human said no — **PASS**

- Harness mapping: `index.ts:1724-1727` returns `deny` with reason `the user rejected tool "<name>"`.
- `prepareExecution:1496-1507` materializes it as an `isError` result whose text is `Error: the user rejected tool "<name>"`; this is what the model reads.
- Observed: `tools.spec.ts:777-785` passes with exactly `Error: the user rejected tool "echo"`.
- Audit: the `approval/asked` + `approval/decided` pair is appended turn-enclosed (`$DSH/packages/interaction/user-approval/src/index.ts:217-226`), typed at `.../user-approval/src/types.ts:44-59`.
- Plugin: **correct.**

### 3. cancel → `'cancelled'` → deny + `approvalCancelled` — **PASS**

- Harness mapping: `index.ts:1728-1731` returns `{ kind: 'deny', reason: 'approval for tool "<name>" was cancelled' }` with `approvalCancelled: true`.
- Two distinct downstream behaviors, both correct:
  - The caller's own signal was aborted: `prepareExecution:1490-1491` returns the canonical `ABORTED_BEFORE_DISPATCH` result instead of a policy denial. Observed at `tools.spec.ts:797-830` (asserts `dispatched === 0`).
  - The caller's signal is live but the request settled `cancelled`: the deny surfaces as `Error: approval for tool "<name>" was cancelled`. Observed at `tools.spec.ts:787-795`.
- Source of `'cancelled'`: an already-aborted signal short-circuits at `$DSH/packages/interaction/user-approval/src/index.ts:262`, and a later abort wins the race at `:287-299`.
- Plugin: **correct** — it emits `ask`; cancellation is the harness's signal handling.

### 4. no approval service → deny (fail closed) — **PASS**

- Harness mapping: `index.ts:1702-1708` — `ctx.get('approval')` undefined returns `deny` using the plugin's own `ask.reason` verbatim, or `tool "<name>" requires approval (not yet supported)` when the ask carried no reason.
- Observed: `tools.spec.ts:711-721` (reason forwarded, `Error: needs approval`) and `:723-732` (no-reason fallback) both pass.
- A closely related fail-closed path is also covered: service mounted but no answerer → `'unavailable'` → `tool "<name>" requires approval, but no approval channel is available` (`index.ts:1732-1735`, observed at `tools.spec.ts:832-839`).
- Plugin: **correct** — it does not need to know whether a channel exists; the harness degrades safely.

### 5. agent-less exec → deny — **PASS at the harness layer, NOT REACHED from this plugin — gap**

- Harness mapping: `index.ts:1709-1714` returns `deny` with `tool "<name>" requires approval, but the call has no agent to route it through`, and asks nobody. Observed: `tools.spec.ts:841-854` passes, asserting `asked === false`.
- **But the plugin never raises that ask.** In the `tools/pre-execute` handler, `policyFor(agent)` returns `undefined` for an agent-less execution (`src/plugin.ts:390-391`), and the handler takes `return next()` before consulting the gate (`src/plugin.ts:422-423`). `next()` resolves to the harness waterfall terminus `{ kind: 'allow' }` (`index.ts:1484`), so `gate.kind === 'ask'` is false and `serviceAsk` is never entered.
- **Consequence:** an agent-less tool call is allowed through the feature-loop gate unreviewed. The harness's agent-less deny is real but unreachable via this plugin. This is the one place where the plugin's behavior differs from the path as stated.
- Plugin: **the deny is not the plugin's to produce, so this is not a defect in the ask-mode change** — but the claimed fail-closed property does not hold for `agent === undefined`, and the code comment at `src/plugin.ts:380-389` ("Building on demand means the gate fails closed: an unseen agent gets the deployment's real policies, not a pass") covers only the agent-present-and-unseen case. It names "a resumed session, or a nested dispatch" as the reason to build on demand; if either ever yields an undefined agent, that comment's guarantee is false and the call passes ungated. Worth an explicit decision by the Lead: either accept the pass-through, or return the deny from the plugin for `agent === undefined`.

## The exact string a human would see

The Web approval composer renders the ask's `reason` as the panel headline: `$DSH/packages/client/ui-approval/src/client/ApprovalPanel.tsx:41` —

```
{pending.reason ?? t('escalation', { toolName: pending.toolName })}
```

The plugin supplies a reason, so the panel shows `pending.reason` verbatim. That string is `reviewText(reason, source)` (`src/messages.ts:89-95`), wrapped around the gate's own line (`src/review.ts:156-160`). For an irreversible tool named `write_file` it is exactly:

```
REVIEW REQUESTED (policy): write_file: irreversible is always approved by a human.
A human should review this before the loop goes further. Do not start work that depends on it;
if the step was not consistent with the goal, stop and report what you have instead.
```

The reason text is propagated unchanged to the answerer (`index.ts:1719`, forwarded as `reason` at `ui-approval/src/client/index.ts:49`) and to the audit event (`user-approval/src/index.ts:222`).

Button labels and chrome come from the locale dictionary `$DSH/packages/client/ui-approval/src/client/locales.ts`: `Waiting for approval` (`:17`), `Reject` (`:20`), `Allow once` (`:21`). Only two outcomes are offered by the panel — `'allowed-once'` and `'rejected'` (`ApprovalPanel.tsx:26`); `'cancelled'` arises from aborting the request or the call, not from a button.

## Deployment caveat: in *this* session the ask does not reach a human

This does not contradict the mapping above, but it decides whether a prompt appears at all, so it belongs in the verdict.

`$DSH/packages/bundle/base/cordis.patch.yml:231-234` mounts the approval service with its policy chosen by environment:

```
- id: approval
  name: '@deepseek-ai/dsh-user-approval'
  config:
    policy: !!js "(process.env.DSH_PERMISSION_MODE ?? 'workspace-write') === 'danger-full-access' ? 'never' : 'ask'"
```

`DSH_PERMISSION_MODE` is `danger-full-access` in this session, so the policy is `'never'`. That value is not advisory: `ApprovalService.decide` returns `'rejected'` before dispatching any answerer (`$DSH/packages/interaction/user-approval/src/index.ts:263-268`, with the rationale that only the service's own request path can guarantee it regardless of listener order). `permission-presets` encodes the same pairing — preset `danger-full-access` → `approval: 'never'` (`$DSH/packages/interaction/permission-presets/src/index.ts:190-193`), preset `workspace-write` → `approval: 'ask'` (`:186-189`), and the Auto preset is `danger-full-access` + `never` (`:83-86`).

**Net effect in this deployment:** a feature-loop `ask` resolves `'rejected'` deterministically and the model is told `Error: the user rejected tool "<name>"` — no panel, no human, and a message that attributes the refusal to a user who was never asked. The prompt is reachable only when the session runs under a policy of `'ask'` (for example `DSH_PERMISSION_MODE=workspace-write`, or an explicit per-session switch via `setApprovalPolicy`).

## Not verified, and why

- **No browser prompt was observed in this verification.** I did not run the `dsh web` GUI, so the panel's rendering for this plugin's own request is read from source. (The panel component's rendering is independently covered — see `VERIFY-PANEL-EVIDENCE.md` — but not with this plugin's reason string in a live session.)
- **The plugin half of paths 1-4 is not observable in-process.** My test asserts only the `PreToolDecision` the plugin returns. The approval-outcome mapping and the materialized tool result live in the harness, so for those steps I rely on the harness's own specs (observed passing) plus the source quotes above — not on a test I authored.
- **`ask` raised while no turn is open throws.** `approval.request` rejects before appending when the session has no open turn (`user-approval/src/index.ts:210-216`). That rejection is caught by `prepareExecution`'s outer `catch` (`index.ts:1513-1515`) and becomes a tool error rather than a denial. I did not drive this path.
- **The `'never'` path in a real end-to-end feature-loop run was not exercised.** The two halves were verified separately, and the policy finding above is inferred from source plus the harness's `never` specs, not from an end-to-end session.
