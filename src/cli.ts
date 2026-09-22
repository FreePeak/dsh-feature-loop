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
import { promisify } from 'node:util'
import { resolve } from 'node:path'

import { createTools } from './tools.ts'
import { createOnegwClient } from './llm.ts'
import { createChatJudge } from './judge.ts'
import { OnegwJudge, NO_JUDGE } from './laya.ts'
import type { Judge } from './laya.ts'
import { runLoop, renderTranscript } from './runner.ts'
import type { ReviewRequest } from './runner.ts'
import { phaseOf } from './prompts.ts'
import type { LoopSpec } from './spec.ts'

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
  reviewBudget: number
  auto: boolean
  maxTokens: number
  quiet: boolean
}

const USAGE = `dsh-feature-loop — run the loop against a repository

  --root <dir>        sandbox root the loop may edit          (default: demo)
  --verify <cmd>      success command, run with the root as   (default: bash verify.sh)
                      its working directory; exit 0 = done
  --goal <text>       what "done" means, observably
  --phase <name>      bugfix | feature | refactor             (default: bugfix)
  --model <id>        full gateway model id                   (default: xiaomi/mimo-v2.5)
  --provider <name>   route prefix when --model has none      (default: xiaomi)
  --budget <usd>      cost ceiling for the run                (default: 1.00)
  --max-steps <n>     step ceiling for the run                (default: 15)
  --judge <kind>      none | chat | laya                      (default: chat)
  --judge-model <id>  model the chat judge uses               (default: xiaomi/mimo-v2.5)
  --review-budget <f> fraction of steps a human may be asked  (default: 0.10)
  --max-tokens <n>    per-step output cap                     (default: 4096)
  --auto              never block on a human (CI/demo mode)
  --quiet             suppress the per-step narration
  -h, --help          this text

The verify command is resolved relative to --root, not to your shell: it runs
INSIDE the sandbox, the same place the loop's tools run. Passing "demo/verify.sh"
while --root is "demo" would look for demo/demo/verify.sh.
`

/** Parse argv into options, rejecting unknown flags loudly. */
function parseArgs(argv: string[]): Options | 'help' {
  const options: Options = {
    root: 'demo',
    verify: 'bash verify.sh',
    goal: '',
    phase: 'bugfix',
    model: 'xiaomi/mimo-v2.5',
    provider: 'xiaomi',
    budgetUSD: 1.0,
    maxSteps: 15,
    judge: 'chat',
    judgeModel: 'xiaomi/mimo-v2.5',
    reviewBudget: 0.1,
    auto: false,
    maxTokens: 4096,
    quiet: false,
  }
  const value = (i: number, flag: string): string => {
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) throw new Error(`${flag} needs a value`)
    return v
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    switch (arg) {
      case '-h': case '--help': return 'help'
      case '--root': options.root = value(i, arg); i += 1; break
      case '--verify': options.verify = value(i, arg); i += 1; break
      case '--goal': options.goal = value(i, arg); i += 1; break
      case '--phase': options.phase = value(i, arg) as Options['phase']; i += 1; break
      case '--model': options.model = value(i, arg); i += 1; break
      case '--provider': options.provider = value(i, arg); i += 1; break
      case '--budget': options.budgetUSD = Number(value(i, arg)); i += 1; break
      case '--max-steps': options.maxSteps = Number(value(i, arg)); i += 1; break
      case '--judge': options.judge = value(i, arg) as Options['judge']; i += 1; break
      case '--judge-model': options.judgeModel = value(i, arg); i += 1; break
      case '--review-budget': options.reviewBudget = Number(value(i, arg)); i += 1; break
      case '--max-tokens': options.maxTokens = Number(value(i, arg)); i += 1; break
      case '--auto': options.auto = true; break
      case '--quiet': options.quiet = true; break
      default: throw new Error(`unknown flag "${arg}"`)
    }
  }
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
function demoSpec(options: Options): LoopSpec {
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
      judge: new OnegwJudge({ baseURL, model: 'laya', timeoutMs: 3000 }),
      label: 'laya (local, via onegw /v1/systemone)',
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
  const parsed = parseArgs(process.argv.slice(2))
  if (parsed === 'help') {
    process.stdout.write(USAGE)
    return 0
  }
  const options = parsed

  const baseURL = process.env.ONEGE_BASE_URL ?? 'http://127.0.0.1:8080/v1'
  const apiKey = await resolveApiKey()
  const root = resolve(process.cwd(), options.root)
  const spec = demoSpec(options)
  const { judge, label: judgeLabel } = buildJudge(options, apiKey, baseURL)

  process.stdout.write(`dsh-feature-loop demo\n`)
  process.stdout.write(`  sandbox   ${root}\n`)
  process.stdout.write(`  model     ${effectiveRoute(options).fullID}\n`)
  process.stdout.write(`  judge     ${judgeLabel}\n`)
  process.stdout.write(`  ceilings  ${String(options.maxSteps)} steps, $${options.budgetUSD.toFixed(2)}\n`)
  process.stdout.write(`  verify    ${options.verify}\n\n`)

  const tools = createTools({ root })
  const llm = createOnegwClient({ baseURL, apiKey })

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

  const result = await runLoop({
    spec,
    phase: phaseOf(options.phase),
    tools,
    llm,
    judge,
    router: { reviewBudget: options.reviewBudget },
    onReview,
    checkSuccess,
    maxTokensPerStep: options.maxTokens,
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

  return result.outcome === 'goal-met' ? 0 : 1
}

main().then(
  code => { process.exitCode = code },
  (error: unknown) => {
    process.stderr.write(`\nfatal: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 2
  },
)
