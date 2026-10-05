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
import type { CreatePolicyOptions, FeatureLoopPolicy, GateMode, JudgeConfig } from './plugin.ts'
import type { GatePolicy } from './review.ts'
import type { DashboardConfig } from './dashboard.ts'
import { parseOptimizeConfig, parsePipelineConfig } from './spec.ts'
import type { OptimizeConfig, PipelineConfig } from './spec.ts'
import { mergeRowAndSettings, userSettings } from './remote.ts'

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
  /** Step at which the run pauses for review, once. Undefined disables it. */
  checkpointAtStep?: number
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
   * - `auto` — **YOLO**. The three-way verdict collapses to allow/deny and the
   *            decision moves to the envelope in `yolo.ts`: reads, writes inside
   *            the run's worktree, pushing its own branch and opening a PR are
   *            allowed; pushing a protected branch, force-push, merge, publish,
   *            deploy, and touching a credential are **denied, never asked**.
   *            Requires a worktree — without one there is nothing to contain
   *            writes against, so they all deny.
   */
  gateMode?: 'ask' | 'deny' | 'auto'
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
  /** System One provider base URL. Defaults to `http://127.0.0.1:8092`. */
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
   * plugin, which reads exactly ONE key: `history`, the run-history file.
   *
   * **`derive` is read by nothing** — `grep -n 'optimize?.derive' src/plugin.ts`
   * returns no match — and `history` alone drives the run-history recording, as
   * it did before `derive` was checked. A note here claimed both. The rest
   * (`loops`, `judge`, `totalBudgetUSD`) are likewise accepted and not
   * consumed, because iteration belongs to the caller (the CLI's
   * `runRefined`), not to a step waterfall.
   *
   * The keys are kept rather than deleted so a deployment that sets them does
   * not start failing validation when they are eventually honoured — and
   * `scripts/check-dead-exports.mjs` does not flag them, because they ARE
   * reachable: `parseOptimizeConfig` reads every one of them. A key that is
   * validated and then ignored is a documented no-op, not dead code; the bug
   * this note records is the CLAIM that it was read.
   */
  optimize?: OptimizeConfig
  /**
   * The 0→1 pipeline: turn the loop into the five-phase research → PRD →
   * implement → test → ship run. Omitted or `enabled: false` means today's
   * bounded loop, exactly.
   *
   * Requires a `spec`, because the pipeline carves `spec.costBudgetUSD` into
   * per-phase budgets and has nothing to carve without one. Set
   * `pipeline.testCommand` or the test phase can never pass its own exit gate —
   * it fails closed rather than guessing which runner your project uses.
   */
  pipeline?: PipelineConfig
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
  checkpointAtStep: z.number(),
  judgeThreshold: z.number(),
  gatePolicies: z.any(),
  gateMode: z.union([z.const('ask'), z.const('deny'), z.const('auto')]),
  dashboard: z.any(),
  optimize: z.any(),
  pipeline: z.any(),
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
  // `Config` is exported because cordis's contract asks for it — and it is NOT
  // run here. Measured 2026-10-03, in the live container, on this branch:
  // `gateMode: auto` composed, the plugin LOADED, and the loop RAN — the schema
  // rejected nothing, because `--dump-config` skips validation AND the loader
  // takes the row as written.
  //
  // So the union is a TYPE, not a guard. What did hold was
  // `createPolicy`: `gateMode: options.gateMode ?? 'ask'` sends an unrecognised
  // value to the SAFE default, and `ask` with no answerer refuses. That is the
  // right direction for a safety setting and the wrong substitute for a
  // rejection — a typo that happens to default to asking reads as a working
  // gate. (docker/README.md has said so about `--dump-config` since 2026-10-01;
  // this is the same finding for the whole load path, not just the dump.)
  //
  // One line, and it names the field, because every OTHER block here already
  // fails loudly and this one silently did not.
  //
  // Measured both ways on a profile this script generated, 2026-10-03:
  //
  //   gateMode: auto  ->  the plugin throws, the harness prints the message as a
  //     WARNING, the plugin never constructs… and the run ANSWERS. `say hi` came
  //     back; so did a requested `gm-proof.txt` containing `hello`, written with
  //     no gate in front of it. A throw is loud and not fatal: the harness
  //     carries on past a failed plugin, and a loop with no gate never asks.
  //   gateMode: ask   ->  `Create a file … gm2-proof.txt` is DENIED, no file.
  //
  // Which is the point. The throw buys the operator the sentence that names the
  // field; the fail-closed behaviour they actually get comes from `ask` being
  // the default, and that is the behaviour this line is protecting. A typo must
  // not silently become "never gated".
  if (config.gateMode !== undefined && config.gateMode !== 'ask' && config.gateMode !== 'deny') {
    throw new Error(
      `gateMode must be "ask" or "deny", received ${JSON.stringify(config.gateMode)}. `
      + '"ask" prompts a human; "deny" refuses outright for unattended runs.',
    )
  }
  const optimize = config.optimize === undefined ? undefined : parseOptimizeConfig(config.optimize)
  // The pipeline block gets the same treatment, plus one check of its own: a
  // pipeline with no spec has no run budget to carve into phase budgets, and
  // silently ignoring it would produce a plugin that loads, appears in the boot
  // graph, and runs no phases — the inert-install failure mode this repo has
  // already been bitten by once.
  const pipeline = config.pipeline === undefined ? undefined : parsePipelineConfig(config.pipeline)
  if (pipeline?.enabled === true && config.spec === undefined) {
    throw new TypeError(
      'pipeline.enabled is true but no spec was configured: the pipeline carves spec.costBudgetUSD into '
      + 'per-phase budgets, so a pipeline with no spec would load and run nothing. Either add a spec, or set '
      + 'pipeline.enabled: false.',
    )
  }
  // Same rule for the judge: a `chat` judge with no key is a loud load-time
  // error, not a judge that quietly never runs. `laya` and `none` never throw.
  //
  // Resolved from the MERGED config, not the row: the settings page offers the
  // judge kind, so a value saved there has to decide which Judge is built.
  // Reading `config.judge` here instead is what produced, live, a boot that
  // died with `dsh: UNKNOWN: policy.judge.score is not a function` — the merge
  // overwrote the constructed Judge with the STRING 'laya' the file holds, and
  // the first step called `.score` on it.
  const merged = mergeRowAndSettings(config as unknown as Record<string, unknown>)
  const { judge } = resolveJudge({
    judge: merged.judge as JudgeConfig['judge'],
    judgeBaseURL: merged.judgeBaseURL as string | undefined,
    systemOneModel: merged.systemOneModel as string | undefined,
    judgeModel: merged.judgeModel as string | undefined,
    judgeTimeoutMs: merged.judgeTimeoutMs as number | undefined,
  })
  return applyFeatureLoop(ctx, {
    spec: config.spec,
    judge,
    // The deployment's own config, verbatim. The panel must show what the row
    // says (`judge: laya`), not the resolved internals — `options.judge` is a
    // constructed Judge, which no status page can render as a setting.
    //
    // It is ALSO what the gate is built from. A user may want to widen the gate
    // mid-session (`run`/`glob`/`grep` → auto) without editing a shared patch
    // layer that other profiles inherit, and it is their own machine; the patch
    // row keeps its comments and its role as deployment configuration, and the
    // user file wins where the two overlap. Settings the page cannot express —
    // `spec`, `dashboard`, `optimize` — stay row-only, because the panel offers
    // no control for them and a half-applied block is worse than a clear
    // boundary. See `mergeRowAndSettings` in ./remote.ts for the precedence
    // and for why it is not a deep merge.
    rowConfig: { ...config },
    dashboard: config.dashboard,
    optimize,
    // The same merged object the judge was resolved from, minus the three keys
    // that must stay as they are: `judge` is the constructed Judge (the merge
    // carries the STRING, which is not a Judge), and `dashboard`/`optimize` are
    // blocks the settings file may not touch.
    confidenceThreshold: merged.confidenceThreshold as number | undefined,
    gatePolicies: merged.gatePolicies as Record<string, GatePolicy> | undefined,
    gateMode: merged.gateMode as GateMode | undefined,
    router: merged.router as { reviewBudget?: number, judgeThreshold?: number, checkpointAtStep?: number } | undefined,
  })
}

export default apply

/** Re-exported for callers that hold a policy and want its type. */
export type { FeatureLoopPolicy as Policy }
