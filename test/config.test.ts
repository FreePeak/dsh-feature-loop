/**
 * The check that fails when config loading or precedence breaks.
 *
 * Run: `node --experimental-strip-types --test test/config.test.ts`
 *
 * The property under test is precedence, not parsing: every case builds real
 * files in a temp tree and asserts which layer won. A loader that parses YAML
 * beautifully but lets a user file beat a project file is the bug this catches.
 */

import { strict as assert } from 'node:assert'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  CONFIG_TEMPLATE,
  DEFAULT_CONFIG,
  DEFAULT_JUDGE_BASE_URL,
  DEFAULT_SYSTEMONE_MODEL,
  configFromPluginRow,
  describeSources,
  loadConfig,
  mergeConfig,
  readConfigFile,
  validateConfig,
} from '../src/config.ts'

/**
 * A throwaway tree, removed when the callback returns.
 *
 * `XDG_CONFIG_HOME` is redirected too, and that is load-bearing rather than
 * tidy: `loadConfig` reads the USER layer from there, and redirecting only the
 * project root left every case able to see the operator's real
 * `~/.config/dshloop/config.yaml`. "yields the defaults when no file exists"
 * therefore passed only while that file was absent — it passed in CI and failed
 * on a machine that had used the settings page once. Same guard as
 * `remote.test.ts`.
 */
function withTmp<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'dshloop-config-'))
  const savedXdg = process.env.XDG_CONFIG_HOME
  process.env.XDG_CONFIG_HOME = dir
  try {
    return fn(dir)
  } finally {
    if (savedXdg === undefined) delete process.env.XDG_CONFIG_HOME
    else process.env.XDG_CONFIG_HOME = savedXdg
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Write a project config under a root directory. */
function writeProject(root: string, body: string): string {
  const dir = join(root, '.feature-loop')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, 'config.yaml')
  writeFileSync(path, body)
  return path
}

test('a missing file is undefined, not an error', () => {
  withTmp((dir) => {
    assert.equal(readConfigFile(join(dir, 'nope.yaml')), undefined)
  })
})

test('an empty file parses to an empty config', () => {
  withTmp((dir) => {
    const path = join(dir, 'empty.yaml')
    writeFileSync(path, '   \n# just a comment\n')
    assert.deepEqual(readConfigFile(path), {})
  })
})

test('JSON parses as YAML — one code path for both formats', () => {
  withTmp((dir) => {
    const path = join(dir, 'config.json')
    writeFileSync(path, JSON.stringify({ maxSteps: 7, judge: 'none' }))
    assert.deepEqual(readConfigFile(path), { maxSteps: 7, judge: 'none' })
  })
})

test('a top-level list is rejected, naming the file', () => {
  withTmp((dir) => {
    const path = join(dir, 'bad.yaml')
    writeFileSync(path, '- one\n- two\n')
    assert.throws(() => readConfigFile(path), (error: Error) => {
      assert.ok(error instanceof SyntaxError)
      assert.match(error.message, /bad\.yaml/)
      assert.match(error.message, /must be a mapping/)
      return true
    })
  })
})

test('malformed YAML names the file rather than throwing a bare parser error', () => {
  withTmp((dir) => {
    const path = join(dir, 'broken.yaml')
    writeFileSync(path, 'judge: [unclosed\n')
    assert.throws(() => readConfigFile(path), /invalid YAML in .*broken\.yaml/)
  })
})

test('mergeConfig: later layers win for scalars', () => {
  const merged = mergeConfig({ maxSteps: 1, judge: 'chat' }, { maxSteps: 9 })
  assert.equal(merged.maxSteps, 9)
  assert.equal(merged.judge, 'chat', 'an untouched key survives')
})

test('mergeConfig: undefined never overwrites a set value', () => {
  const merged = mergeConfig({ maxSteps: 9 }, { maxSteps: undefined })
  assert.equal(merged.maxSteps, 9)
})

test('mergeConfig: nested blocks merge field-wise, not wholesale', () => {
  // The reason this matters: a project file changing only the port must not
  // discard the user's brief configuration.
  const merged = mergeConfig(
    { dashboard: { enabled: true, brief: { enabled: true, model: 'm' } } },
    { dashboard: { port: 9000 } },
  )
  assert.equal(merged.dashboard?.port, 9000)
  assert.equal(merged.dashboard?.enabled, true, 'the user layer survives')
  assert.equal(merged.dashboard?.brief?.model, 'm', 'the brief survives')
})

test('mergeConfig: a list is replaced, never concatenated', () => {
  const merged = mergeConfig({ sensor: undefined } as never, { gatePolicies: { read: 'auto' } })
  assert.deepEqual(merged.gatePolicies, { read: 'auto' })
})

test('the CLI flag layer outranks every file layer', () => {
  withTmp((dir) => {
    writeProject(dir, 'maxSteps: 3\njudge: none\n')
    const { config } = loadConfig({
      root: dir,
      overrides: { maxSteps: 42 },
    })
    assert.equal(config.maxSteps, 42, 'the flag wins over the project file')
    assert.equal(config.judge, 'none', 'an unflagged key still comes from the file')
  })
})

test('the project layer outranks the user layer', () => {
  withTmp((dir) => {
    const project = writeProject(dir, 'maxSteps: 7\n')
    // Simulate a user layer by merging it in explicitly: the real user paths
    // live in $HOME and a test must never depend on the operator's dotfiles.
    const { config, sources } = loadConfig({ root: dir })
    assert.equal(config.maxSteps, 7)
    assert.ok(sources.some((s) => s.path === project && s.kind === 'project'))
  })
})

test('an explicit --config outranks the project file', () => {
  withTmp((dir) => {
    writeProject(dir, 'maxSteps: 7\n')
    const explicit = join(dir, 'other.yaml')
    writeFileSync(explicit, 'maxSteps: 11\n')
    const { config, sources } = loadConfig({ root: dir, explicit })
    assert.equal(config.maxSteps, 11)
    assert.ok(sources.some((s) => s.kind === 'explicit'))
  })
})

test('a missing --config is an error, not a silent fallback to defaults', () => {
  withTmp((dir) => {
    assert.throws(() => loadConfig({ root: dir, explicit: join(dir, 'ghost.yaml') }), /does not exist/)
  })
})

test('loadConfig yields the defaults when no file exists', () => {
  withTmp((dir) => {
    const { config, sources } = loadConfig({ root: dir })
    assert.equal(config.maxSteps, DEFAULT_CONFIG.maxSteps)
    assert.equal(config.judge, 'laya')
    assert.equal(config.phase, 'feature')
    assert.deepEqual(sources, [])
    assert.equal(describeSources(sources), 'defaults only')
  })
})

test('a root written in a file resolves against that file, not the cwd', () => {
  withTmp((dir) => {
    const project = writeProject(dir, 'root: ./sub\n')
    const { config } = loadConfig({ root: dir })
    assert.ok(project.startsWith(dir))
    assert.equal(config.root, join(dir, 'sub'), 'portable across checkouts')
  })
})

test('validateConfig rejects a bad phase, naming the field', () => {
  assert.throws(() => validateConfig({ phase: 'nope' as never }), /phase must be/)
})

test('validateConfig rejects a zero budget — an unlimited budget is not a budget', () => {
  assert.throws(() => validateConfig({ budgetUSD: 0 }), /budgetUSD must be > 0/)
})

test('validateConfig accepts the defaults it ships', () => {
  assert.doesNotThrow(() => validateConfig({ ...DEFAULT_CONFIG }))
})

test('validateConfig delegates to the plugin validators it shares', () => {
  // A file must not be able to hold a dashboard block the plugin would reject.
  assert.throws(() => validateConfig({ dashboard: { host: '0.0.0.0.evil' } }), /dashboard\.host/)
  assert.throws(() => validateConfig({ optimize: { loops: 30 } }), /optimize\.loops/)
})

test('configFromPluginRow carries the shared keys and drops the CLI-only ones', () => {
  const row = configFromPluginRow({
    root: './x',
    goal: 'g',
    verify: 'npm test',
    auto: true,
    quiet: true,
    judge: 'laya',
    judgeBaseURL: 'http://127.0.0.1:8091',
    gateMode: 'ask',
    reviewBudget: 0.2,
  })
  assert.equal(row.judge, 'laya')
  assert.equal(row.judgeBaseURL, 'http://127.0.0.1:8091')
  assert.equal(row.gateMode, 'ask')
  assert.equal(row.reviewBudget, 0.2)
  for (const cliOnly of ['root', 'goal', 'verify', 'auto', 'quiet']) {
    assert.equal(cliOnly in row, false, `${cliOnly} is CLI-only and must not reach the patch row`)
  }
})

test('the shipped template parses and its stated defaults are the real ones', () => {
  withTmp((dir) => {
    const path = join(dir, 'template.yaml')
    writeFileSync(path, CONFIG_TEMPLATE)
    const parsed = readConfigFile(path)
    assert.ok(parsed !== undefined)
    // Uncommented lines are the values a fresh project gets. If a default in
    // DEFAULT_CONFIG moves, this assertion is what notices the template did not.
    assert.equal(parsed.verify, DEFAULT_CONFIG.verify)
    assert.equal(parsed.phase, DEFAULT_CONFIG.phase)
    assert.equal(parsed.budgetUSD, DEFAULT_CONFIG.budgetUSD)
    assert.equal(parsed.maxSteps, DEFAULT_CONFIG.maxSteps)
    assert.equal(parsed.reviewBudget, DEFAULT_CONFIG.reviewBudget)
    assert.equal(parsed.judge, DEFAULT_CONFIG.judge)
    assert.equal(parsed.gateMode, DEFAULT_CONFIG.gateMode)
    assert.equal(parsed.judgeBaseURL, DEFAULT_JUDGE_BASE_URL)
    assert.equal(parsed.systemOneModel, DEFAULT_SYSTEMONE_MODEL)
    assert.doesNotThrow(() => validateConfig(parsed))
  })
})
