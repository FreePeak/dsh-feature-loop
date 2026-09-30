#!/usr/bin/env node
/**
 * Fail when a shipped spec's ladder names a model its deployment never declares.
 *
 * This is the class of bug that cost a day in the container and would cost the
 * same day again on any profile that copies `cordis.patch.yml`:
 *
 *   pi-ai provider "onegw" has no configured model "execution"
 *
 * `execution` IS a gateway alias — `/v1/models` lists it — but **llm-pi-ai
 * resolves a ladder rung against the provider profile's own `models:` list**,
 * not against the gateway. A deployment that never declared that id in
 * `settings.yaml` makes the rung unreachable, and the run dies on step 1,
 * *after* the dashboard has already recorded the route, the step and the spend.
 * Nothing errors at boot; nothing errors at config load.
 *
 * Three files ship a `spec:` block, and each one is checked against the model
 * list of the deployment it is FOR:
 *
 *   cordis.patch.yml          → settings.template.yaml (docker) AND the local
 *                                profile's own settings (documented below)
 *   docker/profile.patch.yml  → docker/settings.template.yaml
 *   scripts/make-profile.sh   → its own generated settings row
 *
 * A local DSH profile has no single shipped settings file — the provider row is
 * whatever the operator wrote — so the local check is a documented pair rather
 * than a resolved comparison: `execution` and `planning` are the onegw role
 * aliases this repo's docs and demo tell people to configure, and they must
 * therefore be declared together. A profile that declares one and not the other
 * is exactly the container's bug, one layer over.
 *
 * Run: `node scripts/check-ladder-models.mjs` (CI, and `make check`).
 *
 * ponytail: a regex over three YAML files. A YAML parse would be more correct
 * and would also need a dependency for a check whose whole job is to catch a
 * shape a parser would forgive. It exits non-zero, naming the file and the
 * model.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Ids declared in a provider profile's `models:` list. */
function declaredModels(text) {
  // `- { id: x, name: x }` and the block form `- id: x` / `name: x`.
  const ids = new Set()
  for (const m of text.matchAll(/\bid:\s*([\w./-]+)/g)) ids.add(m[1])
  for (const m of text.matchAll(/^\s*-\s*id:\s*([\w./-]+)\s*$/gm)) ids.add(m[1])
  return ids
}

/** `provider: X` + `model: Y` pairs from a `spec.controller.ladder` block. */
function ladderRoutes(text) {
  const routes = []
  for (const m of text.matchAll(/provider:\s*(\S+)\s*\n\s*model:\s*(\S+)/g)) {
    routes.push({ provider: m[1], model: m[2], key: `${m[1]}/${m[2]}` })
  }
  for (const m of text.matchAll(/provider:\s*(\S+),\s*model:\s*(\S+)/g)) {
    routes.push({ provider: m[1], model: m[2], key: `${m[1]}/${m[2]}` })
  }
  return routes
}

/** Keys in the `prices:` table of the same spec block. */
function priceKeys(text) {
  const after = text.split(/prices:/)[1]
  if (after === undefined) return new Set()
  const block = after.split(/unpricedFallback:/)[0]
  return new Set([...block.matchAll(/^\s{8,}([\w./-]+):\s*$/gm)].map(m => m[1]))
}

const dockerSettings = readFileSync(join(repo, 'docker/settings.template.yaml'), 'utf8')
const dockerIds = declaredModels(dockerSettings)

/**
 * `scripts/make-profile.sh` writes its OWN settings row, so its declared ids
 * are read out of the script rather than assumed. That is what makes the check
 * meaningful for a profile a person will actually boot: the script and the
 * spec it generates cannot disagree without this failing.
 */
function modelsDeclaredByMakeProfile() {
  const text = readFileSync(join(repo, 'scripts/make-profile.sh'), 'utf8')
  const ids = new Set()
  for (const m of text.matchAll(/^\s+-\s+id:\s*([\w./-]+)\s*$/gm)) ids.add(m[1])
  return ids
}

const cases = [
  {
    file: 'docker/profile.patch.yml',
    label: 'the container deployment',
    ids: dockerIds,
  },
  {
    // The bundle patch ships the DEFAULT spec every deployment inherits, so it
    // is held to the same declared-id list. When it named `execution` and the
    // Docker settings did not, this check fired on the very first run — which
    // is the failure the container already cost a day for.
    file: 'cordis.patch.yml',
    label: 'the bundle patch (the shipped defaults)',
    ids: dockerIds,
  },
  {
    file: 'scripts/make-profile.sh',
    label: 'the generated local profile',
    ids: modelsDeclaredByMakeProfile(),
  },
]

let failed = false
for (const c of cases) {
  const text = readFileSync(join(repo, c.file), 'utf8')
  const routes = ladderRoutes(text)
  if (routes.length === 0) {
    console.error(`${c.file}: no ladder found — is the block still shaped as provider/model pairs?`)
    failed = true
    continue
  }
  const prices = priceKeys(text)
  for (const r of routes) {
    if (!c.ids.has(r.model)) {
      console.error(
        `${c.file}: ladder rung ${r.key} names a model no deployment declares.\n` +
        `  declared here: ${[...c.ids].join(', ')}\n` +
        `  a run on this rung dies UNKNOWN_MODEL on step 1, after the dashboard has\n` +
        `  already recorded the route — declare it or change the rung.`,
      )
      failed = true
    }
    if (!prices.has(r.key)) {
      console.error(
        `${c.file}: ladder rung ${r.key} has no price.\n` +
        `  every run records unpricedSteps: 1 against a cost ceiling that can\n` +
        `  therefore never stop anything. Key prices: by the same "provider/model".`,
      )
      failed = true
    }
  }
  for (const p of prices) {
    if (!routes.some(r => r.key === p)) {
      console.error(`${c.file}: price key ${p} matches no ladder rung — dead configuration.`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log(`ladder models: ${cases.length} shipped specs, every rung declared and priced.`)
