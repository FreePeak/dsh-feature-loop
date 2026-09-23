/**
 * The HITL approval dashboard: a small loopback HTTP server the plugin hosts
 * so a human can answer feature-loop approval requests from a web page, and
 * watch the run while they do.
 *
 * Two jobs, one seam each:
 *
 *   approvals   an `approval/request` answerer (registered by `plugin.ts`
 *               ahead of every other listener) that claims a request only
 *               while a dashboard browser tab is connected, and otherwise
 *               delegates via `next()` — so the stock composer panel remains
 *               the fallback and a deployment without a dashboard is
 *               unaffected.
 *   visibility  a snapshot of run state (step, budget, signals, judge, gate
 *               decisions) pushed over SSE, fed by the plugin's own hooks.
 *               Nothing is read from the session log: web-path persistence is
 *               unproven, and the plugin already computes all of this.
 *
 * Security posture, deliberately minimal but not decorative: binds loopback by
 * default (the same posture `docker/docker-compose.yml` takes), requires a
 * bearer-equivalent token on every response, and refuses cross-origin POSTs.
 * A surface that can approve tool calls is RCE-equivalent — `host` accepts
 * only `127.0.0.1` or `0.0.0.0`, the closed set the harness's own webserver
 * schema accepts, and `0.0.0.0` is meant for inside a container whose
 * published port is loopback-only.
 *
 * Node builtins only. A new runtime dependency here would be a new attack
 * surface on the one endpoint that can wave a tool through.
 *
 * @module dsh-feature-loop/dashboard
 */

import { createServer } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { randomBytes, randomUUID, timingSafeEqual, createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ReviewSignal } from './signals.ts'
// Type-only on purpose: the measurement modules are authored concurrently by
// other seams, and type-only imports are erased at runtime, so this module
// neither loads nor requires their code — it only renders their shapes.
import type { MetricsSummary } from './metrics.ts'
import type { Recommendation } from './optimizer.ts'
import { DASHBOARD_PAGE } from './dashboard-page.ts'

/**
 * The vendored dashboard bundle and stylesheets, read once at startup.
 *
 * These are build artifacts committed under `assets/assistant-ui/`
 * (`make dashboard-bundle`), not files this module generates. The published
 * payload ships them (`package.json` `files`) and the server reads them from
 * disk here. Two candidate paths are tried because the plugin loads the
 * *built* `lib/index.mjs` in production while the tests run TS straight from
 * `src/`: the assets sit two directories up from `src/`, but only one up
 * from `lib/`. A miss is a hard error naming the fix rather than a 404 the
 * operator would have to diagnose from a blank page.
 */
function readBundleAsset(name: string): Buffer {
  const here = dirname(fileURLToPath(import.meta.url))
  const tried: string[] = []
  for (const base of [here, join(here, '..')]) {
    const candidate = join(base, 'assets/assistant-ui', name)
    tried.push(candidate)
    try {
      return readFileSync(candidate)
    } catch {
      /* try the next layout */
    }
  }
  throw new Error(
    `dashboard bundle asset missing: ${name} (tried ${tried.join(', ')}) — `
    + 'rebuild with `make dashboard-bundle`',
  )
}

const BUNDLE_JS = readBundleAsset('dashboard.js')
const BUNDLE_SHELL_CSS = readBundleAsset('shell.css')
const BUNDLE_UI_CSS = readBundleAsset('dashboard.css')

/** The only three files the page may load, by exact path. */
const ASSETS: Record<string, { body: Buffer, contentType: string }> = {
  '/assets/dashboard.js': { body: BUNDLE_JS, contentType: 'text/javascript; charset=utf-8' },
  '/assets/shell.css': { body: BUNDLE_SHELL_CSS, contentType: 'text/css; charset=utf-8' },
  '/assets/dashboard.css': { body: BUNDLE_UI_CSS, contentType: 'text/css; charset=utf-8' },
}

/**
 * The outcome vocabulary, mirrored structurally from the harness's
 * `ApprovalOutcome`. Not imported: this module stays in the harness-free
 * closure so the CI typecheck job covers it, and the four literals are the
 * whole contract — a fifth outcome would be a harness change, not a drift to
 * absorb silently.
 */
export type ApprovalOutcome = 'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'

/** Feed line categories, in the order they read best. */
export type FeedKind = 'step' | 'signals' | 'judge' | 'route' | 'gate' | 'approval' | 'note'

/** One activity-feed line. */
export interface FeedEntry {
  /** Epoch milliseconds. */
  t: number
  runId?: string
  kind: FeedKind
  text: string
}

/** One run's live numbers, as the page renders them. */
export interface RunSnapshot {
  runId: string
  /**
   * Session id when known (usually the same as `runId` / agent id).
   * Present so the rail can label sessions without inventing a second key.
   */
  sessionId?: string
  /** Absolute workspace cwd projected from the live agent session header. */
  cwd?: string
  /** Basename of `cwd` for workspace grouping; absent when ungrouped. */
  workspaceLabel?: string
  /** Last time this run's numbers or meta were touched (epoch ms). */
  updatedAt?: number
  step?: number
  maxSteps?: number
  spentUSD?: number
  budgetUSD?: number
  unpricedSteps?: number
  judgeScore?: number
  route?: string
  signals: ReviewSignal[]
}

/**
 * Basename of an absolute workspace path for rail grouping.
 * No path-module dependency: dashboard.ts stays node_modules-free for CI strip-types.
 */
export function workspaceLabelOf(cwd: string | undefined): string | undefined {
  if (typeof cwd !== 'string' || cwd.trim() === '') return undefined
  const trimmed = cwd.replace(/[/\\]+$/, '')
  if (trimmed === '' || trimmed === '/') return '/'
  const parts = trimmed.split(/[/\\]/).filter((p) => p !== '')
  const last = parts[parts.length - 1]
  return last === undefined || last === '' ? trimmed : last
}

/**
 * One normalized review-brief node: data only, no HTML, strings only.
 *
 * Structural mirror of `BriefNode` in `brief.ts`, kept in this module so
 * `dashboard.ts` stays dependency-free (CI's test job runs with no
 * `node_modules`). The two shapes must stay identical; `recordBrief` in
 * `DashboardState` takes the structural form.
 */
export type BriefNode =
  | { kind: 'heading', text: string }
  | { kind: 'paragraph', text: string }
  | { kind: 'list', items: string[] }
  | { kind: 'code', language: string, code: string }

/** The review brief's lifecycle on one pending ask. */
export type BriefState = 'none' | 'pending' | 'ready' | 'failed'

/** One approval waiting for a human. */
export interface PendingApproval {
  id: string
  toolName: string
  callId?: string
  reason?: string
  runId?: string
  askedAt: number
  /**
   * The review brief's lifecycle. `none` means no brief was requested (the
   * default); `pending` while the explainer runs; `ready` with `brief` set;
   * `failed` when the explainer or normalization produced nothing. A failed
   * brief never touches the ask — the buttons stay fully answerable.
   */
  briefState: BriefState
  /** Normalized brief nodes, present exactly when `briefState` is `ready`. */
  brief?: BriefNode[]
}

/** The full state the page consumes — one JSON document per SSE frame. */
export interface DashboardSnapshot {
  /** Whether this dashboard claims approvals (false = observe-only). */
  answers: boolean
  pending: PendingApproval[]
  runs: RunSnapshot[]
  feed: FeedEntry[]
  /**
   * The aggregated measurement roll-up, once `metrics.ts` has produced one.
   * Optional because absence is meaningful: a deployment that has measured
   * nothing serves no `metrics` key at all, and the page renders nothing —
   * an absent summary must never read as a wall of honest-looking zeros.
   */
  metrics?: MetricsSummary
  /**
   * Optimizer suggestions, display-only. There is deliberately no server
   * route that can apply one (see `route` in `startDashboard`): applying a
   * recommendation is a human copying a config snippet, by hand.
   */
  recommendations?: Recommendation[]
}

/** Configured under the patch row's `dashboard:` key. All fields optional. */
export interface DashboardConfig {
  /**
   * Set `false` to start no server. Defaults to on: omitting the block starts
   * the page on 127.0.0.1:8100 with a per-start token.
   */
  enabled?: boolean
  /** Bind address. Only `127.0.0.1` (default) or `0.0.0.0` (in-container). */
  host?: string
  /** Port. Integer 0–65535; 0 asks the OS for a free one (tests use this). */
  port?: number
  /** Shared secret for every request. Generated when omitted. */
  token?: string
  /**
   * Whether a connected dashboard *answers* approvals or only observes them.
   * Defaults to true. Set false to keep the composer as the sole answerer
   * while still watching the run here.
   */
  answers?: boolean
  /** Fail closed this long after asking: pending asks settle `unavailable`. */
  answerTimeoutMs?: number
  /**
   * The model-authored review brief, rendered above the Allow/Reject buttons.
   * Omitted or `enabled` not `true` means no brief is ever requested — the
   * pending cards render exactly as before this feature existed.
   */
  brief?: BriefConfig
}

/**
 * Configured under the `dashboard:` key's `brief:` row. All fields optional.
 * The model call is built by the plugin from the deployment's gateway env;
 * these fields only bound it.
 */
export interface BriefConfig {
  /** Must be `true` for the plugin to request briefs at all. */
  enabled?: boolean
  /** The model id to ask, e.g. `xiaomi/mimo-v2.5`. Required when enabled. */
  model?: string
  /** Cap on the brief's own output tokens. Default 1024. */
  maxTokens?: number
  /** Per-brief deadline in ms. Default 15000. */
  timeoutMs?: number
}

/** Config after validation: every field present and type-correct. */
export interface ResolvedDashboardConfig {
  host: string
  port: number
  token: string
  answers: boolean
  answerTimeoutMs: number
  brief: { enabled: boolean, model: string | undefined, maxTokens: number, timeoutMs: number }
}

/**
 * The structural projection of the harness's `ApprovalRequestEvent` the
 * answerer reads. Structural on purpose — see `ApprovalOutcome` above — but
 * fields are named exactly as the harness names them, so a rename there fails
 * this module's integration test rather than passing with `undefined`.
 */
export interface ApprovalQuestion {
  /** The agent being asked for. Present except for agent-less dispatches. */
  agent?: { readonly id?: unknown } | undefined
  toolName: string
  callId?: string
  reason?: string
  /** Fires when the ask is withdrawn (turn ended, session stopped). */
  signal?: AbortSignal
}

/** Feed lines kept in memory. Old lines fall off; the run state does not. */
const FEED_LIMIT = 200
/**
 * Runs tracked before the oldest is evicted.
 *
 * ponytail: keyed by agent id with FIFO eviction — a deployment that cycles
 * thousands of sessions in one process would drop earlier runs' state. The
 * upgrade path is a bounded LRU keyed by last-activity; nothing today runs
 * more than a handful of agents per process, so the ceiling is recorded
 * rather than engineered.
 */
const RUN_LIMIT = 50
/** Largest approval POST body we will read. */
const MAX_BODY = 8 * 1024
/** SSE keep-alive interval, under typical proxy idle timeouts. */
const KEEPALIVE_MS = 25_000

/** Human labels for the feed, keyed by outcome. */
const OUTCOME_LABEL: Record<ApprovalOutcome, string> = {
  'allowed-once': 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  unavailable: 'expired / unavailable',
}

/** First line of a multi-line reason, truncated — feed lines stay one line. */
function firstLine(text: string, max = 300): string {
  const line = text.split('\n', 1)[0] ?? ''
  return line.length <= max ? line : `${line.slice(0, max - 1)}…`
}

/**
 * Validate a dashboard config, naming the first bad field.
 *
 * Throws a `TypeError` whose message starts with `dashboard.` — the same
 * fail-loud-at-load rule `validateSpec` follows for the loop spec: a
 * misconfigured dashboard must stop the plugin from loading, never degrade
 * into a silently-unreachable server.
 *
 * @param config - the raw `dashboard:` value from the patch row.
 * @returns the config with defaults applied.
 */
export function parseDashboardConfig(config: DashboardConfig = {}): ResolvedDashboardConfig {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new TypeError(
      `dashboard must be a mapping of options, received ${JSON.stringify(config)}`,
    )
  }
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
    throw new TypeError(`dashboard.enabled must be true or false, received ${JSON.stringify(config.enabled)}`)
  }
  const host = config.host ?? '127.0.0.1'
  if (host !== '127.0.0.1' && host !== '0.0.0.0') {
    throw new TypeError(
      'dashboard.host must be "127.0.0.1" (default) or "0.0.0.0" (container-internal only) — '
      + `the same closed set the harness webserver accepts, received ${JSON.stringify(config.host)}`,
    )
  }
  const port = config.port ?? 8100
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new TypeError(
      `dashboard.port must be an integer in [0, 65535] (0 = pick a free port), received ${JSON.stringify(config.port)}`,
    )
  }
  const token = config.token ?? randomBytes(24).toString('hex')
  if (typeof token !== 'string' || token === '') {
    throw new TypeError(`dashboard.token must be a non-empty string, received ${JSON.stringify(config.token)}`)
  }
  const answers = config.answers ?? true
  if (typeof answers !== 'boolean') {
    throw new TypeError(`dashboard.answers must be true or false, received ${JSON.stringify(config.answers)}`)
  }
  const answerTimeoutMs = config.answerTimeoutMs ?? 600_000
  if (!Number.isInteger(answerTimeoutMs) || answerTimeoutMs < 1) {
    throw new TypeError(
      `dashboard.answerTimeoutMs must be a positive integer of milliseconds, received ${JSON.stringify(config.answerTimeoutMs)}`,
    )
  }
  return { host, port, token, answers, answerTimeoutMs, brief: parseBriefConfig(config.brief) }
}

/**
 * Validate the `dashboard.brief` row, naming the first bad field like every
 * other dashboard option. A brief without a model is a typo someone will
 * flip `enabled: true` on later — it fails at load, not at the first ask.
 */
function parseBriefConfig(brief: BriefConfig | undefined): ResolvedDashboardConfig['brief'] {
  if (brief === undefined) return { enabled: false, model: undefined, maxTokens: 1024, timeoutMs: 15_000 }
  if (typeof brief !== 'object' || brief === null || Array.isArray(brief)) {
    throw new TypeError(
      `dashboard.brief must be a mapping of options, received ${JSON.stringify(brief)}`,
    )
  }
  if (brief.enabled !== undefined && typeof brief.enabled !== 'boolean') {
    throw new TypeError(`dashboard.brief.enabled must be true or false, received ${JSON.stringify(brief.enabled)}`)
  }
  const enabled = brief.enabled ?? false
  const model = brief.model
  if (model !== undefined && (typeof model !== 'string' || model === '')) {
    throw new TypeError(`dashboard.brief.model must be a non-empty model id, received ${JSON.stringify(brief.model)}`)
  }
  if (enabled && model === undefined) {
    throw new TypeError('dashboard.brief.model is required when dashboard.brief.enabled is true')
  }
  const maxTokens = brief.maxTokens ?? 1024
  if (!Number.isInteger(maxTokens) || maxTokens < 1) {
    throw new TypeError(
      `dashboard.brief.maxTokens must be a positive integer, received ${JSON.stringify(brief.maxTokens)}`,
    )
  }
  const timeoutMs = brief.timeoutMs ?? 15_000
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new TypeError(
      `dashboard.brief.timeoutMs must be a positive integer of milliseconds, received ${JSON.stringify(brief.timeoutMs)}`,
    )
  }
  return { enabled, model, maxTokens, timeoutMs }
}

/**
 * Run state the plugin feeds and the page renders.
 *
 * A plain in-memory record — there is no session-log tailing here: web-path
 * persistence is unproven (see `todo.md`), and the plugin already computes
 * every one of these numbers at its hooks.
 */
export class DashboardState {
  private readonly runs = new Map<string, RunSnapshot>()
  private readonly feedList: FeedEntry[] = []
  private metricsSummary: MetricsSummary | undefined
  private recommendationList: Recommendation[] | undefined
  private listener: (() => void) | undefined

  /**
   * Install the single change listener (the server's broadcast). One slot is
   * enough: one dashboard serves one process.
   *
   * @param listener - called after every mutation, or undefined to clear.
   */
  onChange(listener: (() => void) | undefined): void {
    this.listener = listener
  }

  private changed(): void {
    this.listener?.()
  }

  private run(runId: string): RunSnapshot {
    let record = this.runs.get(runId)
    if (record === undefined) {
      record = { runId, signals: [], updatedAt: Date.now() }
      this.runs.set(runId, record)
      // See RUN_LIMIT: FIFO eviction, recorded ceiling rather than engineered.
      while (this.runs.size > RUN_LIMIT) {
        const oldest = this.runs.keys().next().value
        if (oldest === undefined) break
        this.runs.delete(oldest)
      }
    }
    return record
  }

  private touch(run: RunSnapshot): void {
    run.updatedAt = Date.now()
  }

  /** Record the step-boundary numbers: ceiling position and spend. */
  recordStep(runId: string, patch: Omit<RunSnapshot, 'runId' | 'signals'>): void {
    const run = this.run(runId)
    Object.assign(run, patch)
    if (patch.cwd !== undefined) {
      run.workspaceLabel = workspaceLabelOf(patch.cwd) ?? run.workspaceLabel
    }
    this.touch(run)
    this.changed()
  }

  /**
   * Attach session/workspace identity projected from a live agent.
   * Safe to call repeatedly; only defined fields overwrite.
   */
  recordMeta(
    runId: string,
    meta: { sessionId?: string, cwd?: string, workspaceLabel?: string },
  ): void {
    const run = this.run(runId)
    if (meta.sessionId !== undefined && meta.sessionId !== '') run.sessionId = meta.sessionId
    if (meta.cwd !== undefined && meta.cwd !== '') {
      run.cwd = meta.cwd
      run.workspaceLabel = meta.workspaceLabel ?? workspaceLabelOf(meta.cwd) ?? run.workspaceLabel
    } else if (meta.workspaceLabel !== undefined && meta.workspaceLabel !== '') {
      run.workspaceLabel = meta.workspaceLabel
    }
    this.touch(run)
    this.changed()
  }

  /** Replace the run's current signals: the detectors recompute them each step. */
  recordSignals(runId: string, signals: readonly ReviewSignal[]): void {
    const run = this.run(runId)
    run.signals = [...signals]
    this.touch(run)
    this.changed()
  }

  /** Record the judge's latest score, when one was spent. */
  recordJudge(runId: string, score: number): void {
    const run = this.run(runId)
    run.judgeScore = score
    this.touch(run)
    this.changed()
  }

  /** Record the route the ladder chose for this step. */
  recordRoute(runId: string, route: string): void {
    const run = this.run(runId)
    run.route = route
    this.touch(run)
    this.changed()
  }

  /**
   * Append a feed line. Kept separate from the typed recorders so the plugin
   * can surface notices (review text, ceiling stops) without inventing fields.
   */
  note(kind: FeedKind, text: string, runId?: string): void {
    const entry: FeedEntry = { t: Date.now(), kind, text: firstLine(text), ...runId === undefined ? {} : { runId } }
    this.feedList.push(entry)
    while (this.feedList.length > FEED_LIMIT) this.feedList.shift()
    this.changed()
  }

  /** A gate decision worth remembering: only blocks, not every auto tool call. */
  recordGate(runId: string, toolName: string, verdict: 'ask' | 'deny', reason?: string): void {
    this.note('gate', `${verdict}: ${toolName}${reason === undefined ? '' : ` — ${firstLine(reason, 200)}`}`, runId)
  }

  /**
   * Replace the measurement roll-up. Replacement, not merge: the plugin feeds
   * a freshly computed summary per roll-up, and merging two would invent
   * numbers neither computation actually produced.
   *
   * @param summary - the latest `MetricsSummary`, or a fresh recomputation.
   */
  setMetrics(summary: MetricsSummary): void {
    this.metricsSummary = summary
    this.changed()
  }

  /**
   * Replace the optimizer's recommendations. The page shows these read-only —
   * there is no apply affordance anywhere in this server (see `route`), so
   * this setter moves display state, never config state.
   *
   * @param list - the current recommendation list; copied, so later mutation
   *   by the optimizer cannot rewrite a frame already served.
   */
  setRecommendations(list: readonly Recommendation[]): void {
    this.recommendationList = [...list]
    this.changed()
  }

  /** A read-only copy, safe to serialize. */
  snapshot(): {
    runs: RunSnapshot[]
    feed: FeedEntry[]
    metrics?: MetricsSummary
    recommendations?: Recommendation[]
  } {
    return {
      runs: [...this.runs.values()].map(run => ({ ...run, signals: [...run.signals] })),
      feed: [...this.feedList],
      // Absent stays absent: the spread omits the key entirely, so a frame
      // without metrics means "none produced", never "all zero".
      ...this.metricsSummary === undefined ? {} : { metrics: this.metricsSummary },
      ...this.recommendationList === undefined ? {} : { recommendations: [...this.recommendationList] },
    }
  }
}

/**
 * What the plugin needs of a brief-aware pending entry, without importing
 * `startDashboard`'s internals: mark the brief pending while the explainer
 * runs, then record its normalized nodes (or its failure).
 */
export interface BriefRecorder {
  markBriefPending(id: string): void
  recordBrief(id: string, nodes: BriefNode[] | undefined): void
}

/** What `startDashboard` hands back. */
export interface DashboardHandle {
  /** Base URL once listening; empty until the socket is bound. */
  readonly url: string
  readonly token: string
  /** Resolves when bound; rejects on e.g. EADDRINUSE (logged loudly too). */
  readonly ready: Promise<void>
  /**
   * The `approval/request` answerer. Delegates to `next()` unless a dashboard
   * client is connected AND `answers` is on — that guard, not listener order,
   * is what keeps the composer panel as the fallback.
   *
   * @param question - the pending ask, structurally projected from the harness.
   * @param next - the rest of the waterfall.
   * @returns the outcome the harness maps to allow/deny.
   */
  answer(question: ApprovalQuestion, next: () => Promise<ApprovalOutcome>): Promise<ApprovalOutcome>
  /** Settle every pending ask `unavailable`, close clients and the socket. */
  stop(): Promise<void>
  /**
   * The brief recorder the plugin drives: mark-pending when the explainer
   * starts, record when it resolves. Fire-and-forget by contract — neither
   * call can settle, delay, or otherwise touch the ask.
   */
  readonly briefs: BriefRecorder
  /**
   * The current pending entries, for the plugin to match a claimed ask back
   * to its dashboard id. A point-in-time copy; the id may already be gone.
   */
  pendingSnapshot(): PendingApproval[]
}

/** A pending ask, internal form: the settle closure the POST path drives. */
interface PendingEntry extends PendingApproval {
  /**
   * Resolve the ask. `feedText` overrides the default approval feed line when
   * the operator attached free-text feedback from the chat composer.
   */
  settle(outcome: ApprovalOutcome, feedText?: string): void
}

/**
 * Find one pending entry's id by matching what the ask carried.
 *
 * The dashboard mints its own pending ids internally; the plugin learns them
 * only through snapshots. Matching on toolName + callId + reason is unique
 * enough in practice — two identical asks in flight would share a brief, and
 * a shared brief for two identical asks is correct anyway.
 *
 * @param pending - the current pending entries.
 * @param question - the ask whose entry to find.
 * @returns the entry id, or `undefined` when already settled.
 */
export function pendingIdFor(
  pending: PendingApproval[],
  question: { toolName: string, callId?: string, reason?: string },
): string | undefined {
  const match = pending.find(entry =>
    entry.toolName === question.toolName
    && (entry.callId ?? undefined) === (question.callId ?? undefined)
    && (entry.reason ?? undefined) === (question.reason ?? undefined),
  )
  return match?.id
}

/**
 * Start the dashboard server.
 *
 * Synchronous by design: `plugin.ts`'s `apply` is synchronous (cordis), so the
 * handle must exist immediately. Binding happens in the background — `ready`
 * is the probe, and until it resolves no browser can be connected, which
 * means `answer` delegates and the composer answers. Fail-safe by construction.
 *
 * @param config - the raw `dashboard:` config; validated, throwing on bad fields.
 * @param state - the run state to serve; one is created when omitted.
 * @returns the handle.
 */
export function startDashboard(
  config: DashboardConfig = {},
  state: DashboardState = new DashboardState(),
): DashboardHandle {
  const cfg = parseDashboardConfig(config)
  const pending = new Map<string, PendingEntry>()
  const clients = new Set<ServerResponse>()
  let stopped = false

  const snapshot = (): DashboardSnapshot => ({
    answers: cfg.answers,
    pending: [...pending.values()].map(({ id, toolName, callId, reason, runId, askedAt, briefState, brief }) => ({
      id, toolName, ...callId === undefined ? {} : { callId },
      ...reason === undefined ? {} : { reason },
      ...runId === undefined ? {} : { runId }, askedAt, briefState,
      ...brief === undefined ? {} : { brief },
    })),
    ...state.snapshot(),
  })

  /**
   * Drive one pending entry's brief lifecycle and rebroadcast, without ever
   * touching the ask's settle path. A settled (absent) entry swallows the
   * update: a brief that lands after the human already decided is moot, and
   * must not resurrect the card.
   */
  const briefs: BriefRecorder = {
    markBriefPending(id: string): void {
      const entry = pending.get(id)
      if (entry === undefined || entry.briefState !== 'none') return
      entry.briefState = 'pending'
      broadcast()
    },
    recordBrief(id: string, nodes: BriefNode[] | undefined): void {
      const entry = pending.get(id)
      if (entry === undefined || entry.briefState !== 'pending') return
      entry.briefState = nodes === undefined ? 'failed' : 'ready'
      if (nodes !== undefined) entry.brief = nodes
      broadcast()
    },
  }

  const broadcast = (): void => {
    if (clients.size === 0) return
    const frame = `data: ${JSON.stringify(snapshot())}\n\n`
    for (const res of clients) res.write(frame)
  }
  state.onChange(broadcast)

  const server = createServer((req, res) => {
    void route(req, res).catch((error: unknown) => {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
    })
  })

  /** Constant-time token compare over digests, so length is not a signal. */
  const tokenMatches = (given: string | undefined): boolean => {
    if (given === undefined || given === '') return false
    const a = createHash('sha256').update(given).digest()
    const b = createHash('sha256').update(cfg.token).digest()
    return timingSafeEqual(a, b)
  }

  /** Token from the header everywhere; query also accepted on GETs only. */
  const authorized = (req: IncomingMessage, url: URL, allowQuery: boolean): boolean => {
    const header = req.headers['x-dashboard-token']
    if (tokenMatches(Array.isArray(header) ? header[0] : header)) return true
    return allowQuery && tokenMatches(url.searchParams.get('token') ?? undefined)
  }

  const deny = (res: ServerResponse): void => {
    sendJson(res, 401, { error: 'missing or invalid dashboard token — open the URL printed by make dashboard' })
  }

  /**
   * Cross-origin defense in depth for the one state-changing route. The token
   * already authenticates; this stops a browser that somehow holds it from a
   * different origin. Non-browser clients (curl) send no Origin and are
   * judged on the token alone.
   */
  const sameOrigin = (req: IncomingMessage): boolean => {
    const origin = req.headers.origin
    if (origin === undefined || origin === '') return true
    return origin === `http://${req.headers.host}` || origin === `https://${req.headers.host}`
  }

  const readJson = async (req: IncomingMessage): Promise<unknown> => {
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of req) {
      const buf = Buffer.from(chunk as Buffer)
      size += buf.length
      if (size > MAX_BODY) throw new Error('body too large')
      chunks.push(buf)
    }
    if (size === 0) return {}
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      throw new Error('body is not valid JSON')
    }
  }

  const openSse = (req: IncomingMessage, res: ServerResponse, url: URL): void => {
    if (!authorized(req, url, true)) return deny(res)
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    res.write('retry: 2000\n\n')
    res.write(`data: ${JSON.stringify(snapshot())}\n\n`)
    // Registered before any await: the moment this tab exists, `answer` may
    // claim requests. That single fact is the whole precedence rule.
    clients.add(res)
    const keepalive = setInterval(() => res.write(': ping\n\n'), KEEPALIVE_MS)
    keepalive.unref()
    req.on('close', () => {
      clearInterval(keepalive)
      clients.delete(res)
      // Last tab gone: pending asks must not hang the run. Failing closed to
      // `unavailable` is the seam's own no-answerer behaviour.
      if (clients.size === 0) {
        for (const entry of [...pending.values()]) entry.settle('unavailable')
      }
    })
  }

  const approve = async (req: IncomingMessage, res: ServerResponse, id: string): Promise<void> => {
    if (!authorized(req, new URL('/', 'http://x'), false)) return deny(res)
    if (!sameOrigin(req)) return sendJson(res, 403, { error: 'cross-origin approval denied' })
    let body: unknown
    try {
      body = await readJson(req)
    } catch (error: unknown) {
      return sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) })
    }
    const parsed = body as { outcome?: unknown, feedback?: unknown } | null
    const outcome = parsed?.outcome
    if (outcome !== 'allowed-once' && outcome !== 'rejected') {
      return sendJson(res, 400, { error: 'outcome must be "allowed-once" or "rejected"' })
    }
    // Optional operator note from the chat composer. Cap length so a huge
    // paste cannot bloat the feed; empty/whitespace is treated as absent.
    const feedbackRaw = parsed?.feedback
    const feedback = typeof feedbackRaw === 'string'
      ? firstLine(feedbackRaw.trim(), 500)
      : ''
    const entry = pending.get(id)
    // 409, not 404: the request existed; it was settled, expired, or
    // cancelled. A late click must read as "you were beaten", not "bad url".
    if (entry === undefined) return sendJson(res, 409, { error: 'no such pending approval (settled, expired, or cancelled)' })
    const feedText = feedback === ''
      ? undefined
      : `${OUTCOME_LABEL[outcome]}: ${entry.toolName} — ${feedback}`
    entry.settle(outcome, feedText)
    sendJson(res, 200, { ok: true, outcome, ...feedback === '' ? {} : { feedback } })
  }

  /**
   * Serve one vendored asset.
   *
   * Deliberately **unauthenticated**. The page's `<link>` and `<script>` tags
   * are issued by the browser with no header and no query string, so a token
   * check here would 401 the page's own stylesheets. Nothing secret is in
   * these files — the token and the run state travel in the authed page and
   * `/api/*` responses — and the server is loopback-bound, so the exposure is
   * a local process reading a stylesheet. The set is a closed allowlist: no
   * path from the request is ever joined onto a directory, so `/assets/../..`
   * cannot reach anything.
   */
  const serveAsset = (res: ServerResponse, pathname: string): void => {
    const asset = ASSETS[pathname]
    if (asset === undefined) return sendJson(res, 404, { error: 'no such asset' })
    res.writeHead(200, {
      'content-type': asset.contentType,
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    })
    res.end(asset.body)
  }

  const route = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://placeholder')
    const method = req.method ?? 'GET'
    if (method === 'GET' && url.pathname === '/api/events') return openSse(req, res, url)
    if (method === 'GET' && url.pathname === '/api/state') {
      if (!authorized(req, url, true)) return deny(res)
      return sendJson(res, 200, snapshot())
    }
    if (method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      if (!authorized(req, url, true)) return deny(res)
      // Per-response nonce covering the page's two <link>s and its one inline
      // bootstrap script. The vendored bundle cannot carry a nonce (it is a
      // static file), so `script-src` names it explicitly as `'self'` — the
      // page may run its own script and nothing else.
      const nonce = randomBytes(16).toString('base64')
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}' 'self'; style-src 'nonce-${nonce}' 'self'; connect-src 'self'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
      })
      res.end(DASHBOARD_PAGE.replaceAll('__CSP_NONCE__', nonce))
      return
    }
    if (method === 'GET' && url.pathname.startsWith('/assets/')) {
      return serveAsset(res, url.pathname)
    }
    if (method === 'POST' && url.pathname.startsWith('/api/approvals/')) {
      return approve(req, res, decodeURIComponent(url.pathname.slice('/api/approvals/'.length)))
    }
    // Deliberately NO `POST /api/apply` — and no GET for it either. Applying
    // a recommendation means a human copying its config snippet into their
    // config by hand. An endpoint that let this server apply optimizer output
    // would let the small local model that produced it loosen its own
    // ceilings (budget, maxSteps, timeouts) with no human in the loop — the
    // exact mutation this HITL seam exists to force through a person. The
    // 404 below is the feature. If you are tempted to "helpfully" add
    // `/api/apply`, add a test proving it 404s instead (the suite has one).
    sendJson(res, 404, { error: 'not found' })
  }

  server.listen(cfg.port, cfg.host)

  const { promise: ready, resolve: resolveReady, reject: rejectReady } = Promise.withResolvers<void>()
  server.once('listening', () => {
    // The greppable line: `make dashboard` finds it in the container log the
    // same way `make url` finds the harness's own token line.
    console.log(`feature-loop dashboard: ${handle.url}?token=${cfg.token}`)
    resolveReady()
  })
  server.once('error', (error: Error) => {
    console.error(`[feature-loop dashboard] FAILED to bind ${cfg.host}:${cfg.port}: ${error.message}`)
    rejectReady(error)
  })
  // Nobody may await `ready` (a headless boot), and an unhandled rejection
  // would be worse than the logged line above.
  ready.catch(() => undefined)

  const stop = async (): Promise<void> => {
    if (stopped) return
    stopped = true
    for (const entry of [...pending.values()]) entry.settle('unavailable')
    state.onChange(undefined)
    for (const res of clients) res.end()
    clients.clear()
    await new Promise<void>(resolve => {
      server.close(() => resolve())
      // Sockets with an open SSE response would otherwise hold `close` open.
      server.closeAllConnections()
    })
  }

  const answer = async (
    question: ApprovalQuestion,
    next: () => Promise<ApprovalOutcome>,
  ): Promise<ApprovalOutcome> => {
    // The guard. Order among answerers is not a priority mechanism (the
    // harness docs say so), so precedence here is decided by observation:
    // claim exactly while a tab is watching, delegate otherwise.
    if (stopped || !cfg.answers || clients.size === 0) return next()

    const rawId = question.agent?.id
    const runId = typeof rawId === 'string' && rawId !== '' ? rawId : 'agentless'
    const id = randomUUID()
    const toolName = question.toolName

    return new Promise<ApprovalOutcome>(resolve => {
      let settled = false
      let timer: NodeJS.Timeout | undefined

      const settle = (outcome: ApprovalOutcome, feedText?: string): void => {
        if (settled) return
        settled = true
        pending.delete(id)
        if (timer !== undefined) clearTimeout(timer)
        question.signal?.removeEventListener('abort', onAbort)
        // `note` broadcasts; a second frame here would be the same snapshot.
        state.note('approval', feedText ?? `${OUTCOME_LABEL[outcome]}: ${toolName}`, runId)
        resolve(outcome)
      }
      const onAbort = (): void => settle('cancelled', `cancelled: ${toolName} (the ask was withdrawn)`)

      pending.set(id, {
        id,
        toolName,
        ...question.callId === undefined ? {} : { callId: question.callId },
        ...question.reason === undefined ? {} : { reason: question.reason },
        runId,
        askedAt: Date.now(),
        briefState: 'none',
        // Optional second arg is operator feedback from the dashboard composer.
        settle: (outcome, feedText) => settle(outcome, feedText),
      })
      timer = setTimeout(
        () => settle('unavailable', `expired: ${toolName} — no answer within ${cfg.answerTimeoutMs}ms`),
        cfg.answerTimeoutMs,
      )
      timer.unref?.()
      question.signal?.addEventListener('abort', onAbort, { once: true })
      state.note(
        'approval',
        `asked: ${toolName}${question.reason === undefined ? '' : ` — ${firstLine(question.reason)}`}`,
        runId,
      )
    })
  }

  const handle: DashboardHandle = {
    get url() {
      const address = server.address()
      if (address === null || typeof address === 'string') return ''
      return `http://${cfg.host === '0.0.0.0' ? '127.0.0.1' : cfg.host}:${address.port}/`
    },
    get token() {
      return cfg.token
    },
    ready,
    answer,
    stop,
    briefs,
    pendingSnapshot: () => [...pending.values()].map(({ settle: _settle, ...rest }) => ({ ...rest })),
  }
  return handle
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}
