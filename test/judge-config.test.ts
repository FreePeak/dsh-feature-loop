/**
 * The judge a deployment config resolves to.
 *
 * `resolveJudge` had no coverage, which is how the default endpoint rotted:
 * Laya moved off the retired containerised sidecar (`:8091`) to the native
 * macOS service (`:8092`), the default kept the old port, and a `judge: laya`
 * deployment with no explicit `judgeBaseURL` reached a dead endpoint. The judge
 * fails open by design, so nothing errored — the advisor just never scored.
 * These assertions pin the default to the port the live service actually uses.
 *
 * This file imports `src/plugin.ts`, so it is NOT in the CI test job's list:
 * that job runs with no `node_modules` on purpose, to prove the files it runs
 * are dependency-free, and `src/plugin.ts` carries a runtime
 * `@deepseek-ai/dsh-llm` import. Same reason `test/plugin-approval.test.ts`
 * stays out of it. Run locally via `pnpm test` / `make test`.
 *
 * Run: `node --experimental-strip-types --test test/judge-config.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { resolveJudge } from '../src/plugin.ts'

test('a laya judge with no judgeBaseURL points at the live sidecar, not the retired one', (t) => {
  if (process.env.SYSTEMONE_BASE_URL !== undefined) {
    // The default is read from the environment at module load, so an explicit
    // override legitimately wins. Assert that instead of fighting it.
    t.skip('SYSTEMONE_BASE_URL is set; the deployment default is overridden')
    return
  }
  const { label } = resolveJudge({ judge: 'laya' })
  assert.match(label, /:8092/, 'defaults to the native Laya service')
  assert.doesNotMatch(label, /:8091/, 'never the retired containerised sidecar')
})

test('an explicit judgeBaseURL overrides the default', () => {
  const { label } = resolveJudge({ judge: 'laya', judgeBaseURL: 'http://judge.example:9999' })
  assert.match(label, /judge\.example:9999/)
})

test('judge: none stays detectors-only and needs no endpoint', async () => {
  const { judge, label } = resolveJudge({ judge: 'none' })
  assert.equal(label, 'none (detectors only)')
  // NO_JUDGE scores nothing, so every question reads as "no opinion" rather
  // than throwing — detectors alone carry the review decision.
  const answer = await judge.score('state', {})
  assert.equal(answer.score, undefined)
  assert.equal(answer.error, 'no judge configured')
})
