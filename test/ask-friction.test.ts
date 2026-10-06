/**
 * Approvals that were a toll, not a gate.
 *
 * A live run in the web UI asked for a click on twenty-four of its first
 * twenty-six tool calls: `pwd && ls -la`, every `todo_write`, every `web_fetch`.
 * None of them could hurt anything, and a reviewer who clicks "allow" on
 * twenty-four harmless calls is the reviewer who clicks it on the twenty-fifth.
 *
 * These tests pin both halves: the harmless calls no longer ask, and everything
 * that could do damage still does.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { resolveReversibility } from '../src/agent-policy.ts'
import { callPreview } from '../src/messages.ts'
import { createPolicy, gateEnforce } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'
import { readOnlyShell } from '../src/shell-readonly.ts'

const ROOT = '/work/cookies-api'

const SPEC = {
  goal: 'the tests pass',
  sensor: ['test output'],
  controller: { ladder: [{ model: 'cheap' }] },
  actuator: { read: 'read', write: 'irreversible', bash: 'irreversible' },
  feedback: 'the suite passes',
  termination: { successCommand: 'go test ./...', guards: ['no-progress'] },
  maxSteps: 8,
  costBudgetUSD: 1,
  prices: {},
} as unknown as NonNullable<CreatePolicyOptions['spec']>

const VERIFY = 'go vet ./... && go test -race -count=1 ./...'

// ── built-in classes ───────────────────────────────────────────────────────

test('the checklist and the two fetch tools are reads; an unknown tool is still irreversible', () => {
  for (const tool of ['todo_write', 'web_search', 'web_fetch']) {
    assert.equal(resolveReversibility(tool, undefined), 'read', tool)
  }
  assert.equal(resolveReversibility('mystery_tool', undefined), 'irreversible')
})

test('the spec outranks the built-in class', () => {
  // An operator who wants every fetch approved says so in the spec.
  assert.equal(resolveReversibility('web_fetch', { web_fetch: 'irreversible' }), 'irreversible')
})

// ── read-only shell ────────────────────────────────────────────────────────

test('inspection commands run without a human', () => {
  for (const command of [
    'pwd && ls -la && go version 2>/dev/null || echo "go not found"',
    'ls -la docs',
    'cat go.mod',
    'grep -rn "func main" .',
    'go vet ./...',
    'go env GOPATH',
    'git status --short && git log --oneline -5',
    'find . -name "*.go" | wc -l',
    'head -20 main.go; tail -5 main.go',
    "go env GOVERSION 2>&1; find . -type f -not -path './.git/*' | head -50",
    'cd /work/cookies-api\necho "=== doc ==="; go doc net/http.ServeMux | head -60\ngo version',
  ]) {
    assert.notEqual(readOnlyShell(command, ROOT), undefined, command)
  }
})

test('anything that can write, run or escape still needs a human', () => {
  for (const command of [
    'rm -rf docs',
    'echo hi > file.txt',
    'echo hi >> file.txt',
    'cat go.mod | tee out.txt',
    'sed -i s/a/b/ main.go',
    'cp main.go /tmp/x',
    'go build ./...',
    'go test ./...',
    'go install ./...',
    'go env -w GOFLAGS=-mod=mod',
    'go vet -vettool=/tmp/evil ./...',
    'git push origin main',
    'git commit -am x',
    'git -c core.pager=evil status',
    'git branch newbranch',
    'git diff --output=patch.txt',
    'find . -name x -delete',
    'find . -exec rm {} ;',
    'sort -o out.txt in.txt',
    'rg --pre ./evil foo',
    'cat ~/.dsh/.credentials.yaml',
    'cat ../../secret',
    'cat /etc/passwd',
    'cat .env',
    'cat .git/config',
    'ls $(whoami)',
    'ls `whoami`',
    'echo $HOME',
    'sleep 1 &',
    'ls & rm -rf x',
    'ls\nrm -rf x',
    'curl http://x',
    'bash -c ls',
    'python3 -c "print(1)"',
    'cat --file=/etc/passwd',
    'go vet ../...',
    'ls a/../../b',
  ]) {
    assert.equal(readOnlyShell(command, ROOT), undefined, command)
  }
})

test('a separator inside quotes does not split the command', () => {
  assert.notEqual(readOnlyShell('echo "a && b ; c"', ROOT), undefined)
  // …and an unbalanced quote is not provable, so it is refused.
  assert.equal(readOnlyShell('echo "unterminated', ROOT), undefined)
})

test('without a root nothing is provable, and the verify command matches in full only', () => {
  assert.equal(readOnlyShell('ls', undefined), undefined)
  assert.notEqual(readOnlyShell(VERIFY, ROOT, VERIFY), undefined)
  assert.equal(readOnlyShell(`${VERIFY} && rm -rf x`, ROOT, VERIFY), undefined)
  assert.equal(readOnlyShell('go test ./...', ROOT, VERIFY), undefined)
  // Each piece of the verify command, matched in full, may run alone or be piped to a reader.
  assert.notEqual(readOnlyShell('go test -race -count=1 ./... 2>&1 | tail -20', ROOT, VERIFY), undefined)
  assert.notEqual(readOnlyShell('cd /work/cookies-api && go vet ./...; echo "exit=$?"', ROOT, VERIFY), undefined)
  assert.equal(readOnlyShell('go test -race -count=1 ./... -run X', ROOT, VERIFY), undefined, 'an extended piece is a different command')
  assert.equal(readOnlyShell('go test -race -count=1 ./... | tee out.txt', ROOT, VERIFY), undefined)
})

// ── the gate ───────────────────────────────────────────────────────────────

test('ask mode: a read-only bash proceeds, a mutating bash still asks, and the ask names the command', () => {
  const policy = createPolicy({ spec: SPEC, gateMode: 'ask' })

  const look = gateEnforce(policy, 'bash', { command: 'pwd && ls -la' }, false, ROOT)
  assert.equal(look.kind, 'proceed')

  const mutate = gateEnforce(policy, 'bash', { command: 'rm -rf docs' }, false, ROOT)
  assert.equal(mutate.kind, 'ask')
  const reason = (mutate as { reason: string }).reason
  assert.ok(reason.startsWith('REVIEW REQUESTED (policy)'), 'the marker the run-grant check keys on survives')
  assert.match(reason, /Call: bash rm -rf docs/)
})

test('ask mode: the checklist and fetches proceed; an unlisted tool and a write ask', () => {
  const policy = createPolicy({ spec: SPEC, gateMode: 'ask' })
  assert.equal(gateEnforce(policy, 'todo_write', { todos: [] }, false, ROOT).kind, 'proceed')
  assert.equal(gateEnforce(policy, 'web_fetch', { url: 'https://go.dev' }, false, ROOT).kind, 'proceed')
  assert.equal(gateEnforce(policy, 'mystery_tool', {}, false, ROOT).kind, 'ask')
  const write = gateEnforce(policy, 'write', { file_path: '/work/cookies-api/main.go' }, false, ROOT)
  assert.equal(write.kind, 'ask')
  assert.match((write as { reason: string }).reason, /Call: write \/work\/cookies-api\/main\.go/)
})

test('deny mode: a read-only shell is not waved through', () => {
  // `deny` means the operator wants no unsupervised shell at all.
  const policy = createPolicy({ spec: SPEC, gateMode: 'deny' })
  assert.equal(gateEnforce(policy, 'bash', { command: 'ls' }, false, ROOT).kind, 'deny')
})

// ── the preview ────────────────────────────────────────────────────────────

test('callPreview shows the field a human decides on, capped', () => {
  assert.equal(callPreview('bash', { command: 'ls', description: 'list' }), 'bash ls\n(list)')
  assert.equal(callPreview('write', { file_path: '/a/b.go', content: 'x'.repeat(5000) }), 'write /a/b.go')
  assert.equal(callPreview('web_fetch', { url: 'https://go.dev' }), 'web_fetch https://go.dev')
  assert.ok((callPreview('bash', { command: 'x'.repeat(2000) }) ?? '').length < 700)
  assert.equal(callPreview('subagent', { description: 'Research routing', prompt: 'Fetch go.dev docs' }), 'subagent Research routing\nFetch go.dev docs')
  assert.equal(callPreview('bash', {}), undefined)
  assert.equal(callPreview('bash', 'ls'), undefined)
})

// ── the pipeline under supervision ─────────────────────────────────────────

test('a supervised (ask) run advances out of research once the note exists', async () => {
  // The defect: the pipeline's sandbox descriptor was only attached under YOLO,
  // so under `ask` every phase gate returned "no sandbox" and the run sat in
  // `research` forever, silently, after the model wrote its note and stopped.
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { apply } = await import('../src/plugin.ts')

  const root = mkdtempSync(join(tmpdir(), 'fl-ask-pipeline-'))
  mkdirSync(join(root, 'docs'))
  writeFileSync(join(root, 'docs/0-research.md'), '# Research\n\nGo 1.22 ServeMux: https://go.dev/blog/routing-enhancements\n')

  const handlers = new Map<string, (p: unknown, n: () => Promise<unknown>) => Promise<unknown>>()
  const ctx = {
    on: (event: string, fn: (p: unknown, n: () => Promise<unknown>) => Promise<unknown>) => {
      handlers.set(event, fn)
      return () => { handlers.delete(event) }
    },
    plugin: () => undefined,
    set: () => undefined,
    get: () => undefined,
  }
  const lines: string[] = []
  const realWrite = process.stderr.write.bind(process.stderr)
  process.stderr.write = ((chunk: string | Uint8Array) => {
    lines.push(String(chunk))
    return true
  }) as typeof process.stderr.write
  try {
    const dispose = apply(ctx as never, {
      spec: SPEC,
      gateMode: 'ask',
      judge: { score: async () => ({ score: 0 }) },
      dashboard: { enabled: false },
      pipeline: { enabled: true },
    }) as (() => void) | undefined
    const agent = { id: 'ask-pipeline', session: { header: { cwd: root }, snapshotEvents: () => [] } }
    const step = handlers.get('agent/pre-step')
    assert.ok(step !== undefined)
    for (const n of [1, 2]) {
      await step(
        { agent, turn: { turn: 1, step: n }, step: { toolName: 'read', arguments: {} } },
        async () => ({ kind: 'enter', messages: [] }),
      )
    }
    dispose?.()
  } finally {
    process.stderr.write = realWrite
    rmSync(root, { recursive: true, force: true })
  }
  assert.ok(lines.some(line => /phase research → prd/.test(line)), `no research → prd transition in:\n${lines.join('')}`)
})

test('a supervised run records the writes it asked for, and ship drops the ones that never landed', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { recordRequestedWrite } = await import('../src/plugin.ts')

  const root = mkdtempSync(join(tmpdir(), 'fl-ask-ship-'))
  try {
    mkdirSync(join(root, 'docs'))
    writeFileSync(join(root, 'docs/PRD.md'), '# PRD\n')
    const policy = createPolicy({
      spec: SPEC,
      gateMode: 'ask',
      pipeline: { enabled: true },
    })
    assert.ok(policy.pipeline !== undefined)
    policy.pipeline.worktree = { worktreeRoot: root, branch: 'fl/x', stopSentinel: join(root, '.feature-loop/STOP') }

    recordRequestedWrite(policy, 'write', { file_path: join(root, 'docs/PRD.md') })
    recordRequestedWrite(policy, 'write', { file_path: join(root, 'docs/REJECTED.md') })
    recordRequestedWrite(policy, 'edit', { file_path: join(root, 'docs/PRD.md') })
    recordRequestedWrite(policy, 'write', { file_path: '/etc/passwd' })
    recordRequestedWrite(policy, 'write', { file_path: join(root, '.env') })
    recordRequestedWrite(policy, 'bash', { command: 'echo x > docs/y.md' })

    assert.deepEqual(policy.writtenPaths, ['docs/PRD.md', 'docs/REJECTED.md'], 'outside, secret and shell are never recorded')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a pipeline that reached done is goal-met, not blocked by the guard that closes the turn', async () => {
  const { outcomeOf } = await import('../src/plugin.ts')
  const policy = createPolicy({ spec: SPEC, gateMode: 'ask', pipeline: { enabled: true } })
  assert.ok(policy.pipeline !== undefined)
  policy.pipeline.run.state = 'done'
  assert.equal(outcomeOf('blocked', policy), 'goal-met')
  assert.equal(outcomeOf('completed', policy), 'goal-met')
  assert.equal(outcomeOf('error', policy), 'error', 'a real error is never relabelled')
  assert.equal(outcomeOf('aborted', policy), 'aborted')
  policy.pipeline.run.state = 'blocked'
  assert.equal(outcomeOf('blocked', policy), 'blocked', 'a genuinely blocked pipeline still is')
})

test('a file write after ship is refused: it can be neither committed nor verified', async () => {
  const { writeAfterShipDenial } = await import('../src/plugin.ts')
  const policy = createPolicy({ spec: SPEC, gateMode: 'ask', pipeline: { enabled: true } })
  assert.ok(policy.pipeline !== undefined)
  for (const state of ['research', 'prd', 'implement', 'test'] as const) {
    policy.pipeline.run.state = state
    assert.equal(writeAfterShipDenial(policy, 'write'), undefined, state)
  }
  for (const state of ['ship', 'done'] as const) {
    policy.pipeline.run.state = state
    assert.match(writeAfterShipDenial(policy, 'write') ?? '', /already shipped/)
    assert.match(writeAfterShipDenial(policy, 'edit') ?? '', /already shipped/)
    assert.equal(writeAfterShipDenial(policy, 'bash'), undefined, 'reads and shell are not this rule')
    assert.equal(writeAfterShipDenial(policy, 'read'), undefined)
  }
  assert.equal(writeAfterShipDenial(createPolicy({ spec: SPEC, gateMode: 'ask' }), 'write'), undefined, 'no pipeline, no rule')
})
