#!/usr/bin/env bash
# Re-vendor the upstream agent-loop files and report the diff.
#
# Run from the dsh-feature-loop root:
#   bash scripts/sync-upstream.sh [UPSTREAM_REPO_PATH]
#
# Default upstream: /Users/linh.doan/work/opensources/deepseek-harness
# Edit upstream.lock to pin a different commit.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK="$ROOT/upstream.lock"

# Read pinned commit from lock file, or use HEAD.
UPSTREAM="${1:-$(grep '^repo=' "$LOCK" | cut -d= -f2)}"
PINNED_COMMIT=$(grep '^commit=' "$LOCK" | cut -d= -f2)

if [ ! -d "$UPSTREAM" ]; then
  echo "Error: upstream repo not found at $UPSTREAM" >&2
  echo "Usage: bash scripts/sync-upstream.sh /path/to/deepseek-harness" >&2
  exit 1
fi

echo "=== dsh-feature-loop upstream sync ==="
echo "Upstream: $UPSTREAM"
echo "Pinned:   $PINNED_COMMIT"
echo

# Verify upstream is at the pinned commit.
CURRENT=$(cd "$UPSTREAM" && git rev-parse HEAD)
if [ "$CURRENT" != "$PINNED_COMMIT" ]; then
  echo "WARNING: upstream is at $CURRENT, but lock pins $PINNED_COMMIT" >&2
  echo "  Update upstream.lock or cd to the correct commit." >&2
  read -rp "Continue anyway? (y/N) " yn
  case "$yn" in
    [yY]) ;;
    *) exit 1 ;;
  esac
fi

# Files to vendor, relative to packages/core/agent-loop/src/.
UPSTREAM_FILES="agent.ts inbox.ts tool-calls.ts runtime-context.ts assistant-stream.ts constants.ts invariant.ts index.ts"
CHANGED=0

for f in $UPSTREAM_FILES; do
  src="$UPSTREAM/packages/core/agent-loop/src/$f"
  dst="$ROOT/src/$f"
  if [ ! -f "$src" ]; then
    echo "SKIP $f — not found in upstream" >&2
    continue
  fi
  # Check if the file differs from upstream (ignoring our FORK-DELTA lines).
  UPSTREAM_CONTENT=$(grep -v "^.*FORK-DELTA" "$src" 2>/dev/null || true)
  LOCAL_CONTENT=$(grep -v "^.*FORK-DELTA" "$dst" 2>/dev/null || true)
  if [ "$UPSTREAM_CONTENT" = "$LOCAL_CONTENT" ]; then
    echo "OK   $f — no upstream change"
  else
    echo "DIFF $f — upstream has changed"
    diff --color=always <(echo "$UPSTREAM_CONTENT") <(echo "$LOCAL_CONTENT") || true
    CHANGED=1
  fi
done

if [ "$CHANGED" -eq 1 ]; then
  echo
  echo "Upstream has changed. To update, re-vendor and re-apply FORK-DELTA edits."
  echo "  1. Copy upstream files: for f in $UPSTREAM_FILES; do cp \$UPSTREAM/packages/core/agent-loop/src/\$f src/\$f; done"
  echo "  2. Re-apply FORK-DELTA edits from this session's diff."
  echo "  3. Run: node --experimental-strip-types --test test/*.test.ts"
else
  echo
  echo "All clear — upstream is identical to what we vendored."
fi

# Update lock to current upstream commit (even if unchanged, re-record).
cd "$UPSTREAM"
echo "# Synced $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$LOCK"
echo "repo=$(dirname "$UPSTREAM")" >> "$LOCK"
echo "commit=$(git rev-parse HEAD)" >> "$LOCK"
echo "tag=$(git describe --tags --exact-match 2>/dev/null || echo 'none')" >> "$LOCK"
echo >> "$LOCK"
echo "# Upstream package.json version:" >> "$LOCK"
python3 -c "import json;print('version='+json.load(open('$UPSTREAM/package.json'))['version'])" >> "$LOCK" 2>/dev/null || true
echo "Lock updated: $LOCK"
