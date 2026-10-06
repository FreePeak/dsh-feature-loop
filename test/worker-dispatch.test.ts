/**
 * Worker dispatch, against a terminal that really runs the typed line.
 *
 * `ShellPort` is a `TerminalPort` whose `send` hands the typed text to a real
 * `bash -c` and whose `read` returns what that process printed — a PTY with the
 * line discipline removed. A stub named `xdev` / `claude` / `opencode` on `PATH`
 * stands in for the worker CLI. So these tests exercise the whole chain that can
 * go wrong without a harness: the generated script, the quoting, the markers, the
 * exit code through `tee`, the log, the deadline and the interrupt, and the
 * cleanup — with no LLM, no network and no installed CLI.
 *
 * Run: `node --experimental-strip-types --test test/worker-dispatch.test.ts`
 */

import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'

import { runWorker, terminalPortFor } from '../src/worker-dispatch.ts'
import type { TerminalsService, WorkerEvent } from '../src/worker-dispatch.ts'
import { ShellPort, stubCli } from './worker-rig.ts'
import { checkDispatch, parseWorkersConfig } from '../src/workers.ts'
import type { DispatchRequest } from '../src/workers.ts'

interface Rig {
  port: ShellPort
  work: string
  evidence: string
  events: WorkerEvent[]
  run(partial: Partial<DispatchRequest> & { task: string }, extra?: { signal?: AbortSignal, maxOutputChars?: number }): ReturnType<typeof runWorker>
}

function rig(): Rig {
  const root = mkdtempSync(join(tmpdir(), 'fl-dispatch-'))
  const bin = join(root, 'bin')
  const work = join(root, 'work')
  const evidence = join(root, 'evidence')
  mkdirSync(bin)
  mkdirSync(work)
  for (const name of ['xdev', 'claude', 'opencode']) stubCli(bin, name)
  const port = new ShellPort(work, bin)
  const events: WorkerEvent[] = []
  let n = 0
  return {
    port, work, evidence, events,
    run: (partial, extra = {}) => {
      const checked = checkDispatch({ worker: 'xdev', role: 'implement', timeoutSec: 20, ...partial }, { worktreeRoot: work })
      assert.ok(checked.ok, checked.ok ? '' : checked.reason)
      const config = parseWorkersConfig({ enabled: true, ...extra.maxOutputChars === undefined ? {} : { maxOutputChars: extra.maxOutputChars } })
      return runWorker(port, checked.request, {
        evidenceRoot: evidence,
        config,
        ...extra.signal === undefined ? {} : { signal: extra.signal },
        newId: () => `0000000${++n}`,
        interruptGraceMs: 30,
        onEvent: e => events.push(e),
      })
    },
  }
}

const live: Rig[] = []
afterEach(() => {
  for (const r of live.splice(0)) r.port.close('cleanup')
})

function fresh(): Rig {
  const r = rig()
  live.push(r)
  return r
}

describe('runWorker', { concurrency: false }, () => {
  it('runs the CLI in the terminal and reports completed with its output, log and evidence', async () => {
    const r = fresh()
    const result = await r.run({ task: 'add the flag' })
    assert.equal(result.status, 'completed')
    assert.equal(result.exitCode, 0)
    assert.match(result.output, /did the work/)
    assert.equal(result.session, 'pty-1')
    assert.ok(result.evidenceDir !== undefined && existsSync(join(result.evidenceDir, 'output.log')))
    // The prompt the CLI got is the role's rules plus the brief, from a file.
    const prompt = readFileSync(join(result.evidenceDir!, 'prompt.md'), 'utf8')
    assert.match(prompt, /ROLE: implement/)
    assert.match(prompt, /TASK:\nadd the flag$/)
    // The script is readable evidence of exactly what was launched.
    const script = readFileSync(join(result.evidenceDir!, 'run.sh'), 'utf8')
    assert.match(script, /'xdev' 'print' '-cwd'/)
    assert.ok(!script.includes('add the flag'), 'the brief is in the prompt file, not spliced into the script')
    const saved = JSON.parse(readFileSync(join(result.evidenceDir!, 'result.json'), 'utf8'))
    assert.equal(saved.status, 'completed')
  })

  it('the worker was typed into the terminal as one line that names the script, not the brief', async () => {
    const r = fresh()
    await r.run({ task: 'a very long brief '.repeat(200) })
    const typed = r.port.buffer.split('\n').find(l => l.startsWith('$ '))!
    assert.match(typed, /bash '.*run\.sh'/)
    assert.ok(typed.length < 600, `typed ${typed.length} characters`)
  })

  it('maps a non-zero exit to failed and keeps the CLI\'s own output', async () => {
    const r = fresh()
    const result = await r.run({ task: 'STUB_FAIL please', role: 'test' })
    assert.equal(result.status, 'failed')
    assert.equal(result.exitCode, 3)
    assert.match(result.output, /tests failed: 2/)
  })

  it('drives each of the three CLIs with its own argv', async () => {
    const r = fresh()
    const seen: Record<string, string> = {}
    for (const worker of ['xdev', 'claude', 'opencode'] as const) {
      const result = await r.run({ worker, task: 'ping' })
      assert.equal(result.status, 'completed', worker)
      seen[worker] = result.output
    }
    assert.match(seen.xdev!, /stub xdev argv: print -cwd .* -no-session/)
    assert.match(seen.claude!, /stub claude argv: -p .* --permission-mode acceptEdits --permission-prompts none/)
    assert.match(seen.opencode!, /stub opencode argv: run /)
  })

  it('reads a validator\'s verdict out of its output', async () => {
    const r = fresh()
    const result = await r.run({ task: 'STUB_VALIDATE', role: 'validate', worker: 'claude' })
    assert.equal(result.status, 'completed')
    assert.equal(result.verdict, 'FAIL')
    // A non-validator never gets a verdict, even if its text contains one.
    assert.equal((await r.run({ task: 'STUB_VALIDATE' })).verdict, undefined)
  })

  it('redacts key-shaped output before it reaches the orchestrator or the saved result', async () => {
    const r = fresh()
    const result = await r.run({ task: 'STUB_LEAK' })
    assert.match(result.output, /key is \[REDACTED\]/)
    assert.ok(!/sk-Qz7/.test(result.output))
    assert.ok(!/sk-Qz7/.test(readFileSync(join(result.evidenceDir!, 'result.json'), 'utf8')))
  })

  it('clips large output to the configured size, keeping the tail where the report is', async () => {
    const r = fresh()
    const result = await r.run({ task: 'STUB_BIG' }, { maxOutputChars: 2_000 })
    assert.equal(result.clipped, true)
    assert.ok(result.output.length < 2_400)
    assert.match(result.output, /TAIL-MARKER/)
    assert.match(result.output, /characters clipped/)
    // The full text is still on disk.
    assert.ok(readFileSync(join(result.evidenceDir!, 'output.log'), 'utf8').length > 50_000)
  })

  it('interrupts a worker that outlives its deadline, reports timeout, and still closes the terminal', async () => {
    const r = fresh()
    const started = Date.now()
    const result = await r.run({ task: 'STUB_HANG', timeoutSec: 1 })
    assert.equal(result.status, 'timeout')
    assert.match(result.detail ?? '', /no result within 1s/)
    assert.match(result.output, /working\.\.\./)
    assert.ok(Date.now() - started < 8_000, 'it did not wait for the 30-second sleep')
    assert.deepEqual(r.port.closed, ['pty-1'])
  })

  it('a worker stopped by the deadline that arrives already finished (exit 130) is still a timeout', async () => {
    // The real terminal backend delivers SIGINT itself when a send is aborted,
    // and an interactive shell survives it and prints the end marker. Found
    // against the real PTY backend: the run was reported FAILED (exit 130).
    const r = fresh()
    r.port.survivesInterrupt = true
    const result = await r.run({ task: 'STUB_HANG', timeoutSec: 1 })
    assert.equal(result.status, 'timeout')
    assert.equal(result.exitCode, 130)
    assert.match(result.detail ?? '', /no result within 1s/)
    assert.deepEqual(r.port.closed, ['pty-1'])
  })

  it('a worker that finishes cleanly is completed even if the deadline passed in the same breath', async () => {
    const r = fresh()
    r.port.survivesInterrupt = true
    const result = await r.run({ task: 'ping', timeoutSec: 20 })
    assert.equal(result.status, 'completed')
  })

  it('stops when the orchestrator\'s turn is cancelled, and says aborted rather than timeout', async () => {
    const r = fresh()
    const controller = new AbortController()
    setTimeout(() => controller.abort(new Error('turn cancelled')), 400)
    const result = await r.run({ task: 'STUB_HANG', timeoutSec: 30 }, { signal: controller.signal })
    assert.equal(result.status, 'aborted')
    assert.deepEqual(r.port.closed, ['pty-1'])
  })

  it('reports error, not a throw, when no terminal can be opened', async () => {
    const r = fresh()
    r.port.failOpen = true
    const result = await r.run({ task: 'x' })
    assert.equal(result.status, 'error')
    assert.match(result.detail ?? '', /could not open a terminal: no PTY backend registered/)
    assert.deepEqual(r.port.closed, [], 'nothing was opened, so nothing is closed')
    assert.ok(result.evidenceDir !== undefined, 'the prompt and script were still written')
  })

  it('reports error when the shell exits before the worker reports', async () => {
    const r = fresh()
    r.port.exitAfterSend = true
    const result = await r.run({ task: 'x' })
    assert.equal(result.status, 'error')
    assert.match(result.detail ?? '', /shell exited before the worker reported/)
    assert.deepEqual(r.port.closed, ['pty-1'])
  })

  it('names a missing CLI instead of an opaque exit code', async () => {
    const r = fresh()
    const noBin = new ShellPort(r.work, '/nonexistent')
    // Strip PATH to only the nonexistent dir plus system dirs so `xdev` cannot resolve.
    const env = process.env.PATH
    process.env.PATH = '/usr/bin:/bin'
    try {
      const checked = checkDispatch({ worker: 'opencode', role: 'implement', task: 'x' }, { worktreeRoot: r.work })
      assert.ok(checked.ok)
      const result = await runWorker(noBin, checked.request, { evidenceRoot: r.evidence, config: parseWorkersConfig({}), interruptGraceMs: 10 })
      assert.equal(result.exitCode, 127)
      assert.match(result.detail ?? '', /not found on the terminal's PATH/)
    } finally {
      process.env.PATH = env
    }
  })

  it('emits a start and an end event for the feed', async () => {
    const r = fresh()
    await r.run({ task: 'x', role: 'test' })
    assert.deepEqual(r.events.map(e => e.kind), ['start', 'end'])
    const end = r.events[1]!
    assert.ok(end.kind === 'end' && end.status === 'completed' && end.exitCode === 0)
  })

  it('two workers in a row get separate evidence directories and the right output each', async () => {
    const r = fresh()
    const a = await r.run({ task: 'x' })
    const b = await r.run({ task: 'STUB_FAIL' })
    assert.notEqual(a.evidenceDir, b.evidenceDir)
    assert.ok(!/tests failed/.test(a.output))
    assert.match(b.output, /tests failed/)
  })
})

describe('terminalPortFor', () => {
  it('maps the port onto ctx.terminals, always as the same owner', async () => {
    const calls: unknown[][] = []
    const owner = { id: 'agent-1' }
    const service: TerminalsService = {
      async spawn(o, request, signal) { calls.push(['spawn', o, request, signal !== undefined]); return { sessionId: 'pty-9' } },
      startSend(o, id, request) {
        calls.push(['startSend', o, id, request.text, request.submit])
        return { done: Promise.resolve({ waitReason: 'stdin_read', sessionStatus: { kind: 'exited' } }) }
      },
      read(o, id, request) { calls.push(['read', o, id, request]); return { text: 'line' } },
      async signal(o, id, signal) { calls.push(['signal', o, id, signal]) },
      async kill(o, id, reason) { calls.push(['kill', o, id, reason]) },
    }
    const port = terminalPortFor(service, owner, 'shell')
    const { sessionId } = await port.open({ name: 'w', cwd: '/c', signal: new AbortController().signal })
    const sent = await port.send(sessionId, 'cmd', { submit: true, signal: new AbortController().signal })
    assert.deepEqual(sent, { waitReason: 'stdin_read', exited: true })
    assert.equal(port.read(sessionId, 50), 'line')
    await port.interrupt(sessionId)
    await port.close(sessionId, 'why')
    assert.ok(calls.every(c => c[1] === owner), 'every call carries the orchestrating agent as owner')
    assert.deepEqual(calls[0]!.slice(2, 3), [{ type: 'shell', name: 'w', cwd: '/c' }])
    assert.deepEqual(calls[2], ['read', owner, 'pty-9', { offset: 0, count: 50 }])
    assert.deepEqual(calls[3], ['signal', owner, 'pty-9', 'SIGINT'])
    assert.deepEqual(calls[4], ['kill', owner, 'pty-9', 'why'])
  })
})
