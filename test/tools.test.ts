/**
 * The check that fails when the sandbox leaks or a tool throws out of `run()`.
 *
 * Run: `node --experimental-strip-types --test test/tools.test.ts`
 *
 * Every fixture lives in a fresh `mkdtemp` directory, and the "outside" directory used by
 * the escape tests is a *sibling* of the sandbox root — so a passing suite is real evidence
 * that confinement works, not that the temp dir happens to be a prefix of itself.
 */

import { strict as assert } from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { after, before, describe, test } from 'node:test'

import { createTools, resolveInRoot, type LoopTool, type ToolResult } from '../src/tools.ts'

let tmp: string
let root: string
let outside: string
let tools: LoopTool[]

function tool(name: string): LoopTool {
  const found = tools.find((candidate) => candidate.name === name)
  assert.ok(found, `tool ${name} is not registered`)
  return found
}

/** Call a tool and assert it resolved rather than rejected — the loop's core contract. */
async function call(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const result = await tool(name).run(args)
  assert.equal(typeof result.ok, 'boolean', `${name} returned a malformed ToolResult`)
  return result
}

function expectFailure(result: ToolResult, pattern: RegExp): void {
  assert.equal(result.ok, false, `expected failure, got ok:true with output ${result.output}`)
  assert.match(result.error ?? '', pattern)
}

before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-tools-'))
  root = path.join(tmp, 'sandbox')
  outside = path.join(tmp, 'outside')
  fs.mkdirSync(root, { recursive: true })
  fs.mkdirSync(outside, { recursive: true })
  fs.writeFileSync(path.join(outside, 'secret.txt'), 'TOP SECRET\n')
  tools = createTools({ root })
})

after(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('tool registry', () => {
  test('exposes the five tools with their declared reversibility', () => {
    assert.deepEqual(
      tools.map((entry) => [entry.name, entry.reversibility]),
      [
        ['read_file', 'read'],
        ['write_file', 'reversible-write'],
        ['edit_file', 'reversible-write'],
        ['list_files', 'read'],
        ['run_tests', 'read'],
      ],
    )
  })
})

describe('read_file', () => {
  test('returns 1-based numbered lines', async () => {
    fs.writeFileSync(path.join(root, 'numbered.txt'), 'alpha\nbeta\ngamma\n')
    const result = await call('read_file', { path: 'numbered.txt' })
    assert.equal(result.ok, true)
    assert.equal(result.output, '    1| alpha\n    2| beta\n    3| gamma')
  })

  test('truncates with a marker and stays inside the byte cap', async () => {
    const lines = Array.from({ length: 200 }, (_, i) => `line-${i}-${'x'.repeat(40)}`).join('\n')
    fs.writeFileSync(path.join(root, 'big.txt'), lines)
    const capped = createTools({ root, maxOutputBytes: 200 })
    const result = await capped.find((t) => t.name === 'read_file')!.run({ path: 'big.txt' })
    assert.equal(result.ok, true)
    assert.match(result.output, /\[truncated\]$/)
    assert.ok(Buffer.byteLength(result.output) <= 200, `output was ${Buffer.byteLength(result.output)} bytes`)
  })

  test('rejects a directory', async () => {
    fs.mkdirSync(path.join(root, 'adir'), { recursive: true })
    expectFailure(await call('read_file', { path: 'adir' }), /is a directory/)
  })
})

describe('write_file', () => {
  test('round-trips through read_file', async () => {
    const written = await call('write_file', { path: 'round/trip.txt', content: 'hello\nworld\n' })
    assert.equal(written.ok, true)
    assert.match(written.output, /Wrote 12 bytes/)

    const read = await call('read_file', { path: 'round/trip.txt' })
    assert.equal(read.ok, true)
    assert.equal(read.output, '    1| hello\n    2| world')
  })

  test('creates missing parent directories', async () => {
    await call('write_file', { path: 'a/b/c/deep.txt', content: 'deep' })
    assert.equal(fs.readFileSync(path.join(root, 'a/b/c/deep.txt'), 'utf8'), 'deep')
  })
})

describe('edit_file', () => {
  test('replaces a unique match', async () => {
    fs.writeFileSync(path.join(root, 'edit.txt'), 'const a = 1\nconst b = 2\n')
    const result = await call('edit_file', {
      path: 'edit.txt',
      old_string: 'const b = 2',
      new_string: 'const b = 42',
    })
    assert.equal(result.ok, true)
    assert.equal(fs.readFileSync(path.join(root, 'edit.txt'), 'utf8'), 'const a = 1\nconst b = 42\n')
  })

  test('fails when the match is missing', async () => {
    fs.writeFileSync(path.join(root, 'edit-missing.txt'), 'const a = 1\n')
    expectFailure(
      await call('edit_file', { path: 'edit-missing.txt', old_string: 'nope', new_string: 'x' }),
      /not found/,
    )
    assert.equal(fs.readFileSync(path.join(root, 'edit-missing.txt'), 'utf8'), 'const a = 1\n')
  })

  test('fails on an ambiguous match and reports the occurrence count', async () => {
    fs.writeFileSync(path.join(root, 'edit-dup.txt'), 'let x = 1\nlet y = 1\n')
    const result = await call('edit_file', { path: 'edit-dup.txt', old_string: '= 1', new_string: '= 2' })
    expectFailure(result, /appears 2 times/)
    assert.match(result.error ?? '', /context/)
    // Untouched: an ambiguous edit must not be applied to the first match.
    assert.equal(fs.readFileSync(path.join(root, 'edit-dup.txt'), 'utf8'), 'let x = 1\nlet y = 1\n')
  })

  test('treats text as literal, not as a regex', async () => {
    fs.writeFileSync(path.join(root, 'edit-regex.txt'), 'cost: $1 (net)\n')
    const result = await call('edit_file', {
      path: 'edit-regex.txt',
      old_string: '(net)',
      new_string: '(gross)',
    })
    assert.equal(result.ok, true)
    assert.equal(fs.readFileSync(path.join(root, 'edit-regex.txt'), 'utf8'), 'cost: $1 (gross)\n')
  })

  test('deletes the match when new_string is empty', async () => {
    fs.writeFileSync(path.join(root, 'edit-delete.txt'), 'keep\nremove me\nkeep\n')
    const result = await call('edit_file', {
      path: 'edit-delete.txt',
      old_string: 'remove me\n',
      new_string: '',
    })
    assert.equal(result.ok, true)
    assert.equal(fs.readFileSync(path.join(root, 'edit-delete.txt'), 'utf8'), 'keep\nkeep\n')
  })
})

describe('path confinement', () => {
  test('rejects a ../ escape', async () => {
    expectFailure(await call('read_file', { path: '../outside/secret.txt' }), /escapes the sandbox root/)
    expectFailure(
      await call('write_file', { path: '../outside/pwned.txt', content: 'x' }),
      /escapes the sandbox root/,
    )
    assert.equal(fs.existsSync(path.join(outside, 'pwned.txt')), false)
  })

  test('rejects an absolute path outside the root', async () => {
    const absolute = path.join(outside, 'secret.txt')
    expectFailure(await call('read_file', { path: absolute }), /escapes the sandbox root/)
    expectFailure(await call('list_files', { path: outside }), /escapes the sandbox root/)
  })

  test('rejects a symlink that points outside the root', async () => {
    const link = path.join(root, 'escape')
    fs.symlinkSync(outside, link)
    // The link itself exists inside the root; only realpath reveals where it lands.
    expectFailure(await call('read_file', { path: 'escape/secret.txt' }), /escapes the sandbox root/)
    expectFailure(
      await call('write_file', { path: 'escape/pwned.txt', content: 'x' }),
      /escapes the sandbox root/,
    )
    assert.equal(fs.existsSync(path.join(outside, 'pwned.txt')), false)

    // ...and listing the root must not walk through it either.
    const listing = await call('list_files', {})
    assert.equal(listing.ok, true)
    assert.doesNotMatch(listing.output, /escape\//)
  })

  test('resolveInRoot accepts an in-root path and throws on escape', () => {
    assert.equal(resolveInRoot(root, 'a/b.txt'), path.join(root, 'a/b.txt'))
    assert.throws(() => resolveInRoot(root, '../outside.txt'), /escapes the sandbox root/)
  })
})

describe('list_files', () => {
  test('returns sorted root-relative paths and skips vendor directories', async () => {
    fs.mkdirSync(path.join(root, 'src'), { recursive: true })
    fs.mkdirSync(path.join(root, 'node_modules/pkg'), { recursive: true })
    fs.mkdirSync(path.join(root, 'lib'), { recursive: true })
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true })
    fs.mkdirSync(path.join(root, '.git'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src/zeta.ts'), '')
    fs.writeFileSync(path.join(root, 'src/alpha.ts'), '')
    fs.writeFileSync(path.join(root, 'node_modules/pkg/index.js'), '')
    fs.writeFileSync(path.join(root, 'lib/built.js'), '')
    fs.writeFileSync(path.join(root, 'dist/built.js'), '')
    fs.writeFileSync(path.join(root, '.git/HEAD'), '')

    const result = await call('list_files', {})
    assert.equal(result.ok, true)
    const entries = result.output.split('\n')
    assert.deepEqual(entries, [...entries].sort(), 'entries must be sorted')
    assert.ok(entries.includes('src/alpha.ts'))
    assert.ok(entries.includes('src/zeta.ts'))
    for (const entry of entries) {
      assert.doesNotMatch(entry, /node_modules|\.git\/|^lib\/|^dist\//)
    }
  })

  test('caps at 200 entries with a truncation marker', async () => {
    const many = path.join(root, 'many')
    fs.mkdirSync(many, { recursive: true })
    for (let i = 0; i < 250; i++) fs.writeFileSync(path.join(many, `f${String(i).padStart(3, '0')}.txt`), '')

    const result = await call('list_files', { path: 'many' })
    assert.equal(result.ok, true)
    assert.match(result.output, /\[truncated\]$/)
    assert.equal(result.output.replace('\n[truncated]', '').split('\n').length, 200)
  })
})

describe('run_tests', () => {
  test('returns ok:false for a failing command', async () => {
    const result = await call('run_tests', { command: 'node -e "process.exit(1)"' })
    assert.equal(result.ok, false)
    assert.match(result.error ?? '', /exited with code 1/)
  })

  test('returns ok:true for a passing command', async () => {
    const result = await call('run_tests', { command: 'node -e "process.exit(0)"' })
    assert.equal(result.ok, true)
    assert.match(result.output, /\$ node -e/)
  })

  test('captures command output', async () => {
    const result = await call('run_tests', { command: 'node -e "console.log(123 + 456)"' })
    assert.equal(result.ok, true)
    assert.match(result.output, /579/)
  })

  test('kills a command that exceeds the timeout', async () => {
    const impatient = createTools({ root, timeoutMs: 300 })
    const result = await impatient.find((t) => t.name === 'run_tests')!.run({
      command: 'node -e "setTimeout(() => {}, 30000)"',
    })
    assert.equal(result.ok, false)
    assert.match(result.error ?? '', /timed out after 300ms/)
  })

  test('runs the default suite when command is omitted', async () => {
    const project = path.join(tmp, 'project')
    fs.mkdirSync(path.join(project, 'test'), { recursive: true })
    fs.writeFileSync(
      path.join(project, 'test/sample.test.ts'),
      "import { test } from 'node:test'\ntest('ok', () => {})\n",
    )
    const projectTools = createTools({ root: project })
    const result = await projectTools.find((t) => t.name === 'run_tests')!.run({})
    assert.equal(result.ok, true, result.output + (result.error ?? ''))
    assert.match(result.output, /--experimental-strip-types --test test\/sample\.test\.ts/)
  })
})

describe('argument validation', () => {
  test('an absent required arg yields ok:false instead of a throw', async () => {
    for (const [name, args] of [
      ['read_file', {}],
      ['write_file', { path: 'x.txt' }],
      ['edit_file', { path: 'x.txt', old_string: 'a' }],
    ] as const) {
      const result = await call(name, args)
      expectFailure(result, /missing required parameter/)
    }
  })

  test('wrong types and empty strings yield ok:false', async () => {
    expectFailure(await call('read_file', { path: 42 }), /must be a string/)
    expectFailure(await call('read_file', { path: '' }), /must not be empty/)
    expectFailure(await call('write_file', { path: 'x.txt', content: { nope: true } }), /must be a string/)
  })

  test('unknown arguments and non-object args do not throw', async () => {
    assert.equal((await call('list_files', { nope: 'x' })).ok, true)
    const weird = await tool('read_file').run(null as unknown as Record<string, unknown>)
    assert.equal(weird.ok, false)
  })

  test('a missing file yields ok:false rather than a rejection', async () => {
    expectFailure(await call('read_file', { path: 'does-not-exist.txt' }), /ENOENT/)
    expectFailure(
      await call('edit_file', { path: 'does-not-exist.txt', old_string: 'a', new_string: 'b' }),
      /ENOENT/,
    )
  })
})
