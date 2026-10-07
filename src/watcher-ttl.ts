/**
 * How long a front end counts as "watching" after its last call.
 *
 * Lives in its own module, with no imports, because BOTH halves of the plugin
 * need it and they run in different worlds:
 *
 *   - `src/approvals.ts` is host-side (it imports `node:crypto`)
 *   - `web/app.tsx` is browser-side, bundled for the web target, which cannot
 *     resolve a node builtin
 *
 * Importing this from `approvals.ts` into the browser bundle would drag
 * `node:crypto` into esbuild's graph and fail the build. A bare constant keeps
 * one source of truth for the number without crossing that line.
 *
 * The coupling that matters: the in-UI page's fallback poll (`WATCHER_POLL_MS`
 * in `web/app.tsx`) is what calls `noteWatcher`, so a page polling slower than
 * this TTL is a watcher only part of the time. A gate firing in the gap hands
 * its ask to the composer panel instead, which reads, from the page the
 * operator is watching, as "the gate is flaky". `test/dashboard.test.ts` pins
 * that relationship.
 *
 * The second heartbeat is the standalone server's SSE stream, and it was
 * WRONG until 2026-10-07: it registered a watcher on connect and then pinged
 * every `SSE_KEEPALIVE_MS`, but the ping never refreshed the flag. At a 15s TTL
 * against a 25s ping the tab was a watcher 60% of the time, and an ask raised
 * in the gap went to the composer panel — which on a headless run does not
 * exist, so the turn hung at its first gated tool call. The ping now refreshes
 * the watcher, and `SSE_KEEPALIVE_MS` lives here so the two cannot drift: the
 * test asserts the interval clears the TTL.
 *
 * ponytail: a heartbeat window is still an approximation of "is a tab open".
 * The upgrade path is a streaming remote method that reports attach/detach
 * exactly, which is what `docs/PLAN-close-open-issues.md` §1 already plans for
 * the dashboard's own state.
 *
 * @module dsh-feature-loop/watcher-ttl
 */
export const WATCHER_TTL_MS = 60_000

/**
 * SSE keep-alive interval, in milliseconds.
 *
 * Lives beside the TTL it must stay under, because the two are one contract:
 * the stream's ping is the standalone server's heartbeat, and
 * `test/dashboard.test.ts` fails if the ping stops arriving inside the window
 * it refreshes.
 */
export const SSE_KEEPALIVE_MS = 25_000
