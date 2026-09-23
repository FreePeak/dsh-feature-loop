/**
 * The loop runner: the eight dimensions, executed.
 *
 * This is the standalone path — a loop you can run from a terminal against any
 * OpenAI-compatible gateway. It shares every policy module with the DSH plugin
 * (`budget`, `routing`, `signals`, `review`, `spec`) and differs only in who
 * owns transport and session state. That seam is deliberate: if the loop's
 * behaviour changed depending on which transport sat under it, the policies
 * would not be policies, they would be suggestions.
 *
 * The step order below is the whole design, and it is ordered so that nothing
 * expensive happens before the cheap reasons to stop:
 *
 * 1. Budget verdict — arithmetic, no model call. A run that is already over
 *    its ceiling must not spend money discovering that.
 * 2. Route decision — arithmetic, no model call.
 * 3. Detectors — arithmetic, no model call. A cycle is visible without asking
 *    anyone.
 * 4. Judge — one cheap local call, only when the detectors found something or
 *    the attention budget still has room.
 * 5. Review — the human, only when 1–4 say so.
 * 6. The model call, and the tools it asks for.
 * 7. Success check — the observable condition, independent of what the model
 *    claims. This is the book's "separate success from stopping": the model
 *    saying it is finished is not evidence that it is.
 *
 * @module dsh-feature-loop/runner
 */

import type { LoopTool, ToolResult } from './tools.ts'
import type { LlmClient, LlmMessage, LlmToolCall } from './llm.ts'
import { LlmCallError } from './llm.ts'
import { LoopBudget } from './budget.ts'
import { ModelLadder } from './routing.ts'
import type { EscalationReason } from './routing.ts'
import { detectSignals } from './signals.ts'
import type { ReviewSignal, StepObservation } from './signals.ts'
import { AttentionRouter, ReviewGate, judgeQuestion } from './review.ts'
import type { GatePolicy, ReviewDecision, RouterConfig } from './review.ts'
import type { Judge } from './laya.ts'
import type { SystemOneQuestion } from './laya.ts'
import { NO_JUDGE } from './laya.ts'
import { describeEnvelope, validateSpec } from './spec.ts'
import type { LoopSpec } from './spec.ts'
import type { Phase } from './prompts.ts'
import { budgetWarnText, escalationText } from './messages.ts'

/** How a run ended. */
export type Outcome =
  /** The success condition held. The only outcome that means "done". */
  | 'goal-met'
  /** A ceiling stopped the run. */
  | 'budget-stop'
  /** The model stopped without the success condition holding, repeatedly. */
  | 'model-stop'
  /** The operator declined at a review gate. */
  | 'aborted'
  /** The detectors saw a critical signal the operator did not clear. */
  | 'blocked'
  /** The gateway or the loop itself failed. */
  | 'error'

/** A review the operator is being asked to make. */
export interface ReviewRequest {
  step: number
  decision: ReviewDecision
  /** The signals that contributed, if any. */
  signals: ReviewSignal[]
  /** What the loop is about to do, in one line. */
  pending: string
}

/** What the operator answered. */
export type ReviewVerdict =
  | { kind: 'continue' }
  | { kind: 'abort'; reason: string }

/** One transcript entry, for the demo's narration and for tests. */
export type LoopEvent =
  | { kind: 'run-start', envelope: string, goal: string }
  | { kind: 'step-start', step: number, route: string, spentUSD: number }
  | { kind: 'route', step: number, route: string, reason: EscalationReason }
  | { kind: 'budget', step: number, level: 'warn' | 'stop', reason: string }
  | { kind: 'signals', step: number, signals: ReviewSignal[] }
  | { kind: 'judge', step: number, score: number | undefined, error?: string }
  | { kind: 'review', step: number, decision: ReviewDecision }
  | { kind: 'assistant', step: number, content: string }
  | { kind: 'tool', step: number, tool: string, ok: boolean, preview: string, reversibility: string }
  | { kind: 'success-check', step: number, ok: boolean, output: string }
  | { kind: 'run-end', outcome: Outcome, steps: number, spentUSD: number, reviews: number, reviewFraction: number }

/** Runner configuration. */
export interface LoopRunnerOptions {
  spec: LoopSpec
  phase: Phase
  tools: LoopTool[]
  llm: LlmClient
  /** The judge. Omitted means detection-only, which is a supported mode. */
  judge?: Judge
  /** Attention-router overrides. */
  router?: Partial<RouterConfig>
  /** Per-tool gate policy overrides. */
  gatePolicies?: Record<string, GatePolicy>
  /** Called when a step is routed to a human. Return `abort` to stop the run. */
  onReview?: (request: ReviewRequest) => Promise<ReviewVerdict>
  /** Called for every transcript entry. */
  onEvent?: (event: LoopEvent) => void
  /**
   * Runs the spec's success condition. Returning `ok: true` ends the run with
   * `goal-met`. Omitted means the loop falls back to the model's own claim,
   * which is strictly weaker — the runner says so in the transcript.
   */
  checkSuccess?: () => Promise<{ ok: boolean, output: string }>
  /** Model call budget per step, passed through to the gateway. */
  maxTokensPerStep?: number
  /**
   * Question author for the judge call. Receives the step summary, the
   * signals, and a fallback supplier for the fixed `judgeQuestion`; returns
   * the state and questions to score. Omitted means the fixed question —
   * the questioner (`questioner.ts`, LLM-authored per-step questions) is
   * opt-in because it costs a metered chat call per step where it runs.
   */
  questioner?: (
    summary: string,
    signals: readonly ReviewSignal[],
    fallback: () => { state: string, questions: Record<string, SystemOneQuestion> },
  ) => Promise<{ state: string, questions: Record<string, SystemOneQuestion> }>
  /**
   * Evidence from a previous refinement pass, delivered as a plugin-sourced
   * user notice on the opening turn.
   *
   * The one seam pass N+1 needs into pass N: cost, steps, judge scores, the
   * weakest dimension, the failing check output. It is a *message*, not a
   * config change — proposals stay proposals-only, and the book's
   * Self-Correction-with-Reflection pattern is exactly this: the same loop,
   * re-run with its own prior evidence in context.
   */
  passNotice?: string
  /**
   * How many times the model may stop without the success condition holding
   * before the run is called `model-stop`. Default 2.
   */
  maxPrematureStops?: number
}

/** The run's result. */
export interface LoopRunResult {
  outcome: Outcome
  steps: number
  spentUSD: number
  reviews: number
  reviewFraction: number
  signals: ReviewSignal[]
  transcript: LoopEvent[]
  /** The last thing the model said, for a human-readable summary. */
  lastAssistant: string
}

/**
 * Canonicalise tool arguments for cycle detection.
 *
 * Imported for local use and re-exported, because it now lives in
 * `agent-policy.ts`: the plugin imports it too, and importing it from here would
 * pull this module's `node:child_process` and `node:fs` dependencies into the
 * plugin's graph for the sake of one pure function.
 */
import { canonicalArgs } from './agent-policy.ts'
export { canonicalArgs }

/** Parse a tool call's arguments, tolerating a model that emitted invalid JSON. */
function parseArgs(raw: string): { ok: true, args: Record<string, unknown> } | { ok: false, error: string } {
  if (raw.trim() === '') return { ok: true, args: {} }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: `arguments must be a JSON object, received ${Array.isArray(parsed) ? 'array' : typeof parsed}` }
    }
    return { ok: true, args: parsed as Record<string, unknown> }
  } catch (error: unknown) {
    return { ok: false, error: `arguments are not valid JSON: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/** The system prompt: the phase's rules, the goal, and the feedback rubric. */
export function buildSystemPrompt(spec: LoopSpec, phase: Phase): string {
  return [
    phase.prompt,
    '',
    `Goal: ${spec.goal}`,
    `Feedback rubric: ${spec.feedback}`,
    '',
    `You have at most ${String(spec.maxSteps)} steps and $${spec.costBudgetUSD.toFixed(2)}. `
    + 'Work in the smallest verifiable steps. Use the tools; do not describe changes you did not make.',
  ].join('\n')
}

/**
 * Run the loop to a terminal outcome.
 *
 * @param options - the spec, phase, tools, transport, and operator hooks.
 * @returns the outcome plus the full transcript.
 */
export async function runLoop(options: LoopRunnerOptions): Promise<LoopRunResult> {
  const spec = validateSpec(options.spec)
  const transcript: LoopEvent[] = []
  const emit = (event: LoopEvent): void => {
    transcript.push(event)
    options.onEvent?.(event)
  }

  const budget = new LoopBudget({
    maxSteps: spec.maxSteps,
    costBudgetUSD: spec.costBudgetUSD,
    prices: spec.prices,
    unpricedFallback: spec.unpricedFallback,
  })
  const ladder = new ModelLadder({
    ladder: spec.controller.ladder,
    stepsPerRung: spec.controller.stepsPerRung,
    escalateAfterFailures: spec.controller.escalateAfterFailures,
    maxRung: spec.controller.maxRung,
  })
  const router = new AttentionRouter(options.router ?? {})
  const gate = new ReviewGate(options.gatePolicies ?? {})
  const judge = options.judge ?? NO_JUDGE

  const toolsByName = new Map(options.tools.map(t => [t.name, t]))
  const toolSpecs = options.tools.map(t => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))

  // Pre-flight: every route the ladder can reach must be priceable, and the
  // success condition must be checkable. Both are configuration concerns, and
  // both are cheap to check now and expensive to discover later — an unpriceable
  // route found at step 5 is money already spent that the ceiling never counted.
  for (const route of spec.controller.ladder) {
    budget.priceOf(route.provider ?? 'default', route.model)
  }
  if (options.checkSuccess === undefined) {
    emit({
      kind: 'budget',
      step: 0,
      level: 'warn',
      reason: 'no success command was supplied: the loop will trust the model\'s own claim that it finished, '
        + 'which is strictly weaker than checking the observable condition',
    })
  }

  const messages: LlmMessage[] = [
    { role: 'system', content: buildSystemPrompt(spec, options.phase) },
    {
      role: 'user',
      content: options.passNotice === undefined
        ? `Begin. ${spec.goal}`
        : `Begin. ${spec.goal}\n\n[refinement evidence from the previous pass]\n${options.passNotice}`,
    },
  ]

  const history: StepObservation[] = []
  const allSignals: ReviewSignal[] = []
  let spentUSD = 0
  let lastStepUSD: number | undefined
  let lastAssistant = ''
  let prematureStops = 0
  let outcome: Outcome = 'budget-stop'
  let step = 0

  emit({ kind: 'run-start', envelope: describeEnvelope(spec), goal: spec.goal })

  /**
   * Ask the operator. Returns true to continue, false to abort.
   *
   * The verdict is returned rather than assigned to `outcome` here: assigning
   * from inside this async closure makes the assignment invisible to control-flow
   * analysis at the call site, which then narrows `outcome` to the wrong union
   * member and reports a comparison that can never be true. The call site owns
   * the assignment.
   */
  const askOperator = async (request: ReviewRequest): Promise<boolean> => {
    emit({ kind: 'review', step: request.step, decision: request.decision })
    if (options.onReview === undefined) return true
    const verdict = await options.onReview(request)
    return verdict.kind !== 'abort'
  }

  for (step = 1; step <= spec.maxSteps; step += 1) {
    // 1. Budget — arithmetic first, because a run already over its ceiling must
    //    not spend money discovering that.
    const verdict = budget.verdict(step)
    if (verdict.kind === 'stop') {
      emit({ kind: 'budget', step, level: 'stop', reason: verdict.reason })
      outcome = 'budget-stop'
      break
    }
    if (verdict.kind === 'warn') {
      emit({ kind: 'budget', step, level: 'warn', reason: verdict.reason })
      messages.push({ role: 'user', content: budgetWarnText(verdict.reason) })
    }

    // 2. Route — still arithmetic.
    const decision = ladder.forStep(step, lastStepUSD)
    const routeLabelText = `${decision.route.provider ?? 'default'}/${decision.route.model}`
    emit({ kind: 'step-start', step, route: routeLabelText, spentUSD })
    if (decision.reason.kind !== 'initial') {
      emit({ kind: 'route', step, route: routeLabelText, reason: decision.reason })
      const from = 'from' in decision.reason ? decision.reason.from : 'initial'
      const notice = escalationText(from, routeLabelText, decision.reason.kind)
      if (notice !== undefined) messages.push({ role: 'user', content: notice })
    }

    // 3. Detectors — arithmetic over what already happened.
    const signals = detectSignals(history, {
      maxSteps: spec.maxSteps,
      costBudgetUSD: spec.costBudgetUSD,
      spentUSD,
    })
    if (signals.length > 0) {
      allSignals.push(...signals)
      emit({ kind: 'signals', step, signals })
    }

    // 4. Judge — one cheap local call, only when there is a reason to ask.
    let judgeScore: number | undefined
    if (signals.length > 0 || router.budgetRemaining()) {
      const summary = history.at(-1) === undefined
        ? 'the run has just started'
        : `the last step called ${history.at(-1)!.tool ?? 'no tool'} and ${history.at(-1)!.error === true ? 'failed' : 'succeeded'}`
      // LLM reasons → Laya decides: when the actor said something this step,
      // the questioner turns its reasoning into typed questions instead of
      // asking the fixed rubric. `lastAssistant` is the actor's own words —
      // empty on step 1 (nothing said yet) and after tool-only steps, in
      // which case the questioner gets the summary and behaves like the
      // fixed question with more context. Falls back to `judgeQuestion`
      // silently — generation is an optimisation, and the fallback is the
      // observable behaviour.
      const reasoning = lastAssistant.trim() === '' ? summary : lastAssistant
      const question = options.questioner === undefined
        ? judgeQuestion(summary, signals)
        : await options.questioner(reasoning, signals, () => judgeQuestion(summary, signals))
      const answer = await judge.score(question.state, question.questions)
      judgeScore = answer.score
      emit({ kind: 'judge', step, score: answer.score, ...answer.error === undefined ? {} : { error: answer.error } })
    }

    // 5. Review — the human, only when 1–4 say so.
    const routing = router.route(signals, undefined, judgeScore)
    if (routing.review) {
      const cont = await askOperator({
        step,
        decision: routing,
        signals,
        pending: `model call on ${routeLabelText}`,
      })
      if (!cont) {
        outcome = 'aborted'
        break
      }
    }

    // 6. The model call.
    let result
    // Round-trip timing, not model timing: this spans dispatch to the settled
    // response — gateway queueing and transport retries included — which is
    // runlog's `latencyKind: 'round-trip'`. The runner has no seam that
    // isolates pure model time, and a figure labelled otherwise would be a
    // proxy dressed up as a measurement.
    const callStartedAt = performance.now()
    try {
      result = await options.llm.complete({
        model: decision.route.provider === undefined
          ? decision.route.model
          : `${decision.route.provider}/${decision.route.model}`,
        messages,
        tools: toolSpecs,
        ...options.maxTokensPerStep === undefined ? {} : { maxTokens: options.maxTokensPerStep },
      })
    } catch (error: unknown) {
      // A gateway failure is not a loop failure: report it and stop, rather
      // than retrying forever inside a budget the caller is paying for.
      emit({
        kind: 'assistant',
        step,
        content: `[transport error] ${error instanceof LlmCallError ? error.message : String(error)}`,
      })
      outcome = 'error'
      break
    }
    // Recorded on the step's observations below: the loop's history is where
    // the speed axis becomes visible to the detectors and to the run record.
    const latencyMs = performance.now() - callStartedAt

    lastStepUSD = budget.spend(decision.route.provider ?? 'default', decision.route.model, result.usage)
    spentUSD = budget.snapshot().spentUSD
    router.observeStep()

    if (result.content.trim() !== '') {
      lastAssistant = result.content
      emit({ kind: 'assistant', step, content: result.content })
    }

    // No tool calls: the model is trying to stop. Whether that is success is
    // decided by the observable condition, not by the claim.
    if (result.toolCalls.length === 0) {
      if (options.checkSuccess !== undefined) {
        const check = await options.checkSuccess()
        emit({ kind: 'success-check', step, ok: check.ok, output: check.output })
        if (check.ok) {
          outcome = 'goal-met'
          break
        }
      }
      prematureStops += 1
      if (prematureStops > (options.maxPrematureStops ?? 2)) {
        outcome = 'model-stop'
        break
      }
      messages.push({ role: 'assistant', content: result.content })
      messages.push({
        role: 'user',
        content: 'You stopped, but the success condition does not hold yet. '
          + 'Continue: inspect the failure, make the smallest change, and re-run the check.',
      })
      continue
    }

    // 7. Tools. Each one passes the reversibility gate before it runs.
    messages.push({ role: 'assistant', content: result.content === '' ? null : result.content, tool_calls: result.toolCalls })
    for (const call of result.toolCalls) {
      const tool = toolsByName.get(call.function.name)
      if (tool === undefined) {
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: `Unknown tool "${call.function.name}". Available: ${[...toolsByName.keys()].join(', ')}`,
        })
        history.push({ index: step, tool: call.function.name, argsKey: '', error: true, costUSD: 0, latencyMs })
        continue
      }

      const parsed = parseArgs(call.function.arguments)
      if (!parsed.ok) {
        messages.push({ role: 'tool', tool_call_id: call.id, content: `Bad arguments: ${parsed.error}` })
        history.push({ index: step, tool: tool.name, argsKey: '', error: true, costUSD: 0, latencyMs })
        continue
      }

      // The gate reads the tool's reversibility from the phase's actuator when
      // it is declared there, and falls back to the tool's own declaration.
      const reversibility = options.phase.actuator[tool.name] ?? tool.reversibility
      const gateDecision = gate.check(tool.name, reversibility, judgeScore)
      if (gateDecision.review) {
        const cont = await askOperator({
          step,
          decision: gateDecision,
          signals: [],
          pending: `${tool.name}(${Object.keys(parsed.args).join(', ')})`,
        })
        if (!cont) {
          messages.push({ role: 'tool', tool_call_id: call.id, content: 'Aborted by the operator.' })
          outcome = 'aborted'
          break
        }
      }

      let toolResult: ToolResult
      try {
        toolResult = await tool.run(parsed.args)
      } catch (error: unknown) {
        // `run()` promises never to throw; this is the belt to its braces, so
        // one badly behaved tool cannot kill a run that is otherwise fine.
        toolResult = { ok: false, output: '', error: `tool threw: ${error instanceof Error ? error.message : String(error)}` }
      }

      history.push({
        index: step,
        tool: tool.name,
        argsKey: canonicalArgs(parsed.args),
        error: !toolResult.ok,
        costUSD: 0,
        latencyMs,
      })
      emit({
        kind: 'tool',
        step,
        tool: tool.name,
        ok: toolResult.ok,
        reversibility,
        preview: (toolResult.error ?? toolResult.output).replace(/\s+/g, ' ').slice(0, 160),
      })
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: toolResult.ok ? toolResult.output : `ERROR: ${toolResult.error ?? 'tool failed'}`,
      })
    }

    if (outcome === 'aborted') break

    // 7. Success check after the step, so the loop stops the moment the
    //    observable condition holds rather than when the model next speaks.
    if (options.checkSuccess !== undefined) {
      const check = await options.checkSuccess()
      emit({ kind: 'success-check', step, ok: check.ok, output: check.output })
      if (check.ok) {
        outcome = 'goal-met'
        break
      }
    }
  }

  // Falling out of the loop means the step ceiling was reached.
  if (outcome === 'budget-stop' && step > spec.maxSteps) {
    outcome = 'budget-stop'
  }

  const stats = router.stats()
  const result: LoopRunResult = {
    outcome,
    steps: Math.min(step, spec.maxSteps),
    spentUSD,
    reviews: stats.reviews,
    reviewFraction: stats.fraction,
    signals: allSignals,
    transcript,
    lastAssistant,
  }
  emit({
    kind: 'run-end',
    outcome: result.outcome,
    steps: result.steps,
    spentUSD: result.spentUSD,
    reviews: result.reviews,
    reviewFraction: result.reviewFraction,
  })
  return result
}

/**
 * Render a transcript as plain text, for a terminal demo.
 *
 * @param transcript - the events.
 * @returns one line per event, prefixed by what it is.
 */
export function renderTranscript(transcript: readonly LoopEvent[]): string {
  return transcript.map((e) => {
    switch (e.kind) {
      case 'run-start':
        return `[run] ${e.envelope}\n[run] goal: ${e.goal}`
      case 'step-start':
        return `\n── step ${String(e.step)} · ${e.route} · spent $${e.spentUSD.toFixed(4)}`
      case 'route':
        return `[route] escalated to ${e.route} (${e.reason.kind})`
      case 'budget':
        return `[budget:${e.level}] ${e.reason}`
      case 'signals':
        return e.signals.map(s => `[signal:${s.severity}] ${s.kind} — ${s.detail}`).join('\n')
      case 'judge':
        return e.score === undefined
          ? `[judge] unavailable (${e.error ?? 'no score'})`
          : `[judge] review-worthiness ${e.score}/3`
      case 'review':
        return `[review] ${e.decision.review ? 'ASK HUMAN' : 'auto'} via ${e.decision.source} — ${e.decision.reason}`
      case 'assistant':
        return `[model] ${e.content.replace(/\s+/g, ' ').slice(0, 300)}`
      case 'tool':
        return `[tool] ${e.tool} (${e.reversibility}) ${e.ok ? 'ok' : 'FAILED'} — ${e.preview}`
      case 'success-check':
        return `[check] ${e.ok ? 'GOAL MET' : 'not yet'} — ${e.output.replace(/\s+/g, ' ').slice(0, 160)}`
      case 'run-end':
        return `\n[run-end] ${e.outcome} · ${String(e.steps)} steps · $${e.spentUSD.toFixed(4)} · `
          + `${String(e.reviews)} review(s) (${(e.reviewFraction * 100).toFixed(0)}% of steps)`
    }
  }).join('\n')
}
