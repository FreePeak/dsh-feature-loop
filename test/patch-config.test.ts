/**
 * The shipped patch row, parsed.
 *
 * The claim this file defends is narrow and specific: **the configuration this
 * repo ships is a configuration this repo can load.** A patch row that no longer
 * parses, or that names a field the loader rejects, produces a plugin that fails
 * at boot on a machine that installed it correctly — and `make install`'s
 * `--dump-config` check would report a successful install of a plugin that then
 * does not load.
 *
 * Not in CI's no-install job, for the same reason `test/remote.test.ts` is not:
 * it reads `cordis.patch.yml` with the `yaml` dependency, and that job runs with
 * no `node_modules` at all. It is covered by the local suite and by `make
 * verify`, which is where the patch row is actually consumed.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import { parse } from 'yaml'

import { PHASE_ORDER } from '../src/phases.ts'
import { parsePipelineConfig } from '../src/spec.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The `feature-loop` row's config, as it ships. */
function shippedConfig(): Record<string, unknown> {
  const doc = parse(readFileSync(join(ROOT, 'cordis.patch.yml'), 'utf8')) as { insert: { id: string; config?: Record<string, unknown> }[] }[]
  const row = doc[0]?.insert.find(r => r.id === 'feature-loop')
  assert.ok(row?.config !== undefined, 'the feature-loop row must carry a config block')
  return row.config
}

describe('the shipped patch row', () => {
  it('is valid YAML with the three expected rows', () => {
    const doc = parse(readFileSync(join(ROOT, 'cordis.patch.yml'), 'utf8')) as { insert: { id: string }[] }[]
    assert.deepEqual(doc[0]?.insert.map(r => r.id), ['feature-loop', 'feature-loop-remote', 'feature-loop-command'])
  })

  it('carries a spec with all eight dimensions, so the policies are live', () => {
    // An absent spec is the documented way to turn the policies off. Shipping
    // one that is absent would mean `make install` succeeds into a plugin that
    // does nothing — the exact outcome the README warns against.
    const spec = shippedConfig().spec as Record<string, unknown>
    for (const key of ['goal', 'sensor', 'controller', 'actuator', 'feedback', 'termination', 'maxSteps', 'costBudgetUSD']) {
      assert.notEqual(spec[key], undefined, `the shipped spec must answer "${key}"`)
    }
  })

  it('carries a price table, so the cost ceiling can price a step', () => {
    const spec = shippedConfig().spec as Record<string, unknown>
    const ladder = (spec.controller as { ladder: { provider: string; model: string }[] }).ladder
    const prices = spec.prices as Record<string, unknown>
    for (const rung of ladder) {
      const key = `${String(rung.provider)}/${String(rung.model)}`
      assert.notEqual(prices[key], undefined, `no price for ladder rung "${key}" — the ceiling would read $0.00 forever`)
    }
  })

  it('carries a pipeline block that the loader accepts', () => {
    const pipeline = shippedConfig().pipeline
    assert.notEqual(pipeline, undefined, 'the pipeline block should ship, documented and disabled')
    assert.doesNotThrow(() => parsePipelineConfig(pipeline as Parameters<typeof parsePipelineConfig>[0]))
  })

  it('ships the pipeline DISABLED, so installing changes nothing', () => {
    assert.equal((shippedConfig().pipeline as { enabled?: boolean }).enabled, false)
  })

  it('names only real phases in phaseMaxSteps', () => {
    const caps = (shippedConfig().pipeline as { phaseMaxSteps?: Record<string, unknown> }).phaseMaxSteps ?? {}
    for (const phase of Object.keys(caps)) {
      assert.ok(PHASE_ORDER.includes(phase as (typeof PHASE_ORDER)[number]), `unknown phase "${phase}" in the shipped patch`)
    }
  })

  it('leaves testCommand commented out rather than guessing a runner', () => {
    // The test phase's exit gate is this command's exit code. Shipping a guess
    // would report a passing test phase for a project whose tests never ran.
    assert.equal((shippedConfig().pipeline as { testCommand?: string }).testCommand, undefined)
  })

  it('leaves YOLO off by default', () => {
    const mode = shippedConfig().gateMode
    assert.notEqual(mode, 'auto', 'YOLO must never be the shipped default')
  })
})
