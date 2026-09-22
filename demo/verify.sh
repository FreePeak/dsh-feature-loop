#!/usr/bin/env bash
# Run the demo test suite. Exits 0 only when every test passes.
#
# Works from anywhere: paths resolve against this script's own location.
#   bash demo/verify.sh        # from dsh-feature-loop/
#   bash verify.sh             # from inside demo/
set -euo pipefail

here="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

node --experimental-strip-types --test "$here"/test/*.test.ts
