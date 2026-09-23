# Agent rules — dsh-feature-loop

## Always scan the repo before you commit

Every commit must pass this repo's security scan. The hook is installed once
per clone by the `prepare` script in `package.json` (`pnpm install` runs
`git config core.hooksPath .githooks`). Confirm it is active before relying
on it:

```bash
git config core.hooksPath     # must print: .githooks
```

What runs on every `git commit` — `.githooks/pre-commit`:

1. **Secret-shaped content** in the staged lines: API keys (AWS `AKIA…`,
   GitHub `ghp_`/`github_pat_`, OpenAI-style `sk-…`, Slack `xox…`, GitLab,
   Google), `token=<long>` in URLs, npm `_authToken`, quoted
   `password`/`secret`/`apiKey` assignments, private-key blocks.
2. **Sensitive files**: `.env` and `.env.*` (except `.example`/`.sample`),
   `*.pem`, `*.key`, `id_rsa`/`id_ed25519`, `credentials.{yaml,yml,json}`.
3. **Workflows** that add `runs-on: … self-hosted` — never reintroduce that;
   a PR-triggered job there executes strangers' code on the maintainer's
   machine (the runner note at the top of `.github/workflows/ci.yml` has the
   full reason).
4. **actionlint** on any staged workflow, when `actionlint` is installed.

Rules:

- Before committing, the full-repo scan must be clean:
  `bash .githooks/pre-commit --all` must exit 0.
- On a hook failure, remove the finding from the commit. Never pass
  `--no-verify` for a real finding — that override is only for confirmed
  false positives, and the commit message must say so.
- New leak shape found? Add a pattern to the `patterns=(…)` array in
  `.githooks/pre-commit` in the same commit that fixes it.
- Keys never live in this repo: pass them via the environment
  (`ONEGW_API_KEY`) or `~/.dsh/.credentials.yaml`.
