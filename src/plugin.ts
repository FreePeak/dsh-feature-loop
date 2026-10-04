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
import type { PipelinePhase } from './phases.ts'
import { ModelLadder, routeLabel } from './routing.ts'
import { AttentionRouter, ReviewGate, judgeQuestion } from './review.ts'
import type { GatePolicy } from './review.ts'
import { detectSignals } from './signals.ts'
import type { ReviewSignal, StepObservation } from './signals.ts'
import { envelope, envelopeCommand } from './yolo.ts'
import { startSandbox } from './driver.ts'
import { spawnSync } from 'node:child_process'
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
// Type-only: `summarize` reads data, never the disk, so the module ships no
// fs imports into the plugin's graph (the same stance `metrics.ts` documents
// for its own `RunRecord` import). The history I/O (`runlog.ts`) is loaded
// dynamically only when a deployment configures `optimize.history`, so a
// deployment that never asked for run-history keeps the plugin's graph
// exactly as it was before this feature existed.
import { summarize } from './metrics.ts'
import type { RunRecord } from './runlog.ts'
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
  /** Derive envelopes from run history before running. Accepted, not yet acted on. */
  derive?: boolean
  /** Run-history file the envelope and metrics are derived from. */
  history?: string
  /** Judge backend for cross-pass scoring. Accepted, not yet acted on. */
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

  // Commit the previous step's observed tool call before the detectors run, so
  // they read a complete history. A step that ran no tool still gets an
  // observation: "a step that did nothing" is itself a signal worth detecting,
  // and skipping it would let a silent spin loop look like a healthy one.
  if (step > 1) {
    const pending = policy.pending
    policy.history.push({
      index: step - 1,
      tool: pending?.tool,
      argsKey: pending?.argsKey,
      costUSD: 0,
      error: pending?.error ?? false,
    })
    policy.pending = undefined
    policy.router.observeStep()
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
export function gateForTool(
  policy: FeatureLoopPolicy,
  toolName: string,
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
  const reason = reviewText(decision.reason, decision.source)
  // The mode decides *how* the human is asked, never *whether* the call is
  // questioned: both branches stop the call, and `ask` still fails closed if no
  // approval channel answers.
  return policy.gateMode === 'deny'
    ? { kind: 'deny', reason }
    : { kind: 'ask', reason }
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
export const STOP_SENTINEL = '.feature-loop/STOP'

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
  if (policy.gateMode !== 'auto') return gateForTool(policy, toolName)
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
    ? { kind: 'deny', reason: `YOLO ENVELOPE — ${decision.reason}` }
    : { kind: 'proceed' }
}

/**
 * Run one command in the plugin, for the sandbox's `git worktree add`.
 *
 * The one shell-out this package makes on the agent path, and it exists for a
 * containment property that cannot be had any other way. The command is a fixed
 * argv — no model text reaches it — and `envelopeCommand` is still consulted so
 * a future edit that widened it would be denied rather than executed.
 *
 * @param command - the executable.
 * @param args - its arguments.
 * @param cwd - the directory to run in.
 * @returns the exit code and captured streams.
 */
function spawnCommand(command: string, args: string[], cwd: string): { code: number; stdout: string; stderr: string } {
  if (envelopeCommand([command, ...args].join(' ')).kind === 'deny') {
    return { code: 126, stdout: '', stderr: `refused by the envelope: ${command} ${args.join(' ')}` }
  }
  try {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      timeout: 60_000,
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
 * Say, once, that a YOLO run has no containment.
 *
 * Written to stderr rather than the dashboard feed because the dashboard may not
 * be mounted, and this is the single line that separates "the gate is broken"
 * from "there is no worktree to contain writes in" when someone reads a log.
 */
function noteSandboxFailure(policy: FeatureLoopPolicy, error: unknown): void {
  const reason = error instanceof Error ? error.message : String(error)
  process.stderr.write(
    `dsh-feature-loop: YOLO run "${runIdLabel(policy)}" has no worktree — every write will be DENIED. ${reason}\n`,
  )
}

/** A stable label for a policy's run, for one line of diagnostics. */
function runIdLabel(policy: FeatureLoopPolicy): string {
  return policy.spec?.goal.slice(0, 60) ?? 'untitled'
}

/**
 * Project the run's current phase onto the dashboard row.
 *
 * A no-op for a policy with no pipeline, which is what keeps the rail off the
 * page entirely for an ordinary bounded loop rather than showing five stages
 * that will never change.
 *
 * The phase's own spend is published beside the run's total because the two
 * answer different questions, and the rail's meter reads the phase's: "can this
 * phase afford another step" is the question a five-phase run actually stalls
 * on, because the run total only ever goes up.
 *
 * `evidenceDir` and `prUrl` are deliberately NOT published here. Neither is
 * known until the run has produced them — the bundle path depends on the run's
 * id and the URL arrives at the very end — and a rail that shows a link to a
 * directory that does not exist yet is worse than one that shows the link once
 * there is something behind it.
 *
 * @param state - the dashboard state to write.
 * @param runId - the run's row.
 * @param policy - the agent's policies.
 * @param armed - whether the kill switch is set.
 */
/**
 * Give a YOLO run its worktree, once.
 *
 * Only `gateMode: 'auto'` runs get one. A supervised run is already contained by
 * the harness's own file policy and gains nothing from a throwaway checkout, so
 * creating one would spend a branch and a directory on a run that never needed
 * it.
 *
 * Idempotent, because `policyFor` can be reached more than once for the same
 * agent — a second `git worktree add` on the same path fails, and a failed
 * containment attempt must not be retried into a different path.
 *
 * Failure is a **feed line, not a throw**. A `SandboxError` means this machine
 * is not a git repository, or git refused; either way the run continues with no
 * `worktreeRoot`, and the envelope then denies every write. Refusing to start
 * would be safer, but the harness has no seam to refuse a turn from here, and a
 * loop that silently writes to the user's checkout is the outcome that must not
 * happen — so the envelope's fail-closed default is what carries it.
 *
 * @param policy - the run's policy, mutated in place.
 * @param agent - the agent whose session carries the workspace path.
 * @param options - the deployment config, for the gate mode.
 */
function attachSandbox(policy: FeatureLoopPolicy, agent: Agent, options: { gateMode?: GateMode }): void {
  if (policy.gateMode !== 'auto') return
  if (policy.worktreeRoot !== undefined) return
  if (policy.pipeline === undefined) return
  const root = sessionCwdOf(agent)
  if (root === undefined || root.length === 0) return
  try {
    const sandbox = startSandbox({
      repoRoot: root,
      goal: policy.spec?.goal ?? 'feature-loop run',
      runId: runIdOf(agent),
      run: policy.pipeline.run,
      budget: policy.pipeline.budget,
      config: {},
      runner: spawnCommand,
    })
    policy.worktreeRoot = sandbox.worktreeRoot
    if (policy.pipeline !== undefined) policy.pipeline.worktree = sandbox
  } catch (error) {
    // Recorded where an operator will see it. The run keeps going with no
    // containment, which the envelope reads as "deny every write".
    noteSandboxFailure(policy, error)
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
  if (policy.pricedThroughSeq === undefined) {
    policy.pricedThroughSeq = typeof session.seq === 'number' ? session.seq : 0
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
function asTurnEnd(event: unknown): { turn: number, reasonKind: string } | undefined {
  if (event === null || typeof event !== 'object') return undefined
  const record = event as { readonly type?: unknown, readonly data?: unknown }
  if (record.type !== 'turn/end') return undefined
  if (record.data === null || typeof record.data !== 'object') return undefined
  const data = record.data as { readonly turn?: unknown, readonly reason?: unknown }
  if (typeof data.turn !== 'number' || !Number.isFinite(data.turn)) return undefined
  const reason = data.reason as { readonly kind?: unknown } | null | undefined
  if (reason === null || typeof reason !== 'object' || typeof reason.kind !== 'string') return undefined
  return { turn: data.turn, reasonKind: reason.kind }
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
export function isTurnEnd(event: unknown): { turn: number, reasonKind: string } | undefined {
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
  event: { turn: number, reasonKind: string }
  options: Parameters<typeof createPolicy>[0] & { dashboard?: DashboardConfig }
  policyFor: (agent: Agent | undefined) => FeatureLoopPolicy
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
function outcomeOf(reasonKind: string, policy: FeatureLoopPolicy): RunOutcome {
  if (reasonKind === 'aborted') return 'aborted'
  if (reasonKind === 'error') return 'error'
  if (reasonKind === 'blocked') return 'blocked'
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
 * Two loads are dynamic, both deliberate:
 *
 * - `runlog.ts` (fs + crypto) is imported only here so the plugin's static
 *   graph ships no `node:fs` (see the import comment at the top of this
 *   module). `metrics.ts` is static because it is pure arithmetic.
 * - `optimize.ts` is NOT imported: `planEnvelope`'s P95 derivation belongs to
 *   the CLI's pre-run planning, not to a per-turn hook. What the dashboard
 *   needs is the roll-up (`summarize`), which is already imported statically.
 *
 * @param input - the closed turn and everything the record is built from.
 */
async function recordTurn(input: TurnRecordInput): Promise<void> {
  const { session, event, options, policyFor, state, historyPath, agents } = input
  const runlog = await import('./runlog.ts')
  const agent = agentOfSession(agents, session)
  const policy = policyFor(agent)
  const snapshot = policy.budget?.snapshot()
  const spec = policy.spec ?? options.spec
  const now = Date.now()
  const steps = snapshot?.steps ?? 0
  const record: RunRecord = {
    runId: sessionIdOf(session),
    startedAt: now,
    endedAt: now,
    pass: 1,
    passes: 1,
    taskKey: spec === undefined ? 'none' : runlog.taskKeyOf(spec.goal),
    outcome: outcomeOf(event.reasonKind, policy),
    steps,
    maxSteps: spec?.maxSteps ?? 0,
    costUSD: snapshot?.spentUSD ?? 0,
    budgetUSD: spec?.costBudgetUSD ?? 0,
    unpricedSteps: snapshot?.unpricedSteps ?? 0,
    byRoute: snapshot === undefined ? {} : { ...snapshot.byRoute },
    stepLatencyMs: [],
    wallMs: 0,
    latencyKind: 'round-trip',
    signals: policy.history.length === 0 ? [] : policy.history.map(() => ({ kind: 'detector', severity: 'info' })),
    judgeScores: [],
    reviewFraction: 0,
    specFingerprint: spec === undefined ? 'none' : runlog.specFingerprint(spec),
  }
  runlog.appendRecord(historyPath, record)
  // The Metrics panel reads what just landed: the roll-up is over the file,
  // not over memory, so a resumed process that never saw the earlier turns
  // still renders their history. A torn line is counted and skipped by the
  // reader, never thrown — the panel shows a smaller history, not an error.
  const { records, malformed } = runlog.readRecords(historyPath)
  state.setMetrics(summarize(records, { malformed }))
}

/**
 * The agent behind a session, via the harness's own registry.
 *
 * This used to return `undefined` unconditionally, with a note describing the
 * upgrade path. Running the loop for real showed what that cost: the
 * `turn/end` handler looked the policy up by this, so every run record was
 * written against the shared agent-less policy — which never sees a step,
 * because steps land on the per-agent policy. The result was a history file full
 * of `steps: 0, costUSD: 0` records for runs that had demonstrably done work.
 *
 * That is the failure this package's own PRD names: a module that looks wired and
 * silently does nothing. The ceiling is not worth having when it is reported as
 * zero, and a `$0.00` history is worse than no history — it is believed.
 *
 * `ctx.agents.get(sessionId)` is the documented registry lookup, and this plugin
 * already injects `agents`, so there was never a second injection to add.
 *
 * @param agents - the harness agent registry.
 * @param session - the session the event belongs to.
 * @returns the agent, or `undefined` when the session has none yet — which is a
 *   real state for a session whose agent was never created, not an error.
 */
function agentOfSession(agents: AgentRegistry | undefined, session: unknown): Agent | undefined {
  if (agents === undefined) return undefined
  const id = sessionIdOf(session)
  if (id === undefined || id.length === 0) return undefined
  // The registry is keyed by a branded `SessionId`. The id read here is that
  // brand at runtime — a string that came from the session itself — so it needs
  // no cast and no re-validation.
  return agents.get(id as Parameters<AgentRegistry['get']>[0]) ?? undefined
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
  options: Parameters<typeof createPolicy>[0] & { dashboard?: DashboardConfig, rowConfig?: Record<string, unknown> } = {},
): () => void {
  const policies = new WeakMap<Agent, FeatureLoopPolicy>()
  const fresh = (): FeatureLoopPolicy => createPolicy(options)
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
      attachSandbox(policy, agent, options)
    }
    return policy
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
    return ctx.on('session/event', (session: unknown, event: unknown) => {
      const end = asTurnEnd(event)
      if (end === undefined) return
      const key = `${sessionIdOf(session)}#${String(end.turn)}`
      if (recordedTurns.has(key)) return
      recordedTurns.add(key)
      void recordTurn({ session, event: end, options, policyFor, state, historyPath: path, agents })
        .catch((error: unknown) => {
          // A failed append must never fail the turn: the record is
          // evidence, not control. The feed line says so in the harness's
          // own words, and the next turn tries again.
          state.note('note', `run history append failed: ${error instanceof Error ? error.message : String(error)}`)
        })
    })
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

    const base = await next()
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
    return notices.length === 0
      ? base
      : { ...base, messages: [...base.messages, ...(decision.messages ?? [])] }
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
      // A blocked call is a step that made no progress, so `error-cascade`
      // counts it. Treating a block as success would let a repeatedly-blocked
      // loop read as a healthy one.
      policy.pending.error = true
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

  return () => {
    disposeStep()
    disposeRequest()
    disposeTools()
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
  const model = config.judgeModel ?? 'xiaomi/mimo-v2.5'
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
