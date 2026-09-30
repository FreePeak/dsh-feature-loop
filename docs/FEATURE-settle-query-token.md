# Feature: accept query token on dashboard settle POST

## Why
KNOWN-ISSUES §5: `POST /api/approvals/:id` calls `authorized(req, new URL('/', 'http://x'), false)`,
so the real request URL (and `?token=`) is discarded and only `x-dashboard-token` works.
Read routes accept query tokens. Scripted clients get a 401 that looks like a wrong token.

## Acceptance
1. `POST /api/approvals/:id?token=<valid>` with body `{"outcome":"allowed-once"}` and **no** header → **200** when ask pending (or 409 if already settled), never 401 for a valid query token.
2. Header token still works (regression).
3. Missing/invalid token still **401**.
4. `sameOrigin` still rejects cross-origin browser POSTs (403).
5. Unit test(s) in `test/dashboard.test.ts` cover query-token settle.
6. Update `docs/KNOWN-ISSUES.md` §5 to Fixed.
7. Comment on `authorized` / `approve` matches behaviour.

## Non-goals
- Do not remove header auth.
- Do not weaken sameOrigin.
- Do not change watcher/SSE semantics (§6).
