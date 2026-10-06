/**
 * Workers: external coding CLIs (`xdev`, `claude`, `opencode`) as the hands of a
 * feature loop whose brain is the DeepSeek Harness (dsh).
 *
 * The shape is orchestrator / worker. The dsh session is the **control plane**:
 * it owns the goal, the budget, the review gate and the thread the operator
 * reads. A worker is a *process in a dsh terminal* that does one bounded job —
 * implement, test or validate — and whose result comes back to that same
 * thread as a tool result. The orchestrator never takes a worker's word for
 * anything: a worker's exit code and report are evidence the orchestrator
 * weighs, and the phase gates (`phases.ts`) still decide whether a phase is done.
 *
 * This module is the **pure half**: what a worker is, how its command line is
 * built, how a request is judged, how its output is read and how its report is
 * written. No cordis, no `@deepseek-ai/*`, no process spawning — the terminal
 * I/O lives in `worker-dispatch.ts`, so everything here is assertable with no
 * harness and no CLI installed.
 *
 * Two safety properties are decided here rather than trusted to the worker:
 *
 * 1. **Containment.** A dispatch's working directory must be inside the run's
 *    worktree ({@link checkDispatch}). The worker is a *different* agent with
 *    its own tools; the only boundary this loop controls is where it starts and
 *    which permission flags it is started with.
 * 2. **No ambient privilege.** No worker is ever launched with a bypass flag
 *    (`--dangerously-skip-permissions`, `-yolo`, `--auto`). Each CLI gets its
 *    narrowest non-interactive permission mode for the role, and anything that
 *    would need a prompt is denied rather than asked — nobody is there to ask.
 *
 * @module dsh-feature-loop/workers
 */

import { isAbsolute, relative, resolve, sep } from 'node:path'

/** The worker CLIs this loop knows how to drive. */
export const WORKER_KINDS = ['xdev', 'claude', 'opencode'] as const

/** One worker CLI. */
export type WorkerKind = typeof WORKER_KINDS[number]

/**
 * What a worker is asked to do. These mirror the pipeline's implement and test
 * phases, plus an independent read-only check — the "validate" the orchestrator
 * can not do honestly on its own output.
 */
export const WORKER_ROLES = ['implement', 'test', 'validate'] as const

/** One role. */
export type WorkerRole = typeof WORKER_ROLES[number]

/** The model-facing tool that dispatches a worker. */
export const WORKER_TOOL_NAME = 'dispatch_worker'

/** The longest task text a dispatch may carry, in characters. A task is a brief, not a transcript. */
export const MAX_TASK_CHARS = 8_000

/** Default wall-clock limit for one worker, in seconds. */
export const DEFAULT_TIMEOUT_SEC = 900

/** Hard ceiling for `timeoutSec`, so a model cannot park a terminal for a day. */
export const MAX_TIMEOUT_SEC = 3_600

/** Default cap on the characters of worker output returned to the orchestrator. */
export const DEFAULT_MAX_OUTPUT_CHARS = 12_000

/** The validated `workers:` config block. */
export interface WorkersConfig {
  /** Register the `dispatch_worker` tool. Off unless asked for: it adds a model-facing tool. */
  enabled: boolean
  /** Which CLIs may be dispatched. Anything else is refused by the envelope too. */
  allow: readonly WorkerKind[]
  /** The terminal backend type to open sessions on (`dsh-terminal-bash` provides `shell`). */
  backendType: string
  /** Default per-worker timeout. */
  timeoutSec: number
  /** Cap on output characters handed back to the orchestrator. */
  maxOutputChars: number
  /** Per-CLI `--model` override, when the operator wants a worker on a specific route. */
  models: Readonly<Partial<Record<WorkerKind, string>>>
  /**
   * The project's verification command. When set, the `test` role's Claude Code
   * worker is allowed to run exactly this command and nothing else.
   */
  testCommand?: string
}

const WORKERS_KEYS = new Set([
  'enabled', 'allow', 'backendType', 'timeoutSec', 'maxOutputChars', 'models', 'testCommand',
])

/**
 * Validate the `workers:` block.
 *
 * Fails loud on an unknown key for the same reason `parsePipelineConfig` does:
 * a typo'd `alow:` that silently falls back to "allow everything" is a
 * permission widened by a spelling mistake.
 *
 * @param raw - the block as the patch row delivered it, or `undefined`.
 * @returns the config with defaults applied; `enabled` is false when absent.
 * @throws TypeError naming the bad field.
 */
export function parseWorkersConfig(raw: unknown): WorkersConfig {
  const defaults: WorkersConfig = {
    enabled: false,
    allow: WORKER_KINDS,
    backendType: 'shell',
    timeoutSec: DEFAULT_TIMEOUT_SEC,
    maxOutputChars: DEFAULT_MAX_OUTPUT_CHARS,
    models: {},
  }
  if (raw === undefined || raw === null) return defaults
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TypeError('workers must be an object')
  }
  const block = raw as Record<string, unknown>
  for (const key of Object.keys(block)) {
    if (!WORKERS_KEYS.has(key)) {
      throw new TypeError(`workers.${key} is not a known field (known: ${[...WORKERS_KEYS].join(', ')})`)
    }
  }

  if (block.enabled !== undefined && typeof block.enabled !== 'boolean') {
    throw new TypeError('workers.enabled must be a boolean')
  }

  let allow: readonly WorkerKind[] = defaults.allow
  if (block.allow !== undefined) {
    if (!Array.isArray(block.allow) || block.allow.length === 0) {
      throw new TypeError('workers.allow must be a non-empty list of worker names')
    }
    for (const entry of block.allow) {
      if (!isWorkerKind(entry)) {
        throw new TypeError(`workers.allow: "${String(entry)}" is not a worker (known: ${WORKER_KINDS.join(', ')})`)
      }
    }
    allow = [...new Set(block.allow as WorkerKind[])]
  }

  const backendType = block.backendType ?? defaults.backendType
  if (typeof backendType !== 'string' || backendType.trim() === '') {
    throw new TypeError('workers.backendType must be a non-empty string')
  }

  const timeoutSec = block.timeoutSec ?? defaults.timeoutSec
  if (typeof timeoutSec !== 'number' || !Number.isInteger(timeoutSec) || timeoutSec < 1 || timeoutSec > MAX_TIMEOUT_SEC) {
    throw new TypeError(`workers.timeoutSec must be an integer between 1 and ${MAX_TIMEOUT_SEC}`)
  }

  const maxOutputChars = block.maxOutputChars ?? defaults.maxOutputChars
  if (typeof maxOutputChars !== 'number' || !Number.isInteger(maxOutputChars) || maxOutputChars < 200) {
    throw new TypeError('workers.maxOutputChars must be an integer of at least 200')
  }

  const models: Partial<Record<WorkerKind, string>> = {}
  if (block.models !== undefined) {
    if (block.models === null || typeof block.models !== 'object' || Array.isArray(block.models)) {
      throw new TypeError('workers.models must be an object keyed by worker name')
    }
    for (const [kind, model] of Object.entries(block.models as Record<string, unknown>)) {
      if (!isWorkerKind(kind)) {
        throw new TypeError(`workers.models.${kind}: not a worker (known: ${WORKER_KINDS.join(', ')})`)
      }
      if (typeof model !== 'string' || !SAFE_MODEL.test(model)) {
        throw new TypeError(`workers.models.${kind} must be a model reference like provider/model`)
      }
      models[kind] = model
    }
  }

  if (block.testCommand !== undefined && (typeof block.testCommand !== 'string' || block.testCommand.trim() === '')) {
    throw new TypeError('workers.testCommand must be a non-empty string')
  }

  return {
    enabled: block.enabled === true,
    allow,
    backendType,
    timeoutSec,
    maxOutputChars,
    models,
    ...typeof block.testCommand === 'string' ? { testCommand: block.testCommand.trim() } : {},
  }
}

/** A model reference as the CLIs take it: letters, digits and `._:/@-`, no spaces, no leading dash. */
const SAFE_MODEL = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/

/** Whether a value names a known worker CLI. */
export function isWorkerKind(value: unknown): value is WorkerKind {
  return typeof value === 'string' && (WORKER_KINDS as readonly string[]).includes(value)
}

/** Whether a value names a known role. */
export function isWorkerRole(value: unknown): value is WorkerRole {
  return typeof value === 'string' && (WORKER_ROLES as readonly string[]).includes(value)
}

/** A dispatch the policy accepted, with every default resolved. */
export interface DispatchRequest {
  worker: WorkerKind
  role: WorkerRole
  /** The brief, as the orchestrator wrote it. */
  task: string
  /** Absolute directory the worker starts in. Inside the worktree when there is one. */
  cwd: string
  timeoutSec: number
}

/** The verdict on a dispatch's arguments. */
export type DispatchCheck =
  | { ok: true, request: DispatchRequest }
  | { ok: false, reason: string }

/** What {@link checkDispatch} judges the arguments against. */
export interface DispatchPolicy {
  /** The run's worktree. Required for containment; absent means "no root to contain against". */
  worktreeRoot?: string
  /** The directory used when the call names none (the session's cwd). */
  defaultCwd?: string
  allow?: readonly WorkerKind[]
  timeoutSec?: number
  /**
   * Refuse when `worktreeRoot` is absent. The YOLO envelope sets it: an
   * unattended worker with no containment root is the scenario the envelope
   * exists to prevent. Supervised runs leave it off — a human approves each
   * dispatch and sees the directory.
   */
  requireRoot?: boolean
}

/**
 * Whether `candidate` is `root` or under it, lexically.
 *
 * Lexical, not realpath: this module is pure. The terminal's own sandbox is the
 * second layer for symlinks; what this check stops is `../..` and an absolute
 * path somewhere else.
 *
 * @param root - the containment root.
 * @param candidate - the path to test.
 * @returns true when the candidate resolves inside the root.
 */
export function withinRoot(root: string, candidate: string): boolean {
  const rel = relative(resolve(root), resolve(candidate))
  return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel))
}

/**
 * Judge the arguments of one `dispatch_worker` call.
 *
 * Total and pure: anything it cannot read is a refusal with a reason, never a
 * throw, because the caller is a hook in the middle of someone's tool call.
 *
 * @param args - the call's parsed arguments, as the model wrote them.
 * @param policy - the allow-list, root and defaults.
 * @returns the resolved request, or the reason it was refused.
 */
export function checkDispatch(args: unknown, policy: DispatchPolicy = {}): DispatchCheck {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) {
    return { ok: false, reason: 'dispatch_worker needs an object of arguments' }
  }
  const a = args as Record<string, unknown>

  if (!isWorkerKind(a.worker)) {
    return { ok: false, reason: `worker must be one of ${WORKER_KINDS.join(', ')} (got ${JSON.stringify(a.worker)})` }
  }
  const allow = policy.allow ?? WORKER_KINDS
  if (!allow.includes(a.worker)) {
    return { ok: false, reason: `worker "${a.worker}" is not allowed here (allowed: ${allow.join(', ')})` }
  }
  if (!isWorkerRole(a.role)) {
    return { ok: false, reason: `role must be one of ${WORKER_ROLES.join(', ')} (got ${JSON.stringify(a.role)})` }
  }
  if (typeof a.task !== 'string' || a.task.trim() === '') {
    return { ok: false, reason: 'task must be a non-empty string: a worker with no brief has nothing to do' }
  }
  if (a.task.length > MAX_TASK_CHARS) {
    return { ok: false, reason: `task is ${a.task.length} characters; the limit is ${MAX_TASK_CHARS}. Write a brief, not a transcript.` }
  }

  const root = policy.worktreeRoot
  if (root === undefined && policy.requireRoot === true) {
    return { ok: false, reason: 'no worktree root: an unattended worker has nothing to be contained against' }
  }

  const named = a.cwd === undefined || a.cwd === '' ? undefined : a.cwd
  if (named !== undefined && typeof named !== 'string') {
    return { ok: false, reason: 'cwd must be a string' }
  }
  const base = root ?? policy.defaultCwd
  const cwdInput = named ?? base
  if (cwdInput === undefined) {
    return { ok: false, reason: 'no working directory: pass cwd, or run inside a session with a workspace' }
  }
  if (!isAbsolute(cwdInput) && base === undefined) {
    return { ok: false, reason: 'cwd must be absolute when no workspace is known' }
  }
  const cwd = isAbsolute(cwdInput) ? resolve(cwdInput) : resolve(base as string, cwdInput)
  if (root !== undefined && !withinRoot(root, cwd)) {
    return { ok: false, reason: `cwd ${cwd} is outside the run's worktree (${root}); a worker starts inside the containment root` }
  }
  if (/[\0\r\n]/.test(cwd)) {
    return { ok: false, reason: 'cwd contains a control character' }
  }

  let timeoutSec = policy.timeoutSec ?? DEFAULT_TIMEOUT_SEC
  if (a.timeoutSec !== undefined) {
    if (typeof a.timeoutSec !== 'number' || !Number.isInteger(a.timeoutSec) || a.timeoutSec < 1) {
      return { ok: false, reason: 'timeoutSec must be a positive integer' }
    }
    timeoutSec = Math.min(a.timeoutSec, MAX_TIMEOUT_SEC)
  }

  return { ok: true, request: { worker: a.worker, role: a.role, task: a.task, cwd, timeoutSec } }
}

/**
 * The worker's brief: the role's standing rules wrapped around the task.
 *
 * Written for a model that has *not* read this repo's AGENTS.md and will not
 * negotiate: what it may touch, what it must not, and the exact shape of the
 * report the orchestrator parses. The rules close the specific ways a delegated
 * agent goes wrong — committing on its own, "fixing" a test by weakening it,
 * and reporting success without evidence.
 *
 * @param role - what the worker is for.
 * @param task - the orchestrator's brief.
 * @param testCommand - the project's verification command, when known.
 * @returns the full prompt text.
 */
export function rolePrompt(role: WorkerRole, task: string, testCommand?: string): string {
  const common = [
    'You are a worker spawned by the dsh feature loop. The orchestrator owns the goal, the budget and the review; you do one bounded job and report back.',
    'Work only inside the current directory. Do not touch files outside it, do not read or print credentials, and do not use the network except to fetch dependencies the task names.',
    'Do not run `git commit`, `git push`, `git reset`, `git checkout` or anything else that moves history or branches: the orchestrator ships. Leave your changes uncommitted.',
    'Your final message is parsed. End it with a `## Worker report` section containing: Result (one line), Files changed (list or "none"), Commands run with their exit codes, and Unverified (anything you did not check). Never claim a check you did not run.',
  ]
  const byRole: Record<WorkerRole, string[]> = {
    implement: [
      'ROLE: implement. Make the smallest change that delivers the task. Follow the conventions of the code you find; read before you write.',
      'Add or update tests for what you change. Do not weaken, skip or delete an existing test to make anything pass.',
    ],
    test: [
      'ROLE: test. Run the project\'s tests, diagnose failures and fix the cause in the code under test or in the new tests.',
      ...testCommand === undefined ? [] : [`The verification command is: ${testCommand} — run exactly that for your final result.`],
      'Never suppress, skip or weaken a test. If something still fails after your attempts, stop and report the failure output verbatim; a clear failure report is a good result.',
    ],
    validate: [
      'ROLE: validate. You are an independent reviewer. Do NOT modify, create or delete any file.',
      'Read the diff (`git diff`, `git status`) and the code around it, compare it with the task, and look for correctness bugs, missing tests, scope creep and unsafe behaviour.',
      'Your report must contain exactly one line `VERDICT: PASS` or `VERDICT: FAIL`, followed by the evidence for it. When unsure, FAIL.',
    ],
  }
  return [...common, ...byRole[role], '', 'TASK:', task.trim()].join('\n')
}

/** Placeholder in an argv for the prompt; the run script substitutes the prompt file's content. */
export const PROMPT_SLOT = '\u0000PROMPT\u0000'

/** Inputs for {@link buildArgv}. */
export interface ArgvOptions {
  cwd: string
  timeoutSec: number
  model?: string
  /** For Claude Code's `test` role: the single command it may run. */
  testCommand?: string
  /** A label for the CLI's own session list. */
  title?: string
}

/**
 * The argv for one worker run, with the prompt as {@link PROMPT_SLOT}.
 *
 * Every flag below was read from the CLI's own `--help`, and the permission
 * choice per role is the narrowest that still lets the role work:
 *
 * | worker   | implement / test                          | validate                |
 * |----------|-------------------------------------------|-------------------------|
 * | xdev     | `-approval-mode write`                    | `-plan` (read-only)     |
 * | claude   | `--permission-mode acceptEdits`, prompts denied | `--permission-mode plan` |
 * | opencode | default permissions (no `--auto`)         | `--agent plan`          |
 *
 * There is no bypass flag in any column, deliberately. A worker that needs more
 * than this is a worker whose job should be done under a human's eye.
 *
 * @param kind - the CLI.
 * @param role - the job.
 * @param options - directory, time limit and overrides.
 * @returns the argv, binary first.
 */
export function buildArgv(kind: WorkerKind, role: WorkerRole, options: ArgvOptions): string[] {
  const model = options.model
  switch (kind) {
    case 'xdev':
      return [
        'xdev', 'print',
        '-cwd', options.cwd,
        '-no-session',
        '-max-time', `${options.timeoutSec}s`,
        ...role === 'validate' ? ['-plan'] : ['-approval-mode', 'write'],
        ...model === undefined ? [] : ['-model', model],
        PROMPT_SLOT,
      ]
    case 'claude':
      // The prompt goes first: `--allowedTools` is variadic and would swallow a
      // trailing positional.
      return [
        'claude', '-p', PROMPT_SLOT,
        '--permission-mode', role === 'validate' ? 'plan' : 'acceptEdits',
        '--permission-prompts', 'none',
        '--no-session-persistence',
        ...model === undefined ? [] : ['--model', model],
        ...role !== 'validate' && options.testCommand !== undefined
          ? ['--allowedTools', `Bash(${options.testCommand})`]
          : [],
      ]
    case 'opencode':
      return [
        'opencode', 'run',
        ...role === 'validate' ? ['--agent', 'plan'] : [],
        ...model === undefined ? [] : ['-m', model],
        ...options.title === undefined ? [] : ['--title', options.title],
        PROMPT_SLOT,
      ]
  }
}

/**
 * Quote one string for a POSIX shell.
 *
 * Single quotes with the `'\''` splice. Total: every string, including the empty
 * one and one containing quotes or newlines, round-trips.
 *
 * @param value - the text to quote.
 * @returns a single shell word.
 */
export function shQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`
}

/** Where a run's files are, as the script refers to them. */
export interface RunPaths {
  promptFile: string
  logFile: string
}

/**
 * The script a worker runs from.
 *
 * Written to a file instead of typed into the terminal for three reasons. A
 * long prompt through a PTY's line discipline gets mangled and can hit the
 * line-length limit. The quoting is done once, here, by a function with a
 * round-trip test, rather than by the model's idea of a shell. And the script is
 * evidence: what exactly was launched is a file an operator can read later.
 *
 * `tee` shows the output live in the dsh terminal and keeps the full text in a
 * log; `PIPESTATUS` carries the worker's own exit code through the pipe.
 *
 * @param argv - from {@link buildArgv}.
 * @param paths - the prompt and log files.
 * @param cwd - the directory to start in.
 * @returns the script text.
 */
export function renderRunScript(argv: readonly string[], paths: RunPaths, cwd: string): string {
  const words = argv.map(word => (word === PROMPT_SLOT ? '"$prompt"' : shQuote(word))).join(' ')
  return [
    '#!/usr/bin/env bash',
    '# Generated by dsh-feature-loop. One worker run; safe to read, not to edit.',
    `cd ${shQuote(cwd)} || exit 97`,
    `prompt=$(cat ${shQuote(paths.promptFile)}) || exit 98`,
    `${words} </dev/null 2>&1 | tee ${shQuote(paths.logFile)}`,
    'exit "${PIPESTATUS[0]}"',
    '',
  ].join('\n')
}

/** Markers that bracket one run in the terminal's scrollback. */
export interface Markers {
  begin: string
  end: string
}

/** The two literal marker strings for a run id. */
export function markersFor(id: string): Markers {
  return { begin: `__FL_BEGIN_${id}__`, end: `__FL_END_${id}__` }
}

/**
 * The line typed into the terminal.
 *
 * The markers are emitted by `printf` from *split* literals, so the echoed
 * command line does not itself contain a marker — otherwise the terminal's echo
 * of what was typed would look exactly like the run having finished.
 *
 * @param scriptPath - the generated script.
 * @param id - the run id.
 * @returns one shell line.
 */
export function terminalCommand(scriptPath: string, id: string): string {
  const { begin, end } = markersFor(id)
  const half = (marker: string): [string, string] => [marker.slice(0, 8), marker.slice(8)]
  const [b1, b2] = half(begin)
  const [e1, e2] = half(end)
  return [
    `printf '%s%s\\n' ${shQuote(b1)} ${shQuote(b2)}`,
    `bash ${shQuote(scriptPath)}`,
    `printf '%s%s %s\\n' ${shQuote(e1)} ${shQuote(e2)} "$?"`,
  ].join('; ')
}

/** What the scrollback says about one run. */
export interface ScrollScan {
  /** The end marker was printed. */
  finished: boolean
  exitCode?: number
  /** The text between the markers, for when the log file is unreadable. */
  body: string
}

/**
 * Read a run's state out of terminal scrollback.
 *
 * The marker must be a whole line: an end marker appearing mid-line is the
 * worker quoting our own command back at us, not the run ending.
 *
 * @param scrollback - the newest lines of the session.
 * @param id - the run id.
 * @returns whether the run finished, its exit code and the bracketed body.
 */
export function scanScrollback(scrollback: string, id: string): ScrollScan {
  const { begin, end } = markersFor(id)
  const lines = scrollback.replaceAll('\r', '').split('\n')
  const beginAt = lines.lastIndexOf(begin)
  const endPattern = new RegExp(`^${end} (\\d+)\\s*$`)
  let endAt = -1
  let exitCode: number | undefined
  for (let i = lines.length - 1; i > beginAt; i--) {
    const m = endPattern.exec(lines[i]!)
    if (m !== null) {
      endAt = i
      exitCode = Number(m[1])
      break
    }
  }
  const from = beginAt + 1
  const body = lines.slice(from, endAt === -1 ? undefined : endAt).join('\n')
  return endAt === -1
    ? { finished: false, body }
    : { finished: true, exitCode: exitCode as number, body }
}

/**
 * Mask secret-shaped substrings.
 *
 * Worker output goes into the orchestrator's context and onto disk, and a
 * worker that printed a key (`env`, a config dump, a stack trace carrying a
 * header) must not turn the transcript into a place keys live. These patterns
 * track `.githooks/pre-commit`'s so that what the commit scan would block is
 * also what is masked here.
 *
 * @param text - raw worker output.
 * @returns the text with each match replaced by `[REDACTED]`.
 */
export function redactSecrets(text: string): string {
  let out = text
  for (const pattern of SECRET_SHAPES) out = out.replace(pattern, '[REDACTED]')
  return out
}

const SECRET_SHAPES: readonly RegExp[] = [
  /AKIA[0-9A-Z]{16}/g,
  /ghp_[A-Za-z0-9]{36}/g,
  /github_pat_[A-Za-z0-9_]{60,}/g,
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  /xox[baprs]-[A-Za-z0-9-]{10,}/g,
  /glpat-[A-Za-z0-9_-]{20}/g,
  /AIza[0-9A-Za-z_-]{35}/g,
  /npm_[A-Za-z0-9]{30,}/g,
  /-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END[A-Z ]*PRIVATE KEY-----|$)/g,
  /(token|access_token|apikey|api_key)=[A-Za-z0-9_-]{30,}/gi,
  /\b(Bearer)\s+[A-Za-z0-9._~+/=-]{24,}/g,
]

/** How a worker run ended. */
export type WorkerStatus =
  /** Exit code 0. */
  | 'completed'
  /** The CLI ran and exited non-zero. */
  | 'failed'
  /** The deadline passed and the run was interrupted. */
  | 'timeout'
  /** The orchestrator's turn was cancelled. */
  | 'aborted'
  /** The run never produced an exit code: no terminal, no CLI, a dead shell. */
  | 'error'

/** A validator's one-line verdict. */
export type WorkerVerdict = 'PASS' | 'FAIL'

/** Everything the orchestrator learns about one worker run. */
export interface WorkerResult {
  id: string
  worker: WorkerKind
  role: WorkerRole
  status: WorkerStatus
  exitCode?: number
  durationMs: number
  /** Redacted output, clipped to the configured size (head and tail). */
  output: string
  /** True when `output` is a clipped view of a longer log. */
  clipped: boolean
  /** From a `validate` worker's `VERDICT:` line, when it wrote one. */
  verdict?: WorkerVerdict
  /** The terminal session the worker ran in. */
  session?: string
  /** Where the prompt, script, log and result JSON are on disk. */
  evidenceDir?: string
  /** Why the run is `error`, `timeout` or `aborted`. */
  detail?: string
}

/**
 * The validator's verdict line.
 *
 * The **last** `VERDICT:` line wins: a reviewer that quotes the instruction
 * ("write VERDICT: PASS or VERDICT: FAIL") early and decides at the end has
 * decided at the end.
 *
 * @param output - the worker's output.
 * @returns the verdict, or `undefined` when there is none to read.
 */
export function parseVerdict(output: string): WorkerVerdict | undefined {
  let found: WorkerVerdict | undefined
  for (const m of output.matchAll(/^\W*VERDICT:\s*(PASS|FAIL)\b/gim)) {
    found = m[1]!.toUpperCase() as WorkerVerdict
  }
  return found
}

/**
 * Clip text to a size, keeping the head and the tail.
 *
 * Both ends because they hold different things: the head says what the worker
 * understood, the tail holds its report and its failure. Keeping only the tail
 * is the common choice and loses the first thing a reader looks for.
 *
 * @param text - the text.
 * @param max - the character budget.
 * @returns the clipped text and whether anything was cut.
 */
export function clipMiddle(text: string, max: number): { text: string, clipped: boolean } {
  if (text.length <= max) return { text, clipped: false }
  const head = Math.floor(max * 0.25)
  const tail = max - head
  const cut = text.length - head - tail
  return {
    text: `${text.slice(0, head)}\n[… ${cut} characters clipped; the full log is in the evidence directory …]\n${text.slice(text.length - tail)}`,
    clipped: true,
  }
}

/**
 * Remove terminal control sequences (colours, cursor moves) from CLI output.
 *
 * A worker runs in a pseudo-terminal, so `opencode` and friends colour their
 * output; the escape bytes are noise to the orchestrator and make the
 * dashboard feed unreadable.
 *
 * @param text - raw terminal output.
 * @returns the same text without ANSI escape sequences.
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '').replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, '')
}

/**
 * A one-line tail of a worker's output, for the dashboard feed.
 *
 * @param output - the (already redacted) output.
 * @param max - the longest excerpt to return.
 * @returns whitespace-collapsed text, ending with the last `max` characters.
 */
export function workerExcerpt(output: string, max = 280): string {
  const flat = stripAnsi(output).replace(/\s+/g, ' ').trim()
  return flat.length <= max ? flat : `…${flat.slice(flat.length - max + 1)}`
}

/**
 * A pointer for the failures that are about the *environment*, not the task.
 *
 * A worker runs inside dsh's own sandbox. Under `workspace-write` (dsh's default
 * permission mode) a CLI cannot read its login or write its state directory, and
 * says so in its own words. The orchestrator would otherwise read that as "the
 * task failed" and retry or rewrite the brief.
 *
 * @param result - the finished run.
 * @returns a one-line hint, or `undefined` when the output shows no such symptom.
 */
export function environmentHint(result: Pick<WorkerResult, 'status' | 'output'>): string | undefined {
  if (result.status === 'completed') return undefined
  if (/EPERM|operation not permitted|EACCES|permission denied|token has expired|not logged in|failed to authenticate|has no credential|\b401\b/i.test(result.output)) {
    return 'hint: this looks like the CLI\'s own login or state directory is unreachable from the dsh terminal (sandbox or credential), not a problem with the brief. See docs/WORKERS.md, "Permissions and credentials".'
  }
  return undefined
}

/**
 * The report the main session thread reads.
 *
 * This text *is* the worker-to-orchestrator channel: it is returned as the
 * `dispatch_worker` tool result, so it lands in the same thread the operator is
 * watching. It leads with the facts the orchestrator branches on (status, exit
 * code, verdict) and ends with an explicit statement of what it does not prove.
 *
 * @param result - what the run produced.
 * @returns plain text.
 */
export function formatWorkerReport(result: WorkerResult): string {
  const seconds = (result.durationMs / 1000).toFixed(1)
  const hint = environmentHint(result)
  const head = [
    `[worker report] ${result.worker} · ${result.role} · ${result.status.toUpperCase()}`
    + `${result.exitCode === undefined ? '' : ` (exit ${result.exitCode})`} · ${seconds}s`,
    ...result.verdict === undefined ? [] : [`verdict: ${result.verdict}`],
    ...result.session === undefined ? [] : [`terminal: ${result.session}`],
    ...result.evidenceDir === undefined ? [] : [`evidence: ${result.evidenceDir}`],
    ...result.detail === undefined ? [] : [`note: ${result.detail}`],
    ...hint === undefined ? [] : [hint],
  ]
  const body = result.output.trim() === '' ? '(the worker printed nothing)' : result.output.trim()
  const tail = result.role === 'validate'
    ? 'A validator\'s verdict is a second opinion, not the gate: the phase gate still decides.'
    : 'This report is the worker\'s own account. It does not replace the phase gate or a run of the project\'s tests: verify before you rely on it.'
  return [...head, '--- worker output ---', body, '--- end ---', tail].join('\n')
}

/**
 * Where a run's worker evidence goes.
 *
 * **Outside the worktree.** The ship phase runs `git add -A` in the worktree, so
 * a prompt/script/log written inside it would be committed into the pull request.
 * For a sandboxed run (`<repo>/.feature-loop/worktrees/<id>`) the evidence lands
 * in the repo's `.feature-loop/workers/<id>`, next to the run records; otherwise
 * in the OS temp directory.
 *
 * @param worktreeRoot - the run's worktree, when it has one.
 * @param tmp - the OS temp directory.
 * @param worktreeDir - the sandbox's worktree directory, relative to the repo.
 * @returns an absolute directory path.
 */
export function evidenceRoot(worktreeRoot: string | undefined, tmp: string, worktreeDir = '.feature-loop/worktrees'): string {
  if (worktreeRoot !== undefined) {
    const normal = resolve(worktreeRoot)
    const marker = `${sep}${worktreeDir.split('/').join(sep)}${sep}`
    const at = normal.lastIndexOf(marker)
    if (at !== -1) {
      const repo = normal.slice(0, at)
      const runId = normal.slice(at + marker.length).split(sep)[0]
      if (runId !== undefined && runId !== '') return resolve(repo, '.feature-loop', 'workers', runId)
    }
  }
  return resolve(tmp, 'dsh-feature-loop', 'workers')
}
