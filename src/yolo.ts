/**
 * The YOLO envelope: what an unattended run may do, and what it may never do.
 *
 * YOLO mode collapses the review gate's three-way verdict — allow / ask / deny —
 * to two: **allow** and **deny**. There is no `ask`, and that is the whole
 * definition. No prompt is raised, so none can be missed, timed out, or rubber-
 * stamped. The book names what that trades away: approval fatigue is *"strictly
 * worse than no approval at all … the illusion of oversight while removing the
 * reality"* (p89), and the defence against it is a boundary a human cannot
 * click through, not a prompt they can.
 *
 * So safety lives here, in four parts:
 *
 * 1. **This table.** A frozen allow/deny policy over the commands and paths an
 *    unattended run can reach. It is the security-critical surface of the whole
 *    pipeline, which is why it is a pure function over plain data with its own
 *    test file, and why nothing in it reads configuration that a prompt could
 *    influence.
 * 2. **A throwaway worktree** (App B #22: *"File operations happen in a restricted
 *    directory"*). A run that goes wrong dirties a directory that can be deleted
 *    with one command.
 * 3. **The ceilings** in `phase-budget.ts`. The only thing between a bad prompt
 *    and a bill.
 * 4. **A kill switch** (App B #75). One file; checked every step.
 *
 * The book's failure case for getting this wrong is not hypothetical: a fintech
 * loop issued 2,400 duplicate refunds in 18 minutes for $340,000 because it never
 * checked whether the action had already been taken (p8). The single mitigation
 * it names is that *"every write operation in a production loop must include an
 * idempotency key check before execution"* — which for a coding agent means the
 * same thing: a write that is not reversible must not be reachable unattended.
 *
 * Pure — no cordis, no harness import, no `node:fs`. The worktree and kill-switch
 * I/O live in the plugin.
 *
 * @module dsh-feature-loop/yolo
 */

/** How an unattended run may use one tool call. Two outcomes. There is no third. */
export type EnvelopeDecision =
  | { kind: 'allow'; reason: string }
  | { kind: 'deny'; reason: string }

/** The shape the policy is asked about. Everything it needs, and nothing it could be talked into. */
export interface EnvelopeRequest {
  /** The harness's tool name: `read`, `write`, `edit`, `bash`, `glob`, `grep`. */
  tool: string
  /** The call's parsed arguments. Read defensively — a shape assumption here is a hole. */
  args?: unknown
  /**
   * The absolute path the loop's worktree is rooted at.
   *
   * Required. Without it the containment check below has nothing to contain
   * against, so a missing root denies rather than defaulting to "allowed".
   */
  worktreeRoot?: string
  /** The project's test command, for the shell allow-list's one escape hatch. */
  verifyCommand?: string
}

/**
 * Branches that must never receive a push, whatever the arguments say.
 *
 * Matched on the argument list rather than on the command text, because `git
 * push origin HEAD:main` is `push` with a refspec in the third position and a
 * substring check on "push" alone would wave it through.
 */
export const PROTECTED_BRANCHES: readonly string[] = ['main', 'master', 'develop', 'release']

/**
 * Subcommands of the GitHub CLI that change state beyond opening a pull request.
 *
 * `pr create` is the one the ship phase is allowed. Everything else here is
 * irreversible from the loop's side: a merge is a human's decision, and a
 * release cut is permanent.
 */
export const FORBIDDEN_GH_SUBCOMMANDS: readonly string[] = [
  'pr merge',
  'pr close',
  'pr ready',
  'pr review',
  'release',
  'release create',
  'api',
  'workflow run',
] as const

/**
 * Commands whose whole purpose is to publish or destroy. Matched as a leading
 * token pair, so `npm run build` is not caught by `npm publish`.
 */
export const FORBIDDEN_COMMAND_PREFIXES: readonly string[] = [
  'npm publish',
  'pnpm publish',
  'yarn publish',
  'npm unpublish',
  'gh release',
  'kubectl apply',
  'kubectl delete',
  'terraform apply',
  'terraform destroy',
  'docker push',
  'systemctl',
  'shutdown',
  'reboot',
] as const

/**
 * Filenames the run may never write, whatever tool it uses.
 *
 * Matches the repo's own `AGENTS.md` secret rule, which is the same rule the
 * pre-commit hook enforces on a human: keys do not live in a repo, and they must
 * not arrive through a loop either.
 */
export const SECRET_FILE_PATTERNS: readonly RegExp[] = [
  /(^|\/)\.env(\..+)?$/i,
  /(^|\/)credentials\.(ya?ml|json)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.(p12|pfx|keystore)$/i,
] as const

/**
 * Path segments that may not be traversed, on read or write.
 *
 * The book's "treat all tool and external input as untrusted" rule (p65), applied
 * to paths: these are the directories where a loop's mistakes are not recoverable
 * by `git checkout`.
 */
export const FORBIDDEN_PATH_SEGMENTS: readonly string[] = ['.git', 'node_modules/.cache']

/** Read a string field from unknown arguments without throwing. */
function argString(args: unknown, key: string): string | undefined {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) return undefined
  const value = (args as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

/** Read a string array field, tolerating a bare string. */
function argList(args: unknown, key: string): string[] {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) return []
  const value = (args as Record<string, unknown>)[key]
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return typeof value === 'string' ? [value] : []
}

/**
 * Split a shell command into its leading words.
 *
 * Not a shell parser and not pretending to be one — it tokenises on whitespace
 * with quotes honoured, which is enough to answer "which subcommand is this"
 * without pretending to answer "what will this actually do". Anything this
 * cannot confidently read is denied below rather than allowed on a guess, which
 * is the fail-closed direction the existing `ReviewGate` already takes.
 */
export function commandWords(command: string): string[] {
  const words: string[] = []
  let current = ''
  let quote: '"' | "'" | undefined
  for (const char of command) {
    if (quote !== undefined) {
      if (char === quote) quote = undefined
      else current += char
      continue
    }
    if (char === '"' || char === "'") { quote = char; continue }
    if (/\s/.test(char)) {
      if (current.length > 0) { words.push(current); current = '' }
      continue
    }
    current += char
  }
  if (current.length > 0) words.push(current)
  return words
}

/** Every push refspec in a `git push` argument list: positional refs and `--refspec`. */
function pushRefspecs(args: string[]): string[] {
  const specs: string[] = []
  for (let i = 0; i < args.length; i += 1) {
    const word = args[i]!
    if (word === '--refspec' || word === '-f' && i > 0 && args[i - 1] === 'push') {
      if (args[i + 1] !== undefined) specs.push(args[i + 1]!)
      i += 1
      continue
    }
    if (word.startsWith('--refspec=')) { specs.push(word.slice('--refspec='.length)); continue }
    if (word.startsWith('-')) continue
    // `git push [remote] [refspec...]` — everything positional is a refspec.
    specs.push(word)
  }
  return specs
}

/** The branch name a refspec targets, if any. */
function targetBranch(spec: string): string | undefined {
  const colon = spec.indexOf(':')
  if (colon < 0) {
    // `git push origin fl/x` pushes the local branch of the same name.
    return spec.split('/').pop()
  }
  const rhs = spec.slice(colon + 1)
  if (rhs.length === 0) return undefined // `:branch` deletes the remote ref
  return rhs.startsWith('refs/heads/') ? rhs.slice('refs/heads/'.length) : rhs
}

/**
 * Whether a path is inside the worktree.
 *
 * Textual, after normalising separators and resolving `.` / `..` by hand. A path
 * that resolves above the root denies — which is the answer for `../` escapes and
 * for absolute paths elsewhere on the machine. No `node:path` import, because
 * this module must stay dependency-free and CI runs it with no install.
 */
export function isInside(root: string | undefined, candidate: string): boolean {
  if (root === undefined || root.length === 0) return false
  const norm = (p: string): string[] => {
    const out: string[] = []
    for (const seg of p.replace(/\\/g, '/').split('/')) {
      if (seg === '' || seg === '.') continue
      if (seg === '..') { out.pop(); continue }
      out.push(seg)
    }
    return out
  }
  const rootParts = norm(root)
  const parts = norm(candidate.startsWith('/') ? candidate : `${root}/${candidate}`)
  if (parts.length < rootParts.length) return false
  return rootParts.every((seg, i) => parts[i] === seg)
}

/** Whether a path names a secret file, or lives in one of the untouchable directories. */
export function isForbiddenPath(candidate: string): string | undefined {
  for (const pattern of SECRET_FILE_PATTERNS) {
    if (pattern.test(candidate)) return 'the file looks like a credential, and credentials never enter through a loop'
  }
  const normalised = candidate.replace(/\\/g, '/')
  for (const segment of FORBIDDEN_PATH_SEGMENTS) {
    if (normalised.includes(`/${segment}/`) || normalised.startsWith(`${segment}/`)) {
      return `the path touches ${segment}, where a loop's mistakes are not recoverable`
    }
  }
  return undefined
}

/**
 * Judge one tool call against the envelope.
 *
 * Every branch denies rather than asks. The function is pure and total: any
 * request it cannot confidently classify is denied, because "I did not
 * understand this" and "this is fine" must never produce the same answer.
 *
 * @param request - the tool, its arguments and the run's worktree root.
 * @returns allow or deny, with a one-line reason either way.
 */
export function envelope(request: EnvelopeRequest): EnvelopeDecision {
  const { tool, args } = request

  // ── file writes ────────────────────────────────────────────────────────────
  if (tool === 'write' || tool === 'edit') {
    const path = argString(args, 'path') ?? argString(args, 'file_path') ?? argString(args, 'filePath')
    if (path === undefined) {
      return { kind: 'deny', reason: 'write without a path argument: the envelope cannot tell what it would write' }
    }
    if (!isInside(request.worktreeRoot, path)) {
      return {
        kind: 'deny',
        reason: `write outside the run's worktree (${path}) — the envelope contains every write to its own directory`,
      }
    }
    const forbidden = isForbiddenPath(path)
    if (forbidden !== undefined) return { kind: 'deny', reason: `${path}: ${forbidden}` }
    return { kind: 'allow', reason: `${tool} inside the worktree` }
  }

  // ── reads ──────────────────────────────────────────────────────────────────
  if (tool === 'read' || tool === 'glob' || tool === 'grep') {
    const path = argString(args, 'path')
    // A read of a credential is how a key ends up in a transcript, so a named
    // secret file denies on read too. A bare `grep` with no path is fine: it
    // searches from the workspace root, which is already the boundary.
    if (path !== undefined) {
      const forbidden = isForbiddenPath(path)
      if (forbidden !== undefined) return { kind: 'deny', reason: `read: ${forbidden}` }
    }
    return { kind: 'allow', reason: 'read' }
  }

  // ── shell ──────────────────────────────────────────────────────────────────
  if (tool === 'bash' || tool === 'shell' || tool === 'run') {
    const command = argString(args, 'command') ?? argString(args, 'cmd') ?? argString(args, 'script')
    if (command === undefined) {
      return { kind: 'deny', reason: 'shell call with no readable command — the envelope denies what it cannot read' }
    }
    return envelopeCommand(command, { worktreeRoot: request.worktreeRoot, verifyCommand: request.verifyCommand })
  }

  return {
    kind: 'deny',
    reason: `tool "${tool}" is not in the envelope — YOLO allows only what it has been told about`,
  }
}

/**
 * Judge one shell command against the envelope.
 *
 * Split out from {@link envelope} so the ship phase and any future tool share one
 * answer for "may this command run", rather than each re-deciding.
 *
 * @param command - the command line as the model wrote it.
 * @returns allow or deny.
 */
export function envelopeCommand(command: string, policy: ShellPolicy = {}): EnvelopeDecision {
  const words = commandWords(command)
  if (words.length === 0) return { kind: 'deny', reason: 'empty command' }

  // Prefixes are checked on the *joined leading words*, so `sudo npm publish` and
  // `npm publish --dry-run=false` are both caught and `npm run publish-script` is
  // not.
  const head = words.slice(0, 2).join(' ')
  const head3 = words.slice(0, 3).join(' ')
  for (const prefix of FORBIDDEN_COMMAND_PREFIXES) {
    if (head3.startsWith(prefix) || head === prefix || (words[0] === prefix.split(' ')[0] && head3.startsWith(prefix))) {
      return { kind: 'deny', reason: `"${prefix}" publishes or destroys, and YOLO does neither` }
    }
  }

  if (words[0] === 'git') {
    return envelopeGit(words)
  }
  if (words[0] === 'gh') {
    const sub = words.slice(1, 3).join(' ')
    const banned = FORBIDDEN_GH_SUBCOMMANDS.find(f => sub === f || sub.startsWith(`${f} `))
    if (banned !== undefined) {
      return { kind: 'deny', reason: `"gh ${banned}" changes state beyond opening a pull request; ship stops at the PR` }
    }
    if (words[1] !== 'pr' || words[2] !== 'create') {
      return {
        kind: 'deny',
        reason: `"gh ${sub}" is not "gh pr create" — the envelope allows opening a pull request and nothing else`,
      }
    }
    return { kind: 'allow', reason: 'opening a pull request' }
  }
  if (words[0] === 'rm') {
    // Any absolute path, not just the bare `/` token: `rm -rf /usr` is the same
    // accident with one more character. A relative target is fine, because the
    // loop can always delete its whole worktree with `git worktree remove` and
    // a relative path stays inside it.
    const absolute = words.slice(1).some(w => w.startsWith('/'))
    if ((words.includes('-rf') || words.includes('-fr') || words.includes('--recursive')) && absolute) {
      return { kind: 'deny', reason: 'recursive force-delete of an absolute path; the worktree is removed with `git worktree remove`' }
    }
    if (words.includes('--no-preserve-root')) {
      return { kind: 'deny', reason: '"--no-preserve-root" defeats the filesystem\'s own protection' }
    }
  }
  if (words[0] === 'chmod' || words[0] === 'chown') {
    return { kind: 'deny', reason: 'changing permissions or ownership is outside the envelope' }
  }

  // The one command the loop is allowed to execute is the one the operator
  // configured as their test command. Matched in full, so an allowed `npm test`
  // cannot be extended with `&& something-else`.
  if (policy.verifyCommand !== undefined && command.trim() === policy.verifyCommand.trim()) {
    return { kind: 'allow', reason: 'the configured verify command' }
  }
  if (!(READ_ONLY_COMMANDS.has(words[0]!))) {
    return {
      kind: 'deny',
      reason: `"${words[0]}" is not on the shell allow-list. YOLO runs unattended, and a shell can do anything `
        + 'a deny-list failed to name — so the list is of what it MAY run, not what it may not. '
        + (INTERPRETERS.has(words[0]!)
          ? ' An interpreter is not on the list because it can compute its own paths at runtime, which no '
            + 'reading of the command can contain.'
          : ' Set pipeline.testCommand to the one command the loop is allowed to execute.'),
    }
  }
  const escape = escapesWorktree(words, policy.worktreeRoot)
  if (escape !== undefined) return { kind: 'deny', reason: escape }
  return { kind: 'allow', reason: `shell: ${words[0]}` }
}

/**
 * The exact command the loop is permitted to execute, and the root it is
 * permitted to touch.
 *
 * An exact string match, not a prefix: `npm test` being allowed must not imply
 * `npm test && rm -rf ~` is allowed, and only the operator knows which command
 * actually verifies their project.
 */
export interface ShellPolicy {
  /** The project's test command. Matched in full. */
  verifyCommand?: string
  /** The run's worktree, for the path-containment check. */
  worktreeRoot?: string
}

/**
 * Commands that only read.
 *
 * Deliberately a short list of things whose whole purpose is inspection. Every
 * one either cannot write or writes only to its own stdout, which is why they
 * survive without a path check on their output.
 */
export const READ_ONLY_COMMANDS: ReadonlySet<string> = new Set([
  'ls', 'pwd', 'cat', 'head', 'tail', 'wc', 'grep', 'rg', 'find', 'file', 'stat',
  'which', 'env', 'true',
])

/**
 * Commands that execute code, and are therefore NOT on the read-only list.
 *
 * Named here only to record why they are absent. `node -e "…"` computes its own
 * paths at runtime, so no amount of inspecting the command's tokens can contain
 * it — the string it writes to is not in the argv. An allow-list of interpreters
 * is not containment.
 *
 * They remain reachable through the one escape hatch: the operator's configured
 * `verifyCommand`, matched in full. So a YOLO run can still run the test suite,
 * and can run **nothing else**.
 */
export const INTERPRETERS: ReadonlySet<string> = new Set([
  'node', 'npm', 'pnpm', 'npx', 'make', 'sh', 'bash', 'python', 'python3', 'deno', 'bun',
])

/**
 * Find a token that names a path outside the worktree.
 *
 * The check that makes `cat ~/.ssh/id_rsa` and `sed -i /elsewhere/f` fail. It
 * fires on `~`, on any absolute path, and on any relative path carrying a `..`.
 * A bare word like `src` is left alone: it is relative to the command's own cwd,
 * which the harness already pins to the worktree.
 *
 * @param words - the tokenised command.
 * @param root - the run's worktree.
 * @returns a reason when a token escapes, `undefined` when none does.
 */
export function escapesWorktree(words: readonly string[], root: string | undefined): string | undefined {
  if (root === undefined) {
    return 'YOLO has no worktree to contain shell commands against, so no shell command is allowed'
  }
  for (const word of words) {
    if (word.startsWith('-')) continue
    if (word.startsWith('~')) {
      return `"${word}" is outside the worktree: ~ is the home directory, not the run's directory`
    }
    if (word.includes('..')) {
      return `"${word}" traverses out of the worktree`
    }
    if (word.startsWith('/') && !isInside(root, word)) {
      return `"${word}" is outside the worktree — YOLO contains every path it touches`
    }
  }
  return undefined
}

/** Judge a `git` invocation. */
function envelopeGit(words: string[]): EnvelopeDecision {
  const sub = words[1]
  if (sub === undefined) return { kind: 'deny', reason: 'git with no subcommand' }

  if (sub === 'push') {
    if (words.includes('--force') || words.includes('-f') || words.some(w => w.startsWith('--force-with-'))) {
      return { kind: 'deny', reason: 'force-push destroys history the evidence bundle describes' }
    }
    for (const spec of pushRefspecs(words.slice(2))) {
      const branch = targetBranch(spec)
      if (branch === undefined) {
        return { kind: 'deny', reason: `"${spec}" deletes the remote ref; YOLO does not delete` }
      }
      if (PROTECTED_BRANCHES.includes(branch)) {
        return {
          kind: 'deny',
          reason: `"${branch}" is a protected branch — the run pushes only its own branch and never main`,
        }
      }
    }
    return { kind: 'allow', reason: 'pushing the run\'s own branch' }
  }

  if (sub === 'reset' && words.includes('--hard')) {
    return { kind: 'deny', reason: '"git reset --hard" discards work; the run\'s history is the evidence' }
  }
  if (sub === 'clean') {
    return { kind: 'deny', reason: '"git clean" can delete untracked work that no diff records' }
  }
  if (sub === 'rebase' || sub === 'filter-branch') {
    return { kind: 'deny', reason: `"git ${sub}" rewrites history` }
  }
  if (sub === 'config' && words.includes('user.email')) {
    return { kind: 'deny', reason: 'rewriting git identity is a machine-wide change' }
  }

  return { kind: 'allow', reason: `git ${sub}` }
}

/**
 * Whether the kill-switch sentinel is asking the loop to stop.
 *
 * Checked on every step rather than on a timer, so a stop lands within one step
 * — App B #75 asks for seconds, and a poll interval is how that becomes minutes.
 *
 * @param sentinelPresent - whether `.feature-loop/STOP` exists.
 * @param state - where the run is, for the reason line.
 * @returns a reject decision when the stop is armed, `undefined` otherwise.
 */
export function killSwitchDecision(
  sentinelPresent: boolean,
  state: string,
): { kind: 'reject'; reason: string } | undefined {
  if (!sentinelPresent) return undefined
  return {
    kind: 'reject',
    reason: `the operator's stop sentinel is set — halting the run while in "${state}". `
      + 'Report what you completed, what remains, and the next action. Remove .feature-loop/STOP to resume.',
  }
}
