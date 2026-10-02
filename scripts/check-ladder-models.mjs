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
 * FIVE places in this repo decide what model runs, and each is checked against
 * the list the deployment it is FOR:
 *
 *   cordis.patch.yml          → docker/settings.template.yaml
 *   docker/profile.patch.yml  → docker/settings.template.yaml
 *   scripts/make-profile.sh   → its own generated settings row
 *   demo/cli.ts               → the route it defaults to (asserted, not parsed
 *                                as a ladder: it is a TS string)
 *   test/probe-container.mjs  → the model list it writes into the profile it
 *                                composes, which IS its resolver
 *
 * The demo is in the list because it was the FOURTH place to carry a model and
 * the check above called the other three covered — a list that names its own
 * files is a promise somebody has to keep, and the demo ran
 * `xiaomi/mimo-v2.5` for six months after every YAML spec had moved. A fourth
 * case that reads its answer out of the source is cheaper than a fifth person
 * remembering.
 *
 * A local DSH profile has no single shipped settings file — the provider row is
 * whatever the operator wrote — so the local half of this check cannot resolve a
 * model list and says so per profile rather than guessing.
 *
 * Run: `node scripts/check-ladder-models.mjs` (CI, and `make check`).
 *
 * ponytail: a regex over three YAML files. A YAML parse would be more correct
 * and would also need a dependency for a check whose whole job is to catch a
 * shape a parser would forgive. It exits non-zero, naming the file and the
 * model.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Model ids declared in an `llm-pi-ai:` row's `models:` list — and ONLY those.
 *
 * The first version of this read every `id:` in the file, which swept in the
 * patch's own entry ids (`- id: llm-pi-ai`, `- id: permission`) and made every
 * profile look like it declared everything. A check that cannot fail is worse
 * than no check, and this one reported nonsense for eleven profiles before the
 * scoping was tightened.
 *
 * Two forms, because both appear in this repo:
 *   `- { id: x, name: x }`   the inline form (docker/settings.template.yaml)
 *   `- id: x` + `name: x`    the block form (scripts/make-profile.sh)
 * The block form is scoped to a `models:` block, and every model id in this
 * codebase contains a `/` or is a bare lowercase token — so the entry ids,
 * which are always `camelCase` and appear at column 0-2, cannot match it.
 */
function declaredModels(text) {
  const ids = new Set()
  // Block form first: a `models:` list and its items, captured together so an
  // entry id elsewhere in the patch cannot be mistaken for a model.
  for (const block of text.matchAll(/^[^\S\n]*models:[^\S\n]*\n((?:[^\S\n]+[^\n]*\n)+)/gm)) {
    for (const m of block[1].matchAll(/^[^\S\n]+-[^\S\n]+id:[^\S\n]*([\w./-]+)[^\S\n]*$/gm)) {
      ids.add(m[1])
    }
  }
  // Inline form: `- { id: x, name: x }`.
  for (const m of text.matchAll(/\{[^{}]*\bid:[^\S\n]*([\w./-]+)/g)) ids.add(m[1])
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

/**
 * The models the demo declares, and the route it defaults to.
 *
 * Both are read out of `demo/cli.ts` rather than duplicated: the default is a
 * TS string (`model: 'onegw/execution'`) and a copy of it here is a second
 * answer to "which model does the demo run" — the same class of drift the
 * ladder check exists to catch, inside the check itself.
 *
 * @returns the models the demo's parseArgs defaults name, and the default route.
 */
function modelsDeclaredByDemo() {
  const text = readFileSync(join(repo, 'demo/cli.ts'), 'utf8')
  const ids = new Set()
  for (const m of text.matchAll(/model:\s*'([\w./-]+)'/g)) ids.add(m[1])
  return ids
}

/** The demo's `--model` default, as a `provider/model` key. */
function demoDefaultRoute() {
  const text = readFileSync(join(repo, 'demo/cli.ts'), 'utf8')
  const m = /model:\s*'([\w./-]+)'/.exec(text)
  return m?.[1] ?? ''
}

/**
 * The models `test/probe-container.mjs` writes into its own profile.
 *
 * The probe composes a profile whose only `llm-pi-ai` row is its own, because
 * the container's settings import is one-shot and belongs to `dsh-fl`. So this
 * list — not the container's settings template — decides whether a probe run can
 * resolve a rung, and it is invisible to every check that only reads YAML.
 *
 * @returns the ids the probe's patch declares.
 */
/**
 * The route every shipped deployment in this repo must run on.
 *
 * `execution` is onegw's EXECUTION role alias — the gateway's own name for the
 * model configured to do the work. It is pinned HERE, once, so the rule is a
 * single constant rather than a claim repeated in four files.
 *
 * Why a constant at all, when the case list above already checks that each rung
 * is DECLARED: because that question and this one are different. "Can this
 * resolve?" is answered by the declared-id check. "Is this the route we run?"
 * is not answered by anything else, and it is the one that was wrong for six
 * months — every deployment here shipped concrete model ids
 * (`opencode/deepseek-v4.1-flash` → `xai/grok-4.7`) that resolved perfectly
 * and that nobody had ever asked to run. When `execution` itself was undeclared
 * the ladder died UNKNOWN_MODEL on step 1, and the fix chosen then replaced the
 * alias with those concrete ids rather than declaring the alias. A rung that
 * resolves is not a rung that is tested; this is the assertion for the second
 * question, so the two can never be confused again.
 *
 * ponytail: one constant and one equality test inside the loop already
 * iterating the rungs. Asserting merely that the alias EXISTS in each
 * deployment would pass for a ladder whose FIRST rung is something else, which
 * is exactly the shape this check exists to reject.
 */
const TESTED_ROUTE = 'onegw/execution'

function modelsDeclaredByProbe() {
  const text = readFileSync(join(repo, 'test/probe-container.mjs'), 'utf8')
  const ids = new Set()
  for (const m of text.matchAll(/'\s+- id: ([\w./-]+)'/g)) ids.add(m[1])
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
  {
    // The container PROBE. It builds a profile at run time and — because the
    // settings import is one-shot — that profile gets NO settings of its own, so
    // llm-pi-ai resolves its rungs against the `models:` list the probe writes
    // into its own patch. That list was the FIFTH place carrying the dead
    // concrete ids, and it cost a round of UNKNOWN_MODEL in the container after
    // the patch row and the settings were both already correct (§1h).
    //
    // The ids are read out of the probe source rather than copied, for the same
    // reason the demo's route is: a copy here is a second answer.
    file: 'test/probe-container.mjs',
    label: 'the container probe profile',
    ids: modelsDeclaredByProbe(),
    // No ladder of its own: the probe copies `dsh-fl`'s row, so the rung is the
    // container's. What this case asserts is the half that is its own — that the
    // route the inherited ladder names is RESOLVABLE from the ids written here.
    // That is the assertion that was missing, and its absence is why a probe run
    // died UNKNOWN_MODEL with the patch row and the settings both correct.
    resolvesOnly: TESTED_ROUTE,
  },
  {
    // The DEMO. Its default route lives in `demo/cli.ts` as a TS string rather
    // than YAML, so this case reads the default out of the source instead of
    // adding a second ladder-shaped file.
    //
    // It was the FOURTH place to run a model and it carried
    // `xiaomi/mimo-v2.5` until this branch changed it — while the check above
    // called all three YAML specs covered. A check that names its own files is a
    // list, and a list is a promise somebody has to keep; this one is now
    // derived from the four files the repo actually ships a route in.
    file: 'demo/cli.ts',
    label: 'the demo',
    ids: modelsDeclaredByDemo(),
    route: demoDefaultRoute(),
  },
]

let failed = false
for (const c of cases) {
  const text = readFileSync(join(repo, c.file), 'utf8')
  const routes = ladderRoutes(text)
  if (routes.length === 0) {
    if (c.resolvesOnly !== undefined) {
      if (!c.ids.has(c.resolvesOnly.split('/').pop())) {
        console.error(
          `${c.file}: declares no model for the route ${c.resolvesOnly}.\n` +
          `  declared here: ${[...c.ids].join(', ') || '(nothing)'}\n` +
          '  this profile has no ladder of its own, so the model list below IS the\n' +
          `  resolver — a run on ${c.resolvesOnly} dies UNKNOWN_MODEL on step 1.`,
        )
        failed = true
      }
      continue
    }
    console.error(`${c.file}: no ladder found — is the block still shaped as provider/model pairs?`)
    failed = true
    continue
  }
  const prices = priceKeys(text)
  // A YAML ladder is read from the file; a TS default is asserted directly, so
  // the same "is this the route we run" rule covers both shapes.
  if (c.route !== undefined) {
    if (c.route !== TESTED_ROUTE) {
      console.error(
        `${c.file}: the default route is ${String(c.route)}, not ${TESTED_ROUTE}.\n` +
        `  This repo runs on onegw's EXECUTION role alias. See KNOWN-ISSUES §1a.`,
      )
      failed = true
    }
    continue
  }
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
    if (r.key !== TESTED_ROUTE) {
      console.error(
        `${c.file}: ladder rung ${r.key} is not the tested route ${TESTED_ROUTE}.\n` +
        `  This repo runs on onegw's EXECUTION role alias, verified against the live\n` +
        `  gateway. Any other rung is a route nobody here has actually run, however\n` +
        `  well it resolves. Put it back — or run it for real first, then update\n` +
        `  TESTED_ROUTE in this script deliberately.`,
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

/**
 * Local PROFILES on this machine, checked against their own declared models.
 *
 * The shipped files are fixed by the edits above, but a profile is a directory
 * a person copies and then never touches again — and the two profiles this
 * developer booted by hand still carried `execution`/`planning` weeks after the
 * bug was fixed everywhere else. They resolve today (they declare `execution`),
 * so nothing fails and nothing tells them they are drifting. A local
 * environment is exactly where a stale config hides.
 *
 * `--profile <name-or-dir>` checks one. With no argument, every profile under
 * `$DSH_HOME/profiles` that has a `cordis.patch.yml` is checked.
 */
/** Where profiles live: $DSH_HOME if set, else ~/.dsh. Named in the summary. */
const PROFILES_ROOT = join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'profiles')

function localProfiles() {
  const root = PROFILES_ROOT
  const named = process.argv[2]
  if (named !== undefined) {
    const dir = named.startsWith('/') ? named : join(root, named)
    return existsSync(join(dir, 'cordis.patch.yml')) ? [dir] : []
  }
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(root, e.name, 'cordis.patch.yml')))
    .map(e => join(root, e.name))
}

const profiles = localProfiles()
for (const dir of profiles) {
  const file = join(dir, 'cordis.patch.yml')
  const text = readFileSync(file, 'utf8')
  const routes = ladderRoutes(text)
  // No `spec:` means the bundle default, which the shipped cases already cover.
  if (routes.length === 0) continue
  const ids = declaredModels(text)
  const prices = priceKeys(text)
  const label = `profile ${basename(dir)}`
  // A profile that declares NO models of its own has no `llm-pi-ai` row, so it
  // resolves through the harness's own default provider — where these rungs are
  // unreachable for a reason this check cannot see and should not claim. Report
  // it as a skip, not a failure: the honest statement is "this file does not
  // say which models exist", not "these rungs are broken".
  if (ids.size === 0) {
    // A profile with no `llm-pi-ai` row of its own resolves through whatever
    // provider the HARNESS mounts — `dsh-base` declares
    // `agent-default-model: deepseek-official/deepseek-flash`. So a rung naming
    // some OTHER provider is not merely unverified: unless that provider is
    // configured somewhere this check cannot see, the rung is the day-one bug
    // this check exists for, on a profile the previous version called
    // "skipped" and moved past.
    //
    // What it can say, precisely: which provider the rungs name, and whether
    // that is the harness default. It cannot resolve the model list, so it
    // reports the rung and does not claim the model is missing. One line, named
    // — a skip that reads as a pass is the failure mode.
    for (const r of routes) {
      if (r.provider === 'deepseek-official') continue
      console.log(
        `profile ${basename(dir)}: rung ${r.key} names provider ${r.provider}, ` +
        'and this profile declares no llm-pi-ai row of its own. Its model list ' +
        'lives in settings, which this check does not read — verify that ' +
        `provider is configured there, or the run dies UNKNOWN_MODEL.`,
      )
    }
    continue
  }
  // Severity measured, not assumed. This started as a warning on the reasoning
  // that an undeclared UPPER rung is latent — step 1 always uses the first
  // rung. That reasoning was wrong in the only way that matters, and it was
  // wrong because nobody made the loop climb: `stepsPerRung: 1` on this very
  // profile, one task, and the run died
  //
  //   pi-ai provider "onegw" has no configured model "planning"   (UNKNOWN_MODEL)
  //
  // ONCE A HUMAN HAD ALREADY APPROVED A WRITE. `planning` is not a corner
  // case; it is the ladder doing the one thing a ladder is for, on a run that
  // had genuinely stalled. Two short tasks had reached step 1 and nothing
  // else, which is why the bug was invisible for as long as it was.
  //
  // So an undeclared rung is an ERROR here, in the shipped configs AND in a
  // local profile, and the fix is two lines in the profile's own `models:` list.
  for (const r of routes) {
    if (!ids.has(r.model)) {
      console.error(
        `${label}: ladder rung ${r.key} names a model this profile does not declare.\n` +
        `  declared in its llm-pi-ai row: ${[...ids].join(', ')}\n` +
        `  the first rung is what step 1 uses, so this hides until the loop\n` +
        `  climbs — and then the run dies UNKNOWN_MODEL mid-run, after a human\n` +
        `  has already approved work. Declare it or remove the rung.`,
      )
      failed = true
    }
    // Only when the profile HAS a price table: one with no `prices:` at all has
    // no cost ceiling to honour, and `unpricedSteps` is the honest reading of
    // that rather than a misconfiguration.
    if (prices.size > 0 && !prices.has(r.key)) {
      console.error(
        `${label}: ladder rung ${r.key} has no price — every run records unpricedSteps: 1\n` +
        `  against a cost ceiling that can then never stop anything.`,
      )
      failed = true
    }
  }
}

if (failed) process.exit(1)
// One line, and it says which half is which: this script runs in CI, where
// there are no local profiles, and on a developer's machine, where the
// profiles are the interesting part. A bare "18 profiles checked" in a CI log
// reads as a claim about the repo that is not being made.
console.log(`ladder models: ${String(cases.length)} shipped specs + ` +
  `${String(profiles.length)} local profile(s) under ` +
  `${PROFILES_ROOT === join(homedir(), '.dsh', 'profiles') ? '~/.dsh/profiles' : PROFILES_ROOT}.`)
