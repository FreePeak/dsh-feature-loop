/**
 * Ship: commit on the run's branch, push it, open a pull request.
 *
 * "Ship" stops at the PR, and that is a scope decision expressed in code rather
 * than in a comment: this module has no merge, no release and no publish path,
 * and `yolo.ts` denies the commands that would perform one even if a model
 * reached for them. A pipeline that could merge its own work would make every
 * other boundary in this package decorative.
 *
 * Every command goes through one injected {@link CommandRunner}, so the exact
 * argv is asserted for all branches with no network and no git. That seam is the
 * reason this module is testable at all — and it is the reason a wrong flag is
 * caught in CI rather than on the one run that needed it.
 *
 * Failures **degrade, never swallow**. Ch12 is unambiguous: every error has
 * exactly three legal dispositions — recover and log, escalate, or degrade
 * gracefully — and *"the worst option is silent failure"* (p152). So a `gh` that
 * is not installed leaves the commit on the branch and reports the sha. The work
 * is not lost and the run says plainly that it is not in a pull request.
 *
 * @module dsh-feature-loop/ship
 */

import { envelopeCommand } from './yolo.ts'
import type { CommandRunner } from './sandbox.ts'

/** One command's outcome. */
export interface CommandResult {
  code: number
  stdout: string
  stderr: string
}

/** What the ship phase produced. */
export interface ShipResult {
  /** The commit that was made, when one was. */
  commitSha?: string
  /** The pull request's URL, when one was opened. */
  prUrl?: string
  /** The branch the work is on, always. */
  branch: string
  /**
   * How it ended.
   *
   * `shipped` — a PR exists. `committed` — the work is on the branch and the PR
   * could not be opened. Both are legitimate outcomes and the report says which.
   */
  outcome: 'shipped' | 'committed'
  /** Every command that ran, for the evidence bundle. */
  log: { command: string; args: string[]; code: number }[]
  /** Why it ended where it did, in one line. Always populated. */
  detail: string
}

/** How the phase was configured. */
export interface ShipOptions {
  /** The worktree the run worked in. Commands run here. */
  worktreeRoot: string
  /** The branch the run commits to. */
  branch: string
  /** The run's goal, for the commit subject. */
  goal: string
  /** The PR body, assembled from the run's own evidence by the caller. */
  body: string
  /** The command runner. Injected so no test needs git or a network. */
  run: CommandRunner
  /** Files to stage. Defaults to everything in the worktree. */
  paths?: string[]
  /** A stop sentinel's path; when it appears, the phase halts before committing. */
  stopSentinel?: string
  /** Whether the sentinel is currently set. Injected so the check is testable. */
  stopArmed?: () => boolean
}

/** A bounded, boring commit subject. Never assembled from the model's output. */
function subjectFor(goal: string): string {
  const oneLine = goal.replace(/\s+/g, ' ').trim()
  const text = oneLine.length <= 72 ? oneLine : `${oneLine.slice(0, 71)}…`
  return text.startsWith('feat:') || text.startsWith('fix:') ? text : `feat: ${text}`
}

/** The first `https://…/pull/N` in a `gh` output stream. */
export function parsePrUrl(stdout: string): string | undefined {
  const match = stdout.match(/https:\/\/[^\s]*\/pull\/\d+/)
  return match?.[0]
}

/**
 * Commit, push and open a pull request.
 *
 * Ordered so the cheapest irreversible step comes last and each stage degrades
 * into the next: if staging finds nothing, there is nothing to commit and the
 * phase says so rather than opening an empty PR; if the commit fails, there is
 * nothing to push; if the push fails the work is still committed locally and the
 * report names the sha so a human can push it.
 *
 * @param options - the worktree, the branch, the goal, the PR body, and the runner.
 * @returns what was produced, and how it ended.
 */
export function ship(options: ShipOptions): ShipResult {
  const { worktreeRoot, branch, goal, body, run } = options
  const log: { command: string; args: string[]; code: number }[] = []
  const invoke = (command: string, args: string[]): CommandResult => {
    const result = run(command, args, worktreeRoot)
    log.push({ command, args, code: result.code })
    return result
  }

  if (options.stopArmed?.() === true) {
    return {
      branch,
      outcome: 'committed',
      log,
      detail: 'the operator\'s stop sentinel was set before the ship phase began; nothing was committed.',
    }
  }

  // The branch has to EXIST before it can be pushed to. A live run produced
  // `error: src refspec fl/… does not match any` because the run's branch name
  // was assumed rather than created — the work was committed on whatever branch
  // the workspace was on, and then pushed to a name that had never existed.
  //
  // Created BEFORE staging, so the commit lands on it. `-b` fails if the branch is
  // already there, which is the normal case on a resumed run, so the checkout is
  // a separate step rather than something whose failure aborts the phase.
  const existing = invoke('git', ['rev-parse', '--verify', options.branch])
  if (existing.code !== 0) {
    const created = invoke('git', ['checkout', '-b', options.branch])
    if (created.code !== 0) {
      return {
        branch: options.branch,
        outcome: 'committed',
        log,
        detail: `could not create branch ${options.branch} (exit ${created.code}): `
          + `${(created.stderr || created.stdout).trim() || 'no output'}. The work is still unstaged.`,
      }
    }
  } else {
    invoke('git', ['checkout', options.branch])
  }

  invoke('git', ['add', ...(options.paths ?? ['-A'])])

  const staged = invoke('git', ['diff', '--cached', '--quiet'])
  if (staged.code === 0) {
    return {
      branch,
      outcome: 'committed',
      log,
      detail: 'nothing was staged — the run produced no file changes, so there is nothing to open a pull request for.',
    }
  }

  const commit = invoke('git', ['commit', '-m', subjectFor(goal)])
  if (commit.code !== 0) {
    return {
      branch,
      outcome: 'committed',
      log,
      detail: `git commit failed (exit ${commit.code}): ${(commit.stderr || commit.stdout).trim() || 'no output'}. `
        + 'The changes are still in the worktree.',
    }
  }
  const commitSha = invoke('git', ['rev-parse', 'HEAD']).stdout.trim() || undefined

  const push = invoke('git', ['push', '-u', 'origin', branch])
  if (push.code !== 0) {
    return {
      ...(commitSha === undefined ? {} : { commitSha }),
      branch,
      outcome: 'committed',
      log,
      detail: `pushed nothing (exit ${push.code}): ${(push.stderr || push.stdout).trim() || 'no output'}. `
        + `The work is committed at ${commitSha ?? 'an unknown sha'} on ${branch}; push it yourself to finish.`,
    }
  }

  const gh = invoke('gh', ['pr', 'create', '--title', subjectFor(goal), '--body', body])
  if (gh.code !== 0) {
    return {
      ...(commitSha === undefined ? {} : { commitSha }),
      branch,
      outcome: 'committed',
      log,
      detail: `the branch is pushed but the pull request was not opened (exit ${gh.code}): `
        + `${(gh.stderr || gh.stdout).trim() || 'no output'}. `
        + `Open it manually from ${branch}, or check that the gh CLI is installed and authenticated.`,
    }
  }

  const prUrl = parsePrUrl(gh.stdout)
  if (prUrl === undefined) {
    // gh exited 0 but printed no URL. That is gh's shape, not ours, and it is
    // worth saying so rather than reporting a PR that cannot be linked to.
    return {
      ...(commitSha === undefined ? {} : { commitSha }),
      branch,
      outcome: 'committed',
      log,
      detail: `gh reported success but printed no pull request URL. The branch ${branch} is pushed; `
        + 'find the pull request on the remote.',
    }
  }

  return {
    ...(commitSha === undefined ? {} : { commitSha }),
    prUrl,
    branch,
    outcome: 'shipped',
    log,
    detail: `opened ${prUrl} from ${branch}`,
  }
}

/**
 * Assemble a pull-request body from a run's own evidence.
 *
 * Pure, so the text a reviewer reads is assertable. The content is deliberately
 * the run's own numbers rather than a summary the model wrote: a PR that
 * explains what it cost, what it proved and what it could not prove is
 * reviewable by a human who never saw the loop run.
 *
 * @param input - the run's goal, its report, its phases and any unverified count.
 * @returns markdown.
 */
export function prBody(input: {
  goal: string
  reportPath: string
  phases: readonly { phase: string; outcome: string; costUSD: number; budgetUSD: number; exitGatePassed?: boolean }[]
  unverified: number
  prUrl?: string
}): string {
  const out: string[] = []
  out.push('## What this is')
  out.push('')
  out.push(input.goal)
  out.push('')
  out.push('> Opened by `@freepeak/dsh-feature-loop`. The author did not write this body; the run did.')
  out.push('')

  out.push('## What was verified')
  out.push('')
  out.push('| Phase | Outcome | Exit gate | Spent | Budget |')
  out.push('|---|---|---|---|---|')
  for (const phase of input.phases) {
    const gate = phase.exitGatePassed === undefined ? '—' : phase.exitGatePassed ? '✅ passed' : '❌ did not pass'
    out.push(`| ${phase.phase} | ${phase.outcome} | ${gate} | $${phase.costUSD.toFixed(4)} | $${phase.budgetUSD.toFixed(4)} |`)
  }
  out.push('')

  if (input.unverified > 0) {
    out.push('## ⚠️ Read this before merging')
    out.push('')
    out.push(
      `**${input.unverified} write step(s) in this run produced no captured artifact.** A step that cannot be `
      + 'evidenced is not reported as a success. Diff the change against the PRD and treat the unverified steps '
      + 'as unreviewed.',
    )
    out.push('')
  }

  out.push('## Evidence')
  out.push('')
  out.push(`Full run report: \`${input.reportPath}\` — every step, every budget and every artifact.`)
  out.push('')
  out.push('---')
  out.push('')
  out.push('_No human reviewed this run before it was opened. Review the diff._')
  out.push('')
  return out.join('\n')
}

/**
 * Whether a command the ship phase wants to run is inside the envelope.
 *
 * Exposed so the ship phase can check itself rather than assume: if a caller
 * configures a branch that the envelope protects, the phase refuses before
 * running anything, instead of letting `git push` be denied mid-sequence with
 * the commit already made.
 *
 * @param branch - the branch the phase would push.
 * @returns true when the push is allowed.
 */
export function pushAllowed(branch: string): boolean {
  return envelopeCommand(`git push origin ${branch}`).kind === 'allow'
}
