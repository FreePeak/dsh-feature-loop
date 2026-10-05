# Running the feature loop + Agent Teams in Docker

One command gives you the DeepSeek Harness web UI with the feature-loop plugin
and Agent Teams installed, the permission preset already correct, and the human
approval panel working.

```bash
cd dsh-feature-loop

make up          # build if needed, start detached, print the URL + token
make help        # every target, with variables
```

`make up` reads the gateway key from `~/.dsh/.credentials.yaml` when the
environment does not have it, so the common case needs no arguments:
`make up ONEGW_API_KEY=sk-...` overrides, and `make up HOST_PORT=3101` moves the
port.

The equivalent without make:

```bash
ONEGW_API_KEY=sk-... docker compose -f docker/docker-compose.yml up -d --build
docker compose -f docker/docker-compose.yml logs -f   # the URL + token
```

### Container targets

| Target | Does |
|---|---|
| `make up` | Build if needed, start detached, wait until the UI answers, print the URL + token |
| `make down` | Stop and remove the container. **The volume survives**, so sessions do |
| `make stop` / `make start` | Stop / start without removing |
| `make restart` | Restart, then re-print the URL (the token rotates on every boot) |
| `make logs` | Follow the log — the `dsh web:` line carries the token |
| `make url` | Print the URL + token for the running container |
| `make dashboard` | Print the approval dashboard's URL + token (loopback, port 3092) |
| `make health` | Container status, the HTTP probe, and the published binding |
| `make shell` | Shell inside the container |
| `make clean` | **Destructive**: removes the container **and the loop history** (asks to confirm). Sessions survive |
| `make clean-all` | **Fully destructive**: container, history, sessions, settings, profile |
| `make rmi` | Remove the image |
| `make ports` | Which of 3081/3097/3099/3090 are in use — read-only, never disturbs them |
| `make e2e-container` | Probe the container's OWN gate, on the disk: refused with no answerer, allowed with one, and the approval pair on the durable session log |

Checks that need no container: `make check` (tests + typecheck), `make test`,
`make typecheck`, `make integration`, `make compose-check`, and `make verify`
(all of it).

Two volumes, split by blast radius — both pinned with `name:` in the compose
file, because compose would otherwise prefix them with the directory name
(`docker_`), and then `make clean` and this document would name volumes that
do not exist:

- **`dsh-data`** (`/data`): profile, settings, sessions, logs. Survives
  `make clean`.
- **`dsh-fl-data`** (`/data/.feature-loop`): the loop's run history
  (`runs.jsonl`). `make clean` removes this one only — metrics reset without
  touching sessions. `make clean-all` removes both.

### Two things the container cannot do for you

Both were found by running it, not by reading it, and neither produces an
error — the UI boots clean and looks completely fine.

**1. Add a Workspace before your first loop.** A fresh container's
`/data/storages/workspace.json` has `"workspaceIds": []`, and the Feature Loop
page says, correctly and usefully:

> No workspace is registered yet — open a project folder, then start the loop.

That is the plugin refusing to guess which checkout to write into, and it is the
behaviour you want — but it is also the first thing that makes a fresh container
look unusable. Click **Add workspace** in the sidebar. Inside the container the
picker resolves to the browse flow, and **Open** with no argument registers the
working directory (`/root`). To loop over a real checkout instead, mount it:

```yaml
    volumes:
      - ${PWD}:/workspace        # your project, read-write
```

then Add workspace → `/workspace`. Once one exists, every loop from then on is
just: type a task, press **Start loop**, click **Allow once**.

**2. The loop's model route is set by the profile, and the ladder must name
models the provider actually lists.** Two rows, and both were wrong at some
point with no error:

`docker/profile.patch.yml` sets `agent-default-model` to `provider: onegw`.
Without that row the loop runs on the harness's own default
(`provider: deepseek-official`) and every model call in the container dies with

```
llm-deepseek: no API key for provider route "deepseek-official"
```

— while the UI, the dashboard and the approval panel all look perfect.

The same file's `ladder` must name model ids that appear in
`docker/settings.template.yaml`'s `models:` list, because **llm-pi-ai resolves a
rung against that list, not against the gateway**. A rung the gateway serves but
the settings do not declare fails on step 1 with

```
pi-ai provider "onegw" has no configured model "execution"    (UNKNOWN_MODEL)
```

and `prices:` must key the same `provider/model` strings the ladder uses, or
the cost ceiling has no price for the route the loop took (`unpricedSteps: 1`,
against a ceiling that can then never stop anything).

Open `http://127.0.0.1:3090/?token=...` — host port **3090** maps to the
container's relay port **8099**, which forwards to the UI on `127.0.0.1:3099`
inside the container (see the port-binding section for why the relay exists).
The `dsh web:` line reports the *internal* address, so its port is 3099 while the
URL you open is 3090 — that difference is expected.

The **approval dashboard** (the HITL web page for answering gated steps and
watching the run) prints its own line — `feature-loop dashboard: …/?token=…` —
and `make dashboard` turns it into the host URL: `http://127.0.0.1:3092/?token=…`
(host port **3092** → container **8100**, loopback-published like the UI). A
volume seeded before the dashboard existed needs `FORCE_REINIT=1 make up` to
pick up the `dashboard:` config row.

---

## Why this does not build the harness monorepo

The obvious Dockerfile copies `deepseek-harness` and runs its build: ~2.3 GB of
source with native and Python components. It is unnecessary. The CLI and every
bundle this setup needs are published to npm, so the image installs them from the
registry and builds only the one package that is *not* published — this plugin.

| Component | Source | Pinned |
|---|---|---|
| Harness CLI | npm | `@deepseek-ai/dsh@0.1.7-alpha.1` |
| Base + web UI bundles | npm (via `--from-default-profile web`) | shipped with the CLI |
| Agent Teams | npm | `…-agent-team-profile@0.1.5-alpha.2`, `…-agent-team-web-profile@0.1.5-alpha.2` |
| Feature-loop plugin | built in stage 1 | this repo |

**Do not use `@deepseek-ai/dsh@latest`.** The `latest` tag (0.1.5-rc.2) is
broken: it depends on `@deepseek-ai/dsh-client-ui-sidebar-documentpreview@^0.1.5-rc.3`,
which was never published, so `npm install` fails with ETARGET. `0.1.7-alpha.1`
is the newest tag whose dependency tree resolves — verified by booting it.

`npm install` **does** now run inside the plugin checkout — it installs the
build tooling plus the UI runtime the dashboard bundles (`@assistant-ui/react`,
`react`), and that is what stage 1 does. It used
to be impossible: the manifest pinned `@deepseek-ai/cordis@0.4.0` and
`@deepseek-ai/schemastery@0.1.5`, harness-monorepo *workspace* versions that were
never published, so npm aborted with ERR_PNPM_NO_MATCHING_VERSION. The harness
packages are now optional peers, and `.npmrc` disables peer auto-installation
(some transitive peers, e.g. `@deepseek-ai/dsh-type-meta`, are unpublished).

The dashboard's React bundle is committed under `assets/assistant-ui/`, so the
image never builds it: `npm run dashboard-bundle` (host side) regenerates the
artifact, and `web/build.mjs` refuses to emit one that carries `assistant-cloud`
or telemetry code. See the dashboard section of the root README.

---

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `ONEGW_API_KEY` | yes | Gateway key. Referenced from `settings.yaml` by name (`apiKeyEnv`), never written into a file. |
| `ONEGW_BASE_URL` | no | The gateway **as seen from inside the container**. Defaults to `http://host.docker.internal:8080/v1`, which works on macOS/Windows and on Linux via the compose `extra_hosts` entry. |
| `DSH_HOST_PORT` | no | Host port. Defaults to `3090`. |
| `DSH_DASHBOARD_PORT` | no | Host port for the approval dashboard. Defaults to `3092` (container-internal 8100). |
| `DSH_PROFILE` | no | Profile name. Defaults to `dsh-fl`. |
| `FORCE_REINIT` | no | `1` re-seeds the profile, the activation patch **and `settings.yaml`** from the image — **required once** if the volume predates the dashboard, and required again after any change to the shipped `settings.template.yaml`. It removes `settings.yaml.imported` too, because the harness renames a legacy settings file on first import and that marker otherwise makes the re-render unreachable forever. Without this the patch row and the resolver can disagree: the patch says `model: execution` while the settings still declare other ids, and the run dies `UNKNOWN_MODEL` on step 1. |
| `NPM_REGISTRY` | no | A registry **build argument**, empty by default. Set it behind a filtered network: `NPM_REGISTRY=https://registry.npmmirror.com docker compose … build`. Both Dockerfile stages take it, because every install in the image needs it. Not a committed `.npmrc` line on purpose — see the note below. |

### Behind a network that filters npmjs

Measured 2026-10-03 on a path where `registry.npmjs.org` was unreachable: TCP to
Cloudflare's edge connects, DNS resolves, `github.com` answers, and the **TLS
handshake stalls only for npmjs SNIs** (`openssl s_client` succeeds for
`example.com` and `registry.yarnpkg.com` on the same address). So
`npm install`, `pnpm install` and every `docker build` here appear to **hang**
rather than fail — which is what makes it expensive to diagnose.

`NPM_REGISTRY` is a build argument rather than a `.npmrc` line because a mirror
baked into a committed file silently changes where every package on every
developer's machine comes from. If your network filters npmjs, export the mirror
for the build:

```bash
NPM_REGISTRY=https://registry.npmmirror.com docker compose -f docker/docker-compose.yml build
```

The default build — no argument — is unchanged.

### The gateway address is the one thing that usually needs changing

Inside a container, `localhost` is the container. If your gateway runs on the
host at `:8080`, the default above is already right on Docker Desktop and on
Linux (compose supplies `host.docker.internal`). If it listens somewhere else,
set `ONEGW_BASE_URL`; if you add it as a compose service, it becomes
`http://<service>:8080/v1`.

---

## Port binding: two fences, and the small relay that gets around both

DSH refuses a wildcard bind at **two** layers:

1. **The web-app CLI** rejects the flag outright:
   ```
   error: --host 0.0.0.0 is intentionally not supported yet for safety: it would
   expose remote code execution to the network; use 127.0.0.1 instead
   ```
2. **The webserver plugin's config schema** accepts only `127.0.0.1` or `0.0.0.0`
   — so binding the container's own address (the usual trick) is rejected too:
   ```
   ValidationError: invalid config: $.host expected "127.0.0.1" | "0.0.0.0"
   but got "172.17.0.4"
   ```

| Binding | Result |
|---|---|
| `0.0.0.0` | Refused by the CLI (and it is the thing the fence exists to prevent) |
| container's own IP | Refused by the plugin schema |
| `127.0.0.1` | Accepted — but Docker's port forwarding cannot reach a loopback-only listener, so the published port refuses connections |

**What the image does instead:** the harness binds `127.0.0.1` exactly as its own
error message recommends, and `entrypoint.sh` starts a ~10-line Node relay that
listens on the container's external interface and forwards to it. Compose then
publishes to the **host loopback**:

```yaml
ports:
  - "127.0.0.1:3090:8099"     # relay port; host loopback only
```

Nothing about the app's security posture changes:

- The harness process is unmodified and still binds loopback, as intended.
- Every request still carries the harness's own auth token; the relay adds no
  authentication of its own and grants no access the app would not.
- The published port is bound to `127.0.0.1` on the host, so the UI is reachable
  **from this machine and nowhere else** — the same exposure as running `dsh`
  natively, which is what the fence is protecting.*

The relay is a consequence of the harness having no sanctioned "behind a
container" mode in this published version, not a preference. If that changes,
delete the relay and pass the supported flag.

<sub>* If you actually want the UI reachable from other machines, that is a
different decision from containerising it, and the harness deliberately does not
support it yet. Do that consciously — not by accident via a port mapping.</sub>

---

## The permission preset, and why the image pins it

`docker/settings.template.yaml` sets:

```yaml
permission:
  defaultPreset: workspace-write
```

That single line is what makes the approval panel appear. `permission-presets`
applies the default preset's approval policy **directly** on a fresh session,
*after* the `approval` bundle's own `policy:` default — and because it is a
settings section, a profile's `cordis.patch.yml` cannot override it.

| `defaultPreset` | Approval policy | A feature-loop `ask` becomes |
|---|---|---|
| `workspace-write` | `ask` | **A panel** in the composer: Reject / Allow once |
| `danger-full-access` | `never` | `Error: the user rejected tool "X"` — no panel, and it blames a user who was never asked |

If you point the mounted settings at `danger-full-access`, the human-in-the-loop
step stops working. The template's comment says so where you would edit it.

It also changes the sandbox: `workspace-write` confines writes to the session
workspace, so edits inside your project work and writes elsewhere ask first.
That is the intended behaviour for an approval-gated loop.

---

## What is inside the image

```
/opt/dsh/                     the harness CLI (npm)
/opt/dsh-home/profiles/dsh-fl baked profile: base + web UI + Agent Teams + plugin
/opt/feature-loop/            this plugin: package.json, cordis.patch.yml, lib/
/opt/templates/               profile.patch.yml, settings.template.yaml
/usr/local/bin/entrypoint.sh  seeds /data, then boots the UI
/data                         volume: profile copy, settings, sessions, logs
```

The profile is provisioned **at build time**, which is why the running container
needs no npm registry access — only the model gateway.

---

## Everyday commands

```bash
# start (after the first build)
ONEGW_API_KEY=sk-... docker compose -f docker/docker-compose.yml up -d

# the URL with its token
docker compose -f docker/docker-compose.yml logs | grep 'dsh web:'

# stop, keep sessions
docker compose -f docker/docker-compose.yml down

# stop and wipe everything (sessions, settings, the seeded profile)
docker compose -f docker/docker-compose.yml down -v

# rebuild after changing plugin source
docker compose -f docker/docker-compose.yml build --no-cache
```

## Verified: what was actually observed

Built and run on this machine (Docker 29.8.0, macOS/arm64):

| Check | Result |
|---|---|
| `docker compose build` | ✅ image `dsh-feature-loop:local`; the build **asserts** `feature-loop` composes, so a broken bundle fails the build |
| Container boots | ✅ entrypoint seeds the profile, installs the activation patch, renders settings, starts the UI |
| UI serves through the published port | ✅ `http://127.0.0.1:3090/` → `401` |
| Auth flow end to end | ✅ token → `303` + `dsh-auth-*` cookie (authority `127.0.0.1:3090`) → `200` |
| Published binding | ✅ `docker port` → `8099/tcp -> 127.0.0.1:3090` (host loopback only) |
| Composition inside the container | ✅ `feature-loop` with `gateMode: ask`; 4 Agent Teams rows; `dsh-client-ui-approval` mounted |
| Permission preset | ✅ `workspace-write`, from both the composition default and the imported settings |
| Settings rendered from env | ✅ `baseURL: http://host.docker.internal:8080/v1`, `apiKeyEnv: ONEGW_API_KEY` — verified in the container's rendered settings |
| Image composition | ✅ 5 rows matched: `feature-loop` + all 4 Agent Teams rows |
| Idempotent restart | ✅ first boot seeds + renders; restart logs *"profile already present"* / *"settings already present"* and changes nothing (the marker is `settings.yaml.imported` — the harness renames an imported settings file, so probing `settings.yaml` alone looked absent every boot) |
| Container health | ✅ `docker inspect` → `healthy` |

```bash
# the composition, checked from inside a running container
docker exec <container> sh -c 'DSH_HOME=/data dsh --profile dsh-fl --dump-config \
  | grep -A6 -m1 "id: feature-loop"'
```

### A behavioural probe, and what it found about itself

`make e2e-container` runs a real model through the real gate **inside the running
container**, asserting the disk rather than the dashboard — a dashboard that
reports "allowed" while nothing was written is the failure this exists to catch.
It was NOT possible before: `../docker/README.md` said so, because the image
ships the web bundles only and has no headless runner. That was true of the
IMAGE and not of the CONTAINER — `@deepseek-ai/dsh-headless` is published, so
the probe composes a second profile inside the running container. Nothing is
baked and nothing is mounted; the shipped image is unchanged.

```
==> 1/3  fail-closed: no watcher, so the irreversible write must be refused
   the plugin imports inside the probe profile ✓
   refused, no file  ✓
==> 2/3  allow: the same gate, settled through the dashboard API
   settle {"tool":"write","status":200,"body":"{\"ok\":true,\"outcome\":\"allowed-once\"}"}
   written: "hello"  ✓
==> 3/3  audit trail: approval/asked + approval/decided must be in the session log
   1 approval/asked, 1 approval/decided=allowed-once ✓

probe passed: refused without an answerer, allowed with one, audited on disk
```

Three runs, back to back, on DSH 0.2.0-rc.2 — which is what the stale-port
trap in the script's header needs; the second run otherwise dies with
EADDRINUSE before it can print a token.

**The probe is narrower than it looks, and it found that out itself.** Step 1 is
meant to catch a misconfigured gate, so `gateMode: auto` was set in the profile —
a value `Config` rejects outright (`expected "ask" | "deny" but got "auto"`) —
and the probe passed anyway. Two correct behaviours, neither visible from
outside:

- `--dump-config` does not validate, so the profile still composes;
- `createPolicy` does `gateMode: options.gateMode ?? 'ask'`, so an unrecognised
  value falls through to the **safe** default. `ask` with no answerer refuses, so
  the gate held.

That is the right direction for a safety setting and the wrong lesson: step 1
cannot distinguish *"the gate is right"* from *"the gate is misconfigured in a
way that happens to default to asking"*. It stays, and the claim it makes is the
narrow one the transcript shows.

**Re-measured 2026-10-03, and the second half is now a hard failure.** The
`Config` schema is exported because cordis asks for it, and it is **not run** —
`gateMode: auto` composed, loaded, and ran a full turn. `apply` now throws on an
unrecognised `gateMode`, naming the field:

```
feature-loop (@freepeak/dsh-feature-loop): Error: gateMode must be "ask" or
"deny", received "auto". "ask" prompts a human; "deny" refuses outright for
unattended runs.
```

Two things that measurement settled, both worth keeping:

- **the throw is loud, not fatal.** The harness prints the message as a warning,
  the plugin never constructs, and the run still **answers** — `say hi` came
  back with no gate in the loop. So the sentence that names the field is what the
  throw buys; the protection is still `?? 'ask'` plus `ask` failing closed.
  Verified on the same profile: `Create a file … gm2-proof.txt` under
  `gateMode: ask` is **denied**, no file.
- **`--dump-config` is not the reason.** It skips validation, which is why the
  dump showed `gateMode: auto` — but the *load* path did not reject it either,
  and that was the finding.

### What is NOT verified in-container

- **The rendered approval panel.** Same reason as everywhere else in this repo:
  it needs a human click. The preset that makes it appear is pinned, and the
  composition is asserted — see the acceptance checklist in
  `../docs/RUNBOOK-SERVER.md` §0.
- **`costBudgetUSD` inside the container.** The probe reads a non-zero
  `spentUSD` from `/api/state` on a live run, so this is now exercised — but it
  is the one number here that comes from metered usage, and a gateway that
  reports none makes it read `0.00`. `maxSteps` is the ceiling to trust.
  See `../docs/PRD.md` §9.

## Things that failed on the way, and what fixed them

Recorded because each one costs an hour if you hit it cold:

| Failure | Cause | Fix |
|---|---|---|
| `npm install @deepseek-ai/dsh` → ETARGET | The `latest` tag (0.1.5-rc.2) depends on an unpublished package | Pin `0.1.7-alpha.1` |
| `apt-get install` in the build | The build network reaches npm but not the Debian mirrors | Install nothing from apt; the base image already has `ca-certificates`, and `envsubst` was replaced with `sed` |
| `failed to resolve source metadata for docker.io/docker/dockerfile:1` | The `# syntax=` directive fetches an external BuildKit frontend from Docker Hub | Remove the directive; classic syntax is enough |
| `--host 0.0.0.0 ... not supported yet for safety` | The harness fences the wildcard bind | Bind `127.0.0.1` and relay — see the port-binding section |
| `ValidationError: $.host ... but got 172.17.0.4` | The webserver schema accepts only `127.0.0.1` or `0.0.0.0` | Same relay |
| `docker compose build` fails asking for `ONEGW_API_KEY` | `${VAR:?}` is interpolated at parse time, even for `build` | Use `${VAR:-}`; the entrypoint warns instead |
| `dsh: failed to parse overlay ... cordis.patch.yml` | The template is an empty `[]` document; appending a block sequence is invalid YAML | The entrypoint strips the `[]` before appending |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `WARNING: ONEGW_API_KEY is unset` in the logs | The key was not passed | Restart with `-e ONEGW_API_KEY=...`. The UI starts anyway so you can inspect the setup, but model calls fail. |
| Model calls fail, UI fine | Gateway unreachable from the container | Check `ONEGW_BASE_URL`; on Linux confirm the `extra_hosts` entry (already in compose) |
| No approval panel, tool calls show `Error: the user rejected tool` | The session preset is not `workspace-write` | It is pinned in `settings.template.yaml`; if you changed it, restore it and restart. **Deleting `/data/settings.yaml` does nothing** — the harness renames an imported settings file to `settings.yaml.imported`, so the live file is that one; edit it, or reset the volume with `down -v` |
| `dsh: failed to parse overlay ... cordis.patch.yml` | The activation patch left the template's `[]` document in place | The entrypoint strips it; re-seed with `FORCE_REINIT=1` |
| Port 3090 already in use | Something else on the host | `DSH_HOST_PORT=3101 docker compose ... up` |
| `make dashboard` prints "no dashboard line yet" | The volume was seeded before the dashboard existed, or the row is disabled | `FORCE_REINIT=1 make up` re-seeds the activation patch from the image |
| Changes to plugin source not visible | The image baked the old `lib/` | `docker compose ... build --no-cache` |

---

## Honest limits

- **See "What is NOT verified in-container" above** for the panel and the
  absence of a behavioural probe inside this image.
- **`costBudgetUSD` measures zero.** `LoopBudget.spend()` is never called with
  real usage, so only `maxSteps` is a trustworthy ceiling. See
  `../docs/PRD.md` §9.
- **The image contains no credentials.** The key is passed at run time and
  referenced by name from settings.
