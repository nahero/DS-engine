import { describe, expect, it } from 'vitest'
import { derivePayout } from '@/lib/claim-logic'
import { AUTHORITY_LIMIT } from '@/lib/claim-logic'
import { getClaimDetail } from './claim-detail'
import { claims } from './claims'

describe('getClaimDetail', () => {
  it('returns null for an unknown id', () => {
    expect(getClaimDetail('CLM-0000-000000')).toBeNull()
    expect(getClaimDetail('')).toBeNull()
  })

  it('has the fully specified detail for CLM-2026-004817', () => {
    const detail = getClaimDetail('CLM-2026-004817')
    expect(detail).not.toBeNull()
    expect(detail!.claim.policyholder).toBe('Sarah Mitchell')
    expect(detail!.fields).toHaveLength(7)
    expect(detail!.fields.find((f) => f.id === 'treatment-date')?.value).toBeNull()
    expect(detail!.documents).toHaveLength(4)
    const payout = derivePayout(detail!.payout)
    expect(payout.payable).toBe(11980)
    expect(payout.payable!).toBeGreaterThan(AUTHORITY_LIMIT)
    expect(payout.overAuthority).toBe(true)
  })

  it('gives a denied claim a denial reason and a zero payout', () => {
    const denied = claims.find((c) => c.status === 'Denied')!
    const detail = getClaimDetail(denied.id)!
    expect(detail.payout.denied?.reasonCode).toBeTruthy()
    expect(derivePayout(detail.payout)).toMatchObject({ denied: true, payable: 0 })
    expect(detail.agentSummary.recommendation).toBe('Deny')
  })

  it('gives an agent-failed claim empty, agent-failed fields and unchecked coverage', () => {
    const failed = claims.find((c) => c.flag === 'Agent failed')!
    const detail = getClaimDetail(failed.id)!
    expect(detail.fields.length).toBeGreaterThan(0)
    expect(detail.fields.every((f) => f.value === null && f.agentFailed === true)).toBe(true)
    expect(detail.coverage.every((c) => c.result === 'unknown')).toBe(true)
    expect(detail.agentSummary.recommendation).toBe('Manual review required')
  })

  it('is deterministic', () => {
    for (const id of ['CLM-2026-004817', claims[20].id, claims[500].id]) {
      expect(getClaimDetail(id)).toEqual(getClaimDetail(id))
    }
  })

  it('builds a detail for every claim, newest audit event first', () => {
    for (const c of claims) {
      const detail = getClaimDetail(c.id)
      expect(detail?.claim).toBe(c)
      const times = detail!.audit.map((e) => e.at)
      expect(times).toEqual([...times].sort().reverse())
    }
  })
})
