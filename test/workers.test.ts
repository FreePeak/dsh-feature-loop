/**
 * Workers: the pure half.
 *
 * What is pinned here is what a wrong answer would cost: a worker started
 * outside the worktree, a worker started with a bypass flag, a shell quote that
 * does not round-trip (a prompt is model-written text, and it will contain
 * quotes), an echoed command line mistaken for a finished run, and a key in a
 * worker's output reaching the transcript.
 *
 * Secret-shaped strings are assembled at run time, so this file does not itself
 * trip `.githooks/pre-commit`.
 *
 * Run: `node --experimental-strip-types --test test/workers.test.ts`
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  DEFAULT_TIMEOUT_SEC,
  MAX_TASK_CHARS,
  MAX_TIMEOUT_SEC,
  PROMPT_SLOT,
  WORKER_KINDS,
  WORKER_ROLES,
  WORKER_TOOL_NAME,
  buildArgv,
  checkDispatch,
  clipMiddle,
  evidenceRoot,
  formatWorkerReport,
  markersFor,
  parseVerdict,
  parseWorkersConfig,
  redactSecrets,
  renderRunScript,
  rolePrompt,
  scanScrollback,
  shQuote,
  terminalCommand,
  withinRoot,
} from '../src/workers.ts'
import type { WorkerKind, WorkerResult, WorkerRole } from '../src/workers.ts'
import { envelope } from '../src/yolo.ts'
import { phaseNotice } from '../src/phase-notice.ts'

const ROOT = '/tmp/fl-run/worktree'

describe('parseWorkersConfig', () => {
  it('is off by default and allows every known CLI once enabled', () => {
    const none = parseWorkersConfig(undefined)
    assert.equal(none.enabled, false)
    assert.deepEqual([...none.allow], [...WORKER_KINDS])
    assert.equal(none.timeoutSec, DEFAULT_TIMEOUT_SEC)
    assert.equal(parseWorkersConfig({ enabled: true }).enabled, true)
  })

  it('fails loud on an unknown key rather than widening the allow-list', () => {
    assert.throws(() => parseWorkersConfig({ enabled: true, alow: ['xdev'] }), /workers\.alow is not a known field/)
  })

  it('rejects a CLI it cannot drive, an empty allow-list, and bad numbers', () => {
    assert.throws(() => parseWorkersConfig({ allow: ['bash'] }), /"bash" is not a worker/)
    assert.throws(() => parseWorkersConfig({ allow: [] }), /non-empty list/)
    assert.throws(() => parseWorkersConfig({ timeoutSec: 0 }), /timeoutSec/)
    assert.throws(() => parseWorkersConfig({ timeoutSec: MAX_TIMEOUT_SEC + 1 }), /timeoutSec/)
    assert.throws(() => parseWorkersConfig({ maxOutputChars: 10 }), /maxOutputChars/)
    assert.throws(() => parseWorkersConfig('xdev'), /must be an object/)
  })

  it('accepts a model reference but not one that could be read as a flag or a shell word', () => {
    assert.equal(parseWorkersConfig({ models: { claude: 'anthropic/sonnet-4.5' } }).models.claude, 'anthropic/sonnet-4.5')
    for (const bad of ['--yolo', 'a b', 'x;rm -rf /', '$(id)', '']) {
      assert.throws(() => parseWorkersConfig({ models: { xdev: bad } }), /model reference/, bad)
    }
    assert.throws(() => parseWorkersConfig({ models: { vim: 'x' } }), /not a worker/)
  })

  it('de-duplicates the allow-list and trims the test command', () => {
    const c = parseWorkersConfig({ allow: ['xdev', 'xdev', 'claude'], testCommand: '  pnpm test ' })
    assert.deepEqual([...c.allow], ['xdev', 'claude'])
    assert.equal(c.testCommand, 'pnpm test')
  })
})

describe('withinRoot', () => {
  it('is lexical, on a separator boundary', () => {
    assert.equal(withinRoot(ROOT, ROOT), true)
    assert.equal(withinRoot(ROOT, `${ROOT}/src/deep`), true)
    assert.equal(withinRoot(ROOT, `${ROOT}-evil`), false)
    assert.equal(withinRoot(ROOT, `${ROOT}/../elsewhere`), false)
    assert.equal(withinRoot(ROOT, '/etc'), false)
  })
})

describe('checkDispatch', () => {
  const good = { worker: 'xdev', role: 'implement', task: 'add a flag' }

  it('accepts a well-formed call and defaults the directory to the worktree', () => {
    const r = checkDispatch(good, { worktreeRoot: ROOT })
    assert.ok(r.ok)
    assert.equal(r.request.cwd, ROOT)
    assert.equal(r.request.timeoutSec, DEFAULT_TIMEOUT_SEC)
  })

  it('refuses a directory outside the worktree, however it is spelled', () => {
    for (const cwd of ['/', '/etc', `${ROOT}/..`, '../..', `${ROOT}-evil`, '/Users/someone/.ssh']) {
      const r = checkDispatch({ ...good, cwd }, { worktreeRoot: ROOT })
      assert.equal(r.ok, false, cwd)
    }
    const inside = checkDispatch({ ...good, cwd: 'packages/a' }, { worktreeRoot: ROOT })
    assert.ok(inside.ok)
    assert.equal(inside.request.cwd, `${ROOT}/packages/a`)
  })

  it('refuses an unknown worker, a CLI that is not on the allow-list, and an unknown role', () => {
    assert.equal(checkDispatch({ ...good, worker: 'rm' }, { worktreeRoot: ROOT }).ok, false)
    const r = checkDispatch({ ...good, worker: 'claude' }, { worktreeRoot: ROOT, allow: ['xdev'] })
    assert.equal(r.ok, false)
    assert.match((r as { reason: string }).reason, /not allowed here/)
    assert.equal(checkDispatch({ ...good, role: 'deploy' }, { worktreeRoot: ROOT }).ok, false)
  })

  it('refuses an empty or oversized task', () => {
    assert.equal(checkDispatch({ ...good, task: '   ' }, { worktreeRoot: ROOT }).ok, false)
    assert.equal(checkDispatch({ ...good, task: 'x'.repeat(MAX_TASK_CHARS + 1) }, { worktreeRoot: ROOT }).ok, false)
    assert.ok(checkDispatch({ ...good, task: 'x'.repeat(MAX_TASK_CHARS) }, { worktreeRoot: ROOT }).ok)
  })

  it('requireRoot refuses when there is nothing to contain against', () => {
    const r = checkDispatch(good, { requireRoot: true, defaultCwd: '/anywhere' })
    assert.equal(r.ok, false)
    // Supervised: a human approves the dispatch and sees the directory.
    assert.ok(checkDispatch(good, { defaultCwd: '/anywhere' }).ok)
  })

  it('clamps the timeout and rejects a non-integer one', () => {
    const big = checkDispatch({ ...good, timeoutSec: 10 ** 9 }, { worktreeRoot: ROOT })
    assert.ok(big.ok)
    assert.equal(big.request.timeoutSec, MAX_TIMEOUT_SEC)
    assert.equal(checkDispatch({ ...good, timeoutSec: 1.5 }, { worktreeRoot: ROOT }).ok, false)
    assert.equal(checkDispatch({ ...good, timeoutSec: '60' }, { worktreeRoot: ROOT }).ok, false)
  })

  it('never throws on arguments it cannot read', () => {
    for (const bad of [undefined, null, 'xdev', 42, [], { worker: {} }, { ...good, cwd: 7 }]) {
      assert.doesNotThrow(() => checkDispatch(bad, { worktreeRoot: ROOT }))
      assert.equal(checkDispatch(bad, { worktreeRoot: ROOT }).ok, false)
    }
  })
})

describe('buildArgv', () => {
  const opts = { cwd: ROOT, timeoutSec: 60 }
  const BYPASS = ['--dangerously-skip-permissions', '--allow-dangerously-skip-permissions', '-yolo', '--yolo', '-auto-approve', '--auto', '--auto-approve', 'bypassPermissions', '-plan-yolo']

  it('carries the prompt exactly once, as a slot, for every CLI and role', () => {
    for (const kind of WORKER_KINDS) {
      for (const role of WORKER_ROLES) {
        const argv = buildArgv(kind, role, opts)
        assert.equal(argv.filter(w => w === PROMPT_SLOT).length, 1, `${kind}/${role}`)
        assert.equal(argv[0], kind)
      }
    }
  })

  it('never launches a worker with a permission-bypass flag', () => {
    for (const kind of WORKER_KINDS) {
      for (const role of WORKER_ROLES) {
        const argv = buildArgv(kind, role, { ...opts, model: 'p/m', testCommand: 'pnpm test' })
        for (const flag of BYPASS) assert.ok(!argv.includes(flag), `${kind}/${role} has ${flag}`)
      }
    }
  })

  it('puts the validator in each CLI\'s read-only mode', () => {
    assert.ok(buildArgv('xdev', 'validate', opts).includes('-plan'))
    const claude = buildArgv('claude', 'validate', opts)
    assert.equal(claude[claude.indexOf('--permission-mode') + 1], 'plan')
    const opencode = buildArgv('opencode', 'validate', opts)
    assert.equal(opencode[opencode.indexOf('--agent') + 1], 'plan')
    // And the implementer is not.
    assert.ok(!buildArgv('xdev', 'implement', opts).includes('-plan'))
    const impl = buildArgv('claude', 'implement', opts)
    assert.equal(impl[impl.indexOf('--permission-mode') + 1], 'acceptEdits')
  })

  it('denies prompts it cannot answer, and keeps no session behind', () => {
    const claude = buildArgv('claude', 'implement', opts)
    assert.equal(claude[claude.indexOf('--permission-prompts') + 1], 'none')
    assert.ok(claude.includes('--no-session-persistence'))
    assert.ok(buildArgv('xdev', 'implement', opts).includes('-no-session'))
  })

  it('starts the worker in the given directory and limits its time', () => {
    const x = buildArgv('xdev', 'test', { cwd: '/w/r', timeoutSec: 90 })
    assert.equal(x[x.indexOf('-cwd') + 1], '/w/r')
    assert.equal(x[x.indexOf('-max-time') + 1], '90s')
  })

  it('lets Claude Code run only the configured test command, and only in the test role', () => {
    const t = buildArgv('claude', 'test', { ...opts, testCommand: 'pnpm test' })
    assert.equal(t[t.indexOf('--allowedTools') + 1], 'Bash(pnpm test)')
    assert.ok(!buildArgv('claude', 'implement', { ...opts, testCommand: 'pnpm test' }).includes('--allowedTools'))
    // Variadic flag last, so it cannot swallow the prompt.
    assert.ok(t.indexOf(PROMPT_SLOT) < t.indexOf('--allowedTools'))
  })
})

describe('shQuote and renderRunScript', () => {
  const hostile = ["it's", 'a "double" quote', '$(touch /tmp/pwned)', '`id`', 'line1\nline2', '', '; rm -rf /', "'; echo gotcha; '", '$HOME ${PATH} \\n \\']

  it('round-trips every hostile string through a real shell', () => {
    for (const text of hostile) {
      const out = spawnSync('bash', ['-c', `printf %s ${shQuote(text)}`], { encoding: 'utf8' })
      assert.equal(out.stdout, text, JSON.stringify(text))
    }
  })

  it('generates a script that runs the argv with the prompt from a file, logs, and keeps the exit code', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-script-'))
    const promptFile = join(dir, 'prompt.md')
    const logFile = join(dir, 'out.log')
    const prompt = `it's a "brief" with $(touch ${dir}/pwned) and\nnewlines`
    writeFileSync(promptFile, prompt)
    const script = join(dir, 'run.sh')
    // `sh -c 'printf ...; exit 3'` stands in for a worker CLI: it echoes its prompt and fails.
    writeFileSync(script, renderRunScript(['sh', '-c', 'printf "%s" "$1"; exit 3', 'worker', PROMPT_SLOT], { promptFile, logFile }, dir))
    const run = spawnSync('bash', [script], { encoding: 'utf8' })
    assert.equal(run.status, 3, 'the worker\'s exit code survives the tee pipe')
    assert.equal(run.stdout, prompt, 'the prompt reaches the CLI byte for byte')
    assert.equal(readFileSync(logFile, 'utf8'), prompt, 'and the log has the same text')
    assert.throws(() => readFileSync(join(dir, 'pwned')), 'a command substitution in the prompt is data, not code')
  })

  it('does not hang a worker that reads stdin, and exits 97 when the directory is gone', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-script-'))
    const promptFile = join(dir, 'p')
    writeFileSync(promptFile, 'x')
    const reads = join(dir, 'reads.sh')
    writeFileSync(reads, renderRunScript(['sh', '-c', 'cat; echo done'], { promptFile, logFile: join(dir, 'l') }, dir))
    const r = spawnSync('bash', [reads], { encoding: 'utf8', timeout: 5000 })
    assert.equal(r.status, 0)
    assert.match(r.stdout, /done/)
    const gone = join(dir, 'gone.sh')
    writeFileSync(gone, renderRunScript(['true'], { promptFile, logFile: join(dir, 'l') }, join(dir, 'missing')))
    assert.equal(spawnSync('bash', [gone], { encoding: 'utf8' }).status, 97)
  })
})

describe('terminal markers', () => {
  const id = 'ab12cd34'

  it('the typed command line never contains a whole marker, so its echo cannot look like a finished run', () => {
    const line = terminalCommand('/tmp/x/run.sh', id)
    const { begin, end } = markersFor(id)
    assert.ok(!line.includes(begin))
    assert.ok(!line.includes(end))
    assert.equal(scanScrollback(`$ ${line}\n`, id).finished, false)
  })

  it('the typed command prints both markers when a shell runs it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-marker-'))
    const script = join(dir, 'run.sh')
    writeFileSync(script, 'echo hello\nexit 4\n')
    const out = spawnSync('bash', ['-c', terminalCommand(script, id)], { encoding: 'utf8' })
    const scan = scanScrollback(out.stdout, id)
    assert.equal(scan.finished, true)
    assert.equal(scan.exitCode, 4)
    assert.equal(scan.body, 'hello')
  })

  it('scanScrollback needs the end marker on a line of its own', () => {
    const { begin, end } = markersFor(id)
    assert.equal(scanScrollback(`${begin}\nworking\n`, id).finished, false)
    assert.equal(scanScrollback(`${begin}\nsaw ${end} 0 quoted\n`, id).finished, false)
    const done = scanScrollback(`junk\n${begin}\nline a\nline b\n${end} 0\n$ `, id)
    assert.deepEqual([done.finished, done.exitCode, done.body], [true, 0, 'line a\nline b'])
    // A leftover from an earlier run with another id is not this run.
    assert.equal(scanScrollback(`${markersFor('ffffffff').end} 0\n`, id).finished, false)
  })

  it('tolerates carriage returns from the PTY', () => {
    const { begin, end } = markersFor(id)
    assert.equal(scanScrollback(`${begin}\r\nok\r\n${end} 7\r\n`, id).exitCode, 7)
  })
})

describe('redactSecrets', () => {
  it('masks key-shaped text and leaves ordinary output alone', () => {
    const openai = 'sk-' + 'a1B2'.repeat(8)
    const aws = 'AKIA' + 'ABCDEFGHIJKLMNOP'
    const gh = 'ghp_' + 'x9'.repeat(18)
    const bearer = 'Bearer ' + 'abcdef0123456789'.repeat(2)
    const url = 'https://h/?token=' + 'Zz9_'.repeat(10)
    const key = ['-----BEGIN', 'RSA PRIVATE KEY-----'].join(' ') + '\nMIIB\n' + ['-----END', 'RSA PRIVATE KEY-----'].join(' ')
    const text = `ok\n${openai}\n${aws}\n${gh}\n${bearer}\n${url}\n${key}\ndone 12 tests passed`
    const out = redactSecrets(text)
    for (const secret of [openai, aws, gh, bearer.slice(7), url.slice(url.indexOf('token')), 'MIIB']) {
      assert.ok(!out.includes(secret), `${secret.slice(0, 6)}… survived`)
    }
    assert.ok(out.startsWith('ok\n') && out.endsWith('done 12 tests passed'))
    assert.equal(redactSecrets('skills and sk-short are fine'), 'skills and sk-short are fine')
  })
})

describe('parseVerdict, clipMiddle, formatWorkerReport', () => {
  it('the last VERDICT line wins', () => {
    assert.equal(parseVerdict('Write VERDICT: PASS or VERDICT: FAIL\nstuff\nVERDICT: FAIL\n'), 'FAIL')
    assert.equal(parseVerdict('VERDICT: FAIL\nrechecked\n**VERDICT: PASS**'), 'PASS')
    assert.equal(parseVerdict('looks good to me'), undefined)
    assert.equal(parseVerdict('verdict: pass'), 'PASS')
  })

  it('clips the middle and says so', () => {
    const text = 'HEAD' + 'x'.repeat(5_000) + 'TAIL'
    const { text: out, clipped } = clipMiddle(text, 1_000)
    assert.equal(clipped, true)
    assert.ok(out.startsWith('HEAD') && out.endsWith('TAIL'))
    assert.match(out, /characters clipped/)
    assert.ok(out.length < 1_200)
    assert.deepEqual(clipMiddle('short', 1_000), { text: 'short', clipped: false })
  })

  const result: WorkerResult = {
    id: 'ab12cd34', worker: 'xdev', role: 'validate', status: 'completed', exitCode: 0, durationMs: 12_345,
    output: 'VERDICT: PASS\nlooks right', clipped: false, verdict: 'PASS', session: 'pty-2', evidenceDir: '/ev/ab12cd34',
  }

  it('leads with the facts the orchestrator branches on and ends by saying it is not the gate', () => {
    const report = formatWorkerReport(result)
    const [first] = report.split('\n')
    assert.match(first!, /\[worker report\] xdev · validate · COMPLETED \(exit 0\) · 12\.3s/)
    assert.match(report, /verdict: PASS/)
    assert.match(report, /terminal: pty-2/)
    assert.match(report, /evidence: \/ev\/ab12cd34/)
    assert.match(report, /second opinion, not the gate/)
    const impl = formatWorkerReport({ ...result, role: 'implement', verdict: undefined })
    assert.match(impl, /does not replace the phase gate/)
  })

  it('says so when a worker printed nothing, and carries the reason for a failure', () => {
    const report = formatWorkerReport({ ...result, status: 'timeout', exitCode: undefined, output: '', detail: 'no result within 5s' })
    assert.match(report, /TIMEOUT · /)
    assert.match(report, /note: no result within 5s/)
    assert.match(report, /\(the worker printed nothing\)/)
  })
})

describe('evidenceRoot', () => {
  it('puts a sandboxed run\'s evidence beside the run records, outside the worktree', () => {
    const wt = '/repo/.feature-loop/worktrees/run42'
    const dir = evidenceRoot(wt, '/tmp')
    assert.equal(dir, '/repo/.feature-loop/workers/run42')
    // `git add -A` in the worktree must not be able to see it.
    assert.equal(withinRoot(wt, dir), false)
  })

  it('falls back to the temp directory when the path is not a loop worktree', () => {
    assert.equal(evidenceRoot(undefined, '/tmp'), '/tmp/dsh-feature-loop/workers')
    assert.equal(evidenceRoot('/some/checkout', '/tmp'), '/tmp/dsh-feature-loop/workers')
  })
})

describe('rolePrompt', () => {
  it('forbids git history moves for every role and a fixed report shape', () => {
    for (const role of WORKER_ROLES) {
      const p = rolePrompt(role, 'do the thing')
      assert.match(p, /git commit/)
      assert.match(p, /## Worker report/)
      assert.ok(p.endsWith('TASK:\ndo the thing'))
    }
  })

  it('makes the validator read-only and gives the tester the exact command', () => {
    assert.match(rolePrompt('validate', 't'), /Do NOT modify, create or delete any file/)
    assert.match(rolePrompt('validate', 't'), /VERDICT: PASS/)
    assert.match(rolePrompt('test', 't', 'pnpm test'), /verification command is: pnpm test/)
    assert.match(rolePrompt('test', 't'), /Never suppress, skip or weaken a test/)
  })
})

describe('the YOLO envelope and dispatch_worker', () => {
  const call = (args: unknown, extra: { worktreeRoot?: string, workerKinds?: readonly WorkerKind[] } = { worktreeRoot: ROOT }) =>
    envelope({ tool: WORKER_TOOL_NAME, args, ...extra })

  it('allows a listed CLI starting inside the worktree', () => {
    const r = call({ worker: 'claude', role: 'implement', task: 'x' })
    assert.equal(r.kind, 'allow')
    assert.match(r.reason, /claude implement worker inside the worktree/)
  })

  it('denies with no worktree: nothing to contain an unattended worker against', () => {
    assert.equal(call({ worker: 'xdev', role: 'test', task: 'x', cwd: '/tmp' }, {}).kind, 'deny')
  })

  it('denies a directory outside the worktree, an unlisted CLI and unreadable arguments', () => {
    assert.equal(call({ worker: 'xdev', role: 'test', task: 'x', cwd: '/etc' }).kind, 'deny')
    assert.equal(call({ worker: 'opencode', role: 'test', task: 'x' }, { worktreeRoot: ROOT, workerKinds: ['xdev'] }).kind, 'deny')
    assert.equal(call(undefined).kind, 'deny')
    assert.equal(call('xdev').kind, 'deny')
  })

  it('every combination of CLI and role that checks out is allowed, and the rest is denied', () => {
    for (const worker of [...WORKER_KINDS, 'rm', 'sh', '']) {
      for (const role of [...WORKER_ROLES, 'ship', '']) {
        const expected = (WORKER_KINDS as readonly string[]).includes(worker) && (WORKER_ROLES as readonly string[]).includes(role)
        assert.equal(call({ worker, role, task: 't' }).kind === 'allow', expected, `${worker}/${role}`)
      }
    }
  })
})

describe('the phase notice', () => {
  it('tells the implement and test phases about workers only when they are enabled', () => {
    assert.ok(!phaseNotice('implement')?.includes(WORKER_TOOL_NAME))
    const impl = phaseNotice('implement', ['xdev', 'claude'])
    assert.match(impl!, /you are the orchestrator/)
    assert.match(impl!, /xdev, claude/)
    assert.match(impl!, /Then read the diff yourself/)
    const test = phaseNotice('test', ['opencode'])
    assert.match(test!, /role: validate/)
    assert.match(test!, /you run it/)
  })

  it('leaves research, PRD and ship alone: thinking is the orchestrator\'s, and git is nobody else\'s', () => {
    for (const phase of ['research', 'prd', 'ship'] as const) {
      assert.equal(phaseNotice(phase, ['xdev']), phaseNotice(phase))
    }
  })
})

// Type-level: the role list and the kinds the tests loop over are the ones the module exports.
const _roles: readonly WorkerRole[] = WORKER_ROLES
void _roles
