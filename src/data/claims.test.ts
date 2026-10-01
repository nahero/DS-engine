import { describe, expect, it } from 'vitest'
import { claims, compareNeedsAttention, getClaim, needsAttentionRank } from './claims'
import type { Claim } from './types'

function claim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: 'CLM-2026-000001',
    policyholder: 'Test Person',
    lob: 'Motor',
    lossDate: '2026-01-01',
    reportedDate: '2026-01-02',
    slaDays: 5,
    status: 'In review',
    confidence: 95,
    flag: null,
    claimed: 1000,
    handler: 'Emily Carter',
    policyNo: 'POL-TEST-0001',
    ...overrides,
  }
}

describe('needsAttentionRank', () => {
  it('ranks overdue first, even when other problems exist', () => {
    expect(needsAttentionRank(claim({ slaDays: -1, flag: 'Agent failed', confidence: null }))).toBe(0)
  })
  it('ranks agent failed after overdue', () => {
    expect(needsAttentionRank(claim({ flag: 'Agent failed', confidence: null }))).toBe(1)
  })
  it('ranks low confidence next', () => {
    expect(needsAttentionRank(claim({ confidence: 52 }))).toBe(2)
    expect(needsAttentionRank(claim({ confidence: 69 }))).toBe(2)
    expect(needsAttentionRank(claim({ confidence: 70 }))).toBe(4)
  })
  it('ranks missing data (no score or unassigned) next', () => {
    expect(needsAttentionRank(claim({ confidence: null }))).toBe(3)
    expect(needsAttentionRank(claim({ handler: null }))).toBe(3)
  })
  it('ranks everything else last', () => {
    expect(needsAttentionRank(claim())).toBe(4)
  })
  it('treats due today (0) and no SLA (null) as not overdue', () => {
    expect(needsAttentionRank(claim({ slaDays: 0 }))).toBe(4)
    expect(needsAttentionRank(claim({ slaDays: null }))).toBe(4)
  })
})

describe('compareNeedsAttention', () => {
  it('orders overdue, agent failed, low confidence, missing data, then the rest', () => {
    const rest = claim({ id: 'CLM-2026-000005' })
    const missing = claim({ id: 'CLM-2026-000004', handler: null })
    const low = claim({ id: 'CLM-2026-000003', confidence: 40 })
    const failed = claim({ id: 'CLM-2026-000002', flag: 'Agent failed', confidence: null })
    const overdue = claim({ id: 'CLM-2026-000001', slaDays: -3 })
    const sorted = [rest, missing, low, failed, overdue].sort(compareNeedsAttention)
    expect(sorted.map((c) => c.id)).toEqual([overdue, failed, low, missing, rest].map((c) => c.id))
  })
  it('breaks ties by oldest reported date first', () => {
    const older = claim({ id: 'CLM-2026-000009', reportedDate: '2026-03-01' })
    const newer = claim({ id: 'CLM-2026-000001', reportedDate: '2026-03-05' })
    expect([newer, older].sort(compareNeedsAttention)).toEqual([older, newer])
  })
  it('falls back to id for a stable order', () => {
    const a = claim({ id: 'CLM-2026-000001' })
    const b = claim({ id: 'CLM-2026-000002' })
    expect([b, a].sort(compareNeedsAttention)).toEqual([a, b])
  })
})

describe('generated claims', () => {
  it('has exactly 1,000 claims with unique ids', () => {
    expect(claims).toHaveLength(1000)
    expect(new Set(claims.map((c) => c.id)).size).toBe(1000)
  })

  it('starts with the 12 Figma rows', () => {
    const first = claims.slice(0, 12)
    expect(first.map((c) => c.id)).toEqual([
      'CLM-2026-004821',
      'CLM-2026-004819',
      'CLM-2026-004817',
      'CLM-2026-004812',
      'CLM-2026-004809',
      'CLM-2026-004806',
      'CLM-2026-004803',
      'CLM-2026-004799',
      'CLM-2026-004795',
      'CLM-2026-004790',
      'CLM-2026-004788',
      'CLM-2026-004781',
    ])
    expect(first[0]).toMatchObject({ policyholder: 'Michael Johnson', claimed: 8920, slaDays: -1, confidence: 52 })
    expect(first[2]).toMatchObject({ policyholder: 'Sarah Mitchell', claimed: 12480, flag: 'Above authority limit' })
    expect(first[7].claimed).toBe(870.5)
    expect(first[11].claimed).toBe(1015.2)
  })

  it('reports every claim after its loss', () => {
    const bad = claims.filter((c) => !(c.lossDate < c.reportedDate)).map((c) => c.id)
    expect(bad).toEqual([])
  })

  it('has roughly 5–12% claims without a confidence score', () => {
    const ratio = claims.filter((c) => c.confidence === null).length / claims.length
    expect(ratio).toBeGreaterThanOrEqual(0.05)
    expect(ratio).toBeLessThanOrEqual(0.12)
  })

  it('has no SLA only for Paid, Denied and Closed claims', () => {
    const closed = new Set(['Paid', 'Denied', 'Closed'])
    const bad = claims.filter((c) => (c.slaDays === null) !== closed.has(c.status)).map((c) => c.id)
    expect(bad).toEqual([])
  })

  it('looks claims up by id', () => {
    expect(getClaim('CLM-2026-004817')?.policyholder).toBe('Sarah Mitchell')
    expect(getClaim('CLM-0000-000000')).toBeUndefined()
  })
})
