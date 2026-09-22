# dsh-feature-loop — make targets
#
# The container targets all drive docker/docker-compose.yml, which is the one
# compose file in this repo and defines ONE service (`dsh-feature-loop`).
#
#   make up        build if needed, start detached, print the URL + token
#   make down      stop and remove the container (sessions survive in the volume)
#   make logs      follow the log, which is where the token is printed
#
# Two things worth knowing before you run these:
#
# 1. ONEGW_API_KEY must be set for model calls to work. `make up` injects it from
#    ~/.dsh/.credentials.yaml when the environment does not have it, so the
#    common case is just `make up`. `make up HOST_PORT=3101` moves the host port.
#
# 2. The host port defaults to 3090 and is bound to 127.0.0.1 only. The harness
#    refuses to listen on 0.0.0.0 (it would expose remote code execution), and
#    compose deliberately matches that posture: reachable from this machine and
#    nowhere else. See docker/README.md.
#
# `make help` lists everything.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ── configuration ──────────────────────────────────────────────────────────
COMPOSE      ?= docker compose -f docker/docker-compose.yml
SERVICE      ?= dsh-feature-loop
VOLUME       ?= dsh-fl-data
HOST_PORT    ?= 3090
# The HITL approval dashboard's published host port (compose maps it to the
# container's 8100). 3092 sits clear of the protected ports and of 3090/3091.
DASHBOARD_PORT ?= 3092
DSH_HARNESS  ?= $(HOME)/work/harvey/freepeak/deepseek-harness
CREDENTIALS  ?= $(HOME)/.dsh/.credentials.yaml

# Ports that must never be disturbed: the user's own GUI and the local dev
# servers from the verification docs.
PROTECTED_PORTS := 3081 3097 3099

# How the container was created matters for introspection. `make up` creates it
# via compose, but a container started by hand (`docker run ...`) is invisible to
# `docker compose logs/ps`, so the read-only targets below talk to the Docker
# daemon directly by name. That works for both.
# Compose is used only for build / up / down.
#
# Compose interpolates ${ONEGW_API_KEY:-} at parse time. Export it from the DSH
# credential store when the caller has not already set it, so `make up` works
# without the key being pasted on the command line (and without it landing in
# shell history).
define export_key
	@if [ -z "$$ONEGW_API_KEY" ] && [ -f "$(CREDENTIALS)" ]; then \
	  export ONEGW_API_KEY=$$(sed -n 's/^[[:space:]]*ONEGW_API_KEY:[[:space:]]*\([^[:space:]]*\).*/\1/p' "$(CREDENTIALS)" | head -1); \
	fi; \
	if [ -z "$$ONEGW_API_KEY" ]; then \
	  echo "  ! ONEGW_API_KEY is not set and not found in $(CREDENTIALS)."; \
	  echo "    The UI will start, but every model call will fail."; \
	  echo "    Pass it with: make up ONEGW_API_KEY=sk-..."; \
	fi
endef

# ── help ───────────────────────────────────────────────────────────────────
.PHONY: help
help: ## Show this help
	@echo "dsh-feature-loop — make targets"
	@echo
	@echo "  containers (docker/docker-compose.yml, service '$(SERVICE)')"
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo
	@echo "  variables: HOST_PORT=$(HOST_PORT)  DASHBOARD_PORT=$(DASHBOARD_PORT)  SERVICE=$(SERVICE)  VOLUME=$(VOLUME)"
	@echo "             DSH_HARNESS=$(DSH_HARNESS)"
	@echo
	@echo "  protected ports (never touched by these targets): $(PROTECTED_PORTS)"

# ── container lifecycle ────────────────────────────────────────────────────
.PHONY: build
build: ## Build the plugin with tsdown into lib/
	@command -v pnpm >/dev/null 2>&1 && pnpm build || npm run build

.PHONY: image
image: ## Build the container image
	@$(export_key); $(COMPOSE) build

.PHONY: up
up: ## Start the container detached, then print the URL and token
	@$(export_key); \
	  DSH_HOST_PORT=$(HOST_PORT) $(COMPOSE) up -d --build; \
	  echo; \
	  echo "waiting for the UI to answer on :$(HOST_PORT) ..."; \
	  for i in $$(seq 1 45); do \
	    code=$$(curl -s -o /dev/null -m 2 -w '%{http_code}' http://127.0.0.1:$(HOST_PORT)/ || true); \
	    if [ "$$code" = "401" ] || [ "$$code" = "200" ]; then break; fi; \
	    sleep 2; \
	  done; \
	  echo; \
	  if [ "$$code" = "401" ] || [ "$$code" = "200" ]; then \
	    echo "  up (HTTP $$code)"; \
	    $(MAKE) --no-print-directory url; \
	    $(MAKE) --no-print-directory dashboard; \
	  else \
	    echo "  ! the UI did not answer on :$(HOST_PORT) (last code: $$code)"; \
	    echo "    logs:"; $(COMPOSE) logs --tail 30; exit 1; \
	  fi

.PHONY: down
down: ## Stop and remove the container (the named volume, and sessions, survive)
	@$(COMPOSE) down 2>/dev/null || true
	@docker rm -f $(SERVICE) >/dev/null 2>&1 || true
	@echo "  down — sessions kept in volume '$(VOLUME)'"

.PHONY: restart
restart: ## Restart the container (re-reads its environment)
	@$(export_key); \
	  if docker inspect $(SERVICE) >/dev/null 2>&1; then \
	    docker restart $(SERVICE) >/dev/null && echo "  restarted"; \
	  else \
	    echo "  no container yet — running 'make up'"; $(MAKE) --no-print-directory up; \
	  fi; \
	  sleep 8; $(MAKE) --no-print-directory url

.PHONY: stop
stop: ## Stop the container without removing it
	@docker stop $(SERVICE) >/dev/null && echo "  stopped" || echo "  not running"

.PHONY: start
start: ## Start a previously stopped container
	@docker start $(SERVICE) >/dev/null && echo "  started" || echo "  no container — run: make up"
	@$(MAKE) --no-print-directory url

.PHONY: logs
logs: ## Follow the container log (the 'dsh web:' line carries the token)
	@docker logs -f --tail 40 $(SERVICE)

.PHONY: url
url: ## Print the UI URL including its token
	@token=$$(docker logs $(SERVICE) 2>/dev/null | grep -oE 'token=[A-Za-z0-9_-]+' | tail -1 | cut -d= -f2); \
	  if [ -z "$$token" ]; then \
	    echo "  no token yet — is the container running? try: make logs"; \
	  else \
	    echo "  open: http://127.0.0.1:$(HOST_PORT)/?token=$$token"; \
	    echo "  (the token rotates on every boot)"; \
	  fi

.PHONY: dashboard
dashboard: ## Print the approval dashboard URL including its token
	@# Mirrors `url`: the container logs ONE `feature-loop dashboard:` line on
	@# bind, carrying the generated token. The line's URL is the CONTAINER's
	@# view (127.0.0.1:8100); from the host it is the published loopback port.
	@line=$$(docker logs $(SERVICE) 2>/dev/null | grep -oE 'feature-loop dashboard: http://[^ ]+' | tail -1); \
	  token=$$(printf '%s' "$$line" | grep -oE 'token=[A-Za-z0-9_-]+' | cut -d= -f2); \
	  if [ -z "$$token" ]; then \
	    echo "  no dashboard line yet — dashboard disabled, or the profile was seeded before"; \
	    echo "  it existed (re-seed with: FORCE_REINIT=1 make up), or try: make logs"; \
	  else \
	    echo "  open: http://127.0.0.1:$(DASHBOARD_PORT)/?token=$$token"; \
	    echo "  (loopback only; the token rotates on every boot)"; \
	  fi

.PHONY: health
health: ## Show container status and the HTTP probe
	@docker ps -a --filter "name=^$(SERVICE)$$" --format '  {{.Names}}  {{.Status}}  {{.Image}}' || true
	@printf "  probe http://127.0.0.1:%s/ -> " "$(HOST_PORT)"; \
	  curl -s -o /dev/null -m 3 -w '%{http_code}\n' http://127.0.0.1:$(HOST_PORT)/ || echo "no answer"
	@printf "  published binding: "; docker port $(SERVICE) 2>/dev/null || echo "(container not running)"

.PHONY: shell
shell: ## Open a shell inside the running container
	@docker exec -it $(SERVICE) sh

# ── destructive ────────────────────────────────────────────────────────────
.PHONY: clean
clean: ## Remove the container AND the volume (deletes sessions and settings)
	@echo "  this deletes volume '$(VOLUME)': all sessions, settings, the seeded profile"
	@read -r -p "  type 'yes' to continue: " ok; [ "$$ok" = "yes" ] || { echo "  aborted"; exit 1; }
	@$(COMPOSE) down -v
	@echo "  clean"

.PHONY: rmi
rmi: ## Remove the container image
	@docker rmi dsh-feature-loop:local 2>/dev/null && echo "  image removed" || echo "  no image to remove"

# ── checks (no container required) ─────────────────────────────────────────
.PHONY: check
check: test typecheck ## Run the test suite and the typecheck
	@echo "  check passed"

.PHONY: test
test: ## Run the unit test suite (no network)
	@node --experimental-strip-types --test test/*.test.ts 2>&1 | tail -8

.PHONY: typecheck
typecheck: ## Typecheck src/ (mirrors the CI file list)
	@# Compiler selection first, so the reason is visible in the output.
	@# Then the CI invocation. --ignoreConfig is required on TypeScript 6: a
	@# tsconfig.json is present but files are named on the command line (TS5112),
	@# and the explicit list is deliberate — it is the harness-free closure.
	@tsc_bin=""; why=""; \
	  if [ -x node_modules/.bin/tsc ]; then tsc_bin=node_modules/.bin/tsc; why="project tsconfig"; \
	  elif [ -f "$(DSH_HARNESS)/node_modules/typescript/lib/tsc.js" ]; then \
	    tsc_bin="node $(DSH_HARNESS)/node_modules/typescript/lib/tsc.js"; why="harness checkout"; \
	  elif command -v tsc >/dev/null 2>&1; then tsc_bin=tsc; why="PATH"; fi; \
	  if [ -z "$$tsc_bin" ]; then echo "  ! no TypeScript compiler found. Run: pnpm install"; exit 1; fi; \
	  echo "  compiler: $$why"; \
	  if [ "$$why" = "project tsconfig" ]; then \
	    $$tsc_bin --noEmit && echo "  typecheck clean ($$why)"; \
	  else \
	    roots=""; \
	    if [ -d "$(HOME)/node_modules/@types" ]; then \
	      roots="--typeRoots $(HOME)/node_modules/@types --types node"; \
	    fi; \
	    $$tsc_bin --noEmit --ignoreConfig \
	      --target ES2024 --module NodeNext --moduleResolution NodeNext \
	      --strict --esModuleInterop --skipLibCheck --isolatedModules \
	      --allowImportingTsExtensions $$roots \
	      $(CI_FILES) && echo "  typecheck clean (CI file list)"; \
	  fi

# The harness-free import closure, exactly as CI lists it.
CI_FILES := src/agent-policy.ts src/budget.ts src/cli.ts src/dashboard.ts \
            src/dashboard-page.ts src/envelope.ts src/explainer.ts src/judge.ts src/laya.ts \
            src/llm.ts src/messages.ts src/metrics.ts src/optimize.ts src/optimizer.ts \
            src/brief.ts src/approval-bridge.ts src/prompts.ts src/refine.ts src/review.ts \
            src/routing.ts src/runlog.ts \
            src/runner.ts src/signals.ts src/spec.ts src/tools.ts

.PHONY: integration
integration: ## Run the real-DSH integration spec (needs the harness checkout)
	@bash test/integration/run.sh "$(DSH_HARNESS)"

.PHONY: dashboard-bundle
dashboard-bundle: ## Rebuild the vendored assistant-ui bundle into assets/ (commit the result)
	@node web/build.mjs

.PHONY: e2e-dashboard
e2e-dashboard: ## Click the real dashboard page in a real browser (needs Playwright + Chromium; opt-in, not part of verify)
	@node --experimental-strip-types test/e2e-dashboard.mjs allow && \
	 node --experimental-strip-types test/e2e-dashboard.mjs reject

.PHONY: compose-check
compose-check: ## Validate the compose file
	@$(COMPOSE) config >/dev/null && echo "  compose config valid"

.PHONY: verify
verify: compose-check check integration ## Everything CI runs, plus the integration spec
	@echo "  verify passed"

# ── safety ─────────────────────────────────────────────────────────────────
.PHONY: ports
ports: ## Show which of the protected ports are in use (do not disturb them)
	@for p in $(PROTECTED_PORTS) 3090 $(DASHBOARD_PORT); do \
	  code=$$(curl -s -o /dev/null -m 2 -w '%{http_code}' http://127.0.0.1:$$p/ || true); \
	  if [ "$$code" = "000" ] || [ -z "$$code" ]; then echo "  $$p  free"; \
	  else echo "  $$p  in use (HTTP $$code)"; fi; \
	done
