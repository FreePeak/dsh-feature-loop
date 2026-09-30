# Known issues — found by testing the plugin in a real DSH instance

Everything below was found by running the plugin in a live harness, not by
reading code. Each entry says what you observe, why it happens, and what fixes
it. Everything found by running it is now fixed; what remains below is the
environment list, which is about the machine rather than the product.

The headline: **an approval that appears not to work is usually not the gate.**
In every case observed here the gate was either never loaded at all, or loaded
and correctly refused for a reason that had nothing to do with the approval UI.

---

## Fixed

### 0. The plugin was installed but composed nothing

**Observed:** the `web` profile declared `@freepeak/dsh-feature-loop` as a
dependency and booted 191 rows — none of them from this package. No Feature Loop
page, no gate, no ceiling. The plugin was present in `package.json` and absent
from `--dump-config`.

**Why:** `dsh plugin add` installs the dependency and does not add the package to
the profile's `dsh.profile.bundles`. A plugin composes **only** when it is listed
there. This is the same shape as the peer-resolution failure below, and it is
worse: the peers resolved, so every existing check passed.

**Fix:** `make install` now runs `scripts/add-bundle.mjs`, which appends the
package to that array — idempotently, and touching only that one array so the diff
is the change rather than a reformat. Verified on the `web` profile: 191 → 194
rows, all three `feature-loop*` rows composing, zero incompatible-row warnings.



### 1. The stylesheet restyled the whole host UI

**Observed:** after the dashboard was folded into the DSH UI, the host's `<body>`
background, `<header>`, every `<h2>` and every `<button>` were restyled by the
plugin.

**Why:** `web/shell.css` was written when the dashboard owned its own origin,
where `body`/`header`/`main`/bare `button` rules were correct. It rode along
inside the client bundle into the harness's `<head>` unchanged.

**Fix:** every rule is anchored to `.fl-page` (the page inside the DSH UI) or
`.fl-standalone` (the standalone page, which now marks its own `<html>`).
`:where()` is the scope prefix so specificity is unchanged. See PR #23 and
`test/css-scope.test.ts`, which fails if a bare type selector returns.

### 2. "Start a loop" listed sessions, not the opened workspace

**Observed:** the picker listed every session in every project and fell back to
the most recently touched one — routinely a different repository.

**Why:** a run's blast radius is a *directory*, and the control asked the user to
reason about transcripts to decide which checkout gets edited.

**Fix:** the target is the Workspace the user has open, derived the way the
sidebar derives it (`retainedBy.mainView`, then the owning workspace), and
workspace → session is resolved by the host's `uiWorkspace.connectWorkspace`.
With several workspaces and none open, submit is blocked and says why. PR #23.

### 3. The injected stylesheet was never removed

**Observed:** a profile with `patchReload: live` accumulated one copy of the
plugin's stylesheet per reload in the host's `<head>`.

**Why:** `apply()` appended the tag and returned a disposer that only tore down
the remote mount.

**Fix:** the tag is owned by an `ctx.effect` with a `remove()` teardown, the
same ownership the host's own theme sheets use. PR #23.

### 7. The dashboard page was only a watcher half the time

**Observed:** an approval raised while the Feature Loop page was open and
polling appeared in the composer instead — from the page you were watching,
which reads as a flaky gate.

**Why:** `web/app.tsx` re-read live state every 30s as a safety net, and that
read is exactly what calls `noteWatcher`. The registry only counts a front end as
watching for 15s (`WATCHER_TTL_MS`). So the page was a watcher for 15s out of
every 30, and a gate firing in the gap lost the claim to the composer panel.

**Fix:** the interval is now derived from the TTL (`WATCHER_POLL_MS`), and the
TTL moved to `src/watcher-ttl.ts` so the two cannot drift — it could not live in
`approvals.ts`, which imports `node:crypto` and cannot enter a browser bundle.
`test/dashboard.test.ts` asserts the interval the page actually schedules.

---

## Environment — the one that breaks everything silently

### 4. The plugin's peer dependencies were unresolved, so its module never imported

**Observed:** the plugin appeared installed — it was in the boot graph, its
`cordis.patch.yml` composed, `--dump-config` showed all three rows — and it did
absolutely nothing. No gate, no review, no approval. The loop just ran with
default permissions.

**Why:** the built plugin imports two packages at runtime:

```
@deepseek-ai/dsh-llm               (boundContextSummary, createUserMessage)
@deepseek-ai/dsh-typert-protocol   (Remote)
```

Both are `peerDependencies`, both optional, and `.npmrc` sets
`auto-install-peers: false` — so pnpm never installs them. In a profile where
nothing else supplies them:

```
ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-llm'
```

The loader creates the row, the import throws, the fiber never constructs, and
`apply()` never runs.

**The trap:** the client bundle still appears in the boot graph, because
`client-modules` reads `dsh.client` from `package.json` **on disk** and never
imports the module. A graph row proves an entry *name* exists — it is not proof
the plugin works.

**Fix (profile-level):** something in the profile must supply the harness
packages. The main `web` profile does this by also depending on
`@deepseek-ai/dsh-experimental-agent-team-profile`, which pulls the harness
packages into the shared pnpm store. You can see it in the store key:

```
@freepeak+dsh-feature-loop@file+…dsh-feature-loop                              # peers NOT resolved
@freepeak+dsh-feature-loop@file+…dsh-feature-loop_@deepseek-ai+c_q7p3s2fiohg…   # peers resolved
```

Two further gotchas when building such a profile by hand:

- **Use the same pnpm major as the lockfile.** `pnpm@11` silently re-resolved a
  v9 lockfile and dropped the peer wiring. `npx pnpm@9.15.9 install --frozen-lockfile`
  reproduced the working install.
- **Boot a named profile without an app argument.** `bin.js --profile X --port N`
  boots X's bundle tree. `bin.js web --port N` boots the default web app and
  ignores the profile's bundles — the plugin composes in `--dump-config` and is
  still never mounted.

**How to check in one second:** if the plugin's client row is in the boot graph
but nothing behaves differently, the module is not importing. Compare the pnpm
store key for a `_@deepseek-ai+…` suffix.

---

## Fixed (2026-10-01) — the environment set, plus the four it was hiding

### 10. Every demo command had been broken for six days of commits

**Observed:** `bash demo/run.sh` — the command the README opens with, and the
proof that the loop reaches `goal-met` in one command — failed with
`ERR_MODULE_NOT_FOUND: …/src/cli.ts`.

**Why:** commit `633c1e2` ("Fold the HITL dashboard into the DSH UI") deleted
`src/cli.ts` as a side effect of a change to something else. `demo/run.sh` kept
pointing at the deleted path, and so did all four npm scripts (`demo`,
`demo:steps`, `demo:cost`, `demo:nojudge`). Nothing referenced it from a test,
the typecheck list, or CI — because `src/` is a hand-listed set and the deletion
was consistent with it.

**Why it survived six days of commits:** the one thing that would have caught it
is a run, and every run in that window was `npm test` or a profile check. A demo
that cannot run is not a failing test; it is an absence of one.

**Fix:** the entry point is back as `demo/cli.ts` — the demo's, not the
published package's, since `src/` is the plugin's import closure and the CI
typecheck list is derived from what is in it. All four commands re-run against
the real model:

| Command | Outcome | Steps | Cost |
|---|---|---|---|
| `bash demo/run.sh` | `goal-met` | 6 of 15 | $0.0039 |
| `bash demo/run.sh --max-steps 6` | `budget-stop` (step ceiling) | 6 of 6 | $0.0031 |
| `bash demo/run.sh --budget 0.000001` | `budget-stop` (cost ceiling) | 2 of 15 | $0.0004 |
| `bash demo/run.sh --judge none` | `goal-met` | 4 of 15 | $0.0024 |

`scripts/check-typecheck-list.mjs` now also fails if `demo/cli.ts` goes missing
or if `run.sh` stops referencing it — the check that would have caught it,
attached to the one job already responsible for "what is checked by what".

## Fixed (2026-10-01) — the environment set, plus the three it was hiding

### 8. A ladder rung naming an undeclared model is not a config smell — it is a dead run

**Observed:** the container's loop started, the dashboard recorded the run
(`route: onegw/execution`, `step: 1`, spend metered), and then:

```
pi-ai provider "onegw" has no configured model "execution"    (UNKNOWN_MODEL)
```

**Why:** `execution` **is** a gateway alias — `/v1/models` returns it. But
**llm-pi-ai resolves a ladder rung against the provider profile's own `models:`
list, not against the gateway.** A deployment that never declared that id makes
the rung unreachable, and the run dies on step 1 with the dashboard already
showing a healthy-looking run. Nothing errors at boot; nothing errors at config
load; `validateSpec` is happy because the spec is internally consistent.

**Why it is not one deployment's mistake:** the same rung was in the shipped
`cordis.patch.yml` that every deployment inherits, and in the profile
`scripts/make-profile.sh` generates. Fixing only the container would have left
the local profile shipping the same dead rung.

**Fix:** all three now name ids their own provider profile declares, and the
`prices:` table keys the same `provider/model` strings the ladder uses — the
second half mattered just as much, because a price keyed by anything else left
the route the loop actually took unpriced (`unpricedSteps: 1` against a ceiling
that can then never stop anything).

`scripts/check-ladder-models.mjs` now fails on any shipped spec with a rung that
is undeclared, unpriced, or priced-but-unused. It ran on the repository as it
stood and fired on `cordis.patch.yml` immediately, which is the cheapest
possible proof that the check earns its place.

## Fixed (2026-10-01) — both open warts

### 5. `POST /api/approvals/:id` ignored the query token — **fixed**

**Observed:** a scripted approval using `?token=…` got
`401 missing or invalid dashboard token` while every read route accepted the
same query token.

**Why:** the settle route called `authorized(req, url, false)` — `allowQuery`
was `false` — so it took the token from the `x-dashboard-token` header only.
The read routes passed `true`. The two halves of one five-route API disagreed
about how to authenticate, and the failure was a 401 that reads as "wrong
token" when it means "wrong *mechanism*".

**Fix:** `authorized()` no longer takes the flag — every route accepts the
query token, header first. What the flag bought was nothing: the header token
sits in the same `curl`, and the real guard against a browser reaching across
an origin is `sameOrigin`, which still runs on the settle route and is still
asserted by a test with `origin: http://evil.example`. `test/dashboard.test.ts`
pins both halves: a query-token POST settles the ask, a no-token POST is still
401, and a query token from another origin is still 403.

### 6. Only an SSE client counted as a "watcher" — **fixed**

**Observed:** polling `GET /api/state` every second never let the registry
claim an ask, so in a headless run the gate's `ask` was refused with
`tool "write" requires approval, but no approval channel is available` — the
page was right there, polling, and still invisible to the claim.

**Why:** `noteWatcher()` was called only from the `/api/events` SSE handler.
A `/api/state` poll was not a watcher. The suggested fix was left undone with
the note that widening the precedence rule "risks stranding asks" — which is
true of the *silent* version and false of this one, because the client is now
told.

**Fix, both halves:** `/api/state` registers the heartbeat (the same
`noteWatcher()` the SSE route and the in-UI page's `live()` already call), and
the response carries `watching`. A client can now ask "am I currently eligible
to answer?" instead of discovering it when a gate refuses an ask minutes later.
The stranding case is bounded exactly as before — the 15s `WATCHER_TTL_MS` and
the `unavailable` settle — and `answers: false` still never registers a
heartbeat, so observe-only stays observe-only.

---

## Verified working (2026-09-29, live instance on :3188)

### The human input path, in a real browser

Driven over the Chrome DevTools Protocol (headless `--dump-dom` never returns
on this app: it holds a stream open, so the load event never settles).

| Check | Result |
|---|---|
| Feature Loop page renders | `.fl-page` present, "START A LOOP" |
| Task input + submit | input and "Start loop" button present |
| Target is the **opened workspace** | `Runs in "default-workspace" — /Users/.../default-workspace` |
| Dashboard renders | workspaces / approval thread / runs, with the pending-ask panel |
| Host chrome untouched | host `button` radius `0px`, host `h2` normal size |
| Plugin stylesheet mounted | `<style data-plugin="@freepeak/dsh-feature-loop">` in the DOM |

The last two rows are the live confirmation that issue 1 is actually fixed: on
the pre-fix build the same probe measured `999px` and `12px uppercase` on the
host's own chrome.

### The full HITL cycle, headless, against a real model

`~/.dsh-flt3188/profiles/flt-hl/hitl_cycle.py` holds `GET /api/events` open
(the watcher signal) and settles the ask over `POST /api/approvals/<id>`.

| Outcome | Gate | Decision | Result on disk | Verdict |
|---|---|---|---|---|
| `allowed-once` | fired | `{"ok":true,"outcome":"allowed-once"}` | file created, contents `hello` | **pass** |
| `rejected` | fired | `{"ok":true,"outcome":"rejected"}` | no file | **pass** |

Gate reason string, verbatim from the live run:

```
REVIEW REQUESTED (policy): write: irreversible is always approved by a human.
```

### The HITL cycle in a real browser, both directions

Driven over CDP against the :3188 instance: type a task, press **Start loop**,
the gate intercepts the model's `write`, the card appears, a human clicks.

**Allow**

| | |
|---|---|
| Card | `APPROVAL REQUIRED` — `write`, `REVIEW REQUESTED (policy): write: irreversible is always approved by a human.` |
| Controls | **Allow once** / **Reject** |
| Before click | `/tmp/fl-ui-proof.txt` **does not exist** — the call is genuinely gated |
| After click | thread `1 → 0`, card cleared, file written, contents `ui-proof` |

**Reject**

| | |
|---|---|
| Card | same card, at step 1/15 |
| After click | feed records `APPROVAL rejected: write`, thread `0`, **no file** |

Both runs reported `ROUTE ONEGW/EXECUTION`, live spend, and a judge score
(`0.9833/3`, `1.2289/3`) — the meters are real, not placeholders.

### Two things that made this hard to reach

**A patch entry for `id: feature-loop` REPLACES the whole config.** It does not
merge. A partial override — the natural thing to write when you only want to
change one policy — silently deletes `spec`, and a spec-less policy builds no
gate at all: every tool call proceeds and the loop looks perfectly healthy while
reviewing nothing. I hit this myself and lost a cycle to it. Override the whole
row, or none of it.

**`gatePolicies` is keyed by TOOL NAME, and `auto-if-confident` proceeds when
the judge is confident.** This was the shipped default for `write`, with a
working local judge, so writes were routinely auto-approved and a human saw no
approval at all. The throughput posture is real — a judge that clears
confident steps is the feature, not a bug — but as the *first* thing a new user
 sees it reads as "the gate is broken", when it was working exactly as
configured. **`write` is now `always-approve` in both shipped configs**
(`cordis.patch.yml` and `docker/profile.patch.yml`); `edit` stays
`auto-if-confident`. Put `write: auto-if-confident` back when you trust the
judge; nothing else changes.

### The browser click path, and the page's own geometry (2026-09-29, live on :4100)

A fresh isolated instance — `DSH_HOME=$HOME/.dsh-flt-4100`, profile `flt4100`,
plugin installed from a worktree by `file:` path, peers resolved — then driven
over CDP against a real model. The run was started from the plugin page's own
composer, and the decision was made by clicking the card's own button. No
scripted API in the loop.

| Check | Result |
|---|---|
| Start a run from `.fl-start-input` | the loop runs; the gate raises on `write` |
| Card in the in-UI thread | `REVIEW REQUESTED (policy): write: irreversible is always approved by a human.` with **Allow once** and **Reject** |
| **Allow once** (clicked) | tool ran, file written, contents `hello` |
| **Reject** (clicked) | `tool "write" requires approval…` — no file, byte for byte |
| Two gates in one run | a `write` then a `bash`; both settled, both took the click |
| Registry after the click | pending count 0 within 4s, in every case |
| Contrast, every text node on the page | 14/14 pass WCAG AA against the surface each one sits on |
| Responsive at 760–1440px | the dashboard collapses to one column, then two, then three; no horizontal overflow |

One thing about the reject branch, because it looks like a bug in the browser
and is not: after the click, the card stays on screen for about four seconds and
then disappears. It is not stuck. The registry is cleared immediately (pending
count 0 within one poll), and the card is unmounted by the next remote read, so
the visible card is simply the last frame the thread rendered before the new
arrived. A card still showing a *second* poll after the click is a real
re-raise, and the feed names it.

The page's geometry had drifted from the harness's own pages in nine measurable
ways; see the table in `CHANGELOG.md` under "The plugin page is now drawn with
the harness's own metrics". Three of them were defects rather than taste, and
one of those is the reason a reviewer would have seen 40px buttons on a page
that asked for 32px: `shell.css` still had a bare `button` rule. That rule is
invisible to `css-scope.test.ts` — it is anchored — so `test/css-parity.test.ts`
is what holds it gone.

### The page was taller than the window on every small window

**Observed:** at a small window the page needed scrolling to reach the approval
card, and the plugin page behaved differently from the harness's own pages in the
same column.

**Why:** `shell.css` sized three page-height rules in `vh`. The page is the
centre COLUMN, so the window's height is not the page's height — the window also
carries the host's sidebar (56px collapsed, 280px open) and the frame's top
clearance, and that gap widens as the window narrows. Two of the three were
floors, and a floor is the worst direction for this: the approval thread's
`min-height: min(70vh, 720px)` resolved to 334px at a 480x560 window with the
page's furniture already taking 384px above it, leaving 176px of the thread
visible. (`min()` also took the SMALLER of its two arguments, so the `720px`
ceiling applied only below a 1029px-tall window — the range where a ceiling was
least needed, and the floor dominated everywhere else.)

**Fix:** the thread floor is `min(420px, 60cqh)`, the sticky columns take
`100cqh`, and the page root declares `container-type: size` so a container height
is queryable at all. Measured after: the thread is fully above the fold at
1280x760, 1024x700 and 820x700; at 480x560 the page scrolls to the rest, which is
what a page that is taller than the window should do.

**What is NOT the plugin's problem, and was worth measuring before changing
anything:** below 1024px the harness auto-collapses its sidebar to a 56px rail
(`ui-layout/src/client/stores.ts`, `SIDEBAR_AUTO_COLLAPSE`), which leaves the
centre column ~460px at a 520px window. Below ~600px of window the column is
narrower than the harness's own `CENTER_MIN` of 400px and the page's own
`clamp(24px, 4vw, 48px)` gutter starts to dominate. The harness's own pages
behave the same way there — the conversation page and the plugin manager were
both measured in the same 240px and 200px columns, and both overflow. The
plugin's page gutter is deliberately the harness's own, so it is not narrowed
here to compensate for a frame the harness itself does not support at that size.

### The composer was 23px wide in a narrow column

**Observed:** at a 440px window the approval composer's textarea was 23px wide,
with a 36px send button beside it. At 380px it was 8px.

**Why:** padding stacked four deep on the way from the thread's edge to the
field. `.hitl-thread-viewport` inset 16px per side, `.hitl-thread-footer` 12px,
`.hitl-composer-shell` 12px, `.hitl-composer-input` 4px — 88px gone before a
character was typed, and every one of those is a subtraction at every width, not
only a narrow one. The harness's own composer stacks two layers
(`ui-conversation/src/client/input/editor/composer-editor.module.css`: its card
insets, its editor does not) and measures 341px in the same 384px column.

**Fix:** the viewport and the footer are wrappers, so they carry no horizontal
padding, and the field takes the card's inset. One layer, 24px. Field width in
that column: **23px → 303px**, and 8px → 243px at 380px.

**Two wrong answers on the way, both worth recording.** The edge inset the
viewport used to carry has to be given back to the messages, and:

- `padding: 0 16px` on the message takes 32px out of its *content* box, so the
  text sits 16px inside a border the card draws itself — a double inset at the
  sides and none at the top and bottom;
- `margin: 0 16px 14px` on `width: 100%` moves the *box* 16px outward, because
  100% is already the parent's content width. Measured at 1280: viewport right
  edge 1226, welcome plate right edge 1242 — the card's border over the thread's.

`max-width` with `auto` sides is the property that does both jobs: it centres the
message under the thread's `--thread-max-width` and clamps to the container when
that is narrower. Asserted by value, not by pattern — a loose `margin: … auto`
match passes either side of a duplicated declaration.

### The activity pane grew to its content below 760px

**Observed:** at a 744px page with 11 activity entries, the page scrolled 1483px
past the approval thread to reach the end of the feed.

**Why:** the `max-width: 759px` query releases `.sidebar`/`.rail` to `position:
static; height: auto; overflow: visible` — right for a sticky column, which is
meaningless once the page is one scroll. But it also released the panes inside
them, and a pane is `overflow: hidden` with no cap, so it sized to its content.
`.pane-scroll` is `flex: 1 1 auto; min-height: 0` inside a bounded parent, so in
the two-column layout the parent's cap was what bounded it; released, nothing
did.

**Fix:** the panes keep `max-height: calc(100cqh - var(--header-h) - 28px)` and
scroll inside their cards — a list that scrolls in its card is what the wider
layouts already do. Measured with 6 entries at 1024x700: page scroll 1652px
instead of 2227px, feed 481px in a 568px cap.

### The standalone page was still measuring the window

**Observed:** at a 1280x300 window the standalone dashboard's thread was sized by
60% of the *window* — 180px — with the composer 115px below the fold.

**Why:** the standalone page is the second front end onto this stylesheet, and the
whole of this branch's work was under `.fl-page`. Its thread is a direct child of
`#root`, so nothing above it was a query container, and a `cqh` with no ancestor
container resolves against the smallest container there is: the viewport. Every
other fix in this file was therefore correct on one front end and absent on the
other, which is exactly the failure mode of testing one page and calling the sheet
fixed.

**Two more traps on the way, both silent:**

- `body.fl-standalone { … }` matches **nothing**. The marker is on `<html>`
  (`src/dashboard-page.ts`), so the body is its descendant — measured
  `containerType=normal` on the live element against a stylesheet that plainly
  declared it. There is no diagnostic for a rule that does not match.
- `container-type: size` on that rule, with the `height` on `<html>` instead, put
  `html` at **0px** tall: size containment means the box cannot take its size from
  its content, and the root has no content. Every `cqh` on the page resolved to 0
  and `min(420px, 60cqh)` collapsed to 0 — the thread lost its floor entirely,
  which reads as "no floor at all" rather than as a CSS bug.

**Fix:** `html.fl-standalone body` carries the container, the `container-name`, and
`height: 100dvh` together, and `main` is the scroller. Verified at 1280x800,
1024x700, 760x700, 600x600, 440x800 and 380x760: no horizontal overflow, no element
outside its container, the composer in the viewport. At 1280x300 and 440x400 the
page scrolls and the composer is reachable (285px and 385px after scrolling) —
three panes of real content do not fit in a 300px window, and squeezing the thread
to pretend otherwise hides the composer rather than moving it.

`test/css-scope.test.ts` now fails any selector whose rightmost compound is a
document element without reaching it through `html.fl-standalone`, and pins the
container and the height on the same box.

### Still unverified

- Nothing in the two sections above. The last open item from §"Still
  unverified" — the profile-must-supply-the-peers trap of issue 4 — is now
  written down in `README.md` (installing by hand) and in `docs/SETUP.md` §Step
  2, next to the profile that would otherwise install cleanly and do nothing.

---

## Verified working

A full HITL cycle, driven end to end against a real model on a real harness:

- a model decides to call `write`
- the plugin's gate intercepts it and raises
  `REVIEW REQUESTED (policy): write: irreversible is always approved by a human.`
- a human decision arrives over `POST /api/approvals/:id`
- **allow** → the tool runs, `/tmp/fl-hitl-proof.txt` contains `hello`
- **reject** → `Error: the user rejected tool "write"`, no file created

Harness: `~/.dsh-flt3188/profiles/flt-hl` (`hitl_cycle.py`).
