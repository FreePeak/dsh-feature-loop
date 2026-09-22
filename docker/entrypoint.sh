#!/usr/bin/env bash
# Entrypoint: seed a persistent $DSH_HOME, then boot the harness web UI.
#
# The profile is BAKED into the image at /opt/dsh-home (provisioned at build
# time, so no registry access is needed at run time). This script copies it into
# the volume on first run and leaves it alone afterwards, so a `docker run` with
# a fresh volume works offline.
#
# Idempotent: re-running with the same volume changes nothing. Set
# FORCE_REINIT=1 to re-seed the profile and patch from the image (settings.yaml
# is still preserved unless you delete it yourself).
set -euo pipefail

DSH_BIN="${DSH_BIN:-dsh}"
DSH_HOME="${DSH_HOME:-/data}"
DSH_PROFILE="${DSH_PROFILE:-dsh-fl}"
DSH_PORT="${DSH_PORT:-3099}"
BAKED_HOME="/opt/dsh-home"
TEMPLATES="/opt/templates"

log() { printf '[entrypoint] %s\n' "$*"; }

mkdir -p "$DSH_HOME/profiles"

# ── 1. the profile ─────────────────────────────────────────────────────────
if [ ! -d "$DSH_HOME/profiles/$DSH_PROFILE" ] || [ "${FORCE_REINIT:-0}" = "1" ]; then
  log "seeding profile '$DSH_PROFILE' from the image"
  rm -rf "${DSH_HOME:?}/profiles/$DSH_PROFILE"
  cp -R "$BAKED_HOME/profiles/$DSH_PROFILE" "$DSH_HOME/profiles/$DSH_PROFILE"

  # The activation patch replaces the template's empty `[]` document. Appending
  # a block sequence after a flow sequence is invalid YAML, and the loader
  # rejects the whole overlay — so the empty document is removed, not appended.
  # Done with sed rather than python3: node:22-slim ships neither.
  log "installing the feature-loop activation patch"
  patch_file="$DSH_HOME/profiles/$DSH_PROFILE/cordis.patch.yml"
  sed -i '/^\[\][[:space:]]*$/d' "$patch_file"
  printf '\n' >> "$patch_file"
  cat "$TEMPLATES/profile.patch.yml" >> "$patch_file"
else
  log "profile '$DSH_PROFILE' already present — leaving it untouched"
fi

# ── 2. settings ────────────────────────────────────────────────────────────
#
# The marker is `settings.yaml.imported`, not `settings.yaml`: the harness's
# settings service imports a legacy `settings.yaml` and RENAMES it to
# `settings.yaml.imported` before the first write (dsh-settings
# `importLegacyDocument`). Checking only `settings.yaml` therefore looks absent
# on every restart and re-renders — overwriting nothing the user changed in the
# imported file, but making the "already present" branch unreachable and churning
# the file each boot.
if [ ! -f "$DSH_HOME/settings.yaml" ] && [ ! -f "$DSH_HOME/settings.yaml.imported" ]; then
  log "rendering settings.yaml (preset: workspace-write, so the approval panel works)"
  # Substituted with sed, not envsubst: `node:22-slim` does not ship gettext, and
  # an `apt-get install` for one three-character placeholder fails because the
  # build network reaches npm but not the Debian mirrors. The value cannot
  # contain `|`, which is a fair constraint for a URL.
  base_url="${ONEGW_BASE_URL:-http://host.docker.internal:8080/v1}"
  sed "s|\${ONEGW_BASE_URL}|${base_url}|g" \
    "$TEMPLATES/settings.template.yaml" > "$DSH_HOME/settings.yaml"
else
  log "settings already present — leaving it untouched"
fi

if [ -z "${ONEGW_API_KEY:-}" ]; then
  log "WARNING: ONEGW_API_KEY is unset. The UI will start, but any model call"
  log "         will fail. Pass it with:  -e ONEGW_API_KEY=..."
fi

# ── 3. boot ────────────────────────────────────────────────────────────────
#
# TWO FENCES, AND WHY THERE IS A RELAY BELOW
#
# The harness refuses a wildcard bind at two layers:
#   1. the web-app CLI: `--host 0.0.0.0` is a usage error ("it would expose
#      remote code execution to the network; use 127.0.0.1 instead");
#   2. the webserver plugin's config schema, which accepts only `127.0.0.1` or
#      `0.0.0.0` — so binding the container's own address is rejected too.
#
# Binding 127.0.0.1 satisfies both, but Docker's port forwarding cannot reach a
# loopback-only listener, so the published port would refuse connections.
#
# So the app binds 127.0.0.1 (the harness's own recommendation, unmodified) and
# a small relay listens on the container's external interface, forwarding to it.
# Nothing about the app's security posture changes: it still authenticates every
# request with its own token, and compose publishes only to the HOST LOOPBACK,
# so the UI is reachable from this machine and nowhere else — the same exposure
# as running `dsh` natively.
DSH_INTERNAL_PORT="${DSH_INTERNAL_PORT:-8099}"

log "booting '$DSH_PROFILE' on 127.0.0.1:${DSH_PORT} (DSH_HOME=$DSH_HOME)"
log "relaying 0.0.0.0:${DSH_INTERNAL_PORT} -> 127.0.0.1:${DSH_PORT} for Docker's port mapping"
log "open the URL from the 'dsh web: ...' line below — it carries the auth token"

node -e '
const net = require("node:net")
const to = Number(process.env.DSH_PORT || 3099)
net.createServer(s => {
  const up = net.connect(to, "127.0.0.1")
  s.pipe(up).pipe(s)
  const end = () => { s.destroy(); up.destroy() }
  s.on("error", end); up.on("error", end)
}).listen(Number(process.env.DSH_INTERNAL_PORT || 8099), "0.0.0.0")
' &

exec "$DSH_BIN" --profile "$DSH_PROFILE" \
  --host 127.0.0.1 --port "$DSH_PORT" --no-open "$@"
