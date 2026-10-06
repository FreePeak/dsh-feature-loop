/**
 * The 0→1 pipeline's five phases: what each one does, how you know it is
 * finished, and what share of the budget it may spend.
 *
 * The book has no chapter called "0→1 pipeline", so this table is an assembly —
 * Ch15's research loop, Ch18's product recipe, Ch14's coding rules, Ch5's
 * plan-and-execute shape — and every borrowed threshold carries its page in
 * {@link PIPELINE_BUDGET}. That is the same convention `signals.ts` already sets
 * with `BOOK_THRESHOLDS`: a threshold with no provenance is a number somebody
 * liked.
 *
 * The one design rule that makes this table worth having: **an exit gate is an
 * observation, not a description.** A phase whose completion is "the agent feels
 * it is done" has no gate, and a pipeline of ungated phases is the sequential
 * chain Ch1 rejects in its first paragraph. Every gate below is something a
 * reader can check after the fact, and every one of them fails closed when the
 * evidence is missing.
 *
 * Pure on purpose — no cordis, no `@deepseek-ai/*`, no `node:fs`. The I/O that
 * fills a {@link PhaseObservation} lives in the plugin, so the whole table is
 * assertable with no harness build and no installed dependencies, which is what
 * CI's no-install job runs.
 *
 * @module dsh-feature-loop/phases
 */

import type { Reversibility } from './spec.ts'

/** The pipeline's phases, in the order they run. */
export type PipelinePhase = 'research' | 'prd' | 'implement' | 'test' | 'ship'

/** Every phase, in order. The pipeline's spine; `pipeline.ts` transitions over it. */
export const PHASE_ORDER: readonly PipelinePhase[] = ['research', 'prd', 'implement', 'test', 'ship'] as const

/** The phase a run starts in. Research first: an implementation written before the code is read is a rewrite waiting to be reverted. */
export const FIRST_PHASE: PipelinePhase = 'research'

/** Where a run ends up when no phase is running. */
export type PipelineState = PipelinePhase | 'done' | 'stopped' | 'blocked'

/**
 * How a phase proves it is finished.
 *
 * Three kinds, because a pipeline has exactly three kinds of exit: something was
 * produced, something changed, or something passed. Anything that does not reduce
 * to one of these is a phase that cannot be gated, and a phase that cannot be
 * gated should not exist.
 */
export type ExitGate =
  /** A file exists and its text matches. Fails closed when the file is unreadable. */
  | {
      kind: 'artifact'
      path: string
      label: string
      /** Substrings the text must contain. */
      mustContain?: readonly string[]
      /** Patterns the text must match, for anything a substring cannot express. */
      mustMatch?: readonly RegExp[]
      minMatches?: number
    }
  /** At least `min` tracked files changed. */
  | { kind: 'changed'; min: number; label: string }
  /** The phase's `verifyCommand` exited 0. Fails closed when it was never run. */
  | { kind: 'command'; label: string }

/** What running the phase's `verifyCommand` produced. */
export interface VerifyResult {
  /** The command that was run, for the evidence record. */
  command: string
  exitCode: number
  /** Tail of its output, kept for the report and bounded by the caller. */
  output: string
}

/**
 * What the plugin has seen so far, as the gates read it.
 *
 * Everything here is already-observed data. Nothing in this file reads the
 * filesystem or runs a command — the caller fills the record and the gates are
 * arithmetic over it, which is the seam `budget.ts` and `signals.ts` already use
 * and the reason a harness upgrade cannot change what a gate means.
 */
export interface PhaseObservation {
  /** The phase being evaluated. */
  phase: PipelinePhase
  /** Paths the run has written or edited during this phase, workspace-relative. */
  written: readonly string[]
  /** Paths the repository reports as changed in the loop worktree. */
  changed: readonly string[]
  /**
   * File contents, keyed by workspace-relative path.
   *
   * A path that is absent, or present with `undefined`, reads as "not observed"
   * and fails the gate that needs it. That is the fail-closed direction and it
   * is deliberate: a gate that passes because a probe failed is a gate that
   * measures the probe.
   */
  artifacts: Readonly<Record<string, string | undefined>>
  /** The `verifyCommand`'s result, when the caller actually ran it. */
  verify?: VerifyResult
  /** Fix attempts already made in this phase. The test phase reads it to stop at the book's 3. */
  attempts: number
}

/** A gate's answer. `detail` is one line a human reads in the report. */
export interface GateResult {
  pass: boolean
  detail: string
}

/** One phase: its rules, its tool surface, its gate, its budget share. */
export interface PipelinePhaseDef {
  name: PipelinePhase
  /** One line, for the dashboard rail and the report's phase table. */
  label: string
  /** The numbered rules the model reads, each closing a specific observed failure. */
  rules: readonly string[]
  /**
   * The tools this phase expects, with reversibility — the book's "actuator"
   * dimension made concrete, and what the review gate reads to decide which
   * calls need a human.
   *
   * Per-phase rather than one global table because the phases have genuinely
   * different risk profiles: research should not be able to write, and ship is
   * the only phase that touches git at all.
   */
  actuator: Record<string, Reversibility>
  /** The phase's exit gate. */
  gate: ExitGate
  /**
   * The command whose exit code answers the `command` gate.
   *
   * No default. A test phase with no configured command cannot pass its gate,
   * because the alternative — assuming the project's test command — is a guess
   * that silently reports success for a project whose tests were never run.
   */
  verifyCommand?: string
  /** What the phase produces, for the report. Not a gate — an inventory. */
  produces: readonly string[]
}

/**
 * Research: Ch15's six stages, reduced to what a product goal actually needs.
 *
 * The load-bearing rule is the last one. Ch15 is unambiguous that an unverified
 * research agent *"hallucinate[s] citations 15-25% of the time"* and that
 * verification drops it under 3% (p199), and that *"an uncited claim is
 * unverified by definition"*. A research phase that ends in a confident,
 * uncited document hands the PRD phase fiction to build on.
 */
export const RESEARCH_PHASE: PipelinePhaseDef = {
  name: 'research',
  label: 'Research',
  rules: [
    'Decompose the goal into 3 to 8 sub-questions. A single broad query returns generalist sources; targeted sub-questions surface specialist ones.',
    'Take at most the top 5 sources per sub-question, and read them rather than skimming titles.',
    'Record every claim with the source that supports it. An uncited claim is unverified by definition — write "unverified" instead of guessing.',
    'When two sources disagree, report the disagreement and say why they differ. Do not silently pick the convenient one.',
    'Weigh sources: peer-reviewed beats analyst reports beats news beats blog posts beats forum. Record the tier you used.',
    'Name what you could NOT find. An honest gap is more useful than a confident omission.',
  ],
  actuator: {
    read: 'read',
    glob: 'read',
    grep: 'read',
    write: 'reversible-write',
    edit: 'reversible-write',
  },
  gate: {
    kind: 'artifact',
    path: 'docs/0-research.md',
    label: 'research note with at least one cited source',
    mustContain: ['http'],
  },
  produces: ['docs/0-research.md'],
}

/**
 * PRD: Ch18's product recipe, as rules.
 *
 * Rule 2 is the one that gets skipped and the one the book treats as a hard
 * gate on scope: Walkthrough 18.1's MVP was defined as much by its explicit
 * exclusions (no editing, no template library, no API) as by its features, and
 * Ch18's scaling rule refuses new task types until the current one is reliable.
 */
export const PRD_PHASE: PipelinePhaseDef = {
  name: 'prd',
  label: 'PRD',
  rules: [
    'Answer the product-agent fit test in writing: is the task repetitive enough to automate, is failure acceptable, is success measurable, will people trust an agent with it? Any "no" is a reason to shrink the scope, not to proceed.',
    'State what is explicitly NOT in this MVP. An unstated exclusion becomes a silent requirement in the implement phase.',
    'Specify the success criteria as observable checks — a command that exits 0, a file that exists — never as a feeling.',
    'List the key metrics you will watch once it ships. If you cannot name them, the run cannot be judged.',
    'Write the PRD to docs/PRD.md. Name the riskiest assumption and how the implement phase will check it.',
  ],
  actuator: {
    read: 'read',
    glob: 'read',
    grep: 'read',
    write: 'reversible-write',
    edit: 'reversible-write',
  },
  gate: {
    kind: 'artifact',
    path: 'docs/PRD.md',
    label: 'PRD with scope, success criteria and metrics',
    // Matched as CONCEPTS anywhere in the document, not as exact headings. Two
    // live runs wrote `## 2. Scope` and then `## In scope (the MVP)`, and failed
    // their own gate both times — the PRD was complete and the heading was not
    // the one the regex wanted.
    //
    // This is the third version of this gate and the lesson is the same each
    // time: a gate that measures form gets worked around. What it must measure is
    // whether the four things a PRD has to settle are settled — what is in scope,
    // what is explicitly out, what success is, and what will be watched.
    mustMatch: [/\bscope\b/i, /\bsuccess\b/i, /\bmetrics?\b/i],
  },
  produces: ['docs/PRD.md'],
}

/**
 * Implement: Ch14's `FEATURE_PROMPT` plus the three rules that decide whether
 * the result fits the codebase.
 *
 * Rule 1 is the book's own first rule for a feature — read the architecture
 * before writing — and its stated reason is that a feature which ignores
 * existing patterns becomes a second pattern, *"and the second pattern is the
 * expensive one"*.
 */
export const IMPLEMENT_PHASE: PipelinePhaseDef = {
  name: 'implement',
  label: 'Implement',
  rules: [
    'Read the existing architecture before writing anything. Follow the patterns and conventions you find; a second pattern is the expensive one.',
    'Edit by search-and-replace, not by whole-file rewrite. Rewrite a whole file only when it is new or under 200 lines.',
    'Never read a file you are not going to use. Prefer a function signature over a whole implementation.',
    'Add tests for every new function, in the test phase or alongside — but never "later", because later never runs.',
    'Update any documentation that references the modules you changed.',
    'Make the smallest change that delivers the feature.',
  ],
  actuator: {
    read: 'read',
    glob: 'read',
    grep: 'read',
    write: 'reversible-write',
    edit: 'reversible-write',
    bash: 'reversible-write',
  },
  gate: { kind: 'changed', min: 1, label: 'at least one tracked file changed' },
  produces: ['source changes'],
}

/**
 * Test: Ch14's write-test-fix loop, with the attempt cap made structural.
 *
 * The cap is not advice here — `pipeline.ts` makes the fourth `TEST → IMPLEMENT`
 * transition an invalid one, so a loop that will not give up cannot get there.
 * The last rule is Ch14's stuck-loop fix: an agent that re-approaches a failing
 * test without seeing its own prior edits *"repeat the same fix 70% of the
 * time"*, and carrying the diff forward cuts that under 20%.
 */
export const TEST_PHASE: PipelinePhaseDef = {
  name: 'test',
  label: 'Test',
  rules: [
    'Run the full test suite, not just the code you touched.',
    'If a test fails, read the failure output, identify the cause, and fix that specific failure. Do not retry the whole change.',
    'Never suppress, skip or weaken a test to make it pass. A suppressed test is a bug that returns.',
    'You have 3 attempts. On the third, your prompt carries the full diff of every change made so far — read it before repeating yourself.',
    'If it still fails after 3 attempts, stop and report what you tried and why you believe it fails. That report is a success; a loop is not.',
  ],
  actuator: {
    read: 'read',
    glob: 'read',
    grep: 'read',
    bash: 'read',
    write: 'reversible-write',
    edit: 'reversible-write',
  },
  gate: { kind: 'command', label: 'the project test command exits 0' },
  produces: ['test output'],
}

/**
 * Ship: commit, push, open a pull request — and stop.
 *
 * "Stop" is the operative word. The phase's gate is a recorded PR URL, and the
 * pipeline has no transition out of `SHIP` except `DONE`; there is no merge, no
 * release and no deploy edge in the machine at all. That is a scope decision
 * recorded in the PRD, expressed as the absence of a transition.
 */
export const SHIP_PHASE: PipelinePhaseDef = {
  name: 'ship',
  label: 'Ship',
  rules: [
    'Commit only the changes this run made, on the loop branch. Never amend or rebase someone else\'s commit.',
    'Never push to main or any protected branch. Ship ends at a pull request.',
    'Write the PR body from the run\'s own evidence: what was built, what was verified, what it cost, and what remains unverified.',
    'If the pull request cannot be opened, say so plainly and report the commit sha. A committed branch with no PR is a legitimate outcome; a silent one is not.',
  ],
  actuator: {
    read: 'read',
    bash: 'reversible-write',
  },
  // The file must hold a URL, not merely exist. A run whose ship phase could not
  // reach git wrote a careful, honest explanation into pr-url.txt — and the gate
  // passed, because it checked that the file was there. A gate that accepts prose
  // where it expects a link is not a gate.
  gate: {
    kind: 'artifact',
    path: '.feature-loop/artifacts/pr-url.txt',
    label: 'a pull request URL (or, with no remote, the commit) was recorded',
    mustMatch: [/https?:\/\/\S+\/pull\/\d+|^local-commit [0-9a-f]{7,40}\b/m],
  },
  produces: ['pull request'],
}

/** Every phase, keyed by name. */
export const PIPELINE_PHASES: Record<PipelinePhase, PipelinePhaseDef> = {
  research: RESEARCH_PHASE,
  prd: PRD_PHASE,
  implement: IMPLEMENT_PHASE,
  test: TEST_PHASE,
  ship: SHIP_PHASE,
}

/**
 * The book's budget numbers, with the reasoning kept.
 *
 * The split is Walkthrough 13.2's allocation for a multi-phase run — 10% planning,
 * 60% research iterations, 20% synthesis, 10% buffer (p169) — mapped onto our
 * five phases. The buffer is not a phase and is never spent on work: ReAct's
 * production tip reserves it for the forced-answer step, because *"an agent that
 * hits its budget limit mid-reasoning with no tokens left to synthesize an answer
 * will either crash or hallucinate a conclusion"* (p34).
 */
export const PIPELINE_BUDGET = {
  /** Share of the run budget each phase may spend. Sums to 0.9 with the buffer. */
  phaseShares: {
    research: 0.1,
    prd: 0.1,
    implement: 0.35,
    test: 0.15,
    ship: 0.2,
  } as Readonly<Record<PipelinePhase, number>>,
  /** Held back for the terminal report. Never available to a phase. */
  bufferShare: 0.1,
  /** Fraction of a phase's own share at which it warns. The book's 0.8. */
  warnFraction: 0.8,
  /** Fraction of the *run* budget at which the pre-call guard stops new work, reserving the buffer. */
  callGuardFraction: 0.9,
  /** Fix attempts in the test phase before the pipeline refuses to hand back. */
  maxTestAttempts: 3,
} as const

/** The next phase in the spine, or `undefined` after the last one. */
export function nextPhase(phase: PipelinePhase): PipelinePhase | undefined {
  const i = PHASE_ORDER.indexOf(phase)
  return i < 0 || i === PHASE_ORDER.length - 1 ? undefined : PHASE_ORDER[i + 1]
}

/**
 * One phase by name.
 * @param name - the requested phase.
 * @returns the phase definition.
 * @throws when the name is not a pipeline phase.
 */
export function pipelinePhaseOf(name: PipelinePhase): PipelinePhaseDef {
  const phase = PIPELINE_PHASES[name]
  if (phase === undefined) throw new Error(`dsh-feature-loop: unknown pipeline phase "${String(name)}"`)
  return phase
}

/** The rendered rules block the model reads, matching `prompts.ts`'s numbered style. */
export function renderRules(phase: PipelinePhaseDef): string {
  return phase.rules.map((rule, i) => `${String(i + 1)}. ${rule}`).join('\n')
}

/**
 * Whether a verify command's output says it ran no tests at all.
 *
 * Deliberately a short list of the runners' own words, each matched only when
 * nothing in the output shows a test that did run — so a Go module with one
 * tested package and one untested package still passes, and an unrecognised
 * runner is never failed on a guess.
 *
 * @param output - the verify command's combined output.
 * @returns true when the output positively says no test ran.
 */
export function ranNoTests(output: string): boolean {
  // Go: `?   pkg  [no test files]` for every package, and no `ok`/`FAIL` line.
  if (/\[no test files\]/.test(output) && !/^(ok|FAIL|---)\s/m.test(output)) return true
  // node:test and TAP: `# tests 0`.
  if (/^# tests 0\s*$/m.test(output)) return true
  // pytest / jest / vitest.
  if (/no tests ran|No tests found|No test files found/i.test(output)) return true
  return false
}

/**
 * Evaluate one phase's exit gate.
 *
 * Every branch fails closed. An artifact that was not read, a verify command
 * that never ran, and a changed-file list nobody collected all report `pass:
 * false` with a reason naming what was missing — because a gate that passes on
 * absent evidence is a gate that measures the probe rather than the work.
 *
 * @param gate - the phase's gate.
 * @param obs - what the plugin observed this phase.
 * @returns the verdict, and one line explaining it either way.
 */
export function evaluateGate(gate: ExitGate, obs: PhaseObservation): GateResult {
  if (gate.kind === 'artifact') {
    const text = obs.artifacts[gate.path]
    if (text === undefined) {
      return { pass: false, detail: `${gate.label}: ${gate.path} was not observed` }
    }
    const missing = (gate.mustContain ?? []).filter(needle => !text.includes(needle))
    if (missing.length > 0) {
      return { pass: false, detail: `${gate.label}: ${gate.path} is missing ${missing.map(m => `"${m}"`).join(', ')}` }
    }
    const unmatched = (gate.mustMatch ?? []).filter(pattern => !pattern.test(text))
    if (unmatched.length > 0) {
      return { pass: false, detail: `${gate.label}: ${gate.path} has no heading for ${unmatched.map(p => p.source).join(', ')}` }
    }
    return { pass: true, detail: `${gate.label}: ${gate.path} present` }
  }
  if (gate.kind === 'changed') {
    const n = obs.changed.length
    return n >= gate.min
      ? { pass: true, detail: `${gate.label}: ${n} file(s) changed` }
      : { pass: false, detail: `${gate.label}: only ${n} changed, needs ${gate.min}` }
  }
  // command
  if (obs.verify === undefined) {
    return { pass: false, detail: `${gate.label}: no verify command was run` }
  }
  if (obs.verify.exitCode === 0) {
    // An exit code of 0 from a runner that ran nothing is the probe passing, not
    // the work. A live run's test phase "passed" on `[no test files]` and the
    // suite was written only after ship had committed without it.
    if (ranNoTests(obs.verify.output ?? '')) {
      return { pass: false, detail: `${gate.label}: exit 0, but the output shows no test ran — write tests, then run it again` }
    }
    return { pass: true, detail: `${gate.label}: exit 0` }
  }
  // The command's own last line of output, because an exit code alone sent the
  // investigation in the wrong direction twice: 126 is npm's "script failed to
  // execute" and this function's own refusal code, and the two are
  // indistinguishable from the code alone.
  const tail = (obs.verify.output ?? '').trim().split('\n').filter(l => l.trim().length > 0).at(-1)
  return {
    pass: false,
    detail: `${gate.label}: exit ${obs.verify.exitCode}${tail === undefined ? '' : ` — ${tail.slice(0, 160)}`}`,
  }
}

/**
 * Whether the test phase still has attempts left.
 *
 * The book's cap is a structural property here rather than a prompt request:
 * `pipeline.ts` refuses the transition once this returns false, so a loop that
 * ignores the instruction cannot reach a fourth attempt.
 *
 * @param attempts - fix attempts already made.
 * @returns true when another attempt is allowed.
 */
export function testAttemptsRemain(attempts: number): boolean {
  return attempts < PIPELINE_BUDGET.maxTestAttempts
}

/**
 * One stage of the phase rail, as the page renders it.
 */
export interface PhaseRailStage {
  name: string
  /** 0-based position in the spine. */
  index: number
  /** `current`, `done` for a lower index, or `pending` for a higher one. */
  state: 'current' | 'done' | 'pending'
}

/**
 * The minimum a run must carry to be projected onto the rail.
 *
 * Declared structurally, and with this module importing nothing from
 * `dashboard.ts`, for a reason with teeth: `dashboard.ts` opens `node:http`, so
 * a value import from it drags the whole loopback server into the browser
 * bundle — which fails the build outright, and if it did not would put a server
 * in a page running under `default-src 'none'`. The page needs two numbers, not
 * a type identity.
 */
export interface RailProjection {
  phase?: string
  phaseIndex?: number
  phaseSpentUSD?: number
  phaseBudgetUSD?: number
}

/**
 * Project a run onto the five-stage rail.
 *
 * Returns an empty list for a run with no pipeline, so the page renders no rail
 * at all rather than five empty stages — a rail that is always present and
 * always empty teaches its reader to ignore it, which is the same failure the
 * `tool-dominance` floor exists to prevent on the policy side.
 *
 * @param run - the run to project.
 * @param order - the phase spine, in order. Defaults to the pipeline's own.
 * @returns one stage per phase, in spine order; empty when there is no pipeline.
 */
export function phaseRail(run: RailProjection, order: readonly PipelinePhase[] = PHASE_ORDER): PhaseRailStage[] {
  const { phaseIndex } = run
  if (phaseIndex === undefined) return []
  return order.map((name, index) => ({
    name,
    index,
    state: index < phaseIndex ? 'done' : index === phaseIndex ? 'current' : 'pending',
  }))
}

/**
 * What the current phase has spent, as a fraction of its own ceiling.
 *
 * `undefined` when nothing is known, so the page prints "not measured" rather
 * than a confident 0% for a phase that has not started spending — the rule
 * `metrics.ts` already follows for an empty history.
 *
 * @param run - the run to read.
 * @returns spent / budget, or `undefined` when either side is absent.
 */
export function phaseFraction(run: RailProjection): number | undefined {
  const { phaseSpentUSD, phaseBudgetUSD } = run
  if (phaseSpentUSD === undefined || phaseBudgetUSD === undefined || phaseBudgetUSD <= 0) return undefined
  return phaseSpentUSD / phaseBudgetUSD
}
