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
 * @module dsh-feature-loop/watcher-ttl
 */
export const WATCHER_TTL_MS = 15_000
