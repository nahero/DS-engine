import { describe, expect, it } from 'vitest'
import { compareWorklist, nextAction, stageOf, summarise, worklistGroup, type WorklistGroup } from '@/lib/worklist'
import { ASSIGNED_TODAY, assignedClaims } from './assigned'
import { getClaimDetail } from './claim-detail'
import { claims } from './claims'
import { currentUser } from './current-user'
import { navCounts } from './nav-counts'

const CLOSED = ['Paid', 'Denied', 'Closed']
const find = (id: string) => assignedClaims.find((c) => c.id === id)!
const groupOf = (id: string) => worklistGroup(find(id), ASSIGNED_TODAY)
const textOf = (id: string) => nextAction(find(id), ASSIGNED_TODAY).text

describe('assignedClaims', () => {
  it('has 17 unique claims, all open and all the current user’s', () => {
    expect(assignedClaims).toHaveLength(17)
    expect(new Set(assignedClaims.map((c) => c.id)).size).toBe(17)
    for (const c of assignedClaims) {
      expect(c.handler).toBe(currentUser.name)
      expect(CLOSED).not.toContain(c.status)
    }
  })

  it('opens every claim in the detail screen and keeps the base fields unchanged', () => {
    for (const c of assignedClaims) {
      expect(getClaimDetail(c.id), c.id).not.toBeNull()
      expect(c).toMatchObject(claims.find((x) => x.id === c.id)!)
    }
  })

  it('derives payable, low-confidence and missing counts from the detail', () => {
    for (const c of assignedClaims) {
      const detail = getClaimDetail(c.id)!
      expect(c.lowConfidenceFields).toBe(detail.fields.filter((f) => f.confidence !== null && f.confidence < 70).length)
      expect(c.missingFields).toBe(detail.fields.filter((f) => f.value === null).length)
      expect(c.payable === null || Number.isFinite(c.payable)).toBe(true)
    }
    expect(find('CLM-2026-004817')).toMatchObject({ payable: 11980, lowConfidenceFields: 1, missingFields: 1 })
  })

  it('includes the Figma rows', () => {
    const ids = assignedClaims.map((c) => c.id)
    expect(ids).toContain('CLM-2026-004817')
    expect(ids).toContain('CLM-2026-004821')
  })

  it('covers the variety the screen needs', () => {
    const count = (pred: (c: (typeof assignedClaims)[number]) => boolean) => assignedClaims.filter(pred).length
    expect(count((c) => c.slaDays !== null && c.slaDays < 0)).toBeGreaterThanOrEqual(2)
    expect(count((c) => c.slaDays === 0)).toBeGreaterThanOrEqual(2)
    for (const status of ['New', 'In review', 'Info requested', 'Reopened', 'Approved'] as const) {
      expect(count((c) => c.status === status), status).toBeGreaterThanOrEqual(1)
    }
    for (const flag of ['Above authority limit', 'Awaiting document', 'Duplicate suspected', 'Loss date outside policy period'] as const) {
      expect(count((c) => c.flag === flag), flag).toBeGreaterThanOrEqual(1)
    }
    expect(count((c) => c.policyholder.length > 35)).toBeGreaterThanOrEqual(1)
    expect(count((c) => c.confidence === null)).toBeGreaterThanOrEqual(1)
    expect(count((c) => c.confidence !== null && c.confidence < 70)).toBeGreaterThanOrEqual(1)
    expect(count((c) => c.waiting?.on === 'senior approver')).toBeGreaterThanOrEqual(1)
    expect(count((c) => c.lastEvent?.kind === 'approval-returned' && c.lastEvent.isNew)).toBe(1)
    expect(count((c) => c.lastEvent?.kind === 'document-received' && c.lastEvent.isNew)).toBe(1)
    expect(count((c) => c.lastEvent?.kind === 'sla-warning' && c.slaDays !== null && c.slaDays < 0)).toBeGreaterThanOrEqual(1)
    expect(count((c) => c.lastEvent?.isNew === true)).toBe(5)
  })

  it('has four follow-ups: one overdue, one due today, two later', () => {
    const due = assignedClaims.filter((c) => c.followUp).map((c) => c.followUp!.due)
    expect(due).toHaveLength(4)
    expect(due.filter((d) => d < ASSIGNED_TODAY)).toHaveLength(1)
    expect(due.filter((d) => d === ASSIGNED_TODAY)).toHaveLength(1)
    expect(due.filter((d) => d > ASSIGNED_TODAY)).toHaveLength(2)
  })

  it('keeps every work-item date within 14 days of today, and requests in the past', () => {
    const within = (iso: string) => Math.abs(Date.parse(iso.slice(0, 10)) - Date.parse(ASSIGNED_TODAY)) <= 14 * 86_400_000
    for (const c of assignedClaims) {
      expect(within(c.assignedAt), c.id).toBe(true)
      if (c.waiting) {
        expect(within(c.waiting.since), c.id).toBe(true)
        expect(c.waiting.since <= ASSIGNED_TODAY, c.id).toBe(true)
      }
      if (c.followUp) expect(within(c.followUp.due), c.id).toBe(true)
      if (c.lastEvent) expect(within(c.lastEvent.at), c.id).toBe(true)
    }
  })

  it('gives every group claims under ASSIGNED_TODAY', () => {
    const counts: Record<WorklistGroup, number> = { 'act-now': 0, ready: 0, waiting: 0 }
    for (const c of assignedClaims) counts[worklistGroup(c, ASSIGNED_TODAY)]++
    expect(counts).toEqual({ 'act-now': 8, ready: 6, waiting: 3 })
  })

  it('puts the intended claims in their groups', () => {
    expect(groupOf('CLM-2026-004821')).toBe('act-now')
    expect(groupOf('CLM-2026-004484')).toBe('act-now')
    expect(groupOf('CLM-2026-004321')).toBe('act-now')
    expect(groupOf('CLM-2026-004817')).toBe('ready')
    expect(groupOf('CLM-2026-004377')).toBe('waiting')
    expect(groupOf('CLM-2026-003910')).toBe('waiting')
  })

  it('writes the expected next action for key claims', () => {
    expect(textOf('CLM-2026-004817')).toBe('Verify 1 low-confidence field, 1 missing')
    expect(textOf('CLM-2026-004821')).toBe('Verify 5 low-confidence fields, 1 missing')
    expect(textOf('CLM-2026-004484')).toBe('Chase police report · follow-up 29 Sep')
    expect(textOf('CLM-2026-004416')).toBe('Chase signed statement · follow-up 27 Sep')
    expect(textOf('CLM-2026-004377')).toBe('Awaiting senior approval · sent 2 d ago')
    expect(textOf('CLM-2026-004321')).toBe('Review senior approval decision')
    expect(textOf('CLM-2026-004300')).toBe('Review new document: discharge letter')
    expect(textOf('CLM-2026-003910')).toBe('Awaiting signed payment authorisation from policyholder · since 4 d')
    expect(textOf('CLM-2026-004795')).toBe('Release payment €360.00')
    expect(textOf('CLM-2026-004303')).toBe('Send for senior approval')
    expect(textOf('CLM-2026-004732')).toBe('Decide payout €996.34')
    expect(textOf('CLM-2026-004743')).toBe('Call the policyholder (first contact)')
  })

  it('spreads the claims over the stages', () => {
    const steps = [...new Set(assignedClaims.map((c) => stageOf(c).step))].sort()
    expect(steps).toEqual([1, 3, 4, 5])
  })

  it('sorts the most overdue claim first in the act-now group', () => {
    const act = assignedClaims.filter((c) => worklistGroup(c, ASSIGNED_TODAY) === 'act-now').sort(compareWorklist)
    expect(act[0].id).toBe('CLM-2026-004769')
  })

  it('summarises the caseload', () => {
    const s = summarise(assignedClaims, ASSIGNED_TODAY)
    expect(s).toMatchObject({ open: 17, overdue: 3, dueToday: 2, actNow: 8, ready: 6, waiting: 3, oldestDays: 14 })
    expect(s.openAmount).toBeGreaterThan(0)
  })
})

describe('navCounts', () => {
  it('equal the counts derived from the data', () => {
    const open = claims.filter((c) => !CLOSED.includes(c.status))
    const queue = claims.filter((c) => ['New', 'In review', 'Info requested', 'Reopened'].includes(c.status)).length
    expect(navCounts.queue).toBe(queue)
    expect(navCounts.myAssigned).toBe(assignedClaims.length)
    expect(navCounts.referred).toBe(open.filter((c) => c.flag === 'Referred for review').length)
  })
})
