/**
 * The demo CLI: run the whole loop against a real repository.
 *
 * This is the artefact the phases are for. It wires the eight dimensions to a
 * real model, a real sandbox, and a real success command, then narrates every
 * decision the loop made — which route it chose and why it escalated, what the
 * detectors saw, where it asked for a human, and what it cost.
 *
 * Usage:
 *   node --experimental-strip-types src/cli.ts --root demo --goal "fix the bug"
 *
 * @module dsh-feature-loop/cli
 */

import { exec } from 'node:child_process'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { promisify } from 'node:util'
import { resolve } from 'node:path'

import { createTools } from './tools.ts'
import { createOnegwClient } from './llm.ts'
import { createChatJudge } from './judge.ts'
import { OnegwJudge, NO_JUDGE } from './laya.ts'
import type { Judge, SystemOneQuestion } from './laya.ts'
import type { ReviewSignal } from './signals.ts'
import { authorQuestions } from './questioner.ts'
import { runRefined } from './refine.ts'
import { renderTranscript } from './runner.ts'
import type { ReviewRequest } from './runner.ts'
import { phaseOf } from './prompts.ts'
import { parseLoops } from './spec.ts'
import type { LoopSpec } from './spec.ts'
import { advisoryFor, defaultHistoryPath, planEnvelope, recordsForTask } from './optimize.ts'
import { readRecords, specFingerprint, taskKeyOf } from './runlog.ts'
import { CONFIG_TEMPLATE, PROJECT_CONFIG_PATH, describeSources, loadConfig, validateConfig } from './config.ts'
import type { FeatureLoopConfig } from './config.ts'

const run = promisify(exec)

/** Parsed command-line options. */
interface Options {
  root: string
  verify: string
  goal: string
  phase: 'bugfix' | 'feature' | 'refactor'
  model: string
  provider: string
  budgetUSD: number
  maxSteps: number
  judge: 'none' | 'chat' | 'laya'
  judgeModel: string
  /**
   * System One provider base URL (Laya, Jev, TypeSafe — same wire). Not the
   * actor gateway. Default `SYSTEMONE_BASE_URL` or `http://127.0.0.1:8091`.
   * Swap providers by changing only this URL (and the model alias).
   */
  judgeBaseURL: string
  /** Model alias the System One provider routes to (`laya`, hosted Jev id, …). */
  systemOneModel: string
  reviewBudget: number
  auto: boolean
  maxTokens: number
  quiet: boolean
  /**
   * Refinement passes, when `--loops` was given. Absent means one pass:
   * `runRefined` with no `loops` runs `runLoop` exactly once, so "not asked
   * for" and "not wired" are the same behaviour by construction.
   */
  loops?: number
  /**
   * Whether `--max-steps` / `--budget` were given. An explicit flag is an
   * instruction and outranks a derived ceiling; a default is not, and
   * `--derive` is allowed to move it. Tracked as a pin rather than compared
   * against the default value, because "the operator typed the default" and
   * "nobody typed anything" are different statements.
   */
  maxStepsPinned: boolean
  budgetPinned: boolean
  /** Derive this run's ceilings from recorded history instead of the flags alone. */
  derive: boolean
  /**
   * The run-history file. Defaults to `.feature-loop/runs.jsonl` under the
   * invoking directory — NOT under `--root`: the sandbox is what the loop may
   * edit, and a loop able to rewrite the file its own ceilings come from is a
   * loop that can raise its own ceiling.
   */
  history?: string
  /**
   * An explicit `--config` file. Recorded here so `main` can hand it to the
   * loader; the file's *values* arrive through the same merge as every other
   * layer rather than being applied in `parseArgs`.
   */
  configPath?: string
  /** `--init`: write a starter config and exit, without running the loop. */
  init: boolean
}

/**
 * The subset of argv that config cannot supply, captured during parsing.
 *
 * Kept separate from {@link Options} because the merge has to happen in a
 * defined order: the loader needs the root and the explicit path *before* it
 * can read the project layer, and the flags have to come back as the final
 * override layer rather than being baked in as defaults.
 */
interface CliLayer {
  /** Flags that were actually typed, as config keys. */
  overrides: FeatureLoopConfig
  /** Whether `--max-steps` / `--budget` were given — see {@link Options.maxStepsPinned}. */
  maxStepsPinned: boolean
  budgetPinned: boolean
}

const USAGE = `dshloop — run a bounded agent loop against any repository

  dshloop [root] "<goal>"           the common case; everything else from config
  dshloop . "add dark mode"         explicit root
  dshloop "fix the flaky test"      root defaults to the current directory

Arguments
  root <dir>          the sandbox root the loop may edit   (default: cwd)
  goal <text>         what "done" means, observably        (required)

Config
  Everything below has a default and can live in a config file, so the two
  arguments above are usually all you type. Precedence, lowest to highest:
  built-in defaults → ~/.config/dshloop/config.yaml → <root>/.feature-loop/
  config.yaml → --config <file> → the flags below.

  dshloop --init      write a commented starter to <root>/.feature-loop/config.yaml

Run
  --verify <cmd>      success command, run with the root as its working dir;
                      exit 0 = done                       (config: verify)
  --phase <name>      bugfix | feature | refactor         (config: phase)
  --budget <usd>      cost ceiling for the run            (config: budgetUSD)
  --max-steps <n>     step ceiling for the run            (config: maxSteps)
  --loops <n>         refinement passes, integer 3–10     (config: loops)
  --derive            derive ceilings from recorded history
  --auto              never block on a human (CI/demo)
  --quiet             suppress the per-step narration

Judge
  --judge <kind>      none | chat | laya                  (config: judge)
  --judge-base-url <u> System One provider URL — Laya/Jev/TypeSafe, same wire
  --systemone-model <id> System One model alias
  --judge-model <id>  model the chat judge uses
  --review-budget <f> fraction of steps a human may be asked

Model
  --model <id>        full gateway model id
  --provider <name>   route prefix when --model has none

Other
  --config <file>     an explicit config file (outranks the implicit ones)
  --root <dir>        same as the positional root
  --goal <text>       same as the positional goal
  -h, --help          this text

The verify command is resolved relative to the root, not to your shell: it runs
INSIDE the sandbox, the same place the loop's tools run. With root "demo", use
"bash verify.sh", not "bash demo/verify.sh".
`



/** Parse argv into options, rejecting unknown flags loudly. */
function parseArgs(argv: string[]): Options | 'help' {
  const options: Options = {
    root: process.cwd(),
    verify: 'bash verify.sh',
    goal: '',
    phase: 'feature',
    model: 'xiaomi/mimo-v2.5',
    provider: 'xiaomi',
    budgetUSD: 1.0,
    maxSteps: 15,
    judge: 'laya',
    judgeModel: 'xiaomi/mimo-v2.5',
    judgeBaseURL: process.env.SYSTEMONE_BASE_URL ?? 'http://127.0.0.1:8091',
    systemOneModel: process.env.SYSTEMONE_MODEL ?? 'laya',
    reviewBudget: 0.1,
    auto: false,
    maxTokens: 4096,
    quiet: false,
    maxStepsPinned: false,
    budgetPinned: false,
    derive: false,
    init: false,
  }
  const value = (i: number, flag: string): string => {
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) throw new Error(`${flag} needs a value`)
    return v
  }
  // Positional arguments, in order: the first that names an existing directory
  // is the root; anything else is goal text (joined, so an unquoted goal still
  // works). Tracked rather than assigned immediately because a later
  // `--root`/`--goal` flag must win over a positional.
  const positional: string[] = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    switch (arg) {
      case '-h': case '--help': return 'help'
      case '--init': options.init = true; break
      case '--root': options.root = value(i, arg); i += 1; break
      case '--config': options.configPath = value(i, arg); i += 1; break
      case '--verify': options.verify = value(i, arg); i += 1; break
      case '--goal': options.goal = value(i, arg); i += 1; break
      case '--phase': options.phase = value(i, arg) as Options['phase']; i += 1; break
      case '--model': options.model = value(i, arg); i += 1; break
      case '--provider': options.provider = value(i, arg); i += 1; break
      case '--budget': options.budgetUSD = Number(value(i, arg)); options.budgetPinned = true; i += 1; break
      case '--max-steps': options.maxSteps = Number(value(i, arg)); options.maxStepsPinned = true; i += 1; break
      case '--derive': options.derive = true; break
      case '--history': options.history = value(i, arg); i += 1; break
      case '--judge': options.judge = value(i, arg) as Options['judge']; i += 1; break
      case '--judge-model': options.judgeModel = value(i, arg); i += 1; break
      case '--judge-base-url': options.judgeBaseURL = value(i, arg); i += 1; break
      case '--systemone-model': options.systemOneModel = value(i, arg); i += 1; break
      case '--review-budget': options.reviewBudget = Number(value(i, arg)); i += 1; break
      case '--max-tokens': options.maxTokens = Number(value(i, arg)); i += 1; break
      case '--loops': {
        // Validated through the same helper the config block uses, under the
        // CLI's own field name — so `--loops 30` fails at parse time with the
        // same band message `optimize.loops: 30` would produce.
        options.loops = parseLoops(Number(value(i, arg)), '--loops')
        i += 1
        break
      }
      case '--auto': options.auto = true; break
      case '--quiet': options.quiet = true; break
      default:
        if (arg.startsWith('-')) throw new Error(`unknown flag "${arg}"`)
        positional.push(arg)
    }
  }

  // Positionals resolve last, so an explicit `--root` / `--goal` outranks them.
  // The first positional naming an existing directory is the root; everything
  // else is goal text.
  const rest: string[] = []
  for (const arg of positional) {
    if (options.root === process.cwd() && rest.length === 0 && arg !== '' && existsSync(arg) && statSync(arg).isDirectory()) {
      options.root = arg
    } else {
      rest.push(arg)
    }
  }
  if (rest.length > 0 && options.goal === '') options.goal = rest.join(' ')

  return options
}

/**
 * The flags the operator actually typed, as a config layer.
 *
 * Only flags present in argv are included: a key absent here lets the config
 * file's value stand, which is the whole point of the file. Values equal to a
 * default are therefore NOT treated as typed — `--budget 1.00` is still a pin
 * (it is in argv), but a config file's `budgetUSD: 1.00` is not.
 */
function flagLayer(options: Options, argv: string[]): CliLayer {
  const has = (flag: string): boolean => argv.includes(flag)
  const overrides: FeatureLoopConfig = {}
  if (has('--root')) overrides.root = options.root
  if (has('--goal')) overrides.goal = options.goal
  if (has('--verify')) overrides.verify = options.verify
  if (has('--phase')) overrides.phase = options.phase
  if (has('--model')) overrides.model = options.model
  if (has('--provider')) overrides.provider = options.provider
  if (has('--budget')) overrides.budgetUSD = options.budgetUSD
  if (has('--max-steps')) overrides.maxSteps = options.maxSteps
  if (has('--max-tokens')) overrides.maxTokens = options.maxTokens
  if (has('--review-budget')) overrides.reviewBudget = options.reviewBudget
  if (has('--judge')) overrides.judge = options.judge
  if (has('--judge-model')) overrides.judgeModel = options.judgeModel
  if (has('--judge-base-url')) overrides.judgeBaseURL = options.judgeBaseURL
  if (has('--systemone-model')) overrides.systemOneModel = options.systemOneModel
  if (has('--history')) overrides.history = options.history
  if (has('--loops')) overrides.loops = options.loops
  if (has('--auto')) overrides.auto = true
  if (has('--quiet')) overrides.quiet = true
  // `--derive` is CLI-only (the plugin records history but never iterates), so
  // it is not a config key — it is carried on `options` directly.
  return { overrides, maxStepsPinned: options.maxStepsPinned, budgetPinned: options.budgetPinned }
}

/**
 * Overlay a merged config onto the parsed options, keeping the CLI's pin flags.
 *
 * The CLI's `Options` shape predates the config file and is what every
 * downstream function reads, so the merge lands here rather than being threaded
 * through as a second vocabulary. Fields absent from both file and flags keep
 * the value `parseArgs` seeded, which is where the built-in defaults live.
 *
 * @param options - options as parsed, already carrying flag values.
 * @param config - the merged config (defaults → user → project → flags).
 * @param argv - the raw argv, used to distinguish a typed flag from a default.
 * @returns the same options object, for chaining.
 */
function applyConfig(options: Options, config: FeatureLoopConfig, argv: string[]): Options {
  const has = (flag: string): boolean => argv.includes(flag)
  if (config.root !== undefined) options.root = config.root
  if (config.goal !== undefined) options.goal = config.goal
  if (config.verify !== undefined) options.verify = config.verify
  if (config.phase !== undefined) options.phase = config.phase
  if (config.model !== undefined) options.model = config.model
  if (config.provider !== undefined) options.provider = config.provider
  if (config.budgetUSD !== undefined) options.budgetUSD = config.budgetUSD
  if (config.maxSteps !== undefined) options.maxSteps = config.maxSteps
  if (config.maxTokens !== undefined) options.maxTokens = config.maxTokens
  if (config.reviewBudget !== undefined) options.reviewBudget = config.reviewBudget
  if (config.judge !== undefined) options.judge = config.judge
  if (config.judgeModel !== undefined) options.judgeModel = config.judgeModel
  if (config.judgeBaseURL !== undefined) options.judgeBaseURL = config.judgeBaseURL
  if (config.systemOneModel !== undefined) options.systemOneModel = config.systemOneModel
  if (config.history !== undefined) options.history = config.history
  if (config.loops !== undefined) options.loops = config.loops
  if (config.auto !== undefined) options.auto = config.auto
  if (config.quiet !== undefined) options.quiet = config.quiet
  // A pin survives a config file: a typed `--max-steps` is an instruction, and
  // `--derive` must not move it. A *default* stays movable, which is why this
  // reads argv rather than comparing against the default value.
  if (!has('--max-steps')) options.maxStepsPinned = false
  if (!has('--budget')) options.budgetPinned = false
  return options
}

/**
 * The demo's loop spec.
 *
 * The prices are the run's effective plan rates, not list prices: `mimo-v2.5`
 * runs on a subscription token plan, so the marginal cost of a step is near
 * zero and the interesting ceiling is the *step* count. Both are configured
 * anyway, because a budget with no price table cannot price anything and would
 * read as $0 forever — the failure `budget.ts` refuses to hide.
 */
/**
 * Resolve `--model` into the route the loop actually uses.
 *
 * `--model` is the full gateway id (`xiaomi/mimo-v2.5`). The route needs the two
 * halves separately so the price table can key on `provider/model` while the
 * runner re-joins them into the exact id the gateway expects — joining a full id
 * onto a provider would send `xiaomi/xiaomi/mimo-v2.5`, which is a different
 * model name. The banner and the spec both read this one function, so they
 * cannot disagree about what is being run.
 *
 * @param options - the parsed flags.
 * @returns the provider, the bare model, and the full id.
 */
function effectiveRoute(options: Options): { provider: string, model: string, fullID: string } {
  const slash = options.model.indexOf('/')
  const provider = slash === -1 ? options.provider : options.model.slice(0, slash)
  const model = slash === -1 ? options.model : options.model.slice(slash + 1)
  return { provider, model, fullID: `${provider}/${model}` }
}

/**
 * The demo's loop spec.
 *
 * The prices are the run's effective plan rates, not list prices: `mimo-v2.5`
 * runs on a subscription token plan, so the marginal cost of a step is near
 * zero and the interesting ceiling is the *step* count. Both are configured
 * anyway, because a budget with no price table cannot price anything and would
 * read as $0 forever — the failure `budget.ts` refuses to hide.
 */
function loopSpec(options: Options): LoopSpec {
  const { provider, model, fullID } = effectiveRoute(options)

  return {
    goal: options.goal === ''
      ? 'the demo test suite passes, including the test that reproduces the reported bug'
      : options.goal,
    sensor: ['repository files under the sandbox root', 'the test suite output'],
    controller: {
      ladder: [
        { provider, model },
      ],
      stepsPerRung: 0,
      escalateAfterFailures: 3,
    },
    actuator: phaseOf(options.phase).actuator,
    feedback: 'the verification command exits 0, and the change is the smallest that achieves it',
    termination: {
      successCommand: options.verify,
      guards: ['error-cascade', 'tool-cycle'],
    },
    maxSteps: options.maxSteps,
    costBudgetUSD: options.budgetUSD,
    prices: {
      [fullID]: {
        inputPerMTok: 0.3,
        outputPerMTok: 1.2,
        cacheReadPerMTok: 0.03,
      },
    },
    unpricedFallback: { inputPerMTok: 0.3, outputPerMTok: 1.2, cacheReadPerMTok: 0.03 },
  }
}

/** Build the judge the operator asked for, reporting honestly which one it is. */
function buildJudge(options: Options, apiKey: string, baseURL: string): { judge: Judge, label: string } {
  if (options.judge === 'none') return { judge: NO_JUDGE, label: 'none (detectors only)' }
  if (options.judge === 'laya') {
    return {
      judge: new OnegwJudge({
        baseURL: options.judgeBaseURL,
        model: options.systemOneModel,
        timeoutMs: 30000,
      }),
      label: `systemone (${options.systemOneModel} @ ${options.judgeBaseURL}/v1/systemone)`,
    }
  }
  return {
    judge: createChatJudge({
      llm: createOnegwClient({ baseURL, apiKey }),
      model: options.judgeModel,
    }),
    label: `chat (${options.judgeModel})`,
  }
}

/**
 * Read the gateway key from the environment or the DSH credential store.
 *
 * Two names are accepted because both are in use: `ONEGW_API_KEY` is what the
 * DSH credential store records, and `ONEGE_API_KEY` is what earlier versions of
 * this file looked for. Reading only the latter made the demo fail with "not in
 * the environment or in ~/.dsh/.credentials.yaml" on a machine where the key WAS
 * there — under a name this function never checked.
 *
 * @returns the gateway API key.
 * @throws when neither name is present in the environment or the store.
 */
async function resolveApiKey(): Promise<string> {
  for (const name of ['ONEGW_API_KEY', 'ONEGE_API_KEY'] as const) {
    const fromEnv = process.env[name]
    if (fromEnv !== undefined && fromEnv !== '') return fromEnv
  }
  const { readFile } = await import('node:fs/promises')
  const { homedir } = await import('node:os')
  const raw = await readFile(resolve(homedir(), '.dsh/.credentials.yaml'), 'utf8')
  // Deliberately a narrow parse rather than a YAML dependency: this is one key
  // on one line, and pulling in a parser for it would be the tail wagging the dog.
  // The leading-indent tolerance matters — the store nests these under `refs:`.
  const match = /^\s*(ONEGW_API_KEY|ONEGE_API_KEY):\s*(\S+)\s*$/m.exec(raw)
  if (match?.[2] === undefined) {
    throw new Error(
      'no gateway key: set ONEGW_API_KEY (or ONEGE_API_KEY) in the environment, '
      + 'or add it to ~/.dsh/.credentials.yaml',
    )
  }
  return match[2]
}

/** Main. */
async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const parsed = parseArgs(argv)
  if (parsed === 'help') {
    process.stdout.write(USAGE)
    return 0
  }
  let options = parsed

  const cwd = process.cwd()

  // `--init` writes the starter and exits: it must not need a goal, a gateway
  // key, or a reachable model, because the point is to run it in a repo you
  // have not configured yet.
  if (options.init) {
    const root = resolve(cwd, options.root)
    const path = resolve(root, PROJECT_CONFIG_PATH)
    if (existsSync(path)) {
      process.stderr.write(`already exists: ${path}\n`)
      return 2
    }
    mkdirSync(resolve(root, '.feature-loop'), { recursive: true })
    writeFileSync(path, CONFIG_TEMPLATE)
    process.stdout.write(`wrote ${path}\n\nEdit the verify command to match this repo, then:\n  dshloop . "<what you want built>"\n`)
    return 0
  }

  // The root is needed before the config merge (the project layer lives under
  // it), so the positional root is honoured first and `--config` can still name
  // a file anywhere.
  const hintedRoot = resolve(cwd, options.root)
  if (!existsSync(hintedRoot)) {
    process.stderr.write(`fatal: root does not exist: ${hintedRoot}\n`)
    return 2
  }
  if (!statSync(hintedRoot).isDirectory()) {
    process.stderr.write(`fatal: root is not a directory: ${hintedRoot}\n`)
    return 2
  }

  const layer = flagLayer(options, argv)
  let loaded
  try {
    loaded = loadConfig({
      root: hintedRoot,
      explicit: options.configPath,
      overrides: layer.overrides,
      cwd,
    })
    options = applyConfig(options, validateConfig(loaded.config), argv)
  } catch (error: unknown) {
    process.stderr.write(`\nfatal: ${error instanceof Error ? error.message : String(error)}\n`)
    return 2
  }

  if (options.goal.trim() === '') {
    process.stderr.write(
      `\nfatal: no goal given.\n\n  dshloop [root] "<what you want built>"\n`
      + `  dshloop . "add an exported add(a,b) and make the tests pass"\n\n`
      + `Set it in ${resolve(hintedRoot, PROJECT_CONFIG_PATH)} (goal:) to make it the default here.\n`,
    )
    return 2
  }

  const baseURL = process.env.ONEGE_BASE_URL ?? 'http://127.0.0.1:8080/v1'
  const apiKey = await resolveApiKey()
  const root = resolve(cwd, options.root)
  const configured = loopSpec(options)
  const historyPath = options.history ?? defaultHistoryPath()

  // Derived before the banner, so what is printed is the ceiling the run will
  // actually use rather than the flag it started from.
  const plan = options.derive
    ? planEnvelope({
        historyPath,
        goal: configured.goal,
        spec: configured,
        pinned: { maxSteps: options.maxStepsPinned, costBudgetUSD: options.budgetPinned },
        root,
      })
    : undefined
  const spec = plan?.spec ?? configured
  // The task key is the goal's hash and the goal is never rewritten by an
  // envelope, so one call serves both the plan and the record.
  const taskKey = taskKeyOf(spec.goal)
  // Fingerprinted BEFORE the envelope is applied, and deliberately: the record
  // already carries the ceilings that were enforced (`maxSteps`, `budgetUSD`),
  // while the fingerprint is what groups a task's runs so a derivation has a
  // history to read at all. Fingerprinting the derived ceilings would move the
  // group every time the derivation moved a ceiling — the history would split
  // into one-record groups, every envelope would be provisional forever, and
  // the loop could never learn from itself.
  const fingerprint = specFingerprint(configured)

  const { judge, label: judgeLabel } = buildJudge(options, apiKey, baseURL)

  process.stdout.write(`dshloop\n`)
  process.stdout.write(`  sandbox   ${root}\n`)
  process.stdout.write(`  goal      ${spec.goal}\n`)
  process.stdout.write(`  phase     ${options.phase}\n`)
  process.stdout.write(`  model     ${effectiveRoute(options).fullID}\n`)
  process.stdout.write(`  judge     ${judgeLabel}\n`)
  process.stdout.write(`  ceilings  ${String(spec.maxSteps)} steps, $${spec.costBudgetUSD.toFixed(2)}\n`)
  process.stdout.write(`  verify    ${options.verify}\n`)
  process.stdout.write(`  config    ${describeSources(loaded.sources)}\n`)
  process.stdout.write(`  history   ${historyPath}\n`)
  if (plan !== undefined) {
    process.stdout.write(`\n  envelope (${plan.records.length} recorded run(s) for this goal)\n`)
    for (const line of plan.provenance) process.stdout.write(`    · ${line}\n`)
  }
  process.stdout.write('\n')

  const tools = createTools({ root })
  const llm = createOnegwClient({ baseURL, apiKey })
  // The questioner closes the LLM→Laya→LLM loop: the actor's reasoning goes
  // to Laya as authored questions, Laya's levels come back as the judge
  // score. Same metered client as the actor — the questioner costs a chat
  // call per judged step, which is why it only runs where the judge runs
  // (detectors fired, or attention budget remaining).
  const questioner = options.judge === 'none'
    ? undefined
    : async (
      reasoning: string,
      signals: readonly ReviewSignal[],
      fallback: () => { state: string, questions: Record<string, SystemOneQuestion> },
    ) => authorQuestions(
      { llm, model: effectiveRoute(options).fullID },
      { reasoning, goal: spec.goal, signals },
      fallback,
    )

  /** Run the success command in the sandbox. Its exit code is the only verdict. */
  const checkSuccess = async (): Promise<{ ok: boolean, output: string }> => {
    try {
      const { stdout, stderr } = await run(options.verify, { cwd: root, timeout: 120_000 })
      return { ok: true, output: `${stdout}${stderr}`.trim() || 'verify exited 0' }
    } catch (error: unknown) {
      const e = error as { stdout?: string, stderr?: string, message?: string }
      const output = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || e.message || 'verify failed'
      return { ok: false, output }
    }
  }

  let asked = 0
  const onReview = (request: ReviewRequest): Promise<{ kind: 'continue' }> => {
    asked += 1
    process.stdout.write(
      `\n  ⚠ REVIEW ${String(asked)} · step ${String(request.step)} · ${request.decision.source}\n`
      + `    ${request.decision.reason}\n`
      + `    pending: ${request.pending}\n`
      + `    ${options.auto ? '(auto mode: continuing)' : '(no interactive handler: continuing)'}\n\n`,
    )
    return Promise.resolve({ kind: 'continue' })
  }

  // Preflight the success command. Two failures are worth catching here rather
  // than at step 12, because both waste an entire run: a verify command that
  // cannot even start (a path resolved against the wrong directory), and a
  // verify command that already passes (nothing to fix, so the run proves
  // nothing). Neither costs a model call to detect.
  const preflight = await checkSuccess()
  if (!preflight.ok && /no such file|command not found|not found|cannot find/i.test(preflight.output)) {
    process.stderr.write(
      `\nfatal: the verify command could not run.\n`
      + `  command: ${options.verify}\n`
      + `  cwd:     ${root}\n`
      + `  output:  ${preflight.output.trim()}\n\n`
      + `The command is resolved relative to --root, the same place the loop's tools run. `
      + `If --root is "demo", use --verify "bash verify.sh", not "bash demo/verify.sh".\n`,
    )
    return 2
  }
  if (preflight.ok) {
    process.stderr.write(
      `\nfatal: the verify command already passes, so there is nothing for the loop to fix.\n`
      + `  command: ${options.verify}\n`
      + `  output:  ${preflight.output.trim().slice(0, 400)}\n\n`
      + `A run against an already-passing target proves nothing about the loop.\n`,
    )
    return 2
  }
  process.stdout.write(`  preflight verify failing as expected — the loop has real work\n\n`)

  // One entry point for one pass or many: with no `--loops`, `runRefined`
  // runs `runLoop` exactly once — the flag and the refinement share the code,
  // so they cannot disagree about what a pass means.
  const result = await runRefined({
    spec,
    phase: phaseOf(options.phase),
    tools,
    llm,
    judge,
    questioner,
    router: { reviewBudget: options.reviewBudget },
    onReview,
    checkSuccess,
    maxTokensPerStep: options.maxTokens,
    ...options.loops === undefined ? {} : { loops: options.loops },
    // Every run records itself, whether or not --derive asked for a derivation:
    // a run whose evidence is thrown away is a run nobody can learn from, and
    // the file is the only thing that makes the next derivation possible.
    historyPath,
    taskKey,
    specFingerprint: fingerprint,
    onEvent: options.quiet
      ? undefined
      : (event) => {
        // Only the interesting events go to the live stream; the full transcript
        // is rendered once at the end.
        if (event.kind === 'tool') {
          process.stdout.write(`    [tool] ${event.tool} ${event.ok ? 'ok' : 'FAILED'} — ${event.preview.slice(0, 90)}\n`)
        } else if (event.kind === 'signals') {
          for (const s of event.signals) process.stdout.write(`    [signal:${s.severity}] ${s.kind} — ${s.detail}\n`)
        } else if (event.kind === 'budget' && event.level === 'warn') {
          process.stdout.write(`    [budget] ${event.reason}\n`)
        } else if (event.kind === 'route') {
          process.stdout.write(`    [route] escalated → ${event.route}\n`)
        }
      },
  })

  if (!options.quiet) {
    process.stdout.write(`\n${'─'.repeat(72)}\ntranscript\n${'─'.repeat(72)}\n`)
    process.stdout.write(`${renderTranscript(result.transcript)}\n`)
  }

  process.stdout.write(`\n${'─'.repeat(72)}\nresult\n${'─'.repeat(72)}\n`)
  process.stdout.write(`  outcome        ${result.outcome}\n`)
  process.stdout.write(`  steps          ${String(result.steps)} of ${String(options.maxSteps)}\n`)
  process.stdout.write(`  cost           $${result.spentUSD.toFixed(6)} of $${options.budgetUSD.toFixed(2)}\n`)
  process.stdout.write(`  human reviews  ${String(result.reviews)} (${(result.reviewFraction * 100).toFixed(0)}% of steps)\n`)
  process.stdout.write(`  signals        ${result.signals.length === 0 ? 'none' : [...new Set(result.signals.map(s => s.kind))].join(', ')}\n`)
  if (result.passes > 1) {
    process.stdout.write(`  passes         ${String(result.passes)}${result.stoppedEarly ? ` (stopped early: ${result.stopReason})` : ''}\n`)
  }

  // The advisory reads the file again rather than the in-memory result: the
  // record this run just appended belongs in its own metric roll-up, and the
  // roll-up is over *this goal's* runs, which is what the envelope is about.
  // Proposals cost one judge battery, so they are printed only when the
  // operator asked for derivation — the flag that means "show me the numbers".
  if (options.derive) {
    const all = readRecords(historyPath)
    const mine = recordsForTask(all.records, taskKey)
    const advisory = await advisoryFor({ records: mine, malformed: all.malformed, spec, judge })
    const m = advisory.metrics
    process.stdout.write(`\n${'─'.repeat(72)}\nmetrics (${String(m.runs)} recorded run(s) of this goal${m.provisional ? ', provisional' : ''})\n${'─'.repeat(72)}\n`)
    process.stdout.write(`  goal-met rate  ${(m.quality.goalMetRate * 100).toFixed(0)}% first-pass ${(m.quality.firstPassRate * 100).toFixed(0)}%\n`)
    process.stdout.write(`  steps          p50 ${String(m.speed.steps.p50)} · p95 ${String(m.speed.steps.p95)}\n`)
    if (m.cost.unpricedSteps > 0) {
      // The honest reading, never $0.00: a budget that reads low invites the
      // next run to keep going.
      process.stdout.write(`  cost           unknown — ${String(m.cost.unpricedSteps)} step(s) reported no usage\n`)
    } else {
      process.stdout.write(`  cost           p50 $${m.cost.perRun.p50.toFixed(4)} · p95 $${m.cost.perRun.p95.toFixed(4)}\n`)
    }
    if (m.quality.meanJudge !== undefined) {
      process.stdout.write(`  mean judge     ${m.quality.meanJudge.toFixed(2)} of 3\n`)
    }
    process.stdout.write(`  human reviews  ${(m.quality.reviewFraction * 100).toFixed(0)}% of steps\n`)
    for (const alert of m.alerts) process.stdout.write(`  ⚠ ${alert.severity} ${alert.kind}: ${alert.detail}\n`)

    process.stdout.write(`\n  optimizations${advisory.unavailable === undefined ? '' : ` (unavailable: ${advisory.unavailable})`}\n`)
    if (advisory.recommendations.length === 0 && advisory.unavailable === undefined) {
      process.stdout.write(`    · none proposed\n`)
    }
    for (const r of advisory.recommendations) {
      process.stdout.write(`    · [${r.lever}] ${r.current} → ${r.proposed}\n`)
      process.stdout.write(`      ${r.evidence}${r.confidence === undefined ? '' : ` (confidence ${r.confidence.toFixed(2)})`}\n`)
    }
  }

  return result.outcome === 'goal-met' ? 0 : 1
}

main().then(
  code => { process.exitCode = code },
  (error: unknown) => {
    process.stderr.write(`\nfatal: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 2
  },
)
