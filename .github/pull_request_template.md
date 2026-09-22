<!--
Keep this short where it can be and long where it matters. The commit style in
this repository is the target: what changed, why, what it replaced, and the bugs
found on the way — each with its mechanism, not just its symptom.

CI runs the test suite and the harness-free typecheck on Node 22. The plugin path
(`src/agent.ts`, `src/index.ts`) is not typechecked in CI and the demo is not run
there at all, so say in Notes what you checked by hand.
-->

## Summary

<!-- One paragraph: what this changes and why. The "why" is the part that gets
     lost, so lead with it if it is interesting. -->

## What changed

<!--
Bullets, file by file where that helps. If this replaces something, say what the
old behaviour was and what it cost. If you found a bug on the way, write up the
mechanism: a reviewer should be able to see why it was invisible.
-->

## Checklist

- [ ] `node --experimental-strip-types --test test/*.test.ts` passes (126 tests)
- [ ] `pnpm typecheck` — or `tsc --noEmit` by path — is clean
- [ ] No new dependencies, or the one added is justified below. The policy layer is deliberately stdlib-only.
- [ ] Every edit inside a vendored file is marked `FORK-DELTA(n):` on its own line, and `bash scripts/sync-upstream.sh` still applies cleanly
- [ ] New or changed thresholds cite their provenance in `BOOK_THRESHOLDS`, or say why they are a guard rather than a playbook number
- [ ] Non-trivial logic leaves one runnable test behind — one that fails if the logic breaks
- [ ] `README.md` and `CHANGELOG.md` updated if behaviour, ceilings or the review rate changed

## Notes for reviewers

<!--
Tradeoffs you made, alternatives you rejected, limits you already know about
(mark them `ponytail:` in the code with an upgrade path), and anything you could
not verify locally — the plugin path needs a harness build, and `bash demo/run.sh`
needs onegw on :8080. A limit stated here beats one discovered later.
-->
