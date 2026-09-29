# Known issues — found by testing the plugin in a real DSH instance

Everything below was found by running the plugin in a live harness, not by
reading code. Each entry says what you observe, why it happens, and what fixes
it. Three are fixed; two are product warts that remain.

The headline: **an approval that appears not to work is usually not the gate.**
In every case observed here the gate was either never loaded at all, or loaded
and correctly refused for a reason that had nothing to do with the approval UI.

---

## Fixed

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

## Open — product warts

### 5. `POST /api/approvals/:id` ignores the query token

**Observed:** a scripted approval using `?token=…` got
`401 missing or invalid dashboard token` while every read route accepted the
same query token.

**Why:** the settle route calls `authorized(req, url, false)` — `allowQuery` is
`false` — so it takes the token from the `x-dashboard-token` header only. The
read routes pass `true`.

**Why it matters:** the two halves of one tiny API disagree about how to
authenticate, and the failure mode is a 401 that looks like a wrong token rather
than a wrong *mechanism*. Any non-browser client has to know the difference.

**Suggested fix:** accept the query token here too (the route is token-gated
already, and `sameOrigin` still guards the state change), or document the header
requirement in the runbook. Not changed here — it alters the security posture of
a state-changing route and deserves its own review.

### 6. Only an SSE client counts as a "watcher"

**Observed:** polling `GET /api/state` every second never let the registry claim
an ask, so in a headless run the gate's `ask` was refused with
`tool "write" requires approval, but no approval channel is available` — the
page was right there, polling, and still invisible to the claim.

**Why:** `noteWatcher()` is called only from the `/api/events` SSE handler
(`src/dashboard.ts:833`). A `/api/state` poll is not a watcher.

**Why it matters:** the in-UI page is safe (it calls the host remote's `live()`,
which notes the watcher), but the standalone page and any scripted client must
hold the stream. The source comment describes exactly this failure, which is
good, but the behaviour is a trap: "I am polling the state endpoint, surely that
counts."

**Suggested fix:** have `/api/state` note the watcher too, or return an explicit
`watching: true/false` so a client can tell whether it is eligible to answer.
Not changed here — it is a deliberate precedence rule (claim only while a real
surface is connected) and widening it risks stranding asks.

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
the judge is confident.** The shipped default is `write: auto-if-confident`
with a working local judge, so writes are routinely auto-approved and a human
sees no approval at all. That is the intended production posture — a judge that
clears confident steps is the feature, not a bug — but it means "the gate never
asks" is the expected behaviour of the shipped config, and is a poor default for
anyone expecting to see the loop work. `write: always-approve` makes it
deterministic.

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
