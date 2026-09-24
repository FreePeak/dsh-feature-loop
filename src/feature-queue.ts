/**
 * Durable feature queue and worktree admission.
 *
 * The queue owns admission and campaign reservations; it does not run git or a
 * model. A single coordinator claims one item, creates its worktree, and
 * settles the reservation only after the independent verifier reports the
 * final result.
 */

import { appendFileSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, unlinkSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { CampaignBudget, type CampaignBudgetSnapshot } from './campaign-budget.ts'

export const DEFAULT_QUEUE_PATH = '.feature-loop/queue.jsonl'

export type FeatureStatus = 'queued' | 'running' | 'awaiting-human' | 'verified' | 'failed' | 'cancelled'

export interface FeatureItem {
  id: string
  objective: string
  verificationCommand: string
  worktreePath: string
  branch: string
  baseCommit: string
  priority: number
  createdAt: number
  status: FeatureStatus
  claimId?: string
  owner?: string
  leaseUntil?: number
  reservedUSD?: number
  spentUSD?: number
  lastError?: string
}

export interface FeatureInput {
  id: string
  objective: string
  verificationCommand: string
  worktreePath: string
  branch: string
  baseCommit: string
  priority?: number
}

type QueueEvent =
  | { at: number, type: 'enqueued', item: FeatureItem }
  | { at: number, type: 'claimed', id: string, claimId: string, owner: string, leaseUntil: number, reservedUSD: number }
  | { at: number, type: 'awaiting-human', id: string, claimId: string, owner: string, reason: string }
  | { at: number, type: 'settled', id: string, claimId: string, owner: string, costUSD: number, outcome: 'verified' | 'failed' }
  | { at: number, type: 'released', id: string, claimId: string, owner: string }
  | { at: number, type: 'cancelled', id: string }

export interface FeatureQueueOptions {
  path?: string
  baseRoot: string
  worktreeRoot?: string
  campaignLimitUSD?: number
  leaseMs?: number
  now?: () => number
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be finite`)
  return value
}

function text(value: unknown, label: string, max = 10_000): string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
    throw new TypeError(`${label} must be a non-empty string of at most ${max} characters`)
  }
  return value.trim()
}

function id(value: string): string {
  const result = text(value, 'feature id', 100)
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(result)) throw new TypeError('feature id contains unsafe characters')
  return result
}

function owner(value: string): string {
  const result = text(value, 'queue owner', 200)
  if (!/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/.test(result)) throw new TypeError('queue owner contains unsafe characters')
  return result
}

function branch(value: string): string {
  const result = text(value, 'worktree branch', 200)
  if (!/^dsh\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(result) || result.includes('..')) {
    throw new TypeError('worktree branch must be a dsh/* branch without path traversal')
  }
  return result
}

function baseCommit(value: string): string {
  const result = text(value, 'base commit', 100)
  if (!/^[0-9a-f]{40}$/i.test(result)) throw new TypeError('base commit must be a full 40-character Git SHA')
  return result.toLowerCase()
}

function usd(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and non-negative`)
  return value
}

function parseItem(value: unknown): FeatureItem {
  if (!record(value)) throw new TypeError('queue enqueued item must be an object')
  const status = value.status
  if (status !== 'queued') throw new TypeError('enqueued queue item must start queued')
  const item: FeatureItem = {
    id: id(text(value.id, 'feature id', 100)),
    objective: text(value.objective, 'feature objective'),
    verificationCommand: text(value.verificationCommand, 'verification command'),
    worktreePath: text(value.worktreePath, 'worktree path', 2_000),
    branch: branch(text(value.branch, 'worktree branch', 200)),
    baseCommit: baseCommit(text(value.baseCommit, 'base commit', 100)),
    priority: finite(value.priority, 'feature priority'),
    createdAt: finite(value.createdAt, 'feature creation time'),
    status,
  }
  if (item.priority < 0 || item.priority > 1_000) throw new RangeError('feature priority must be between 0 and 1000')
  return item
}

function parseEvent(value: unknown): QueueEvent {
  if (!record(value) || typeof value.type !== 'string') throw new TypeError('queue event must be an object with a type')
  const at = finite(value.at, 'queue event time')
  if (value.type === 'enqueued') return { at, type: 'enqueued', item: parseItem(value.item) }
  const eventId = id(text(value.id, 'queue event feature id', 100))
  if (value.type === 'claimed') {
    return {
      at,
      type: 'claimed',
      id: eventId,
      claimId: text(value.claimId, 'claim id', 200),
      owner: owner(text(value.owner, 'queue owner', 200)),
      leaseUntil: finite(value.leaseUntil, 'claim lease'),
      reservedUSD: usd(finite(value.reservedUSD, 'feature reservation'), 'feature reservation'),
    }
  }
  const claimId = text(value.claimId, 'claim id', 200)
  if (value.type === 'awaiting-human') return { at, type: 'awaiting-human', id: eventId, claimId, owner: owner(text(value.owner, 'queue owner', 200)), reason: text(value.reason, 'human gate reason', 2_000) }
  if (value.type === 'settled') {
    if (value.outcome !== 'verified' && value.outcome !== 'failed') throw new TypeError('queue settlement outcome is invalid')
    return { at, type: 'settled', id: eventId, claimId, owner: owner(text(value.owner, 'queue owner', 200)), costUSD: usd(finite(value.costUSD, 'settled feature cost'), 'settled feature cost'), outcome: value.outcome }
  }
  if (value.type === 'released') return { at, type: 'released', id: eventId, claimId, owner: owner(text(value.owner, 'queue owner', 200)) }
  if (value.type === 'cancelled') return { at, type: 'cancelled', id: eventId }
  throw new TypeError(`unknown queue event type ${JSON.stringify(value.type)}`)
}

/** Read a queue log, rejecting corruption rather than silently dropping work. */
export function readQueueEvents(path: string): QueueEvent[] {
  if (!existsSync(path)) return []
  const raw = readFileSync(path, 'utf8')
  if (raw !== '' && !raw.endsWith('\n')) throw new Error('queue log is missing its final newline')
  const events: QueueEvent[] = []
  const lines = raw.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === '') continue
    try {
      events.push(parseEvent(JSON.parse(line)))
    } catch {
      throw new Error(`queue log is corrupt at line ${index + 1}`)
    }
  }
  return events
}

/** A durable, single-writer feature queue with one shared campaign allowance. */
export class FeatureQueue {
  readonly path: string
  readonly baseRoot: string
  readonly worktreeRoot: string
  readonly campaignLimitUSD: number
  readonly leaseMs: number
  private readonly now: () => number
  private readonly items = new Map<string, FeatureItem>()
  private budget: CampaignBudget

  constructor(options: FeatureQueueOptions) {
    this.path = options.path ?? join(options.baseRoot, DEFAULT_QUEUE_PATH)
    this.baseRoot = resolve(options.baseRoot)
    this.worktreeRoot = resolve(options.worktreeRoot ?? join(this.baseRoot, '.worktrees'))
    this.campaignLimitUSD = options.campaignLimitUSD ?? 1
    this.leaseMs = options.leaseMs ?? 15 * 60_000
    this.now = options.now ?? Date.now
    this.budget = new CampaignBudget(this.campaignLimitUSD)
    this.refresh()
  }

  /** Admit an item only into an isolated worktree and safe branch. */
  enqueue(input: FeatureInput): FeatureItem {
    return this.withLock(() => {
      const item: FeatureItem = {
        id: id(input.id),
        objective: text(input.objective, 'feature objective'),
        verificationCommand: text(input.verificationCommand, 'verification command'),
        worktreePath: this.validateWorktree(input.worktreePath),
        branch: branch(input.branch),
        baseCommit: baseCommit(input.baseCommit),
        priority: input.priority ?? 0,
        createdAt: this.now(),
        status: 'queued',
      }
      if (!Number.isFinite(item.priority) || item.priority < 0 || item.priority > 1_000) throw new RangeError('feature priority must be between 0 and 1000')
      const existing = this.items.get(item.id)
      if (existing !== undefined) {
        if (JSON.stringify({ ...existing, status: undefined, createdAt: undefined }) === JSON.stringify({ ...item, status: undefined, createdAt: undefined })) return existing
        throw new Error(`feature ${item.id} is already queued with different input`)
      }
      return this.commit({ at: item.createdAt, type: 'enqueued', item })
    })
  }

  /** Claim the highest-priority queued item, reserving its campaign share atomically. */
  claimNext(ownerName: string, reservedUSD: number): FeatureItem | undefined {
    return this.withLock(() => {
      const claimant = owner(ownerName)
      const reservation = usd(reservedUSD, 'feature reservation')
      const next = [...this.items.values()].filter(item => item.status === 'queued').sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0]
      if (next === undefined) return undefined
      return this.commit({ at: this.now(), type: 'claimed', id: next.id, claimId: randomUUID(), owner: claimant, leaseUntil: this.now() + this.leaseMs, reservedUSD: reservation })
    })
  }

  markAwaitingHuman(featureId: string, claimId: string, reason: string): FeatureItem {
    return this.withLock(() => {
      const item = this.required(featureId)
      if (item.status === 'awaiting-human' && item.claimId === claimId) return item
      if (item.status !== 'running' || item.claimId !== claimId) throw new Error(`feature ${item.id} is not claimed by ${claimId}`)
      return this.commit({ at: this.now(), type: 'awaiting-human', id: item.id, claimId, owner: item.owner!, reason: text(reason, 'human gate reason', 2_000) })
    })
  }

  settle(featureId: string, claimId: string, costUSD: number, outcome: 'verified' | 'failed'): FeatureItem {
    return this.withLock(() => {
      const item = this.required(featureId)
      const cost = usd(costUSD, 'settled feature cost')
      if ((item.status === 'verified' || item.status === 'failed') && item.spentUSD === cost && item.status === outcome && item.claimId === claimId) return item
      if ((item.status !== 'running' && item.status !== 'awaiting-human') || item.claimId !== claimId) throw new Error(`feature ${item.id} is not active for ${claimId}`)
      return this.commit({ at: this.now(), type: 'settled', id: item.id, claimId, owner: item.owner!, costUSD: cost, outcome })
    })
  }

  release(featureId: string, claimId: string): FeatureItem {
    return this.withLock(() => {
      const item = this.required(featureId)
      if (item.status === 'queued' && item.claimId === undefined) return item
      if (item.status !== 'running' || item.claimId !== claimId) throw new Error(`feature ${item.id} is not active for ${claimId}`)
      return this.commit({ at: this.now(), type: 'released', id: item.id, claimId, owner: item.owner! })
    })
  }

  cancel(featureId: string): FeatureItem {
    return this.withLock(() => {
      const item = this.required(featureId)
      if (item.status === 'cancelled') return item
      if (item.status === 'verified' || item.status === 'failed') throw new Error(`feature ${item.id} is already settled`)
      return this.commit({ at: this.now(), type: 'cancelled', id: item.id })
    })
  }

  get(featureId: string): FeatureItem | undefined {
    return this.withLock(() => {
      const item = this.items.get(id(featureId))
      return item === undefined ? undefined : structuredClone(item)
    })
  }

  list(): FeatureItem[] {
    return this.withLock(() => [...this.items.values()].sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt || a.id.localeCompare(b.id)).map(item => structuredClone(item)))
  }

  budgetSnapshot(): CampaignBudgetSnapshot {
    return this.withLock(() => this.budget.snapshot())
  }

  private required(featureId: string): FeatureItem {
    const item = this.items.get(id(featureId))
    if (item === undefined) throw new Error(`unknown feature ${featureId}`)
    return item
  }

  private withLock<T>(operation: () => T): T {
    mkdirSync(dirname(this.path), { recursive: true })
    const lockPath = `${this.path}.lock`
    let handle: number
    try {
      handle = openSync(lockPath, 'wx', 0o600)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error(`queue is locked by another writer: ${lockPath}`)
      throw error
    }
    try {
      this.refresh()
      return operation()
    } finally {
      closeSync(handle)
      try { unlinkSync(lockPath) } catch { /* the operation result remains authoritative */ }
    }
  }

  private refresh(): void {
    this.items.clear()
    this.budget = new CampaignBudget(this.campaignLimitUSD)
    for (const event of readQueueEvents(this.path)) this.apply(event)
  }

  private validateWorktree(value: string): string {
    const candidate = resolve(text(value, 'worktree path', 2_000))
    const rel = relative(this.worktreeRoot, candidate)
    if (candidate === this.baseRoot || rel === '' || rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) throw new TypeError('worktree path must be a child of the configured .worktrees directory')
    let current = candidate
    while (current !== this.worktreeRoot) {
      if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new TypeError('worktree path must not traverse a symbolic link')
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
    return candidate
  }

  private commit(event: QueueEvent): FeatureItem {
    mkdirSync(dirname(this.path), { recursive: true })
    appendFileSync(this.path, `${JSON.stringify(event)}\n`, { encoding: 'utf8', flag: 'a' })
    this.apply(event)
    const item = this.items.get(event.type === 'enqueued' ? event.item.id : event.id)
    if (item === undefined) throw new Error(`queue event ${event.type} has no item`)
    return structuredClone(item)
  }

  private apply(event: QueueEvent): void {
    if (event.type === 'enqueued') {
      if (this.items.has(event.item.id)) throw new Error(`duplicate feature ${event.item.id} in queue log`)
      this.items.set(event.item.id, structuredClone(event.item))
      return
    }
    const item = this.required(event.id)
    if (event.type === 'claimed') {
      if (item.status === 'running' && item.claimId === event.claimId && item.owner === event.owner && item.reservedUSD === event.reservedUSD) return
      if (item.status !== 'queued') throw new Error(`queue log claims ${event.id} from ${item.status}`)
      this.budget.reserve(item.id, event.reservedUSD)
      Object.assign(item, { status: 'running', claimId: event.claimId, owner: event.owner, leaseUntil: event.leaseUntil, reservedUSD: event.reservedUSD })
      return
    }
    if (event.type === 'awaiting-human') {
      if (item.status !== 'running' || item.claimId !== event.claimId || item.owner !== event.owner) throw new Error(`queue log gates ${event.id} from ${item.status}`)
      Object.assign(item, { status: 'awaiting-human', lastError: event.reason })
      return
    }
    if (event.type === 'released') {
      if (item.status === 'queued' && item.claimId === undefined) return
      if (item.status !== 'running' || item.claimId !== event.claimId || item.owner !== event.owner) throw new Error(`queue log releases ${event.id} from ${item.status}`)
      this.budget.release(item.id)
      Object.assign(item, { status: 'queued', claimId: undefined, owner: undefined, leaseUntil: undefined, reservedUSD: undefined, lastError: undefined })
      return
    }
    if (event.type === 'cancelled') {
      if (item.status === 'cancelled') return
      if (item.status === 'verified' || item.status === 'failed') throw new Error(`queue log cancels settled ${event.id}`)
      if (item.reservedUSD !== undefined) this.budget.release(item.id)
      Object.assign(item, { status: 'cancelled', claimId: undefined, owner: undefined, leaseUntil: undefined, reservedUSD: undefined })
      return
    }
    if ((item.status === 'verified' || item.status === 'failed') && item.spentUSD === event.costUSD && item.status === event.outcome && item.claimId === event.claimId) return
    if ((item.status !== 'running' && item.status !== 'awaiting-human') || item.claimId !== event.claimId || item.owner !== event.owner) throw new Error(`queue log settles ${event.id} from ${item.status}`)
    this.budget.settle(item.id, event.costUSD)
    Object.assign(item, { status: event.outcome, spentUSD: event.costUSD, reservedUSD: undefined, leaseUntil: undefined, lastError: undefined })
  }
}
