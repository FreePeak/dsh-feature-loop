#!/usr/bin/env bash
#
# demo.sh — one command for the whole stack: clean, up, run the loop, review.
#
#   ./demo.sh                 clean, bring everything up, run the loop with the
#                             Laya advisor on the planted demo bug
#   ./demo.sh --no-loop       just sweep + bring the stack up (no model calls)
#   ./demo.sh --steps 6       shorter loop run
#   ./demo.sh --judge chat    use the metered chat judge instead of Laya
#   ./demo.sh --no-clean      skip the stale-state sweep
#
# What it does, in order:
#   1. sweeps stale state left behind by earlier sessions (see SWEEP below)
#   2. makes sure the Laya advisor sidecar is healthy on :8091
#   3. builds + starts the container: DSH UI on :3090, HITL dashboard on :3092
#   4. resets the planted bug and runs the agent loop against it
#   5. prints the URLs and what to look at
#
# NEVER touched, by design:
#   - port 3081 (your own DSH GUI), 3097 and 3099 (protected in the Makefile)
#   - the dsh-mux, onegw, leankg and Laya containers
#   - your ~/.dsh profile and ~/.dsh/.credentials.yaml
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# ── configuration ──────────────────────────────────────────────────────────
HOST_PORT="${HOST_PORT:-3090}"
DASH_PORT="${DASH_PORT:-3092}"
LAYA_URL="${LAYA_URL:-http://127.0.0.1:8091}"
LAYA_COMPOSE="${LAYA_COMPOSE:-$HOME/.local/share/laya-sidecar}"
SERVICE="dsh-feature-loop"
DSH_HARNESS="${DSH_HARNESS:-$HOME/work/harvey/freepeak/deepseek-harness}"
CREDENTIALS="${CREDENTIALS:-$HOME/.dsh/.credentials.yaml}"

# Ports this script must never disturb. 3081 is the GUI the operator is using.
PROTECTED_PORTS="3081 3097 3099"

STEPS=14
JUDGE=laya
DO_CLEAN=1
DO_LOOP=1

while [ $# -gt 0 ]; do
  case "$1" in
    --steps)    STEPS="${2:?--steps needs a number}"; shift 2 ;;
    --judge)    JUDGE="${2:?--judge needs none|chat|laya}"; shift 2 ;;
    --no-clean) DO_CLEAN=0; shift ;;
    --no-loop)  DO_LOOP=0; shift ;;
    -h|--help)  sed -n '3,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown flag: $1 (try --help)" >&2; exit 2 ;;
  esac
done

say()  { printf '\n\033[1m== %s\033[0m\n' "$*"; }
info() { printf '   %s\n' "$*"; }
warn() { printf '   ! %s\n' "$*" >&2; }

# ── SWEEP — stale state from earlier sessions ──────────────────────────────
# Every earlier session that ran the runbook left something behind, and each of
# these collides with a fresh start: a host `dsh web` squatting 3090/3092, the
# hermetic profile homes, the logs they wrote, or an integration spec that
# test/integration/run.sh only removes on a clean exit.
sweep() {
  say "Sweeping stale state from earlier sessions"

  # (a) host processes holding this stack's ports. A container owns these ports
  #     normally, so anything found here is a leftover host server.
  for port in "$HOST_PORT" "$DASH_PORT"; do
    case " $PROTECTED_PORTS " in
      *" $port "*) warn "port $port is protected — refusing to touch it"; continue ;;
    esac
    pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      info "killing stale listener(s) on :$port — $(echo "$pids" | tr '\n' ' ')"
      # shellcheck disable=SC2086
      kill -TERM $pids 2>/dev/null || true
      sleep 1
      # shellcheck disable=SC2086
      kill -KILL $pids 2>/dev/null || true
    else
      info "port $port — no stale host listener"
    fi
  done

  # (b) our own container. Compose recreates it anyway; removing it first means
  #     the port bindings are definitely free.
  if docker inspect "$SERVICE" >/dev/null 2>&1; then
    info "removing container $SERVICE"
    docker rm -f "$SERVICE" >/dev/null 2>&1 || true
  else
    info "no existing $SERVICE container"
  fi

  # (c) the hermetic profile homes the runbook's two servers used. Both are
  #     orphans once those servers are gone (they were never on a volume).
  for stale in "$HOME/.dsh-fl-verify" "$HOME/.dsh/profiles/fltest"; do
    if [ -e "$stale" ]; then
      info "removing orphaned profile home $stale"
      rm -rf "$stale"
    fi
  done

  # (d) the logs those servers wrote.
  for log in /tmp/fl-hermetic.log /tmp/fltest-live.log; do
    [ -e "$log" ] && { info "removing stale log $log"; rm -f "$log"; }
  done

  # (e) an integration spec left in the harness checkout when a run was killed.
  #     test/integration/run.sh stages this and removes it on a clean exit only.
  spec="$DSH_HARNESS/packages/core/tools/tests/zz-feature-loop-gate.spec.ts"
  if [ -e "$spec" ]; then
    info "removing leftover integration spec"
    rm -f "$spec"
  fi

  info "sweep done — 3081 and the other containers untouched"
}

# ── 1. the Laya advisor ────────────────────────────────────────────────────
# The judge runs as a shared machine service in its own container, not launchd.
# It needs colima at >= 4 GB; English alone needs ~2.7 GB and a smaller VM
# OOM-kills it on start.
ensure_laya() {
  say "Laya advisor (the local judge)"
  if curl -sf -m 5 "$LAYA_URL/health" >/dev/null 2>&1; then
    info "already healthy: $(curl -s -m 5 "$LAYA_URL/health")"
    return 0
  fi
  if [ ! -f "$LAYA_COMPOSE/compose.yaml" ]; then
    warn "no sidecar at $LAYA_COMPOSE — the loop will fall back to detectors only"
    return 0
  fi
  info "not answering — starting the sidecar"
  ( cd "$LAYA_COMPOSE" && docker compose up -d ) >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do
    if curl -sf -m 5 "$LAYA_URL/health" >/dev/null 2>&1; then
      info "healthy: $(curl -s -m 5 "$LAYA_URL/health")"
      return 0
    fi
    sleep 2
  done
  warn "Laya did not come up — check: docker logs laya-sidecar-laya-sidecar-1"
}

# ── 2. the container stack ─────────────────────────────────────────────────
# `make up` reads ONEGW_API_KEY from ~/.dsh/.credentials.yaml, builds if needed,
# waits for the UI and prints both URLs with their fresh tokens.
bring_up() {
  say "Bringing up the container (DSH UI :$HOST_PORT, dashboard :$DASH_PORT)"
  if ! make up >/tmp/demo-up.log 2>&1; then
    warn "make up failed — last 30 lines:"
    tail -30 /tmp/demo-up.log >&2
    return 1
  fi
  grep -E "open: |up \(HTTP" /tmp/demo-up.log | sed 's/^/   /' || true

  # Assert the served dashboard is the assistant-ui build, not the legacy
  # inline page. This is the exact staleness that shipped in the old image:
  # no `id="root"` and no bundle reference means the assets were not baked in.
  # Both `open:` lines look alike, so match the dashboard by its port.
  token="$(sed -n "s|.*:$DASH_PORT/?token=\([A-Za-z0-9_-]*\).*|\1|p" /tmp/demo-up.log | head -1)"
  if [ -n "$token" ]; then
    page="$(curl -s -m 8 "http://127.0.0.1:$DASH_PORT/?token=$token" || true)"
    if printf '%s' "$page" | grep -q 'id="root"'; then
      info "dashboard OK — assistant-ui bundle is being served"
    else
      warn "dashboard does NOT look like the assistant-ui build (no id=\"root\")"
    fi
  fi
}

# ── 3. the loop ────────────────────────────────────────────────────────────
# demo/reset.sh re-plants the off-by-one in the nearest-rank percentile, then
# the loop is given the repo's own bug report. `--judge laya` routes the
# review-worthiness question at the local sidecar ($0, ~73 ms warm) instead of
# the metered chat judge. `--auto` keeps this non-interactive: the interactive
# approval path is the dashboard/UI, not this script.
run_loop() {
  say "Running the agent loop on the planted demo bug (judge=$JUDGE, steps=$STEPS)"

  if [ -z "${ONEGW_API_KEY:-}" ] && [ -f "$CREDENTIALS" ]; then
    ONEGW_API_KEY="$(sed -n 's/^[[:space:]]*ONEGW_API_KEY:[[:space:]]*\([^[:space:]]*\).*/\1/p' "$CREDENTIALS" | head -1)"
    export ONEGW_API_KEY
  fi
  if [ -z "${ONEGW_API_KEY:-}" ]; then
    warn "no ONEGW_API_KEY — every model call will fail"
  fi

  bash demo/reset.sh

  set +e
  node --experimental-strip-types src/cli.ts \
    --root demo \
    --verify "bash verify.sh" \
    --goal "Read README.md to understand the reported bug, then make the test suite pass without breaking any currently-passing test" \
    --phase bugfix \
    --model xiaomi/mimo-v2.5 \
    --judge "$JUDGE" \
    --systemone-model laya \
    --max-steps "$STEPS" \
    --auto
  rc=$?
  set -e

  echo
  if bash demo/verify.sh >/dev/null 2>&1; then
    info "RESULT: the demo suite passes — the loop fixed the bug (cli exit $rc)"
  else
    info "RESULT: the demo suite still fails — the loop did not finish it (cli exit $rc)"
    info "        re-run with more steps: ./demo.sh --steps 14"
  fi
}

# ── go ─────────────────────────────────────────────────────────────────────
say "feature-loop demo — $(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo '?') ($(basename "$ROOT"))"
[ "$DO_CLEAN" = 1 ] && sweep
ensure_laya
bring_up

if [ "$DO_LOOP" = 1 ]; then
  run_loop
else
  say "Stack is up (--no-loop). Open the UI and start a session:"
fi

say "Where to look"
info "DSH UI        http://127.0.0.1:$HOST_PORT/?token=…   (token above)"
info "HITL dashboard http://127.0.0.1:$DASH_PORT/?token=…  (token above)"
info ""
info "In the UI, set the permission preset to 'workspace-write' — without it the"
info "approval panel never appears and gated tools fail with 'user rejected tool'."
info "Then ask for an edit and watch the composer turn into the approval card."
info ""
info "Logs: make logs    Stop: make down    Full reset: make clean-all"
