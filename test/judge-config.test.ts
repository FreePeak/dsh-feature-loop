/**
 * The check for the judge seam.
 *
 * Run: `node --experimental-strip-types --test test/judge-config.test.ts`
 *
 * The bug this exists to prevent is a silent one: the plugin used to hardcode
 * `NO_JUDGE` while accepting a `judge:` key it never read, so a profile could
 * ask for Laya and get detector-only reviews forever with no error anywhere.
 * Every case below therefore asserts on the *constructed kind*, not on the
 * absence of a throw.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { resolveJudge } from '../src/plugin.ts'
import { NO_JUDGE } from '../src/laya.ts'

/** Run `fn` with a temporary environment, restoring it afterwards. */
function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const saved = new Map<string, string | undefined>()
  for (const [k, v] of Object.entries(vars)) {
    saved.set(k, process.env[k])
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  try {
    return fn()
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
}

test('an omitted judge is NO_JUDGE — an existing row keeps its behaviour', () => {
  const { judge, label } = resolveJudge({})
  assert.equal(judge, NO_JUDGE)
  assert.match(label, /detectors only/)
})

test('judge: none is explicitly detector-only', () => {
  const { judge, label } = resolveJudge({ judge: 'none' })
  assert.equal(judge, NO_JUDGE)
  assert.match(label, /detectors only/)
})

test('judge: laya builds a real client, not NO_JUDGE', () => {
  const { judge, label } = resolveJudge({ judge: 'laya' })
  assert.notEqual(judge, NO_JUDGE, 'laya must not fall through to the no-op judge')
  assert.match(label, /systemone/)
  assert.match(label, /laya/)
})

test('judge: laya defaults to the local sidecar and names it in the label', () => {
  withEnv({ SYSTEMONE_BASE_URL: undefined, SYSTEMONE_MODEL: undefined }, () => {
    const { label } = resolveJudge({ judge: 'laya' })
    assert.match(label, /127\.0\.0\.1:8091/, 'the shared Laya sidecar')
    assert.match(label, /\(laya @/) 
  })
})

test('judgeBaseURL swaps the provider without touching code — Laya to Jev', () => {
  const { label } = resolveJudge({
    judge: 'laya',
    judgeBaseURL: 'https://jev.internal/v1',
    systemOneModel: 'jev-large',
  })
  assert.match(label, /jev-large @ https:\/\/jev\.internal\/v1/)
})

test('the env var is the fallback when the row does not name a URL', () => {
  withEnv({ SYSTEMONE_BASE_URL: 'http://127.0.0.1:9999', SYSTEMONE_MODEL: 'laya-multilingual' }, () => {
    const { label } = resolveJudge({ judge: 'laya' })
    assert.match(label, /laya-multilingual @ http:\/\/127\.0\.0\.1:9999/)
  })
})

test('an explicit row value outranks the environment', () => {
  withEnv({ SYSTEMONE_BASE_URL: 'http://env-wins:1' }, () => {
    const { label } = resolveJudge({ judge: 'laya', judgeBaseURL: 'http://row-wins:2' })
    assert.match(label, /row-wins:2/)
    assert.doesNotMatch(label, /env-wins/)
  })
})

test('judge: chat with no key fails at load rather than never running', () => {
  withEnv(
    { ONEGW_API_KEY: undefined, ONEGE_API_KEY: undefined, DSH_CREDENTIALS: '/nonexistent/creds.yaml' },
    () => {
      assert.throws(() => resolveJudge({ judge: 'chat' }), (error: Error) => {
        assert.match(error.message, /no gateway key/)
        assert.match(error.message, /judge: laya/, 'the error names the working alternative')
        return true
      })
    },
  )
})

test('judge: chat with a key builds a chat judge and labels the model', () => {
  withEnv({ ONEGW_API_KEY: ['test', 'key'].join('-') }, () => {
    const { judge, label } = resolveJudge({ judge: 'chat', judgeModel: 'xiaomi/mimo-v2.5' })
    assert.notEqual(judge, NO_JUDGE)
    assert.match(label, /chat \(xiaomi\/mimo-v2\.5\)/)
  })
})

test('a laya judge never throws on construction, even with nothing listening', () => {
  // The posture in laya.ts: an unreachable judge latches off after one call and
  // degrades to the detectors. Load must not fail, or a sidecar that is down
  // would stop the harness from booting at all.
  assert.doesNotThrow(() => resolveJudge({ judge: 'laya' }))
})
