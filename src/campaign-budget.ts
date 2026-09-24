/**
 * Campaign-wide budget reservations for many feature-loop runs.
 *
 * Per-turn ledgers observe spend. This class prevents many concurrent or
 * sequential features from each receiving the whole campaign allowance.
 */

export interface CampaignBudgetSnapshot {
  limitUSD: number
  spentUSD: number
  reservedUSD: number
  availableUSD: number
  reservations: Readonly<Record<string, number>>
  settled: Readonly<Record<string, number>>
}

function amount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and non-negative`)
  return value
}

/** Reserve, settle, or release campaign funds with idempotent item ownership. */
export class CampaignBudget {
  readonly limitUSD: number
  private readonly reserved = new Map<string, number>()
  private readonly spent = new Map<string, number>()
  private spentUSD = 0

  constructor(limitUSD: number) {
    if (!Number.isFinite(limitUSD) || limitUSD <= 0) {
      throw new RangeError('campaign budget must be finite and greater than zero')
    }
    this.limitUSD = limitUSD
  }

  private get reservedUSD(): number {
    let total = 0
    for (const value of this.reserved.values()) total += value
    return total
  }

  get availableUSD(): number {
    return Math.max(0, this.limitUSD - this.spentUSD - this.reservedUSD)
  }

  /** Reserve one item's allowance; an identical duplicate is idempotent. */
  reserve(itemId: string, usd: number): CampaignBudgetSnapshot {
    const key = this.key(itemId)
    const value = amount(usd, 'reservation')
    const existing = this.reserved.get(key)
    if (existing !== undefined) {
      if (existing !== value) throw new Error(`campaign reservation for ${key} already exists with a different amount`)
      return this.snapshot()
    }
    if (this.spent.has(key)) throw new Error(`campaign item ${key} is already settled`)
    if (value > this.availableUSD) {
      throw new Error(`campaign budget exhausted: $${value.toFixed(4)} requested, $${this.availableUSD.toFixed(4)} available`)
    }
    this.reserved.set(key, value)
    return this.snapshot()
  }

  /** Convert a reservation into observed spend. A second settle is a no-op. */
  settle(itemId: string, actualUSD: number): CampaignBudgetSnapshot {
    const key = this.key(itemId)
    const value = amount(actualUSD, 'settled spend')
    const previous = this.spent.get(key)
    if (previous !== undefined) {
      if (previous !== value) throw new Error(`campaign item ${key} is already settled with a different amount`)
      return this.snapshot()
    }
    if (!this.reserved.has(key)) throw new Error(`campaign item ${key} has no active reservation`)
    this.reserved.delete(key)
    this.spent.set(key, value)
    this.spentUSD += value
    return this.snapshot()
  }

  /** Return an unused reservation after cancellation or pre-start failure. */
  release(itemId: string): CampaignBudgetSnapshot {
    const key = this.key(itemId)
    if (!this.reserved.delete(key)) {
      if (this.spent.has(key)) throw new Error(`campaign item ${key} is already settled`)
      throw new Error(`campaign item ${key} has no active reservation`)
    }
    return this.snapshot()
  }

  snapshot(): CampaignBudgetSnapshot {
    return {
      limitUSD: this.limitUSD,
      spentUSD: this.spentUSD,
      reservedUSD: this.reservedUSD,
      availableUSD: this.availableUSD,
      reservations: Object.fromEntries([...this.reserved].sort(([a], [b]) => a.localeCompare(b))),
      settled: Object.fromEntries([...this.spent].sort(([a], [b]) => a.localeCompare(b))),
    }
  }

  private key(itemId: string): string {
    const key = itemId.trim()
    if (key === '') throw new TypeError('campaign item id must not be empty')
    return key
  }
}
