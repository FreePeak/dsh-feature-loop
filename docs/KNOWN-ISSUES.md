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

### Still unverified

- The approval card as rendered by the in-UI page, driven by a run started from
  that page's own composer. The card is present and wired (the panel reads
  "When a run reaches a review gate, the ask appears in this thread"), and the
  same registry was exercised end to end headlessly, but the browser click path
  has not been driven.
- `README`/`SETUP` do not mention that the plugin needs a profile supplying
  `@deepseek-ai/dsh-llm` and `@deepseek-ai/dsh-typert-protocol`. That is the
  single most expensive failure in this document and it deserves a doc fix.

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
