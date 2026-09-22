# E2E Browser Plan — driving the DSH approval panel

Evidence gathered by reading (never modifying) `$DSH = /Users/linh.doan/work/harvey/freepeak/deepseek-harness`
at checkout state `git status --short | wc -l` = 12 (unchanged before and after this investigation).

Reference implementations to copy: `apps/web/tests/approval-composer.e2e.ts` (the capped-command panel) and
`apps/web/tests/ptc-escalation.e2e.ts` (the sandbox-escalation panel). Both drive the *same* ApprovalPanel.

---

## 1. Patterns to reuse

### 1.1 Browser launch call (verbatim)

`apps/web/tests/approval-composer.e2e.ts:6`

```ts
import { chromium } from 'playwright'
```

`apps/web/tests/approval-composer.e2e.ts:43` (inside `beforeAll`, timeout `120_000` at line 50)

```ts
browser = await chromium.launch()
```

- **No** `channel`, **no** `executablePath`, **no** `args`, **no** `headless` flag → Playwright defaults
  (`headless: true`, bundled `chromium-headless-shell`).
- `ptc-escalation.e2e.ts:43` is byte-identical: `browser = await chromium.launch()`.
- Page factory — `apps/web/tests/support.ts:51`:

```ts
export async function newEnglishPage(browser: Browser, height = 1000): Promise<Page> {
  return await browser.newPage({ viewport: { width: 1680, height }, locale: 'en-US', timezoneId: 'Asia/Shanghai' })
}
```

  The region/locale pair is load-bearing: the role-name selectors below are the **English** strings, and the
  approval locale dictionary only ships them for `en`
  (`packages/client/ui-approval/src/client/locales.ts:20-21`).
- Teardown — `approval-composer.e2e.ts:52-55`: `await browser?.close()` then `await scaffold?.close()`.

### 1.2 Required environment

- `DSH_SNAPSHOT` — **optional**, resolved by `webSnapshotMode()` at `apps/web/tests/scaffold.ts:129-136`
  (called at `approval-composer.e2e.ts:28`). Unset/empty ⇒ `replay`. Legal values: `replay`, `record`,
  `refresh`; anything else throws. Replay needs **no** model key.
- `DEEPSEEK_API_KEY` — required **only** by `record` mode, enforced loudly at `scaffold.ts:465-467`
  (`web e2e record mode needs DEEPSEEK_API_KEY (env or repo-root .env)`).
- The scaffold isolates all home state itself: it mkdtemps a workspace and sets `DSH_HOME`, `DSH_AGENTS_HOME`,
  `DSH_BUNDLED_SKILL_DIR` for its lifetime (`scaffold.ts:506-520`), so replay never reads the developer's `~/.dsh`.

### 1.3 Authentication — token query param → session cookie; replay does NOT bypass auth

No Playwright `storageState`, no `httpCredentials`, no manual cookie jar. The flow, verbatim:

- `apps/web/tests/scaffold.ts:859-865` — the host mints an authenticated URL, then proves the exchange works:

```ts
    authenticatedUrl = ctx.connection.authenticatedUrl(baseUrl)
    const login = await fetch(authenticatedUrl, { redirect: 'manual' })
    const setCookie = login.headers.get('set-cookie')
    if (login.status !== 303 || login.headers.get('location') !== '/' || setCookie === null) {
      throw new Error('web e2e scaffold: browser token exchange did not return its session cookie')
    }
    cookieHeader = setCookie.split(';', 1)[0] ?? ''
```

- The mint — `packages/client/connection/src/browser-auth.ts:223-230`: takes the base origin, sets the launch
  token as the sole query input, and returns the root URL:

```ts
  authenticatedUrl(baseUrl: string): string {
    const url = new URL(baseUrl)
    url.pathname = '/'
    url.search = ''
    url.hash = ''
    url.searchParams.set(TOKEN_QUERY, this.launchToken)
    return url.href
  }
```

  `TOKEN_QUERY` is `'token'` (`browser-auth.ts:15`). `browser-auth.ts:232-239` documents the other half: a valid
  root `?token=` mints the cookie and 303-redirects to clean `/`; every other request gets a 401.
- The browser just navigates to that URL — `approval-composer.e2e.ts:46-47`:

```ts
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
```

**Consequence for the Lead:** driving the *live* GUI on `:3081` needs that same `?token=` value, which is a
process launch token (`dsh web` prints/derives it); it is not a reusable static secret. The lowest-guesswork
route is the in-process scaffold, which mints and navigates for you.

### 1.4 Workspace must be connected before typing

A fresh world has no workspace and the composer is locked. `apps/web/tests/support.ts:124-147`
(`connectFreshWorkspace`) drives the picker; the scenario calls it at `approval-composer.e2e.ts:48`
(`await connectFreshWorkspace(page, scaffold.workspaceCwd)`). It ends by waiting for the live surface
(`support.ts:141-144`):

```ts
  await page.locator('[data-composer-input][contenteditable="true"][data-placeholder="Describe what you want to build, / commands, @ files or sessions"]')
    .waitFor({ timeout: 15_000 })
```

### 1.5 Selectors — approval panel (all with file:line)

| Target | Selector (verbatim) | Source |
|---|---|---|
| Panel root / presence probe | `page.locator('[data-approval-key]')` | `apps/web/tests/approval-composer.e2e.ts:81`; also `ptc-escalation.e2e.ts:64` |
| Capped scroll region | `panel.locator('[data-approval-scroll]')` | `approval-composer.e2e.ts:83`; `ptc-escalation` equivalent inside assertions |
| **Allow once** | `panel.getByRole('button', { name: 'Allow once' }).click()` | `approval-composer.e2e.ts:122`; identical at `ptc-escalation.e2e.ts:78` |
| **Reject** | `getByRole('button', { name: 'Reject' })` | No test clicks it; the accessible name is proven by the committed golden, below |
| Reason headline | inside `[data-approval-scroll]`, `t('waiting')` + `pending.reason ?? t('escalation', …)` | `packages/client/ui-approval/src/client/ApprovalPanel.tsx:33-43` |
| Detail group (aria) | `role="group"` with `aria-label={t('detail.aria')}` | `ApprovalPanel.tsx:34-40` |

Source of the two `data-` attributes — `packages/client/ui-approval/src/client/ApprovalPanel.tsx:31,36`:

```tsx
    <div className={css.root} data-approval-key={pending.key}>
        <div
          className={css.body}
          data-approval-scroll=""
```

Both buttons are `<Button>`s in the card's action row (`ApprovalPanel.tsx:44-51`), reject first
(`variant="outline"`, `css.reject`), allow second (`variant="primary"`); both get `disabled={answered}`.
They are the **only two** buttons in the panel — `approval-composer.e2e.ts:110` asserts `geometry.buttons` is `2`.

**Do not use the CSS-module class names**: the built client hashes them. `approval-composer.e2e.ts:96-97`
states it directly — *"Role/text, not the CSS-module class names: the built client hashes those."*

English accessible names — `packages/client/ui-approval/src/client/locales.ts:17-21`:
`waiting: 'Waiting for approval'`, `'detail.aria': 'Approval details'`,
`escalation: 'Tool {toolName} requests privileged execution'`, `reject: 'Reject'`, `allowOnce: 'Allow once'`.

### 1.6 Assertion that proves the panel appeared

Two independent proofs; use both:

1. **Presence** — `approval-composer.e2e.ts:81-84`:

```ts
    const panel = page.locator('[data-approval-key]')
    await panel.waitFor({ timeout: MODE === 'record' ? 180_000 : 60_000 })
    const scroll = panel.locator('[data-approval-scroll]')
    await expect.poll(() => scroll.getByText(/tok/).count(), { timeout: 15_000 }).toBeGreaterThan(0)
```

2. **Golden ARIA snapshot** — `approval-composer.e2e.ts:87-88` (`captureStableAria` +
   `compareOrRefreshGolden(UI_EXPECTED, …)`). The committed golden
   `snapshots/web/approval-composer/ui.expected.md` is verbatim:

```
- text: Waiting for approval
- group "Approval details": "escalate sandbox to workspace-write: Need to write the notes.txt file as requested by the user. echo 'tok63z …"
- button "Reject"
- button "Allow once"
```

That golden is the authoritative confirmation of **both** button names in English.

Post-answer assertions worth copying (`approval-composer.e2e.ts:126-140`): the decision reaches the session log
(`'approval/decided'` contains `allowed-once`), the escalated command actually ran, the panel is gone
(`page.locator('[data-approval-key]').count()` is `0` at line 138), the composer re-enables (line 139), and the
console tripwire is clean (`tripwire.pageErrors` is `[]`).

### 1.7 Composer input and send action

- Input surface: `page.locator('[data-composer-input]').first()` — `approval-composer.e2e.ts:61`,
  `ptc-escalation.e2e.ts:58`, `access-confirmation.e2e.ts:96`. The stricter form used across the lane is
  `page.locator('[data-composer-input][contenteditable="true"]').last()` —
  `chat-continuous-conversation.e2e.ts:221`, `chat-long-interactions.e2e.ts:328`,
  `chat-scroll-contract.e2e.ts:542`, `composer-draft-scroll.e2e.ts:56`.
  Read-only states render `contenteditable="false"` on the same element (`support.ts:170-181` warns that
  `isEnabled()` is `true` for a `<div>` regardless, so gate on the attribute).
- Submit: `await input.press('Enter')` — `approval-composer.e2e.ts:80`. Enter submits; a typed newline is
  impossible through `writeComposerDraft`.
- Explicit send button: `page.getByRole('button', { name: 'Send message', exact: true })` —
  `chat-continuous-conversation.e2e.ts:233`, `chat-long-interactions.e2e.ts:330`,
  `chat-scroll-contract.e2e.ts:544`, `schedule-after.e2e.ts:415`, `file-upload-round.e2e.ts:277`.
  Label source: `packages/client/ui-conversation/src/client/locales.ts:187` (`'input.send': 'Send message'`).
- Prefer `writeComposerDraft` (`support.ts:184-195`) over `fill()` when the draft follows a menu/chip gesture:
  `fill()`'s batched select-all + insertText can land on a null Lexical selection and be *silently dropped*.
- Read-only escalation needs the access-mode switch first — `approval-composer.e2e.ts:70-74`:

```ts
    await page.locator('[aria-label^="Access mode"]').click()
    await page.getByRole('menuitem', { name: 'Read Only' }).click()
```

  then poll `page.locator('[aria-label="Access mode, current: Read Only"]').count()` to be `1`.

### 1.8 Minimal harness-driving skeleton

```ts
const scaffold = await launchWebScaffold({ replayFixture: FIXTURE, paceMs: 15, compareReplaySession: true })
browser = await chromium.launch({ channel: 'chrome' })      // see §2 — the only change forced on this machine
page = await newEnglishPage(browser)
tripwire = watchConsole(page)
await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
await connectFreshWorkspace(page, scaffold.workspaceCwd)
const input = page.locator('[data-composer-input]').first()
await input.waitFor({ timeout: 10_000 })
// …access mode → Read Only, then:
const settled = scaffold.whenTurnSettled(60_000)
await input.fill(PROMPT)
await input.press('Enter')
const panel = page.locator('[data-approval-key]')
await panel.waitFor({ timeout: 60_000 })
await panel.getByRole('button', { name: 'Allow once' }).click()   // or { name: 'Reject' }
const sessionId = await settled
```

`launchWebScaffold` is defined at `apps/web/tests/scaffold.ts:452`; `WebScaffold` at `scaffold.ts:275`;
`whenTurnSettled` at `scaffold.ts:889`; `watchConsole`/`captureStableAria`/`compareOrRefreshGolden` are
re-exported from `scaffold.ts` alongside it.

---

## 2. Can it run here

**The harness lane boots; the browser binary is the only blocker. Verdict: not via `chromium.launch()` as
written; yes via `chromium.launch({ channel: 'chrome' })`.**

Attempted exactly as specified (time-boxed, ~10 s to fail):

```
cd $DSH && DSH_SNAPSHOT=replay npx vitest run --config vitest.web.config.ts apps/web/tests/approval-composer.e2e.ts
```

Exact failure — `apps/web/tests/approval-composer.e2e.ts:43`:

```
Error: browserType.launch: Executable doesn't exist at /Users/linh.doan/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
 ❯ apps/web/tests/approval-composer.e2e.ts:43:30
     43|     browser = await chromium.launch()
```

Per the time-box this stopped there (no download, no build). The two follow-on failures in the same run
(`assertReplaySession` at `scaffold.ts:1119`, `llm-replay: fixture not fully consumed` at `scaffold.ts:937`)
are **teardown cascades** from a turn that never started — not independent defects. Note what *did* work:
`launchWebScaffold` completed (dist present, profiles resolved, host booted, authenticated URL minted) before
line 43 ever ran.

### Version / revision facts

| Fact | Value |
|---|---|
| `apps/web/package.json` devDep | `"playwright": "^1.49.0"` |
| Installed (resolved through `apps/web/node_modules/playwright`) | `1.61.1` |
| `playwright-core` it loads | `/Users/linh.doan/node_modules/playwright-core` → also `1.61.1` |
| Chromium revision 1.61.1 expects | `chromium` **1228** (`browserVersion 149.0.7827.55`) and `chromium-headless-shell` **1228** |
| Also present in the pnpm store | `playwright@1.63.0-alpha-2026-08-31` (unused by this lane) |

### Does `~/Library/Caches/ms-playwright/chromium-1228` satisfy it? **No.**

The directory is a **stub**, not an installation:

```
~/Library/Caches/ms-playwright/chromium-1228/
└── chrome-mac-arm64/
    └── Google Chrome for Testing.app -> /Applications/Google Chrome.app   (symlink, dated Sep 10 22:53)
```

There is **no** `INSTALLATION_COMPLETE` marker, and the executable Playwright looks for —
`chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` —
does not exist, because the symlinked bundle's macOS binary is named `Google Chrome`. `chromium_headless_shell-1228`
is absent entirely. Verified by launch probe:

```
channel:chromium => FAIL browserType.launch: Executable doesn't exist at …/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
headless:false   => FAIL (same path)
channel:chrome   => OK version=153.0.8010.53
```

### Does system Chrome satisfy it? **Yes — this is the working route.**

`/Applications/Google Chrome.app` is **Google Chrome 153.0.8010.53**. It does not match Chromium revision 1228,
but `channel: 'chrome'` bypasses `browsers.json` revision pinning entirely and resolves the installed stable
Chrome:

```
chromium.launch({ channel: 'chrome' })   →   OK, version 153.0.8010.53
```

Full probe run (also confirming a real page evaluates):

```
LAUNCH OK (channel:chrome)  version=153.0.8010.53
eval=hi
```

**Recommendation:** write the Lead's script with `chromium.launch({ channel: 'chrome' })`. Do **not** run
`npx playwright install`, and do not expect the stock `approval-composer.e2e.ts` to pass unmodified on this
machine — its hardcoded no-arg `chromium.launch()` at line 43 cannot find a browser here.

If a bundled Chromium is ever wanted, the only in-policy option is a one-line-copy workaround at launch time
(`{ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }`), which is equivalent to
`channel: 'chrome'` but pinned to a path; prefer the channel form.

### Build freshness caveat

`apps/web/dist` exists (`index.html` + `assets/` + `preview/`, mtime Sep 22 10:50) and `requireDist()`
(`support.ts:85-89`, called from `scaffold.ts:453`) is satisfied by `index.html` alone. It is **slightly stale**
against its inputs: `packages/client/file-upload/lib/**/*.d.ts` post-date `dist/index.html`. Those are *type
declarations*, which the browser bundle does not consume, so this is very likely cosmetic — but `requireDist()`
does not check freshness, and I did not rebuild (forbidden). Any assertion about *built* client output should
treat the dist as possibly one build behind; the approval panel itself is unmodified relative to the dist, since
the e2e scenarios that lock its ARIA are committed alongside it.

---

## 3. Suggested next step for the Lead

1. Author the driver outside `$DSH` (e.g. `dsh-feature-loop/scripts/`), importing nothing from `apps/web/tests`
   if a live GUI is the target — the selectors in §1.5 and the composer locators in §1.7 are the whole surface.
2. Launch with `chromium.launch({ channel: 'chrome' })`, `newPage({ viewport: { width: 1680, height: 1000 }, locale: 'en-US' })`.
3. Gate the run on `[data-approval-key]` + `[data-approval-scroll]`, click
   `getByRole('button', { name: 'Allow once' })` (or `'Reject'`), then assert the panel count returns to `0`.
4. If driving the live `:3081` GUI instead of the scaffold, resolve the `?token=` root URL from the running
   server rather than inventing one — `browser-auth.ts:223-239` is the contract; there is no cookie to borrow.

### Blockers / uncertainties for the Lead

- Chromium 1228 is a broken stub and the headless shell is missing → the harness's stock e2e run cannot pass
  unmodified here; `channel: 'chrome'` is the verified substitute (not the pinned revision, so treat it as a
  slightly different rendering engine for geometry-sensitive assertions — the panel-reachability numbers in
  `approval-composer.e2e.ts:100-120` allow sub-pixel variance only).
- `apps/web/dist` is one input-build behind (type-declaration-only drift). No rebuild was run, per constraints.
- Live-GUI auth needs the server's process launch token; the scaffold path avoids that problem entirely.

### Constraint compliance

- Wrote only this file under `$PLUGIN`. No writes under `$DSH`.
- `git status --short | wc -l` in `$DSH`: **12 before, 12 after** (identical file list).
- Did not run `npx playwright install`, download browsers, or start `pnpm build`.
- Did not touch processes/ports 3081, 3090, 3097, 3099; the only browser launched was a throwaway headless
  Chrome probe, closed immediately, on no fixed port.
