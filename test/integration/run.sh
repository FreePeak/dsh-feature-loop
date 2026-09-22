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

STAGED="$HARNESS/packages/core/tools/tests/zz-feature-loop-gate.spec.ts"
# The spec imports the plugin by absolute path so it resolves from anywhere.
cleanup() { rm -f "$STAGED"; }
trap cleanup EXIT

sed \
  -e "s#from '\.\./\.\./src/plugin\.ts'#from '$HERE/../../src/plugin.ts'#" \
  -e "s#from '\.\./\.\./src/spec\.ts'#from '$HERE/../../src/spec.ts'#" \
  "$HERE/plugin-in-dsh.spec.ts" > "$STAGED"

echo "harness: $HARNESS"
echo "staged:  $STAGED"
echo

cd "$HARNESS"
# NOT `exec`: exec replaces this shell, so the EXIT trap never fires and the
# staged spec is left behind in the harness checkout. Run it as a child and
# propagate its status instead.
set +e
npx vitest run packages/core/tools/tests/zz-feature-loop-gate.spec.ts
status=$?
exit "$status"
