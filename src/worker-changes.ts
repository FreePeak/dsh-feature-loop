/**
 * What a worker changed, read from git.
 *
 * The ship phase stages only the paths this run *recorded* writing, because
 * `git add -A` in a shared checkout commits other sessions' in-flight work. A
 * worker is a separate process in a terminal: the envelope never sees its
 * writes, so without this the files it creates are invisible to ship and the run
 * "passes" with a commit that holds none of them (seen on the first real
 * run: the API was built and left untracked).
 *
 * The approach is a before/after snapshot of `git status`, with a content hash
 * per dirty file so a file that was already modified and is modified *again* is
 * still noticed. Files that were dirty before and untouched by the worker are
 * not reported — they belong to someone else.
 *
 * @module dsh-feature-loop/worker-changes
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

/** The dirty files of a work tree at one moment. */
export interface ChangeSnapshot {
  /** The repository's top-level directory (absolute). */
  root: string
  /** Absolute path → `<status>:<content hash | gone>`. */
  entries: Map<string, string>
}

/** More dirty files than this and the snapshot is declined: the tree is not one run's work. */
const MAX_ENTRIES = 5_000
/** A file larger than this is fingerprinted by size and mtime, not content. */
const MAX_HASH_BYTES = 4 * 1024 * 1024

function git(cwd: string, args: string[]): string {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20_000,
  })
}

function fingerprint(path: string): string {
  try {
    const data = readFileSync(path)
    if (data.length > MAX_HASH_BYTES) return `big:${data.length}`
    return createHash('sha1').update(data).digest('hex')
  } catch {
    return 'gone'
  }
}

/**
 * Parse `git status --porcelain=v1 -z` output.
 *
 * Exported for tests. A rename or copy entry is followed by a second NUL field
 * (the original path) that is not an entry of its own.
 *
 * @param raw - the NUL-separated status text.
 * @returns `[status, path]` pairs, paths relative to the repository root.
 */
export function parsePorcelain(raw: string): [string, string][] {
  const fields = raw.split('\0')
  const out: [string, string][] = []
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]!
    if (field.length < 4) continue
    const status = field.slice(0, 2)
    out.push([status, field.slice(3)])
    if (status[0] === 'R' || status[0] === 'C' || status[1] === 'R' || status[1] === 'C') i++
  }
  return out
}

/**
 * Snapshot the dirty files under `cwd`.
 *
 * @param cwd - a directory inside a git work tree.
 * @returns the snapshot, or `undefined` when `cwd` is not in a repository, git
 *          is missing, or the tree is too dirty to attribute.
 */
export function snapshotChanges(cwd: string): ChangeSnapshot | undefined {
  try {
    const realTop = git(cwd, ['rev-parse', '--show-toplevel']).trim()
    if (realTop === '') return undefined
    // git reports real paths (on macOS /private/tmp for /tmp); the policy that
    // will record these compares against the path the session was given. Name
    // the root the way `cwd` names it, so the two agree.
    const root = resolve(cwd, relative(realpathSync(cwd), realTop))
    const raw = git(realTop, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
    const rows = parsePorcelain(raw)
    if (rows.length > MAX_ENTRIES) return undefined
    const entries = new Map<string, string>()
    for (const [status, rel] of rows) {
      const abs = join(root, rel)
      entries.set(abs, `${status}:${fingerprint(abs)}`)
    }
    return { root, entries }
  } catch {
    return undefined
  }
}

/**
 * The files that differ between two snapshots.
 *
 * @param before - taken before the worker started.
 * @param after - taken once it finished.
 * @returns absolute paths that are new, or whose status or content changed, and
 *          that still exist. Sorted, so reports are stable.
 */
export function changedBetween(before: ChangeSnapshot | undefined, after: ChangeSnapshot | undefined): string[] {
  if (after === undefined || before === undefined) return []
  const changed: string[] = []
  for (const [path, value] of after.entries) {
    if (value.endsWith(':gone')) continue
    if (before.entries.get(path) !== value) changed.push(path)
  }
  return changed.sort()
}
