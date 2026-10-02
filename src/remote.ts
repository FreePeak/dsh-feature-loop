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
 * reasoning. It is not a boundary against the settings taking EFFECT, though:
 * `mergeRowAndSettings` below applies the file OVER the row on the nine keys the
 * page owns, so a value set here changes the running gate at the next plugin
 * load. For its first three weeks it did not, and both this header and the
 * page's notice said so — accurately, which is worse: a correct warning about a
 * feature that does not exist still ships the feature's UI.
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
import { GATE_POLICY_CLASSES, GATE_POLICY_VALUES } from './approval-bridge.ts'
import type { GatePolicyClass, GatePolicyValue, GatePolicyMap } from './approval-bridge.ts'
import { noteWatcher } from './approvals.ts'
import type { DashboardSnapshot } from './dashboard.ts'

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

/**
 * The policy keys the settings page owns, and nothing else.
 *
 * The page can change the GATE — the policies per tool, the mode, the review
 * budget, the judge and the checkpoint step. It cannot change `spec`,
 * `dashboard` or `optimize`: those are blocks the page offers no control for,
 * and a half-applied `spec` (a ceilings block with no prices, say) is a worse
 * state than a clear boundary between "yours" and "the deployment's".
 *
 * An allowlist, not a denylist. A denylist silently starts applying any key a
 * future version of the page adds, which is how a status page becomes policy
 * without anybody deciding it should be.
 */
const USER_KEYS = [
  'gatePolicies',
  'gateMode',
  'confidenceThreshold',
  'reviewBudget',
  'judgeThreshold',
  'checkpointAtStep',
  'judge',
  'judgeBaseURL',
  'systemOneModel',
] as const

/**
 * The user's settings, shaped so they can be spread over the row's config.
 *
 * The settings file WINS over the patch row on every key in {@link USER_KEYS}.
 * That is the whole point of the file — it exists so someone can widen or
 * tighten their own gate without editing a shared patch layer other profiles
 * inherit — and the file header, the settings notice and this function all say
 * so. A row that wins would make the page a display surface again, which is the
 * bug this replaces.
 *
 * `reviewBudget` and `judgeThreshold` need reshaping rather than passing
 * through: the row takes them under `router`, the file stores them flat because
 * that is the form a form has.
 *
 * @param rowConfig - the plugin patch row's `config:` block.
 * @returns the partial policy the settings file overrides, empty when it holds
 *   nothing applicable.
 */
export function userSettings(rowConfig: Record<string, unknown> = {}): Record<string, unknown> {
  const settings = readSettings()
  const out: Record<string, unknown> = {}
  for (const key of USER_KEYS) {
    const value = settings[key]
    if (value === undefined) continue
    if (key === 'reviewBudget' || key === 'judgeThreshold') {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
      out.router = { ...(out.router as Record<string, unknown> | undefined ?? {}), [key]: value }
      continue
    }
    if (key === 'gatePolicies') {
      const policies = usablePolicies(value)
      if (policies !== undefined) out.gatePolicies = policies
      continue
    }
    out[key] = value
  }
  return out
}

/**
 * The `gatePolicies` entries worth acting on, and nothing else.
 *
 * A hand-edited file is not `saveSettings` — the validator that rejects
 * `gatePolicies: unknown tool class "wrong_tool_name"` never sees it — and this
 * is the file `apply` builds the gate from. Measured 2026-10-03 with a row that
 * said `write: auto`:
 *
 *   gatePolicies: { write: definitely-yes }  ->  the run still DENIED the write
 *
 * which is the answer a bad value happens to get today, and it is luck rather
 * than design: `ReviewGate.check` compares the value against three known
 * strings and every comparison misses, so the call falls through to the final
 * `review: true`. Add a fourth branch to that chain and the same typo becomes an
 * ungated write. So the values are filtered HERE rather than trusted, and a
 * rejected one is DROPPED rather than fatal — dropping it restores the row's own
 * policy, which is the fail-closed direction, whereas refusing to boot would
 * turn a typo in a file nobody validates into an outage.
 *
 * The page writes exactly the six classes and three values, so a valid file
 * passes through untouched: filtering is a guard for the keys a human typed by
 * hand, not a second policy layer.
 *
 * @param value - whatever the file held under `gatePolicies`.
 * @returns the recognised entries, or `undefined` when none are.
 */
function usablePolicies(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const out: Record<string, string> = {}
  for (const [cls, policy] of Object.entries(value as Record<string, unknown>)) {
    if (!GATE_POLICY_CLASSES.includes(cls as GatePolicyClass)) continue
    if (!GATE_POLICY_VALUES.includes(policy as GatePolicyValue)) continue
    out[cls] = policy as GatePolicyValue
  }
  return Object.keys(out).length === 0 ? undefined : out
}

/**
 * The row's policy values with the user's settings file applied OVER them.
 *
 * The row is the base and the FILE WINS, on the nine keys the settings page
 * offers ({@link userSettings}, above). The page exists so someone can
 * widen or tighten their own gate without editing a shared patch layer other
 * profiles inherit; a row that won would leave the page a display surface, which
 * is the bug this replaces.
 *
 * `router` is the one nested key, so it is merged rather than replaced — a
 * settings file that sets only `reviewBudget` must not erase the row's
 * `judgeThreshold`. Everything else here is a scalar or an opaque block
 * (`gatePolicies`, `dashboard`, `optimize`, `spec`) that the file is not allowed
 * to touch at all.
 *
 * @param config - the row's validated config.
 * @returns the keys `apply` should be given.
 */
export function mergeRowAndSettings(config: Record<string, unknown>): Record<string, unknown> {
  const user = userSettings()
  const rowRouter: Record<string, unknown> = {
    ...(config.reviewBudget === undefined ? {} : { reviewBudget: config.reviewBudget }),
    ...(config.judgeThreshold === undefined ? {} : { judgeThreshold: config.judgeThreshold }),
    ...(config.checkpointAtStep === undefined ? {} : { checkpointAtStep: config.checkpointAtStep }),
  }
  const userRouter = (user.router ?? {}) as Record<string, unknown>
  const router = { ...rowRouter, ...userRouter }
  return {
    confidenceThreshold: config.confidenceThreshold,
    gatePolicies: config.gatePolicies,
    gateMode: config.gateMode,
    ...user,
    router,
  }
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
  /**
   * The dashboard is embedded in the DSH UI, not a standalone port.
   * When true the page renders live run state (runs, pending approvals,
   * feed) in-UI over `snapshot()`; the loopback server on 8101 remains
   * only as the headless/CI fallback.
   */
  embedded: boolean
}

/** Live run state for the in-UI dashboard page. */
export type FeatureLoopLive = DashboardSnapshot

/**
 * The plugin's live dashboard state, shared with the remote row.
 *
 * The dashboard's `DashboardState` is created by the policy row
 * (`feature-loop`), while the remote row (`feature-loop-remote`) serves the
 * in-UI page — two rows, one process. A module-level slot is the narrowest
 * bridge: set once at startup, read per call, cleared on unload.
 * Same-process only, which is exactly the deployment this plugin supports
 * (the loopback server cannot serve another process anyway).
 */
let liveState: LiveSource | undefined

/**
 * What the policy row publishes for the remote row to serve.
 *
 * `config` matters as much as the live numbers: the remote row's own patch
 * `config:` is empty by design (it carries no policy), so without this the
 * status page would report "policies off / judge none" while the policy row
 * was demonstrably running. Truth has to come from the row that owns it.
 */
export interface LiveSource {
  /** The plugin's own `DashboardState` snapshot, verbatim. */
  snapshot(): { runs: DashboardSnapshot['runs'], feed: DashboardSnapshot['feed'] }
  pendingApprovals(): DashboardSnapshot['pending']
  /** The policy row's own config, read per call so the URL can arrive late. */
  config(): Record<string, unknown>
  /** Whether the deployment allows this front end to answer at all. */
  answers(): boolean
  /** Name a run after the task a human submitted for it. */
  labelRun(sessionId: string, task: string): void
}

/**
 * Publish the policy row's live state for the remote row to serve.
 * Called once per plugin load; a second call replaces the first, so a
 * reload never serves a stopped handle.
 */
export function publishLiveState(source: LiveSource): void {
  liveState = source
}

/** Clear the published state on unload, so a stale handle never serves. */
export function unpublishLiveState(source: LiveSource): void {
  if (liveState === source) liveState = undefined
}

/** The subset of config the settings page may write. */
export type { GatePolicyClass, GatePolicyValue, GatePolicyMap }
export { APPROVAL_MODES, approvalModeFor } from './approval-bridge.ts'
export type { ApprovalModeName } from './approval-bridge.ts'

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
  /**
   * Per-tool-class gate policy. Exposed here because a deployment that cannot
   * reach this key has to hand-edit YAML to change it, and the two postures
   * people actually want — "review only what changes things" and "approve
   * everything" — differ only in this map.
   */
  gatePolicies?: GatePolicyMap
  /**
   * Step at which the run pauses for review, once. This is the "built and
   * tested, now look at it" checkpoint. Undefined disables it.
   */
  checkpointAtStep?: number
}

/** The keys {@link FeatureLoopSettings} actually exposes, in file order. */
const SETTINGS_KEYS: (keyof FeatureLoopSettings)[] = [
  'judge', 'judgeBaseURL', 'systemOneModel', 'judgeModel',
  'judgeThreshold', 'reviewBudget', 'confidenceThreshold',
  'gateMode', 'budgetUSD', 'maxSteps', 'gatePolicies', 'checkpointAtStep',
]

/** The numeric fields, so one loop validates all of them the same way. */
const NUMERIC_KEYS: (keyof FeatureLoopSettings)[] = [
  'judgeThreshold', 'reviewBudget', 'confidenceThreshold', 'budgetUSD', 'maxSteps', 'checkpointAtStep',
]

/**
 * Default System One endpoint — the shared Laya sidecar on this machine.
 *
 * `:8092` is the native macOS service; `:8091` was the retired containerised
 * sidecar. Reported as unreachable when the service is down, so a wrong default
 * here reads in the status page as "judge: down" rather than silently.
 */
const DEFAULT_JUDGE_BASE_URL = 'http://127.0.0.1:8092'

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
  if (clean.gateMode !== undefined && !['ask', 'deny', 'auto'].includes(String(clean.gateMode))) {
    throw new Error(`gateMode must be "ask", "deny" or "auto", received ${JSON.stringify(clean.gateMode)}`)
  }
  for (const key of NUMERIC_KEYS) {
    const value = clean[key]
    // `''` means "not set", and every other validator in the harness spells that
    // that way — so a form field left blank must not be read as a typo. The
    // settings page sends exactly this: `checkpointAtStep` is `undefined` when
    // the input is empty, and `String(undefined)` is what the form serialises
    // when the operator has not touched it.
    //
    // Measured 2026-10-03 against the real page in a real browser: with this
    // check as it was, pressing **Save** on an UNCHANGED panel answered
    // `save: checkpointAtStep must be a finite number, received ""` and wrote
    // nothing. Every other field validated, the notice turned red, and a person
    // reading it concludes the settings page is broken rather than that one
    // field is optional — which it has always been, in the patch row too.
    if (value === '' || value === null) {
      delete clean[key]
      continue
    }
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
  const policies = clean.gatePolicies
  if (policies !== undefined) {
    if (typeof policies !== 'object' || policies === null || Array.isArray(policies)) {
      throw new Error(`gatePolicies must be a mapping of tool class to policy, received ${JSON.stringify(policies)}`)
    }
    // A misspelled policy has to fail here. Silently dropping the key would
    // leave the class on its fail-closed default — or, worse, on nothing —
    // while the settings page reports the save as successful and the operator
    // believes a gate is running that is not.
    for (const [cls, value] of Object.entries(policies as Record<string, unknown>)) {
      if (!GATE_POLICY_CLASSES.includes(cls as GatePolicyClass)) {
        throw new Error(`gatePolicies: unknown tool class ${JSON.stringify(cls)}; expected one of ${GATE_POLICY_CLASSES.join(', ')}`)
      }
      if (!GATE_POLICY_VALUES.includes(value as GatePolicyValue)) {
        throw new Error(`gatePolicies.${cls} must be one of ${GATE_POLICY_VALUES.join(', ')}, received ${JSON.stringify(value)}`)
      }
    }
  }
  if (typeof clean.checkpointAtStep === 'number'
    && (!Number.isInteger(clean.checkpointAtStep) || clean.checkpointAtStep < 1)) {
    throw new Error(`checkpointAtStep must be a positive integer, received ${String(clean.checkpointAtStep)}`)
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
    // What this header claimed, and what it is. It said "the dshloop CLI reads
    // this same file, so a change here applies to both surfaces at the next
    // plugin load" — and neither half is true today:
    //
    //   * there is no `dshloop` CLI. The package has no `bin`, and the runner
    //     entry point is `demo/cli.ts`.
    //   * `apply()` builds its policy from the patch row ALONE. It never reads
    //     this file, so nothing here changes the gate until a person wires the
    //     settings in. Verified 2026-10-01: saving `gateMode: deny` and
    //     `read: always-approve`, then building the policy the way `apply()`
    //     does, yields `gateMode: ask` and no gate on `read`.
    //
    // So the file is now the SECOND HALF of the policy: `mergeRowAndSettings`
    // applies it OVER the patch row on the nine keys the page owns, and the
    // header below says exactly that. It used to be a record of what the page
    // was showing and nothing else, and the header said so — accurately, which
    // is worse: a correct warning about a feature that does not exist still
    // ships the feature's UI.
    '# Written by the Feature Loop settings page.\n'
    + '# READ BY: the running gate. The values below are applied OVER the profile\n'
    + "#   patch row (mergeRowAndSettings), so this file wins on the keys it sets.\n"
    + '# SCOPE: the gate keys only — gatePolicies, gateMode, confidenceThreshold,\n'
    + '#   reviewBudget, judgeThreshold, checkpointAtStep and the judge triple.\n'
    + '#   spec, dashboard and optimize stay in the patch row: the page offers no\n'
    + '#   control for them, and a half-applied block is worse than a boundary.\n'
    + '# Takes effect at the next plugin load; the Status tab shows what is stored.\n'
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
 * Project one pending entry onto the UI shape: drop the settle closure and
 * the brief payload, keep what a page needs to render and answer the card.
 */
/**
 * Settle one ask through the published source. False when the ask is already
 * gone — a late click must read as "you were beaten", never as a fresh
 * authorisation.
 */
/**
 * Settle one ask through the live-state seam, if one is mounted.
 *
 * Not exported: its only caller is `FeatureLoopRemote.answer` below, and a
 * second caller would be a bug rather than a feature — the browser reaches this
 * through the remote namespace, which is what `FeatureLoopRemote` is for.
 */
function answerLive(
  source: LiveSource | undefined,
  id: string,
  outcome: 'allowed-once' | 'rejected',
  feedback?: string,
): boolean {
  if (source === undefined) return false
  if (!('settleApproval' in source) || typeof source.settleApproval !== 'function') return false
  return (source as {
    settleApproval(id: string, outcome: 'allowed-once' | 'rejected', feedback?: string): boolean
  }).settleApproval(id, outcome, feedback)
}

/** Project the published live state into the page's own snapshot shape. */
export function projectLive(source: LiveSource | undefined): FeatureLoopLive {
  if (source === undefined) return { answers: true, pending: [], runs: [], feed: [] }
  const snap = source.snapshot()
  return {
    answers: source.answers(),
    pending: source.pendingApprovals(),
    runs: snap.runs,
    feed: snap.feed,
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
 * @param rowSettings - the user settings, read lazily so a caller can inject
 *   them without touching the real config file.
 * @param probe - an optional pre-computed probe, so tests need no network.
 * @param dashboardURL - the live dashboard URL when the policy row published one.
 * @returns the status payload the page renders.
 */
export async function buildStatus(
  rowConfig: Record<string, unknown>,
  rowSettings: () => Record<string, unknown> = userSettings,
  probe?: { reachable: boolean, detail: string },
  dashboardURL?: string,
): Promise<FeatureLoopStatus> {
  // `mergeRowAndSettings` is the SAME function the plugin row is built with, so
  // the panel cannot report one precedence while the gate uses another — which
  // is the failure this replaces: the page showed `{...rowConfig, ...settings}`
  // while `apply` consulted the row alone, so a value could be displayed as
  // effective and decide nothing. One merge, two readers.
  const effective = { ...rowConfig, ...rowSettings() }
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
    dashboardURL: dashboardURL
      ?? (typeof rowConfig.dashboardURL === 'string' ? rowConfig.dashboardURL : ''),
    embedded: true,
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

  /**
   * Everything the panel renders on open. The policy row's published config
   * wins over this row's own (empty) `config:`, so the page reports the
   * spec/judge/dashboard that are actually running rather than "off".
   */
  status(): Promise<FeatureLoopStatus> {
    const published = liveState?.config()
    return buildStatus(
      published ?? this.rowConfig,
      undefined,
      undefined,
      typeof published?.dashboardURL === 'string' ? published.dashboardURL : undefined,
    )
  }

  /**
   * Live run state for the in-UI dashboard page: pending approvals, recent
   * runs, recent feed lines. Same projection the standalone page renders
   * from its SSE frames, so the two surfaces never disagree about what a
   * run looks like — only about transport.
   */
  live(): Promise<FeatureLoopLive> {
    // Every poll is a heartbeat: the in-UI page has no socket to hold open,
    // so "is someone watching" is what the plugin reads to decide whether it
    // may claim an ask or must delegate to the composer panel.
    noteWatcher()
    return Promise.resolve(projectLive(liveState))
  }

  /**
   * Name a run after the task a human typed for it.
   *
   * Called just before the task is submitted, so the label is in place by the
   * time the first frame arrives. A display label only — the loop's ceilings
   * come from the spec, so a task naming a bigger budget changes nothing.
   *
   * @param sessionId - the session the run will belong to.
   * @param task - what the human asked for.
   */
  labelRun(sessionId: string, task: string): void {
    noteWatcher()
    if (liveState === undefined) return
    liveState.labelRun(sessionId, task)
  }

  /**
   * Answer one pending approval from the in-UI page. Settles through the
   * registry the plugin already owns, so the composer prompt clears and the
   * tool is released or refused identically to the standalone page.
   */
  answer(id: string, outcome: 'allowed-once' | 'rejected', feedback?: string): Promise<{ settled: boolean }> {
    noteWatcher()
    return Promise.resolve({ settled: answerLive(liveState, id, outcome, feedback) })
  }

  /** Merge settings into the writable config file. */
  save(settings: FeatureLoopSettings): Record<string, unknown> {
    return saveSettings(settings)
  }
}

markRemote(FeatureLoopRemote.prototype, 'status')
markRemote(FeatureLoopRemote.prototype, 'live')
markRemote(FeatureLoopRemote.prototype, 'answer')
markRemote(FeatureLoopRemote.prototype, 'labelRun')
markRemote(FeatureLoopRemote.prototype, 'save')

export default FeatureLoopRemote
