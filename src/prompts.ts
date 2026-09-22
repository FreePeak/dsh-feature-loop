/**
 * Phase prompts: the book's own `BUG_FIX_PROMPT` and `FEATURE_PROMPT`.
 *
 * These are the MVP's whole domain content, and they are reproduced from the
 * playbook rather than invented, because the book's argument for them is that
 * each rule closes a specific observed failure: a fix with no failing test first
 * is a guess, a fix that suppresses a test is a fix that will come back, a
 * feature written before reading the architecture is a rewrite waiting to be
 * reverted.
 *
 * They live in their own file so that tuning the prompt for your codebase never
 * touches vendored loop code and never conflicts with an upstream re-sync.
 *
 * @module dsh-feature-loop/prompts
 */

import type { PhaseName, Reversibility } from './spec.ts'

/** One phase: a prompt, and the tool surface it is allowed. */
export interface Phase {
  name: PhaseName
  /** The system-prompt section this phase contributes. */
  prompt: string
  /**
   * The tools this phase expects, with reversibility. This is the book's
   * "actuator" dimension made concrete, and it is what the review gate reads to
   * decide which calls need a human.
   */
  actuator: Record<string, Reversibility>
  /** The success command, when the phase has one that is checkable. */
  successCommand?: string
}

/**
 * `BUG_FIX_PROMPT` — 6 rules, verbatim from the playbook.
 *
 * Rule 1 is the load-bearing one and the one most often skipped: without a
 * failing test first, there is no evidence the change fixed anything, and no way
 * to tell a fix from a coincidence.
 */
export const BUG_FIX_RULES = [
  'First, write a failing test that reproduces the bug.',
  'Run it to confirm it fails for the right reason.',
  'Make the MINIMAL change that fixes the root cause.',
  'Run ALL tests, not just the new one.',
  'If existing tests break, revise your fix.',
  'Never suppress a test to make it pass.',
] as const

/**
 * `FEATURE_PROMPT` — 5 rules, verbatim from the playbook.
 *
 * Rule 1 is why this loop reads before it writes: the book's position is that a
 * feature which ignores existing patterns is a second pattern, and the second
 * pattern is the expensive one.
 */
export const FEATURE_RULES = [
  'Read the existing architecture before writing anything.',
  'Follow existing patterns and conventions.',
  'Add tests for every new function.',
  'Update any documentation that references the changed modules.',
  'Make the smallest change that delivers the feature.',
] as const

/** Render a rule list as the numbered block the model reads. */
function rules(title: string, rules: readonly string[]): string {
  return [title, ...rules.map((r, i) => `${String(i + 1)}. ${r}`)].join('\n')
}

/** The phase that ships in the MVP: fix a bug, end to end. */
export const BUGFIX_PHASE: Phase = {
  name: 'bugfix',
  prompt: [
    'You are fixing one bug. Work in the smallest possible steps and verify every one of them.',
    '',
    rules('Rules, in order — do not skip a step:', BUG_FIX_RULES),
    '',
    'The loop will stop you at its step and cost ceilings. If it does, report what you verified and what remains.',
  ].join('\n'),
  actuator: {
    // Reading is free and safe, so it never interrupts you.
    read_file: 'read',
    list_files: 'read',
    // Running tests is how the loop learns; read-only in effect.
    run_tests: 'read',
    // Writing the reproduction and the fix are both source writes: reversible,
    // and gated by confidence rather than by a human every time.
    write_file: 'reversible-write',
    edit_file: 'reversible-write',
  },
  successCommand: 'run ALL tests, not just the new one',
}

/** The second MVP phase: implement a small feature, end to end. */
export const FEATURE_PHASE: Phase = {
  name: 'feature',
  prompt: [
    'You are implementing one small feature. Read before you write, and follow what you find.',
    '',
    rules('Rules, in order — do not skip a step:', FEATURE_RULES),
    '',
    'The loop will stop you at its step and cost ceilings. If it does, report what you verified and what remains.',
  ].join('\n'),
  actuator: {
    read_file: 'read',
    list_files: 'read',
    run_tests: 'read',
    write_file: 'reversible-write',
    edit_file: 'reversible-write',
  },
  successCommand: 'run ALL tests, not just the new one',
}

/** Every phase the fork knows. Later phases land here; the MVP ships two. */
export const PHASES: Record<PhaseName, Phase> = {
  bugfix: BUGFIX_PHASE,
  feature: FEATURE_PHASE,
  // `refactor` is deliberately absent: the book's REFACTOR_PROMPT exists, but
  // the MVP's acceptance is "fix a bug or ship a small feature", and shipping a
  // phase the demo does not exercise is how a loop grows a surface nobody tests.
  refactor: {
    name: 'refactor',
    prompt: rules('Refactor with the smallest possible diff:', [
      'Establish the tests pass before you change anything.',
      'Change one thing at a time.',
      'Keep the tests green after every step.',
      'Do not change behaviour in a refactor.',
      'Stop if a change requires a behaviour change; report it instead.',
    ]),
    actuator: {
      read_file: 'read',
      list_files: 'read',
      run_tests: 'read',
      edit_file: 'reversible-write',
      write_file: 'reversible-write',
    },
    successCommand: 'run ALL tests',
  },
}

/**
 * The phase a run starts in.
 * @param name - the requested phase.
 * @returns the phase definition.
 * @throws when the name is not a known phase.
 */
export function phaseOf(name: PhaseName): Phase {
  const phase = PHASES[name]
  if (phase === undefined) throw new Error(`dsh-feature-loop: unknown phase "${String(name)}"`)
  return phase
}
