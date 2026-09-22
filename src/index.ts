/**
 * Package entry: the cordis plugin the DeepSeek Harness loads.
 *
 * The harness addresses a plugin by its package `name` in a profile's
 * `cordis.patch.yml`, then imports this module and calls `apply(ctx, config)`.
 * Everything this module does is re-exported from {@link ./plugin.ts}, which
 * owns the actual listener wiring — this file exists so the package has the
 * `name` / `inject` / `Config` / `apply` shape cordis requires, and so the
 * policy helpers stay importable for tests and for the standalone runner.
 *
 * @module @freepeak/dsh-feature-loop
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { apply as applyFeatureLoop } from './plugin.ts'
import type { CreatePolicyOptions, FeatureLoopPolicy } from './plugin.ts'

export {
  apply as applyListeners,
  createPolicy,
  reviewStep,
  routeForStep,
  escalationForStep,
  gateForTool,
  detectSignals,
} from './plugin.ts'
export type { CreatePolicyOptions, FeatureLoopPolicy } from './plugin.ts'

/** The name cordis and the harness log address this plugin by. */
export const name = 'feature-loop'

/** The services this plugin reads. The agent loop owns `agents`. */
export const inject = ['agents']

/**
 * The deployment's configuration, as it appears under the patch row's `config:`.
 *
 * Every field is optional. With no `spec` the loop keeps the harness's own
 * unbounded behaviour — no ceilings, no detectors — which is what keeps a
 * deployment comparable against a plain harness. Supplying a `spec` is what
 * turns the policies on.
 */
export interface Config {
  /**
   * The eight-dimension loop spec. Supplying it enables the ceilings, the
   * detectors, the judge and the gate. Omitted means "policies off".
   */
  spec?: CreatePolicyOptions['spec']
  /** Confidence bar for `auto-if-confident` gate policies, in `[0, 1]`. */
  confidenceThreshold?: number
  /** Review budget as a fraction of steps, in `(0, 1]`. Defaults to 0.10. */
  reviewBudget?: number
  /** Judge score at or above which a step is worth a human look, 0–3. Defaults to 2. */
  judgeThreshold?: number
  /**
   * Per-tool gate policy overrides, by tool name. Tools absent here fall back to
   * their reversibility class, and an unclassified tool is `irreversible`.
   */
  gatePolicies?: Record<string, 'auto' | 'auto-if-confident' | 'always-approve'>
}

/**
 * Runtime schema for {@link Config}.
 *
 * `spec` is deliberately `z.any()`: it is validated far more strictly by
 * `validateSpec` inside `createPolicy`, which names the missing dimensions. A
 * second, weaker schema here would produce a worse error message for the same
 * mistake.
 */
export const Config: z<Config> = z.object({
  spec: z.any(),
  confidenceThreshold: z.number(),
  reviewBudget: z.number(),
  judgeThreshold: z.number(),
  gatePolicies: z.any(),
}) as unknown as z<Config>

/**
 * Install the feature-loop policies into a harness context.
 *
 * @param ctx - the cordis context to install into.
 * @param config - the deployment's configuration from the patch row.
 * @returns nothing; cordis owns disposal of the registered listeners.
 */
export function apply(ctx: Context, config: Config = {}): void {
  applyFeatureLoop(ctx, {
    spec: config.spec,
    confidenceThreshold: config.confidenceThreshold,
    gatePolicies: config.gatePolicies,
    router: {
      ...(config.reviewBudget === undefined ? {} : { reviewBudget: config.reviewBudget }),
      ...(config.judgeThreshold === undefined ? {} : { judgeThreshold: config.judgeThreshold }),
    },
  })
}

export default apply

/** Re-exported for callers that hold a policy and want its type. */
export type { FeatureLoopPolicy as Policy }
