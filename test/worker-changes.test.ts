/**
 * What a worker changed, from git.
 *
 * The claim defended here: files a worker writes in the work tree are found, and
 * files that were already dirty (someone else's in-flight work) are not. The first
 * is what lets ship stage them; the second is what keeps ship from staging
 * everything in a shared checkout.
 */

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'

import { changedBetween, parsePorcelain, snapshotChanges } from '../src/worker-changes.ts'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fl-changes-'))
  dirs.push(dir)
  const run = (...args: string[]): void => {
    execFileSync('git', ['-C', dir, '-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { stdio: 'ignore' })
  }
  run('init', '-q', '-b', 'main')
  writeFileSync(join(dir, 'tracked.txt'), 'one\n')
  writeFileSync(join(dir, 'other.txt'), 'x\n')
  run('add', '-A')
  run('commit', '-qm', 'init')
  return execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
}

describe('parsePorcelain', () => {
  it('reads statuses and paths, and skips the original-path field of a rename', () => {
    assert.deepEqual(
      parsePorcelain(' M a.txt\0?? dir/b.txt\0R  new.txt\0old.txt\0A  c.txt\0'),
      [[' M', 'a.txt'], ['??', 'dir/b.txt'], ['R ', 'new.txt'], ['A ', 'c.txt']],
    )
    assert.deepEqual(parsePorcelain(''), [])
  })

  it('keeps a path with spaces whole', () => {
    assert.deepEqual(parsePorcelain('?? my file.txt\0'), [['??', 'my file.txt']])
  })
})

describe('snapshotChanges and changedBetween', () => {
  it('finds a new file and a modified tracked file', () => {
    const root = repo()
    const before = snapshotChanges(root)
    assert.ok(before !== undefined)
    mkdirSync(join(root, 'cmd'))
    writeFileSync(join(root, 'cmd', 'main.go'), 'package main\n')
    writeFileSync(join(root, 'tracked.txt'), 'two\n')
    const changed = changedBetween(before, snapshotChanges(root))
    assert.deepEqual(changed, [join(root, 'cmd', 'main.go'), join(root, 'tracked.txt')])
  })

  it('does not report files that were already dirty and were not touched', () => {
    const root = repo()
    writeFileSync(join(root, 'other.txt'), 'someone else is editing\n')
    writeFileSync(join(root, 'scratch.txt'), 'untracked, not ours\n')
    const before = snapshotChanges(root)
    writeFileSync(join(root, 'mine.txt'), 'ours\n')
    assert.deepEqual(changedBetween(before, snapshotChanges(root)), [join(root, 'mine.txt')])
  })

  it('does report an already-dirty file the worker changed again', () => {
    const root = repo()
    writeFileSync(join(root, 'other.txt'), 'first edit\n')
    const before = snapshotChanges(root)
    writeFileSync(join(root, 'other.txt'), 'second edit\n')
    assert.deepEqual(changedBetween(before, snapshotChanges(root)), [join(root, 'other.txt')])
  })

  it('ignores a deleted file (nothing left to stage)', () => {
    const root = repo()
    const before = snapshotChanges(root)
    rmSync(join(root, 'other.txt'))
    assert.deepEqual(changedBetween(before, snapshotChanges(root)), [])
  })

  it('declines outside a repository, and attributes nothing without a before', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fl-nogit-'))
    dirs.push(dir)
    assert.equal(snapshotChanges(dir), undefined)
    const root = repo()
    writeFileSync(join(root, 'x.txt'), 'x\n')
    assert.deepEqual(changedBetween(undefined, snapshotChanges(root)), [])
  })
})
