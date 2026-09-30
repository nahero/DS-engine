import { describe, expect, it } from 'vitest'
import { AUTHORITY_LIMIT } from '@/data/claim-detail'
import type { ExtractedField, Payout } from '@/data/types'
import { derivePayout, fieldState, formatIban, maskIban, maskPolicyNo, sortFields } from './claim-utils'

function field(overrides: Partial<ExtractedField> = {}): ExtractedField {
  return {
    id: 'f',
    label: 'Field',
    value: 'Value',
    confidence: 95,
    source: { doc: 'FNOL', page: 1 },
    ...overrides,
  }
}

describe('derivePayout', () => {
  it('pays claimed minus deductible when within the limit', () => {
    const r = derivePayout({ claimed: 3000, deductible: 500, limit: 50000 })
    expect(r).toMatchObject({ missing: null, denied: false, covered: 2500, payable: 2500, capped: false, notCovered: 0, overAuthority: false })
  })

  it('flags payouts above the authority limit', () => {
    const r = derivePayout({ claimed: 12480, deductible: 500, limit: 50000 })
    expect(r.payable).toBe(11980)
    expect(r.overAuthority).toBe(true)
  })

  it('does not flag a payout exactly at the authority limit', () => {
    const r = derivePayout({ claimed: AUTHORITY_LIMIT + 500, deductible: 500, limit: 50000 })
    expect(r.payable).toBe(AUTHORITY_LIMIT)
    expect(r.overAuthority).toBe(false)
  })

  it('caps the payout at the policy limit and reports the uncovered amount', () => {
    const r = derivePayout({ claimed: 6000, deductible: 100, limit: 5000 })
    expect(r).toMatchObject({ covered: 5900, payable: 5000, capped: true, notCovered: 900 })
  })

  it('does not go below zero when the deductible exceeds the claim', () => {
    const r = derivePayout({ claimed: 300, deductible: 500, limit: 5000 })
    expect(r).toMatchObject({ covered: 0, payable: 0, capped: false })
  })

  it('has no result when the deductible is missing', () => {
    const r = derivePayout({ claimed: 3000, deductible: null, limit: 50000 })
    expect(r).toMatchObject({ missing: 'deductible', covered: null, payable: null, overAuthority: false })
  })

  it('has no result when the claimed amount is missing', () => {
    const r = derivePayout({ claimed: null, deductible: 500, limit: 50000 })
    expect(r).toMatchObject({ missing: 'claimed amount', covered: null, payable: null })
  })

  it('reports the claimed amount as the blocker when both inputs are missing', () => {
    expect(derivePayout({ claimed: null, deductible: null, limit: null }).missing).toBe('claimed amount')
  })

  it('pays nothing when denied', () => {
    const payout: Payout = { claimed: 19900, deductible: 750, limit: 250000, denied: { reasonCode: 'EXC-04', reason: 'Excluded' } }
    expect(derivePayout(payout)).toMatchObject({ denied: true, payable: 0, covered: null, overAuthority: false })
  })

  it('applies no cap when there is no policy limit', () => {
    const r = derivePayout({ claimed: 100000, deductible: 0, limit: null })
    expect(r).toMatchObject({ payable: 100000, capped: false, overAuthority: true })
  })
})

describe('fieldState', () => {
  it('is default for a confident value', () => {
    expect(fieldState(field(), 'Value')).toBe('default')
  })
  it('is missing when the value is null', () => {
    expect(fieldState(field({ value: null, confidence: null }), null)).toBe('missing')
  })
  it('is missing when a handler clears the value', () => {
    expect(fieldState(field(), null)).toBe('missing')
  })
  it('is agent-failed when the agent failed, even with no value', () => {
    expect(fieldState(field({ value: null, confidence: null, agentFailed: true }), null)).toBe('agent-failed')
  })
  it('is low-confidence below 70', () => {
    expect(fieldState(field({ confidence: 69 }), 'Value')).toBe('low-confidence')
    expect(fieldState(field({ confidence: 70 }), 'Value')).toBe('default')
  })
  it('lets editing win over corrected, and corrected win over the agent state', () => {
    const f = field({ confidence: 40 })
    expect(fieldState(f, 'Value', { editing: true, corrected: true })).toBe('editing')
    expect(fieldState(f, 'Value', { corrected: true })).toBe('corrected')
  })
})

describe('sortFields', () => {
  it('puts missing and agent-failed first, then low confidence, then the rest, stable within a group', () => {
    const ok1 = field({ id: 'ok1' })
    const low = field({ id: 'low', confidence: 50 })
    const missing = field({ id: 'missing', value: null, confidence: null })
    const ok2 = field({ id: 'ok2', confidence: 80 })
    const failed = field({ id: 'failed', value: 'x', agentFailed: true })
    expect(sortFields([ok1, low, missing, ok2, failed]).map((f) => f.id)).toEqual(['missing', 'failed', 'low', 'ok1', 'ok2'])
  })
  it('does not mutate the input', () => {
    const input = [field({ id: 'a' }), field({ id: 'b', value: null })]
    sortFields(input)
    expect(input.map((f) => f.id)).toEqual(['a', 'b'])
  })
})

describe('maskIban', () => {
  it('keeps the country code and last four digits only', () => {
    expect(maskIban('HR1210010051863000160')).toBe('HR•• •••• •••• •••• 0160')
  })
})

describe('formatIban', () => {
  it('groups in fours', () => {
    expect(formatIban('HR1210010051863000160')).toBe('HR12 1001 0051 8630 0016 0')
  })
})

describe('maskPolicyNo', () => {
  it('keeps the prefix and last segment only', () => {
    expect(maskPolicyNo('POL-HRTN-4821')).toBe('POL-••••-4821')
  })
})
