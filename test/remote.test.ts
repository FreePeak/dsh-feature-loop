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
import { join } from 'node:path'
import { test } from 'node:test'
import { parse as parseYaml } from 'yaml'

import {
  buildStatus,
  probeJudge,
  readSettings,
  saveSettings,
  settingsPath,
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
    const status = await buildStatus({ judge: 'laya' }, {}, { reachable: true, detail: 'ok' })
    assert.equal(status.judge.kind, 'laya')
    assert.equal(status.enabled, false, 'no spec in the row means policies are off')
    assert.match(status.configPath, /dshloop\/config\.yaml$/)
  })
})

test('buildStatus marks the policies on when the row carries a spec', async () => {
  await withConfigHome(async () => {
    const status = await buildStatus({ spec: { goal: 'x' } }, {}, { reachable: true, detail: '' })
    assert.equal(status.enabled, true)
  })
})

test('the saved file wins over the row config for display', async () => {
  await withConfigHome(async (_home, path) => {
    saveSettings({ judgeThreshold: 0.9 }, path)
    const status = await buildStatus({ judge: 'laya', judgeThreshold: 2 }, readSettings(path), { reachable: true, detail: '' })
    assert.equal(status.config.judgeThreshold, 0.9)
  })
})

test('buildStatus does not probe an endpoint for a judge that has none', async () => {
  await withConfigHome(async () => {
    const status = await buildStatus({ judge: 'none' }, {})
    assert.equal(status.judge.detail, 'detectors only')
    assert.equal(status.judge.reachable, false)
  })
})

test('buildStatus labels a chat judge as reachable without a probe', async () => {
  await withConfigHome(async () => {
    const status = await buildStatus({ judge: 'chat' }, {})
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
  const probe = await probeJudge('http://127.0.0.1:8091', 2_000)
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

test('projectLive with no published state reads empty, never zeros', async () => {
  const { projectLive } = await import('../src/remote.ts')
  assert.deepEqual(projectLive(undefined), { answers: true, pending: [], runs: [], feed: [] })
})
