# The DeepSeek Harness web UI with the feature loop and Agent Teams, containerised.
#
# No `# syntax=` directive on purpose: that pins an external BuildKit frontend
# image which must be fetched from Docker Hub, and on a network that reaches the
# npm registry but not that registry it fails with a TLS handshake timeout before
# any stage runs. Everything below is classic Dockerfile syntax, so the bundled
# frontend is sufficient.
#
# WHY THIS DOES NOT BUILD THE HARNESS MONOREPO
#
# The obvious Dockerfile copies `deepseek-harness` and runs its build. That is
# ~2.3 GB of source with native and Python components, and it is unnecessary:
# the CLI and every bundle this setup needs are published to npm. So the image
# installs `@deepseek-ai/dsh` and its bundles from the registry, and builds only
# the one package that is NOT published — the feature-loop plugin.
#
# Version pinning is deliberate, and it is not "latest" for a reason.
#
# The `latest` dist-tag has twice been a tree that cannot install: it pointed at
# 0.1.5-rc.2, which depends on `@deepseek-ai/dsh-client-ui-sidebar-documentpreview@^0.1.5-rc.3`
# — never published — so `npm install` fails with ETARGET. Pinning an exact
# version is the only way this image builds the same way twice.
#
# 0.2.0-rc.2 (2026-10-01) replaces 0.1.7-alpha.1: its 608-package tree resolves
# cleanly, and it is the same 0.2 line the local harness checkout runs
# (apps/cli/package.json 0.2.0-rc.1), so the container and the local profile
# exercise the same harness generation.
#
# The two agent-team bundles do NOT move together, and the versions look wrong
# side by side for a reason:
#
#   agent-team-profile      0.2.0-rc.2  — has a 0.2 tag; matches the harness.
#   agent-team-web-profile  0.1.6-alpha.2 — the NEWEST tag that exists. There is
#     no 0.2 of it: its `latest` is still 0.1.5-alpha.2, and the 0.1.6 tree
#     resolves (verified: 76 packages, clean install).
#
# So the web half is one minor behind on purpose. Bumping the harness without it
# would need a web-profile release that does not exist, and pinning the whole
# image back to 0.1.x to keep the pair in step would undo the 0.2 harness the
# feature loop is verified against. These two lines are the ones to re-check on
# any harness upgrade, in this order.
#
# ponytail: one tag, checked by the build rather than by a script that would go
# stale — the RUN below installs exactly this and the build fails loudly if the
# tree stops resolving. Upgrade path is a Dependabot PR on this one line.
#
# ---------------------------------------------------------------------------
# Stage 1 — build the feature-loop plugin.
#
# `npm install` is enough now that the manifest no longer pins the harness's
# unpublished workspace versions (cordis 0.4.0, schemastery 0.1.5). It installs
# two packages — tsdown and typescript — because the `@deepseek-ai/*` packages in
# peerDependencies are marked optional and supplied by the deployment at runtime.
# `.npmrc` sets `auto-install-peers=false`: some transitive peer dependencies are
# harness-internal (`@deepseek-ai/dsh-type-meta`) and are not on npm, so peer
# auto-installation would fail the install.
#
# No harness packages are needed to build: the bundle keeps `@deepseek-ai/*`
# imports external (they resolve at runtime from the profile), so the build has
# no cross-package type resolution to do.
# ---------------------------------------------------------------------------
FROM node:22-slim AS plugin-build

WORKDIR /build

# A registry mirror for a FILTERED network, opt-in and uncommented by whoever
# needs it. Set it as a build arg so the default build is byte-identical to the
# one that has always worked:
#
#   docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com
#
# Why an ARG rather than a checked-in `.npmrc` line: every install in this image
# needs it, including the `pnpm install` that provisions the plugin into the
# baked profile and the two global installs below, and a mirror baked into a
# layer is a supply-chain decision nobody asked for. Measured 2026-10-03 behind
# SNI filtering: the TLS handshake to Cloudflare's edge succeeded for
# `example.com` and stalled for `registry.npmjs.org`, so `nc 443` succeeds and
# every npm command hangs instead of failing — which is what this arg is for.
ARG NPM_REGISTRY=
ENV npm_config_registry=${NPM_REGISTRY}

COPY package.json package-lock.json* .npmrc ./
# No telemetry opt-out needed: the OpenUI dependency that shipped an
# install-time ping is gone from the manifest.
RUN npm install --no-audit --no-fund

COPY src ./src
COPY tsconfig.json cordis.patch.yml ./

# `assets/` is NOT build output — it is checked in, and `src/dashboard.ts`
# readBundleAsset() fails the module import when the three vendored
# assistant-ui files are missing. That is a good failure (loud, with the fix
# named) and it is why the container booted to "feature-loop: failed to import"
# instead of a blank page: this stage built lib/ and copied neither assets/ nor
# client.js, and the profile was installed from the result. Verified 2026-10-01.
COPY assets ./assets
COPY client.js ./client.js

RUN npm run build && test -f lib/index.mjs \
 && test -f assets/assistant-ui/dashboard.js

# ---------------------------------------------------------------------------
# Stage 2 — runtime.
# ---------------------------------------------------------------------------
FROM node:22-slim AS runtime

# The same mirror arg, and the same reason: this stage installs pnpm, the
# harness CLI, and provisions the plugin with `pnpm install`. Both stages need
# it and neither should hardcode it.
ARG NPM_REGISTRY=
ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    npm_config_registry=${NPM_REGISTRY}

# `dsh plugin ...` forwards its arguments to pnpm, so pnpm must exist. The
# profile is provisioned at BUILD time (below), which means the running
# container needs no registry access and no network beyond the model gateway.
#
# Deliberately no `apt-get install`: this base image already ships
# ca-certificates, and the only other tool the entrypoint used to need
# (gettext's envsubst) is replaced by a `sed` substitution. Verified: with an
# `apt-get install ca-certificates gettext-base` line the build fails at
# `apt-get update` — the build network allows the npm registry but not the
# Debian mirrors.
RUN npm install -g --no-audit --no-fund pnpm@9.15.9 \
 && npm install --prefix /opt/dsh --no-audit --no-fund --no-save \
      @deepseek-ai/dsh@0.2.0-rc.2 \
 && ln -s /opt/dsh/node_modules/.bin/dsh /usr/local/bin/dsh

ENV DSH_BIN=/usr/local/bin/dsh \
    DSH_HOME=/data

# Provision the profile at build time so first boot is offline and deterministic.
# `--dump-config` is what makes this non-interactive: it creates the profile from
# the shipped template and exits instead of booting the app.
RUN mkdir -p /opt/dsh-home \
 && DSH_HOME=/opt/dsh-home dsh dsh-fl --from-default-profile web --dump-config > /dev/null \
 && DSH_HOME=/opt/dsh-home dsh plugin --profile dsh-fl add -w \
      @deepseek-ai/dsh-experimental-agent-team-profile@0.2.0-rc.2 \
      @deepseek-ai/dsh-experimental-agent-team-web-profile@0.1.6-alpha.2

# The plugin itself: package.json + built lib + its cordis patch. `assets/` and
# `client.js` are copied from plugin-build, not from this stage's context: the
# runtime stage copies a slim context, and a missing `assets/` fails the import
# with "dashboard bundle asset missing" — the first version of this file copied
# only lib/ and produced exactly that, on a clean boot with no other symptom.
COPY --from=plugin-build /build/lib              /opt/feature-loop/lib
COPY --from=plugin-build /build/assets           /opt/feature-loop/assets
COPY --from=plugin-build /build/client.js        /opt/feature-loop/client.js
COPY package.json cordis.patch.yml               /opt/feature-loop/

RUN DSH_HOME=/opt/dsh-home dsh plugin --profile dsh-fl add -w file:/opt/feature-loop \
 && DSH_HOME=/opt/dsh-home dsh --profile dsh-fl --dump-config \
      | grep -q 'feature-loop' \
 # A row in --dump-config proves the ENTRY composed, not that the module
 # imports: `client-modules` reads `dsh.client` from package.json on disk and
 # never imports it, and the loader prints "failed to import" as a warning the
 # boot carries on past.
 #
 # The import has to run from INSIDE the profile, not from /opt/feature-loop:
 # the bundle's `@deepseek-ai/*` peers resolve through the profile's
 # node_modules, and importing it from its install directory fails with
 # ERR_MODULE_NOT_FOUND for `@deepseek-ai/schemastery` — which says nothing
 # about whether it works where it actually runs. This is the check that catches
 # a broken plugin at build time instead of as a silently ungated container.
 && cd /opt/dsh-home/profiles/dsh-fl && \
    node -e "import('@freepeak/dsh-feature-loop').then(() => console.log('feature-loop imports'))" \
 && test -f /opt/feature-loop/assets/assistant-ui/dashboard.js

# The per-profile activation patch (spec, gate policies, gateMode) and the
# settings template. Both are seeded into $DSH_HOME on first run.
COPY docker/profile.patch.yml                    /opt/templates/profile.patch.yml
COPY docker/settings.template.yaml               /opt/templates/settings.template.yaml
COPY docker/entrypoint.sh                        /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/data"]
# 8099 is the relay the entrypoint exposes; the harness UI itself listens on
# 127.0.0.1:3099 inside the container (see the entrypoint for why).
EXPOSE 8099

# Probes the relay port, which is the path Docker actually publishes.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.DSH_INTERNAL_PORT||8099)+'/').then(r=>process.exit(r.status===401||r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
