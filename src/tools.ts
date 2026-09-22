/**
 * Sandboxed tool layer for the feature loop.
 *
 * WHY this file exists: the loop runner hands the model five verbs and then trusts
 * whatever path the model puts in the arguments. That trust is the entire attack
 * surface — a hallucinated or hostile `../../.ssh/id_rsa` must not turn into a read.
 * So every tool funnels its path through {@link resolveInRoot}, which resolves
 * against one sandbox root and re-checks containment *after* `fs.realpath`, and every
 * `run()` converts a throw into a {@link ToolResult} so a malformed argument can never
 * kill the loop.
 *
 * Node builtins only, and erasable TypeScript only: this file is loaded by
 * `node --experimental-strip-types`, which rejects enums, namespaces, and constructor
 * parameter properties.
 */

import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * How much damage a tool call can do, so the loop can decide whether to gate it.
 *
 * WHY: a `read` never needs a review gate or a checkpoint, while a write has to be
 * reversible before the loop is allowed to retry a step. The loop reads this field
 * instead of hardcoding tool names, so adding a tool stays a one-line change.
 */
export type Reversibility = 'read' | 'reversible-write' | 'irreversible'

/**
 * The only thing a tool is allowed to hand back to the loop.
 *
 * WHY: the loop must never see a rejected promise — a crash inside a tool would abort
 * a whole run that is otherwise fine. `ok: false` plus a human-readable `error` is the
 * failure channel, and `output` stays the model-visible text (for a failing command,
 * that is the command's own stdout/stderr, not the error).
 */
export interface ToolResult {
  ok: boolean
  output: string
  error?: string
}

/**
 * A single JSON-schema property, narrowed to the three types the loop actually emits.
 *
 * WHY: an OpenAI-compatible `tools` payload needs `{ type, description }` per property,
 * and narrowing to three primitives keeps the schema objects statically checkable —
 * a typo'd `type: 'strng'` fails to compile instead of failing at the provider.
 */
export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean'
  description: string
}

/**
 * One dispatchable tool: its provider-facing schema plus the local implementation.
 *
 * WHY: the loop needs the schema to build the request and the `run` to service the
 * response, and keeping them on one object means a tool cannot be described to the
 * model without also existing locally (or vice versa).
 */
export interface LoopTool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, JsonSchemaProperty>
    required: string[]
  }
  reversibility: Reversibility
  run(args: Record<string, unknown>): Promise<ToolResult>
}

/**
 * Construction options for {@link createTools}.
 *
 * WHY: `root` is mandatory because there is no safe default sandbox — an unset root
 * would silently mean "the whole filesystem". The two limits exist so one runaway
 * command or one huge file cannot blow the loop's context budget or hang a run.
 */
export interface ToolLayerOptions {
  /** Absolute path to the directory every file operation is confined to. */
  root: string
  /** Command timeout in ms. Default 120000. */
  timeoutMs?: number
  /** Cap on bytes returned in a ToolResult.output. Default 20000. */
  maxOutputBytes?: number
}

const DEFAULT_TIMEOUT_MS = 120_000
const DEFAULT_MAX_OUTPUT_BYTES = 20_000
/** Longest command output we will buffer before `spawnSync` itself gives up. */
const MAX_BUFFER_BYTES = 10 * 1024 * 1024
const LIST_CAP = 200
const TRUNCATION_MARKER = '\n[truncated]'
/** Directories that are never interesting to the model and are expensive to walk. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'lib', 'dist'])

/**
 * Resolve a model-supplied path against `root`, or throw if it lands outside.
 *
 * WHY: this is the one function that stands between the model and the rest of the
 * filesystem, so it does two checks instead of one. The lexical check (`path.resolve`)
 * defeats `../..` and absolute paths like `/etc/passwd`. The `fs.realpath` check is
 * what defeats symlinks: it is applied to the *deepest existing ancestor* of the target,
 * because the leaf usually does not exist yet (a write is creating it) while the symlink
 * that would smuggle it out already does. Containment is compared on a separator
 * boundary so `/sandbox-evil` is not accepted as being inside `/sandbox`.
 *
 * Returns the resolved (not realpathed) target so that an in-sandbox symlink still
 * behaves like a symlink for the caller. Known ceiling: a symlink swapped in between
 * this check and the write is a TOCTOU race — not reachable here, since the loop is
 * single-threaded and nothing else writes the sandbox.
 */
export function resolveInRoot(root: string, supplied: string): string {
  if (typeof root !== 'string' || root.length === 0) throw new Error('sandbox root is not configured')
  if (typeof supplied !== 'string' || supplied.length === 0) {
    throw new Error('path must be a non-empty string')
  }
  const rootAbs = path.resolve(root)
  const target = path.resolve(rootAbs, supplied)
  const rootReal = realpathDeepest(rootAbs)
  const targetReal = realpathDeepest(target)
  if (targetReal !== rootReal && !targetReal.startsWith(rootReal + path.sep)) {
    throw new Error(`path escapes the sandbox root: "${supplied}" resolves outside ${rootAbs}`)
  }
  return target
}

/**
 * Realpath the deepest ancestor of `p` that exists, then re-append the missing tail.
 *
 * WHY: `fs.realpathSync` throws on a path that does not exist yet, but the containment
 * check still has to run for not-yet-created files. Walking up to the nearest existing
 * directory is what makes symlink escapes visible without requiring the leaf to exist.
 */
function realpathDeepest(p: string): string {
  let current = path.resolve(p)
  const tail: string[] = []
  for (;;) {
    try {
      const real = fs.realpathSync(current)
      return tail.length === 0 ? real : path.join(real, ...tail.reverse())
    } catch {
      const parent = path.dirname(current)
      if (parent === current) return path.resolve(p) // no ancestor exists at all
      tail.push(path.basename(current))
      current = parent
    }
  }
}

function ok(output: string): ToolResult {
  return { ok: true, output }
}

/** Convert any thrown value into the failure shape the loop understands. */
function fail(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error)
  return { ok: false, output: '', error: message }
}

/**
 * Wrap a tool body so `run()` resolves instead of rejecting.
 *
 * WHY: argument validation is written with plain `throw` because that reads best, and
 * this is the single place that turns those throws into `ok: false`. It also normalises
 * `args`, since a provider can send `null` or a non-object for a no-argument call.
 */
function guard(body: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult) {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const safe = args && typeof args === 'object' ? args : {}
      return await body(safe)
    } catch (error) {
      return fail(error)
    }
  }
}

/** Required string argument: missing, wrong type, and empty are three distinct errors. */
function requiredString(args: Record<string, unknown>, name: string): string {
  const value = args[name]
  if (value === undefined || value === null) throw new Error(`missing required parameter "${name}"`)
  if (typeof value !== 'string') throw new Error(`parameter "${name}" must be a string, got ${typeof value}`)
  if (value.length === 0) throw new Error(`parameter "${name}" must not be empty`)
  return value
}

/**
 * Optional string argument.
 *
 * `allowEmpty` exists for the two places where "" is meaningful data rather than a
 * missing value: `write_file.content` (create an empty file) and `edit_file.new_string`
 * (delete the match). Everywhere else an empty string is treated as absent.
 */
function stringArg(
  args: Record<string, unknown>,
  name: string,
  opts: { required?: boolean; allowEmpty?: boolean } = {},
): string | undefined {
  const value = args[name]
  if (value === undefined || value === null) {
    if (opts.required) throw new Error(`missing required parameter "${name}"`)
    return undefined
  }
  if (typeof value !== 'string') throw new Error(`parameter "${name}" must be a string, got ${typeof value}`)
  if (value.length === 0 && !opts.allowEmpty) {
    if (opts.required) throw new Error(`parameter "${name}" must not be empty`)
    return undefined
  }
  return value
}

/** Resolve + stat a path that must already exist as a regular file. */
function requireFile(root: string, supplied: string): { abs: string; size: number } {
  const abs = resolveInRoot(root, supplied)
  const stat = fs.statSync(abs)
  if (stat.isDirectory()) throw new Error(`"${supplied}" is a directory, not a file`)
  if (!stat.isFile()) throw new Error(`"${supplied}" is not a regular file`)
  return { abs, size: stat.size }
}

function toPosix(relative: string): string {
  return path.sep === '/' ? relative : relative.split(path.sep).join('/')
}

/**
 * Collect absolute file paths under a directory.
 *
 * WHY one walker for both `list_files` and the default test command: the two differ only
 * in which directories they skip and whether they recurse, and a second copy of this loop
 * is a second place for the symlink rule below to be forgotten. Returns `true` when the
 * cap was exceeded, so the caller knows to emit a truncation marker.
 *
 * Symlinks are deliberately neither followed nor listed: a symlink to a directory outside
 * the sandbox would otherwise let `list_files` enumerate the outside tree, which is exactly
 * the escape {@link resolveInRoot} exists to stop.
 */
function walkFiles(
  absDir: string,
  out: string[],
  opts: { recursive?: boolean; skipDirs?: Set<string>; cap?: number } = {},
): boolean {
  const recursive = opts.recursive ?? true
  const cap = opts.cap ?? Number.POSITIVE_INFINITY
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true })
  } catch {
    return false // unreadable or vanished: contribute nothing rather than failing the listing
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    if (out.length > cap) return true
    const full = path.join(absDir, entry.name)
    if (entry.isDirectory()) {
      if (!recursive || opts.skipDirs?.has(entry.name)) continue
      if (walkFiles(full, out, opts)) return true
    } else if (entry.isFile()) {
      out.push(full)
    }
  }
  return out.length > cap
}

/** Slice a string to at most `budget` bytes without emitting a half-decoded character. */
function sliceToBytes(text: string, budget: number): string {
  const buf = Buffer.from(text, 'utf8')
  if (buf.length <= budget) return text
  return buf
    .subarray(0, budget)
    .toString('utf8')
    .replace(/\uFFFD+$/, '')
}

/** Truncate to a byte budget, marker included, so the cap is honoured exactly. */
function truncateText(text: string, max: number): string {
  if (Buffer.byteLength(text) <= max) return text
  const budget = Math.max(0, max - Buffer.byteLength(TRUNCATION_MARKER))
  return sliceToBytes(text, budget) + TRUNCATION_MARKER
}

/**
 * Build the five tools bound to one sandbox root.
 *
 * WHY a factory: the root, timeout, and output cap are per-run policy, while the tool
 * definitions are constant. Closing over the options keeps `run()` free of ambient
 * configuration, so two loops with different roots can run in the same process.
 *
 * `options.root` must already exist; nothing here creates it, because a typo'd root
 * should fail loudly on first use rather than silently create a directory tree.
 */
export function createTools(options: ToolLayerOptions): LoopTool[] {
  if (!options || typeof options.root !== 'string' || options.root.length === 0) {
    throw new Error('createTools requires an absolute "root" directory')
  }
  const root = path.resolve(options.root)
  const timeoutMs = positiveInt(options.timeoutMs, DEFAULT_TIMEOUT_MS)
  const maxOutputBytes = positiveInt(options.maxOutputBytes, DEFAULT_MAX_OUTPUT_BYTES)

  const readFile: LoopTool = {
    name: 'read_file',
    description:
      'Read a UTF-8 text file from the project sandbox. Returns the contents with 1-based line numbers prefixed, so you can reference exact lines in later edits.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root.' },
      },
      required: ['path'],
    },
    reversibility: 'read',
    run: guard(async (args) => {
      const supplied = requiredString(args, 'path')
      const { abs, size } = requireFile(root, supplied)

      // Reserve room for the marker up front so the total stays within maxOutputBytes.
      const budget = Math.max(0, maxOutputBytes - Buffer.byteLength(TRUNCATION_MARKER))
      let raw = ''
      let truncated = size > budget
      const fd = fs.openSync(abs, 'r')
      try {
        const want = Math.min(size, budget + 1)
        const buf = Buffer.allocUnsafe(Math.max(1, want))
        const read = fs.readSync(fd, buf, 0, want, 0)
        raw = buf.subarray(0, read).toString('utf8')
        truncated = size > read
      } finally {
        fs.closeSync(fd)
      }

      let lines = raw === '' ? [] : raw.split('\n')
      if (raw.endsWith('\n')) lines.pop() // trailing newline is not a phantom line
      else if (truncated) lines.pop() // the byte cut left a half line behind

      const out: string[] = []
      let used = 0
      for (let i = 0; i < lines.length; i++) {
        const row = `${String(i + 1).padStart(5)}| ${lines[i]}`
        const cost = Buffer.byteLength(row) + (out.length === 0 ? 0 : 1)
        if (used + cost > budget) {
          truncated = true
          break
        }
        used += cost
        out.push(row)
      }
      if (truncated) out.push(TRUNCATION_MARKER.slice(1))
      return ok(out.join('\n'))
    }),
  }

  const writeFile: LoopTool = {
    name: 'write_file',
    description:
      'Write a UTF-8 text file, creating parent directories as needed. Overwrites the whole file — use edit_file for a targeted change.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root.' },
        content: { type: 'string', description: 'Full file contents. May be empty to create an empty file.' },
      },
      required: ['path', 'content'],
    },
    reversibility: 'reversible-write',
    run: guard(async (args) => {
      const supplied = requiredString(args, 'path')
      const content = stringArg(args, 'content', { required: true, allowEmpty: true }) ?? ''
      const abs = resolveInRoot(root, supplied)
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
        throw new Error(`"${supplied}" is a directory, not a file`)
      }
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, content, 'utf8')
      return ok(`Wrote ${Buffer.byteLength(content, 'utf8')} bytes to ${supplied}`)
    }),
  }

  const editFile: LoopTool = {
    name: 'edit_file',
    description:
      'Replace an exact string in a file. old_string must appear exactly once — include surrounding context to make it unique. An empty new_string deletes the match.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project root.' },
        old_string: { type: 'string', description: 'Exact text to replace, unique within the file.' },
        new_string: { type: 'string', description: 'Replacement text; empty deletes the match.' },
      },
      required: ['path', 'old_string', 'new_string'],
    },
    reversibility: 'reversible-write',
    run: guard(async (args) => {
      const supplied = requiredString(args, 'path')
      const oldString = requiredString(args, 'old_string')
      const newString = stringArg(args, 'new_string', { required: true, allowEmpty: true }) ?? ''
      const { abs } = requireFile(root, supplied)
      const content = fs.readFileSync(abs, 'utf8')

      // Literal scan, not a regex: the model's text is data, and a stray "(" or "$1"
      // must not change the meaning of the edit.
      let occurrences = 0
      let cursor = 0
      for (;;) {
        const at = content.indexOf(oldString, cursor)
        if (at === -1) break
        occurrences += 1
        cursor = at + oldString.length
      }
      if (occurrences === 0) {
        throw new Error(`old_string not found in ${supplied}; read the file and match its text exactly`)
      }
      if (occurrences > 1) {
        throw new Error(
          `old_string appears ${occurrences} times in ${supplied}; include more surrounding context so the match is unique`,
        )
      }

      const at = content.indexOf(oldString)
      const updated = content.slice(0, at) + newString + content.slice(at + oldString.length)
      fs.writeFileSync(abs, updated, 'utf8')
      const line = content.slice(0, at).split('\n').length
      return ok(
        `Replaced 1 occurrence in ${supplied} at line ${line} (${Buffer.byteLength(content, 'utf8')} -> ${Buffer.byteLength(updated, 'utf8')} bytes)`,
      )
    }),
  }

  const listFiles: LoopTool = {
    name: 'list_files',
    description:
      'List file paths relative to the project root, sorted and newline separated. Skips node_modules, .git, lib, and dist. Symlinks are not followed.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory to list, relative to the project root. Defaults to the root.' },
      },
      required: [],
    },
    reversibility: 'read',
    run: guard(async (args) => {
      const supplied = stringArg(args, 'path') ?? '.'
      const abs = resolveInRoot(root, supplied)
      const stat = fs.statSync(abs)

      const found: string[] = []
      if (stat.isFile()) {
        found.push(abs)
      } else {
        walkFiles(abs, found, { skipDirs: SKIP_DIRS, cap: LIST_CAP })
      }
      const relative = found.map((file) => toPosix(path.relative(root, file)))
      relative.sort()
      const truncated = relative.length > LIST_CAP
      const shown = relative.slice(0, LIST_CAP)
      return ok(shown.join('\n') + (truncated ? TRUNCATION_MARKER : ''))
    }),
  }

  const runTests: LoopTool = {
    name: 'run_tests',
    description:
      'Run the project test suite, or a specific command, in the project root. Returns combined stdout and stderr; ok is false when the exit code is non-zero.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command to run instead of the default suite, e.g. "npm test -- --grep login".',
        },
      },
      required: [],
    },
    reversibility: 'read',
    run: guard(async (args) => {
      const supplied = stringArg(args, 'command')

      // A model-supplied command needs a shell to be useful; the default suite is
      // spawned as argv so that paths with spaces cannot be re-parsed as shell syntax.
      let label: string
      let file: string
      let argv: string[]
      let useShell: boolean
      if (supplied) {
        label = supplied
        file = supplied
        argv = []
        useShell = true
      } else {
        const files = defaultTestFiles(root)
        if (files.length === 0) {
          throw new Error(
            'no test files found: looked for test/**/*.test.ts and demo/test/*.test.ts; pass "command" to run something else',
          )
        }
        const relative = files.map((f) => toPosix(path.relative(root, f)))
        label = `node --experimental-strip-types --test ${relative.join(' ')}`
        file = process.execPath
        argv = ['--experimental-strip-types', '--test', ...relative]
        useShell = false
      }

      // ponytail: spawnSync is the whole implementation, so the timeout kills the shell
      // (or the direct child) and not its grandchildren. Upgrade path if a test leaks a
      // process: spawn detached + kill(-pid) on the group, or move to an async runner.
      const result = spawnSync(file, argv, {
        cwd: root,
        shell: useShell,
        timeout: timeoutMs,
        maxBuffer: MAX_BUFFER_BYTES,
        encoding: 'utf8',
      })
      const code = (result.error as NodeJS.ErrnoException | undefined)?.code
      const stdout = result.stdout ?? ''
      const stderr = result.stderr ?? ''
      const body = stdout + (stdout && stderr && !stdout.endsWith('\n') ? '\n' : '') + stderr
      const output = truncateText(`$ ${label}\n${body}`, maxOutputBytes)

      if (code === 'ETIMEDOUT' || result.signal === 'SIGTERM') {
        return {
          ok: false,
          output,
          error: `command timed out after ${timeoutMs}ms and was killed`,
        }
      }
      if (result.error) {
        return { ok: false, output, error: `failed to run command: ${result.error.message}` }
      }
      if (result.status === 0) return ok(output)
      return { ok: false, output, error: `command exited with code ${result.status}` }
    }),
  }

  return [readFile, writeFile, editFile, listFiles, runTests]
}

/** The project's own test files, so the default `run_tests` needs no package.json parsing. */
function defaultTestFiles(root: string): string[] {
  const found: string[] = []
  for (const [dir, recursive] of [
    ['test', true],
    [path.join('demo', 'test'), false],
  ] as const) {
    const abs = path.join(root, dir)
    if (fs.existsSync(abs)) walkFiles(abs, found, { recursive })
  }
  return found.filter((file) => file.endsWith('.test.ts')).sort()
}

function positiveInt(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback
  return Math.floor(value)
}
