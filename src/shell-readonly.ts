/**
 * Recognise a shell command that can only read, so an ask-mode run does not
 * stop a human for `pwd && ls -la`.
 *
 * A live run asked for a click on its very first command — `pwd && ls -la && go
 * version` — and on eleven more like it. Every one of them was harmless, and an
 * approval nobody can say no to for a good reason is not a gate, it is a
 * toll. This module is the narrow answer: a command is read-only only when
 * EVERY part of it is provably so, and anything this cannot fully read is left
 * to the human exactly as before.
 *
 * It is deliberately stricter than the YOLO envelope's `READ_ONLY_COMMANDS`,
 * which lists `cp`, `mv`, `tee` and `sed` because the envelope contains them by
 * path. Here nothing is contained by a sandbox that is not there, so a command
 * that can write is simply not on the list.
 *
 * Not a shell parser. It refuses what it cannot cheaply prove — substitution,
 * variable expansion, redirection, backgrounding — rather than modelling it.
 *
 * @module
 */

import { commandWords, escapesWorktree, isForbiddenPath } from './yolo.ts'

/** Commands whose whole purpose is to print. None writes a file by itself. */
const PLAIN_READERS: ReadonlySet<string> = new Set([
  'pwd', 'ls', 'cat', 'head', 'tail', 'wc', 'file', 'stat', 'which', 'true',
  'echo', 'grep', 'rg', 'cd', 'basename', 'dirname', 'sort', 'uniq', 'diff', 'cut',
])

/** An argument that makes an otherwise-reading command write or execute. */
const DANGEROUS_FLAGS: Readonly<Record<string, readonly string[]>> = {
  // `sort -o out` writes; `rg --pre cmd` runs a program per file.
  sort: ['-o', '--output'],
  rg: ['--pre', '--pre-glob'],
  find: ['-exec', '-execdir', '-ok', '-okdir', '-delete', '-fprint', '-fprint0', '-fprintf', '-fls'],
  gofmt: ['-w'],
  go: ['-w', '-u', '-toolexec', '-exec', '-vettool'],
  git: ['--output', '--ext-diff', '--textconv', '--exec-path'],
}

/** `go` subcommands that inspect and do not build into the tree. */
const GO_READ_SUBCOMMANDS: ReadonlySet<string> = new Set(['version', 'env', 'list', 'vet', 'doc'])

/** `git` subcommands that only read the repository. */
const GIT_READ_SUBCOMMANDS: ReadonlySet<string> = new Set([
  'status', 'log', 'diff', 'show', 'rev-parse', 'ls-files', 'blame',
])

/** The two redirections that cannot write a file. */
const HARMLESS_REDIRECTS = /\s*2>&1|\s*2>\/dev\/null/g

/**
 * Split on `&&`, `||`, `;`, a newline and `|` outside quotes.
 *
 * @param command - the command line.
 * @returns the segments, or `undefined` for a shape this does not handle
 *          (a lone `&`, which backgrounds, or an unterminated quote).
 */
function segments(command: string): string[] | undefined {
  const out: string[] = []
  let current = ''
  let quote: '"' | "'" | undefined
  for (let i = 0; i < command.length; i++) {
    const char = command[i]!
    if (quote !== undefined) {
      if (char === quote) quote = undefined
      current += char
      continue
    }
    if (char === '"' || char === "'") { quote = char; current += char; continue }
    if (char === '&') {
      if (command[i + 1] !== '&') return undefined
      out.push(current); current = ''; i++
      continue
    }
    if (char === '|') {
      out.push(current); current = ''
      if (command[i + 1] === '|') i++
      continue
    }
    // A newline ends a command exactly as `;` does. Models write multi-line
    // scripts of `echo` headers and `go doc` calls; refusing them wholesale
    // would send the most ordinary read-only script to a human.
    if (char === ';' || char === '\n') { out.push(current); current = ''; continue }
    current += char
  }
  if (quote !== undefined) return undefined
  out.push(current)
  return out
}

/** Why one segment is not provably read-only, or `undefined` when it is. */
function segmentProblem(words: readonly string[], root: string): string | undefined {
  const head = words[0]
  if (head === undefined) return 'an empty command'
  const rest = words.slice(1)

  const flags = DANGEROUS_FLAGS[head]
  if (flags !== undefined) {
    const bad = rest.find(w => flags.some(f => w === f || w.startsWith(`${f}=`)))
    if (bad !== undefined) return `"${head} ${bad}" can write or run a program`
  }
  if (head === 'git' || head === 'go') {
    // The subcommand must come first: `git -c core.pager=… status` is a way to
    // run a program under a read-sounding name.
    const sub = rest[0]
    if (sub === undefined || sub.startsWith('-')) return `"${head}" with no plain subcommand`
    const allowed = head === 'go' ? GO_READ_SUBCOMMANDS : GIT_READ_SUBCOMMANDS
    const branchList = head === 'git' && sub === 'branch' && rest.slice(1).every(w => ['-a', '-v', '-vv', '--list', '-r'].includes(w))
    if (!allowed.has(sub) && !branchList) return `"${head} ${sub}" is not a read-only subcommand`
  } else if (head === 'find' || head === 'gofmt') {
    // Allowed heads, with the dangerous flags checked above.
  } else if (!PLAIN_READERS.has(head)) {
    return `"${head}" is not a read-only command`
  }

  const FIND_FILTERS = new Set(['-path', '-ipath', '-wholename', '-name', '-iname', '-regex'])
  for (const [index, word] of rest.entries()) {
    // A flag carrying a path: `--file=/etc/passwd`.
    const target = word.startsWith('-') ? (word.includes('=') ? word.slice(word.indexOf('=') + 1) : undefined) : word
    if (target === undefined || target === '') continue
    // `./...` is Go's "every package below here", not a traversal. Only the
    // literal wildcard is removed, so `../x` and `a/../../b` still carry `..`.
    const escape = escapesWorktree([target.replace(/\.\.\./g, '')], root)
    if (escape !== undefined) return escape
    // `find . -not -path './.git/*'` NAMES .git to leave it out; it reads
    // nothing there. Only the filter operand is exempt — `find .git` is not.
    const isFilterOperand = head === 'find' && FIND_FILTERS.has(rest[index - 1] ?? '')
    if (!word.startsWith('-') && !isFilterOperand) {
      const forbidden = isForbiddenPath(target)
      if (forbidden !== undefined) return forbidden
    }
  }
  return undefined
}

/**
 * Whether a shell command is safe to run without asking.
 *
 * @param command - the command line the model wrote.
 * @param root - the directory the run works in. Without one nothing is provable.
 * @param verifyCommand - the operator's test command, which is allowed when
 *        matched in full (never as a prefix).
 * @returns why it may run unasked, or `undefined` when a human should look.
 */
export function readOnlyShell(command: string, root: string | undefined, verifyCommand?: string): string | undefined {
  const trimmed = command.trim()
  if (trimmed === '') return undefined
  if (verifyCommand !== undefined && trimmed === verifyCommand.trim()) return 'the configured verify command'
  if (root === undefined) return undefined

  // `$?` is the previous exit status — the one expansion a script of `echo
  // "exit=$?"` needs, and one that cannot run or reveal anything.
  const stripped = trimmed.replace(HARMLESS_REDIRECTS, '').replace(/\$\?/g, '')
  // Anything that can hide a second command or a write: substitution, variable
  // expansion, redirection, here-docs, a backslash (line continuation, escapes).
  if (/[`$<>\r\\]/.test(stripped)) return undefined

  const parts = segments(stripped)
  if (parts === undefined) return undefined
  // The pieces of the operator's own verify command, each matched in full. The
  // command is usually `a && b`, and a model that runs it as `b | tail -20` or
  // one half at a time is still running exactly what the operator chose.
  const verifyPieces = new Set(
    verifyCommand === undefined ? [] : (segments(verifyCommand.trim()) ?? []).map(piece => piece.trim()),
  )
  const heads: string[] = []
  for (const part of parts) {
    if (verifyPieces.has(part.trim())) { heads.push('verify'); continue }
    const words = commandWords(part)
    if (segmentProblem(words, root) !== undefined) return undefined
    heads.push(words[0]!)
  }
  return `read-only shell: ${[...new Set(heads)].join(', ')}`
}
