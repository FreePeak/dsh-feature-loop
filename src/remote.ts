/**
 * The feature-loop host remote: `ctx.remote.featureLoop.*` for the panel page.
 *
 * Cordis loads this module as a class plugin (row `feature-loop-remote` in the
 * bundle patch), mirroring `@deepseek-ai/dsh-plugin-manager` and `dsh-mux`.
 * Every marked method answers the client's `ctx.remote.featureLoop.<method>(…)`
 * call with the shared `Answer<T>` envelope — `{ ok: true, value }` /
 * `{ ok: false, error }`.
 *
 * **What this service can and cannot change.** It reports status and it edits
 * the plugin's own configuration, and it does so by writing the *user-level*
 * config file (`~/.config/dshloop/config.yaml`) — never the profile's
 * `cordis.patch.yml`. That is a deliberate boundary: the patch layer is shared,
 * hand-authored deployment configuration whose comments explain why each value
 * is what it is, and a settings page that rewrote it would silently delete that
 * reasoning. The file this service writes is the same one the `dshloop` CLI
 * reads, so a value set here takes effect on both surfaces at the next load.
 *
 * **Shape.** Every decision lives in an exported pure function; the cordis
 * class at the bottom only delegates. That is not decoration — the base class's
 * constructor requires a live cordis context, so anything left inside a method
 * is unreachable from a test without faking the framework. The repo's other
 * config surfaces (`parseDashboardConfig`, `validateSpec`) are testable for the
 * same reason.
 *
 * @module @freepeak/dsh-feature-loop/remote
 */

import type { Context } from '@deepseek-ai/cordis'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

/** Cordis plugin name (matches the patch row id). */
export const name = 'feature-loop-remote'

/** Health of the configured System One judge endpoint. */
export interface JudgeStatus {
  /** The kind the deployment configured: `none` | `chat` | `laya`. */
  kind: string
  /** The base URL in use (empty for `none`, which talks to nothing). */
  baseURL: string
  /** The model alias in use. */
  model: string
  /** Whether `/health` answered, when the endpoint was probed. */
  reachable: boolean
  /** The endpoint's own health payload, or the reason it did not answer. */
  detail: string
}

/** Everything the panel shows at a glance. */
export interface FeatureLoopStatus {
  /** The plugin row is loaded and its policies are on. */
  enabled: boolean
  /** Which config keys are currently in effect, for display. */
  config: Record<string, unknown>
  /** Where the writable config file lives. */
  configPath: string
  /** The judge, as configured and as far as a probe can tell. */
  judge: JudgeStatus
  /** The dashboard's URL when one was reported, else empty. */
  dashboardURL: string
}

/** The subset of config the settings page may write. */
export interface FeatureLoopSettings {
  judge?: 'none' | 'chat' | 'laya'
  judgeBaseURL?: string
  systemOneModel?: string
  judgeModel?: string
  judgeThreshold?: number
  reviewBudget?: number
  confidenceThreshold?: number
  gateMode?: 'ask' | 'deny'
  budgetUSD?: number
  maxSteps?: number
}

/** The keys {@link FeatureLoopSettings} actually exposes, in file order. */
const SETTINGS_KEYS: (keyof FeatureLoopSettings)[] = [
  'judge', 'judgeBaseURL', 'systemOneModel', 'judgeModel',
  'judgeThreshold', 'reviewBudget', 'confidenceThreshold',
  'gateMode', 'budgetUSD', 'maxSteps',
]

/** The numeric fields, so one loop validates all of them the same way. */
const NUMERIC_KEYS: (keyof FeatureLoopSettings)[] = [
  'judgeThreshold', 'reviewBudget', 'confidenceThreshold', 'budgetUSD', 'maxSteps',
]

/** Default System One endpoint — the shared Laya sidecar on this machine. */
const DEFAULT_JUDGE_BASE_URL = 'http://127.0.0.1:8091'

/** Default System One model alias. */
const DEFAULT_SYSTEMONE_MODEL = 'laya'

/**
 * Where the settings page writes.
 *
 * Resolved per call, not at module load, so a test can redirect
 * `XDG_CONFIG_HOME` into a temp directory — and so a long-lived harness process
 * picks up an env change rather than pinning the home directory it booted with.
 *
 * @returns the absolute path to the writable config file.
 */
export function settingsPath(): string {
  const xdg = process.env.XDG_CONFIG_HOME
  const base = xdg !== undefined && xdg !== '' ? xdg : join(homedir(), '.config')
  return join(base, 'dshloop', 'config.yaml')
}

/**
 * Read the settings file.
 *
 * A missing file is the normal first-run state and an unreadable or malformed
 * one is reported by the CLI's loader, which fails loudly with the field name.
 * Both return `{}` here on purpose: this feeds a *panel*, and a page that threw
 * on a bad file would leave the operator staring at a blank pane with no way to
 * see the path they need to fix.
 *
 * @param path - the file to read; defaults to {@link settingsPath}.
 * @returns the parsed mapping, or `{}`.
 */
export function readSettings(path: string = settingsPath()): Record<string, unknown> {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return {}
  }
  try {
    const parsed = parseYaml(text)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {}
  } catch {
    return {}
  }
}

/**
 * Validate an incoming settings patch, keeping only the exposed keys.
 *
 * Two jobs, both at the trust boundary: an unknown key is dropped rather than
 * written (the page is the only caller today, but a remote method is reachable
 * by anything holding the namespace), and a bad value throws naming the field
 * instead of reaching the file.
 *
 * @param settings - the caller's patch.
 * @returns a clean object containing only recognized, validated keys.
 * @throws Error naming the rejected field.
 */
export function validateSettings(settings: FeatureLoopSettings): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const key of SETTINGS_KEYS) {
    const value = settings[key]
    if (value === undefined) continue
    clean[key] = value
  }
  if (clean.judge !== undefined && !['none', 'chat', 'laya'].includes(String(clean.judge))) {
    throw new Error(`judge must be "none", "chat" or "laya", received ${JSON.stringify(clean.judge)}`)
  }
  if (clean.gateMode !== undefined && !['ask', 'deny'].includes(String(clean.gateMode))) {
    throw new Error(`gateMode must be "ask" or "deny", received ${JSON.stringify(clean.gateMode)}`)
  }
  for (const key of NUMERIC_KEYS) {
    const value = clean[key]
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new Error(`${key} must be a finite number, received ${JSON.stringify(value)}`)
    }
  }
  if (typeof clean.reviewBudget === 'number' && (clean.reviewBudget <= 0 || clean.reviewBudget > 1)) {
    throw new Error(`reviewBudget is a fraction of steps in (0, 1], received ${String(clean.reviewBudget)}`)
  }
  if (typeof clean.maxSteps === 'number' && (!Number.isInteger(clean.maxSteps) || clean.maxSteps < 1)) {
    throw new Error(`maxSteps must be a positive integer, received ${String(clean.maxSteps)}`)
  }
  return clean
}

/**
 * Merge a settings patch into the file's existing contents and write it.
 *
 * A merge, not a replace: a form that changed only the judge must not reset the
 * budget. Existing comments are not preserved — the `yaml` package returns
 * plain data — which is exactly why this writes the *user* file and never the
 * hand-authored patch layer, whose comments are its documentation.
 *
 * @param settings - the caller's patch.
 * @param path - the file to write; defaults to {@link settingsPath}.
 * @returns the values now in effect.
 * @throws Error naming the rejected field.
 */
export function saveSettings(
  settings: FeatureLoopSettings,
  path: string = settingsPath(),
): Record<string, unknown> {
  const clean = validateSettings(settings)
  const merged = { ...readSettings(path), ...clean }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    '# Written by the Feature Loop settings page.\n'
    + '# The dshloop CLI reads this same file, so a change here applies to both\n'
    + '# surfaces at the next plugin load.\n'
    + '# Project-level overrides live at <repo>/.feature-loop/config.yaml.\n'
    + stringifyYaml(merged),
  )
  return merged
}

/**
 * Probe a System One endpoint's `/health`, bounded.
 *
 * Bounded because a hung judge must not stall the page that is supposed to tell
 * you the judge is hung. A non-answering endpoint is a *reported* state, never
 * a thrown error — "unreachable" is the answer, not a failure to answer.
 *
 * @param baseURL - the endpoint root; empty means nothing to probe.
 * @param timeoutMs - the probe deadline.
 * @returns whether it answered, and its payload or the reason it did not.
 */
export async function probeJudge(
  baseURL: string,
  timeoutMs = 3_000,
): Promise<{ reachable: boolean, detail: string }> {
  if (baseURL === '') return { reachable: false, detail: 'no endpoint configured' }
  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, timeoutMs)
  try {
    const response = await fetch(`${baseURL.replace(/\/$/, '')}/health`, { signal: controller.signal })
    if (!response.ok) return { reachable: false, detail: `health returned ${String(response.status)}` }
    return { reachable: true, detail: (await response.text()).slice(0, 300) }
  } catch (error: unknown) {
    const detail = error instanceof Error && error.name === 'AbortError'
      ? `health probe timed out after ${String(timeoutMs)}ms`
      : `unreachable: ${error instanceof Error ? error.message : String(error)}`
    return { reachable: false, detail }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Assemble the panel's status from the row config and the saved file.
 *
 * The saved file wins over the row for display, because that is the precedence
 * the CLI applies: a value set on the settings page is the operator's latest
 * word. The probe is only run for `laya`; `chat` and `none` talk to no System
 * One endpoint, and probing one anyway would report a failure that means
 * nothing and invite someone to "fix" it.
 *
 * @param rowConfig - the plugin patch row's `config:` block.
 * @param settings - the merged settings, from {@link readSettings}.
 * @param probe - an optional pre-computed probe, so tests need no network.
 * @returns the status payload the page renders.
 */
export async function buildStatus(
  rowConfig: Record<string, unknown>,
  settings: Record<string, unknown> = readSettings(),
  probe?: { reachable: boolean, detail: string },
): Promise<FeatureLoopStatus> {
  const effective = { ...rowConfig, ...settings }
  const kind = typeof effective.judge === 'string' ? effective.judge : 'none'
  const baseURL = typeof effective.judgeBaseURL === 'string'
    ? effective.judgeBaseURL
    : (process.env.SYSTEMONE_BASE_URL ?? DEFAULT_JUDGE_BASE_URL)
  const model = typeof effective.systemOneModel === 'string'
    ? effective.systemOneModel
    : (process.env.SYSTEMONE_MODEL ?? DEFAULT_SYSTEMONE_MODEL)
  const resolved = probe ?? (kind === 'laya'
    ? await probeJudge(baseURL)
    : { reachable: kind === 'chat', detail: kind === 'chat' ? 'metered chat judge' : 'detectors only' })
  return {
    enabled: rowConfig.spec != null,
    config: effective,
    configPath: settingsPath(),
    judge: { kind, baseURL, model, reachable: resolved.reachable, detail: resolved.detail },
    dashboardURL: typeof rowConfig.dashboardURL === 'string' ? rowConfig.dashboardURL : '',
  }
}

/**
 * Apply `Remote`'s marker without decorator syntax.
 *
 * Node cannot parse decorators and tsdown/rolldown leaves them verbatim; the
 * harness's own build pipeline lowers them, external bundles never get that
 * pass. This performs what the standard decorator does behind `Remote`:
 * register the per-instance initializer, then run it once against an
 * instance-shaped object so `mark()` lands on this class's prototype, where
 * `remoteMethods()` (the gateway) reads it.
 *
 * ponytail: upgrade path is a tsdown that lowers standard decorators — then
 * this goes back to being a plain `@Remote` line.
 * @param proto - the class prototype owning the method.
 * @param method - the public instance method name to mark.
 */
function markRemote(proto: object, method: string): void {
  let initializer: (this: unknown) => void = function () {}
  const fn = (proto as Record<string, unknown>)[method]
  if (typeof fn !== 'function') throw new Error(`typert-protocol: markRemote cannot find method "${method}"`)
  Remote(fn as never, {
    kind: 'method',
    name: method,
    private: false,
    static: false,
    addInitializer(next: (this: unknown) => void) { initializer = next },
  } as never)
  initializer.call(Object.create(proto))
}

/**
 * The panel's host service — a thin delegate over the pure functions above.
 *
 * Nothing here decides anything; it exists to give the browser a namespace to
 * call and to hold the patch row's config for the lifetime of the fiber.
 */
export class FeatureLoopRemote extends TypertRemoteService {
  static inject = ['profileContext']

  /** Values the patch row supplied, so the page can show what is in effect. */
  private readonly rowConfig: Record<string, unknown>

  constructor(ctx: Context, config: Record<string, unknown> = {}) {
    super(ctx, 'featureLoop')
    this.rowConfig = config
  }

  /** Everything the panel renders on open. */
  status(): Promise<FeatureLoopStatus> {
    return buildStatus(this.rowConfig)
  }

  /** Merge settings into the writable config file. */
  save(settings: FeatureLoopSettings): Record<string, unknown> {
    return saveSettings(settings)
  }
}

markRemote(FeatureLoopRemote.prototype, 'status')
markRemote(FeatureLoopRemote.prototype, 'save')

export default FeatureLoopRemote
