#!/usr/bin/env bash
# Restore the demo's planted bug, so the loop has real work to do again.
#
# Run this before each demo run. Without it the second run finds an
# already-passing suite and proves nothing — which the CLI's preflight now
# refuses outright, but a reset is friendlier than a refusal.
#
#   bash demo/reset.sh && bash demo/run.sh
#
# This deliberately does NOT match a specific correct implementation. The loop
# has produced at least two valid fixes (with and without a redundant upper
# clamp), so matching an exact string would fail the moment the model wrote a
# different-but-correct one. It replaces the whole rank-computation line instead,
# which is the thing the bug lives in.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$HERE/src/latency-window.ts"

python3 - "$TARGET" <<'PY'
import re
import sys

path = sys.argv[1]
src = open(path, encoding='utf-8').read()

# The planted bug: floor instead of ceil-minus-one, which is wrong only when
# p/100 * n lands on a whole number. That is what makes it subtle — p95 of 7
# samples is correct, p95 of 20 silently returns the slowest sample.
BUGGY = '    const rank = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))'

pattern = re.compile(r'^[ \t]*const rank = .*$', re.MULTILINE)
matches = pattern.findall(src)

if not matches:
    raise SystemExit(f'reset: no "const rank = ..." line found in {path}')

if matches == [BUGGY]:
    print('bug already present — nothing to do')
    sys.exit(0)

src = pattern.sub(BUGGY, src, count=1)
open(path, 'w', encoding='utf-8').write(src)
print(f'bug restored (replaced: {matches[0].strip()})')
PY

echo
echo "verify should now FAIL:"
if bash "$HERE/verify.sh" >/dev/null 2>&1; then
  echo "  ERROR: verify still passes — the bug is not planted" >&2
  exit 1
fi
echo "  ok — verify exits non-zero, the loop has real work"
