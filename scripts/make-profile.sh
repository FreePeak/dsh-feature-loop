#!/usr/bin/env bash
#
# Create a ready-made DSH profile that actually runs the feature loop.
#
#   scripts/make-profile.sh [name] [--port N] [--dashboard-port N] [--web|--headless]
#
# Defaults: name=feature-loop, web app, port 4188, dashboard 8100.
#
# Every step here is one this guide has gotten wrong by hand, so the script
# exists rather than the checklist:
#
#   * the plugin must be in `dsh.profile.bundles` — a dependency alone composes
#     nothing, which is why the `web` profile has looked like an ordinary agent
#     loop with the plugin installed;
#   * the profile must also depend on a harness bundle, or the plugin's optional
#     peerDependencies never resolve: it appears in the boot graph, its row
#     composes, and it imports nothing at runtime. The tell is pnpm's virtual
#     store key — a `_@deepseek-ai+…` suffix means resolved;
#   * the lockfile is a v9 one and pnpm 11 silently re-resolves it, dropping the
#     peer wiring, so this uses pnpm 9 explicitly;
#   * a patch entry for `id: feature-loop` REPLACES the whole config, so the
#     generated patch spells out every key — a partial override deletes `spec`,
#     and a spec-less policy builds no gate at all;
#   * each process owns its own approval registry AND its own dashboard port, so
#     the headless twin gets a different port from the web one.
#
#   * a `file:` dependency is a SNAPSHOT taken at install time, so a rebuilt
#     `lib/` does not reach an already-installed profile — it keeps running the
#     bytes pnpm copied. This script therefore builds before it installs.
#
# ponytail: writes four files and shells out to pnpm once. The upgrade path is
# `dsh plugin --profile X add`, which does the install but not the peers, the
# bundle row, or the patch — which is why this exists.
set -euo pipefail

NAME=feature-loop
APP=web
PORT=4188
DASH=8100
WEB_PORT_ALT=4188

while [ $# -gt 0 ]; do
  case "$1" in
    --web) APP=web; shift ;;
    --headless) APP=headless; shift ;;
    --port) PORT="$2"; shift 2 ;;
    --dashboard-port) DASH="$2"; shift 2 ;;
    -h|--help) sed -n '2,25p' "$0" | sed 's/^# \?//'; exit 0 ;;
    *) NAME="$1"; shift ;;
  esac
done

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DSH="${DSH_HARNESS:-$HOME/work/harvey/freepeak/deepseek-harness}"
CLI="$DSH/apps/cli/lib/bin.js"
HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$HOME_DIR/profiles/$NAME"
# pnpm 9 specifically: the lockfile it writes is a v9 one, and pnpm 11 silently
# re-resolves a v9 lockfile and drops the peer wiring — which is §1b's entire
# subject, so the version is not negotiable. Resolved off PATH or the npx cache
# first, and only fetched when neither has it: `npx -y pnpm@9.15.9` hits the
# REGISTRY on every cold call, and with the registry slow the profile script dies
# on `ETIMEDOUT` after `--prefer-offline` has already done the work it was
# supposed to do. Measured 2026-10-03 twice on this box.
# `command -v pnpm` alone is a TRAP here: this box has pnpm 11 on PATH, which is
# exactly the version this script exists to avoid, and a version check that only
# ran on the PATH hit would fall through to the npx fetch on every machine where
# the wrong pnpm is installed. So: every candidate, PATH first or not, is asked
# what version it is.
PNPM=""
for candidate in "$(command -v pnpm 2>/dev/null || true)" \
                 $(ls -1 "$HOME"/.npm/_npx/*/node_modules/.bin/pnpm 2>/dev/null); do
  if [ -x "$candidate" ] && [ "$("$candidate" --version 2>/dev/null)" = "9.15.9" ]; then
    PNPM="$candidate"
    break
  fi
done
[ -n "$PNPM" ] || PNPM="npx -y pnpm@9.15.9"
echo "==> pnpm: $PNPM"

[ -f "$CLI" ] || { echo "error: harness checkout not found at $DSH" >&2; exit 1; }

APP_BUNDLE=$([ "$APP" = web ] && echo "@deepseek-ai/dsh-web-app" || echo "@deepseek-ai/dsh-headless")
# See the gateMode comment in the generated patch for why headless denies.
GATE_MODE=$([ "$APP" = web ] && echo ask || echo deny)

echo "==> profile $NAME ($APP app, web :$PORT, dashboard :$DASH)"
mkdir -p "$PROFILE_DIR"

# The harness packages are pinned to the version the harness itself runs, and
# pinned in `pnpm.overrides` rather than as dependencies: they are peers of the
# plugin, and adding them as direct deps installs a SECOND copy of each under
# the profile root, which is how a peer ever resolves against a mismatched
# build. Without these the resolve fails outright, with the least readable
# error pnpm has:
#   ERR_PNPM_NO_MATCHING_VERSION  No matching version found for @deepseek-ai/dsh-llm@>=0.1.5 <0.2.0
#   The latest release of @deepseek-ai/dsh-llm is "0.0.1-rc.1".
#
# The plugin's own peerDependencies pin the RANGE the harness must satisfy; the
# harness checkout's version is the answer, read rather than hardcoded so a
# harness upgrade needs no script edit.
HARNESS_VERSION=$(node -p "require('$DSH/apps/cli/package.json').version" 2>/dev/null || echo 0.1.5-rc.3)
# cordis is VENDORED in the harness checkout, not published from its packages/,
# so the CLI version says nothing about it. Read the vendored manifest.
CORDIS_VERSION=$(node -p "require('$DSH/vendor/cordis/package.json').version" 2>/dev/null || echo 4.0.2)
cat > "$PROFILE_DIR/package.json" <<JSON
{
  "name": "dsh-profile-$NAME",
  "private": true,
  "dependencies": {
    "@deepseek-ai/dsh-experimental-agent-team-profile": "0.1.5-rc.3",
    "@freepeak/dsh-feature-loop": "file:$REPO"
  },
  "pnpm": {
    "overrides": {
      "@deepseek-ai/dsh-llm": "$HARNESS_VERSION",
      "@deepseek-ai/dsh-agent": "$HARNESS_VERSION",
      "@deepseek-ai/dsh-tools": "$HARNESS_VERSION",
      "@deepseek-ai/dsh-typert-protocol": "$HARNESS_VERSION",
      "@deepseek-ai/cordis": "$CORDIS_VERSION"
    }
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "$APP_BUNDLE",
        "@deepseek-ai/dsh-experimental-agent-team-profile",
        "@freepeak/dsh-feature-loop"
      ],
      "patchReload": "live"
    }
  }
}
JSON

# One layer, three settings: hoisted like every other profile, and peers ON
# (off is what makes the plugin inert on a profile that supplies nothing else).
cat > "$PROFILE_DIR/pnpm-workspace.yaml" <<'YAML'
packages:
  - .

nodeLinker: hoisted
autoInstallPeers: true
YAML

# No credential is written here. `apiKeyEnv` names a REFERENCE; the value lives
# in ~/.dsh/.credentials.yaml and never reaches this file.
cat > "$PROFILE_DIR/cordis.patch.yml" <<'YAML'
# Generated by scripts/make-profile.sh — a REPLACE, not a merge, so every key
# the row keeps is spelled out below.
- id: llm-pi-ai
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    providers:
      onegw:
        apiKeyEnv: ONEGW_API_KEY
        api: openai-completions
        baseURL: http://127.0.0.1:8080/v1
        displayName: OneGW
        # `execution` is onegw's EXECUTION role alias and it is the route this
        # profile runs on. It is declared here — and not merely referenced by the
        # ladder below — because llm-pi-ai resolves a ladder rung (and the
        # default model) against THIS list, not against the gateway: a rung
        # naming an id this list omits dies UNKNOWN_MODEL on step 1, after the
        # dashboard has already recorded the route, the step and the spend.
        # Verified against the live gateway 2026-10-02: /v1/models lists
        # `execution`, and a live chat completion on it returned 200.
        #
        # The two concrete ids below stay declared on purpose: each is a real
        # route the gateway serves, and each is a working alternative for
        # someone who wants to pin a specific model instead of following the
        # account's EXECUTION role.
        models:
          - id: execution
            name: execution
            contextWindow: 200000
            maxTokens: 32000
          - id: opencode/deepseek-v4.1-flash
            name: opencode/deepseek-v4.1-flash
            contextWindow: 200000
            maxTokens: 32000
          - id: xai/grok-4.7
            name: xai/grok-4.7
            contextWindow: 200000
            maxTokens: 32000
- id: agent-default-model
  name: '@deepseek-ai/dsh-agent-default-model'
  config:
    provider: onegw
    model: execution

- id: feature-loop
  name: '@freepeak/dsh-feature-loop'
  config:
    reviewBudget: 0.1
    judgeThreshold: 1
    judge: laya
    judgeBaseURL: http://127.0.0.1:8092
    systemOneModel: laya
    judgeTimeoutMs: 5000
    gatePolicies:
      read: auto
      glob: auto
      grep: auto
      edit: auto-if-confident
      write: always-approve
    # `ask` on the WEB profile: the standalone dashboard is serving, a human
    # opens it, and the gate asks.
    #
    # `deny` on the HEADLESS profile, and this is not a weakening - it is the
    # only correct answer for it. `ask` fails CLOSED when no approval channel
    # is mounted, and in `dsh headless` nothing ever mounts one: no dashboard
    # page is opened and no browser polls /api/state, so every ask resolves "no
    # answerer available". Measured 2026-10-02 with `ask` on the generated
    # headless profile, against a real model:
    #
    #   Error: tool "write" requires approval, but no approval channel is
    #   available
    #
    # The model then spent its remaining budget reasoning about whether Bash was
    # a legitimate alternative, wrote nothing, and the run produced no work. With
    # `deny` the same step is refused at once, with an honest reason - which is
    # strictly better than a refusal the loop reports as a sandbox denial, and
    # it is what the docs already recommend for unattended runs.
    gateMode: __GATE_MODE__
    dashboard:
      enabled: true
      standalone: true
      host: 127.0.0.1
      port: __DASHBOARD_PORT__
      answers: true
      answerTimeoutMs: 600000
    spec:
      goal: the verification command exits 0 and no previously-passing test breaks
      sensor:
        - repository files
        - test output
      controller:
        # One rung on `execution`, declared in this profile's own `models:` list
        # above. So there is no escalation path that can resolve to an undeclared
        # id — which is the failure that shipped in all three of these files at
        # once. Add a second rung in the same edit that declares and prices it,
        # and `make check` confirms the three agree.
        ladder:
          - provider: onegw
            model: execution
        stepsPerRung: 5
        escalateAfterFailures: 2
      actuator:
        read: read
        glob: read
        grep: read
        bash: irreversible
        edit: reversible-write
        write: irreversible
        # Anything not named here falls back to `irreversible`. Every extra row
        # below is a card a person does not have to click through on autopilot:
        # the HITL tool would otherwise be gated on every delegated task, and
        # the background-job tools on every progress check.
        task: read
        job_list: read
        job_output: read
        job_kill: reversible-write
        ask_user_question: read
        request_user_input: read
      feedback: the verification command exits 0, and the diff is the smallest that achieves it
      termination:
        successCommand: bash verify.sh
        guards:
          - error-cascade
          - tool-cycle
      maxSteps: 15
      costBudgetUSD: 1
      prices:
        onegw/execution:
          inputPerMTok: 0.3
          outputPerMTok: 1.2
          cacheReadPerMTok: 0.03
      unpricedFallback:
        inputPerMTok: 0.3
        outputPerMTok: 1.2
        cacheReadPerMTok: 0.03
YAML
# Quoted heredoc keeps backticks in the comments from becoming shell
# command substitutions (`execution` was expanding to a missing binary and
# aborting the patch write). The dashboard port is the one value that must
# expand — stamp it after the write.
sed -i.bak -e "s/__DASHBOARD_PORT__/${DASH}/" -e "s/__GATE_MODE__/${GATE_MODE}/" "$PROFILE_DIR/cordis.patch.yml"
rm -f "$PROFILE_DIR/cordis.patch.yml.bak"

# Build BEFORE the install. `file:` copies `lib/` at install time, so a profile
# generated from a repo whose `lib/` is stale runs the stale plugin — and the
# symptom is a fix that measures as still-broken, because the live run reads the
# OLD behaviour. Measured 2026-10-04: after fixing `reviewText`, rebuilding the
# repo's `lib/` and restarting the profile, the harness still emitted the old
# "stop and report" wording; `grep` on the profile's own virtual-store copy found
# no trace of the new text.
echo "==> build (the profile installs a snapshot of lib/, not the source)"
npm run build >/dev/null

echo "==> install (pnpm 9 — a v11 re-resolve drops the peer wiring)"
# `--prefer-offline` is the difference between a hang and an install when the
# registry is slow or unreachable: every package the profile needs is already in
# the local store from a previous profile, and pnpm otherwise holds the open
# socket until its own fetch timeout. Measured 2026-10-02 with the registry
# unreachable (TLS to registry.npmjs.org stalled after connect, github fine):
# the install sat at 1.2s of CPU across 9 minutes with the process idle on five
# half-open Cloudflare sockets — indistinguishable from a hang, because it WAS
# one from the caller's side. The same install with --prefer-offline against the
# warm store finished in 1.4s.
# `--no-frozen-lockfile` is required, not preferred: the tarball specifier moves
# whenever the source tree moves, and a frozen lockfile refuses a specifier it
# has not seen before — which is every new profile.
#
# Nothing here can make a slow registry fast. Measured 2026-10-03: with the
# registry timing out, the one dependency `--prefer-offline` cannot serve is
# `@deepseek-ai/dsh-experimental-agent-team-profile`, whose metadata is not in
# the local cache. Copying it in from a profile that already resolved it does NOT
# help — pnpm re-resolves from package.json and prunes the copy, then asks the
# registry anyway. The honest fix is a reachable registry, so the failure is
# reported as what it is instead of as a hang.
(cd "$PROFILE_DIR" && $PNPM install --no-frozen-lockfile --prefer-offline >/dev/null)

# The one-second check, and the only one that answers the question that
# matters: did the plugin's peers RESOLVE? The lockfile's importer entry spells
# out the peer suffixes on the plugin's own version string, which is exactly
# what the runtime resolves against — and it is readable even when the virtual
# store key has been hashed down to a bare suffix.
#
#   …dsh-feature-loop(@deepseek-ai/cordis@4.0.4)(@deepseek-ai/dsh-agent@…)   # wired
#   …dsh-feature-loop                                                        # inert
#
# Unresolved is the silent failure this whole script exists to prevent: the row
# composes, the client bundle is in the boot graph, and nothing is gated —
# because the module import throws and the fiber never constructs.
# The resolved `version:` line for the plugin, not the whole importer block.
PLUGIN_LINE=$(awk '/^  \.:$/,/^packages:$/' "$PROFILE_DIR/pnpm-lock.yaml" | grep -A2 "dsh-feature-loop':" | tail -1)
case "$PLUGIN_LINE" in
  *'@deepseek-ai/dsh-llm@'*)
    echo "==> peers resolved ($(grep -o '@deepseek-ai/[a-z-]*@' <<<"$PLUGIN_LINE" | sort -u | wc -l | tr -d ' ') harness packages on the plugin's entry)" ;;
  *)  echo "WARNING: the plugin's entry carries no peer versions." >&2
      echo "         It is installed but INERT: the row composes, the client" >&2
      echo "         bundle is in the boot graph, and nothing is gated — the" >&2
      echo "         import throws and the fiber never constructs." >&2
      echo "         fix: add pnpm.overrides pinning the harness packages (see" >&2
      echo "         scripts/make-profile.sh) and reinstall with pnpm 9." >&2 ;;
esac

# The peers RESOLVING is necessary and not sufficient: a peer can resolve and
# the module still fail to import, and every one of those failures is a boot
# WARNING the loader carries on past. Measured 2026-10-02 on a profile this
# script generated: `peers resolved (10 harness packages)` printed, the row
# composed, and every run was UNGATED — the log said
# `feature-loop (@freepeak/dsh-feature-loop): failed to import` and the file
# the model was asked to write appeared anyway, ungated.
#
# The cause was `lib/` missing from the installed copy: the plugin ships built
# ESM in lib/ (package.json `files`), lib/ is .gitignore'd, and a `file:`
# dependency installs whatever happens to be on disk. Build output absent at
# install time is neither a plugin fault nor the operator's — so the script
# BUILDS it, and then proves the import, because that is the check that turns
# "the row composed" into "the module loads".
#
# The import runs from INSIDE the profile, not from the repo: the bundle's
# `@deepseek-ai/*` peers resolve through the profile's node_modules, so
# importing it from anywhere else fails with ERR_MODULE_NOT_FOUND for
# `@deepseek-ai/schemastery` — which says nothing about where it actually runs.
# The build already happened above, BEFORE the install — rebuilding here would be
# too late: pnpm has already copied the snapshot into the virtual store.
echo "==> import check (an unimportable plugin gates nothing)"
( cd "$PROFILE_DIR" \
    && node -e "import('@freepeak/dsh-feature-loop').then(() => console.log('   the plugin IMPORTS inside this profile'), e => { console.error('   import FAILED: ' + String(e.message).split('\\n')[0]); process.exit(1) })" ) \
  || { echo "error: the plugin is installed but INERT — the row composes, the" >&2
       echo "       client bundle is in the boot graph, and nothing is gated." >&2
       echo "       fix: npm run build in the repo, then reinstall with pnpm 9." >&2
       exit 1; }

echo "==> compose check"
node "$CLI" --profile "$NAME" --dump-config | grep -q "id: feature-loop" \
  || { echo "error: the feature-loop row did not compose" >&2; exit 1; }
node "$CLI" --profile "$NAME" --dump-config | grep -A 12 -m1 "id: feature-loop"

cat <<EOF

Next:
  node "$CLI" --profile $NAME --port $PORT --no-open

Then read the two token lines in the log:
  dsh web: http://127.0.0.1:$PORT/?token=...
  feature-loop dashboard: http://127.0.0.1:$DASH/?token=...

TWO THINGS BEFORE YOUR FIRST LOOP — both are silent, both were found by
running this (2026-10-01, against DSH 0.2.0-rc.1):

1. ONEGW_API_KEY must be in the ENVIRONMENT that boots the server. The profile
   references it by name (apiKeyEnv), so the key is never written into the
   profile — and a server started without it boots perfectly, serves both
   surfaces, records the run on the dashboard, and then fails the first model
   call with:
       llm-pi-ai: no credential for provider route "onegw"
   which reads as a plugin failure and is not one.

       ONEGW_API_KEY=sk-... node "$CLI" --profile $NAME --port $PORT --no-open

   or start it from a shell that already exports it.

2. Add a Workspace. A new DSH home has none, and the Feature Loop page says
   so — correctly, because guessing which checkout to write into is the wrong
   default:
       No workspace is registered yet — open a project folder, then start the loop.
   Use the sidebar's **Add workspace**. Once one exists every run is: type a
   task, press **Start loop**, click **Allow once**.
EOF
