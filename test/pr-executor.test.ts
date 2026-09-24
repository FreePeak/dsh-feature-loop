import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { planMerge, planPullRequest } from '../src/pr-gate.ts'
import { executeCommandPlan, executeMergePlan, executePullRequestPlan, type ShellService } from '../src/pr-executor.ts'

function shell(result: { exitCode: number, signal?: string | null, sandbox?: { denied?: boolean } } = { exitCode: 0 }) {
  const requests: Record<string, unknown>[] = []
  const service: ShellService = {
    resolve(request) {
      requests.push(request)
      return request
    },
    async execute() {
      return { async result() { return result } }
    },
  }
  return { service, requests }
}

const claimId = 'claim-1'
const cwd = '/tmp/isolated'

function prPlan() {
  return planPullRequest({
    claimId,
    repository: 'owner/name',
    baseBranch: 'main',
    headBranch: 'dsh/feature',
    title: 'Feature',
    bodyFile: `${cwd}/body file.md`,
    cwd,
  })
}

test('executes fixed plans through DSH shell with POSIX quoting', async () => {
  const h = shell()
  const result = await executeCommandPlan(h.service, prPlan(), new AbortController().signal, { workspaceRoot: cwd })
  assert.equal(result.kind, 'allow')
  assert.equal(h.requests.length, 1)
  assert.equal(h.requests[0]?.workdir, cwd)
  assert.equal((h.requests[0]?.command as string).includes("'/tmp/isolated/body file.md'"), true)
  assert.deepEqual(h.requests[0]?.sandboxPolicy, { workspaceRoot: cwd })
})

test('PR creation also requires claim-scoped approval', async () => {
  const h = shell()
  const plan = prPlan()
  const denied = await executePullRequestPlan(h.service, plan, { claimId: 'other', scope: 'create-pull-request', approvedAt: 1 }, new AbortController().signal)
  assert.equal(denied.kind, 'deny')
  assert.equal(h.requests.length, 0)
  const allowed = await executePullRequestPlan(h.service, plan, { claimId, scope: 'create-pull-request', approvedAt: 1 }, new AbortController().signal)
  assert.equal(allowed.kind, 'allow')
  assert.equal(h.requests.length, 1)
})

test('nonzero shell results fail closed without raw output', async () => {
  const h = shell({ exitCode: 7, signal: null })
  const result = await executeCommandPlan(h.service, prPlan(), new AbortController().signal)
  assert.equal(result.kind, 'deny')
  assert.match((result as { reason: string }).reason, /exited with 7/)
})

test('merge execution requires matching claim-scoped approval', async () => {
  const plan = planMerge({ claimId, repository: 'owner/name', pullRequest: 9, targetBranch: 'main', headCommit: 'a'.repeat(40), cwd })
  const h = shell()
  const denied = await executeMergePlan(h.service, plan, { claimId: 'other', scope: 'merge-pull-request', approvedAt: 1 }, new AbortController().signal)
  assert.equal(denied.kind, 'deny')
  assert.equal(h.requests.length, 0)
  const allowed = await executeMergePlan(h.service, plan, { claimId, scope: 'merge-pull-request', approvedAt: 1 }, new AbortController().signal)
  assert.equal(allowed.kind, 'allow')
  assert.equal(h.requests.length, 1)
})
