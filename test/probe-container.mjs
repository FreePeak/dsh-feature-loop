#!/usr/bin/env node
/**
 * The behavioural probe for the container image — the one check
 * docker/README.md said could not exist.
 *
 * It said that because the shipped image carries web bundles only, so there was
 * no headless runner inside it to drive a task. That was true of the IMAGE and
 * not of the CONTAINER: `@deepseek-ai/dsh-headless` is published, so this script
 * composes a second profile in the running container and drives a real model
 * through the real gate. Nothing is baked, nothing is mounted, the shipped image
 * is unchanged.
 *
 * Run INSIDE the container (the Makefile target does the docker plumbing):
 *   node /tmp/probe-container.mjs
 *
 * What it proves, in two runs, both asserting the DISK rather than the
 * dashboard — a dashboard that reports "allowed" while nothing was written is
 * the failure this file exists to catch:
 *
 *   fail-closed  `write: always-approve` + `gateMode: ask` + no watcher: the
 *                tool is refused and no file appears.
 *   allow        the same gate with a watcher holding the SSE stream, settled
 *                through `POST /api/approvals/:id`: the file appears with the
 *                model's text.
 *
 * Four things it had to learn by running, each of which cost a full round trip:
 *
 *   1. The dashboard lives INSIDE the process that runs the turn, and its token
 *      is per boot — so the token has to be read from the child's own stdout and
 *      the HTTP calls have to happen while that child is alive. Probing it from
 *      a second process finds the port already taken by the FIRST run's still-
 *      dying server, which is a 401 that reads exactly like a plugin bug.
 *   2. The settle route takes `x-dashboard-token`; the query token is for the
 *      read routes. Sending neither returns "missing or invalid dashboard
 *      token", which is why #1 above is so easy to misread.
 *   3. `node:22-slim` has no `pkill`. A stray run from an earlier attempt still
 *      holds the probe port, and every later run then dies with EADDRINUSE
 *      before it can print a token. Reap from /proc by cmdline.
 *   4. The profile needs a harness bundle of its own or the plugin's optional
 *      peerDependencies never resolve: the row composes, the module import
 *      throws ERR_MODULE_NOT_FOUND, and the deployment is silently ungated.
 *      The one-second check for that is the pnpm virtual-store key — a
 *      `_@deepseek-ai+…` suffix means resolved.
 *
 * One thing this probe PROVED by being wrong about, and it is why the run is
 * worth repeating rather than trusting: the fail-closed step was expected to
 * catch a misconfigured gate, so `gateMode: auto` was set in the profile
 * (a value `Config` rejects outright — `expected "ask" | "deny" but got
 * "auto"`) and the probe still passed.
 *
 * Two independent reasons, both correct behaviour and both invisible from
 * outside:
 *
 *   * the profile still composes, because `--dump-config` does not validate;
 *   * `createPolicy` does `gateMode: options.gateMode ?? 'ask'`, so an
 *     unrecognised value is not `deny`-ed or dropped — it falls through to the
 *     SAFE default. `ask` with no answerer refuses, so the gate held anyway.
 *
 * That is the right direction for a safety setting and the wrong lesson to
 * draw: the step cannot distinguish "the gate is right" from "the gate is
 * misconfigured in a way that defaults to asking". It is kept, and the claim it
 * makes is the narrow one the transcript shows — an irreversible write was
 * refused with the approval channel named, and the same gate let a settled
 * write through.
 *
 * ponytail: one script, `dsh plugin --profile … add`, and assertions on the
 * filesystem and the durable session log. It writes no repo file and mutates
 * nothing outside the container's own volume.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

const PROFILE = process.env.PROFILE ?? 'flprobe'

const PORT = process.env.PORT ?? '8110'
const HOME = process.env.DSH_HOME ?? '/data'
const BASE = `http://127.0.0.1:${PORT}`
// The two rows a second profile has to declare for itself, because the settings
// import is one-shot and this profile is not the one that consumed it.
const PROBE_ROWS = [
  '- id: permission',
  "  name: '@deepseek-ai/dsh-permission-presets'",
  '  config:',
  '    defaultPreset: workspace-write',
  '    presets:',
  '      read-only: { sandbox: read-only, approval: ask }',
  '      workspace-write: { sandbox: workspace-write, approval: ask }',
  '      danger-full-access: { sandbox: danger-full-access, approval: never }',
  '- id: llm-pi-ai',
  "  name: '@deepseek-ai/dsh-llm-pi-ai'",
  '  config:',
  '    providers:',
  '      onegw:',
  '        apiKeyEnv: ONEGW_API_KEY',
  '        api: openai-completions',
  '        baseURL: ' + (process.env.ONEGW_BASE_URL ?? 'http://host.docker.internal:8080/v1'),
  // `execution` FIRST, and it is the route every shipped deployment in this
  // repo uses (cordis.patch.yml, docker/profile.patch.yml,
  // scripts/make-profile.sh, the demo). The probe's own profile has to declare
  // it: the settings import is one-shot, so a second profile gets NO settings of
  // its own and llm-pi-ai resolves rungs against the list right here.
  //
  // This probe was the third place to carry the dead concrete ids, and it is
  // why the container ran `UNKNOWN_MODEL` on 2026-10-03 even with the patch row
  // and the settings both declaring `execution` correctly.
  '        models:',
  '          - id: execution',
  '            name: execution',
  '            contextWindow: 200000',
  '            maxTokens: 32000',
  '          - id: opencode/deepseek-v4.1-flash',
  '            name: opencode/deepseek-v4.1-flash',
  '          - id: xai/grok-4.7',
  '            name: xai/grok-4.7',
  '',
].join('\n')
const KEEP = process.env.KEEP === '1'

// pnpm 9 refuses to relink from a store it did not install from, and the
// profile the image baked used exactly this one (`ERR_PNPM_UNEXPECTED_STORE`).
const PNPM_STORE = process.env.PNPM_STORE ?? '/root/.local/share/pnpm/store'
// Zstandard frame magic; a session log is a CONCATENATION of frames, not one stream.
const ZSTD_MAGIC = 0xFD2FB528
// The probe runs under the CONTAINER's own home, not a sub-home of its own.
// That is the lazy answer and the only correct one: a fresh home has no
// `settings.yaml.imported`, so `llm-pi-ai` holds no provider profiles, and the
// first turn dies with `NO_ADAPTER: no adapter registered for provider "onegw"`
// — a container that boots perfectly and cannot run a single model call.
// `DSH_HOME` must also be exported into every child: `sh -c` inherits this
// process's environment, and the first version did not set it, so the profile
// was composed under /data while the runs read /data/probe.
process.env.DSH_HOME = HOME

const log = (...a) => console.log(...a)
const sh = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: 'utf8', timeout: 300_000, ...opts })

/**
 * Every pid whose cmdline mentions the probe profile, excluding this process
 * and its parent.
 *
 * Three things learned here the hard way, all of them silent:
 *
 *   * `node:22-slim` ships no `pkill`, so this walks /proc. It must SKIP ITSELF:
 *     the shell running the scan carries the profile name in its own cmdline, so
 *     a naive match kills the scan mid-loop and the container's entrypoint sees
 *     its PID 1 die — observed as `restarts=1` on an otherwise healthy container.
 *   * it must skip its PARENT too, for the same reason.
 *   * a stale run that survives still holds the probe port, so every later run
 *     dies with EADDRINUSE before it can print a token.
 */
function reapStale() {
  // A heredoc, not a joined one-liner: `if … ; then … ; fi` cannot be strung
  // together with `;` (which is what the first version did, and `sh` rejected it
  // with a bare "Syntax error: ; unexpected" — no line, no hint).
  const scan = `self=$$
parent=$PPID
for d in /proc/[0-9]*; do
  pid=\${d#/proc/}
  [ "$pid" = "$self" ] && continue
  [ "$pid" = "$parent" ] && continue
  c=$(tr '\\0' ' ' < "$d/cmdline" 2>/dev/null)
  case "$c" in
    *${PROFILE}*)
      # skip any shell whose own command line merely MENTIONS the scan
      case "$c" in
        *"sh -c self="*|*"sh -c for d in /proc"*|*"tr "*) continue ;;
      esac
      kill -9 "$pid" 2>/dev/null
      ;;
  esac
done
sleep 2
`
  const out = sh('sh', ['-c', scan])
  if (out.status !== 0) throw new Error(`could not reap a stale ${PROFILE} run: ${out.stderr || out.stdout}`)
}

// ── the probe profile ────────────────────────────────────────────────────────
// Composed here rather than baked, so the image stays exactly as shipped and
// the profile is rebuilt from scratch on every run: an image whose probe had to
// be hand-built once is a probe nobody re-runs.
function composeProfile() {
  const dir = join(HOME, 'profiles', PROFILE)
  if (!existsSync(join(dir, 'package.json'))) {
    log(`==> composing the ${PROFILE} profile`)
    // `--from-default-profile` creates it from the SHIPPED headless template;
    // it is the only step that writes a profile, and `--dump-config` makes it
    // exit instead of booting an app.
    const made = sh('dsh', [PROFILE, '--from-default-profile', 'headless', '--dump-config'])
    if (!existsSync(join(dir, 'package.json'))) {
      throw new Error(`could not create the ${PROFILE} profile: ${made.stderr || made.stdout.slice(0, 400)}`)
    }
    // The peer-supplying bundle. Without it the plugin's `@deepseek-ai/*`
    // optional peers never resolve and the import throws — silently ungated.
    // `--store-dir` is required because pnpm 9 refuses to relink from a store
    // it did not use (`ERR_PNPM_UNEXPECTED_STORE`).
    sh('dsh', ['plugin', '--profile', PROFILE, 'add', '-w', '--store-dir', PNPM_STORE,
      '@deepseek-ai/dsh-experimental-agent-team-profile@0.2.0-rc.2'])
    sh('dsh', ['plugin', '--profile', PROFILE, 'add', '-w', '--store-dir', PNPM_STORE,
      'file:' + resolvePluginDir()])
  }
  // Same activation patch the web profile runs, one key different: the port.
  // Copied rather than re-authored so the probe cannot drift from what ships.
  //
  // The probe needs TWO MORE rows than the web profile's patch carries, and both
  // are there for the same reason: **settings are imported ONCE, into ONE
  // profile.** `dsh-settings` renames `$DSH_HOME/settings.yaml` to
  // `settings.yaml.imported` on first boot and merges its sections into that
  // profile's live config — the web profile got them, so every profile created
  // afterwards composes with an EMPTY `llm-pi-ai`, and the first turn dies with
  //
  //   NO_ADAPTER: no adapter registered for provider "onegw"
  //
  // with the UI, the dashboard and the gate all looking perfect. So the probe
  // declares the provider route and the permission preset itself, in its own
  // patch, from the values the container's settings template already carries.
  const patch = sh('sh', ['-c', `
    sed "s/port: 8100/port: ${PORT}/" /data/profiles/dsh-fl/cordis.patch.yml > ${dir}/cordis.patch.yml
    printf '%s\\n' "${PROBE_ROWS}" >> ${dir}/cordis.patch.yml
  `])
  if (patch.status !== 0) throw new Error(`could not write the probe patch: ${patch.stderr || patch.stdout}`)

  // The one-second check that the module IMPORTS, not that the row composes.
  const imported = sh('sh', ['-c',
    `cd ${HOME}/profiles/${PROFILE} && node -e "import('@freepeak/dsh-feature-loop').then(()=>console.log('OK'),e=>{console.log('FAIL',e.message);process.exit(1)})"`])
  if (!imported.stdout.includes('OK')) {
    throw new Error(
      `the plugin does not import inside ${PROFILE}: ${imported.stdout}${imported.stderr}\n`
      + '  this is the silent-ungated failure — the row composes and nothing gates. '
      + 'Add a harness bundle to the profile so its optional peers resolve.',
    )
  }
  log('   the plugin imports inside the probe profile ✓')
}

/** Where the image keeps the built plugin; `dsh plugin add` wants a real path. */
function resolvePluginDir() {
  const fromProfile = sh('sh', ['-c',
    `node -p "require('${HOME}/profiles/dsh-fl/package.json').dependencies['@freepeak/dsh-feature-loop'].replace('file:','')"`])
  const dir = fromProfile.stdout.trim()
  if (!dir.startsWith('/')) throw new Error(`unexpected plugin spec: ${dir}`)
  return dir
}

// ── one model-driven turn ─────────────────────────────────────────────────────
/**
 * Run one task and return `{ out, exit }`. Never throws on a non-zero exit: a
 * refusal is a RESULT here, not an error.
 */
function runTurn(task) {
  const r = spawnSync('dsh', ['--profile', PROFILE, '--json', task], {
    cwd: HOME, encoding: 'utf8', timeout: 240_000,
    env: { ...process.env, DSH_HOME: HOME },
  })
  return { out: `${r.stdout ?? ''}${r.stderr ?? ''}`, exit: r.status }
}

// ── the HITL cycle, inside the turn's own process ────────────────────────────
/**
 * Start the turn as a child, watch the SSE stream, settle the first pending
 * ask, and report what landed. This cannot be split into "run then poll": the
 * dashboard dies with the process that started it, and the token is per boot.
 *
 * @param task - the model task.
 * @param outcome - `allowed-once` or `rejected`.
 * @returns {{out: string, settle: object, exit: number|null}}
 */
function cycle(task, outcome) {
  const child = spawn('dsh', ['--profile', PROFILE, '--json', task], {
    cwd: HOME, env: { ...process.env, DSH_HOME: HOME },
  })
  let out = ''
  child.stdout.on('data', d => { out += d })
  child.stderr.on('data', d => { out += d })

  return (async () => {
    const bootBy = Date.now() + 180_000
    let token
    while (Date.now() < bootBy && token === undefined) {
      await sleep(400)
      token = /feature-loop dashboard: http:\/\/[^\s?]+\?token=([A-Za-z0-9_-]+)/.exec(out)?.[1]
    }
    if (token === undefined) throw new Error(`no dashboard line in 180s:\n${out.slice(0, 900)}`)

    // Assert the token belongs to THIS process before using it. A 401 here is
    // the diagnostic that says "a stale server owns the port", not "the plugin
    // is broken" — which is how it was read the first time.
    const state = await fetch(`${BASE}/api/state?token=${token}`)
    if (state.status !== 200) throw new Error(`our own token was rejected (HTTP ${state.status}) — a stale run owns ${PORT}`)

    // An open SSE stream is what registers the watcher; without it `answer()`
    // does not claim the ask and the turn fail-closes instead of waiting.
    void fetch(`${BASE}/api/events?token=${token}`).catch(() => undefined)

    let settle = { status: 0, body: 'TIMEOUT' }
    const by = Date.now() + 150_000
    while (Date.now() < by) {
      const snapshot = await (await fetch(`${BASE}/api/state?token=${token}`)).json()
      const ask = (snapshot.pending ?? [])[0]
      if (ask !== undefined) {
        const res = await fetch(`${BASE}/api/approvals/${ask.id}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-dashboard-token': token },
          body: JSON.stringify({ outcome }),
        })
        settle = { tool: ask.toolName, status: res.status, body: await res.text() }
        break
      }
      if (out.includes('turn_end')) { settle = { status: 0, body: 'the turn ended before an ask appeared' }; break }
      await sleep(250)
    }
    const exit = await new Promise(r => child.on('close', r))
    return { out, settle, exit }
  })()
}

/**
 * The audit pair, read from the durable session log.
 *
 * `node:22-slim` carries no `zstd` binary, so the log is read by THIS process's
 * own `node:zlib` rather than by shelling out.
 *
 * @returns the newest session log recording an allowed-once approval, with both
 *   counts, or `{ file: null }`.
 */
function auditTrail() {
  const found = sh('sh', ['-c',
    `find ${join(HOME, 'sessions')} -name 'session.v4.jsonl.zstd' -type f 2>/dev/null`])
  const files = found.stdout.trim().split('\n').filter(Boolean).reverse()
  for (const file of files) {
    let text
    try {
      text = readSessionLog(file)
    } catch {
      continue
    }
    if (!text.includes('"outcome":"allowed-once"')) continue
    return {
      file,
      asked: (text.match(/"type":"approval\/asked"/g) ?? []).length,
      allowedOnce: (text.match(/"type":"approval\/decided"[^\n]*"outcome":"allowed-once"/g) ?? []).length,
    }
  }
  return { file: null }
}

/**
 * Read a whole session log.
 *
 * The log is NOT one zstd stream: `dsh-session-persistence-jsonl` appends a new
 * frame per batch, so the file is a concatenation of independent frames. Node's
 * `zstdDecompressSync` decodes only the FIRST frame — the session header — so the
 * naive read yields 160 bytes of header and finds no approval anywhere, which
 * reads exactly like "the gate left no audit trail". Splitting on the frame
 * magic and decoding each frame is what the harness itself does
 * (`scanZstdFrames`, session-persistence-jsonl/src/zstd.ts).
 *
 * @param file path to a `session.v4.jsonl.zstd`
 * @returns every decoded line of the log
 */
function readSessionLog(file) {
  const bytes = readFileSync(file)
  const frames = []
  for (let at = 0; at + 4 <= bytes.length;) {
    if (bytes.readUInt32LE(at) !== ZSTD_MAGIC) break
    let end = bytes.length
    for (let next = at + 4; next + 4 <= bytes.length; next++) {
      if (bytes.readUInt32LE(next) === ZSTD_MAGIC) { end = next; break }
    }
    frames.push(zstdDecompressSync(bytes.subarray(at, end)).toString())
    at = end
  }
  return frames.join('').split('\n').filter(Boolean).join('\n')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── the proof ────────────────────────────────────────────────────────────────
const PROOF = `${HOME}/probe-proof.txt`
const TASK = `Use the write tool to create ${PROOF} containing the word hello and nothing else. `
  + 'Do not use bash, do not use edit, do not use glob.'

function clearProof() {
  if (existsSync(PROOF)) rmSync(PROOF)
}

// ── 1. fail-closed ───────────────────────────────────────────────────────────
log('==> 1/3  fail-closed: no watcher, so the irreversible write must be refused')
try {
  composeProfile()
  reapStale()
  clearProof()
  const { out } = runTurn(TASK)
  // The refusal text is asserted, not just the absence of the file: a turn that
  // died for an unrelated reason (no adapter, no key) also leaves no file, and
  // that is a different defect with the same symptom.
  //
  // The sentence is the PLUGIN's, not the harness's (KNOWN-ISSUES §1be). The
  // harness's own "no approval channel is available" reached the model as a
  // sandbox objection; asserting it here would pin the confusing version.
  const refused = /nobody is watching/.test(out)
  if (!refused) throw new Error(`expected a refusal naming the absent watcher:\n${out.slice(0, 900)}`)
  if (existsSync(PROOF)) throw new Error(`the gate dispatched the write with no answerer; ${PROOF} exists`)
  log('   refused, no file  ✓')

  // ── 2. allow ──────────────────────────────────────────────────────────────
  log('==> 2/3  allow: the same gate, settled through the dashboard API')
  clearProof()
  const { out: allowedOut, settle } = await cycle(TASK, 'allowed-once')
  log(`   settle ${JSON.stringify(settle)}`)
  if (settle.status !== 200) throw new Error(`the ask did not settle: ${JSON.stringify(settle)}`)
  if (!existsSync(PROOF)) throw new Error(`allow must let the write through; no ${PROOF}:\n${allowedOut.slice(-700)}`)
  const content = readFileSync(PROOF, 'utf8').trim()
  if (content !== 'hello') throw new Error(`the file says ${JSON.stringify(content)}, not "hello"`)
  log(`   written: ${JSON.stringify(content)}  ✓`)

  // ── 3. the audit pair, on the path the container actually runs ────────────
  // The plugin asks through the harness's approval seam, which appends
  // `approval/asked` + `approval/decided` to the durable session log. That pair
  // is the only record that survives the container's exit, so it is asserted
  // rather than assumed: a gate with no audit trail is a gate nobody can audit.
  log('==> 3/3  audit trail: approval/asked + approval/decided must be in the session log')
  const audit = auditTrail()
  if (audit.file === null) {
    throw new Error('no session log records approval/decided=allowed-once — the approval is not auditable')
  }
  if (audit.asked < 1 || audit.allowedOnce < 1) {
    throw new Error(`the audit pair is incomplete: ${JSON.stringify(audit)}`)
  }
  log(`   ${audit.asked} approval/asked, ${audit.allowedOnce} approval/decided=allowed-once ✓`)
  log(`   ${audit.file}`)

  clearProof()
  log('\nprobe passed: refused without an answerer, allowed with one, audited on disk')
} finally {
  if (!KEEP) reapStale()
}
