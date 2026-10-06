#!/usr/bin/env bash
# Run the DSH integration spec against the real harness.
#
# The spec mounts the plugin into a real cordis context, so it needs
# `@deepseek-ai/dsh-*` resolvable to harness sources. Those resolve through the
# harness's `tsconfig.base.json` (455 path entries) and its node_modules, which
# is why this runs FROM the harness checkout rather than from here.
#
# The harness's own `vitest.config.ts` cannot collect a spec outside its
# `packages/*/*/tests` include globs, so the spec is copied into the tools
# package's test directory, run, and removed — including on failure.
#
#   bash test/integration/run.sh [path-to-harness-checkout]
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS="${1:-${DSH_HARNESS:-$HOME/work/harvey/freepeak/deepseek-harness}}"

if [ ! -d "$HARNESS" ]; then
  echo "error: harness checkout not found at $HARNESS" >&2
  echo "usage: bash test/integration/run.sh /path/to/deepseek-harness" >&2
  exit 1
fi

# Every spec in this directory is staged, run and removed. The staged names are
# prefixed so a leftover is recognisable and `cleanup` can sweep all of them.
SPECS=(plugin-in-dsh workers-in-dsh)
STAGED_DIR="$HARNESS/packages/core/tools/tests"
staged_path() { echo "$STAGED_DIR/zz-feature-loop-$1.spec.ts"; }
cleanup() { for spec in "${SPECS[@]}"; do rm -f "$(staged_path "$spec")"; done; rm -f "$STAGED_DIR/zz-feature-loop-gate.spec.ts"; }
trap cleanup EXIT

echo "harness: $HARNESS"
for spec in "${SPECS[@]}"; do
  # The specs import the plugin by absolute path so they resolve from anywhere.
  sed \
    -e "s#from '\.\./\.\./src/\([a-z-]*\)\.ts'#from '$HERE/../../src/\1.ts'#" \
    "$HERE/$spec.spec.ts" > "$(staged_path "$spec")"
  echo "staged:  $(staged_path "$spec")"
done
echo

cd "$HARNESS"
# NOT `exec`: exec replaces this shell, so the EXIT trap never fires and the
# staged specs are left behind in the harness checkout. Run it as a child and
# propagate its status instead.
set +e
files=()
for spec in "${SPECS[@]}"; do files+=("packages/core/tools/tests/zz-feature-loop-$spec.spec.ts"); done
npx vitest run "${files[@]}"
status=$?
exit "$status"
