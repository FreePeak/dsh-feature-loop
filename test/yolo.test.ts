/**
 * The YOLO envelope.
 *
 * This is the security-critical test file of the whole pipeline, so it is
 * organised the way the threat model is: one test per forbidden operation, each
 * named after the thing it prevents, plus a sweep asserting that anything the
 * envelope cannot confidently read comes back `deny`.
 *
 * The sweep matters more than the individual cases. An allow-list with eight
 * well-tested entries and no catch-all is a deny-list wearing a disguise — the
 * ninth operation is the one nobody thought of, and it is the one that ships.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import {
  INTERPRETERS,
  PROTECTED_BRANCHES,
  READ_ONLY_COMMANDS,
  commandWords,
  envelope,
  envelopeCommand,
  escapesWorktree,
  isForbiddenPath,
  isInside,
  killSwitchDecision,
} from '../src/yolo.ts'

const ROOT = '/tmp/fl-run/worktree'

/** Judge a shell command as the bash tool would present it. */
function shell(command: string, verifyCommand?: string): ReturnType<typeof envelope> {
  return envelope({
    tool: 'bash',
    args: { command },
    worktreeRoot: ROOT,
    ...(verifyCommand === undefined ? {} : { verifyCommand }),
  })
}

/** Judge a write as the write tool would present it. */
function write(path: string): ReturnType<typeof envelope> {
  return envelope({ tool: 'write', args: { path }, worktreeRoot: ROOT })
}

describe('the envelope denies the eight forbidden operations', () => {
  it('push to main', () => {
    // The boundary. Everything else is a consequence of this one.
    const r = shell('git push origin main')
    assert.equal(r.kind, 'deny')
    assert.match(r.reason, /"main" is a protected branch/)
  })

  it('push to a protected branch under any refspec spelling', () => {
    for (const command of [
      'git push origin master',
      'git push origin HEAD:main',
      'git push origin HEAD:refs/heads/main',
      'git push --force origin main',
      'git push origin develop',
      'git push origin release',
    ]) {
      assert.equal(shell(command).kind, 'deny', `should have denied: ${command}`)
    }
  })

  it('force-push', () => {
    for (const command of ['git push --force origin fl/x', 'git push -f origin fl/x', 'git push --force-with-lease origin fl/x']) {
      assert.equal(shell(command).kind, 'deny', `should have denied: ${command}`)
    }
  })

  it('merge a pull request', () => {
    const r = shell('gh pr merge 7 --squash')
    assert.equal(r.kind, 'deny')
    assert.match(r.reason, /ship stops at the PR/)
  })

  it('publish', () => {
    for (const command of ['npm publish', 'pnpm publish --access public', 'npm unpublish thing']) {
      assert.equal(shell(command).kind, 'deny', `should have denied: ${command}`)
    }
  })

  it('deploy', () => {
    for (const command of ['kubectl apply -f prod.yaml', 'kubectl delete pod x', 'terraform apply -auto-approve', 'docker push me/app']) {
      assert.equal(shell(command).kind, 'deny', `should have denied: ${command}`)
    }
  })

  it('rewrite history', () => {
    for (const command of ['git reset --hard HEAD~3', 'git clean -fd', 'git rebase main']) {
      assert.equal(shell(command).kind, 'deny', `should have denied: ${command}`)
    }
  })

  it('read or write a credential', () => {
    // On read as well as write: a key read into a transcript is a key leaked,
    // and the transcript is what the evidence bundle keeps.
    for (const path of ['.env', '.env.production', 'config/credentials.yaml', 'id_rsa', 'certs/server.pem', 'private.key']) {
      assert.equal(write(path).kind, 'deny', `should have denied writing ${path}`)
      assert.equal(envelope({ tool: 'read', args: { path }, worktreeRoot: ROOT }).kind, 'deny', `should have denied reading ${path}`)
    }
  })
})

describe('containment', () => {
  it('allows a write inside the worktree', () => {
    assert.equal(write('src/index.ts').kind, 'allow')
    assert.equal(write(`${ROOT}/src/index.ts`).kind, 'allow')
    assert.equal(write('./src/./index.ts').kind, 'allow')
  })

  it('denies a write that escapes the worktree', () => {
    for (const path of ['../outside.ts', '../../etc/passwd', '/etc/passwd', '/Users/someone/else/x.ts']) {
      assert.equal(write(path).kind, 'deny', `should have denied: ${path}`)
    }
  })

  it('denies a write when there is no worktree root to contain it', () => {
    // No root means no boundary. Defaulting to allow here would make the whole
    // containment property optional depending on config.
    const r = envelope({ tool: 'write', args: { path: 'src/a.ts' } })
    assert.equal(r.kind, 'deny')
  })

  it('resolves paths textually, without importing node:path', () => {
    assert.equal(isInside('/a/b', '/a/b/c'), true)
    assert.equal(isInside('/a/b', '/a/bc'), false, 'a sibling with a shared prefix is outside')
    assert.equal(isInside('/a/b', '/a/b/../c'), false)
    assert.equal(isInside('/a/b', '/a'), false)
    assert.equal(isInside(undefined, '/a/b'), false)
  })

  it('denies a write with no readable path', () => {
    assert.equal(envelope({ tool: 'write', args: {}, worktreeRoot: ROOT }).kind, 'deny')
    assert.equal(envelope({ tool: 'write', worktreeRoot: ROOT }).kind, 'deny')
  })
})

describe('what YOLO allows', () => {
  it('allows reading, searching and globbing', () => {
    for (const tool of ['read', 'glob', 'grep']) {
      assert.equal(envelope({ tool, args: { path: 'src/a.ts' }, worktreeRoot: ROOT }).kind, 'allow')
    }
  })

  it('allows a bare grep with no path — it already searches from the root', () => {
    assert.equal(envelope({ tool: 'grep', args: { pattern: 'TODO' }, worktreeRoot: ROOT }).kind, 'allow')
  })

  it('allows pushing the run\'s own branch', () => {
    for (const command of [
      'git push -u origin fl/add-csv-tool',
      'git push origin fl/add-csv-tool',
      'git push origin HEAD:fl/add-csv-tool',
    ]) {
      assert.equal(shell(command).kind, 'allow', `should have allowed: ${command}`)
    }
  })

  it('allows opening a pull request, and only that', () => {
    assert.equal(shell('gh pr create --title x --body-file y').kind, 'allow')
    assert.equal(shell('gh pr list').kind, 'deny', 'reading PRs is harmless but is not what the ship phase needs')
  })

  it('denies build and test runners, because they execute code', () => {
    // This is the change that closed the shell hole. `npm test` and `cargo
    // build` run whatever the project's own config says, from wherever that code
    // chooses — so they are reachable only as the operator's configured
    // `verifyCommand`, never because the model asked nicely.
    for (const command of ['npm test', 'node --test', 'pnpm build', 'tsc --noEmit', 'cargo build --release', 'npm run publish-docs']) {
      assert.equal(shell(command).kind, 'deny', `should have denied: ${command}`)
    }
  })

  it('allows the git the run needs to commit and to be judged', () => {
    for (const command of [
      'git status',
      'git add -A',
      'git commit -m "feat: x"',
      'git diff --stat',
      'git log --oneline',
    ]) {
      assert.equal(shell(command).kind, 'allow', `should have allowed: ${command}`)
    }
  })

  it('allows the ship phase\'s own worktree lifecycle', () => {
    assert.equal(shell('git worktree add .worktrees/x -b fl/x').kind, 'allow')
    assert.equal(shell('git worktree remove .worktrees/x').kind, 'allow')
  })
})

describe('denying what it cannot read', () => {
  // The catch-all sweep. An allow-list with eight tested entries and no
  // classification for the ninth is a deny-list wearing a disguise.
  it('denies an unrecognised tool rather than allowing it', () => {
    const r = envelope({ tool: 'deploy_to_prod', args: {}, worktreeRoot: ROOT })
    assert.equal(r.kind, 'deny')
    assert.match(r.reason, /not in the envelope/)
  })

  it('denies a shell call with no readable command', () => {
    assert.equal(envelope({ tool: 'bash', args: {}, worktreeRoot: ROOT }).kind, 'deny')
    assert.equal(envelope({ tool: 'bash', args: { command: 42 }, worktreeRoot: ROOT }).kind, 'deny')
  })

  it('denies an empty command', () => {
    assert.equal(shell('   ').kind, 'deny')
  })

  it('denies a git with no subcommand', () => {
    assert.equal(shell('git').kind, 'deny')
  })

  it('denies args of a shape it does not expect', () => {
    assert.equal(envelope({ tool: 'write', args: [1, 2, 3], worktreeRoot: ROOT }).kind, 'deny')
    assert.equal(envelope({ tool: 'write', args: 'a string', worktreeRoot: ROOT }).kind, 'deny')
    assert.equal(envelope({ tool: 'write', args: null, worktreeRoot: ROOT }).kind, 'deny')
  })
})

describe('commandWords', () => {
  it('tokenises on whitespace with quotes honoured', () => {
    assert.deepEqual(commandWords('gh pr create --title "a b" --body c'), ['gh', 'pr', 'create', '--title', 'a b', '--body', 'c'])
    assert.deepEqual(commandWords("echo 'x  y'"), ['echo', 'x  y'])
  })

  it('returns nothing for an empty command', () => {
    assert.deepEqual(commandWords('  '), [])
  })

  it('does not pretend to be a shell — it answers "which subcommand"', () => {
    // A pipeline is one token to this, not three. That is the documented limit,
    // and the reason `rm -rf /` is caught by its word list rather than by
    // understanding what it would do.
    assert.deepEqual(commandWords('cat x | sh'), ['cat', 'x', '|', 'sh'])
  })
})

describe('dangerous shell shapes', () => {
  it('denies recursive force-delete of an absolute path', () => {
    assert.equal(shell('rm -rf /').kind, 'deny')
    assert.equal(shell('rm -rf /usr').kind, 'deny')
  })

  it('denies deletion entirely, even of a relative path the loop created', () => {
    // The worktree is removed by `git worktree remove`, which the loop may run.
    // A shell `rm` adds nothing and is one more way out of the envelope.
    assert.equal(shell('rm -f build/output.tmp').kind, 'deny')
    assert.equal(shell('rm -rf src').kind, 'deny')
  })

  it('denies changing permissions or ownership', () => {
    assert.equal(shell('chmod 777 /').kind, 'deny')
    assert.equal(shell('chown root file').kind, 'deny')
  })
})

describe('isForbiddenPath', () => {
  it('names a credential file', () => {
    assert.match(isForbiddenPath('.env') ?? '', /credential/)
    assert.match(isForbiddenPath('secrets/key.pem') ?? '', /credential/)
  })

  it('refuses the untouchable directories', () => {
    assert.match(isForbiddenPath('node_modules/.cache/x') ?? '', /recoverable/)
  })

  it('passes an ordinary source path', () => {
    assert.equal(isForbiddenPath('src/evidence.ts'), undefined)
    assert.equal(isForbiddenPath('docs/0-research.md'), undefined)
  })
})

describe('the kill switch', () => {
  it('halts the run when the sentinel is set', () => {
    const d = killSwitchDecision(true, 'implement')
    assert.notEqual(d, undefined)
    assert.match(d?.reason ?? '', /stop sentinel/)
    assert.match(d?.reason ?? '', /implement/, 'the reason names the phase so the operator knows where it stopped')
    assert.match(d?.reason ?? '', /Remove \.feature-loop\/STOP to resume/)
  })

  it('does nothing when it is not set', () => {
    assert.equal(killSwitchDecision(false, 'implement'), undefined)
  })

  it('works from every state, including a terminal one', () => {
    for (const state of ['research', 'prd', 'implement', 'test', 'ship', 'done']) {
      assert.notEqual(killSwitchDecision(true, state), undefined)
    }
  })
})

describe('a full unattended run raises zero prompts', () => {
  // The PRD's acceptance criterion for YOLO, and the property the book's
  // approval-fatigue argument is really about: a mode that asks is a mode a
  // person learns to click through, which is *"strictly worse than no approval
  // at all"*. So the sweep is not "the forbidden ones are denied" — it is "none
  // of them produce an `ask`, including the ones that are merely risky".
  const SCRIPT: { tool: string; args: unknown }[] = [
    { tool: 'read', args: { path: 'README.md' } },
    { tool: 'glob', args: { pattern: 'src/**/*.ts' } },
    { tool: 'grep', args: { pattern: 'TODO' } },
    { tool: 'bash', args: { command: 'git status --porcelain' } },
    { tool: 'bash', args: { command: 'npm test' } },
    { tool: 'write', args: { path: 'docs/0-research.md', content: 'x' } },
    { tool: 'write', args: { path: 'docs/PRD.md', content: 'x' } },
    { tool: 'edit', args: { path: 'src/index.ts' } },
    { tool: 'bash', args: { command: 'git add -A' } },
    { tool: 'bash', args: { command: 'git commit -m "feat: x"' } },
    { tool: 'bash', args: { command: 'git push -u origin fl/add-a-csv-tool' } },
    { tool: 'bash', args: { command: 'gh pr create --title x --body-file y' } },
  ]

  it('asks about nothing — every verdict is allow or deny, never ask', () => {
    // The verify command is configured here, because that is the one shell call
    // an unattended run may make and it has to come from somewhere.
    const results = SCRIPT.map(call => envelope({ ...call, worktreeRoot: ROOT, verifyCommand: 'npm test' }))
    const asks = results.filter(r => 'ask' in r)
    assert.equal(asks.length, 0, `YOLO must never ask; ${asks.length} call(s) tried`)
    // The legitimate half is genuinely allowed, so this cannot pass by denying
    // everything — which matters, because a YOLO that denies everything looks
    // exactly like a safe one until you try to work with it.
    assert.equal(results.filter(r => r.kind === 'allow').length, SCRIPT.length)
  })

  it('still denies the whole forbidden set while raising no prompts', () => {
    const forbidden: { tool: string; args: unknown }[] = [
      { tool: 'bash', args: { command: 'git push origin main' } },
      { tool: 'bash', args: { command: 'gh pr merge 3' } },
      { tool: 'bash', args: { command: 'npm publish' } },
      { tool: 'write', args: { path: '../escape.ts' } },
      { tool: 'write', args: { path: '.env' } },
      { tool: 'deploy_to_prod', args: {} },
    ]
    const results = forbidden.map(call => envelope({ ...call, worktreeRoot: ROOT }))
    assert.equal(results.filter(r => r.kind === 'deny').length, forbidden.length)
    assert.equal(results.filter(r => 'ask' in r).length, 0)
  })
})

describe('the shell cannot escape the worktree', () => {
  // The regression this whole section exists for. A deny-list of command
  // prefixes looked complete and was not: `bash` was allowed unless its first
  // two words matched a forbidden prefix, so a redirect, a `sed -i` on an
  // absolute path, or `cat ~/.ssh/id_rsa` all passed — and every other YOLO
  // guarantee was defeated by the shell tool.
  it('denies a redirect that writes outside the worktree', () => {
    assert.equal(shell('echo pwned > /Users/someone/evil.js').kind, 'deny')
  })

  it('denies an in-place edit of a file outside the worktree', () => {
    assert.equal(shell("sed -i '' 's/a/b/' /Users/someone/secret.txt").kind, 'deny')
  })

  it('denies reading a credential by home-relative path', () => {
    assert.equal(shell('cat ~/.ssh/id_rsa > /tmp/exfil').kind, 'deny')
  })

  it('denies a `cd` out of the worktree', () => {
    assert.equal(shell('cd /Users/somewhere/else && git commit -am x').kind, 'deny')
  })

  it('denies a traversal out of the worktree', () => {
    assert.equal(shell('cat ../../etc/passwd').kind, 'deny')
  })

  it('denies every interpreter, because one computes its own paths at runtime', () => {
    // `node -e "writeFileSync(HOME + '/x')"` puts no outside path in the argv, so
    // no amount of reading the command can contain it. An allow-list that
    // includes interpreters is not containment.
    for (const tool of INTERPRETERS) {
      assert.equal(READ_ONLY_COMMANDS.has(tool), false, `${tool} must not be on the read-only list`)
    }
    assert.equal(shell('node -e "require(\'fs\').writeFileSync(process.env.HOME+\'/x\',\'y\')"').kind, 'deny')
    assert.equal(shell('npm run deploy').kind, 'deny')
    assert.equal(shell('bash -c "rm -rf ~"').kind, 'deny')
  })

  it('denies any shell command at all when there is no worktree', () => {
    // Containment with nothing to contain against is not containment.
    const r = envelope({ tool: 'bash', args: { command: 'ls' } })
    assert.equal(r.kind, 'deny')
    assert.match(r.reason, /no worktree/)
  })

  it('allows reading inside the worktree', () => {
    for (const command of ['ls -la src', 'cat package.json', 'grep -r foo src', 'wc -l README.md', 'find . -name "*.ts"']) {
      assert.equal(shell(command).kind, 'allow', `should have allowed: ${command}`)
    }
  })

  it('allows the git the run needs, and nothing further', () => {
    for (const command of ['git status --porcelain', 'git diff --stat', 'git add -A', 'git commit -m x', 'git rev-parse HEAD']) {
      assert.equal(shell(command).kind, 'allow', `should have allowed: ${command}`)
    }
  })

  it('allows exactly the configured verify command, and nothing near it', () => {
    assert.equal(shell('npm test', 'npm test').kind, 'allow')
    assert.equal(shell('npm test -- --coverage', 'npm test').kind, 'deny', 'the match is exact, not a prefix')
    assert.equal(shell('npm test && rm -rf /', 'npm test').kind, 'deny')
    assert.equal(shell('npm publish', 'npm test').kind, 'deny')
  })

  it('reports why a command was refused', () => {
    const r = shell('cat ~/.ssh/id_rsa')
    assert.equal(r.kind, 'deny')
    assert.match(r.reason, /outside the worktree|not on the shell allow-list/)
  })
})

describe('escapesWorktree', () => {
  it('names the token that escapes', () => {
    assert.match(escapesWorktree(['cat', '/etc/passwd'], '/wt') ?? '', /outside the worktree/)
    assert.match(escapesWorktree(['cat', '~/x'], '/wt') ?? '', /home directory/)
    assert.match(escapesWorktree(['cat', '../x'], '/wt') ?? '', /traverses/)
  })

  it('passes a bare relative word, which resolves against the command cwd', () => {
    assert.equal(escapesWorktree(['cat', 'src', 'a.ts'], '/wt'), undefined)
  })

  it('ignores flags', () => {
    assert.equal(escapesWorktree(['grep', '-r', '--exclude=..', 'x'], '/wt'), undefined)
  })

  it('allows an absolute path inside the worktree', () => {
    assert.equal(escapesWorktree(['cat', '/wt/src/a.ts'], '/wt'), undefined)
  })
})

describe('the run record reports what the run spent', () => {
  // Found by running the loop, not by reading it. `agentOfSession` returned
  // `undefined` unconditionally with a note naming the upgrade path, so every
  // `turn/end` record was written against the shared agent-less policy — which
  // never sees a step, because steps land on the per-agent one. The history file
  // filled with `steps: 0, costUSD: 0` for runs that had demonstrably done work.
  //
  // A ceiling reported as zero is not a ceiling, and a `$0.00` history is worse
  // than no history: it is believed.
  it('resolves the session\'s agent through the harness registry', () => {
    const source = readFileSync(new URL('../src/plugin.ts', import.meta.url), 'utf8')
    assert.doesNotMatch(
      source,
      /function agentOfSession\(_session: unknown\)[\s\S]*?\{\s*return undefined\s*\}/,
      'agentOfSession must not be a stub that always returns undefined',
    )
    assert.match(source, /agents\.get\(/, 'the record must resolve its policy through ctx.agents.get(sessionId)')
  })

  it('does not call ctx.get unguarded — a stubbed context must not crash the record', () => {
    // Found by the suite the moment the lookup landed: five approval tests drive
    // `apply` with a context that has no `get`, and the plugin crashed on the way
    // to a perfectly good fail-closed record.
    const source = readFileSync(new URL('../src/plugin.ts', import.meta.url), 'utf8')
    assert.doesNotMatch(source, /const agents = ctx\.get\('agents'\)/)
    assert.match(source, /typeof ctx\.get === 'function'/)
  })
})

describe('the protected branch list', () => {
  it('covers the branches a repository actually uses', () => {
    for (const branch of ['main', 'master']) {
      assert.ok(PROTECTED_BRANCHES.includes(branch), `${branch} must be protected`)
    }
  })

  it('does not protect the loop\'s own branch namespace', () => {
    assert.equal(PROTECTED_BRANCHES.includes('fl/add-csv-tool'), false)
  })
})
