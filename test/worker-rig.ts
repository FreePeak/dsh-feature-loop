/**
 * Test support: a terminal that really runs the typed line, and stub worker CLIs.
 *
 * `ShellPort` is a `TerminalPort` whose `send` hands the typed text to a real
 * `bash -c` and whose `read` returns what that process printed — a PTY with the
 * line discipline removed. Not a test file (no `.test.` in the name), so the
 * runner's glob does not pick it up.
 */

import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { chmodSync, writeFileSync } from 'node:fs'
import { delimiter, join } from 'node:path'

import type { SendOutcome, TerminalPort } from '../src/worker-dispatch.ts'

/** A terminal backed by `bash -c`. One session, one foreground process at a time. */
export class ShellPort implements TerminalPort {
  buffer = ''
  child: ChildProcess | undefined
  opened: string[] = []
  closed: string[] = []
  interrupts = 0
  failOpen = false
  exitAfterSend = false
  /** Like an interactive shell: SIGINT kills the foreground child, not the shell. */
  survivesInterrupt = false
  readonly cwd: string
  readonly path: string
  constructor(cwd: string, path: string) {
    this.cwd = cwd
    this.path = path
  }

  async open({ name }: { name: string, cwd: string, signal: AbortSignal }): Promise<{ sessionId: string }> {
    if (this.failOpen) throw new Error('no PTY backend registered for "shell"')
    this.opened.push(name)
    return { sessionId: 'pty-1' }
  }

  send(_id: string, text: string, { signal }: { submit: boolean, signal: AbortSignal }): Promise<SendOutcome> {
    if (signal.aborted) return Promise.reject(new Error('PTY send aborted before write'))
    if (text !== '') {
      this.buffer += `$ ${text}\n`
      const child = spawn('bash', ['-c', this.survivesInterrupt ? `trap : INT; ${text}` : text], {
        cwd: this.cwd,
        env: { ...process.env, PATH: `${this.path}${delimiter}${process.env.PATH ?? ''}` },
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      this.child = child
      child.stdout?.on('data', d => { this.buffer += String(d) })
      child.stderr?.on('data', d => { this.buffer += String(d) })
    }
    const child = this.child
    return new Promise(resolve => {
      const settle = (waitReason: string, exited = false): void => {
        clearTimeout(idle)
        signal.removeEventListener('abort', onAbort)
        resolve({ waitReason, exited })
      }
      // The real backend cancels the foreground on abort; so does this.
      const onAbort = (): void => {
        this.signalGroup('SIGINT')
        settle('timeout')
      }
      signal.addEventListener('abort', onAbort, { once: true })
      // A quiet worker settles the send as `inferred_idle`, as the real backend does.
      const idle = setTimeout(() => settle('inferred_idle'), 150)
      if (this.exitAfterSend) return settle('session_exit', true)
      if (child === undefined || child.exitCode !== null) return settle('stdin_read')
      child.once('exit', () => setTimeout(() => settle('stdin_read'), 20))
    })
  }

  read(_id: string, lines: number): string {
    return this.buffer.split('\n').slice(-lines).join('\n')
  }

  async interrupt(): Promise<void> {
    this.interrupts += 1
    this.signalGroup('SIGINT')
  }

  async close(id: string): Promise<void> {
    this.closed.push(id)
    this.signalGroup('SIGKILL')
  }

  private signalGroup(signal: NodeJS.Signals): void {
    const pid = this.child?.pid
    if (pid === undefined) return
    try {
      process.kill(-pid, signal)
    } catch {
      // already gone
    }
  }
}

/** A fake worker CLI. Behaviour is chosen by words in its prompt, which is how a real brief steers a real one. */
export function stubCli(dir: string, name: string): void {
  const secret = 'sk-' + 'Qz7'.repeat(10)
  writeFileSync(join(dir, name), [
    '#!/usr/bin/env bash',
    'all="$*"',
    // The argv, with the multi-line prompt shown as a placeholder.
    `printf 'stub ${name} argv:'; for a in "$@"; do case "$a" in *$'\\n'*) printf ' <prompt>';; *) printf ' %s' "$a";; esac; done; echo`,
    'case "$all" in',
    '  *STUB_FAIL*) echo "tests failed: 2" >&2; exit 3 ;;',
    '  *STUB_HANG*) echo "working..."; sleep 30; echo unreachable ;;',
    `  *STUB_LEAK*) echo "key is ${secret}"; exit 0 ;;`,
    '  *STUB_BIG*) head -c 60000 /dev/zero | tr "\\0" "y"; echo; echo "TAIL-MARKER"; exit 0 ;;',
    '  *STUB_WRITE*) echo made > made-by-worker.txt; echo edited >> tracked.txt; echo "wrote files"; exit 0 ;;',
    '  *STUB_ANSI*) printf "\\033[0m\\033[1;32mcoloured text\\033[0m\\n"; exit 0 ;;',
    '  *STUB_VALIDATE*) echo "checked the diff"; echo "VERDICT: FAIL"; exit 0 ;;',
    '  *) echo "did the work"; exit 0 ;;',
    'esac',
    '',
  ].join('\n'))
  chmodSync(join(dir, name), 0o755)
}

