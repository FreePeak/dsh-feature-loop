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

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
import { MessageId } from '@deepseek-ai/dsh-llm'
import type { LlmCallConfig, UserMessage } from '@deepseek-ai/dsh-llm'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'
import { LoopBudget } from './budget.ts'
import type { BudgetSnapshot } from './budget.ts'
import { ModelLadder, routeLabel } from './routing.ts'
import { AttentionRouter, ReviewGate, judgeQuestion } from './review.ts'
import type { GatePolicy } from './review.ts'
import { detectSignals } from './signals.ts'
import type { ReviewSignal, StepObservation } from './signals.ts'
import { parseDashboardConfig, startDashboard, DashboardState } from './dashboard.ts'
import type { ApprovalOutcome, ApprovalQuestion, DashboardConfig, DashboardHandle, DashboardSnapshot } from './dashboard.ts'
import { prepareReview, resolveReversibility } from './agent-policy.ts'
import { validateSpec } from './spec.ts'
import type { LoopSpec } from './spec.ts'
import { NO_JUDGE } from './laya.ts'
import type { Judge } from './laya.ts'
import { budgetStopText, budgetWarnText, escalationText, reviewText } from './messages.ts'

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
 * Wrap notice text as a plugin-sourced user message.
 *
 * The notices reach both the model and the human reading the transcript, which
 * is the whole point of delivering them this way: a review the model cannot see
 * is a review it will walk straight past on the next step.
 *
 * @param text - the notice text.
 * @returns a user-role message attributed to this plugin.
 */
function notice(text: string): UserMessage {
  return {
    id: MessageId(randomUUID()),
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'plugin', plugin: name },
  }
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
  ladder: ModelLadder | undefined
  router: AttentionRouter
  gate: ReviewGate | undefined
  judge: Judge
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
 * How a gate-raised review is expressed at the tool boundary.
 *
 * - `ask`  — hand the decision to the approval channel (Web UI prompt). Fails
 *            closed to a refusal when no channel is mounted.
 * - `deny` — refuse outright, never prompting. For unattended and CI runs.
 */
export type GateMode = 'ask' | 'deny'

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
  return {
    spec,
    budget,
    ladder,
    router,
    gate,
    gateMode: options.gateMode ?? 'ask',
    judge: options.judge ?? NO_JUDGE,
    history: [],
    pending: undefined,
    lastConfidence: undefined,
  }
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

  const routed = policy.router.route(preparation.signals, undefined, policy.lastConfidence)
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
 * @param ctx - the cordis context to install into.
 * @param dashboard - the started dashboard whose `answer` drives the claim.
 * @returns a disposer removing the listener.
 */
export function attachApprovalAnswerer(ctx: Context, dashboard: DashboardHandle): () => void {
  return ctx.on(
    'approval/request',
    (question: ApprovalQuestion, next: () => Promise<ApprovalOutcome>) =>
      dashboard.answer(question, next),
    { prepend: true },
  )
}

/**
 * Name of this plugin, as the harness addresses it.
 */
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
  options: Parameters<typeof createPolicy>[0] & { dashboard?: DashboardConfig } = {},
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
    }
    return policy
  }

  // The dashboard is process-wide (one server, one feed), not per agent — it
  // lives here rather than in `createPolicy`, whose policies are per-run.
  const state = new DashboardState()
  if (options.dashboard !== undefined) {
    // Validate even when the dashboard is off: a bad field is a typo someone
    // will flip `enabled: true` on later, and it must fail at load, then —
    // not silently refuse to bind. `startDashboard` re-parses below; the
    // duplicate parse is one-time at load and keeps the fail-loud check
    // unconditional.
    parseDashboardConfig(options.dashboard)
  }
  const dashboard = options.dashboard?.enabled === true
    ? startDashboard(options.dashboard, state)
    : undefined
  const disposeApproval = dashboard === undefined
    ? undefined
    : attachApprovalAnswerer(ctx, dashboard)
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

  const disposeStep = ctx.on('agent/pre-step', async ({ agent, turn, step }, next) => {
    const policy = policyFor(agent)
    const base = await next()
    if (base.kind === 'reject') return base
    const { decision, notices, signals, judgeScore, budget } = await reviewStep(policy, step)
    const runId = runIdOf(agent)
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
    const routed = routeForStep(policy, step, undefined)
    if (routed?.model !== undefined) {
      state.recordRoute(
        runIdOf(agent),
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

      const gate = gateForTool(policy, toolName)
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
        runIdOf(agent),
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
    disposeApproval?.()
    if (dashboard !== undefined) void dashboard.stop()
  }
}

export { detectSignals, parseDashboardConfig, startDashboard, DashboardState }
export type { StepObservation }
export type { ApprovalOutcome, ApprovalQuestion, DashboardConfig, DashboardHandle, DashboardSnapshot }
