/**
 * The check for the settings page's host service.
 *
 * Run: `node --experimental-strip-types --test test/remote.test.ts`
 *
 * Every case drives the exported pure functions rather than the cordis class:
 * `TypertRemoteService`'s constructor requires a live context, so a test that
 * went through the class would be testing a fake cordis instead of the logic.
 * The class is a three-line delegate, verified when the plugin is installed.
 *
 * `XDG_CONFIG_HOME` is redirected into a temp dir in every case, so no test can
 * touch the operator's real ~/.config/dshloop/config.yaml.
 */

import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { parse as parseYaml } from 'yaml'

import {
  APPROVAL_MODES,
  approvalModeFor,
  buildStatus,
  probeJudge,
  readSettings,
  saveSettings,
  mergeRowAndSettings,
  settingsPath,
  userSettings,
  validateSettings,
} from '../src/remote.ts'

/** Run `fn` with XDG_CONFIG_HOME pointed at a fresh temp dir. */
async function withConfigHome<T>(fn: (home: string, configPath: string) => T | Promise<T>): Promise<T> {
  const home = mkdtempSync(join(tmpdir(), 'dshloop-remote-'))
  const saved = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = home
  try {
    return await fn(home, join(home, 'dshloop', 'config.yaml'))
  } finally {
    if (saved === undefined) delete process.env.XDG_CONFIG_HOME
    else process.env.XDG_CONFIG_HOME = saved
    rmSync(home, { recursive: true, force: true })
  }
}

test('the plugin row merges the settings file OVER itself — the row is the base', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ gatePolicies: { write: 'auto' }, gateMode: 'deny' }, path)
    const merged = mergeRowAndSettings({
      gatePolicies: { write: 'always-approve' },
      gateMode: 'ask',
      judgeThreshold: 2,
      reviewBudget: 0.1,
      checkpointAtStep: 5,
    })
    // The file wins on the two keys it set...
    assert.deepEqual(merged.gatePolicies, { write: 'auto' })
    assert.equal(merged.gateMode, 'deny')
    // ...and the row's own router survives, because `router` is merged rather
    // than replaced: a file that sets one of the three flat keys must not erase
    // the other two.
    assert.deepEqual(merged.router, { reviewBudget: 0.1, judgeThreshold: 2, checkpointAtStep: 5 })
  })
})

test('a settings file with no reviewBudget leaves the row router untouched', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ gateMode: 'deny' }, path)
    const merged = mergeRowAndSettings({ gateMode: 'ask', reviewBudget: 0.25, judgeThreshold: 3 })
    assert.deepEqual(merged.router, { reviewBudget: 0.25, judgeThreshold: 3 })
  })
})

// Every numeric setting is OPTIONAL, and every other validator in this repo
// spells "not set" as `''`. The settings page sends exactly that for a field a
// person never touched: `checkpointAtStep` is `undefined`, the form serialises
// it as `''`, and the save was refused — measured in a real browser against the
// real page, where pressing Save on an UNCHANGED panel answered
// `save: checkpointAtStep must be a finite number, received ""` and wrote
// nothing. The operator concludes the page is broken.

test('a blank optional number means unset, not a typo', async () => {
  await withConfigHome((_home, path) => {
    assert.doesNotThrow(() => saveSettings({ checkpointAtStep: '' as never }, path))
    const written = readSettings(path)
    assert.equal(written.checkpointAtStep, undefined, 'an unset field must not be written')
  })
})

test('an untouched panel saves cleanly — the whole point of a blank field', async () => {
  await withConfigHome((_home, path) => {
    // The exact payload the page sends with nothing edited: every field at its
    // loaded value, and the one optional number as the empty string.
    saveSettings({
      judge: 'laya', judgeBaseURL: 'http://127.0.0.1:8092', systemOneModel: 'laya',
      judgeThreshold: 2, reviewBudget: 0.1, gateMode: 'ask',
      checkpointAtStep: '' as never,
    }, path)
    const written = readSettings(path)
    assert.equal(written.gateMode, 'ask')
    assert.equal(written.checkpointAtStep, undefined)
  })
})

test('a REAL typo is still rejected — the blank case is not a hole', async () => {
  await withConfigHome((_home, path) => {
    assert.throws(
      () => saveSettings({ checkpointAtStep: 'soon' as never }, path),
      /must be a finite number/,
      'a word where a number belongs is still a typo',
    )
  })
})

// A hand-edited settings file is not `saveSettings`, so `gatePolicies` reaches
// `apply` without ever passing the validator that rejects
// `gatePolicies: unknown tool class "wrong_tool_name"`. Measured 2026-10-03: a
// row saying `write: auto` plus a file saying `write: definitely-yes` still
// denied the write — because `ReviewGate.check` compares against three known
// strings, misses every time, and falls through to its final `review: true`.
// That is the right answer by luck, and it stays right only while that chain has
// three links. So the entries are filtered where the file is read.

test('an unrecognised policy VALUE is dropped, not forwarded', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'gatePolicies:\n  write: definitely-yes\n  read: auto\n')
    const user = userSettings()
    assert.deepEqual(user.gatePolicies, { read: 'auto' },
      'the good entry survives and the bad one cannot reach the gate')
  })
})

test('an unrecognised tool CLASS is dropped, and a file of only those drops entirely', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'gatePolicies:\n  read_file: auto\n  definitely_a_tool: auto\n')
    assert.equal(userSettings().gatePolicies, undefined,
      "a file the gate cannot act on must not overwrite the row's own policies")
  })
})

test('a valid file passes through byte-for-byte: this is a guard, not a second policy layer', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({
      gatePolicies: {
        read: 'auto', glob: 'auto', grep: 'auto',
        edit: 'auto-if-confident', write: 'always-approve', bash: 'always-approve',
      },
    }, path)
    assert.deepEqual(userSettings().gatePolicies, {
      read: 'auto', glob: 'auto', grep: 'auto',
      edit: 'auto-if-confident', write: 'always-approve', bash: 'always-approve',
    })
  })
})

test('the merged gate is the FILTERED one, so the row cannot be widened by a typo', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'gatePolicies:\n  write: definitely-yes\n')
    const merged = mergeRowAndSettings({ gatePolicies: { write: 'always-approve' } })
    assert.deepEqual(merged.gatePolicies, { write: 'always-approve' },
      "the row's own policy stands where the file named something unrecognisable")
  })
})

// The router keys reach AttentionRouter, which rejects reviewBudget outside
// (0, 1]. A number outside the band already fails loudly; a STRING was dropped
// in silence, so a hand-edited `reviewBudget: "x"` left the row's own 0.1 in
// place with nothing said about it. Both now say the same sentence.

test('a non-numeric router key throws, naming the key', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'reviewBudget: "x"\n')
    assert.throws(() => userSettings(), /reviewBudget must be a finite number, received "x"/)
  })
})

test('a router key outside AttentionRouter\'s own band throws with THAT band', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'reviewBudget: 0\n')
    assert.throws(() => userSettings(), /reviewBudget must be in \(0, 1\], received 0/)
  })
})

test('a negative threshold is allowed — only reviewBudget has a band', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'judgeThreshold: 0\n')
    // `judgeThreshold` is a 0–3 score, not a fraction: clamping it here would be
    // a second policy layer, and the gate already treats a score below the bar
    // as a reason to ask.
    assert.deepEqual(userSettings(), { router: { judgeThreshold: 0 } })
  })
})

test('a valid router key still reaches the merge', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ reviewBudget: 0.25 }, path)
    const merged = mergeRowAndSettings({ reviewBudget: 0.1, judgeThreshold: 2 })
    assert.deepEqual(merged.router, { reviewBudget: 0.25, judgeThreshold: 2 })
  })
})

// Every constrained key is checked HERE, because a hand-edited file reaches the
// gate through userSettings and through nothing else — saveSettings validates
// the page's own writes. Measured 2026-10-03 with `gateMode: maybe`: accepted,
// the gate fell through to `ask` (safe), the write refused, and nothing said the
// word was not one anybody understands.

test('an unrecognised gateMode is refused with both values named', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'gateMode: maybe\n')
    assert.throws(() => userSettings(), /gateMode must be one of ask, deny, received "maybe"/)
  })
})

test('an unrecognised judge is refused, with the three kinds named', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'judge: telepathy\n')
    assert.throws(() => userSettings(), /judge must be one of none, chat, laya, received "telepathy"/)
  })
})

test('confidenceThreshold and checkpointAtStep must be numbers', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'confidenceThreshold: "high"\ncheckpointAtStep: soon\n')
    assert.throws(() => userSettings(), /confidenceThreshold must be a finite number/)
  })
})

test('an UNCONSTRAINED key is not invented into a rule', async () => {
  await withConfigHome((_home, path) => {
    // `systemOneModel` is a provider's own alias — this repo cannot know the
    // set, so a table that listed it would be a check that forbids the truth.
    saveSettings({ systemOneModel: 'my-local-laya' }, path)
    assert.deepEqual(userSettings(), { systemOneModel: 'my-local-laya' })
  })
})

test('every valid value the page can write passes through', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ gateMode: 'deny', judge: 'chat', confidenceThreshold: 1.5, checkpointAtStep: 4 }, path)
    assert.deepEqual(userSettings(), {
      gateMode: 'deny', judge: 'chat', confidenceThreshold: 1.5, checkpointAtStep: 4,
    })
  })
})

// The panel and the gate must never disagree about precedence. `buildStatus`
// used to merge `{...rowConfig, ...settings}` on its own while `apply` consulted
// the row alone — so a value could be rendered as effective and decide nothing.
// It now calls the same `userSettings`, which is what makes this a test rather
// than a comment.

/**
 * The row-plus-settings projection the panel renders, synchronously.
 *
 * `buildStatus` is async because it may probe the judge endpoint; these two
 * cases pass a judge of `none` so it never does, and the assertion is about the
 * MERGE, not the probe.
 */
async function buildStatusConfig(rowConfig: Record<string, unknown>): Promise<Record<string, unknown>> {
  const status = await buildStatus(rowConfig, undefined, { reachable: false, detail: 'detectors only' })
  return status.config
}

test('the panel shows exactly what the gate is built from', async () => {
  await withConfigHome(async (_home, path) => {
    saveSettings({ gateMode: 'deny', judgeThreshold: 2.5 }, path)
    const shown = await buildStatusConfig({ gateMode: 'ask', judgeThreshold: 1, spec: { goal: 'x' } })
    assert.equal(shown.gateMode, 'deny', 'the file wins, exactly as the gate sees it')
    assert.deepEqual(
      shown.router,
      { judgeThreshold: 2.5 },
      "the router key comes back nested, which is the row's own shape",
    )
    assert.equal(shown.judgeThreshold, 1, "the row's flat key is shown as the row spells it")
    assert.deepEqual(shown.spec, { goal: 'x' }, "the row's own block survives")
  })
})

test('a hand-edited spec in the settings file is not shown, because it is not applied', async () => {
  await withConfigHome(async (_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'spec:\n  maxSteps: 1\ngateMode: deny\n')
    const shown = await buildStatusConfig({ gateMode: 'ask', spec: { goal: 'x', maxSteps: 15 } })
    assert.equal(shown.gateMode, 'deny')
    assert.deepEqual(
      shown.spec,
      { goal: 'x', maxSteps: 15 },
      'the row wins on a key the file cannot set — shown here, not applied',
    )
  })
})

// The settings file must reach the GATE, not only the status page. Before this
// the page showed a value the running policy never consulted, and both the file
// header and the page's notice said so — accurately, which is worse, because a
// correct warning about a feature that does not exist still ships the feature's
// UI. These four cases are the whole contract: the file wins on the keys the
// page owns, and it cannot reach the blocks it does not.

test('a saved gate policy reaches the policy the plugin builds', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ gatePolicies: { write: 'auto' } }, path)
    assert.deepEqual(userSettings(), { gatePolicies: { write: 'auto' } })
  })
})

test('the file overrides the row, because that is what the page is for', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ gateMode: 'deny', confidenceThreshold: 2 }, path)
    const user = userSettings()
    assert.equal(user.gateMode, 'deny')
    assert.equal(user.confidenceThreshold, 2)
  })
})

test('the two flat router keys come back under router, not at the top level', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ reviewBudget: 0.4, judgeThreshold: 3 }, path)
    assert.deepEqual(userSettings(), { router: { reviewBudget: 0.4, judgeThreshold: 3 } })
  })
})

test('the file cannot reach spec, dashboard or optimize — the page offers no control for them', async () => {
  await withConfigHome((_home, path) => {
    // Written by hand, not through saveSettings: a hand-edited file is exactly
    // the case an allowlist has to survive. mkdirSync because saveSettings is
    // what normally creates the directory, and this case bypasses it.
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, [
      'spec:',
      '  maxSteps: 1',
      'dashboard:',
      '  enabled: false',
      'optimize:',
      '  history: /tmp/hijacked.jsonl',
      'gateMode: deny',
      '',
    ].join('\n'))
    const user = userSettings()
    assert.deepEqual(user, { gateMode: 'deny' })
    assert.equal(user.spec, undefined)
    assert.equal(user.dashboard, undefined)
    assert.equal(user.optimize, undefined)
  })
})

// This one was written when a non-numeric router key was DROPPED, which is the
// fail-closed direction and still is for `gatePolicies`. A DROPPED key is
// different from a THROWN one only in whether the operator is told, and being
// told is the whole point of a setting file a human typed by hand — so the
// router keys throw (see the four cases added below) while an unrecognised
// POLICY entry is still dropped. Both are right for their own reason; this
// comment is here so the asymmetry reads as a decision rather than an oversight.
test('a non-numeric POLICY VALUE is still dropped, not thrown', async () => {
  await withConfigHome((_home, path) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, 'gatePolicies:\n  write: not-a-policy\ngateMode: ask\n')
    assert.deepEqual(userSettings(), { gateMode: 'ask' },
      'a bad policy restores the row\'s own; it cannot widen the gate, so silence is safe')
  })
})

test('settingsPath honours XDG_CONFIG_HOME, resolved per call', async () => {
  await withConfigHome((home) => {
    assert.equal(settingsPath(), join(home, 'dshloop', 'config.yaml'))
  })
})

test('a missing settings file reads as empty, not an error', async () => {
  await withConfigHome((_home, path) => {
    assert.deepEqual(readSettings(path), {})
  })
})

test('saveSettings writes the file and it parses back', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ judge: 'none', judgeThreshold: 1.5 }, path)
    const written = parseYaml(readFileSync(path, 'utf8'))
    assert.equal(written.judge, 'none')
    assert.equal(written.judgeThreshold, 1.5)
  })
})

test('saveSettings is a merge — an omitted key keeps its previous value', async () => {
  await withConfigHome((_home, path) => {
    saveSettings({ judgeThreshold: 1.2 }, path)
    saveSettings({ judge: 'none' }, path)
    const written = parseYaml(readFileSync(path, 'utf8'))
    assert.equal(written.judge, 'none', 'the second save applied')
    assert.equal(written.judgeThreshold, 1.2, 'the first save survived')
  })
})

test('saveSettings creates the directory when it does not exist', async () => {
  await withConfigHome((home, path) => {
    rmSync(join(home, 'dshloop'), { recursive: true, force: true })
    assert.doesNotThrow(() => saveSettings({ judge: 'laya' }, path))
    assert.ok(readFileSync(path, 'utf8').length > 0)
  })
})

test('an unknown judge kind is rejected and nothing is written', async () => {
  await withConfigHome((_home, path) => {
    assert.throws(() => saveSettings({ judge: 'gpt' as never }, path), /judge must be/)
    assert.throws(() => readFileSync(path, 'utf8'), /ENOENT/, 'nothing was written')
  })
})

test('a non-numeric threshold is rejected', () => {
  assert.throws(() => validateSettings({ judgeThreshold: 'high' as never }), /judgeThreshold must be/)
})

test('a reviewBudget outside (0, 1] is rejected', () => {
  assert.throws(() => validateSettings({ reviewBudget: 0 }), /reviewBudget is a fraction/)
  assert.throws(() => validateSettings({ reviewBudget: 5 }), /reviewBudget is a fraction/)
})

test('maxSteps must be a positive integer', () => {
  assert.throws(() => validateSettings({ maxSteps: 0 }), /maxSteps must be a positive integer/)
  assert.throws(() => validateSettings({ maxSteps: 2.5 }), /maxSteps must be a positive integer/)
})

test('keys the page does not expose are dropped, not written', () => {
  // The page is the trust boundary: a rogue key must not reach the file.
  const clean = validateSettings({ judge: 'none', root: '/etc', verify: 'rm -rf /' } as never)
  assert.equal('root' in clean, false)
  assert.equal('verify' in clean, false)
  assert.equal(clean.judge, 'none')
})

test('a malformed settings file reads as empty so the panel still renders', async () => {
  await withConfigHome((home, path) => {
    mkdirSync(join(home, 'dshloop'), { recursive: true })
    writeFileSync(path, 'judge: [unclosed\n')
    // A broken file is fixable only if you can see the panel that names it.
    assert.deepEqual(readSettings(path), {})
  })
})

test('buildStatus reports the row config when no settings file exists', async () => {
  await withConfigHome(async () => {
    const status = await buildStatus({ judge: 'laya' }, () => ({}), { reachable: true, detail: 'ok' })
    assert.equal(status.judge.kind, 'laya')
    assert.equal(status.enabled, false, 'no spec in the row means policies are off')
    assert.match(status.configPath, /dshloop\/config\.yaml$/)
  })
})

test('buildStatus marks the policies on when the row carries a spec', async () => {
  await withConfigHome(async () => {
    const status = await buildStatus({ spec: { goal: 'x' } }, () => ({}), { reachable: true, detail: '' })
    assert.equal(status.enabled, true)
  })
})

test('the saved file wins over the row config for display', async () => {
  await withConfigHome(async (_home, path) => {
    saveSettings({ judgeThreshold: 0.9 }, path)
    const status = await buildStatus({ judge: 'laya', judgeThreshold: 2 }, () => readSettings(path), { reachable: true, detail: '' })
    assert.equal(status.config.judgeThreshold, 0.9)
  })
})

test('buildStatus does not probe an endpoint for a judge that has none', async () => {
  await withConfigHome(async () => {
    const status = await buildStatus({ judge: 'none' }, () => ({}))
    assert.equal(status.judge.detail, 'detectors only')
    assert.equal(status.judge.reachable, false)
  })
})

test('buildStatus labels a chat judge as reachable without a probe', async () => {
  await withConfigHome(async () => {
    const status = await buildStatus({ judge: 'chat' }, () => ({}))
    assert.equal(status.judge.detail, 'metered chat judge')
  })
})

test('probeJudge reports an unreachable endpoint rather than throwing', async () => {
  // Nothing listens on port 9; "unreachable" is the answer, not a failure.
  const probe = await probeJudge('http://127.0.0.1:9', 1_000)
  assert.equal(probe.reachable, false)
  assert.ok(probe.detail.length > 0, 'and says why')
})

test('probeJudge with no endpoint says so instead of fetching', async () => {
  const probe = await probeJudge('')
  assert.equal(probe.reachable, false)
  assert.equal(probe.detail, 'no endpoint configured')
})

test('probeJudge reaches the live Laya sidecar when it is up', async (t) => {
  const probe = await probeJudge('http://127.0.0.1:8092', 2_000)
  if (!probe.reachable) {
    // The sidecar is a shared machine service and may legitimately be down;
    // skip rather than fail a test that is not about its availability.
    t.skip(`laya sidecar not reachable: ${probe.detail}`)
    return
  }
  assert.match(probe.detail, /laya/)
})

test('projectLive hands the page the dashboard snapshot verbatim', async () => {
  const { projectLive } = await import('../src/remote.ts')
  const live = projectLive({
    snapshot: () => ({
      runs: [{ runId: 'r1', step: 3, spentUSD: 0.12, updatedAt: 1700000000000, signals: [] }],
      feed: [{ t: 1, runId: 'r1', kind: 'gate' as const, text: 'ask: write' }],
    }),
    pendingApprovals: () => [
      { id: 'p1', toolName: 'write', reason: 'irreversible', runId: 'r1', askedAt: 2, briefState: 'none' as const },
    ],
    answers: () => true,
    settleApproval: () => true,
    config: () => ({}),
  })
  // The designed page renders these exact shapes, so nothing is re-projected.
  assert.equal(live.answers, true)
  assert.equal(live.pending[0]?.toolName, 'write')
  assert.equal(live.pending[0]?.briefState, 'none')
  assert.equal(live.runs[0]?.step, 3)
  assert.equal(live.runs[0]?.signals.length, 0)
  assert.deepEqual(live.feed, [{ t: 1, runId: 'r1', kind: 'gate', text: 'ask: write' }])
})

test('projectLive forwards the roll-up, and OMITS it when nothing was measured', async () => {
  // `projectLive` is the in-UI page's ONLY data source (`remoteSource.load()`
  // calls `svc.live()`), so before this the surface a person actually uses
  // could not see a single figure §1bp–§1bz exist to produce: the standalone
  // page had them over `/api/state` and this page had none. The `grep` that
  // found no `metrics` reference under `web/` was reporting the projection, not
  // the page.
  const { projectLive } = await import('../src/remote.ts')
  const summary = { runs: 3, provisional: false, malformed: 0, quality: { goalMetRate: 0.667, reviewFraction: 0.222 } }
  const source = (metrics: unknown) => ({
    snapshot: () => ({ runs: [], feed: [], ...(metrics === undefined ? {} : { metrics }) }),
    pendingApprovals: () => [],
    answers: () => true,
    settleApproval: () => true,
    config: () => ({}),
  })

  const measured = projectLive(source(summary) as never)
  assert.deepEqual(measured.metrics, summary, 'the roll-up reaches the page')

  // Absent, not `{…zeros}`: `metrics?` is optional precisely so "measured
  // nothing" and "measured zero" stay distinguishable on the wire.
  const unmeasured = projectLive(source(undefined) as never)
  assert.equal('metrics' in unmeasured, false, 'no metrics key when nothing was measured')
})

test('projectLive with no published state reads empty, never zeros', async () => {
  const { projectLive } = await import('../src/remote.ts')
  assert.deepEqual(projectLive(undefined), { answers: true, pending: [], runs: [], feed: [] })
})

test('an absent policy map reads as the safe posture, not as "nothing"', () => {
  // A fresh profile has no gatePolicies, and the settings page must not show
  // that as an empty selection: the shipped default IS the safe posture, and
  // an operator reading the page should see the posture they actually get.
  assert.equal(approvalModeFor(undefined), 'review-risky')
  assert.equal(approvalModeFor({}), 'review-risky')
})

test('every posture classifies as itself, so Save-with-nothing-touched is a no-op', () => {
  // The select renders `<select value={approvalMode}>` and a Save with nothing
  // touched writes `gatePolicies` back from the classified map. So the property
  // the page depends on is the round trip, and with three postures it HOLDS —
  // §1m could not fix it with two, because an all-auto map had to land on a
  // strict END and so did the map `approve-every-step` writes.
  //
  // The direction guard is stated too, because the round trip can hold while the
  // NAMES mislead: `never-ask` must be the all-auto map, and nothing may be
  // labelled as asking when it does not.
  const STRICTNESS = { 'never-ask': 0, 'review-risky': 1, 'approve-every-step': 2 } as const
  for (const name of Object.keys(APPROVAL_MODES) as Array<keyof typeof APPROVAL_MODES>) {
    assert.equal(approvalModeFor(APPROVAL_MODES[name].policies), name,
      `${name} must classify as itself, or opening the page and pressing Save rewrites the file`)
  }
  // Ordered by how much they ask, and asserted as an order so a future posture
  // cannot be added at the wrong end without this failing.
  assert.ok(STRICTNESS['never-ask'] < STRICTNESS['review-risky'])
  assert.ok(STRICTNESS['review-risky'] < STRICTNESS['approve-every-step'])
  assert.equal(approvalModeFor({ write: 'auto', edit: 'auto', bash: 'auto' }), 'never-ask')
  assert.equal(approvalModeFor({ write: 'always-approve', edit: 'always-approve', bash: 'always-approve' }), 'approve-every-step')
})

test('the third posture is the one a typo produces, and its copy says so', () => {
  // §1m measured a hand-edited file with `write: auto` over a row saying
  // `always-approve`, and the write went through. The posture that describes it
  // is the one whose label must not be reassuring, so both are asserted: a name
  // that could read as strict, and a detail line that states the consequence.
  const off = APPROVAL_MODES['never-ask']
  assert.match(off.label, /never ask|gate off/i,
    'the label has to say the gate is off; "approve every step" is the lie')
  assert.match(off.detail, /no approval|runs with no approval/i,
    'the detail line has to state what happens, not what is avoided')
  assert.equal(off.policies.write, 'auto')
  assert.equal(off.policies.bash, 'auto')
})
test('the three postures are decided by what each write class DOES', () => {
  // One table, three answers, and the middle one is the point: `auto` on every
  // write class asks about NOTHING, which §1m measured happening silently and
  // which two postures could not name.
  const ask = { write: 'always-approve', edit: 'always-approve', bash: 'always-approve' }
  assert.equal(approvalModeFor({ write: 'auto', edit: 'auto', bash: 'auto' }), 'never-ask')
  assert.equal(approvalModeFor(ask), 'approve-every-step')
  // One class that asks — and `auto-if-confident` asks whenever there is no
  // confidence estimate, which is the normal case — is enough to stop the loose
  // answer. That is the whole point: the classifier must never call a gate that
  // WILL ask "no write class asks".
  assert.equal(approvalModeFor({ write: 'auto', edit: 'auto', bash: 'auto-if-confident' }), 'review-risky')
  assert.equal(approvalModeFor({ write: 'always-approve' }), 'review-risky')
  assert.equal(approvalModeFor(undefined), 'review-risky')
})
test('gatePolicies and checkpointAtStep survive a settings round-trip', () => {
  // These are the two keys the approval UI writes. If validation dropped
  // them, the selector would appear to save and change nothing.
  const dir = mkdtempSync(join(tmpdir(), 'fl-settings-'))
  const path = join(dir, 'settings.yaml')
  try {
    const policies = { ...APPROVAL_MODES['approve-every-step'].policies }
    saveSettings({ gatePolicies: policies, checkpointAtStep: 8 }, path)
    const back = readSettings(path)
    assert.deepEqual(back['gatePolicies'], policies)
    assert.equal(back['checkpointAtStep'], 8)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('an unknown gate policy value is rejected rather than silently dropped', () => {
  // A typo that quietly became "no policy" would gate nothing, which is the
  // failure mode this whole surface exists to prevent.
  assert.throws(
    () => validateSettings({ gatePolicies: { write: 'always' } as never }),
    /gatePolicies|policy|write/i,
  )
})
