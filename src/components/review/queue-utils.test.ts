import { describe, expect, it } from 'vitest'
import { claims } from '@/data/claims'
import type { Claim } from '@/data/types'
import { UNASSIGNED, activeChips, applyFilters, countNotHighConfidence, emptyFilters, hasActiveFilters, sortLabel } from './queue-utils'

function claim(overrides: Partial<Claim>): Claim {
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

const sample: Claim[] = [
  claim({ id: 'CLM-2026-000001', policyholder: 'Sarah Mitchell', lob: 'Health', status: 'In review', confidence: 71, handler: 'Emily Carter' }),
  claim({ id: 'CLM-2026-000002', policyholder: 'James Wilson', lob: 'Motor', status: 'New', confidence: 95, handler: null }),
  claim({ id: 'CLM-2026-000003', policyholder: 'Montgomery-Whitfield Property Holdings LLC', lob: 'Property', status: 'New', confidence: null, handler: null }),
  claim({ id: 'CLM-2026-000004', policyholder: 'Olivia Bennett', lob: 'Travel', status: 'Paid', confidence: 52, handler: 'Rachel Morgan' }),
]

const ids = (rows: Claim[]) => rows.map((c) => c.id)

describe('applyFilters', () => {
  it('returns everything for empty filters', () => {
    expect(applyFilters(sample, emptyFilters)).toHaveLength(4)
  })

  it('filters by status', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, status: 'New' }))).toEqual(['CLM-2026-000002', 'CLM-2026-000003'])
  })

  it('filters by line of business', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, lob: 'Travel' }))).toEqual(['CLM-2026-000004'])
  })

  it('filters by confidence band', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, confidence: 'High' }))).toEqual(['CLM-2026-000002'])
    expect(ids(applyFilters(sample, { ...emptyFilters, confidence: 'Medium' }))).toEqual(['CLM-2026-000001'])
    expect(ids(applyFilters(sample, { ...emptyFilters, confidence: 'Low' }))).toEqual(['CLM-2026-000004'])
  })

  it('filters claims without a score with "No score"', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, confidence: 'No score' }))).toEqual(['CLM-2026-000003'])
  })

  it('filters by handler name', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, handler: 'Rachel Morgan' }))).toEqual(['CLM-2026-000004'])
  })

  it('filters unassigned claims with the "Unassigned" handler', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, handler: UNASSIGNED }))).toEqual(['CLM-2026-000002', 'CLM-2026-000003'])
  })

  it('searches by claim id, case-insensitively', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, query: 'clm-2026-000003' }))).toEqual(['CLM-2026-000003'])
    expect(ids(applyFilters(sample, { ...emptyFilters, query: '000002' }))).toEqual(['CLM-2026-000002'])
  })

  it('searches by policyholder, case-insensitively and ignoring surrounding spaces', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, query: '  SARAH mit ' }))).toEqual(['CLM-2026-000001'])
    expect(ids(applyFilters(sample, { ...emptyFilters, query: 'property holdings' }))).toEqual(['CLM-2026-000003'])
  })

  it('returns nothing when the search matches nothing', () => {
    expect(applyFilters(sample, { ...emptyFilters, query: 'zzz' })).toEqual([])
  })

  it('combines filters with AND', () => {
    expect(ids(applyFilters(sample, { ...emptyFilters, status: 'New', handler: UNASSIGNED, confidence: 'No score' }))).toEqual(['CLM-2026-000003'])
    expect(applyFilters(sample, { ...emptyFilters, status: 'Paid', lob: 'Motor' })).toEqual([])
    expect(ids(applyFilters(sample, { ...emptyFilters, query: 'wilson', status: 'New' }))).toEqual(['CLM-2026-000002'])
  })

  it('works on the full dataset without mutating it', () => {
    const before = claims.length
    const motor = applyFilters(claims, { ...emptyFilters, lob: 'Motor' })
    expect(motor.length).toBeGreaterThan(0)
    expect(motor.every((c) => c.lob === 'Motor')).toBe(true)
    expect(claims).toHaveLength(before)
  })
})

describe('activeChips / hasActiveFilters', () => {
  it('has no chips for empty filters', () => {
    expect(activeChips(emptyFilters)).toEqual([])
    expect(hasActiveFilters(emptyFilters)).toBe(false)
  })
  it('has one chip per active filter', () => {
    const chips = activeChips({ query: 'wil', status: 'New', lob: 'Motor', confidence: 'Low', handler: UNASSIGNED })
    expect(chips.map((c) => c.key)).toEqual(['query', 'status', 'lob', 'confidence', 'handler'])
  })
  it('ignores a whitespace-only search', () => {
    expect(hasActiveFilters({ ...emptyFilters, query: '   ' })).toBe(false)
  })
})

describe('countNotHighConfidence', () => {
  it('counts claims that are not High confidence, including unscored ones', () => {
    expect(countNotHighConfidence(sample)).toBe(3)
  })
  it('counts the 90 boundary as High and 89 as not', () => {
    expect(countNotHighConfidence([claim({ confidence: 90 }), claim({ confidence: 89 })])).toBe(1)
  })
  it('is 0 for an empty selection', () => {
    expect(countNotHighConfidence([])).toBe(0)
  })
})

describe('sortLabel', () => {
  it('defaults to Needs attention', () => {
    expect(sortLabel([])).toBe('Needs attention')
  })
  it('describes the active sort', () => {
    expect(sortLabel([{ id: 'confidence', desc: true }])).toBe('Confidence (descending)')
    expect(sortLabel([{ id: 'claimed', desc: false }])).toBe('Claimed (ascending)')
  })
})
