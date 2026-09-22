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
# Version pinning is deliberate. `@deepseek-ai/dsh`'s `latest` tag (0.1.5-rc.2)
# is BROKEN: it depends on `@deepseek-ai/dsh-client-ui-sidebar-documentpreview@^0.1.5-rc.3`,
# which was never published, so `npm install @deepseek-ai/dsh` fails with
# ETARGET. 0.1.7-alpha.1 is the newest tag whose tree resolves; verified by
# installing and booting it.
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

COPY package.json package-lock.json* .npmrc ./
RUN npm install --no-audit --no-fund

COPY src ./src
COPY tsconfig.json cordis.patch.yml ./

RUN npm run build && test -f lib/index.mjs

# ---------------------------------------------------------------------------
# Stage 2 — runtime.
# ---------------------------------------------------------------------------
FROM node:22-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production

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
      @deepseek-ai/dsh@0.1.7-alpha.1 \
 && ln -s /opt/dsh/node_modules/.bin/dsh /usr/local/bin/dsh

ENV DSH_BIN=/usr/local/bin/dsh \
    DSH_HOME=/data

# Provision the profile at build time so first boot is offline and deterministic.
# `--dump-config` is what makes this non-interactive: it creates the profile from
# the shipped template and exits instead of booting the app.
RUN mkdir -p /opt/dsh-home \
 && DSH_HOME=/opt/dsh-home dsh dsh-fl --from-default-profile web --dump-config > /dev/null \
 && DSH_HOME=/opt/dsh-home dsh plugin --profile dsh-fl add -w \
      @deepseek-ai/dsh-experimental-agent-team-profile@0.1.5-alpha.2 \
      @deepseek-ai/dsh-experimental-agent-team-web-profile@0.1.5-alpha.2

# The plugin itself: package.json + built lib + its cordis patch.
COPY --from=plugin-build /build/lib              /opt/feature-loop/lib
COPY package.json cordis.patch.yml               /opt/feature-loop/

RUN DSH_HOME=/opt/dsh-home dsh plugin --profile dsh-fl add -w file:/opt/feature-loop \
 && DSH_HOME=/opt/dsh-home dsh --profile dsh-fl --dump-config \
      | grep -q 'feature-loop'

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
