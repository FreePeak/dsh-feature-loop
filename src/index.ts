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
import { apply as applyFeatureLoop, resolveJudge } from './plugin.ts'
import type { CreatePolicyOptions, FeatureLoopPolicy } from './plugin.ts'
import type { DashboardConfig } from './dashboard.ts'
import { parseOptimizeConfig } from './spec.ts'
import type { OptimizeConfig } from './spec.ts'

export {
  apply as applyListeners,
  createPolicy,
  reviewStep,
  routeForStep,
  escalationForStep,
  gateForTool,
  detectSignals,
  executeLoopCommand,
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
  /**
   * How a gate-raised review reaches a human. Defaults to `ask`.
   *
   * - `ask`  — the Web UI prompts in the conversation composer (via
   *            `@deepseek-ai/dsh-client-ui-approval`). Fails closed to a refusal
   *            when no approval channel is mounted, so it is never less safe
   *            than `deny`.
   * - `deny` — refuse outright without prompting. Use for unattended and CI
   *            runs where no human is watching.
   */
  gateMode?: 'ask' | 'deny'
  /**
   * The HITL approval dashboard: a loopback web page for answering this loop's
   * approval requests and watching the run. On by default — omitting the block
   * starts the page on 127.0.0.1:8100 with a per-start token. Set
   * `enabled: false` for no server (the composer panel remains the only
   * channel), or `answers: false` to watch without answering.
   *
   * Validated field-by-field by `parseDashboardConfig` even when disabled, so
   * a typo fails at load rather than when someone flips `enabled` on. Set
   * `brief.enabled` with a `brief.model` to also request a model-authored
   * review brief per ask, rendered above the Allow/Reject buttons.
   */
  dashboard?: DashboardConfig
  /**
   * Which judge scores review-worthiness, and how to reach it.
   *
   * `none` (detectors only) | `chat` (metered) | `laya` (local, free). The
   * settings page and the status panel both read these keys, so they are part
   * of the row's public surface rather than a CLI-only extra.
   */
  judge?: 'none' | 'chat' | 'laya'
  /** System One provider base URL. Defaults to `http://127.0.0.1:8091`. */
  judgeBaseURL?: string
  /** Model alias the System One provider routes to. Defaults to `laya`. */
  systemOneModel?: string
  /** Model the `chat` judge uses. */
  judgeModel?: string
  /** Deadline for one judge call, in ms. */
  judgeTimeoutMs?: number
  /**
   * The optimization block (`loops`, `derive`, `history`, `judge`,
   * `totalBudgetUSD`). The block is validated at load and forwarded to the
   * plugin, which uses it for exactly what a deployed loop can use: `derive`
   * and `history` drive the run-history recording and the dashboard's Metrics
   * payload, while `loops`/`totalBudgetUSD` are accepted but intentionally not
   * consumed by any hook — iteration belongs to the caller (the CLI's
   * `runRefined`), not to a step waterfall. See `OptimizePolicyOptions`.
   */
  optimize?: OptimizeConfig
}

/**
 * Runtime schema for {@link Config}.
 *
 * `spec` is deliberately `z.any()`: it is validated far more strictly by
 * `validateSpec` inside `createPolicy`, which names the missing dimensions. A
 * second, weaker schema here would produce a worse error message for the same
 * mistake. `dashboard` follows the same rule: `parseDashboardConfig` names the
 * bad field, and runs even when the dashboard is disabled.
 */
export const Config: z<Config> = z.object({
  spec: z.any(),
  confidenceThreshold: z.number(),
  reviewBudget: z.number(),
  judgeThreshold: z.number(),
  gatePolicies: z.any(),
  gateMode: z.union([z.const('ask'), z.const('deny')]),
  dashboard: z.any(),
  optimize: z.any(),
  judge: z.string(),
  judgeBaseURL: z.string(),
  systemOneModel: z.string(),
  judgeModel: z.string(),
  judgeTimeoutMs: z.number(),
}) as unknown as z<Config>

/**
 * Install the feature-loop policies into a harness context.
 *
 * @param ctx - the cordis context to install into.
 * @param config - the deployment's configuration from the patch row.
 * @returns the disposer cordis calls on unload (stops the dashboard too), or
 * nothing when cordis collects the listener disposers itself.
 */
export function apply(ctx: Context, config: Config = {}): (() => void) | void {
  // Fail at load, before any listener registers — the same rule as the spec
  // and the dashboard block: a misconfigured optimize band stops the plugin
  // from loading; it never degrades into a refinement loop nobody meant to
  // start. The parsed block is forwarded so the plugin can record history and
  // feed the dashboard's Metrics panel from it.
  const optimize = config.optimize === undefined ? undefined : parseOptimizeConfig(config.optimize)
  // Same rule for the judge: a `chat` judge with no key is a loud load-time
  // error, not a judge that quietly never runs. `laya` and `none` never throw.
  const { judge } = resolveJudge({
    judge: config.judge,
    judgeBaseURL: config.judgeBaseURL,
    systemOneModel: config.systemOneModel,
    judgeModel: config.judgeModel,
    judgeTimeoutMs: config.judgeTimeoutMs,
  })
  return applyFeatureLoop(ctx, {
    spec: config.spec,
    judge,
    // The deployment's own config, verbatim. The panel must show what the row
    // says (`judge: laya`), not the resolved internals — `options.judge` is a
    // constructed Judge, which no status page can render as a setting.
    rowConfig: { ...config },
    confidenceThreshold: config.confidenceThreshold,
    gatePolicies: config.gatePolicies,
    gateMode: config.gateMode,
    dashboard: config.dashboard,
    optimize,
    router: {
      ...(config.reviewBudget === undefined ? {} : { reviewBudget: config.reviewBudget }),
      ...(config.judgeThreshold === undefined ? {} : { judgeThreshold: config.judgeThreshold }),
    },
  })
}

export default apply

/** Re-exported for callers that hold a policy and want its type. */
export type { FeatureLoopPolicy as Policy }
