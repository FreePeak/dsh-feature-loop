/**
 * Run one worker CLI inside a dsh terminal and report back.
 *
 * `workers.ts` decides *what* to run; this module runs it. The seam is
 * {@link TerminalPort}: the four things a terminal can do for us. In production
 * it is `ctx.terminals` (the owner-scoped PTY service in `@deepseek-ai/dsh-terminal`),
 * in a test it is a fake — so the polling, the deadline, the interrupt and the
 * cleanup are all asserted without a harness or a worker CLI.
 *
 * Why a terminal and not `child_process`: the worker's output scrolls in a real
 * dsh terminal session the operator can look at, the session is fenced to the
 * orchestrating agent (another agent cannot read or drive it), and the harness
 * tears it down with the agent. A bare `spawn` would give none of that.
 *
 * The run, in order:
 *
 * 1. Write the prompt and a generated run script to the evidence directory.
 * 2. Open a terminal session in the worker's directory.
 * 3. Type one line: begin marker, the script, end marker with `$?`.
 * 4. Poll the scrollback for the end marker. A send can settle early
 *    (`inferred_idle` — the worker is thinking quietly), so an empty send keeps
 *    the wait going without typing anything.
 * 5. On the deadline, SIGINT the foreground process group, and report `timeout`.
 * 6. Always close the session. A terminal left behind is a process left behind.
 *
 * @module dsh-feature-loop/worker-dispatch
 */

import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  PROMPT_SLOT,
  buildArgv,
  clipMiddle,
  parseVerdict,
  redactSecrets,
  renderRunScript,
  rolePrompt,
  scanScrollback,
  terminalCommand,
} from './workers.ts'
import type { DispatchRequest, WorkerResult, WorkersConfig, WorkerStatus } from './workers.ts'

/** What a settled terminal send says. A subset of the PTY service's result. */
export interface SendOutcome {
  /** Why the wait ended: `stdin_read`, `inferred_idle`, `timeout` or `session_exit`. */
  waitReason: string
  /** Whether the session's shell has exited. */
  exited: boolean
}

/**
 * The terminal operations the dispatcher needs.
 *
 * Narrower than `ctx.terminals` on purpose: a dispatcher that can only open,
 * send, read, interrupt and close cannot be talked into anything else.
 */
export interface TerminalPort {
  /** Open a session whose shell starts in `cwd`. */
  open(options: { name: string, cwd: string, signal: AbortSignal }): Promise<{ sessionId: string }>
  /** Type `text` (submitting it when asked) and wait until the shell settles or `signal` aborts. */
  send(sessionId: string, text: string, options: { submit: boolean, signal: AbortSignal }): Promise<SendOutcome>
  /** The newest `lines` lines of the session's scrollback. */
  read(sessionId: string, lines: number): string
  /** SIGINT the foreground process group. */
  interrupt(sessionId: string): Promise<void>
  /** Close the session and wait for its process tree to end. */
  close(sessionId: string, reason: string): Promise<void>
}

/** Knobs the runner exposes so a test can drive time. */
export interface RunWorkerOptions {
  /** Where this run's evidence goes. */
  evidenceRoot: string
  /** Output cap, and the other config the run needs. */
  config: Pick<WorkersConfig, 'maxOutputChars' | 'models' | 'testCommand'>
  /** Cancellation of the orchestrating turn. */
  signal?: AbortSignal
  /** Epoch ms. */
  now?: () => number
  /** Run id. Hex, shell-safe by construction. */
  newId?: () => string
  /** Grace after SIGINT before the session is closed, ms. */
  interruptGraceMs?: number
  /** Scrollback lines read per poll. */
  scanLines?: number
  /** Called at each lifecycle step, for the dashboard feed. */
  onEvent?: (event: WorkerEvent) => void
}

/** A lifecycle event, for the feed. */
export type WorkerEvent =
  | { kind: 'start', id: string, worker: string, role: string, cwd: string, session: string }
  | { kind: 'end', id: string, worker: string, role: string, status: WorkerStatus, exitCode?: number }

const DEFAULT_SCAN_LINES = 4_000
const DEFAULT_INTERRUPT_GRACE_MS = 2_000

/** A fresh run id: 8 hex characters. */
function defaultId(): string {
  return randomBytes(4).toString('hex')
}

/**
 * Run one worker to a result. Never throws: every failure is a `WorkerResult`
 * with a `status` and a `detail`, because the caller is a tool body and a
 * thrown error would be a tool failure the model reads as "the tool is broken"
 * rather than "the worker failed".
 *
 * @param port - the terminal.
 * @param request - an accepted dispatch (see `checkDispatch`).
 * @param options - evidence location, config and the clock.
 * @returns what happened.
 */
export async function runWorker(
  port: TerminalPort,
  request: DispatchRequest,
  options: RunWorkerOptions,
): Promise<WorkerResult> {
  const now = options.now ?? Date.now
  const id = (options.newId ?? defaultId)()
  const startedAt = now()
  const evidenceDir = join(options.evidenceRoot, `${id}-${request.worker}-${request.role}`)
  const files = {
    prompt: join(evidenceDir, 'prompt.md'),
    script: join(evidenceDir, 'run.sh'),
    log: join(evidenceDir, 'output.log'),
    result: join(evidenceDir, 'result.json'),
  }

  const base = { id, worker: request.worker, role: request.role }
  const finish = (partial: Omit<WorkerResult, 'id' | 'worker' | 'role' | 'durationMs' | 'output' | 'clipped'> & { raw?: string }): WorkerResult => {
    const redacted = redactSecrets(partial.raw ?? '')
    const { text, clipped } = clipMiddle(redacted, options.config.maxOutputChars)
    const verdict = request.role === 'validate' ? parseVerdict(redacted) : undefined
    const { raw: _raw, ...rest } = partial
    const result: WorkerResult = {
      ...base,
      ...rest,
      durationMs: Math.max(0, now() - startedAt),
      output: text,
      clipped,
      ...verdict === undefined ? {} : { verdict },
      evidenceDir,
    }
    try {
      writeFileSync(files.result, `${JSON.stringify({ ...result, output: undefined }, null, 2)}\n`)
    } catch {
      // Evidence is best-effort at the very end; the result is what matters.
    }
    options.onEvent?.({ kind: 'end', id, worker: request.worker, role: request.role, status: result.status, ...result.exitCode === undefined ? {} : { exitCode: result.exitCode } })
    return result
  }

  // 1. Evidence on disk, before anything runs.
  try {
    mkdirSync(evidenceDir, { recursive: true, mode: 0o700 })
    const model = options.config.models[request.worker]
    const argv = buildArgv(request.worker, request.role, {
      cwd: request.cwd,
      timeoutSec: request.timeoutSec,
      title: `feature-loop ${request.role} ${id}`,
      ...model === undefined ? {} : { model },
      ...options.config.testCommand === undefined ? {} : { testCommand: options.config.testCommand },
    })
    if (!argv.includes(PROMPT_SLOT)) throw new Error('internal: argv has no prompt slot')
    writeFileSync(files.prompt, rolePrompt(request.role, request.task, options.config.testCommand), { mode: 0o600 })
    writeFileSync(files.script, renderRunScript(argv, { promptFile: files.prompt, logFile: files.log }, request.cwd), { mode: 0o700 })
  } catch (error) {
    return finish({ status: 'error', detail: `could not write the run files: ${messageOf(error)}` })
  }

  const outer = options.signal ?? new AbortController().signal
  const deadlineMs = startedAt + request.timeoutSec * 1000
  const deadline = new AbortController()
  const timer = setTimeout(() => deadline.abort(new Error('worker deadline')), Math.max(0, deadlineMs - now()))
  const stop = AbortSignal.any([outer, deadline.signal])
  let sessionId: string | undefined

  try {
    // 2. A terminal. Opening is bounded by the caller's signal, not the deadline:
    // a slow shell start should not eat the worker's time budget silently, but a
    // cancelled turn must still cancel it.
    try {
      const opened = await port.open({ name: `fl-worker-${id}`, cwd: request.cwd, signal: outer })
      sessionId = opened.sessionId
    } catch (error) {
      return finish({ status: outer.aborted ? 'aborted' : 'error', detail: `could not open a terminal: ${messageOf(error)}` })
    }
    options.onEvent?.({ kind: 'start', id, worker: request.worker, role: request.role, cwd: request.cwd, session: sessionId })

    // 3–4. Type the line, then wait for the end marker.
    const scanLines = options.scanLines ?? DEFAULT_SCAN_LINES
    let first = true
    let scan = scanScrollback('', id)
    let stalled = 0
    for (;;) {
      let outcome: SendOutcome
      try {
        outcome = await port.send(sessionId, first ? terminalCommand(files.script, id) : '', { submit: first, signal: stop })
      } catch (error) {
        if (outer.aborted) return await interrupted('aborted', 'the orchestrator\'s turn was cancelled')
        if (deadline.signal.aborted) return await interrupted('timeout', `no result within ${request.timeoutSec}s`)
        return finish({ status: 'error', session: sessionId, raw: logOr(files.log, scan.body), detail: `terminal send failed: ${messageOf(error)}` })
      }
      first = false

      scan = scanScrollback(safeRead(port, sessionId, scanLines), id)
      if (scan.finished) {
        // The real terminal backend delivers SIGINT itself when a send is
        // aborted, so a worker stopped by the deadline or by a cancelled turn
        // usually arrives here *finished*, with exit 130, before the checks
        // below ever run. That is a stop, not a failure, and the report must say
        // so. A zero exit at the deadline is still a completed run: it finished.
        if (scan.exitCode !== 0 && (outer.aborted || deadline.signal.aborted)) {
          return finish({
            status: outer.aborted ? 'aborted' : 'timeout',
            exitCode: scan.exitCode as number,
            session: sessionId,
            raw: logOr(files.log, scan.body),
            detail: outer.aborted ? 'the orchestrator\'s turn was cancelled' : `no result within ${request.timeoutSec}s`,
          })
        }
        break
      }
      if (outer.aborted) return await interrupted('aborted', 'the orchestrator\'s turn was cancelled')
      if (deadline.signal.aborted || now() >= deadlineMs) return await interrupted('timeout', `no result within ${request.timeoutSec}s`)
      if (outcome.exited || outcome.waitReason === 'session_exit') {
        return finish({
          status: 'error',
          session: sessionId,
          raw: logOr(files.log, scan.body),
          detail: 'the terminal shell exited before the worker reported an exit code',
        })
      }
      // A settled send that did not finish the run must not spin: a backend
      // that returns instantly on every empty send would otherwise burn the CPU
      // until the deadline. Back off a little each time it happens back-to-back.
      stalled = outcome.waitReason === 'timeout' || outcome.waitReason === 'inferred_idle' ? 0 : stalled + 1
      if (stalled > 0) await sleep(Math.min(250 * stalled, 2_000), stop)
    }

    const exitCode = scan.exitCode as number
    return finish({
      status: exitCode === 0 ? 'completed' : 'failed',
      exitCode,
      session: sessionId,
      raw: logOr(files.log, scan.body),
      ...exitCode === 97 ? { detail: 'the worker\'s directory could not be entered (exit 97)' } : {},
      ...exitCode === 127 ? { detail: `"${request.worker}" was not found on the terminal's PATH (exit 127)` } : {},
    })
  } finally {
    clearTimeout(timer)
    if (sessionId !== undefined) {
      try {
        await port.close(sessionId, 'feature-loop worker finished')
      } catch {
        // A close that fails is reported by the terminal service on owner
        // disposal; failing the result over it would hide a finished run.
      }
    }
  }

  /** Interrupt the foreground process, give it a moment, then report. */
  async function interrupted(status: 'timeout' | 'aborted', detail: string): Promise<WorkerResult> {
    const session = sessionId as string
    try {
      await port.interrupt(session)
    } catch {
      // The close in `finally` still ends the process tree.
    }
    await sleep(options.interruptGraceMs ?? DEFAULT_INTERRUPT_GRACE_MS)
    const scanned = scanScrollback(safeRead(port, session, options.scanLines ?? DEFAULT_SCAN_LINES), id)
    return finish({
      status,
      session,
      raw: logOr(files.log, scanned.body),
      detail,
      // The interrupted process usually prints its marker within the grace
      // period; its exit code (130 for SIGINT) is worth keeping in the report.
      ...scanned.finished ? { exitCode: scanned.exitCode as number } : {},
    })
  }
}

/** The log file when it has content, otherwise the scrollback body. */
function logOr(logFile: string, fallback: string): string {
  try {
    const text = readFileSync(logFile, 'utf8')
    if (text.trim() !== '') return text
  } catch {
    // The terminal's sandbox may not let the script write outside the worktree.
  }
  return fallback
}

function safeRead(port: TerminalPort, session: string, lines: number): string {
  try {
    return port.read(session, lines)
  } catch {
    return ''
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (ms <= 0 || signal?.aborted === true) return resolve()
    const timer = setTimeout(done, ms)
    const onAbort = (): void => {
      clearTimeout(timer)
      done()
    }
    function done(): void {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * The slice of `ctx.terminals` the adapter calls. Declared structurally so this
 * module imports nothing from the harness and a test double needs no cast.
 */
export interface TerminalsService {
  spawn(owner: unknown, request: { type: string, name?: string, cwd?: string }, signal?: AbortSignal): Promise<{ sessionId: string }>
  startSend(owner: unknown, id: string, request: { text: string, submit?: boolean, signal?: AbortSignal }): {
    done: Promise<{ waitReason: string, sessionStatus: { kind: string } }>
  }
  read(owner: unknown, id: string, request?: { offset?: number, count?: number }): { text: string }
  signal(owner: unknown, id: string, signal: string): Promise<unknown>
  kill(owner: unknown, id: string, reason?: string): Promise<unknown>
}

/**
 * A {@link TerminalPort} over the harness's owner-scoped terminal service.
 *
 * @param terminals - `ctx.terminals`.
 * @param owner - the orchestrating agent. The service fences every session to
 *   exactly this object: no other agent can read or drive the worker's terminal.
 * @param backendType - which backend to open (`shell` for `dsh-terminal-bash`).
 * @returns the port.
 */
export function terminalPortFor(terminals: TerminalsService, owner: unknown, backendType: string): TerminalPort {
  return {
    async open({ name, cwd, signal }) {
      const spawned = await terminals.spawn(owner, { type: backendType, name, cwd }, signal)
      return { sessionId: spawned.sessionId }
    },
    async send(sessionId, text, { submit, signal }) {
      const result = await terminals.startSend(owner, sessionId, { text, submit, signal }).done
      return { waitReason: result.waitReason, exited: result.sessionStatus.kind === 'exited' }
    },
    read(sessionId, lines) {
      return terminals.read(owner, sessionId, { offset: 0, count: lines }).text
    },
    async interrupt(sessionId) {
      await terminals.signal(owner, sessionId, 'SIGINT')
    },
    async close(sessionId, reason) {
      await terminals.kill(owner, sessionId, reason)
    },
  }
}
