# VERIFY — How far the approval-panel RENDERING evidence gets without a human clicking

Scope: how strong can evidence for the **rendering of the approval panel** be without a human clicking in a browser?

Harness checkout `$DSH` = `/Users/linh.doan/work/harvey/freepeak/deepseek-harness`.
The panel is `packages/client/ui-approval/src/client/ApprovalPanel.tsx`.

## Verdict up front

**The panel rendering IS already covered — twice — and I did not have to write it.** The claim "the panel's own rendering has never been observed" is **false at the unit tier** and, more importantly, the repo already commits an **exact golden of the rendered panel** captured from a real browser. That is a stronger artifact than any test I could have added.

There are two independent tiers, and they sit on **different sides** of the live-delivery line:

| Tier | File | Proves | Side of the line |
|---|---|---|---|
| Unit / component | `packages/client/ui-approval/tests/ui-approval.client.spec.tsx` | `ApprovalPanel` renders reason + both buttons for a given `pending` | **Below** the line (props in, DOM out) |
| Web browser e2e (replayed) | `apps/web/tests/approval-composer.e2e.ts` + `snapshots/web/approval-composer/ui.expected.md` | the panel renders inside the **real assembled web client**, reached from a **recorded host session** | **Above** the line (host session → assembled client → panel DOM) |

The browser golden is the decisive find. Nothing needed to be added to `$DSH`.

---

## 1. What I looked for

1. Tests under `packages/client/ui-approval/` — found, ran.
2. Approval coverage under `packages/bundle/web-app/tests/` — **not** there.
3. Browser-tier approval coverage elsewhere — **found** at `apps/web/tests/approval-composer.e2e.ts`.
4. Anything renderable without a live session: fixtures, storybook, snapshots.
5. An honest statement of what a passing component test does and does not prove.

## 2. What I found

### 2.1 The package ships a component spec

`packages/client/ui-approval/tests/ui-approval.client.spec.tsx` (380 lines, 15 tests).

First line is the environment pragma:

```ts
// @vitest-environment jsdom
```

So: **jsdom**, rendered with `@testing-library/react`. The shared vitest config stays node-env; client specs opt in per file, exactly as `packages/client/AGENTS.md` prescribes.

The spec builds a `pending` from the **real** `PendingApproval` class (not a stub), and drives the panel with a hand-made props object:

```ts
function panelProps(
  pending: PendingApproval,
  renderSlot: ApprovalComposerProps['renderSlot'] = vi.fn(() => null),
): ApprovalComposerProps {
  const messages: Record<string, string> = {
    waiting: 'Waiting',
    'detail.aria': 'Approval details',
    escalation: `Tool ${pending.toolName} asks`,
    reject: 'Reject',
    allowOnce: 'Allow once',
  }
  return { matched: pending, renderSlot, t: (key: string) => messages[key] ?? key } as unknown as ApprovalComposerProps
}
```

and the `pending` itself:

```ts
const pending = new PendingApproval(id('s1'), {
  toolName: 'bash',
  callId: 'call-1' as ToolCallId,
  reason: 'Run this exact command',
})
```

### 2.2 The assertions that bear on rendering — verbatim

Reason headline, from the `reason` field (`ApprovalPanel.tsx:41`, `{pending.reason ?? t('escalation', …)}`):

```ts
expect(screen.getByText('Run this exact command')).toBeTruthy()
```

Fallback headline when `reason` is undefined (`t('escalation', { toolName })`):

```ts
expect(screen.getByText('Tool bash asks')).toBeTruthy()
```

Both buttons, by accessible role and name:

```ts
fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
…
expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Reject' }).disabled).toBe(true)
expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Allow once' }).disabled).toBe(true)
```

Each button resolves the **real** pending result, not a mock:

```ts
await expect(pending.result).resolves.toBe('rejected')
…
await expect(pending.result).resolves.toBe('allowed-once')
```

The correlated-detail child slot renders and is invoked with the call id:

```ts
expect(screen.getByText('pnpm run test')) // rendered as <code>pnpm test</code>
expect(renderSlot).toHaveBeenCalledWith('conversation.approval.detail', { callId: 'call-1' })
```

The scroll group carries its accessible name:

```ts
expect(screen.getByRole('group', { name: 'Approval details' })).toBeTruthy()
```

The consumer half also proves the slot registration binds **this** component with a selector keyed on the pending object — i.e. the composer-takeover wiring:

```ts
expect(component).toBe(ApprovalPanel)
expect(options.select({ pendingInteraction: undefined })).toBeNull()
expect(options.select({ pendingInteraction: pending })).toBe(pending)
```

### 2.3 The browser golden — the strongest artifact in the repo

`apps/web/tests/approval-composer.e2e.ts` is a Playwright **chromium** test in the web lane (`vitest.web.config.ts`, include `apps/web/tests/**/*.e2e.ts`). It launches the real web scaffold, replays a **recorded host session** (`snapshots/web/approval-composer/session.v3.jsonl`), and captures a stable ARIA snapshot of the live panel element `[data-approval-key]`.

The committed golden `snapshots/web/approval-composer/ui.expected.md` is 4 lines — the **entire rendered panel**, verbatim (reason abbreviated here; the file is full-length):

```
- text: Waiting for approval
- group "Approval details": "escalate sandbox to workspace-write: Need to write the notes.txt file as requested by the user. echo 'tok63z tokc7y … tokwnx' > notes.txt"
- button "Reject"
- button "Allow once"
```

This is the panel's rendering, observed in a real browser: waiting strip, headline carrying the reason, accessible group, and both buttons — with the CSS-module hashes resolved to roles and text.

And I verified the headline is not a stale hand-edit — it is the fixture's reason **verbatim**. From the recorded session:

```json
{"type":"approval/asked","data":{"id":"{{approval:1}}","toolName":"bash","callId":"approval-write","reason":"escalate sandbox to workspace-write: Need to write the notes.txt file as requested by the user."}}
```

Programmatic check: `fixture_reason in golden_content` → **True**. The reason string is produced at `packages/sandbox/sandbox/src/escalation.ts:174` (`` reason: `escalate sandbox to ${mode}: ${justification}` ``), flows through `approval/asked`, and lands in the golden headline — one unbroken chain.

The e2e also asserts **above** the golden, on the live DOM (lines 111–117):

```ts
expect(geometry.buttons).toBe(2)
expect(geometry.scrolls).toBe(true)
expect(Math.abs(geometry.capped - composerCap)).toBeLessThan(1)
expect(geometry.actionsTop).toBeGreaterThan(0)
expect(geometry.actionsBottom).toBeLessThanOrEqual(geometry.viewport)
```

and the answer path end to end (lines 122, 132–135): clicking `Allow once` produces `approval/decided` containing `allowed-once` and writes the escalated file.

The golden comparison is an **exact** `toBe` against the committed file (`scaffold.ts:1605`):

```ts
expect(payload).toBe(await readFile(goldenPath, 'utf8'))
```

with a missing golden failing loudly rather than self-bootstrapping.

## 3. What I ran

Recorded DSH state before: `git status --short | wc -l` → **12** (pre-existing agent-team edits by another teammate; none mine).

**Tier 1 — targeted component spec (ran, PASSED):**

```
npx vitest run packages/client/ui-approval/tests/ui-approval.client.spec.tsx --reporter=verbose
```

```
 ✓ ApprovalPanel > renders fallback copy without detail and returns rejection 419ms
 ✓ ApprovalPanel > renders correlated detail and returns allow-once 51ms
 ✓ ApprovalPanel > re-enables actions when answering fails 87ms
 ✓ package entries > declares its service edges and keeps the Host half inert 1ms
 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  9.65s
```

All 15 pass, including the 3 `ApprovalPanel` rendering tests. No build was required — the source plane resolves through tsconfig `paths`.

**Tier 2 — targeted browser e2e (ran, FAILED on environment, not on rendering):**

```
npx vitest run --config vitest.web.config.ts apps/web/tests/approval-composer.e2e.ts --reporter=verbose
```

Two independent blockers, both environmental:

```
Error: browserType.launch: Executable doesn't exist at …/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell
```

```
AssertionError: Web replay fixture …/snapshots/web/approval-composer/session.v3.jsonl must match one live root session:
expected [] to have a length of 1 but got +0
```

plus the cascade `llm-replay: fixture not fully consumed — 1 recorded script(s) never bound to a live session`.

Diagnosis, confirmed rather than assumed:
- The Playwright cache holds `chromium-1228` but **not** `chromium_headless_shell-1228`, which is what this spec launches. Playwright 1.61.1 is installed. Fix: `npx playwright install chromium` — a network download I did not perform, since `$DSH` must be left untouched.
- The second failure is a **cascade**: with no browser, the scaffold never drives the session, so no live session matches the fixture's prompts. It is not evidence the fixture is wrong.
- A related staleness fact: `apps/web/dist/index.html` is from Sep 22, and the web lane's `pnpm run test:web` normally runs `pnpm run build` first. A stale prebuilt `dist` would serve old client code. This lane therefore needs a **build precondition**, which I deliberately did not kick off.

Recorded DSH state after: `git status --short | wc -l` → **12**. **Unchanged.** No file under `$DSH` was modified; nothing on ports 3081/3096/3097/3099 was touched.

## 4. Where the boundary actually is

The task asked me to be precise about this line. It turns out the repo has evidence on **both sides**, so the line falls *between the two tiers*, not in front of them:

```
[host session]  --recorded-->  [llm-replay]  -->  [assembled web client]  -->  [ApprovalPanel DOM]
     ^^^^^^^                                  ^^^^^^^^^^^^^^^^^^^^^^^^        ^^^^^^^^^^^^^^^^^^
     fixture exists                            NOT re-verified by me          golden exists, committed
     (approval/asked reason)                   (needs build + browser)        (reason + 2 buttons)
```

- **Tier 1 (ran green) — below the line.** A passing component test proves `ApprovalPanel` renders the reason and the two buttons for a given `pending`, and that clicking them settles the real `PendingApproval`. It does **not** prove delivery from a live session to that component: the props object and the `t` dictionary are hand-made in the spec.
- **Tier 2 (exists, not re-run by me) — above the line.** `approval-composer.e2e.ts` *does* exercise the full path: recorded host session → replay → assembled client → real panel DOM → golden. The committed `ui.expected.md` is produced by that path, so the artifact is genuine end-to-end evidence. What I could not do in this environment is **re-execute** it to re-confirm it is still green today.

So the honest characterization is: **the gap is not "the panel was never rendered" — it is "the browser lane has not been re-run on this machine."** The evidence for rendering already exists and is committed; its freshness is what is unverified.

### Is the golden trustworthy if I did not re-run it?

Reasonably, with one stated caveat. Supporting facts: the golden's headline is the fixture reason verbatim (checked programmatically); the comparison is an exact `toBe` against the committed file, so any rendering drift since Sep 21 would have shown up the next time CI ran the lane on a matching checkout; Linux PR CI pins `DSH_SNAPSHOT=replay` and compares these goldens. The caveat: a committed golden cannot distinguish "re-verified this week" from "recorded once in September and never re-run locally." Only running the lane settles that, and running it needs the two fixes below.

## 5. What WOULD close it — and it is not a new test

Because the coverage already exists, the right next step is **not** authoring test files. It is executing the lane that already asserts this. Two concrete prerequisites, both outside `$DSH`'s current state:

1. `npx playwright install chromium` — supply the missing `chromium_headless_shell-1228`. Network download.
2. Ensure `apps/web/dist` is current, since the lane serves the built client — i.e. `pnpm run build` (or accept stale artifacts knowingly).

Then:

```
DSH_SNAPSHOT=replay npx vitest run --config vitest.web.config.ts apps/web/tests/approval-composer.e2e.ts
```

Expected: the golden `ui.expected.md` matches and `geometry.buttons === 2`. Requirement 1 alone does not fix the run; requirement 2 is the staleness precondition. Without `DEEPSEEK_API_KEY` the replay mode is keyless, so no credentials are needed.

### If someone insists on a *new* file anyway

This is the fallback, not the recommendation, and it would only re-cover Tier 1, which is already green. For completeness, the shape that would match repo convention:

- **File:** `packages/client/ui-approval/tests/ui-approval.client.spec.tsx` — extend the file that already exists; do **not** add a second spec, and do **not** widen the package's public API (client-plugin export discipline forbids exporting internals for tests).
- **Environment:** first line `// @vitest-environment jsdom`.
- **Component:** `packages/client/ui-approval/src/client/ApprovalPanel.tsx`.
- **`pending` prop shape:** `ApprovalPanel` takes `ApprovalComposerProps`; the relevant member is `matched: PendingApproval`, constructed as `new PendingApproval(sessionId, { toolName, callId?, reason?, signal? })`, plus a `renderSlot` stub and a `t` stub.
- **Helper/environment model:** copy `panelProps(...)` from this very spec — it is the established pattern. A simpler reference spec for the same conventions is `packages/client/ui-session/tests/ui-session.client.spec.ts`.
- **Run:** `npx vitest run packages/client/ui-approval/tests/ui-approval.client.spec.tsx`.

Adding this would raise the test count and lower the value; the honest move is to run Tier 2.

## 6. Summary

| Question | Answer |
|---|---|
| Tests in `packages/client/ui-approval/`? | **Yes** — `tests/ui-approval.client.spec.tsx`, jsdom, 15 tests |
| `packages/bundle/web-app/tests/` covers approval? | **No** |
| Ran the component spec? | **Yes — 15/15 passed**, incl. 3 `ApprovalPanel` rendering tests |
| Reason headline asserted? | **Yes** — `expect(screen.getByText('Run this exact command')).toBeTruthy()` |
| Reject / Allow once asserted? | **Yes** — by accessible role and name, plus disabled-state |
| Composer takeover asserted? | **Yes** — `expect(component).toBe(ApprovalPanel)` and the selector |
| Renderable without a live session? | **Yes** — plus a committed browser golden of the whole panel |
| Browser tier re-run? | **No** — missing `chromium_headless_shell-1228`; stale `apps/web/dist` |
| `$DSH` left untouched? | **Yes** — `git status --short \| wc -l` = 12 before and after |

**The gap is narrower than assumed: rendering evidence exists at both the component tier and a committed browser tier. What is unverified is the browser lane's freshness, blocked by a missing Playwright headless-shell binary and a stale web build — not by any missing test.**
