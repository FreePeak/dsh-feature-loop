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
import type { BudgetSnapshot, UsageReading } from './budget.ts'
import { ModelLadder, routeLabel } from './routing.ts'
import { AttentionRouter, ReviewGate, judgeQuestion } from './review.ts'
import type { GatePolicy } from './review.ts'
import { detectSignals } from './signals.ts'
import type { ReviewSignal, StepObservation } from './signals.ts'
import { parseDashboardConfig, pendingIdFor, startDashboard, DashboardState } from './dashboard.ts'
import type { ApprovalOutcome, ApprovalQuestion, BriefNode, DashboardConfig, DashboardHandle, DashboardSnapshot } from './dashboard.ts'
import { prepareReview, resolveReversibility } from './agent-policy.ts'
import { validateSpec } from './spec.ts'
import type { LoopSpec } from './spec.ts'
import type { OptimizeConfig } from './spec.ts'
import { NO_JUDGE } from './laya.ts'
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
  const { session, event, options, policyFor, state, historyPath } = input
  const runlog = await import('./runlog.ts')
  const agent = agentOfSession(session)
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
 * The agent behind a session, when the harness can resolve one.
 *
 * `session/event` hands the session, not the agent — but the per-agent policy
 * (budget, spec, history) is keyed by agent. Rather than importing the agents
 * service (a second service injection for one lookup), this reads the session's
 * owner structurally: the harness sets `session.owner`/`session.agentId`
 * depending on the release, and neither is stable enough to depend on. When
 * neither resolves, the record falls back to the agent-less policy — the same
 * fail-closed stance `policyFor` takes for agent-less calls: shared ceilings,
 * honestly labelled, rather than no record at all.
 *
 * ponytail: O(n) scan over the policy map per turn is avoided by NOT caching
 * here at all — the lookup below is O(1) only when the harness exposes the
 * agent directly on the session. Ceiling: when it does not, every turn records
 * against the shared agent-less policy, so per-agent spend splits are lost and
 * concurrent agents' records share one budget's numbers. Upgrade path: inject
 * the `agents` service and resolve `session.id` through it (the
 * `goal-round-driver` precedent: `ctx.agents.get(session.id)`).
 */
function agentOfSession(_session: unknown): Agent | undefined {
  return undefined
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
  dashboard: DashboardHandle,
  requestBrief: (id: string, question: ApprovalQuestion) => void = () => undefined,
): () => void {
  return ctx.on(
    'approval/request',
    (question: ApprovalQuestion, next: () => Promise<ApprovalOutcome>) => {
      const claimed = dashboard.answer(question, next)
      // Fire-and-forget deliberately: the brief must never gate the ask.
      // `answer` registers the pending entry synchronously before returning
      // the promise, but the entry's id is internal to the dashboard, so the
      // brief request re-reads the snapshot and matches on the ask's own
      // fields. A settled-before-brief ask simply matches nothing.
      void Promise.resolve().then(() => {
        const id = pendingIdFor(dashboard.pendingSnapshot(), question)
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
 * @param args - the dashboard, explainer, pending id, and question.
 */
export async function requestBrief(args: {
  dashboard: DashboardHandle
  explainer: Explainer
  id: string
  question: ApprovalQuestion
}): Promise<void> {
  const { dashboard, explainer, id, question } = args
  dashboard.briefs.markBriefPending(id)
  let code: string | undefined
  try {
    code = await explainer.explain(briefInputFor(question), question.signal)
  } catch {
    code = undefined
  }
  if (code === undefined) {
    dashboard.briefs.recordBrief(id, undefined)
    return
  }
  const normalized = normalizeBrief(code)
  const nodes: BriefNode[] | undefined = 'nodes' in normalized ? normalized.nodes : undefined
  dashboard.briefs.recordBrief(id, nodes)
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
  // Enabled by default: omitting the block starts the page on 127.0.0.1:8100
  // with a per-start token. The posture stays loopback-only (the only hosts
  // the config accepts are 127.0.0.1 and the container-internal 0.0.0.0), and
  // `answers: false` (observe-only) or `enabled: false` (no server at all)
  // are one field away for deployments that want less. The composer panel
  // keeps working either way — the answerer claims a request only while a
  // dashboard tab is actually connected.
  const state = new DashboardState()
  // Validate even when the dashboard is off: a bad field is a typo someone
  // will flip `enabled: true` on later, and it must fail at load, then —
  // not silently refuse to bind. `startDashboard` re-parses below; the
  // duplicate parse is one-time at load and keeps the fail-loud check
  // unconditional.
  parseDashboardConfig(options.dashboard ?? {})
  const dashboard = (options.dashboard?.enabled ?? true)
    ? startDashboard(options.dashboard ?? {}, state)
    : undefined
  // The brief's explainer: explicit injection wins (tests, custom transports);
  // otherwise the dashboard's `brief:` row builds one from the deployment's
  // gateway env. Anything that fails here — no key, no model — is a loud
  // load-time error, never a silent missing brief: `resolveBriefExplainer` is
  // only reached when briefs were explicitly enabled, so failing here is
  // failing on what the operator asked for. The started server is stopped
  // before throwing: a load failure must not leak a listening socket.
  let briefExplainer: Explainer
  try {
    briefExplainer = options.explainer
      ?? (dashboard === undefined
        ? NO_EXPLAINER
        : resolveBriefExplainer(options.dashboard?.brief))
  } catch (error: unknown) {
    if (dashboard !== undefined) void dashboard.stop()
    throw error
  }
  const disposeApproval = dashboard === undefined
    ? undefined
    : attachApprovalAnswerer(ctx, dashboard, (id, question) => {
      const agent = question.agent as Agent | undefined
      void requestBrief({
        dashboard,
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
    return ctx.on('session/event', (session: unknown, event: unknown) => {
      const end = asTurnEnd(event)
      if (end === undefined) return
      const key = `${sessionIdOf(session)}#${String(end.turn)}`
      if (recordedTurns.has(key)) return
      recordedTurns.add(key)
      void recordTurn({ session, event: end, options, policyFor, state, historyPath: path })
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
  }
}

export { detectSignals, parseDashboardConfig, pendingIdFor, startDashboard, DashboardState }
export type { StepObservation }
export type { ApprovalOutcome, ApprovalQuestion, BriefNode, DashboardConfig, DashboardHandle, DashboardSnapshot }
export type { BriefConfig, BriefState } from './dashboard.ts'
