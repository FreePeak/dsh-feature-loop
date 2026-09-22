/**
 * The book's loop-hygiene detectors, as pure functions over step history.
 *
 * These are the deterministic half of the review router, and the split matters:
 * a detector that runs in arithmetic cannot miss, and a local model asked to
 * judge "is this step worth a human's attention?" cannot be trusted to notice a
 * cycle it was not shown. So detection is arithmetic and cheap; *ranking* the
 * signals — deciding which of them actually deserve your eyes — is the model's
 * job (`review.ts`), and the book's budget for that is <10% of steps.
 *
 * Every threshold below is the book's own, quoted in `BOOK_THRESHOLDS`, because
 * a threshold with no provenance is a number someone liked.
 *
 * @module dsh-feature-loop/signals
 */

/** One completed step, as the detectors see it. */
export interface StepObservation {
  /** 1-based step number. */
  index: number
  /** The tool this step called, when it called one. */
  tool?: string
  /**
   * Canonical form of the tool arguments. Cycle detection compares this, not
   * the raw arguments: two calls that differ only in key order are the same
   * call, and treating them as different hides the loop the detector exists
   * for.
   */
  argsKey?: string
  /** Whether the step failed. */
  error?: boolean
  /** What this step cost. */
  costUSD: number
  /**
   * The phase rubric's score for this step, when the spec defines one. Absent
   * means "not scored", which is not the same as zero.
   */
  score?: number
}

/** How loud a signal is. `critical` means a human should look before continuing. */
export type SignalSeverity = 'info' | 'warning' | 'critical'

/** What the detectors can notice. */
export type SignalKind =
  | 'tool-cycle'
  | 'excessive-steps'
  | 'budget'
  | 'tool-dominance'
  | 'error-cascade'
  | 'quality-drop'

/** One reason this run may deserve a human's attention. */
export interface ReviewSignal {
  kind: SignalKind
  severity: SignalSeverity
  /** One line a human can act on without reading the trace. */
  detail: string
  /** The step the signal is about. */
  step: number
}

/**
 * The book's thresholds, with its own reasoning preserved.
 *
 * The cycle threshold is the one worth defending: the book reports that across
 * production agents handling more than 5,000 runs/day, a threshold of 3 — not 2,
 * which fires on legitimate retries, and not 5, which wastes compute and dollars
 * — was the single highest-leverage setting.
 */
export const BOOK_THRESHOLDS = {
  /** Consecutive identical (tool, args) pairs before `tool-cycle`. */
  cycleLength: 3,
  /** Spans above which the loop is "not converging, it is grinding". */
  excessiveSteps: 20,
  /** Cost fraction above which a warning fires. Matches the book's 0.8. */
  budgetWarnFraction: 0.8,
  /** Share of steps one tool may own before it looks like a favourite. */
  toolDominanceFraction: 0.6,
  /**
   * Minimum steps before tool-dominance is allowed to fire.
   *
   * Not from the book, and it is the one threshold here that is a guard rather
   * than a number someone chose. The book's 60% share is a claim about a *run* —
   * "this loop is stuck on one tool" — and at one or two steps every tool is
   * trivially 100% of all steps. Without this floor the detector fires on the
   * first step of every single run, and a signal that always fires is noise that
   * trains its reader to ignore the signals that matter.
   */
  toolDominanceMinSteps: 5,
  /** Consecutive error steps before `error-cascade`. */
  errorCascade: 3,
  /** Fraction of the baseline score below which quality has dropped. */
  qualityDropFraction: 0.7,
} as const

/** Every threshold, overridable per deployment. */
export interface SignalThresholds {
  cycleLength: number
  excessiveSteps: number
  budgetWarnFraction: number
  toolDominanceFraction: number
  toolDominanceMinSteps: number
  errorCascade: number
  qualityDropFraction: number
}

/** Defaults: the book's numbers. */
export const DEFAULT_THRESHOLDS: SignalThresholds = { ...BOOK_THRESHOLDS }

/**
 * Consecutive identical (tool, args) calls at the end of the history.
 * @param history - steps in order.
 * @returns the repeat count of the trailing run, and what it repeated.
 */
export function trailingRepeat(history: readonly StepObservation[]): { count: number; tool: string } {
  let count = 0
  let tool: string | undefined
  let key: string | undefined
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const step = history[i]!
    if (step.tool === undefined) break
    const stepKey = `${step.tool}\u0000${step.argsKey ?? ''}`
    if (key === undefined) {
      key = stepKey
      tool = step.tool
      count = 1
      continue
    }
    if (stepKey !== key) break
    count += 1
  }
  return { count, tool: tool ?? '' }
}

/**
 * Run every detector over the history.
 *
 * Detectors are independent and all may fire at once — a run can be grinding
 * *and* expensive *and* stuck on one tool, and collapsing those into one verdict
 * would throw away exactly the information the human needs to decide what to do.
 *
 * @param history - completed steps, in order.
 * @param opts - the run's envelope and any threshold overrides.
 * @returns every signal that fired, most severe first, then most recent first.
 */
export function detectSignals(
  history: readonly StepObservation[],
  opts: {
    maxSteps: number
    costBudgetUSD: number
    spentUSD: number
    /** Baseline score for the `quality-drop` detector. */
    baselineScore?: number
    thresholds?: Partial<SignalThresholds>
  },
): ReviewSignal[] {
  const t: SignalThresholds = { ...DEFAULT_THRESHOLDS, ...opts.thresholds }
  const signals: ReviewSignal[] = []
  const last = history.at(-1)
  const at = last?.index ?? 0

  // tool-cycle: the trailing identical run. Reported at `critical` because a
  // cycle is money burning with no progress, and it is the one signal that is
  // never a false positive once the threshold is 3.
  const repeat = trailingRepeat(history)
  if (repeat.count >= t.cycleLength) {
    signals.push({
      kind: 'tool-cycle',
      severity: 'critical',
      step: at,
      detail: `${String(repeat.count)}× identical ${repeat.tool} call with the same arguments — the loop is not making progress`,
    })
  }

  // error-cascade: three consecutive failures. Critical because failures
  // compound and the first one is the one worth reading.
  let consecutiveErrors = 0
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i]!.error !== true) break
    consecutiveErrors += 1
  }
  if (consecutiveErrors >= t.errorCascade) {
    signals.push({
      kind: 'error-cascade',
      severity: 'critical',
      step: at,
      detail: `${String(consecutiveErrors)} consecutive failing steps — the first failure is the one to read`,
    })
  }

  // excessive-steps: past the book's 20-span line, the loop is grinding.
  if (history.length > t.excessiveSteps) {
    signals.push({
      kind: 'excessive-steps',
      severity: 'warning',
      step: at,
      detail: `${String(history.length)} steps and no termination — the loop is grinding, not converging`,
    })
  }

  // budget: the book's 0.8, which is also where `budget.ts` warns. Two
  // independent readings of the same threshold is not duplication here: this
  // one is a *review* signal for the human, that one is a *prompt* nudge for
  // the model.
  const budgetFraction = opts.costBudgetUSD > 0 ? opts.spentUSD / opts.costBudgetUSD : 0
  if (budgetFraction >= t.budgetWarnFraction) {
    signals.push({
      kind: 'budget',
      severity: budgetFraction >= 1 ? 'critical' : 'warning',
      step: at,
      detail: `${(budgetFraction * 100).toFixed(0)}% of the $${opts.costBudgetUSD.toFixed(2)} budget spent`,
    })
  }

  // tool-dominance: one tool owning most of the run. `info` on purpose — an
  // agent with a favourite is suspicious, not wrong — and floored at a minimum
  // sample, because below that the share is trivially 100%.
  const toolCounts = new Map<string, number>()
  for (const step of history) {
    if (step.tool === undefined) continue
    toolCounts.set(step.tool, (toolCounts.get(step.tool) ?? 0) + 1)
  }
  if (history.length >= t.toolDominanceMinSteps) {
    for (const [tool, count] of toolCounts) {
      const share = count / history.length
      if (share > t.toolDominanceFraction) {
        signals.push({
          kind: 'tool-dominance',
          severity: 'info',
          step: at,
          detail: `${tool} is ${(share * 100).toFixed(0)}% of all steps — it may be stuck on it`,
        })
      }
    }
  }

  // quality-drop: the rubric sliding below its baseline. Only fires when both
  // numbers exist; a missing baseline is not a pass.
  if (opts.baselineScore !== undefined && opts.baselineScore > 0 && last?.score !== undefined) {
    if (last.score < opts.baselineScore * t.qualityDropFraction) {
      signals.push({
        kind: 'quality-drop',
        severity: 'warning',
        step: at,
        detail: `step score ${last.score.toFixed(2)} is below ${t.qualityDropFraction} of the ${opts.baselineScore.toFixed(2)} baseline`,
      })
    }
  }

  const rank: Record<SignalSeverity, number> = { critical: 0, warning: 1, info: 2 }
  return signals.sort((a, b) => rank[a.severity] - rank[b.severity] || b.step - a.step)
}

/**
 * Whether the history contains a signal a human must see before the loop
 * continues, regardless of what any model thinks. This is the floor the review
 * router cannot fall below — the book's `<10%` budget applies to *judgement*
 * calls, never to these.
 *
 * @param signals - output of {@link detectSignals}.
 * @returns true when a critical signal fired.
 */
export function mustReview(signals: readonly ReviewSignal[]): boolean {
  return signals.some(s => s.severity === 'critical')
}
