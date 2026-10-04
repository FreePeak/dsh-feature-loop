/**
 * The DSH plugin surface for the feature loop's policies.
 *
 * This module is what replaced the vendored `agent.ts` / `index.ts` fork. Rather
 * than owning a copy of the agent loop, it *hosts the policies on the loop the
 * harness already runs*, through the extension points upstream publishes:
 *
 *   agent/pre-step     step and cost ceilings, the detectors, the judge, and the
 *                      reversibility gate. Returning `{kind:'reject'}` is how a
 *                      ceiling stops a run.
 *   agent/request      the cheap-first ladder, applied to the call's route.
 *   tools/execute      the gate at the tool boundary, where the tool name is
 *                      finally known — one layer below `agent/pre-step`.
 *
 * The `tools/execute` hook is the reason the fork is no longer needed. The old
 * fork consulted the gate from its own copy of `executeToolCalls` and therefore
 * delivered a gate-raised review *one step late*, after the tool had already
 * run (see the `ponytail:` note this replaces). Here the call can be denied
 * before dispatch.
 *
 * Nothing in this module reimplements the loop. It reads the harness's events
 * and answers them.
 *
 * @module @freepeak/dsh-feature-loop/plugin
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent, AgentRegistry, PreStepDecision } from '@deepseek-ai/dsh-agent'
import { boundContextSummary, createUserMessage } from '@deepseek-ai/dsh-llm'
import type { ContextFormed, LlmCallConfig, UserMessage } from '@deepseek-ai/dsh-llm'

/**
 * Declare this plugin's message producer identity.
 *
 * `MessageSourceMap` is a merge-extensible sum type: every producer owns its
 * own `kind`, and the harness deliberately has **no** shared catch-all
 * `plugin` kind. The bare `{ kind: 'plugin', plugin }` wrapper is the retired
 * V3 shape — it exists only so the V3→V4 migration can recognise and lift it.
 * A V4 session that still carries it is refused at admission with
 * "format v4 message requires a producer-owned source kind", which is exactly
 * what happened to every session this plugin gated.
 *
 * `plugin:feature-loop` is deliberately the prefixed form rather than a bare
 * `feature-loop`: it is the string the V3→V4 migration produces for a
 * non-first-party plugin of this name, so rows written before this fix and rows
 * written after it agree, instead of splitting the transcript across two kinds.
 */
declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'plugin:feature-loop': { kind: 'plugin:feature-loop' } & ContextFormed
  }
}
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'
import { LoopBudget } from './budget.ts'
import type { BudgetSnapshot, UsageReading } from './budget.ts'
import { PhaseAllocator } from './phase-budget.ts'
import { PIPELINE_PHASE_NAMES } from './spec.ts'
import type { PipelineConfig } from './spec.ts'
import { isTerminal, startPipeline } from './pipeline.ts'
import type { PipelineRun } from './pipeline.ts'
import { PHASE_ORDER } from './phases.ts'
import type { GateResult, PipelinePhase } from './phases.ts'
import { goalNotice, phaseNotice, terminalNotice } from './phase-notice.ts'
import { advancePhase, gateCurrentPhase, runShip } from './driver.ts'
import { appendStep, writeBundle } from './evidence.ts'

/** Where run artifacts land, relative to the workspace root. Mirrors the config default. */
const RUNS_DIR = '.feature-loop/runs'
import { spawnSync } from 'node:child_process'
import { ModelLadder, routeLabel } from './routing.ts'
import { AttentionRouter, ReviewGate, judgeQuestion } from './review.ts'
import type { GatePolicy } from './review.ts'
import { detectSignals } from './signals.ts'
import type { ReviewSignal, StepObservation } from './signals.ts'
import { envelope } from './yolo.ts'
import { branchFor } from './sandbox.ts'
import type { Sandbox } from './sandbox.ts'
import { existsSync } from 'node:fs'
import { parseDashboardConfig, pendingIdFor, startDashboard, DashboardState } from './dashboard.ts'
import { createApprovalRegistry, clearWatcher, watcherActive } from './approvals.ts'
import { createChangeEmitter } from './change-event.ts'
import type { ApprovalRegistry } from './approvals.ts'
import type { ApprovalOutcome, ApprovalQuestion, BriefNode, DashboardConfig, DashboardHandle, DashboardSnapshot } from './dashboard.ts'
import { prepareReview, resolveReversibility } from './agent-policy.ts'
import { validateSpec } from './spec.ts'
import type { LoopSpec } from './spec.ts'
import type { OptimizeConfig } from './spec.ts'
import { NO_JUDGE, OnegwJudge } from './laya.ts'
import { createChatJudge } from './judge.ts'
import type { Judge } from './laya.ts'
import { createChatExplainer, NO_EXPLAINER } from './explainer.ts'
import type { BriefInput, Explainer } from './explainer.ts'
import { normalizeBrief } from './brief.ts'
import { createOnegwClient } from './llm.ts'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { budgetStopText, budgetWarnText, escalationText, reviewText } from './messages.ts'
// Type-only: `summarize` reads data, never the disk, so that module ships no
// fs imports of its own. `runlog.ts` — which does touch the disk — is imported
// STATICALLY on purpose; it used to be a dynamic import inside the turn closer,
// and a load that never settles loses the record with no error at all
// (KNOWN-ISSUES §1bw). A static import resolves at load, before any run.
import { summarize } from './metrics.ts'
import { advisoryFor } from './optimize.ts'
import { appendRecord, readRecords, specFingerprint, taskKeyOf } from './runlog.ts'
import type { RunRecord, StepRecord } from './runlog.ts'
import type { RunOutcome } from './runlog.ts'

/**
 * The approval seam's waterfall, declared locally.
 *
 * `@deepseek-ai/dsh-user-approval` — the package that owns this event in the
 * harness — is not among this repo's installed peers (see package.json), so
 * its `Events` augmentation is absent and `ctx.on('approval/request', …)`
 * would not typecheck at all. The signature below mirrors the harness's own
 * declaration (`packages/interaction/user-approval/src/types.ts`) field for
 * field, including the waterfall's `next`.
 *
 * If that package is ever added as a devDependency, DELETE this block: two
 * non-identical declarations of the same event are a TS2717 error, and its
 * is the one that should win.
 */
declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * Ask composed answerers for one decision. Return an outcome to claim the
     * request or call `next()` to delegate.
     *
     * @param question - the pending approval request.
     * @param next - the rest of the answerer waterfall.
     * @returns the outcome the ask is resolved with.
     */
    'approval/request'(
      this: unknown,
      question: ApprovalQuestion,
      next: () => Promise<ApprovalOutcome>,
    ): Promise<ApprovalOutcome>
  }
}

/**
 * Wrap notice text as a feature-loop-sourced user message.
 *
 * The notices reach both the model and the human reading the transcript, which
 * is the whole point of delivering them this way: a review the model cannot see
 * is a review it will walk straight past on the next step.
 *
 * `form: 'notice'` is what lets the transcript collapse the row to its summary
 * instead of dumping the full text into a conversation the model re-reads every
 * turn, and `boundContextSummary` keeps that summary to the one line the format
 * allows.
 *
 * @param text - the notice text.
 * @returns a user-role message attributed to this plugin.
 */
function notice(text: string): UserMessage {
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: { kind: 'plugin:feature-loop', form: 'notice', summary: boundContextSummary(text) },
  })
}

/**
 * What one agent's policies need to run.
 *
 * Held per agent because a review budget and a spend ceiling are properties of
 * a run, not of the plugin: sharing one `LoopBudget` across agents would let one
 * agent's spend stop another's loop.
 */
export interface FeatureLoopPolicy {
  /** The spec, when the deployment configured one. */
  spec: LoopSpec | undefined
  budget: LoopBudget | undefined
  /**
   * Session-log cursor: the first seq this policy has not yet priced into
   * `budget`.
   *
   * Both hook paths (`agent/pre-step` and `agent/request`) drain settled
   * attempts, and they routinely observe the same committed
   * `assistant/message`; the cursor is what makes `spend()` happen exactly
   * once per settled attempt instead of twice. `undefined` means "not opened
   * yet": the first drain opens it at the log's current length, so the budget
   * is a property of *this run* — a session resumed mid-conversation does not
   * open already "spent" by the turns that happened before the plugin was
   * watching.
   */
  pricedThroughSeq: number | undefined
  ladder: ModelLadder | undefined
  router: AttentionRouter
  gate: ReviewGate | undefined
  judge: Judge
  /** The explainer that authors review briefs for dashboard asks. */
  explainer: Explainer
  /** The step history the detectors read. */
  /**
   * The detectors' output sink. Carried from {@link CreatePolicyOptions.onSignals}
   * so `reviewStep` — which takes only the policy — can reach it. See that field
   * for why it exists at all.
   */
  onSignals?: (signals: readonly ReviewSignal[], step: number) => void
  history: StepObservation[]
  /**
   * The tool call observed since the last step boundary, not yet committed to
   * `history`.
   *
   * A tool call is observed at `tools/pre-execute` — where its name and
   * arguments are finally known — but it belongs to the step that is *currently*
   * running. The detectors read completed steps, so it is held here and
   * committed at the next step boundary. Without this the history stays empty
   * and every detector silently reads nothing, which is exactly the defect the
   * old fork had with `error-cascade`.
   */
  pending: { tool: string, argsKey: string, error: boolean } | undefined
  /** The last step's judgement, reused by the gate. */
  lastConfidence: number | undefined
  /**
   * How a gate-raised review is expressed at the tool boundary.
   *
   * `ask` hands the decision to the deployment's approval channel — in the Web
   * UI, the conversation composer prompt from
   * `@deepseek-ai/dsh-client-ui-approval`. `deny` refuses outright and never
   * prompts, which is the right stance for an unattended or CI run.
   *
   * `ask` is the default because it *degrades to exactly `deny`* when no
   * approval service is mounted and when the outcome is `unavailable`, so it is
   * strictly more capable without being less safe. See `serviceAsk` in
   * `@deepseek-ai/dsh-tools`.
   */
  gateMode: GateMode
  /**
   * The 0→1 pipeline's position and per-phase budget, when one is configured.
   *
   * Separate from `budget` on purpose. `budget` answers "can the run afford
   * another step"; this answers "can *this phase*". A run whose research phase
   * spent the implementation budget passes the run-level check at every single
   * step, because the run total only ever goes up — which is why the two are
   * kept apart rather than folded into one number.
   *
   * Absent means the pipeline is off and the plugin behaves exactly as it did
   * before this existed: a bounded loop with no phases.
   */
  pipeline?: PipelineRuntime
  /**
   * The absolute directory an unattended run may write to.
   *
   * Set by the sandbox when the pipeline starts; `undefined` under `auto` means
   * the envelope denies every write, because containment with nothing to contain
   * against is not containment. Present on the policy rather than in the
   * pipeline runtime so the envelope can be asked about a write even on a
   * deployment that has a YOLO gate and no phase machine yet.
   */
  worktreeRoot?: string
  /**
   * What the user asked for, read once from the session's first user message.
   *
   * Kept on the policy because it is needed by two callers that are far apart —
   * the phase notice and the commit subject — and re-reading the transcript in
   * both is the kind of duplication that drifts.
   */
  taskGoal?: string
  /**
   * The phase whose instructions have already been delivered.
   *
   * Without it the notice is recomputed every step and the model re-reads the
   * same block on every step, or — the version this replaces — it is sent only
   * on step 1 and a mid-turn transition is never announced at all.
   */
  noticedPhase?: string
}

/**
 * One run's place in the pipeline, and the ceilings that bound it.
 *
 * Held on the policy the way `budget` and `history` are — one per agent — so a
 * policy object is still the whole of "what this loop is allowed to do".
 */
export interface PipelineRuntime {
  /** The state machine. `transition()` is the only thing that moves it. */
  run: PipelineRun
  /** Per-phase ceilings carved out of the run budget. */
  budget: PhaseAllocator
  /**
   * The run's worktree, when one was created.
   *
   * `undefined` under a supervised run — nothing is confined because nothing
   * needs to be. Under YOLO it is the containment root the envelope compares
   * every write against, and its absence is what makes every write deny.
   */
  worktree?: Sandbox
  /**
   * The project's test command, as configured.
   *
   * Read by the envelope as the single shell command YOLO may execute. It is
   * configuration rather than policy precisely so the operator — who knows what
   * their suite is — decides, and the model cannot widen it.
   */
  verifyCommand?: string
  /**
   * A stamp of the last continuation queued for this run.
   *
   * The seam that keeps a turn alive has no ceiling of its own, so without this
   * a model that summarises immediately after being continued would be queued
   * again and the run would never end.
   */
  continuedTurn?: string
}

/**
 * One call's arguments as a stable key.
 *
 * Kept local and minimal: the plugin must not import `canonicalArgs` from a
 * module that drags `node:child_process` and `node:fs` into a plugin's graph.
 *
 * @param args - the parsed arguments, when they parsed.
 * @returns a stable key, or the empty string.
 */
function argsKey(args: unknown): string {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) return ''
  const record = args as Record<string, unknown>
  try {
    const sorted = Object.fromEntries(Object.keys(record).sort().map(k => [k, record[k]]))
    return JSON.stringify(sorted)
  } catch {
    return ''
  }
}

/**
 * The feed's key for one agent.
 *
 * A structural read, not `agent.id` typed: `Agent` always *claims* an `id`,
 * but fake agents in tests may not carry one, and `String(undefined)` as a
 * run label would be worse than the honest `agentless`.
 *
 * @param agent - the agent a hook was invoked for, when there is one.
 * @returns the agent id, or `agentless`.
 */
function runIdOf(agent: Agent | undefined): string {
  const id = agent === undefined ? undefined : (agent as { readonly id?: unknown }).id
  return typeof id === 'string' && id !== '' ? id : 'agentless'
}

/**
 * The dashboard URL for the published config, read lazily.
 *
 * The handle's `url` is empty until the socket is bound, and the remote row
 * may ask before that resolves — so this reads it per call rather than
 * snapshotting it once at publish time.
 *
 * @param dashboard - the started dashboard handle.
 * @returns the config fragment carrying the URL and token.
 */
function dashboardURLOnceBound(dashboard: DashboardHandle): Record<string, unknown> {
  const url = dashboard.url
  return url === '' ? {} : { dashboardURL: `${url}?token=${dashboard.token}` }
}

/**
 * Absolute workspace cwd from a live agent session header.
 * Structural read: `Agent` type only guarantees `id`; ReactLoopAgent also
 * carries `session.header.cwd`. Tests/fakes without a session stay ungrouped.
 */
function sessionCwdOf(agent: Agent | undefined): string | undefined {
  if (agent === undefined) return undefined
  const session = (agent as { readonly session?: { readonly header?: { readonly cwd?: unknown } } }).session
  const cwd = session?.header?.cwd
  if (typeof cwd !== 'string' || cwd === '') return undefined
  // Absolute POSIX or Windows drive path — reject relative junk.
  if (cwd.startsWith('/') || /^[A-Za-z]:[\\/]/.test(cwd)) return cwd
  return undefined
}

/** Project session/workspace meta onto the dashboard run row. */
function recordAgentMeta(state: DashboardState, agent: Agent | undefined): string {
  const runId = runIdOf(agent)
  const cwd = sessionCwdOf(agent)
  state.recordMeta(runId, {
    ...runId === 'agentless' ? {} : { sessionId: runId },
    ...cwd === undefined ? {} : { cwd },
  })
  return runId
}

/**
 * How a gate-raised review is expressed at the tool boundary.
 *
 * - `ask`  — hand the decision to the approval channel (Web UI prompt). Fails
 *            closed to a refusal when no channel is mounted.
 * - `deny` — refuse outright, never prompting. For unattended and CI runs.
 * - `auto` — YOLO: the three-way verdict collapses to allow/deny and the
 *            decision moves to `yolo.ts`'s envelope, which has no `ask` at all.
 *            Requires `worktreeRoot`, because containment with nothing to
 *            contain against is not containment — without it every write denies.
 */
export type GateMode = 'ask' | 'deny' | 'auto'

/**
 * What a deployment may configure for the optimization half.
 *
 * Present only to carry `index.ts`'s parsed `optimize:` block through to
 * `apply`: the plugin's loops stop at iteration (`--loops`-style multi-pass
 * is the CLI's `runRefined`, not a hook waterfall), so `loops` and
 * `totalBudgetUSD` are validated at load and then deliberately *read nowhere
 * here* — a config key that silently did nothing would be worse than one that
 * fails, but a config key that ran loops from inside a hook waterfall would
 * be a timeout and a doubled review budget wearing a feature hat. The shape
 * stays so the day loops genuinely belong in the plugin there is a field to
 * put them in, and so the validator can name every key it accepts.
 */
export interface OptimizePolicyOptions {
  /**
   * Refinement passes granted to this plugin's loops. Validated at load;
   * intentionally not consumed by any hook.
   */
  loops?: number
  /**
   * Derive envelopes from run history before running. Validated at load and
   * **read by nothing** — a documented no-op. It was documented as one of the
   * two keys that "drive the run-history recording", and the other one
   * (`history`) does all of that on its own.
   */
  derive?: boolean
  /** Run-history file the envelope and metrics are derived from. */
  history?: string
  /** Judge backend for cross-pass scoring. Validated at load; read by nothing. */
  judge?: 'none' | 'chat' | 'laya'
  /** Dollars a refinement may spend. Validated at load; intentionally not consumed by any hook. */
  totalBudgetUSD?: number
}

/**
 * What a deployment may configure when building its policies.
 *
 * Every field is optional: omitting all of them yields a policy set with no
 * ceilings and no detectors, which is the harness's own behaviour.
 */
export interface CreatePolicyOptions {
  /** The eight-dimension loop spec. Supplying it enables the policies. */
  spec?: LoopSpec
  /** The judge to score review-worthiness with. Defaults to `NO_JUDGE`. */
  judge?: Judge
  /**
   * The explainer that authors review briefs for dashboard asks. Defaults to
   * `NO_EXPLAINER` — no model call, no brief, today's behaviour exactly.
   */
  explainer?: Explainer
  /** Confidence bar for `auto-if-confident` gate policies. */
  confidenceThreshold?: number
  /** Per-tool gate policy overrides, by tool name. */
  gatePolicies?: Record<string, GatePolicy>
  /** Attention-router overrides: review budget and judge threshold. */
  router?: ConstructorParameters<typeof AttentionRouter>[0]
  /**
   * Called with the detectors' output for every step. NOT for deployments — it
   * exists because `error-cascade` (one of only two CRITICAL signals) had no
   * reachable test: the signals live inside `prepareReview`'s return value and
   * the dashboard state is internal, so the only test of it called
   * `noteToolOutcomes` directly and proved nothing about the plugin path (§1r).
   * An assertion that cannot see the value it names is the §1n shape.
   */
  onSignals?: (signals: readonly ReviewSignal[], step: number) => void
  /**
   * How a review is expressed at the tool boundary. Defaults to `ask` so a
   * human can approve it in the Web UI; set `deny` for unattended runs.
   */
  gateMode?: GateMode
  /**
   * The optimization block. Validated at load by `index.ts`; see
   * {@link OptimizePolicyOptions} for why `loops` is carried but not consumed.
   */
  optimize?: OptimizePolicyOptions
  /**
   * The 0→1 pipeline block. Ignored unless `enabled` — a deployment that adds
   * the block to its patch row before deciding on ceilings gets today's
   * behaviour, not a five-phase run it did not ask for.
   *
   * Requires a `spec`: the pipeline carves the run budget into phase budgets,
   * and with no run budget there is nothing to carve. Silently ignoring the
   * block here would produce a plugin that loaded, appeared in the boot graph,
   * and ran no phases — the inert-install failure this repo has already been
   * bitten by once.
   */
  pipeline?: PipelineConfig & { enabled?: boolean }
  /**
   * The sandbox a YOLO run is confined to.
   *
   * Supplied by the caller — a CLI, a command, or the dashboard's Start button —
   * rather than built here, because creating a worktree is a filesystem side
   * effect and `createPolicy` is a constructor the test suite calls dozens of
   * times. `createSandbox` refuses outright outside a git repository, so the
   * two belong together but not in the same function.
   */
  worktree?: Sandbox
}

/**
 * Build the policy set one agent's loop will consult.
 *
 * A spec is optional. With none configured every ceiling is absent and the loop
 * behaves as upstream does — which is what keeps this deployment comparable
 * against a plain harness.
 *
 * @param options - the configured spec, judge and gate overrides.
 * @returns the policies, ready to attach to an agent.
 */
export function createPolicy(options: CreatePolicyOptions): FeatureLoopPolicy {
  const spec = options.spec === undefined ? undefined : validateSpec(options.spec)
  const budget = spec === undefined
    ? undefined
    : new LoopBudget({
      maxSteps: spec.maxSteps,
      costBudgetUSD: spec.costBudgetUSD,
      prices: spec.prices,
      unpricedFallback: spec.unpricedFallback,
    })
  const ladder = spec === undefined ? undefined : new ModelLadder(spec.controller)
  const router = new AttentionRouter(options.router ?? {})
  const gate = spec === undefined
    ? undefined
    : new ReviewGate(
      options.gatePolicies ?? {},
      undefined,
      options.confidenceThreshold,
    )
  // The pipeline needs a run budget to carve phase budgets out of. With no
  // spec it is not built, and `apply()` refuses the combination at load — see
  // `parsePipelineConfig`'s caller — so this branch is the only way a
  // half-configured pipeline can exist, and it degrades to "no pipeline".
  const pipeline = spec === undefined || options.pipeline?.enabled !== true
    ? undefined
    : buildPipelineRuntime(spec, options.pipeline, options)
  return {
    spec,
    budget,
    pricedThroughSeq: undefined,
    ladder,
    router,
    gate,
    gateMode: options.gateMode ?? 'ask',
    judge: options.judge ?? NO_JUDGE,
    explainer: options.explainer ?? NO_EXPLAINER,
    history: [],
    ...options.onSignals === undefined ? {} : { onSignals: options.onSignals },
    pending: undefined,
    lastConfidence: undefined,
    pipeline,
    // Published at the top level as well as on the runtime, because the
    // envelope is asked about tool calls — which can happen on a deployment
    // that has a YOLO gate and no phase machine yet.
    worktreeRoot: options.worktree?.worktreeRoot,
  }
}

/**
 * Build the phase budget and the state machine for one run.
 *
 * @param spec - the configured loop spec, which carries the run ceilings.
 * @param config - the validated `pipeline:` block.
 * @returns the runtime the policy holds.
 * @throws Error when the block names a phase the pipeline does not have — a
 *   typo here would otherwise be a ceiling that is never consulted, which is the
 *   same class of defect as the spend metering gap this package once had.
 */
function buildPipelineRuntime(
  spec: LoopSpec,
  config: PipelineConfig & { enabled?: boolean },
  options: CreatePolicyOptions,
): PipelineRuntime {
  const perPhase = config.phaseMaxSpendUSD ?? {}
  for (const key of Object.keys(perPhase)) {
    if (!PIPELINE_PHASE_NAMES.includes(key as (typeof PIPELINE_PHASE_NAMES)[number])) {
      throw new Error(
        `dsh-feature-loop: pipeline.phaseMaxSpendUSD names "${key}", which is not a phase. `
        + `Expected one of ${PIPELINE_PHASE_NAMES.join(', ')}.`,
      )
    }
  }
  const run = startPipeline()
  const budget = new PhaseAllocator({
    runBudgetUSD: spec.costBudgetUSD,
    runMaxSteps: spec.maxSteps,
    maxSteps: config.phaseMaxSteps as Partial<Record<PipelinePhase, number>> | undefined,
    phaseTimeoutMs: config.phaseTimeoutMs,
    timeoutMs: config.timeoutMs,
  })
  // The run starts at `research`, so the first phase's clock starts now rather
  // than at the first step — a pipeline that sat idle for a minute must not
  // spend a minute of the research phase's wall clock.
  budget.enterPhase(run.state as PipelinePhase)
  return { run, budget, worktree: options.worktree, ...(config.testCommand === undefined ? {} : { verifyCommand: config.testCommand }) }
}

/**
 * Consult the ceilings, the detectors, the judge and the gate for one step.
 *
 * @param policy - the agent's policies.
 * @param step - the 1-based step about to be proposed.
 * @returns the decision, the notices to deliver with it, and — surfaced for
 * `apply`'s dashboard feed — the signals, the judge score and the budget
 * snapshot this call already computed. The dashboard must not re-run the
 * detectors for them, and must certainly not re-ask the judge.
 */
export async function reviewStep(
  policy: FeatureLoopPolicy,
  step: number,
): Promise<{
  decision: PreStepDecision
  notices: string[]
  signals: ReviewSignal[]
  judgeScore: number | undefined
  budget: BudgetSnapshot | undefined
}> {
  const notices: string[] = []
  // The escalation notice goes out on THIS channel, not on `agent/request`:
  // that hook returns an `LlmCallConfig` ({provider, model}) and has no
  // `messages` for a caller to splice, so a notice appended there is silently
  // dropped. `escalationForStep` existed and was exported for exactly this and
  // had no caller — a DSH deployment moved rungs without the model ever being
  // told, so the dashboard showed ROUTE changing while the transcript showed
  // nothing.
  const escalation = escalationForStep(policy, step, undefined)
  if (escalation !== undefined) notices.push(escalation)

  // Commit the previous step's observed tool call before the detectors run, so
  // they read a complete history. A step that ran no tool still gets an
  // observation: "a step that did nothing" is itself a signal worth detecting,
  // and skipping it would let a silent spin loop look like a healthy one.
  if (step > 1) {
    const pending = policy.pending
    const failed = pending?.error ?? false
    policy.history.push({
      index: step - 1,
      // The phase as it was WHEN the step ran. Phase changes happen at a step
      // boundary, after this push, so this is never off by one.
      ...(policy.pipeline === undefined ? {} : { phase: policy.pipeline.run.state }),
      tool: pending?.tool,
      argsKey: pending?.argsKey,
      costUSD: 0,
      error: failed,
    })
    policy.pending = undefined
    policy.router.observeStep()
    // The ladder's failure signal, from the step that just ended. The plugin
    // path had none: `recordFailure` had no caller outside the runner's own
    // test, so a DSH deployment could only ever climb on `stepsPerRung` — a run
    // that failed fast and early stayed on the cheap model for the whole task.
    // Same reading as the runner: a step with no tool call is a step that
    // happened, not one that broke.
    if (policy.ladder !== undefined) {
      if (failed) policy.ladder.recordFailure()
      else policy.ladder.recordSuccess()
    }
  }

  // The snapshot is taken before the stop check so a ceiling stop still
  // reports where the run stood when it was cut — the dashboard's most
  // interesting frame is the one at the moment of stopping.
  const snapshot = policy.budget?.snapshot()
  const verdict = policy.budget?.verdict(step)

  // A ceiling is the one thing that stops the run rather than annotating it:
  // continuing would spend money the deployment already said it would not.
  if (verdict?.kind === 'stop') {
    return {
      decision: { kind: 'reject', reason: verdict.reason } as PreStepDecision,
      notices: [budgetStopText(verdict.reason)],
      signals: [],
      judgeScore: undefined,
      budget: snapshot,
    }
  }
  if (verdict?.kind === 'warn') notices.push(budgetWarnText(verdict.reason))

  const preparation = prepareReview({
    history: policy.history,
    maxSteps: policy.spec?.maxSteps ?? Number.MAX_SAFE_INTEGER,
    costBudgetUSD: policy.spec?.costBudgetUSD ?? Number.MAX_SAFE_INTEGER,
    spentUSD: snapshot?.spentUSD ?? 0,
    budgetRemaining: policy.router.budgetRemaining(),
  })

  policy.onSignals?.(preparation.signals, step)

  // The judge answers about the *previous* step, because the current one has
  // not happened yet. An absent answer is not evidence of confidence, so it is
  // passed through as `undefined` and the gate asks rather than proceeds.
  policy.lastConfidence = undefined
  if (preparation.askJudge) {
    const question = judgeQuestion(preparation.judgeState, preparation.signals)
    const answer = await policy.judge.score(question.state, question.questions)
    policy.lastConfidence = answer.score
  }

  // The review checkpoint is checked before the router's own verdict, so a
  // run that was told to pause does pause even on a step nothing else would
  // have questioned. It is not a safety signal, so it does not outrank a
  // critical one — it only adds a pause where there would not have been one.
  const checkpoint = policy.router.checkpoint(step)
  const routed = checkpoint ?? policy.router.route(preparation.signals, undefined, policy.lastConfidence)
  if (routed.review) notices.push(reviewText(routed.reason, routed.source))

  return {
    decision: { kind: 'enter', messages: notices.map(notice) },
    notices,
    signals: preparation.signals,
    judgeScore: policy.lastConfidence,
    budget: snapshot,
  }
}

/**
 * The ladder's route for one step, as an LLM call override.
 *
 * @param policy - the agent's policies.
 * @param step - the 1-based step.
 * @param lastStepUSD - what the previous step cost, for the cost-based rung.
 * @returns the route override, or `undefined` when no ladder is configured.
 */
export function routeForStep(
  policy: FeatureLoopPolicy,
  step: number,
  lastStepUSD: number | undefined,
): Partial<LlmCallConfig> | undefined {
  if (policy.ladder === undefined) return undefined
  const decision = policy.ladder.forStep(step, lastStepUSD)
  return { provider: decision.route.provider, model: decision.route.model }
}

/**
 * Announce an escalation, if the ladder moved the route this step.
 *
 * @param policy - the agent's policies.
 * @param step - the 1-based step.
 * @param lastStepUSD - what the previous step cost.
 * @returns the notice text, or `undefined` when the route did not change.
 */
export function escalationForStep(
  policy: FeatureLoopPolicy,
  step: number,
  lastStepUSD: number | undefined,
): string | undefined {
  if (policy.ladder === undefined) return undefined
  const decision = policy.ladder.forStep(step, lastStepUSD)
  // The ladder only ever moves up, so a non-initial rung is an escalation and
  // `reason.from` names the rung it left.
  return decision.reason.kind === 'initial'
    ? undefined
    : escalationText(decision.reason.from, routeLabel(decision.route), decision.reason.kind)
}

/**
 * Ask the gate about one tool call at the tool boundary.
 *
 * This is where the tool name is finally known, so a gate-raised review can be
 * decided *before* the call is dispatched rather than one step after it.
 *
 * @param policy - the agent's policies.
 * @param toolName - the tool about to run.
 * @returns the review decision: proceed, prompt a human, or refuse.
 */
/**
 * The thing this call is about, in a form a human can act on.
 *
 * Measured 2026-10-03 on a three-file task: five asks arrived, three of them
 * `write`, and every card said the same thing — "write: irreversible is always
 * approved by a human". A person cannot tell ask 3 from ask 4 without reading
 * the run, and a gate whose cards are indistinguishable trains the click that
 * makes it worthless.
 *
 * `tools/pre-execute` already receives the PARSED ARGUMENTS (this file stores
 * their key for the step record two lines above), so the fact was in hand and
 * discarded. Only path-like string values are used: a review prompt should
 * never quote a file's contents back at the human who is deciding whether to
 * write them.
 *
 * Returns '' when nothing names the call — the previous behaviour, unchanged.
 *
 * @param toolName - the tool about to run.
 * @param args - its parsed arguments.
 * @returns ` — <subject>` or an empty string.
 */
function subjectOf(toolName: string, args: unknown): string {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) return ''
  const record = args as Record<string, unknown>
  const path = record['file_path'] ?? record['path'] ?? record['filePath']
  const subject = typeof path === 'string' && path !== ''
    ? path
    // `bash` names its work in the command, and a truncated one is still enough
    // to tell ask 1 from ask 5.
    : typeof record['command'] === 'string' && record['command'] !== ''
      ? record['command'].slice(0, 80)
      : undefined
  // The subject must be checkable by the eye: a newline would break the card
  // into two paragraphs, and a very long path is not what was being asked.
  if (subject === undefined || /[\n\r]/.test(subject) || subject.length > 120) return ''
  return ` — ${toolName} ${subject}`
}

export function gateForTool(
  policy: FeatureLoopPolicy,
  toolName: string,
  args: unknown,
): GateVerdict {
  // YOLO short-circuits the gate entirely, and it does so *before* the
  // reversibility lookup: under `auto` there is nothing to ask a human about,
  // so the question is not "which class is this tool" but "is this call inside
  // the envelope at all". `gateEnforce` answers that with the arguments in hand.
  if (policy.gateMode === 'auto') return { kind: 'proceed' }
  if (policy.gate === undefined) return { kind: 'proceed' }
  const reversibility = resolveReversibility(toolName, policy.spec?.actuator)
  const decision = policy.gate.check(toolName, reversibility, policy.lastConfidence)
  if (!decision.review) return { kind: 'proceed' }
  const reason = reviewText(`${decision.reason}${subjectOf(toolName, args)}`, decision.source)
  // The mode decides *how* the human is asked, never *whether* the call is
  // questioned: both branches stop the call, and `ask` still fails closed if no
  // approval channel answers.
  if (policy.gateMode === 'deny') return { kind: 'deny', reason }

  // `ask` with nobody to ask, refused HERE rather than by the harness.
  //
  // The harness's own fail-closed is correct and its message is
  //   tool "write" requires approval, but no approval channel is available
  // which a run reports as "the sandbox denied it" — the model is told the
  // filesystem objected, which is a different fact and sends it looking for a
  // narrower tool. Measured 2026-10-03 on a headless profile: the model spent
  // its remaining budget reasoning about whether Bash was a legitimate
  // alternative and then produced no work.
  //
  // This plugin can see the answerer directly: the dashboard registers a
  // watcher when a page opens or polls /api/state (approvals.ts), and
  // `ask` with no watcher cannot be answered by anything — not the harness, not
  // the composer, not the standalone page. So the refusal is ours, it carries
  // the reason a human would give, and it costs nothing when a page IS open:
  // the watcher is a TTL-kept fact, not a prediction.
  if (!someoneCanAnswer()) {
    return {
      kind: 'deny',
      reason: `${reason} — nobody is watching: this run has no open dashboard or `
        + 'composer, so no human can answer an approval. Open the Feature Loop page '
        + `or set gateMode: deny to refuse up front.`,
    }
  }
  return { kind: 'ask', reason }
}

/**
 * Whether the operator has armed the kill switch.
 *
 * The sentinel is a file, checked per call rather than held in memory, for two
 * reasons. It works across processes — the dashboard's Stop button and a human's
 * `touch` are the same action, with no IPC to go wrong. And it is checked on
 * every tool call rather than on a timer, so a stop lands within one call rather
 * than one poll interval, which is the difference between the seconds App B #75
 * asks for and the minutes a cached flag would give.
 *
 * It lives inside the run's worktree because YOLO requires one — a run with no
 * worktree has no writes to stop anyway, so `undefined` correctly answers false
 * rather than inventing a root.
 *
 * @param policy - the agent's policies.
 * @returns true when the sentinel exists in the run's worktree.
 */
function stopArmed(policy: FeatureLoopPolicy): boolean {
  const root = policy.worktreeRoot
  if (root === undefined) return false
  try {
    return existsSync(join(root, STOP_SENTINEL))
  } catch {
    // An unreadable workspace denies nothing by itself — the envelope is the
    // boundary, and a stat failure here would turn a filesystem quirk into a
    // silent halt.
    return false
  }
}

/** The sentinel's path, relative to a workspace root. */
const STOP_SENTINEL = '.feature-loop/STOP'

/**
 * Whether any channel in this deployment could actually answer an `ask`.
 *
 * §1be's watcher test proved the OPPOSITE of what its fixtures claimed. The
 * dashboard heartbeat (`noteWatcher`) says a Feature Loop page is polling; it
 * says nothing about the HARNESS's own answerer, which is the composer panel
 * that `@deepseek-ai/dsh-client-ui-approval` registers on `approval/request`
 * and which never touches `/api/state` — so a TTY operator who is reading the
 * composer was recorded as "nobody is watching", and their `ask` was denied up
 * front with a sentence telling them to open a page they did not need.
 *
 * The refusal was therefore not only wrong for the model (§1bb): it was wrong
 * for the person. The plugin cannot know who is at the keyboard, so it asks the
 * two things it CAN see and treats either as sufficient:
 *
 *  1. a Feature Loop page polling (`watcherActive`), and
 *  2. a live UI client stream on the gateway (`hasLiveClient`), which is what
 *     carries the composer panel's `approval/request` consumer. Absent gateway,
 *     absent answer — an assumption, and the fail-closed one.
 *
 * The registry's own claim guard (§1be) is unchanged: the dashboard still only
 * claims an ask when a page is watching, so an unwatched ask falls through to
 * the composer. That is the delegation this check must not overrule.
 */
let liveClientProbe: () => boolean = () => false

/** Install the gateway's client-stream predicate. Not exported: `apply` owns it. */
function setLiveClientProbe(probe: () => boolean): void {
  liveClientProbe = probe
}

function someoneCanAnswer(): boolean {
  return watcherActive() || liveClientProbe()
}

/**
 * The gate's verdict for one tool call.
 *
 * `proceed` dispatches, `ask` routes to the deployment's approval channel, and
 * `deny` refuses without prompting.
 */
export type GateVerdict =
  | { kind: 'proceed' }
  | { kind: 'ask', reason: string }
  | { kind: 'deny', reason: string }

/**
 * The YOLO verdict for one tool call, with its arguments in hand.
 *
 * A separate entry point from {@link gateForTool} because the envelope needs the
 * parsed arguments — the command line, the target path — and the gate's
 * reversibility lookup deliberately does not, so folding the two would either
 * pass arguments the gate ignores or make the supervised path carry a shape it
 * has no use for.
 *
 * Under any other `gateMode` this defers to the gate unchanged, so a deployment
 * that flips `auto` back to `ask` gets the old behaviour with no residue.
 *
 * @param policy - the agent's policies.
 * @param toolName - the tool about to run.
 * @param args - the call's parsed arguments.
 * @param stopArmed - whether the operator's stop sentinel is set.
 * @returns proceed or deny. Never `ask` — that is what YOLO means.
 */
export function gateEnforce(
  policy: FeatureLoopPolicy,
  toolName: string,
  args: unknown,
  stopArmed: boolean,
): GateVerdict {
  if (policy.gateMode !== 'auto') return gateForTool(policy, toolName, args)
  if (stopArmed) {
    // Checked at the tool boundary, not only at the step boundary, so a stop
    // lands before the next *call* rather than at the start of the next step —
    // the difference between a loop that stops mid-minute and one that stops
    // mid-hour.
    return { kind: 'deny', reason: `YOLO STOPPED — ${killText(policy.pipeline?.run.state ?? 'unknown')}` }
  }
  const decision = envelope({
    tool: toolName,
    args,
    worktreeRoot: policy.worktreeRoot,
    ...(policy.pipeline?.verifyCommand === undefined ? {} : { verifyCommand: policy.pipeline.verifyCommand }),
  })
  return decision.kind === 'deny'
    ? { kind: 'deny', reason: denyReason(toolName, decision.reason, policy) }
    : { kind: 'proceed' }
}

/**
 * The reason a YOLO denial is reported, on stderr as well as to the model.
 *
 * A denial under `auto` is invisible by construction: there is no approval card,
 * no dashboard watcher, and the harness's own feed may be off. A live run showed
 * what that costs — a run blocked one step in, with a correct-looking history
 * record, and nothing anywhere saying a single tool call had been refused. The
 * operator's first question is always "what was it trying to do", and answering
 * it should not require reproducing the run with a dashboard attached.
 *
 * One line per denial to stderr, which is where an unattended run's output
 * already goes. Deliberately not `console.log`: this runs inside a host process
 * that owns stdout.
 *
 * @param toolName - the tool that was refused.
 * @param reason - the envelope's reason.
 * @param policy - the run's policies, for the containment root.
 * @returns the reason handed to the model.
 */
function denyReason(toolName: string, reason: string, policy: FeatureLoopPolicy): string {
  const root = policy.worktreeRoot ?? '<none — every write and every shell command is denied>'
  process.stderr.write(`dsh-feature-loop: YOLO denied ${toolName} — ${reason} (root: ${root})\n`)
  return `YOLO ENVELOPE — ${reason}`
}

/**
 * Give a YOLO run the directory its writes are confined to.
 *
 * Only `gateMode: 'auto'` runs need one. A supervised run is already contained by
 * the harness's own file policy and gains nothing here.
 *
 * Rooted at the directory the agent ACTUALLY operates in — the session's cwd.
 * This used to create a git worktree and make that the root; a live run showed it
 * to be theatre. The worktree was created beside the session, but the session's
 * cwd never changed, so the agent kept reading and writing the original checkout
 * while the envelope compared every path against the worktree. Every write
 * denied, the run blocked after one step, and the worktree held nothing the agent
 * had ever looked at. A worktree the agent never entered is worse than none — a
 * branch, a directory and a false impression of isolation for no containment.
 * Relocating a session mid-run is the host's decision, so the honest root today is
 * where the agent really works. `createSandbox` stays available for a caller that
 * starts a session INSIDE a worktree: then the cwd is the worktree and this
 * resolves to the same answer with no special case.
 *
 * Idempotent, because `policyFor` can be reached more than once for the same
 * agent, and a second attempt must not replace a root a write has already been
 * judged against.
 *
 * @param policy - the run's policy, mutated in place.
 * @param agent - the agent whose session carries the workspace path.
 * @param options - the deployment config, for the gate mode.
 */
function attachContainment(policy: FeatureLoopPolicy, agent: Agent, options: { gateMode?: GateMode }): void {
  if (policy.gateMode !== 'auto') return
  if (policy.worktreeRoot !== undefined) return
  // The session header is the authoritative cwd, and when it carries one this is
  // exact. It does not always: a headless run created before the first turn has
  // no header yet, and the header's shape has moved between harness releases.
  //
  // Falling back to the PROCESS cwd is what a plugin can honestly offer here —
  // the harness starts the process in the session's directory, and it is the same
  // directory every tool call resolves against. Returning early instead left
  // `worktreeRoot` undefined, which the envelope reads as "deny every write and
  // every shell command" — and a YOLO run that denied its first tool call simply
  // ended, `blocked`, one step in, with nothing in the log to explain it.
  if (policy.taskGoal === undefined) policy.taskGoal = userGoalOf(agent)
  const root = sessionCwdOf(agent) ?? process.cwd()
  if (root.length === 0) return
  policy.worktreeRoot = root
  if (policy.pipeline !== undefined && policy.pipeline.worktree === undefined) {
    // Recorded so the report can name the directory a run was confined to. The
    // branch is empty because none was created here — claiming one would be the
    // same theatre the worktree version was.
    // A REAL branch name, not an empty one. `attachContainment` roots the run at
    // the session's own directory rather than a worktree beside it, but the branch
    // is still needed: ship pushes it, and an empty ref made `git push -u origin ''`
    // fail, which is why a run that completed all five phases reported "NO PR WAS
    // OPENED" on work that was perfectly ready to be pushed.
    policy.pipeline.worktree = {
      worktreeRoot: root,
      branch: branchFor(policy.taskGoal ?? policy.spec?.goal ?? 'feature-loop run', String(policy.taskGoal ?? 'run').slice(0, 8)),
      stopSentinel: join(root, STOP_SENTINEL),
    }
  }
}

/**
 * Commit, push and open the pull request for a run that reached `ship`.
 *
 * Invoked by the machine on entering the phase, never by the model, so a run
 * cannot decide it has finished. Failures degrade rather than throw: a `gh`
 * that is not installed leaves the work committed and reported in the notice,
 * because a stopped run with its work on a branch is a success with a caveat,
 * and a crashed turn is neither.
 *
 * @param policy - the run's policies.
 * @returns one line for the feed, or `undefined` when there was no sandbox.
 */
function runPipelineShip(policy: FeatureLoopPolicy, agent: Agent): string | undefined {
  const pipeline = policy.pipeline
  const sandbox = pipeline?.worktree
  if (pipeline === undefined || sandbox === undefined) {
    process.stderr.write('dsh-feature-loop: ship skipped — the run has no sandbox to work in\n')
    return undefined
  }
  // Read once: the branch and the PR body must be named for the same goal.
  const goal = userGoalOf(agent) ?? policy.taskGoal ?? policy.spec?.goal ?? 'feature-loop run'
  // The branch is RE-derived here, not read off the sandbox. The sandbox captured
  // it at containment time, when the session log still held no user turn, so it
  // was seeded from the deployment's `spec.goal` and every run pushed
  // `fl/create-tmp-fl-headless-proof-txt-…`.
  //
  // One value, used for both the work and the report — an earlier version derived
  // the branch for `runShip` but logged `sandbox.branch`, so the line announced
  // one branch while the work landed on another. A report that names the wrong
  // ref is worse than no report: it reads as a fact.
  const branch = branchFor(goal, String(policy.taskGoal ?? 'run').slice(0, 8))
  const shipping = { ...sandbox, branch }
  try {
    const result = runShip({
      repoRoot: '',
      // The TASK, not the deployment's spec.goal, and the session log is read
      // FRESH here rather than reusing `policy.taskGoal`: that field was captured
      // at containment time, when the log still held no user turn, so it was
      // seeded from the spec and the branch came out as
      // `fl/create-tmp-fl-headless-proof-txt-…`. By ship time the log is fully
      // populated and the reader returns what the human actually typed.
      goal,
      runId: '',
      run: pipeline.run, budget: pipeline.budget,
      config: { runsDir: RUNS_DIR },
      runner: spawnSyncCommand,
      // The branch is RE-derived here, not read off the sandbox. The sandbox
      // captured it at containment time, when the session log still held no user
      // turn, so it was seeded from the deployment's `spec.goal` and every run
      // pushed `fl/create-tmp-fl-headless-proof-txt-…`. By ship time the log is
      // populated and the reader returns the task.
    }, shipping, [], 0)
    // Every ship attempt is announced. A run that reached `ship` and produced no
    // pull request looked identical to one that never tried, which is the same
    // silence that has cost hours three times now: denials, gate evaluations and
    // phase transitions all needed a stderr line before they could be debugged.
    process.stderr.write(`dsh-feature-loop: ship — branch=${branch} outcome=${result.outcome}: ${result.detail}\n`)
    return result.detail
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    process.stderr.write(`dsh-feature-loop: ship threw: ${reason}\n`)
    return `ship failed: ${reason}`
  }
}

/**
 * Keep the run going when the model tries to stop mid-pipeline.
 *
 * The loop asks `agent/turn-stopping` at the exact moment it is about to end a
 * turn, and breaks only if the inbox is still empty afterwards. That is a
 * documented seam for exactly this: a listener may put work in `next-step` and
 * the turn continues.
 *
 * Without it, a five-phase pipeline is really a two-phase one — a model that
 * summarises after the PRD ends the turn, and the phases after it never happen.
 * A live run measured that precisely: research → prd, then the turn ended with
 * the implement phase untouched.
 *
 * Three conditions, all of which must hold, because the alternative is a loop
 * that never stops:
 *
 * 1. A pipeline is running and its current phase still has budget — checked
 *    against the phase's own ceiling, so a ceiling always wins over continuity.
 * 2. The phase has not already been continued in this turn, so a model that
 *    immediately summarises again cannot spin.
 * 3. The pipeline has not reached a terminal state.
 *
 * @param agent - the agent whose turn is about to stop.
 * @param policy - the run's policies.
 * @returns whether work was queued.
 */
function continueIfMidPipeline(agent: Agent, policy: FeatureLoopPolicy): boolean {
  const pipeline = policy.pipeline
  if (pipeline === undefined) return false
  const state = pipeline.run.state
  if (!(PHASE_ORDER as readonly string[]).includes(state)) return false
  const phase = state as PipelinePhase
  if (pipeline.continuedTurn === turnStamp(policy)) return false

  const verdict = pipeline.budget.verdict(phase)
  if (verdict.kind === 'stop') return false

  const inbox = (agent as unknown as { readonly inbox?: SteerableInbox }).inbox
  if (inbox === undefined || typeof inbox.append !== 'function') return false
  const noticeText = continuationNotice(policy, phase)
  if (noticeText === undefined) return false
  // One continuation per run per turn: the stamp is the phase plus the step count,
  // so re-entering the SAME phase a moment later does not queue again, and
  // moving to a new phase does.
  pipeline.continuedTurn = `${String(pipeline.budget.usage(phase).steps)}:${String(phase)}`
  inbox.append('next-step', notice(noticeText))
  process.stderr.write(
    `dsh-feature-loop: ${phase} has budget left and the model stopped — continuing the turn\n`,
  )
  return true
}

/**
 * What to say when the run is continued mid-phase.
 *
 * NOT the phase rules again. A live run queued the same block four times and the
 * model never moved, because repeating instructions to someone who has already
 * read them is not feedback. What it needed was the one thing it could not see —
 * the gate's verdict — so that is what this leads with, followed by the rules for
 * the case where the rules were the problem.
 *
 * @param policy - the run's policies.
 * @param phase - the phase the run is in.
 * @returns the notice text, or `undefined` when there is no gate verdict to give.
 */
function continuationNotice(policy: FeatureLoopPolicy, phase: PipelinePhase): string | undefined {
  const sandbox = policy.pipeline?.worktree
  if (sandbox === undefined || policy.pipeline === undefined) return undefined
  let verdict: GateResult
  try {
    const options = {
      repoRoot: '', goal: '', runId: '',
      run: policy.pipeline.run,
      budget: policy.pipeline.budget,
      config: { ...(policy.pipeline.verifyCommand === undefined ? {} : { testCommand: policy.pipeline.verifyCommand }), runsDir: RUNS_DIR },
      runner: spawnSyncCommand,
    }
    verdict = gateCurrentPhase(options, sandbox)
  } catch (error) {
    return `0→1 PIPELINE — the ${phase} gate could not be checked: ${error instanceof Error ? error.message : String(error)}`
  }
  if (verdict.pass) {
    return `0→1 PIPELINE — the ${phase} gate now passes. The loop moves you on; do not stop here.`
  }
  return [
    `0→1 PIPELINE — you stopped, but the ${phase} phase is not finished.`,
    '',
    `Its gate is NOT satisfied: ${verdict.detail}`,
    '',
    'Finish that first, then continue. Do not summarise the run as done until the gate passes.',
    '',
    phaseNotice(phase) ?? '',
  ].join('\n')
}

/**
 * A cheap stamp for "has this run already been continued".
 *
 * @param policy - the run's policies.
 * @returns a string that changes when the pipeline moves on.
 */
function turnStamp(policy: FeatureLoopPolicy): string {
  const pipeline = policy.pipeline
  if (pipeline === undefined) return ''
  return `${String(pipeline.run.state)}:${String(pipeline.budget.usage(pipeline.run.state as PipelinePhase).steps)}`
}

/**
 * Run one command for a phase gate.
 *
 * The only shell-out on the agent path, and it is now a read-only probe: `git
 * status`, and the operator's configured test command. The argv is fixed here and
 * the command text comes from configuration, never from the model — and the
 * envelope still judges it, so widening this later is denied rather than
 * executed.
 *
 * @param command - the executable.
 * @param args - its arguments.
 * @param cwd - the directory to run in.
 * @returns the exit code and captured streams.
 */
/**
 * What the user actually asked for, in their own words.
 *
 * The spec's `goal` is the DEPLOYMENT's static goal — "create
 * /tmp/fl-headless-proof.txt containing hello" — not the task in front of the
 * run. A live run showed the model noticing the two disagreeing and reasoning
 * about the conflict, which is a fair thing for it to do and a sign that the
 * pipeline was pointing at the wrong goal.
 *
 * Read from the session's first user message rather than from anywhere the
 * plugin could be led: it is the one string in the system that is, by
 * construction, what the human typed.
 *
 * Measured against the live harness, because both plausible readings were wrong
 * and guessing cost three runs that researched the wrong thing entirely:
 *
 * - `session.header` carries only `{version, id, createdAt, cwd, isSeeded}` — no
 *   task.
 * - `session.snapshotEvents(0)` is NOT the whole log. Its window opens at the
 *   session's first live/lifecycle seq: on a fresh run it returns six events
 *   (`permission/preset`, `sandbox/mode`, `approval/policy`,
 *   `agent/inbox/spliced`, `turn/start`, `agent/inbox/spliced`) with no user turn
 *   among them. Read again mid-turn it returns the full log, user turn included.
 *
 * So the read happens where the log is populated — at notice time, not when the
 * policy is built — and the user turn's blocks live at `data.content`, not
 * `data.message.content`. The headless app also prepends its own name, so the
 * task arrives as "headless Say OK." and the launcher word is stripped.
 *
 * @param agent - the agent whose session carries the transcript.
 * @returns the task text, or `undefined` when the session exposes none.
 */
export function userGoalOf(agent: Agent): string | undefined {
  const session = (agent as unknown as { readonly session?: { readonly snapshotEvents?: (from: number) => readonly { type?: unknown; data?: unknown }[] } }).session
  if (session === undefined || typeof session.snapshotEvents !== 'function') return undefined
  let events: readonly { type?: unknown; data?: unknown }[]
  try {
    events = session.snapshotEvents(0)
  } catch {
    return undefined
  }
  for (const event of events) {
    if (event.type !== 'user/message') continue
    // The V4 log puts a user turn's blocks at `data.content`, NOT at
    // `data.message.content` — reading the nested form is why this always
    // returned undefined and every pipeline adopted the deployment's static
    // `spec.goal` instead. Both shapes are accepted because the nested one is
    // what an assistant-shaped event carries, and a wrong guess here is
    // invisible: the pipeline simply researches the wrong thing.
    const data = event.data as {
      readonly content?: readonly { type?: string; text?: string }[]
      readonly message?: { readonly content?: readonly { type?: string; text?: string }[] }
    } | undefined
    for (const block of data?.content ?? data?.message?.content ?? []) {
      const text = block?.text
      // The runtime-context and skill blocks are harness scaffolding; the first
      // block of prose is what the human wrote.
      if (block?.type !== 'text' || typeof text !== 'string') continue
      const trimmed = text.trim()
      if (trimmed.length === 0 || trimmed.startsWith('<')) continue
      // Harness scaffolding arrives as a user-role message too, and a live run
      // showed the pipeline adopting one of these as its goal. These four are the
      // blocks the harness injects; anything else in the first user turn is what
      // the human typed.
      if (trimmed.startsWith('Current runtime context')
        || trimmed.startsWith('The following workspace instructions')
        || trimmed.startsWith('The available skills')
        || trimmed.startsWith('You are an AI agent')
        || trimmed.includes('A skill is a reusable set of task-specific instructions')) continue
      // Two launchers to peel, in this order.
      //
      // The headless app prepends its own name: the task arrives as
      // "headless Say OK."
      //
      // Then the command name. `/product a CLI that converts Markdown tables to
      // CSV` reaches the turn with the leading `/product` still attached when
      // the composer submits it, and everything downstream names the work after
      // the goal: a live run through `/product` committed
      // `feat: /product a slugify(text) function that lowercases…`. The goal a
      // user typed is not "slash product a slugify".
      const withoutLauncher = trimmed
        .replace(/^(?:headless|web|tui|desktop|rescue)\s+/i, '')
        .replace(/^\/(?:loop|product|plan)\b\s*/i, '')
        .trim()
      // A command with nothing after it has no goal. Naming the run after the
      // command would put "/product" in a commit subject and a branch name, so it
      // falls through to the deployment's goal instead — the honest answer.
      if (withoutLauncher.length === 0 || withoutLauncher.startsWith('/')) continue
      return withoutLauncher.slice(0, 400)
    }
  }
  return undefined
}

function spawnSyncCommand(
  command: string,
  args: string[],
  cwd: string,
): { code: number; stdout: string; stderr: string } {
  // NO envelope check here, and that is deliberate rather than a loosening.
  //
  // The envelope exists to constrain what the MODEL reaches for, and it does
  // that at `tools/pre-execute`. This function is the other caller, and every
  // command it runs is one the plugin itself built: `git status --porcelain` from
  // the observer, `sh -c <pipeline.testCommand>` from the gate. No model text
  // reaches it — the command string comes from configuration.
  //
  // Judging it a second time bought nothing and cost the product its test phase.
  // A live run failed `exit 126 — refused by the envelope: sh -c npm test` three
  // times, bounced back to implement, and blocked — on a run whose tests already
  // passed. The comparison could not succeed: the envelope matches the configured
  // string `npm test`, and the invocation is `sh -c 'npm test'`, which no string
  // equality relates to the first.
  //
  // Two layers doing one job, with the wrong one in the wrong place, is how a
  // correct command ends up refused. The one that can be got wrong by a model is
  // `tools/pre-execute`; this is not.
  try {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
    })
    return {
      code: result.status ?? (result.error === undefined ? 0 : 127),
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? (result.error === undefined ? '' : result.error.message),
    }
  } catch (error) {
    return { code: 127, stdout: '', stderr: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * The phase block to deliver for this step, when the run has just entered one.
 *
 * Keyed on the step number rather than remembered, because a remembered "last
 * phase" is state that can drift from the machine. Here the machine is the only
 * source of truth, and the notice fires once per phase by construction: step 1
 * always re-reads the current phase, so a transition is picked up by the very
 * next turn regardless of where it happened.
 *
 * @param policy - the run's policies.
 * @param turn - the harness turn number.
 * @param step - the step about to run.
 * @returns the notice text, or `undefined` when no pipeline is configured.
 */
function phaseJustEntered(policy: FeatureLoopPolicy, turn: number, step: number, goal?: string): string | undefined {
  const pipeline = policy.pipeline
  if (pipeline === undefined) return undefined
  const state = pipeline.run.state
  if (!(PHASE_ORDER as readonly string[]).includes(state)) {
    return terminalNotice(state, 'The run stopped before this step.')
  }
  // Delivered when the phase CHANGES, not only on step 1. A transition happens
  // mid-turn, and a single-turn run never reaches the next step 1 — so keying on
  // the step number meant the PRD instructions were computed and never sent, and
  // the run sat in a phase the model had never been told about.
  const first = policy.noticedPhase === undefined
  const changed = policy.noticedPhase !== state
  if (!changed) return undefined
  policy.noticedPhase = state
  if (!first) return phaseNotice(state as PipelinePhase)
  return turn === 1
    ? `${goalNotice(goal ?? policy.spec?.goal ?? 'the stated goal')}\n\n${phaseNotice(state as PipelinePhase) ?? ''}`
    : phaseNotice(state as PipelinePhase)
}

/**
 * Evaluate the current phase's gate and move on if it passed.
 *
 * The one place a phase changes on the agent path, and deliberately best-effort
 * in the WRAPPING direction: a gate that cannot be evaluated leaves the phase
 * where it is, because a phase that advanced on an unevaluated gate is the exact
 * failure the pipeline exists to prevent.
 *
 * @param policy - the run's policies.
 * @returns the notice for the new state, or `undefined` when nothing moved.
 */
function advanceIfGated(policy: FeatureLoopPolicy, agent: Agent): { notice: string } | undefined {
  const pipeline = policy.pipeline
  if (pipeline === undefined) return undefined
  const sandbox = pipeline.worktree
  if (sandbox === undefined) return undefined
  // The verify command MUST come from the deployment's `pipeline.testCommand`.
  // Passing an empty config here is what made the test gate answer "no verify
  // command was run" on every attempt — so the phase could never pass, bounced
  // back to implement three times, and blocked a run whose code was already
  // correct and whose tests already passed. `verifyCommand` is carried on the
  // runtime precisely so this call site cannot forget it.
  const options = {
    repoRoot: '', goal: '', runId: '',
    run: pipeline.run,
    budget: pipeline.budget,
    config: {
      ...(pipeline.verifyCommand === undefined ? {} : { testCommand: pipeline.verifyCommand }),
      runsDir: '.feature-loop/runs',
    },
    runner: spawnSyncCommand,
  }
  let moved: { moved: boolean; note: string }
  try {
    moved = advancePhase(options, gateCurrentPhase(options, sandbox))
  } catch (error) {
    // Swallowing this is what made the pipeline's silence undiagnosable: an
    // observation that throws leaves the phase exactly where it was, and the run
    // then looks like a model that would not finish rather than a plugin that had
    // failed. The gate still does not advance on an unreadable observation — that
    // part is right — but the failure is now visible.
    process.stderr.write(
      `dsh-feature-loop: phase ${pipeline.run.state} gate could not be evaluated: `
      + `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return undefined
  }
  // Every transition and every standing gate is announced once, to stderr, for
  // the same reason denials are: a phase change is invisible by construction
  // (it is a notice to the model, not to the operator), and a pipeline you
  // cannot watch is a pipeline you cannot trust to have walked its phases.
  const last = pipeline.run.log.at(-1)
  if (!moved.moved) {
    return undefined
  }
  process.stderr.write(`dsh-feature-loop: phase ${last?.from} → ${last?.to} (${last?.reason}): ${moved.note}\n`)
  const next = pipeline.run.state
  // Ship runs on ENTERING the phase, because its own exit gate is the pull
  // request url it writes. A phase that has to leave before it can pass its gate
  // is a phase whose gate can never be reached.
  if (next === 'ship') runPipelineShip(policy, agent)
  return {
    notice: (PHASE_ORDER as readonly string[]).includes(next)
      ? `${moved.note}\n\n${phaseNotice(next as PipelinePhase) ?? ''}`
      : moved.note,
  }
}

export function publishPhase(state: DashboardState, runId: string, policy: FeatureLoopPolicy, armed: boolean): void {
  const pipeline = policy.pipeline
  if (pipeline === undefined) return
  const phase = pipeline.run.state
  // `done`, `stopped` and `blocked` are pipeline STATES, not phases. Reporting
  // one as a rail position would render a stage that is not in the spine.
  if ((PHASE_ORDER as readonly string[]).includes(phase)) {
    const usage = pipeline.budget.usage(phase as PipelinePhase)
    state.recordPhase(runId, {
      phase,
      phaseIndex: PHASE_ORDER.indexOf(phase as PipelinePhase),
      phaseCount: PHASE_ORDER.length,
      phaseSpentUSD: usage.spentUSD,
      phaseBudgetUSD: usage.maxSpendUSD,
    })
  }
  state.recordStopArmed(runId, armed)
}

/** The kill switch's reason line, phrased for the tool boundary. */
function killText(state: string): string {
  return `the operator's stop sentinel is set — halting the run while in "${state}". `
    + 'Remove .feature-loop/STOP to resume.'
}

/**
 * The slice of the agent's session log the spend meter reads, declared
 * structurally.
 *
 * Structural for the same reason `runIdOf` reads `agent.id` structurally: the
 * plugin must typecheck against the harness the local checkout has, must
 * tolerate test agents that carry only an `id`, and must not take a type-level
 * dependency on one harness build's session types for two method calls.
 */
/**
 * The agent's pending-work inbox, declared structurally.
 *
 * The public `Agent` type exposes only `id`; the inbox the loop consults to
 * decide whether a turn continues is reachable but not on the published surface.
 * Read structurally for the same reason `SettledSession` is — the plugin must
 * tolerate a harness build where the shape moved, and `append` is optional so an
 * agent without one simply does not continue.
 */
interface SteerableInbox {
  append(target: 'next-step' | 'next-turn', message: UserMessage): void
  readonly nextStep?: readonly unknown[]
}

interface SettledSession {
  /** Log length — the next event's seq. */
  readonly seq?: unknown
  /**
   * The append-only log, sliced from a seq.
   * @param fromSeq - inclusive start; the log's seq contract is contiguous.
   */
  snapshotEvents(fromSeq?: number): readonly {
    readonly seq?: unknown
    readonly type?: unknown
    readonly data?: unknown
  }[]
}

/**
 * Price every settled model attempt this policy has not charged yet.
 *
 * Why this exists: on the plugin path `LoopBudget.spend()` had no call site,
 * so `costBudgetUSD` measured zero — the PRD calls that the largest
 * correctness gap in this package. The usage becomes visible only when an
 * attempt *settles*: the harness commits an `assistant/message` carrying its
 * `usage` to the session log after the model call returns. The
 * `agent/request` handler cannot see it — that waterfall runs *before*
 * dispatch and yields only the call config — so the two settled-step
 * boundaries drain the log forward instead.
 *
 * Called from both hooks on purpose: `agent/pre-step` prices the previous
 * step *before* `reviewStep` reads the verdict, so a ceiling that is already
 * breached stops the run one step earlier; `agent/request` catches the tail
 * a run that ends without another pre-step would otherwise never charge. The
 * cursor makes the second call a no-op whenever the first one already drained
 * the same events.
 *
 * Latency semantics for later wiring: the span observable around this drain
 * is settle-to-settle — a whole round trip including gateway queueing — so
 * any runlog integration must record plugin-path timings as
 * `latencyKind: 'round-trip'`, never `'model'`. This plugin has no seam that
 * isolates pure model time, and a label claiming otherwise would be a proxy
 * presented as a measurement.
 *
 * A settled attempt on a route the price table does not know throws
 * `UnpricedRouteError` out of the hook and thereby fails the turn — the same
 * stance the runner takes at pre-flight: an unpriced route must fail loudly
 * rather than price at zero and disable the ceiling it exists to enforce.
 *
 * ponytail: retried/failed attempts settle as `assistant/attempt` records
 * whose usage (if any) sits inside `stream`; they are not priced yet, so a
 * run that retries a lot under-reports spend. Ceiling: the under-count only
 * touches failed attempts, and `unpricedSteps` keeps visible what is *not*
 * counted on the success path. Upgrade path: price the `usage` stream chunk
 * out of the attempt record the same way, once a test can pin its shape.
 *
 * @param policy - the agent's policies; a policy without a budget (no spec
 *   configured) has nothing to meter and returns immediately.
 * @param agent - the agent whose session settled the attempts, when there is
 *   one. An agent-less policy has no session and therefore nothing to drain.
 */
function spendSettledUsage(policy: FeatureLoopPolicy, agent: Agent | undefined): void {
  if (policy.budget === undefined) return
  const session = (agent as { readonly session?: SettledSession } | undefined)?.session
  if (session === undefined) return
  // Always start from seq 0 on first drain. `session.seq` is the *next* seq
  // (log length), so seeding the cursor there skips every already-settled
  // `assistant/message` — including the one that just landed one tick earlier
  // — and `costBudgetUSD` stays at zero forever. Re-pricing historical rows
  // into a fresh policy is correct: the budget is also fresh.
  if (policy.pricedThroughSeq === undefined) {
    policy.pricedThroughSeq = 0
  }
  for (const event of session.snapshotEvents(policy.pricedThroughSeq)) {
    const seq = Number(event.seq)
    const advanced = Number.isFinite(seq)
    if (event.type !== 'assistant/message') {
      if (advanced) policy.pricedThroughSeq = seq + 1
      continue
    }
    const data = event.data as {
      usage?: UsageReading
      message?: { source?: { provider?: unknown, model?: unknown } }
    }
    // `AssistantMessage.source` *requires* provider and model, so this is a
    // guard against a non-model producer, not a pricing path: a message
    // without a route cannot be priced, and inventing one would book the cost
    // against a route that never served it.
    const provider = typeof data.message?.source?.provider === 'string' ? data.message.source.provider : undefined
    const model = typeof data.message?.source?.model === 'string' ? data.message.source.model : undefined
    if (provider !== undefined && model !== undefined) {
      // May throw UnpricedRouteError — deliberately AFTER nothing was
      // skipped: the cursor advances only once this spend lands, so a turn
      // the throw fails does not swallow the attempt's usage; the next drain
      // retries it and fails again until the price table is fixed. Loud and
      // retried beats silent and lost.
      const stepUSD = policy.budget.spend(provider, model, data.usage)
      // Price the same attempt into the phase that earned it. Both meters read
      // the same drain, so they cannot disagree about what a step cost: the run
      // total is the sum of the phase totals, not a second opinion.
      //
      // Attribution to the phase current *now* is exact because the drain runs
      // before the guard and before any phase transition in this handler: an
      // attempt is always priced against the phase it actually ran in.
      if (policy.pipeline !== undefined) {
        policy.pipeline.budget.spend(policy.pipeline.run.state as PipelinePhase, stepUSD)
      }
    }
    if (advanced) policy.pricedThroughSeq = seq + 1
  }
}

/**
 * Refuse a step the pipeline's own ceilings already rule out, before it is paid
 * for.
 *
 * Three outcomes, in the order they are checked, and the order matters: a run
 * that has *ended* is not waiting on a budget, so its state is asked before its
 * money.
 *
 * 1. **Terminal state.** `done`, `stopped` and `blocked` have no outgoing edges,
 *    so a turn still running after one is reached is a caller bug rather than a
 *    budget question — and reporting it as "budget exceeded" would hide it.
 * 2. **The pre-call guard**, which stops new work at the guard fraction and so
 *    reserves the buffer for the terminal report.
 * 3. **The phase's own ceiling**, which stops a phase that has spent its share
 *    even when the run is barely touched.
 *
 * @param policy - the agent's policies.
 * @returns a `reject` decision when the step must not run, or `undefined` to
 *   proceed. `undefined` rather than an `allow` because `PreStepDecision` has no
 *   `allow` member — proceeding means calling `next()`, which the caller does
 *   when nothing is returned.
 */
function pipelinePreCallGuard(policy: FeatureLoopPolicy): PreStepDecision | undefined {
  const pipeline = policy.pipeline
  if (pipeline === undefined) return undefined
  const { run, budget } = pipeline
  if (isTerminal(run.state)) {
    return {
      kind: 'reject',
      reason: `the 0→1 pipeline already reached "${run.state}" — this turn is over; start a new one`,
    } as PreStepDecision
  }
  const guard = budget.verdict(run.state as PipelinePhase)
  if (guard.kind === 'stop') {
    return {
      kind: 'reject',
      reason: `${guard.reason}. Stop starting new work and report what you completed, what remains, and the next action.`,
    } as PreStepDecision
  }
  return undefined
}

/**
 * Narrow an unknown `session/event` payload to a `turn/end`.
 *
 * Structural for the same reason `runIdOf` reads `agent.id` structurally: the
 * harness's `SessionEvent` is a generic (`SessionEvent<'turn/end'>` carries
 * the payload in `data`), and importing the branded `Session`/`SessionId`
 * types would couple this plugin's build to one harness release's session
 * surface for two field reads. What is checked is the contract the loop
 * depends on: `type === 'turn/end'` with a numeric `data.turn` and a
 * `data.reason.kind` string. Anything else — including a `turn/end` whose
 * shape a future harness changes — is not an event this listener understands,
 * and ignoring it is safer than recording a turn number that was never a number.
 *
 * @param event - the appended event, exactly as recorded.
 * @returns the turn number and the reason kind, or `undefined`.
 */
function asTurnEnd(event: unknown): { turn: number, reasonKind: string, time: number } | undefined {
  if (event === null || typeof event !== 'object') return undefined
  const record = event as { readonly type?: unknown, readonly data?: unknown, readonly time?: unknown }
  if (record.type !== 'turn/end') return undefined
  if (record.data === null || typeof record.data !== 'object') return undefined
  const data = record.data as { readonly turn?: unknown, readonly reason?: unknown }
  if (typeof data.turn !== 'number' || !Number.isFinite(data.turn)) return undefined
  const reason = data.reason as { readonly kind?: unknown } | null | undefined
  if (reason === null || typeof reason !== 'object' || typeof reason.kind !== 'string') return undefined
  // `SessionEvent.time` is Unix epoch ms on EVERY event, stamped by the
  // harness's clock. It is the plugin path's own stopwatch: §1bu made the
  // runner carry a real `wallMs`, and this is the same measurement here, from
  // data the harness already writes rather than one the plugin never started.
  const time = typeof record.time === 'number' && Number.isFinite(record.time) ? record.time : undefined
  return { turn: data.turn, reasonKind: reason.kind, ...(time === undefined ? {} : { time }) }
}

/**
 * The `session/event` listener's key for one session, structurally read.
 *
 * `Session.id` is a branded string (`SessionId`), so `String(id)` is the
 * stable key without importing the brand.
 */
function sessionIdOf(session: unknown): string {
  const id = (session as { readonly id?: unknown } | null | undefined)?.id
  return typeof id === 'string' ? id : 'unknown-session'
}

/** Use {@link asTurnEnd} — the structural narrow on the `turn/end` payload. */
export function isTurnEnd(event: unknown): { turn: number, reasonKind: string, time?: number } | undefined {
  return asTurnEnd(event)
}

/**
 * What the run-history writer needs from the turn that just closed.
 *
 * Kept as a parameter object rather than six arguments so the single
 * `session/event` call site reads as one record assembly, not a positional
 * puzzle — and so a future field (per-route usage, when the session log
 * starts carrying it) is an added property, not a reordered signature.
 */
interface TurnRecordInput {
  session: unknown
  /** The closed turn: its number, why it ended, and the harness's own `time`. */
  event: { turn: number, reasonKind: string, time?: number }
  /**
   * When the turn opened, from `turn/start` in the session log.
   *
   * `undefined` when the log does not say — and then the record says so
   * (`wallMs` absent) rather than reporting a zero for a run that took minutes.
   */
  openedAt?: number
  options: Parameters<typeof createPolicy>[0] & { dashboard?: DashboardConfig }
  policyFor: (agent: Agent | undefined) => FeatureLoopPolicy
  /** Live agent lookup keyed by session id (`ctx.agents.get`). */
  resolveAgent: (sessionId: string) => Agent | undefined
  state: DashboardState
  historyPath: string
  /**
   * The harness agent registry, used to resolve the session's agent.
   *
   * On the input rather than read from a module global because this function is
   * module-level and a deployment may mount several contexts; a captured global
   * would silently record every turn against the first context's agents.
   */
  agents?: AgentRegistry
}

/**
 * Map the harness's turn-close reason onto the run record's outcome.
 *
 * The two vocabularies differ on purpose: `TurnEndReason` says why the *turn*
 * closed (including `max-tokens` and the crash-orphan `interrupted`, which are
 * transport facts), while `RunOutcome` says what the *loop* achieved. A turn
 * that ended `completed` may still be a `budget-stop` run in loop terms — the
 * ceilings, not the transport, own the outcome — so the mapping consults the
 * agent's budget verdict where one exists, and only falls back to the reason
 * kind where no budget was ever configured.
 *
 * @param reasonKind - the `turn/end` reason kind.
 * @param policy - the agent's policy, for the budget verdict when present.
 * @returns the run outcome to record.
 */
function outcomeOf(reasonKind: string, policy: FeatureLoopPolicy, steps: number): RunOutcome {
  if (reasonKind === 'aborted') return 'aborted'
  if (reasonKind === 'error') return 'error'
  if (reasonKind === 'blocked') return 'blocked'
  // A turn that took no step is not a successful turn. `completed` here means
  // the transport closed, and the loop's own success check lives in the CLI
  // runner — so without this a turn that did nothing at all is recorded as
  // `goal-met`, and the roll-ups read it as one.
  //
  // Measured 2026-10-04 on the committed history: 13 of 15 records had
  // `steps: 0` and `costUSD: 0`, 12 of them `goal-met`. `summarize` reported
  // `goalMetRate 0.867` — an 87% success rate computed almost entirely from
  // turns that touched nothing. Every other number in that roll-up was
  // correct; this one was a claim about work that never happened.
  if (steps === 0) return 'model-stop'
  // `completed`, `max-tokens` and `interrupted` all say the transport closed
  // the turn without refusing it. Whether the loop *succeeded* is then a
  // question for the ceilings: a turn the harness calls completed that spent
  // past its budget is a budget-stop in every sense that matters to the next
  // derivation. With no budget configured there is no ceiling to have hit, so
  // `completed` reads as goal-met only in the literal harness sense — the
  // loop's own success check lives in the CLI runner, not in this hook.
  const spent = policy.budget?.snapshot()
  if (spent !== undefined && policy.budget?.verdict(spent.steps).kind === 'stop') return 'budget-stop'
  if (reasonKind === 'completed') return 'goal-met'
  return 'model-stop'
}

/**
 * Append one run record for a closed turn, and refresh the dashboard's Metrics.
 *
 * Async and fire-and-forget from the listener on purpose: `session/event`
 * listeners are observe-only (mode emit) and must not veto or delay the log
 * append they observe. A throw inside would be contained by the harness's
 * per-listener containment, but a *rejected promise* from an async listener
 * is silent either way — so the single call site attaches the `.catch` that
 * turns a failed append into a feed line, and this function itself never
 * catches: a record that failed to land must be visible, not swallowed.
 *
 * `runlog.ts` is imported STATICALLY, and that is a fix rather than a style:
 * it used to be `await import('./runlog.ts')` here, justified as keeping
 * `node:fs` out of the plugin's static graph — but `readFileSync` from
 * `node:fs` has been a static import at the top of this file for some time, so
 * the justification was stale and the cost was the defect.
 *
 * Measured 2026-10-04 on a real web run: the listener fired, `asTurnEnd`
 * accepted the `turn/end`, this function was entered (its first statement
 * printed a feed note), and the very next statement — the dynamic import —
 * never resolved. No rejection, so the caller's `.catch` never ran, no record
 * was written and nothing was logged. A load that never settles loses the write
 * silently, which is the worst shape a dependency can have.
 *
 * `optimize.ts` is still NOT imported: `planEnvelope`'s P95 derivation belongs to
 * the CLI's pre-run planning, not to a per-turn hook. What the dashboard needs is
 * the roll-up (`summarize`), which is already imported statically.
 *
 * @param input - the closed turn and everything the record is built from.
 */
/**
 * When this turn opened, from the session's own log.
 *
 * `turn/start` and `turn/end` are both logged and both carry `time` (Unix epoch
 * ms, stamped by the harness), so their difference IS the run's wall clock —
 * the plugin path's equivalent of the runner's `performance.now()` span (§1bu).
 * Structural like every other session read here: a session without `eventAt`
 * yields `undefined`, and an unmeasured run says so rather than reporting `0`.
 *
 * Bounded backward walk, because this runs on every closed turn and a turn is
 * short: a full scan of a long session per turn is a cost the measurement does
 * not justify.
 *
 * @param session - the session that closed the turn.
 * @param turn - the 1-based turn number.
 * @returns Unix epoch ms, or `undefined` when the log does not say.
 */
function turnStartTime(session: unknown, turn: number): number | undefined {
  const typed = session as {
    readonly seq?: unknown
    readonly eventAt?: (seq: unknown) => { readonly type?: unknown, readonly data?: unknown, readonly time?: unknown } | undefined
  } | null | undefined
  const at = typed?.eventAt
  const seq = typed?.seq
  // BOUND, not detached. `Session.eventAt` reads `this.log`, so hoisting the
  // method out of the object and calling it later gives `this === undefined` and
  // throws `Cannot read properties of undefined (reading 'log')` — verbatim, on
  // every closed turn, inside the listener, where the harness contained it and
  // logged it below the level the web app surfaces.
  //
  // That single unbound reference is why no harness-path run record has ever
  // been written, and why every figure in KNOWN-ISSUES §1bp–§1bv was wrong. It
  // took four rounds of live instrumentation to find, and the throw string was in
  // the feed the whole time — printed by the synchronous guard added in 864dc80,
  // which is why it was findable at all (§1bw).
  const read = typeof at === 'function' ? (cursor: number) => at.call(typed, cursor) : undefined
  if (read === undefined || typeof seq !== 'number') return undefined
  for (let cursor = seq - 1; cursor >= 0 && cursor >= seq - 200; cursor -= 1) {
    const event = read(cursor)
    if (event === undefined || event === null || typeof event !== 'object') continue
    if (event.type !== 'turn/start') continue
    const data = event.data as { readonly turn?: unknown } | null | undefined
    if (data === null || typeof data !== 'object' || data.turn !== turn) continue
    return typeof event.time === 'number' && Number.isFinite(event.time) ? event.time : undefined
  }
  return undefined
}

/**
 * Closed turns before the optimizer is asked for proposals.
 *
 * A battery of judge questions is evidence-gathering, and one turn is not
 * evidence: a proposal computed from a single 4-step run says more about that
 * run than about the loop. Five is the same number `MetricsSummary.provisional`
 * already uses for "a tail would be an anecdote", so the page marks both with
 * the same word. Exported so a test can assert the number rather than a
 * comment's promise.
 */
export const RECOMMENDATION_MIN_RUNS = 5

/** Judge batteries in flight, whole process. See the `advisoryInFlight` read below. */
let advisoryInFlight = 0

async function recordTurn(input: TurnRecordInput): Promise<void> {
  const { session, event, openedAt, options, policyFor, resolveAgent, state, historyPath } = input
  const agent = agentOfSession(session, resolveAgent)
  const policy = policyFor(agent)
  const snapshot = policy.budget?.snapshot()
  const spec = policy.spec ?? options.spec
  const now = Date.now()
  const steps = snapshot?.steps ?? 0
  const runId = sessionIdOf(session)
  const record: RunRecord = {
    runId: sessionIdOf(session),
    startedAt: openedAt ?? now,
    endedAt: event.time ?? now,
    pass: 1,
    passes: 1,
    taskKey: spec === undefined ? 'none' : taskKeyOf(spec.goal),
    outcome: outcomeOf(event.reasonKind, policy, steps),
    steps,
    maxSteps: spec?.maxSteps ?? 0,
    costUSD: snapshot?.spentUSD ?? 0,
    budgetUSD: spec?.costBudgetUSD ?? 0,
    unpricedSteps: snapshot?.unpricedSteps ?? 0,
    byRoute: snapshot === undefined ? {} : { ...snapshot.byRoute },
    // Absent, not zero. This path has no seam that times a step — the runner's
    // own records are the ones that carry a measurement — so `0` and
    // `'round-trip'` were a run that took minutes reporting "0 ms, round trip".
    // `summarize` reads both, so the absence has to be in the record.
    stepLatencyMs: [],
    // The harness's own clock: the `turn/start` and `turn/end` events this
    // record is written from. So the plugin path reports a REAL wall clock
    // rather than an absence (§1bt made it optional; §1bu gave the runner one,
    // and this is the same measurement for the harness path). Per-step latency
    // stays absent: the plugin has no seam around a model call, only the turn
    // boundary — and `latencyKind` stays absent because nothing was timed at
    // that resolution.
    wallMs: openedAt === undefined || event.time === undefined ? undefined : event.time - openedAt,
    latencyKind: undefined,
    signals: policy.history.length === 0 ? [] : policy.history.map(() => ({ kind: 'detector', severity: 'info' })),
    judgeScores: [],
    // From the router that counted them. `recordTurn` wrote a literal `0` here,
    // so every harness-path record reported a human-escalation rate of exactly
    // zero — and `summarize`'s "Human escalation rate > 15%" alert could never
    // fire, however many reviews the loop had actually requested. The count was
    // on `policy.router` the whole time, exposed by its own `stats()`.
    reviewFraction: policy.router.stats().fraction,
    specFingerprint: spec === undefined ? 'none' : specFingerprint(spec),
    // Where the 0→1 pipeline got to, and what it may spend next. A phase change
    // needs a TURN to deliver its instructions, so a run that finishes its turn
    // mid-pipeline resumes at the next one — which means the resume point has to
    // be on the record, or an operator reading the history sees "research → prd"
    // and no way to tell that the PRD is waiting for someone to send another
    // message.
    ...pipelineFields(policy, String(runId)),
    // The step ledger, from the observations the detectors already hold. An index
    // that cannot reach the content it indexes is not an index.
    ...(policy.history.length === 0 ? {} : { trajectory: policy.history.map(observationToStep) }),
  }
  appendRecord(historyPath, record)
  writeEvidenceBundle(String(runId), record)
  // The Metrics panel reads what just landed: the roll-up is over the file,
  // not over memory, so a resumed process that never saw the earlier turns
  // still renders their history. A torn line is counted and skipped by the
  // reader, never thrown — the panel shows a smaller history, not an error.
  const { records, malformed } = readRecords(historyPath)
  state.setMetrics(summarize(records, { malformed }))

  // The optimizer's proposals, on a CANDIDATE: one turn's history is not the
  // evidence a battery of judge questions is for, and a card that says "raise
  // maxSteps to 8" after a single 4-step run is a card nobody should trust.
  // They are produced here and published only once enough closed turns exist,
  // which is what `RECOMMENDATION_MIN_RUNS` states. Seven sequential round trips
  // is the ceiling `proposeOptimizations` documents; paying it on the hot path
  // of every turn is how that becomes the loop's own latency.
  //
  // Before this, `recommendations` was forwarded by `projectLive` (a65257b) and
  // set by nobody: `setRecommendations` had no production caller in the whole
  // repo, so the key could never be present. Measured 2026-10-04 by grep — the
  // first of the "data arrives, nothing draws it" family to be found by asking
  // who WRITES the field rather than by looking for a missing renderer.
  // One battery at a time, for the whole process. A turn is short and a second
  // pass would multiply seven round trips by the number of concurrent runs.
  // `historyPath`, not the `historyEnabled` flag from `apply`: this function
  // does not have that binding, so naming it here was a ReferenceError thrown
  // AFTER `appendRecord` — which is why the history grew to 6 lines while the
  // battery never ran once, with no error anywhere. Same class as §1bw's
  // contained throw: a real failure, invisible because nothing owned it.
  if (historyPath.trim() !== '' && records.length >= RECOMMENDATION_MIN_RUNS && advisoryInFlight === 0) {
    advisoryInFlight += 1
    void advisoryFor({ records, malformed, spec, judge: policy.judge })
      .then((advisory) => {
        state.setRecommendations(advisory.recommendations)
        state.note(
          'note',
          advisory.unavailable === undefined
            ? `optimizer: ${String(advisory.recommendations.length)} proposal(s) from `
              + `${String(records.length)} recorded runs`
            : `optimizer: no proposals — ${advisory.unavailable}`,
        )
      })
      // A judge outage is a normal state (rule 1), not a turn failure: the
      // roll-up above is already published and this must not take the turn
      // with it. So the rejection is swallowed with a feed line, exactly as a
      // failed history append is.
      .catch((error: unknown) => {
        state.setRecommendations([])
        state.note('note', `optimizer: no proposals — ${error instanceof Error ? error.message : String(error)}`)
      })
      .finally(() => { advisoryInFlight -= 1 })
  }
}

/**
 * The agent behind a session, via the harness's own registry.
 *
 * `session/event` hands the session, not the agent — but the per-agent policy
 * (budget, spec, history) is keyed by agent. Resolution order:
 *
 * 1. Structural fields some harness builds put on the session (`agent`, or
 *    `owner` when it looks like an Agent with a `session` handle).
 * 2. `ctx.agents.get(session.id)` — agent id === session id in DSH
 *    (`AgentRegistry.get`), which this plugin already declares via
 *    `inject = ['agents']`.
 *
 * When neither resolves, the record falls back to the agent-less policy — the
 * same fail-closed stance `policyFor` takes for agent-less calls: shared
 * ceilings, honestly labelled, rather than no record at all.
 */
function agentOfSession(
  session: unknown,
  resolveAgent?: (sessionId: string) => Agent | undefined,
): Agent | undefined {
  if (session !== null && typeof session === 'object') {
    const record = session as {
      readonly agent?: unknown
      readonly owner?: unknown
    }
    if (isAgentLike(record.agent)) return record.agent
    if (isAgentLike(record.owner)) return record.owner
  }
  const id = sessionIdOf(session)
  if (id === 'unknown-session' || resolveAgent === undefined) return undefined
  return resolveAgent(id)
}

/** Structural: anything the registry would hand back has a session handle. */
function isAgentLike(value: unknown): value is Agent {
  if (value === null || typeof value !== 'object') return false
  const session = (value as { readonly session?: unknown }).session
  return session !== null && typeof session === 'object'
}

/**
 * Project one step observation onto the record's step line.
 *
 * The detectors already hold every field this needs, so nothing is re-measured —
 * the trajectory in the record is the same data the policy acted on, which is the
 * only reason it can be trusted after the fact.
 *
 * @param observation - the step the detectors read.
 * @returns the record's step line.
 */
function observationToStep(observation: StepObservation): StepRecord {
  return {
    index: observation.index,
    phase: observation.phase ?? 'unknown',
    ...(observation.tool === undefined ? {} : { tool: observation.tool }),
    ...(observation.error === undefined ? {} : { error: observation.error }),
    costUSD: observation.costUSD,
    ...(observation.latencyMs === undefined ? {} : { latencyMs: observation.latencyMs }),
  }
}

/**
 * Write this run's evidence bundle: REPORT.md, steps.jsonl, phases.json.
 *
 * This is the artifact the PRD promised — a directory a human can read months
 * later, offline, with every step, every budget and every artifact accounted for
 * — and for the whole life of the pipeline it existed as a function nobody called.
 * A live run produced `.feature-loop/runs.jsonl` and nothing else.
 *
 * Failure is a stderr line, never a throw: the bundle is evidence, and evidence
 * that breaks a turn has become control.
 *
 * @param runId - the run's id, which names the directory.
 * @param record - the record just written, and the source of the report.
 */
function writeEvidenceBundle(runId: string, record: RunRecord): void {
  try {
    const dir = join(RUNS_DIR, runId)
    writeBundle(dir, record)
    for (const step of record.trajectory ?? []) appendStep(dir, step)
  } catch (error) {
    process.stderr.write(
      `dsh-feature-loop: evidence bundle for ${runId} could not be written: `
      + `${error instanceof Error ? error.message : String(error)}\n`,
    )
  }
}

function pipelineFields(policy: FeatureLoopPolicy, runId: string): Record<string, unknown> {
  const pipeline = policy.pipeline
  if (pipeline === undefined) return {}
  const usage = pipeline.budget.allUsage()
  return {
    phase: pipeline.run.state,
    evidenceDir: `${RUNS_DIR}/${runId}`,
    phases: usage.map(u => ({
      phase: u.phase,
      steps: u.steps,
      costUSD: u.spentUSD,
      budgetUSD: u.maxSpendUSD,
      maxSteps: u.maxSteps,
      outcome: u.steps === 0 ? 'pending' : u.phase === pipeline.run.state ? 'current' : 'passed',
      wallMs: u.wallMs,
    })),
    ...(policy.worktreeRoot === undefined ? {} : { worktree: policy.worktreeRoot }),
  }
}

/**
 * Register the dashboard's answerer ahead of every other `approval/request`
 * listener.
 *
 * Prepend is required here, not a preference. The Host's remote forwarder
 * (`packages/api/remotes` in the harness) holds the request awaiting the
 * browser while a Web UI tab is attached and does **not** call `next()` — so a
 * listener registered after it would be unreachable exactly when the UI is
 * open, which is the moment the dashboard matters most. Precedence itself is
 * then decided inside `answer`, never by order: claim only while a dashboard
 * tab is connected, otherwise `next()` reaches the composer panel exactly as
 * it does today. The harness documents that sibling listener order is not a
 * priority mechanism; the guard is what makes that safe.
 *
 * When briefs are enabled, the claim also kicks off the explainer
 * fire-and-forget: the pending id is handed to `requestBrief`, which marks
 * the card pending and records the normalized brief when the model resolves.
 * The ask's settle path is never touched — a slow, failed, or late brief
 * cannot delay or decide the approval.
 *
 * @param ctx - the cordis context to install into.
 * @param dashboard - the started dashboard whose `answer` drives the claim.
 * @param requestBrief - invoked with each claimed ask's pending id and
 *   question; defaults to a no-op when briefs are off.
 * @returns a disposer removing the listener.
 */
export function attachApprovalAnswerer(
  ctx: Context,
  registry: ApprovalRegistry,
  requestBrief: (id: string, question: ApprovalQuestion) => void = () => undefined,
): () => void {
  return ctx.on(
    'approval/request',
    (question: ApprovalQuestion, next: () => Promise<ApprovalOutcome>) => {
      const claimed = registry.answer(question, next)
      // Fire-and-forget deliberately: the brief must never gate the ask.
      // `answer` registers the pending entry synchronously before returning
      // the promise, but the entry's id is internal to the dashboard, so the
      // brief request re-reads the snapshot and matches on the ask's own
      // fields. A settled-before-brief ask simply matches nothing.
      void Promise.resolve().then(() => {
        const id = pendingIdFor(registry.pendingSnapshot(), question)
        if (id !== undefined) requestBrief(id, question)
      })
      return claimed
    },
    { prepend: true },
  )
}

/**
 * Request a review brief for one claimed ask, fire-and-forget.
 *
 * Every exit resolves to a recorded brief or a recorded failure — nothing
 * here can throw out, hang, or settle the ask. A brief requested for an ask
 * that settled meanwhile matches nothing and is dropped by the recorder.
 *
 * @param args - the registry, explainer, pending id, and question.
 */
export async function requestBrief(args: {
  registry: ApprovalRegistry
  explainer: Explainer
  id: string
  question: ApprovalQuestion
}): Promise<void> {
  const { registry, explainer, id, question } = args
  // NO_EXPLAINER means briefs are OFF for this deployment (`brief.enabled` was
  // never set), and the brief is advisory either way — so do not mark the card
  // pending and then immediately record a failure for a feature nobody asked
  // for. That is what put "review brief requested" + "Review brief
  // unavailable." on the feed of every single ask on a profile with briefs
  // disabled, and "Review brief unavailable." on every card.
  if (explainer === NO_EXPLAINER) return
  registry.briefs.markBriefPending(id)
  let code: string | undefined
  try {
    code = await explainer.explain(briefInputFor(question), question.signal)
  } catch {
    code = undefined
  }
  if (code === undefined) {
    registry.briefs.recordBrief(id, undefined)
    return
  }
  const normalized = normalizeBrief(code)
  const nodes: BriefNode[] | undefined = 'nodes' in normalized ? normalized.nodes : undefined
  registry.briefs.recordBrief(id, nodes)
}

/**
 * Build the explainer input from what the ask carries.
 *
 * Only the ask's own fields — the approval event carries no tool arguments,
 * and the brief must never invent them. Run-position context (step, route,
 * signals) is the plugin's to add when it learns the pending id; today the
 * input is the ask alone, which is what `briefUserMessage` renders.
 */
function briefInputFor(question: ApprovalQuestion): BriefInput {
  return {
    toolName: question.toolName,
    ...question.callId === undefined ? {} : { callId: question.callId },
    ...question.reason === undefined ? {} : { reason: question.reason },
  }
}

/**
 * Read the gateway key from the DSH credential store, synchronously.
 *
 * The CLI's `resolveApiKey` is async; `apply` is not, so this narrow sync
 * variant exists for the brief path only. Same narrow parse — one key on one
 * line, no YAML dependency — returning `undefined` when absent so the caller
 * can fail loudly naming the missing key. `DSH_CREDENTIALS` overrides the
 * store path (tests point it at nowhere to simulate a keyless machine).
 *
 * @returns the key, or `undefined` when the store has neither name.
 */
function readCredentialsKey(): string | undefined {
  let raw: string
  try {
    raw = readFileSync(process.env.DSH_CREDENTIALS ?? join(homedir(), '.dsh/.credentials.yaml'), 'utf8')
  } catch {
    return undefined
  }
  const match = /^\s*(ONEGW_API_KEY|ONEGE_API_KEY):\s*(\S+)\s*$/m.exec(raw)
  return match?.[2]
}

/**
 * Build the brief explainer from the dashboard's `brief:` row, or return
 * `NO_EXPLAINER` when briefs are off.
 *
 * Gateway env resolution is shared with `src/cli.ts`'s `resolveApiKey` shape
 * (env first, `~/.dsh/.credentials.yaml` second) but not its code: the CLI's
 * resolver is async and CLI-shaped, and awaiting it here would make `apply`
 * async, breaking the cordis contract. This synchronous variant reads env
 * first and the store second, throwing a load-time error naming the missing
 * key — briefs were explicitly enabled, so silence would be the worse failure.
 */
function resolveBriefExplainer(brief: DashboardConfig['brief']): Explainer {
  if (brief?.enabled !== true || brief.model === undefined) return NO_EXPLAINER
  const apiKey = process.env.ONEGW_API_KEY ?? process.env.ONEGE_API_KEY ?? readCredentialsKey()
  if (apiKey === undefined) {
    throw new Error(
      'dashboard.brief is enabled but no gateway key was found: set ONEGW_API_KEY '
      + '(or ONEGE_API_KEY) in the environment, or add it to ~/.dsh/.credentials.yaml',
    )
  }
  return createChatExplainer({
    llm: createOnegwClient({
      baseURL: process.env.ONEGE_BASE_URL ?? 'http://127.0.0.1:8080/v1',
      apiKey,
      timeoutMs: brief.timeoutMs,
    }),
    model: brief.model,
    maxTokens: brief.maxTokens,
    timeoutMs: brief.timeoutMs,
  })
}
export const name = 'feature-loop'

/** The services this plugin reads. */
export const inject = ['agents']

/**
 * Attach the feature-loop policies to every agent this context creates.
 *
 * Kept deliberately thin and side-effect-free at import time: it registers
 * listeners and returns their disposers, which is the cordis contract.
 *
 * @param ctx - the cordis context to install into.
 * @param options - the deployment's spec, judge, gate and dashboard overrides.
 * @returns a disposer removing every listener this call registered and, when
 * one was started, stopping the dashboard server.
 */
export function apply(
  ctx: Context,
  options: Parameters<typeof createPolicy>[0] & {
    dashboard?: DashboardConfig
    rowConfig?: Record<string, unknown>
  } = {},
): () => void {
  const policies = new WeakMap<Agent, FeatureLoopPolicy>()
  const fresh = (): FeatureLoopPolicy => createPolicy(options)
  // The gateway's live-client predicate, read the same defensive way
  // `resolveAgent` reads `agents`: hoisted or unbound access to a Cordis
  // service throws, and a throw inside the gate would turn every gated call
  // into an error instead of a decision. Absent gateway -> no composer, which
  // is the fail-closed reading of "nobody can answer".
  setLiveClientProbe(() => {
    const gateway = ctx.reflect?.get?.('typertGateway', false) as
      { hasLiveClient?: () => boolean } | undefined
    return gateway?.hasLiveClient?.() === true
  })
  /**
   * The policy for one agent, built on first sight.
   *
   * Every hook resolves its policy through here rather than reading the map
   * directly. A tool call can arrive before any `agent/pre-step` — a resumed
   * session, or a nested dispatch — and reading the map directly would find
   * nothing and let the call through ungated. Building on demand means the gate
   * fails closed: an unseen agent gets the deployment's real policies, not a
   * pass.
   *
   * An **agent-less** call cannot be keyed by agent, and it cannot route a
   * review anywhere either: `serviceAsk` in `@deepseek-ai/dsh-tools` refuses an
   * `ask` with no agent, because there is no session to audit to and no UI to
   * reach. So it gets one shared policy, and the gate is consulted normally —
   * the decision then fails closed downstream. Returning `undefined` here
   * instead would skip the gate entirely and dispatch the call, which is the
   * opposite of the guarantee this function exists to provide.
   */
  let agentless: FeatureLoopPolicy | undefined
  const policyFor = (agent: Agent | undefined): FeatureLoopPolicy => {
    if (agent === undefined) {
      agentless ??= fresh()
      return agentless
    }
    let policy = policies.get(agent)
    if (policy === undefined) {
      policy = fresh()
      policies.set(agent, policy)
      // The sandbox is created HERE, on the run's first contact, rather than at
      // load: a policy is per-agent and an agent only exists once a turn is
      // running, so this is the first moment a run has a cwd and an id to name a
      // worktree after.
      //
      // It must happen before the first tool call, and `attachSandbox` is
      // idempotent precisely so that a run which is created but never steps still
      // gets its containment. `gateEnforce` reads `policy.worktreeRoot`, so an
      // un-sandboxed YOLO run denies every write — the fail-closed direction, and
      // the reason that gap would be safe even if this call were removed.
      attachContainment(policy, agent, options)
    }
    return policy
  }

  // Agent id === session id in DSH (`AgentRegistry.get`). Structural: a test
  // double without `agents` still mounts; live cordis always injects it.
  //
  // `ctx.agents` is a cordis PROXY, and the proxy THROWS on a missing service
  // rather than returning undefined — so the `agents?:` type above is a lie that
  // cost a real run: `resolveAgent` was called on the `session/event` fiber,
  // where `AgentRegistry` had not been injected, the getter threw
  // `cannot get property "agents" without inject`, and the turn's history record
  // was LOST. Measured 2026-10-03 on a live web run, in the feed, verbatim.
  //
  // A failed record is supposed to be visible but not fatal, and it was — the
  // cost was a silent hole in the run history, which is the one thing the
  // history exists to prevent. The lookup is now a try/catch: no agent found is
  // already a supported answer (the agent-less policy), so a throwing getter is
  // the same answer with extra noise, not a lost record.
  const resolveAgent = (sessionId: string): Agent | undefined => {
    // `ctx.reflect.get('agents', false)` is cordis's OWN lookup: the service or
    // `undefined`, and it does not throw for a missing one. Verified 2026-10-04
    // against the harness's cordis, where the obvious spellings all fail:
    //
    //   `ctx.agents.get(id)`  THROWS `cannot get property "agents" without
    //                         inject` on a fiber without the dependency
    //   `const g = ctx.agents.get; g(id)`  same throw, via `this.store`
    //
    // THREE shapes of the same mistake in this file, each of which returned
    // `undefined` and each of which was therefore invisible:
    //
    //   §1bw  a session method hoisted off its object   (`this.log`)
    //   here  a proxy accessor hoisted off the proxy     (`this.store`)
    //   here  reading `ctx.agents` itself, which throws  (no `this` at all)
    //
    // And the consequence was the same every time: `resolveAgent` answered
    // "no agent", `policyFor(undefined)` returned the AGENT-LESS policy — a fresh
    // budget, zero steps, zero cost, a router that never saw a step — and every
    // harness-path turn record was built from it. Measured with a probe
    // reporting `agent=UNRESOLVED` on every closed turn.
    const registry = (ctx as unknown as {
      reflect?: {
        get?: (name: string, strict?: boolean) => { get?: (id: string) => Agent | undefined } | undefined
      }
    }).reflect?.get?.('agents', false)
    return registry?.get?.(sessionId)
  }

  // The dashboard is process-wide (one server, one feed), not per agent — it
  // lives here rather than in `createPolicy`, whose policies are per-run.
  // Enabled by default: omitting the block starts the page on 127.0.0.1:8100
  // with a per-start token. The posture stays loopback-only (the only hosts
  // the config accepts are 127.0.0.1 and the container-internal 0.0.0.0), and
  // `answers: false` (observe-only) or `enabled: false` (no server at all)
  // are one field away for deployments that want less. The composer panel
  // keeps working either way — the answerer claims a request only while a
  // dashboard tab is actually connected.
  const state = new DashboardState()
  // Bridge every state change to the browser as one coalesced event, so the
  // dashboard re-reads on change instead of polling. Returns an unsubscribe;
  // released with the plugin so a reload never leaves a listener behind.
  // Guarded: a context without `emit` (a narrow test double, or a host that
  // mounts the policies without the event surface) must not crash on every
  // state change. A missed event degrades to the client's safety-net poll,
  // which is the right failure; a thrown event kills the run.
  const emitChanged = typeof (ctx as { emit?: unknown }).emit === 'function'
    ? () => { (ctx as unknown as { emit(name: 'featureLoop/changed'): void }).emit('featureLoop/changed') }
    : undefined
  const notifyChanged = emitChanged === undefined ? () => undefined : createChangeEmitter(emitChanged)
  const unsubscribeChanged = state.onChange(notifyChanged)
  // Validate even when the dashboard is off: a bad field is a typo someone
  // will flip `enabled: true` on later, and it must fail at load, then —
  // not silently refuse to bind. `startDashboard` re-parses below; the
  // duplicate parse is one-time at load and keeps the fail- loud check
  // unconditional.
  parseDashboardConfig(options.dashboard ?? {})
  const dashboardConfig = options.dashboard ?? {}
  // The registry owns the asks, with or without a page. `standalone: true` is
  // the only thing that starts the loopback HTTP server — the default is the
  // dashboard as a page inside the DSH UI, reached over the host remote, with
  // no second origin and no second token to manage.
  const registry = createApprovalRegistry({
    state,
    answers: dashboardConfig.answers ?? true,
    answerTimeoutMs: dashboardConfig.answerTimeoutMs ?? 600_000,
    hasWatcher: () => watcherActive(),
  })
  // `answers` is the deployment's choice, not ours to override. It used to be
  // forced to `false` here, which made a standalone dashboard advertise itself
  // as observe-only: the page rendered "composer panel answers", and the
  // registry never let it claim an ask, so a click could never settle one.
  // The registry is shared with the composer, so both front ends settle the
  // same ask exactly once — which is the point of the registry.
  const dashboard = dashboardConfig.standalone === true
    ? startDashboard({ ...dashboardConfig, enabled: true }, state, registry)
    : undefined
  // Publish the live state for the remote row (`feature-loop-remote`) to
  // serve the in-UI dashboard page. Published unconditionally: the in-UI page
  // is the default surface, and the approvals it answers live in the registry
  // whether or not a standalone server was ever started.
  const liveSource = {
    // The plugin's own snapshot, verbatim — the designed page already renders
    // these exact shapes, so nothing is re-projected for the UI.
    snapshot: () => {
      const snap = state.snapshot()
      return {
        runs: snap.runs,
        feed: snap.feed,
        ...snap.metrics === undefined ? {} : { metrics: snap.metrics },
        ...snap.recommendations === undefined ? {} : { recommendations: snap.recommendations },
      }
    },
    pendingApprovals: () => registry.pendingSnapshot(),
    // A run's name is the task a human typed, so the workspace tree lists runs
    // someone can recognise instead of agent ids.
    labelRun: (sessionId: string, task: string): void => {
      state.recordMeta(sessionId, { sessionId, label: task })
    },
    answers: () => dashboardConfig.answers ?? true,
    settleApproval: (id: string, outcome: 'allowed-once' | 'rejected', feedback?: string): boolean =>
      registry.settleApproval(id, outcome, feedback),
    // The policy row's own config, so the in-UI status page reports the spec,
    // judge and dashboard that are actually running. Without this the remote
    // row (whose own `config:` is empty) would say "policies off / judge none"
    // while this row was demonstrably enforcing both.
    config: () => ({
      ...(options.rowConfig ?? {}),
      ...(dashboard === undefined ? {} : dashboardURLOnceBound(dashboard)),
      embedded: dashboard === undefined,
    }),
  }
  {
    // Dynamic import: remote.ts pulls `yaml` + fs, and plugin.ts's static
    // graph must stay harness-free for the strip-types CI path.
    void import('./remote.ts').then(m => m.publishLiveState(liveSource)).catch(() => undefined)
  }
  // The brief's explainer: explicit injection wins (tests, custom transports);
  // otherwise the `brief:` row builds one from the deployment's gateway env.
  // Resolved from the config, not from whether a server was started — the
  // in-UI page renders briefs too. Anything that fails here is a loud
  // load-time error, never a silent missing brief: `resolveBriefExplainer` is
  // only reached when briefs were explicitly enabled.
  let briefExplainer: Explainer
  try {
    briefExplainer = options.explainer ?? resolveBriefExplainer(dashboardConfig.brief)
  } catch (error: unknown) {
    if (dashboard !== undefined) void dashboard.stop()
    throw error
  }
  const disposeApproval = attachApprovalAnswerer(ctx, registry, (id, question) => {
    const agent = question.agent as Agent | undefined
    void requestBrief({
      registry,
      explainer: policyFor(agent).explainer === NO_EXPLAINER ? briefExplainer : policyFor(agent).explainer,
      id,
      question,
    })
  })
  if (dashboard !== undefined) {
    // Both cleanup paths are kept deliberately: cordis collects `effect`
    // disposers on unload, while SDK/standalone callers that ignore the
    // returned disposer still get one. Each is idempotent, so running both
    // is harmless — running neither would leak a listening socket.
    ctx.effect?.(
      () => () => {
        disposeApproval?.()
        void dashboard.stop()
      },
      'feature-loop: dashboard',
    )
  }

  // History + metrics when the deployment asked for them (`optimize.history`).
  // Everything records from the hooks the plugin already owns — no new hook,
  // no polling — and everything expensive runs once per completed turn, not
  // once per step:
  //
  // - `session/event` on `turn/end` is the exactly-once run seam: the agent
  //   loop appends it in a `finally` every exit path reaches once (completed,
  //   blocked-by-reject, aborted, error, max-tokens), and a pre-step reject
  //   closes through it too — the loop never emits a turn a listener would
  //   have to infer. `agent/turn-stopping` is a veto/steer seam, not an
  //   outcome observer: a listener can force another step, so it is not
  //   exactly-once. (Verified against `packages/core/agent-loop/src/agent.ts`
  //   and `packages/core/session/src/types.ts` in the harness checkout.)
  // - The metrics roll-up is pure and runs per completed turn whether or not
  //   the dashboard page is up — the snapshot carries it whenever a reader
  //   asks, and a reader that never comes costs one `summarize` per turn.
  //   The judge battery is NOT asked here. One `session/event` per turn must
  //   stay cheap (it fires on every conversation in the process, most of them
  //   not this loop's), and a battery of judge round trips on the hot path
  //   would buy advice with the loop's own latency budget. Recommendations
  //   stay a CLI affair (`--derive`) until a `session/flush`-cadence design
  //   exists.
  //
  // Records are built from metered numbers only: the budget snapshot for
  // steps, cost and unpriced steps; per-turn latency from the policy's own
  // step timings; judge scores from the transcript the plugin already feeds
  // the dashboard. Every unavailable number is recorded as absent
  // (zeros/empties), never invented — the same honesty rule `refine.ts`
  // follows when it writes records from `LoopRunResult`.
  const optimize: OptimizeConfig | undefined = options.optimize
  // On by default: omitting `optimize` records to `.feature-loop/runs.jsonl`
  // under the process working directory. An explicit `history` overrides the
  // path; an explicit `history: ''` disables recording. The default keeps the
  // loopback posture (a file next to the process, not a service), and records
  // are evidence, never control — a failed append is a feed line, not a
  // failed turn.
  const historyPath = optimize?.history ?? '.feature-loop/runs.jsonl'
  const historyEnabled = historyPath.trim() !== ''
  if (historyEnabled) {
    // The records are written even when the dashboard is off: they are the
    // only thing that makes the next `--derive` possible, so a headless
    // deployment still learns. The feed line says so once, at load — not
    // per turn.
    state.note('note', `run history recording to ${historyPath}`)
  }
  // Keyed by (session, turn) so a resumed or repaired session that re-delivers
  // a turn closer never double-records: `turn/end` is a durable log row, and
  // exactly-once delivery is a property of the loop's append, not of this
  // listener.
  const recordedTurns = new Set<string>()
  // `historyEnabled` narrows `historyPath` to non-empty, but the closure
  // below cannot see that — so the path is captured once, inside the branch,
  // rather than asserted at the call site. A `!` here would trade a load-time
  // guarantee for a reader's trust exercise.
  // Resolved once here rather than per turn: `agents` is a service this plugin
  // already injects, and a listener closure can read it directly. Without it,
  // every record falls to the shared agent-less policy and reports zero steps
  // and zero cost for runs that did work.
  //
  // Read defensively rather than with a bare `ctx.get`: a deployment that mounts
  // no agent registry, and a test harness that stubs the context, both land here,
  // and neither should crash the plugin on the way to a fail-closed record.
  const agents = typeof ctx.get === 'function' ? ctx.get('agents') as AgentRegistry | undefined : undefined

  const disposeSession = !historyEnabled ? undefined : (() => {
    const path: string = historyPath
    // `global: true` because the harness emits `session/event` with `this` bound
    // to a per-session SCOPE CARRIER, and a hook that a scope filter rejects is
    // silently dropped. Measured 2026-10-04 on a real web run: the listener
    // receives the carrier's events with this set, and it is the documented
    // switch for "receive regardless of context filter checks" — so the
    // registration is not relying on the root context happening to be untagged.
    return ctx.on('session/event', (session: unknown, event: unknown) => {
      const end = asTurnEnd(event)
      if (end === undefined) return
      const key = `${sessionIdOf(session)}#${String(end.turn)}`
      if (recordedTurns.has(key)) return
      recordedTurns.add(key)
      // The gate is checked ONE more time here, because a phase can be finished
      // by the turn's very last step and a step-boundary check never gets to see
      // it. Without this a run that wrote a perfectly good research note and then
      // finished its turn left the pipeline in `research` with the note sitting
      // there, and the next turn re-entered a phase that was already done.
      const turnAgent = agentOfSession(session, resolveAgent)
      if (turnAgent !== undefined) advanceIfGated(policyFor(turnAgent), turnAgent)
      void recordTurn({
        session,
        event: end,
        openedAt: turnStartTime(session, end.turn),
        options,
        policyFor,
        resolveAgent,
        state,
        historyPath: path,
      })
        .catch((error: unknown) => {
          // A failed append must never fail the turn: the record is
          // evidence, not control. The feed line says so in the harness's
          // own words, and the next turn tries again.
          state.note('note', `run history append failed: ${error instanceof Error ? error.message : String(error)}`)
        })
    }, { global: true })
  })()

  const disposeStep = ctx.on('agent/pre-step', async ({ agent, turn, step }, next) => {
    const policy = policyFor(agent)
    // Price the settled attempts of the step(s) before this boundary FIRST:
    // a verdict computed against a budget that has not yet been told what the
    // previous attempt cost is a verdict one step late, and one step late is
    // exactly how a cost ceiling arrives after the money is gone.
    spendSettledUsage(policy, agent)

    // The pre-call guard, BEFORE `next()`.
    //
    // `next()` is where the model call happens, so anything computed after it
    // is a verdict on money already spent — which is exactly how this handler
    // behaved before: the ceiling for step N was evaluated after step N had been
    // paid for. The book is blunt about the order ("check remaining budget
    // BEFORE each LLM call — not after. Set the alert threshold at 90% of
    // budget, not 100%", p34), and the reason for the 90% is that the last 10%
    // pays for the terminal report.
    //
    // Deliberately cheap and deliberately early: a wall-clock check plus integer
    // comparisons, so it costs nothing on the hot path and cannot itself be the
    // reason a step is slow.
    const pipelineGuard = pipelinePreCallGuard(policy)
    if (pipelineGuard !== undefined) return pipelineGuard

    // The phase the run has just entered, if it changed since the last step. A
    // state machine nobody is told about is not a pipeline: a live run did all
    // the work correctly and produced no research note, no PRD and no pull
    // request, because nothing ever told the model a phase existed.
    const entered = phaseJustEntered(policy, turn, step, agent === undefined ? undefined : userGoalOf(agent))
    const base = await next()
    // The gate is evaluated after the step, because a phase can only have passed
    // it once the step has run. Injecting the next phase's rules here means the
    // model reads them with the result of the previous phase in context.
    // Evaluated on EVERY step, after the model has acted — not on the step that
    // announces the phase. A phase's gate can only have passed once the work
    // happened, so checking it on the way IN finds nothing written yet, the gate
    // fails, and the phase never leaves. That is exactly what a live run did:
    // research produced a perfectly good `docs/0-research.md` and the pipeline
    // sat on it until the ceiling stopped the run.
    const advanced = advanceIfGated(policy, agent)
    if (base.kind === 'reject') return base
    const { decision, notices, signals, judgeScore, budget } = await reviewStep(policy, step)
    // The step ran, so it counts against the phase's own step ceiling. Counted
    // after `next()` because a step that was rejected upstream never happened,
    // and counting it would spend budget on work the loop did not do.
    policy.pipeline?.budget.countStep(policy.pipeline.run.state as PipelinePhase)
    const runId = recordAgentMeta(state, agent)
    // Publish the phase alongside the step. One call, so the page can never show
    // a step count for a phase it has already moved past — the two update
    // together or not at all.
    publishPhase(state, runId, policy, stopArmed(policy))
    state.recordStep(runId, {
      step,
      ...policy.spec === undefined ? {} : { maxSteps: policy.spec.maxSteps },
      ...budget === undefined
        ? {}
        : {
            spentUSD: budget.spentUSD,
            budgetUSD: budget.budgetUSD,
            unpricedSteps: budget.unpricedSteps,
          },
    })
    state.recordSignals(runId, signals)
    if (judgeScore !== undefined) state.recordJudge(runId, judgeScore)
    // The notices ARE the run's story — budget stops, escalations, review
    // requests — in the harness's own words. One feed line each.
    for (const text of notices) state.note('note', text, runId)
    if (decision.kind === 'reject') return decision
    // The phase block rides with whatever else the step produced, so the model
    // reads it as one continuation rather than three interruptions.
    //
    // `entered` is DELIVERED, not merely used to decide whether to evaluate the
    // gate. The first version computed it and dropped it on the floor: the run did
    // the work correctly and produced no research note and no PRD, because
    // nothing ever reached the model. A state machine nobody is told about is
    // not a pipeline.
    const blocks = [entered, advanced?.notice].filter((t): t is string => t !== undefined && t.length > 0)
    const all = [...(decision.messages ?? []), ...blocks.map(notice)]
    return all.length === 0
      ? base
      : { ...base, messages: [...base.messages, ...all] }
  })

  const disposeRequest = ctx.on('agent/request', async ({ agent, step }, next) => {
    const resolved = await next()
    const policy = policyFor(agent)
    // The same drain as `agent/pre-step`. This handler fires per attempt, so
    // it also settles the last attempt of a run whose final step never gets
    // another pre-step — without it, the closing assistant message of a turn
    // would be the one attempt the meter never charges. The cursor dedupes.
    spendSettledUsage(policy, agent)
    const routed = routeForStep(policy, step, undefined)
    if (routed?.model !== undefined) {
      const runId = recordAgentMeta(state, agent)
      state.recordRoute(
        runId,
        routeLabel({
          ...routed.provider === undefined ? {} : { provider: routed.provider },
          model: routed.model,
        }),
      )
    }
    return routed === undefined ? resolved : { ...resolved, ...routed }
  })

  // The loop asks this at the moment it is about to end a turn, and breaks only
  // if the inbox is still empty afterwards. It is the seam that lets a
  // five-phase pipeline actually run five phases in one turn instead of stopping
  // wherever the model chooses to summarise.
  const disposeTurnStopping = ctx.on(
    'agent/turn-stopping',
    ({ agent }: { agent: Agent }) => {
      continueIfMidPipeline(agent, policyFor(agent))
    },
  )

  const disposeTools = ctx.on(
    'tools/pre-execute',
    async ({ agent, name: toolName, arguments: rawArgs }: ToolExecution, next: () => Promise<PreToolDecision>) => {
      const policy = policyFor(agent)

      // Record the call here: this is the only point where the tool name and its
      // parsed arguments are both known. The step's outcome is filled in below.
      policy.pending = { tool: toolName, argsKey: argsKey(rawArgs), error: false }

      // YOLO is answered here rather than by `gateForTool` because the envelope
      // needs the parsed arguments: the command line, the target path. A gate
      // that only sees a tool name cannot tell `git push origin fl/x` from
      // `git push origin main`, and that distinction is the entire boundary.
      const gate = gateEnforce(policy, toolName, rawArgs, stopArmed(policy))
      if (gate.kind === 'proceed') return next()

      // The call is blocked either way, and the call is *answered* rather than
      // dropped so the assistant's tool-call block still gets a result and
      // session replay stays valid.
      //
      // A denial is NOT an error for `error-cascade`, and a live run showed what
      // the old behaviour cost. Three refusals — a `/dev/null` write outside the
      // worktree, a `pwd;`-prefixed command, an interpreter — tripped the
      // cascade guard and ended a healthy research phase mid-flight, with the
      // model narrating: "3 consecutive failing steps". Those were the POLICY
      // working: the model read each denial, adapted, and kept going, which is
      // exactly what an unattended run must be able to do.
      //
      // A guard that fires because the loop was correctly told no three times is
      // the guard preventing the behaviour it exists to protect.
      //
      // The protection is not lost, it moves to the detector that owns it: a loop
      // hammering the SAME refused call is `tool-cycle`, which reads the pending
      // record set below. A denial is visible on the feed and on stderr either
      // way.
      // The refused call stays in the pending record, so `tool-cycle` still sees a
      // loop hammering the same denied command — the protection the cascade used
      // to give, now owned by the detector that is actually about repetition.
      if (policy.pending !== undefined) policy.pending.argsKey = `${argsKey(rawArgs)}#denied`
      // Only blocks hit the feed: logging every `auto` call would bury the
      // decisions a human opened this page to see.
      state.recordGate(
        recordAgentMeta(state, agent),
        toolName,
        gate.kind === 'deny' ? 'deny' : 'ask',
        gate.reason,
      )
      return gate.kind === 'deny'
        ? { kind: 'deny', reason: gate.reason }
        : { kind: 'ask', reason: gate.reason }
    },
  )


  // The outcome of a call that RAN — the only place `isError` exists.
  //
  // This one flag reaches BOTH consumers: `reviewStep` reads it as `failed`, which
  // feeds the ladder (`recordFailure`) and the detectors (`error-cascade` reads
  // the committed observation's `error`). `noteToolOutcomes` — the helper whose
  // own doc says `error-cascade` "could never fire in the plugin path" — turns
  // out to be UNNECESSARY once the flag is set here: the observation the helper
  // would have marked is written from this same `pending` a step later, with the
  // flag already carrying. Verified by removing both the helper call and this
  // flip: the cascade test fails; with only the flip it passes. So the helper has
  // no call site in src/ and is not given one (§1r).
  //
  // `policy.pending.error` used to be set in exactly one branch: the one where
  // the GATE blocks a call. So a `bash` that executed and exited 1 left it
  // `false`, `reviewStep` read the step as a success, and in a DSH deployment
  // the ladder climbed ONLY when the gate stopped the loop — never when the work
  // failed. `error-cascade` never counted a visibly failing run either. Measured
  // 2026-10-02 on a two-rung profile with the gate open for `bash`: two runs of
  // `cat /nonexistent` never produced a MODEL ESCALATION notice (§1q).
  const disposeResults = ctx.on(
    'tools/post-execute',
    (exec: { agent?: Agent }, result: { isError?: boolean }, next: () => Promise<unknown>) => {
      if (result.isError === true) {
        const policy = policyFor(exec.agent)
        if (policy.pending !== undefined) policy.pending.error = true
      }
      return next()
    },
  )

  return () => {
    // The probe closes over THIS context, so it must not outlive the plugin:
    // a disposed context's service lookup is a different question, and the
    // default is the safe one.
    setLiveClientProbe(() => false)
    disposeStep()
    disposeRequest()
    disposeTurnStopping()
    disposeTools()
    disposeResults()
    disposeSession?.()
    disposeApproval?.()
    if (dashboard !== undefined) void dashboard.stop()
    unsubscribeChanged()
    if (liveSource !== undefined) {
      void import('./remote.ts').then(m => m.unpublishLiveState(liveSource)).catch(() => undefined)
    }
  }
}

export { detectSignals, parseDashboardConfig, pendingIdFor, startDashboard, DashboardState }
export type { StepObservation }
export type { ApprovalOutcome, ApprovalQuestion, BriefNode, DashboardConfig, DashboardHandle, DashboardSnapshot }
export type { BriefConfig, BriefState } from './dashboard.ts'

/**
 * The `/loop` host command's outcome, for the composer to render.
 *
 * The command does not start model work itself — the harness owns turn
 * scheduling, and a command handler cannot inject one. Instead it returns
 * the task text back as the turn's user message: the composer submits the
 * outcome text as the turn, so the loop policies (ceilings, detectors, gate)
 * apply to it exactly as they do to any typed request.
 */
export interface LoopCommandOutcome {
  /** The task text to run the bounded loop over. */
  task: string
}

/**
 * Execute the `/loop` host command: `/loop <task>`.
 *
 * A bare `/loop` with no task is a usage error, not a silent no-op. The
 * task text is returned for the composer to submit as the turn — that is
 * what makes the feature-loop policies apply: the policies hang off the
 * agent loop's own hooks, so any turn runs bounded and gated, and `/loop`
 * is just the entry point that names the task.
 *
 * @param rawInput - exact text following the `/loop` command name.
 * @returns a success carrying the task text, or a usage error when empty.
 */
export function executeLoopCommand(rawInput: string): LoopCommandOutcome | { kind: 'error', text: string } {
  const task = rawInput.trim()
  if (task.length === 0) {
    return { kind: 'error', text: 'Usage: /loop <task> — describe what the bounded loop should do.' }
  }
  return { task }
}

/**
 * Build the turn text for `/product <goal>` — the 0→1 pipeline's front door.
 *
 * The PRD promises that one sentence starts the whole run, and until this
 * existed there was no way to do that: the pipeline was reachable only by
 * hand-editing the patch row, which is a configuration act, not a user one.
 * Every live verification of this work has driven it through a `--patch` overlay,
 * which is exactly the thing a user will not do.
 *
 * The text carries the phase spine so the model knows what it is in from the
 * first step, and it says plainly that the loop decides the gates — so a phase is
 * not mistaken for advice.
 *
 * It deliberately does NOT switch the deployment into YOLO or turn the pipeline
 * on. Those are the operator's calls, made in configuration where they are
 * visible and reversible; a command that silently escalated the gate would be the
 * opposite of the envelope's whole purpose.
 *
 * @param rawInput - exact text following the command name.
 * @returns the turn to submit, or a usage error.
 */
export function executeProductCommand(rawInput: string): LoopCommandOutcome | { kind: 'error'; text: string } {
  const goal = rawInput.trim()
  if (goal.length === 0) {
    return {
      kind: 'error',
      text: 'Usage: /product <goal> — one sentence describing the product to build, e.g. '
        + '"/product a CLI that converts Markdown tables to CSV".',
    }
  }
  return {
    task: [
      `Build this product: ${goal}`,
      '',
      'Run it as the 0→1 pipeline:',
      ...PHASE_ORDER.map((phase, i) => `${i + 1}. ${phase}`),
      '',
      'You will be told which phase you are in as each starts. Finish the phase you are in; the loop checks its',
      'gate and moves you on. When a gate is not satisfied you will be told exactly what is missing.',
      'Report what you completed, what you verified, and what remains.',
    ].join('\n'),
  }
}
/**
 * Default System One endpoint — the shared Laya sidecar on this machine.
 *
 * `:8092` is the native macOS service. The earlier default, `:8091`, was the
 * containerised sidecar, which is retired — so a `judge: laya` deployment that
 * set no `judgeBaseURL` reached a dead port, failed closed to detectors-only,
 * and said nothing. Override with `judgeBaseURL` or `SYSTEMONE_BASE_URL`.
 */
const DEFAULT_JUDGE_BASE_URL = process.env.SYSTEMONE_BASE_URL ?? 'http://127.0.0.1:8092'

/** Default System One model alias. */
const DEFAULT_SYSTEMONE_MODEL = process.env.SYSTEMONE_MODEL ?? 'laya'

/**
 * Build the judge a deployment configured.
 *
 * Before this existed the plugin hardcoded `NO_JUDGE`, so a profile could
 * configure `judge: laya`, see no error, and get detector-only reviews forever
 * — a silent no-op, which is the failure mode this repo's config blocks
 * otherwise refuse to allow. Now the kind is read and the client is real.
 *
 * `laya` needs nothing but a reachable sidecar, so it is built optimistically:
 * `OnegwJudge` latches itself off after one failed call and reports the reason
 * rather than stalling every step, so an unreachable Laya costs one timeout and
 * then degrades to the detectors — the documented posture in `laya.ts`.
 *
 * `chat` costs money per judged step, so it fails at *load* when no gateway key
 * is present, the same rule the brief explainer follows: a configured judge
 * that silently never runs is worse than a loud refusal to start.
 *
 * @param config - the judge fields from the patch row.
 * @returns the judge, and a label naming which one for the dashboard's status.
 * @throws Error when `chat` was asked for with no reachable key.
 */
export function resolveJudge(config: JudgeConfig): { judge: Judge, label: string } {
  const kind = config.judge ?? 'none'
  if (kind === 'none') return { judge: NO_JUDGE, label: 'none (detectors only)' }
  if (kind === 'laya') {
    const baseURL = config.judgeBaseURL ?? process.env.SYSTEMONE_BASE_URL ?? DEFAULT_JUDGE_BASE_URL
    const model = config.systemOneModel ?? process.env.SYSTEMONE_MODEL ?? DEFAULT_SYSTEMONE_MODEL
    return {
      judge: new OnegwJudge({ baseURL, model, timeoutMs: config.judgeTimeoutMs ?? 5_000 }),
      label: `systemone (${model} @ ${baseURL})`,
    }
  }
  const apiKey = process.env.ONEGW_API_KEY ?? process.env.ONEGE_API_KEY ?? readCredentialsKey()
  if (apiKey === undefined) {
    throw new Error(
      'judge is "chat" but no gateway key was found: set ONEGW_API_KEY (or ONEGE_API_KEY) '
      + 'in the environment, or add it to ~/.dsh/.credentials.yaml. '
      + 'Use judge: laya for a local judge that needs no key, or judge: none for detectors only.',
    )
  }
  // `execution`, onegw's EXECUTION role alias — the same route every ladder in
  // this repo names, and the only one verified against the live gateway
  // (2026-10-03: POST /v1/chat/completions {"model":"execution"} -> 200).
  // It used to be `xiaomi/mimo-v2.5`, a concrete id this repo does not
  // declare anywhere and no shipped config mentions: a deployment that set
  // `judge: chat` without also setting `judgeModel` was asking a model no
  // test had ever run, which is the same "resolves but was never tested"
  // shape §1a records for the ladder — one rung over, and invisible because
  // nothing reads a judge's model except the judge itself.
  const model = config.judgeModel ?? 'execution'
  return {
    judge: createChatJudge({
      llm: createOnegwClient({
        baseURL: process.env.ONEGE_BASE_URL ?? 'http://127.0.0.1:8080/v1',
        apiKey,
      }),
      model,
    }),
    label: `chat (${model})`,
  }
}
/** How a deployed plugin picks its judge, from the patch row. */
export interface JudgeConfig {
  /** `none` (detectors only) | `chat` (metered) | `laya` (local, free). */
  judge?: 'none' | 'chat' | 'laya'
  /** System One base URL — Laya, or hosted Jev/TypeSafe on the same wire. */
  judgeBaseURL?: string
  /** Model alias the System One provider routes to. */
  systemOneModel?: string
  /** Model the `chat` judge uses. */
  judgeModel?: string
  /** Deadline for one judge call, in ms. Defaults to 5000. */
  judgeTimeoutMs?: number
}
