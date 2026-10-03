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

# §1be made the plugin refuse an unwatched ask ITSELF, so the three cases that
# assert an ANSWERER was consulted (APPROVE, REJECT, DASHBOARD DELEGATE) need
# `watched: true` — and they HANG rather than fail when it is off, because the
# registry claims the ask and waits for a page that is not coming. The stamp has
# to be written into the module the PLUGIN imports, which is why this import is
# rewritten alongside plugin.ts and spec.ts: two specifiers for one module are
# two module instances, and a stamp on the wrong one is invisible to the plugin.
sed \
  -e "s#from '\.\./\.\./src/plugin\.ts'#from '$HERE/../../src/plugin.ts'#" \
  -e "s#from '\.\./\.\./src/spec\.ts'#from '$HERE/../../src/spec.ts'#" \
  -e "s#from '\.\./\.\./src/approvals\.ts'#from '$HERE/../../src/approvals.ts'#" \
  "$HERE/plugin-in-dsh.spec.ts" > "$STAGED"

# The staged spec imports src/plugin.ts by ABSOLUTE path, and Vite resolves that
# file's own bare specifiers (`@deepseek-ai/dsh-llm`, `@deepseek-ai/dsh-tools`,
# `@deepseek-ai/cordis`) from the DIRECTORY WALK above the plugin — not from the
# harness, which is where the spec itself lives.
#
# That is why this check passes in a git worktree of this repo and fails in a
# clone of it, which is the same defect in two guises. The plugin declares all
# five harness packages as OPTIONAL peers and `.npmrc` sets
# `auto-install-peers=false`, so a clean install never provides them; a worktree
# inherits them by walking up into the MAIN checkout's node_modules, which on this
# machine is a symlink into a hand-built profile
# (`~/.dsh-flt-4100/profiles/flt4100/...`). Measured 2026-10-03:
#
#   worktree  -> 11/11 pass
#   clone     -> `Could not resolve "@deepseek-ai/dsh-llm" imported by
#                "@freepeak/dsh-feature-loop"` — no tests run at all
#
# A green integration run was therefore partly a property of this machine, not of
# the code. Say so before the run rather than after it, because "no tests ran" and
# "11 passed" print very differently and only one of them means anything.
# Checked the way Node and Vite actually resolve it — the directory walk from
# src/plugin.ts, not a literal `node_modules` next to it. The walk crosses the
# worktree boundary: this file lives in `.worktrees/exec-rung/`, whose own
# node_modules carries NO harness package, and the package resolves from the
# MAIN checkout two directories up.
peers=$(cd "$HERE/../.." && node -e "
  const { createRequire } = require('node:module')
  const path = require('node:path')
  const r = createRequire(path.resolve('src/plugin.ts'))
  try { process.stdout.write(path.dirname(path.dirname(r.resolve('@deepseek-ai/dsh-llm')))) }
  catch { process.exit(1) }
" 2>/dev/null) || peers=""
if [ -z "$peers" ]; then
  echo "note: the harness packages are not installed under this repo." >&2
  echo "      The plugin declares them as OPTIONAL peers, so a clean install" >&2
  echo "      does not provide them and this spec cannot resolve src/plugin.ts." >&2
  echo "      fix: run this from a checkout where they resolve, or point" >&2
  echo "           DSH_HARNESS at a harness whose node_modules has them." >&2
  exit 2
fi

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
