#!/usr/bin/env bash
# The demo, in one command: reset the bug, then run the loop against it.
#
#   bash demo/run.sh                       # 14 steps, $1.00 ceiling
#   bash demo/run.sh --max-steps 4         # watch the ceiling actually stop it
#   bash demo/run.sh --budget 0.000001     # watch the cost ceiling fire
#   bash demo/run.sh --judge none          # detectors only, no judge
#
# Any extra arguments are passed through to the CLI.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash demo/reset.sh

# The tree after a run is NOT the tree before it, and that is the demo's own
# doing: reset.sh plants the bug and the loop fixes it, so a SECOND run plants it
# again and the tree is dirty before the run even starts. Measured 2026-10-03 —
# four consecutive runs left `demo/src/latency-window.ts` carrying the BUGGY line,
# so `make check` failed on a repository nobody had edited.
#
# So restore the file the loop is allowed to change, on EVERY exit path. `trap on
# EXIT` covers a Ctrl-C too, which is the case a person actually hits when they
# stop watching — and a demo that leaves the tree dirty after the case a person
# stopped watching is the worst possible place for it.
#
# Measured, both directions, on the shape that leaves the bug planted — a run
# that hits the step ceiling before the fix, and a run a person interrupts with
# Ctrl-C:
#
#   no trap, Ctrl-C      exit -2 (killed by the signal), bug STILL PLANTED
#   with the trap, Ctrl-C exit 130,              bug RESTORED
#   no trap, --max-steps 2  exit 1,              bug STILL PLANTED
#   with the trap          exit 1,              bug RESTORED
#
# The exit codes differ and both are honest: 130 is bash reporting the interrupt
# it handled, -2 is the signal arriving with nothing to handle it. What matters
# is that the tree is identical either way, and the difference is one line in a
# file nobody edited.
#
# ponytail: `git checkout --` on ONE named file. A stash would also swallow
# whatever else the loop wrote, and this demo's whole point is that its output is
# disposable; a worktree would be a second checkout to explain in a README.
LOOP_EDITABLE="demo/src/latency-window.ts"
restore() { git -C "$ROOT" checkout -- "$LOOP_EDITABLE" 2>/dev/null || true; }
trap restore EXIT INT TERM

# NOT `exec`: exec replaces this shell, so the EXIT trap would never run and the
# restore below would be the one part of this file that does not happen. Running
# node as a child and propagating its status keeps the trap — and a demo whose
# exit code stops meaning the loop's exit code is not a demo.
node --experimental-strip-types demo/cli.ts \
  --root demo \
  --verify "bash verify.sh" \
  --goal "Read README.md to understand the reported bug, then make the test suite pass without breaking any currently-passing test" \
  --phase bugfix \
  --model onegw/execution \
  --judge chat \
  --auto \
  "$@"
