/**
 * One config file, two front doors.
 *
 * The same YAML drives the `dshloop` CLI and the DSH plugin, so an operator who
 * tuned a budget in the terminal does not have to find a second place to say
 * the same thing in the GUI. The CLI reads it with `loadConfig`; the plugin
 * reads the *same shapes* on its patch row, with `configFromPluginRow`.
 *
 * **Precedence, lowest to highest:** built-in defaults → user file → project
 * file → explicit `--config` file → CLI flags. A flag is a statement about
 * *this* invocation and outranks a file; a project file is a statement about
 * this repo and outranks the user's general preference. Every layer is merged
 * shallowly at the block level (`dashboard`, `optimize`) so a project that sets
 * only `optimize.history` keeps the user's `optimize.judge`.
 *
 * **Where files live.** `dshloop` looks for `.feature-loop/config.yaml` under
 * the target root, then `~/.config/dshloop/config.yaml`, then
 * `~/.dsh/feature-loop.yaml`. The project file is resolved against the *repo
 * being worked on*, not the caller's cwd, so `dshloop ~/src/app "…"` picks up
 * that repo's config rather than whatever directory you happened to be in.
 *
 * **YAML or JSON.** Both parse: the `yaml` package accepts JSON, which is a
 * subset of its grammar, so there is exactly one code path and one error style.
 * `dshloop --init` writes a commented YAML starter.
 *
 * @module dshloop/config
 */

import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

import { parseDashboardConfig } from './dashboard.ts'
import type { DashboardConfig } from './dashboard.ts'
import { parseOptimizeConfig } from './spec.ts'
import type { OptimizeConfig } from './spec.ts'

/** First-class name for the loop's phases, re-declared so config owns its surface. */
export type Phase = 'bugfix' | 'feature' | 'refactor'

/** Which judge backend scores review-worthiness. */
export type JudgeKind = 'none' | 'chat' | 'laya'

/** How a gate-raised review reaches a human. */
export type GateMode = 'ask' | 'deny'

/**
 * The config file's contents. Every field is optional: a file with one line is
 * a valid file, and everything it omits falls through to the layer below.
 *
 * Field names match the CLI's long flags one-for-one (`budgetUSD` ↔ `--budget`)
 * so the two are readable together rather than being two vocabularies for the
 * same knob.
 */
export interface FeatureLoopConfig {
  // ── the run ──────────────────────────────────────────────────────────────
  /** Sandbox root the loop may edit. Relative paths resolve against the config file. */
  root?: string
  /** What "done" means, observably. The positional goal argument wins over this. */
  goal?: string
  /** Success command, run with `root` as its working directory. Exit 0 = done. */
  verify?: string
  /** Phase prompt: `bugfix` | `feature` | `refactor`. */
  phase?: Phase

  // ── models and ceilings ──────────────────────────────────────────────────
  /** Full gateway model id, e.g. `xiaomi/mimo-v2.5`. */
  model?: string
  /** Route prefix when `model` has no `/`. */
  provider?: string
  /** Cost ceiling in USD for one run. */
  budgetUSD?: number
  /** Step ceiling for one run. */
  maxSteps?: number
  /** Per-step output cap. */
  maxTokens?: number
  /** Fraction of steps a human may be asked about, in (0, 1]. */
  reviewBudget?: number
  /** Refinement passes, integer 3–10. */
  loops?: number
  /** Derive this run's ceilings from recorded history. */
  derive?: boolean
  /** Run-history file. Defaults to `.feature-loop/runs.jsonl` under the invoking dir. */
  history?: string

  // ── the judge ────────────────────────────────────────────────────────────
  /** `none` (detectors only) | `chat` (metered) | `laya` (local, free). */
  judge?: JudgeKind
  /**
   * System One provider base URL — Laya, or hosted Jev/TypeSafe on the same
   * wire. Changing only this field is what swaps providers.
   */
  judgeBaseURL?: string
  /** Model alias the System One provider routes to (`laya`, a hosted Jev id, …). */
  systemOneModel?: string
  /** Model the `chat` judge uses. */
  judgeModel?: string
  /** Judge score (0–3) that earns a human look. */
  judgeThreshold?: number
  /** Deadline for one judge call, in ms. */
  judgeTimeoutMs?: number

  // ── the gate ─────────────────────────────────────────────────────────────
  /** How a gate-raised review reaches a human. */
  gateMode?: GateMode
  /** Per-tool gate overrides, by *harness* tool name (`read`, `edit`, …). */
  gatePolicies?: Record<string, 'auto' | 'auto-if-confident' | 'always-approve'>
  /** Confidence bar for `auto-if-confident`, in [0, 1]. */
  confidenceThreshold?: number

  // ── the dashboard ────────────────────────────────────────────────────────
  /** The HITL approval dashboard's block. */
  dashboard?: DashboardConfig

  // ── recording ────────────────────────────────────────────────────────────
  /** The optimization block (loops, derive, history, judge, totalBudgetUSD). */
  optimize?: OptimizeConfig

  // ── CLI behaviour (ignored by the plugin) ────────────────────────────────
  /** Never block on a human (CI/demo mode). */
  auto?: boolean
  /** Suppress per-step narration. */
  quiet?: boolean
}

/** Where a layer came from, for the one-line provenance report. */
export interface ConfigSource {
  kind: 'flag' | 'explicit' | 'project' | 'user' | 'default'
  path?: string
}

/** A loaded config plus where each of its layers was found. */
export interface LoadedConfig {
  config: FeatureLoopConfig
  /** Layers that existed and were merged, lowest precedence first. */
  sources: ConfigSource[]
}

/** Built-in defaults, the bottom of the ladder. */
export const DEFAULT_CONFIG: Readonly<Required<Pick<FeatureLoopConfig,
  'verify' | 'phase' | 'model' | 'provider' | 'budgetUSD' | 'maxSteps' | 'maxTokens'
  | 'reviewBudget' | 'judge' | 'judgeThreshold' | 'judgeTimeoutMs' | 'gateMode'>>> = {
  verify: 'bash verify.sh',
  phase: 'feature',
  model: 'xiaomi/mimo-v2.5',
  provider: 'xiaomi',
  budgetUSD: 1.0,
  maxSteps: 15,
  maxTokens: 4096,
  reviewBudget: 0.1,
  judge: 'laya',
  judgeThreshold: 2,
  judgeTimeoutMs: 5_000,
  gateMode: 'ask',
}

/** The default System One endpoint — the shared Laya sidecar on this machine. */
export const DEFAULT_JUDGE_BASE_URL = 'http://127.0.0.1:8091'

/** The default System One model alias. */
export const DEFAULT_SYSTEMONE_MODEL = 'laya'

/** The project-local filename, relative to the target root. */
export const PROJECT_CONFIG_PATH = join('.feature-loop', 'config.yaml')

/**
 * Candidate user-level config paths, in precedence order (last wins because
 * merges are applied in array order and later layers overwrite earlier ones).
 */
export function userConfigPaths(): string[] {
  const home = homedir()
  const xdg = process.env.XDG_CONFIG_HOME
  return [
    join(xdg !== undefined && xdg !== '' ? xdg : join(home, '.config'), 'dshloop', 'config.yaml'),
    join(home, '.dsh', 'feature-loop.yaml'),
  ]
}

/** Resolve `~` and make a config path absolute against a base directory. */
function resolveSpecified(path: string, base: string): string {
  const expanded = path.startsWith('~/') ? join(homedir(), path.slice(2)) : path
  return isAbsolute(expanded) ? expanded : resolve(base, expanded)
}

/**
 * Read one config file.
 *
 * @param path - the file to read.
 * @returns the parsed mapping, or `undefined` when the file does not exist.
 * @throws SyntaxError naming the file when it is unreadable or not a mapping —
 *   a config file that silently parses to nothing is worse than one that fails.
 */
export function readConfigFile(path: string): FeatureLoopConfig | undefined {
  if (!existsSync(path)) return undefined
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch (error: unknown) {
    throw new SyntaxError(`cannot read config ${path}: ${(error as Error).message}`)
  }
  if (text.trim() === '') return {}
  let parsed: unknown
  try {
    // `yaml.parse` also parses JSON, so one path serves both formats.
    parsed = parseYaml(text)
  } catch (error: unknown) {
    throw new SyntaxError(`invalid YAML in ${path}: ${(error as Error).message}`)
  }
  if (parsed === null || parsed === undefined) return {}
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SyntaxError(
      `config ${path} must be a mapping of options at the top level, received ${Array.isArray(parsed) ? 'a list' : typeof parsed}`,
    )
  }
  return parsed as FeatureLoopConfig
}

/**
 * Merge config layers, later winning.
 *
 * Blocks with nested configruation (`dashboard`, `optimize`) merge *shallowly
 * per block* rather than being replaced wholesale: a project file that only
 * wants to change `dashboard.port` must not silently drop the user's
 * `dashboard.brief`. Scalars and arrays are replaced — an array merged
 * element-wise would be a different list than either author wrote.
 *
 * @param layers - the layers, lowest precedence first. `undefined` is skipped.
 * @returns the merged config. The inputs are never mutated.
 */
export function mergeConfig(...layers: (FeatureLoopConfig | undefined)[]): FeatureLoopConfig {
  const out: FeatureLoopConfig = {}
  for (const layer of layers) {
    if (layer === undefined) continue
    for (const [key, value] of Object.entries(layer) as [keyof FeatureLoopConfig, unknown][]) {
      if (value === undefined) continue
      const existing = out[key]
      const mergeable = (key === 'dashboard' || key === 'optimize' || key === 'gatePolicies')
        && typeof existing === 'object' && existing !== null && !Array.isArray(existing)
        && typeof value === 'object' && value !== null && !Array.isArray(value)
      if (mergeable) {
        out[key] = { ...(existing as object), ...(value as object) } as never
      } else {
        out[key] = value as never
      }
    }
  }
  return out
}

/**
 * Load and merge every config layer for one run.
 *
 * Precedence: defaults → user → project (under `root`) → explicit `--config` →
 * `overrides` (the CLI flags). The project layer is resolved against `root`, so
 * the repo being worked on supplies its own config regardless of the caller's
 * working directory.
 *
 * @param options - the target root, an explicit config path, and flag overrides.
 * @returns the merged config and the layers that were actually found.
 * @throws SyntaxError when a file exists but cannot be parsed.
 */
export function loadConfig(options: {
  /** The sandbox root; its `.feature-loop/config.yaml` is the project layer. */
  root?: string
  /** An explicit `--config` path — outranks both implicit files. */
  explicit?: string
  /** Flag-derived overrides, the highest precedence. */
  overrides?: FeatureLoopConfig
  /** Base directory for resolving `explicit`. Defaults to cwd. */
  cwd?: string
}): LoadedConfig {
  const cwd = options.cwd ?? process.cwd()
  const sources: ConfigSource[] = []
  const layers: (FeatureLoopConfig | undefined)[] = []

  for (const path of userConfigPaths()) {
    const found = readConfigFile(path)
    if (found !== undefined) {
      layers.push(found)
      sources.push({ kind: 'user', path })
    }
  }

  if (options.root !== undefined) {
    const path = resolve(options.root, PROJECT_CONFIG_PATH)
    const found = readConfigFile(path)
    if (found !== undefined) {
      layers.push(found)
      sources.push({ kind: 'project', path })
    }
  }

  if (options.explicit !== undefined) {
    const path = resolveSpecified(options.explicit, cwd)
    const found = readConfigFile(path)
    if (found === undefined) {
      throw new SyntaxError(`--config ${options.explicit} does not exist (resolved to ${path})`)
    }
    layers.push(found)
    sources.push({ kind: 'explicit', path })
  }

  if (options.overrides !== undefined) {
    layers.push(options.overrides)
    sources.push({ kind: 'flag' })
  }

  const config = mergeConfig(DEFAULT_CONFIG as FeatureLoopConfig, ...layers)

  // A `root` written in a file is relative to the *repo that file configures*,
  // which is the directory holding `.feature-loop/` — not the `.feature-loop/`
  // directory itself, and not the caller's cwd. That is the only reading under
  // which `root: ./sub` means the same thing in every checkout.
  if (config.root !== undefined) {
    const owner = [...sources].reverse().find((s) => s.kind !== 'flag' && s.path !== undefined)
    const base = owner?.path !== undefined ? dirnameOf(owner.path) : cwd
    const repoBase = base.endsWith('/.feature-loop') ? dirnameOf(base) : base
    config.root = resolveSpecified(config.root, repoBase)
  }

  return { config, sources }
}

/** Directory of a file path, without importing `dirname` twice. */
function dirnameOf(path: string): string {
  const cut = path.lastIndexOf('/')
  return cut <= 0 ? '/' : path.slice(0, cut)
}

/**
 * One line naming where the config came from, for the CLI banner.
 *
 * @param sources - the layers {@link loadConfig} found.
 * @returns a human-readable summary, or a note that only defaults applied.
 */
export function describeSources(sources: ConfigSource[]): string {
  const files = sources.filter((s) => s.path !== undefined).map((s) => `${s.kind}:${s.path}`)
  const flags = sources.some((s) => s.kind === 'flag')
  if (files.length === 0) return flags ? 'defaults + flags' : 'defaults only'
  return `${files.join(', ')}${flags ? ' + flags' : ''}`
}

/**
 * Reject a config that cannot describe a run.
 *
 * Runs after merging, so it sees the effective values a caller will actually
 * use — a bad file layer that a flag repaired is not an error.
 *
 * @param config - the merged config.
 * @returns the same config, for chaining.
 * @throws TypeError naming the field and the accepted values.
 */
export function validateConfig(config: FeatureLoopConfig): FeatureLoopConfig {
  if (config.phase !== undefined && !['bugfix', 'feature', 'refactor'].includes(config.phase)) {
    throw new TypeError(`phase must be "bugfix", "feature" or "refactor", received ${JSON.stringify(config.phase)}`)
  }
  if (config.judge !== undefined && !['none', 'chat', 'laya'].includes(config.judge)) {
    throw new TypeError(`judge must be "none", "chat" or "laya", received ${JSON.stringify(config.judge)}`)
  }
  if (config.gateMode !== undefined && !['ask', 'deny'].includes(config.gateMode)) {
    throw new TypeError(`gateMode must be "ask" or "deny", received ${JSON.stringify(config.gateMode)}`)
  }
  for (const field of ['budgetUSD', 'maxSteps', 'maxTokens', 'reviewBudget', 'judgeThreshold', 'judgeTimeoutMs', 'loops'] as const) {
    const value = config[field]
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new TypeError(`${field} must be a finite number, received ${JSON.stringify(value)}`)
    }
  }
  if (config.budgetUSD !== undefined && config.budgetUSD <= 0) {
    throw new TypeError(`budgetUSD must be > 0, received ${String(config.budgetUSD)} — an unlimited budget is not a budget`)
  }
  if (config.maxSteps !== undefined && (!Number.isInteger(config.maxSteps) || config.maxSteps < 1)) {
    throw new TypeError(`maxSteps must be a positive integer, received ${String(config.maxSteps)}`)
  }
  if (config.reviewBudget !== undefined && (config.reviewBudget <= 0 || config.reviewBudget > 1)) {
    throw new TypeError(`reviewBudget is a fraction of steps in (0, 1], received ${String(config.reviewBudget)}`)
  }
  // Reuse the plugin's own validators so the file layer cannot accept a block
  // the plugin would reject at load — one definition of each block's rules.
  if (config.dashboard !== undefined) parseDashboardConfig(config.dashboard)
  if (config.optimize !== undefined) parseOptimizeConfig(config.optimize)
  return config
}

/**
 * Translate a config file's contents onto the plugin's patch-row `config:`.
 *
 * The plugin's row is a projection of the same file: the CLI-only keys
 * (`auto`, `quiet`, `root`, `verify`, `goal`) are dropped because the plugin
 * has no use for them — the DSH session supplies its own workspace and the
 * human supplies the goal by typing. Everything else carries over, including
 * `optimize.judge` so a file that asked for Laya gets Laya on both surfaces.
 *
 * @param config - a merged config file.
 * @returns the equivalent plugin row config.
 */
export function configFromPluginRow(config: FeatureLoopConfig): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (config.dashboard !== undefined) row.dashboard = config.dashboard
  if (config.optimize !== undefined) row.optimize = config.optimize
  if (config.gateMode !== undefined) row.gateMode = config.gateMode
  if (config.gatePolicies !== undefined) row.gatePolicies = config.gatePolicies
  if (config.confidenceThreshold !== undefined) row.confidenceThreshold = config.confidenceThreshold
  if (config.reviewBudget !== undefined) row.reviewBudget = config.reviewBudget
  if (config.judgeThreshold !== undefined) row.judgeThreshold = config.judgeThreshold
  if (config.judge !== undefined) row.judge = config.judge
  if (config.judgeBaseURL !== undefined) row.judgeBaseURL = config.judgeBaseURL
  if (config.systemOneModel !== undefined) row.systemOneModel = config.systemOneModel
  return row
}

/**
 * The commented starter file `dshloop --init` writes.
 *
 * Kept as a template string rather than a shipped example file so the text and
 * the defaults in {@link DEFAULT_CONFIG} live in one place; a starter that
 * drifts from the code's defaults is a starter that teaches wrong values.
 */
export const CONFIG_TEMPLATE = `# .feature-loop/config.yaml — dshloop's config for this repository.
# Every key is optional; anything omitted uses the default shown in the comment.
# Command-line flags override this file. A user-level file at
# ~/.config/dshloop/config.yaml applies to every repo unless overridden here.

# ── the run ─────────────────────────────────────────────────────────────────
# goal: ""                        # what "done" means; the CLI argument wins
verify: "bash verify.sh"          # exit 0 = done. Set this to YOUR test command.
phase: feature                    # bugfix | feature | refactor

# ── models and ceilings ─────────────────────────────────────────────────────
# model: xiaomi/mimo-v2.5         # full gateway model id
budgetUSD: 1.00                   # cost ceiling for one run
maxSteps: 15                      # step ceiling for one run
reviewBudget: 0.10                # ask a human about <10% of steps

# ── the judge ───────────────────────────────────────────────────────────────
# none = detectors only | chat = metered | laya = local, free (default)
judge: laya
judgeBaseURL: http://127.0.0.1:8091   # Laya, or hosted Jev/TypeSafe (same wire)
systemOneModel: laya
# judgeThreshold: 2               # judge score 0-3 that earns a human look.
                                  # Laya's live scores sit ~0.5-1.4, so 2 means
                                  # the advisor rarely fires on its own; set
                                  # ~1.0 to have it open reviews itself.

# ── the gate ────────────────────────────────────────────────────────────────
gateMode: ask                     # ask = prompt a human | deny = refuse in CI
# gatePolicies:                   # per-tool overrides, by HARNESS tool name
#   read: auto
#   edit: auto-if-confident
#   write: auto-if-confident

# ── the dashboard ───────────────────────────────────────────────────────────
# dashboard:
#   enabled: true
#   port: 8100
#   answers: true                 # false = observe only
`
