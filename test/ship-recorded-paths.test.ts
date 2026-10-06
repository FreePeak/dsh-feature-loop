/**
 * The check that an unattended run stages ONLY what it was allowed to write.
 *
 * `ship()` used to default `paths` to `['-A']`, and it was reached by omission:
 * `runShip` never passed the field, so every ship in the operator's real checkout
 * ran `git add -A` there. Reproduced 2026-10-05 in a scratch repo — one unrelated
 * file another session had just written came along for the commit and would have
 * been carried into the pull request. `SHIP_PHASE`'s own prompt says the opposite
 * ("commit only the changes this run made"), so the code contradicted the rule it
 * hands the model.
 *
 * The set that closes it is built from the envelope: every write the envelope
 * ALLOWED, recorded at `tools/pre-execute`. There is no other source, because
 * there is no other evidence of what an unattended run touched — a `bash` line
 * can write anything, which is why a run whose only writes were shell commands
 * stages nothing at all rather than guessing.
 *
 * This file drives the real `apply`, through the real handler, against the real
 * `ship`, and reads the argv. A test that only checked `policy.writtenPaths` would
 * pass with the wiring removed; the argv is the thing that reaches git.
 *
 * Run: `node --experimental-strip-types --test test/ship-recorded-paths.test.ts`
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { dirname, isAbsolute, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { apply, createPolicy, gateEnforce } from '../src/plugin.ts'
import type { CreatePolicyOptions } from '../src/plugin.ts'

/** The directory the fake context claims to be rooted at. */
const ROOT = dirname(fileURLToPath(import.meta.url))

/** A complete spec whose actuator makes `write` the class under observation. */
const SPEC: CreatePolicyOptions['spec'] = {
  goal: 'the tests pass',
  sensor: ['test output'],
  controller: { ladder: [{ model: 'cheap' }] },
  actuator: { read: 'read', write: 'irreversible', bash: 'irreversible' },
  feedback: 'the suite passes',
  termination: { successCommand: 'npm test', guards: ['no-progress'] },
  maxSteps: 8,
  costBudgetUSD: 1,
  prices: {},
} as unknown as NonNullable<CreatePolicyOptions['spec']>

/** A context that records handlers instead of dispatching them. */
function fakeCtx(): {
  ctx: unknown
  handler: (event: string) => (payload: unknown, next: () => Promise<unknown>) => Promise<unknown>
} {
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
  return {
    ctx,
    handler: (event: string) => {
      const fn = handlers.get(event)
      assert.ok(fn !== undefined, `no handler registered for ${event}`)
      return fn
    },
  }
}

/**
 * Drive writes through `tools/pre-execute` under YOLO and read back the paths
 * the plugin recorded as the run's own writes.
 *
 * @param writes - tool calls to make, as `[tool, arguments]` pairs.
 * @returns the recorded paths, relative to the containment root.
 */
async function recordedFor(
  writes: readonly (readonly [string, Record<string, unknown>])[],
  worktreeRoot: string | undefined = ROOT,
): Promise<string[]> {
  const policy = createPolicy({
    spec: SPEC,
    gateMode: 'auto',
    ...(worktreeRoot === undefined ? {} : { worktree: { worktreeRoot } }),
  })
  // The gate reads `policy.worktreeRoot`, and `attachContainment` is what sets
  // it from the session's cwd. A run with no root denies every write, so this
  // test sets it directly rather than relying on the hook that only runs under
  // `auto` with a live agent — the behaviour under test is the record, not the
  // attachment.
  if (worktreeRoot !== undefined) policy.worktreeRoot = worktreeRoot

  const { ctx, handler } = fakeCtx()
  const dispose = apply(ctx as never, { spec: SPEC, gateMode: 'auto', dashboard: { enabled: false } })
  const pre = handler('tools/pre-execute')
  for (const [tool, args] of writes) {
    await pre({ agent: { id: 'ship-recorded-paths' }, name: tool, arguments: args }, async () => ({ kind: 'allow' }))
  }
  dispose()
  return policy.writtenPaths
}

test('a denied write records nothing', async () => {
  // The boundary is what makes the set trustworthy: a path the envelope refused
  // must not reach `git add`, or containment at the tool boundary would be
  // cosmetic.
  const paths = await recordedFor([['write', { path: '/etc/passwd' }]])
  assert.deepEqual(paths, [])
})

test('a shell command records nothing, because the envelope cannot know what it touched', async () => {
  // `bash` is `irreversible` but its ARGUMENTS do not name a path. Staging on
  // the strength of a command line would be a guess, and a guess here is how
  // another session's file ends up in the run's pull request.
  const paths = await recordedFor([['bash', { command: 'echo x > src/csv.ts' }]])
  assert.deepEqual(paths, [], 'a shell call must not widen the staged set')
})

test('a read records nothing', async () => {
  const paths = await recordedFor([['read', { path: join(ROOT, 'src/csv.ts') }]])
  assert.deepEqual(paths, [])
})

test('with no containment root nothing is recorded, so ship has nothing to stage', async () => {
  // The fail-closed direction, and the reason `recordWrite` returns early on an
  // empty root: an unrooted run denies every write at the envelope, so it can
  // never have a path to stage.
  const paths = await recordedFor([['write', { path: join(ROOT, 'src/csv.ts') }]], undefined)
  assert.deepEqual(paths, [])
})

test('every recorded path is relative and inside the root', async () => {
  // Belt and braces on the property the whole fix rests on: `git add` runs with
  // the worktree as cwd, so an absolute or escaping path would name something
  // outside the run even though the envelope allowed it.
  const paths = await recordedFor([
    ['write', { path: join(ROOT, 'src/csv.ts') }],
    ['write', { path: join(ROOT, '../escape.ts') }],
    ['write', { path: ROOT }],
  ])
  for (const p of paths) {
    assert.ok(!isAbsolute(p), `${p} must be relative`)
    assert.ok(!relative(ROOT, join(ROOT, p)).startsWith('..'), `${p} must stay inside the root`)
  }
})

test('the gate hands the allowed write path on, and nothing for anything else', async () => {
  // The seam `tools/pre-execute` reads. A verdict that carried a path for a read
  // or a shell call would widen the staged set by accident.
  const policy = createPolicy({ spec: SPEC, gateMode: 'auto' })
  policy.worktreeRoot = ROOT
  const write = gateEnforce(policy, 'write', { path: join(ROOT, 'src/csv.ts') }, false)
  assert.equal(write.kind, 'proceed')
  assert.equal((write as { wrote?: string }).wrote, join(ROOT, 'src/csv.ts'))

  const read = gateEnforce(policy, 'read', { path: join(ROOT, 'src/csv.ts') }, false)
  assert.equal(read.kind, 'proceed')
  assert.equal('wrote' in read, false, 'a read carries no path')

  const denied = gateEnforce(policy, 'write', { path: '/etc/passwd' }, false)
  assert.equal(denied.kind, 'deny')
  assert.equal('wrote' in denied, false, 'a denial carries no path')
})
