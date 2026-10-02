/**
 * The bridge between this dashboard's approval vocabulary and assistant-ui's.
 *
 * Deliberately **pure and dependency-free**: no `@assistant-ui/*` import, no
 * `node:*` import. Two reasons, and the second is the important one.
 *
 * 1. The mapping is the part most likely to be got subtly wrong — an option
 *    kind named differently from the outcome it produces is a silent
 *    mis-authorisation, not a crash. Keeping it functional makes every case
 *    assertable without a browser or a runtime.
 * 2. CI's `test` job runs with no `node_modules` at all. A module that
 *    imports `@assistant-ui/react` cannot be covered there; this one can, so
 *    the mapping ships with real checks instead of only browser exercises.
 *
 * The vocabularies line up almost exactly, which is why assistant-ui is a
 * good fit here:
 *
 *   assistant-ui                        this dashboard
 *   `allow-once` / `reject-once`   <->  `allowed-once` / `rejected`
 *   `resolution: 'expired'`        <->  `unavailable`
 *   `resolution: 'cancelled'`      <->  `cancelled`
 *
 * @module dsh-feature-loop/approval-bridge
 */

/** One ask awaiting a human, as this dashboard tracks it. */
export interface BridgeAsk {
  id: string
  toolName: string
  callId?: string
  reason?: string
  runId?: string
  askedAt: number
}

/** The outcome vocabulary the harness maps to allow/deny. */
export type BridgeOutcome = 'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'

/**
 * A decision an operator can take, in assistant-ui's `ToolApprovalOptionKind`
 * vocabulary. Only the two the dashboard already enforces are offered:
 * `allow-always` and `reject-always` would persist a policy this plugin's
 * gate owns (`gatePolicies` / `actuator`), and offering them here would let a
 * browser click widen the gate behind the deployment's back.
 */
export type ApprovalOptionKind = 'allow-once' | 'reject-once'

/** One selectable decision. */
export interface ApprovalOption {
  id: string
  kind: ApprovalOptionKind
  label: string
}

/** The gate assistant-ui renders for one pending ask. */
export interface ApprovalGate {
  id: string
  /** The question put to the operator: the gate's own reason text. */
  prompt: string
  /** Always a plain allow/deny pair here; the gate never asks a question. */
  display: 'decision'
  options: ApprovalOption[]
  /** Present once decided; never set by this dashboard before then. */
  approved?: boolean
  reason?: string
  /** Terminal non-decision state, when the ask died without an answer. */
  resolution?: 'cancelled' | 'expired'
}

/**
 * The two options every gate offers, in the order a human should read them.
 *
 * Stable ids (`allow-once` / `reject-once`) so a retried or replayed response
 * resolves to the same decision — an id that changed per render would make a
 * late click ambiguous.
 */
export const APPROVAL_OPTIONS: readonly ApprovalOption[] = [
  { id: 'allow-once', kind: 'allow-once', label: 'Allow once' },
  { id: 'reject-once', kind: 'reject-once', label: 'Reject' },
]

/**
 * Build the gate assistant-ui renders for one pending ask.
 *
 * The prompt is the gate's own `reason` — the same string the composer panel
 * shows — falling back to the tool name so the card is never headless. The
 * reason is passed through verbatim: it is the plugin's text, not the
 * model's, and paraphrasing it here would put a second author between the
 * operator and the decision.
 *
 * @param ask - the pending ask.
 * @returns the gate, ready to attach to a tool-call message part.
 */
export function toApprovalGate(ask: BridgeAsk): ApprovalGate {
  const prompt = ask.reason === undefined || ask.reason === ''
    ? `${ask.toolName} needs approval`
    : ask.reason
  return {
    id: ask.id,
    prompt,
    display: 'decision',
    options: APPROVAL_OPTIONS.map(option => ({ ...option })),
  }
}

/**
 * Map a recorded decision back to this dashboard's outcome vocabulary.
 *
 * `optionId` wins when present, because a renderer that sends both is
 * reporting the option the human actually chose; `approved` alone is the
 * boolean fallback for an optionless prompt. An unrecognized `optionId` with
 * `approved: true` resolves to `allowed-once` only when the id is literally
 * the allow option — anything else throws, so an unknown option can never
 * widen into an authorisation.
 *
 * @param response - what assistant-ui reports back.
 * @returns the outcome to POST.
 * @throws when the response names an option this dashboard never offered.
 */
export function outcomeForResponse(response: {
  approved?: boolean
  optionId?: string
}): Extract<BridgeOutcome, 'allowed-once' | 'rejected'> {
  if (response.optionId !== undefined) {
    const known = APPROVAL_OPTIONS.find(option => option.id === response.optionId)
    if (known === undefined) {
      throw new Error(
        `unknown approval option ${JSON.stringify(response.optionId)} — `
        + `this dashboard offers ${APPROVAL_OPTIONS.map(o => o.id).join(', ')}`,
      )
    }
    return known.kind === 'allow-once' ? 'allowed-once' : 'rejected'
  }
  if (response.approved === undefined) {
    throw new Error('approval response carried neither an optionId nor an approved flag')
  }
  // No option was offered, so the boolean is the whole decision. Defaulting a
  // missing flag to `false` would be the only safe direction, but inventing a
  // decision at all is worse than refusing to: the caller has a bug.
  return response.approved ? 'allowed-once' : 'rejected'
}

/**
 * The terminal state to show for an ask that died without a human decision.
 *
 * assistant-ui distinguishes exactly two, and they are not interchangeable:
 * `expired` is "nobody answered in time", `cancelled` is "the ask was
 * withdrawn". Collapsing them would hide from the operator why their card
 * disappeared.
 *
 * @param outcome - the settling outcome.
 * @returns the resolution, or `undefined` for a decided ask.
 */
export function resolutionForOutcome(
  outcome: BridgeOutcome,
): 'cancelled' | 'expired' | undefined {
  if (outcome === 'unavailable') return 'expired'
  if (outcome === 'cancelled') return 'cancelled'
  return undefined
}

/**
 * Whether an outcome means the operator decided (as opposed to the ask dying).
 *
 * @param outcome - the settling outcome.
 * @returns true when a human's click produced it.
 */
export function isDecided(outcome: BridgeOutcome): boolean {
  return outcome === 'allowed-once' || outcome === 'rejected'
}

/** The host-remote answer shape the browser sees for one settle call. */
export type SettleAnswer =
  | { ok: true, value: { settled: boolean } }
  | { ok: false, error: { message: string } }

/**
 * Reject a settle call the operator should be told about.
 *
 * Only a transport/host failure is an error. `settled: false` is **not**:
 * it means the ask was already resolved — the composer answered it, another
 * tab answered it, or the same click arrived twice — and the ask is closed
 * either way.
 *
 * This distinction is the whole difference between a card that clears and a
 * card that stays on screen with live buttons. Throwing on `settled: false`
 * skipped every state update that would have taken the card out of the
 * thread, so the button stayed clickable and re-reported the same dead error
 * on every subsequent click, forever.
 *
 * @param answer - the host remote's answer to the settle call.
 * @throws the host's message when the call itself failed.
 */
export function assertSettleAccepted(answer: SettleAnswer): void {
  if (!answer.ok) throw new Error(answer.error.message)
}

// ── approval postures ─────────────────────────────────────────────────────
// These live here, not in remote.ts, because the settings page runs in the
// browser: remote.ts imports node:fs and would drag a node bundle into a
// client that must never have one. approval-bridge is already the module both
// sides import, and it stays dependency-free so CI's no-install job covers it.

/** A tool class a gate policy can name. */
export type GatePolicyClass = 'read' | 'glob' | 'grep' | 'edit' | 'write' | 'bash'

/** The policy for one tool class. */
export type GatePolicyValue = 'auto' | 'auto-if-confident' | 'always-approve'

/** Per-class gate policy, as written to the config file. */
export type GatePolicyMap = Partial<Record<GatePolicyClass, GatePolicyValue>>


export const APPROVAL_MODES = {
  'review-risky': {
    label: 'Review at risky steps',
    detail: 'Reads never interrupt. A write is reviewed when the loop has no confidence to judge it.',
    policies: {
      read: 'auto', glob: 'auto', grep: 'auto',
      edit: 'auto-if-confident', write: 'auto-if-confident', bash: 'auto-if-confident',
    },
  },
  'approve-every-step': {
    label: 'Approve every step',
    detail: 'Every write, edit and shell command waits for you. Nothing changes without a click.',
    policies: {
      read: 'auto', glob: 'auto', grep: 'auto',
      edit: 'always-approve', write: 'always-approve', bash: 'always-approve',
    },
  },
} as const

/** Name of an approval posture, as the settings page writes it. */
export type ApprovalModeName = keyof typeof APPROVAL_MODES


/**
 * Classify a policy map as one of the known approval postures.
 *
 * A hand-edited map rarely matches a mode exactly, so the answer is the
 * closest one: "every step" only when every write class actually asks.
 *
 * @param policies - the configured map, if any.
 * @returns the posture that describes it.
 */
export function approvalModeFor(policies: GatePolicyMap | undefined): ApprovalModeName {
  const asked = GATE_POLICY_CLASSES
    .filter(c => c !== 'read' && c !== 'glob' && c !== 'grep' && policies?.[c] === 'always-approve').length
  const writeClasses = GATE_POLICY_CLASSES.filter(c => c !== 'read' && c !== 'glob' && c !== 'grep')
  return asked === writeClasses.length ? 'approve-every-step' : 'review-risky'
}

/** Every tool class a policy may name, for validation and error messages. */
export const GATE_POLICY_CLASSES: GatePolicyClass[] = ['read', 'glob', 'grep', 'edit', 'write', 'bash']

/** Every policy a class may carry, for validation and error messages. */
export const GATE_POLICY_VALUES: GatePolicyValue[] = ['auto', 'auto-if-confident', 'always-approve']

/** The label `approvals.ts` writes for each outcome, inverted. */
const OUTCOME_BY_LABEL: Record<string, BridgeOutcome> = {
  'allowed once': 'allowed-once',
  rejected: 'rejected',
  cancelled: 'cancelled',
  expired: 'unavailable',
}

/**
 * The outcome of every settled ask named in the activity feed, keyed by ask id.
 *
 * `approvals.ts` writes `<label>: <tool> [<id>]` into the feed when an ask
 * settles, which is the only place the ID survives the ask leaving `pending`.
 * The page needs it because the card is built from the pending list: when an ask
 * expires or aborts, the list no longer has it, so the card would simply
 * vanish and the operator would watch a decision disappear with nothing named.
 *
 * Parsing the feed rather than growing the payload is deliberate — the feed is
 * already the place a human reads what happened, and a second channel saying the
 * same thing would be a second thing to keep in sync. The shape it reads is one
 * line this repo writes; `test/approval-bridge.test.ts` pins both directions,
 * including that a line without an id is ignored rather than guessed at.
 *
 * @param feed - the snapshot's feed, oldest first.
 * @returns ask id to outcome, for every ask the feed names an outcome for.
 */
export function expiredOutcomeOf(
  feed: readonly { text: string }[],
): ReadonlyMap<string, BridgeOutcome> {
  const out = new Map<string, BridgeOutcome>()
  for (const entry of feed) {
    if (entry.text === undefined || typeof entry.text !== 'string') continue
    const m = /^(allowed once|rejected|cancelled|expired): .+ \[([0-9a-f-]{36})\]$/.exec(entry.text)
    if (m === null) continue
    const outcome = OUTCOME_BY_LABEL[m[1] as keyof typeof OUTCOME_BY_LABEL]
    if (outcome !== undefined) out.set(m[2], outcome)
  }
  return out
}

