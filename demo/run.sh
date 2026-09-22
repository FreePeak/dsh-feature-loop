#!/usr/bin/env bash
# The demo, in one command: reset the bug, then run the loop against it.
#
#   bash demo/run.sh                       # 14 steps, $1.00 ceiling
#   bash demo/run.sh --max-steps 6         # watch the ceiling actually stop it
#   bash demo/run.sh --budget 0.000001     # watch the cost ceiling fire
#   bash demo/run.sh --judge none          # detectors only, no judge
#
# Any extra arguments are passed through to the CLI.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash demo/reset.sh

exec node --experimental-strip-types src/cli.ts \
  --root demo \
  --verify "bash verify.sh" \
  --goal "Read README.md to understand the reported bug, then make the test suite pass without breaking any currently-passing test" \
  --phase bugfix \
  --model xiaomi/mimo-v2.5 \
  --judge chat \
  --auto \
  "$@"
