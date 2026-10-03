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
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
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
import { ModelLadder, routeLabel } from './routing.ts'
import { AttentionRouter, ReviewGate, judgeQuestion } from './review.ts'
import type { GatePolicy } from './review.ts'
import { detectSignals } from './signals.ts'
import type { ReviewSignal, StepObservation } from './signals.ts'
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
import { appendRecord, readRecords, specFingerprint, taskKeyOf } from './runlog.ts'
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
    /**
     * The outcome of a tool call that RAN. `tools/pre-execute` runs before the
     * body, so only this event can report `isError` — and without it a failed
     * command is indistinguishable from a successful one at the step boundary.
     *
     * Declared locally for the same reason as `approval/request`: the package
     * that owns this event is not among this repo's installed peers, so its
     * `Events` augmentation is absent and `ctx.on('tools/post-execute', …)`
     * would not typecheck at all.
     */
    'tools/post-execute'(
      this: unknown,
      exec: { agent?: Agent, call?: { id?: string }, name?: string },
      result: { isError?: boolean },
      next: () => Promise<unknown>,
    ): Promise<unknown>;
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
 */
export type GateMode = 'ask' | 'deny'

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
  if (!watcherActive()) {
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
      policy.budget.spend(provider, model, data.usage)
    }
    if (advanced) policy.pricedThroughSeq = seq + 1
  }
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
  if (typeof at !== 'function' || typeof seq !== 'number') return undefined
  for (let cursor = seq - 1; cursor >= 0 && cursor >= seq - 200; cursor -= 1) {
    const event = at(cursor)
    if (event === undefined || event === null || typeof event !== 'object') continue
    if (event.type !== 'turn/start') continue
    const data = event.data as { readonly turn?: unknown } | null | undefined
    if (data === null || typeof data !== 'object' || data.turn !== turn) continue
    return typeof event.time === 'number' && Number.isFinite(event.time) ? event.time : undefined
  }
  return undefined
}

async function recordTurn(input: TurnRecordInput): Promise<void> {
  const { session, event, openedAt, options, policyFor, resolveAgent, state, historyPath } = input
  const agent = agentOfSession(session, resolveAgent)
  const policy = policyFor(agent)
  const snapshot = policy.budget?.snapshot()
  const spec = policy.spec ?? options.spec
  const now = Date.now()
  const steps = snapshot?.steps ?? 0
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
  }
  appendRecord(historyPath, record)
  // The Metrics panel reads what just landed: the roll-up is over the file,
  // not over memory, so a resumed process that never saw the earlier turns
  // still renders their history. A torn line is counted and skipped by the
  // reader, never thrown — the panel shows a smaller history, not an error.
  const { records, malformed } = readRecords(historyPath)
  state.setMetrics(summarize(records, { malformed }))
}

/**
 * The agent behind a session, when the harness can resolve one.
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
    try {
      const agents = (ctx as { agents?: { get?: (id: string) => Agent | undefined } }).agents
      const get = agents?.get
      if (typeof get !== 'function') return undefined
      return get.call(agents, sessionId)
    } catch {
      return undefined
    }
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
    const base = await next()
    if (base.kind === 'reject') return base
    const { decision, notices, signals, judgeScore, budget } = await reviewStep(policy, step)
    const runId = recordAgentMeta(state, agent)
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

  const disposeTools = ctx.on(
    'tools/pre-execute',
    async ({ agent, name: toolName, arguments: rawArgs }: ToolExecution, next: () => Promise<PreToolDecision>) => {
      const policy = policyFor(agent)

      // Record the call here: this is the only point where the tool name and its
      // parsed arguments are both known. The step's outcome is filled in below.
      policy.pending = { tool: toolName, argsKey: argsKey(rawArgs), error: false }

      const gate = gateForTool(policy, toolName, rawArgs)
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
