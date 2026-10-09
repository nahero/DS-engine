import { describe, expect, it } from 'vitest'
import type { AssignedClaim } from '@/data/types'
import {
  compareWorklist,
  daysBetween,
  deadlineKind,
  deadlineLabel,
  formatShortDate,
  nextAction,
  stageOf,
  summarise,
  worklistGroup,
} from './worklist'

const TODAY = '2026-09-29'

function claim(overrides: Partial<AssignedClaim> = {}): AssignedClaim {
  return {
    id: 'CLM-2026-000001',
    policyholder: 'Test Person',
    lob: 'Motor',
    lossDate: '2026-09-01',
    reportedDate: '2026-09-02',
    slaDays: 5,
    status: 'In review',
    confidence: 95,
    flag: null,
    claimed: 6450,
    handler: 'Emily Carter',
    policyNo: 'POL-TEST-0001',
    payable: 5950,
    lowConfidenceFields: 0,
    missingFields: 0,
    assignedAt: '2026-09-20',
    ...overrides,
  }
}

const waiting = (on: 'policyholder' | 'provider' | 'senior approver', since = '2026-09-26', what = 'discharge letter') => ({ on, since, what })
const followUp = (due: string) => ({ id: 'fu-1', due, note: 'Chase' })
const event = (kind: NonNullable<AssignedClaim['lastEvent']>['kind'], isNew = true, text = 'Something happened') => ({
  id: 'ev-1',
  at: '2026-09-28T10:00:00',
  kind,
  text,
  isNew,
})

describe('dates', () => {
  it('counts calendar days between dates and date-times', () => {
    expect(daysBetween('2026-09-26', '2026-09-29')).toBe(3)
    expect(daysBetween('2026-09-29T23:59:00', '2026-09-29')).toBe(0)
    expect(daysBetween('2026-09-30', '2026-09-29')).toBe(-1)
    expect(daysBetween('2026-09-29', '2026-10-02')).toBe(3)
  })
  it('formats a short date without year or padding', () => {
    expect(formatShortDate('2026-10-02')).toBe('2 Oct')
    expect(formatShortDate('2026-09-29T08:00:00')).toBe('29 Sep')
  })
})

describe('stageOf', () => {
  it('maps New to Assigned', () => {
    expect(stageOf(claim({ status: 'New' }))).toEqual({ step: 1, label: 'Assigned' })
  })
  it('maps Info requested and Reopened to Assessment', () => {
    expect(stageOf(claim({ status: 'Info requested' }))).toEqual({ step: 3, label: 'Assessment' })
    expect(stageOf(claim({ status: 'Reopened' }))).toEqual({ step: 3, label: 'Assessment' })
  })
  it('keeps In review in Assessment while fields need work or the agent failed', () => {
    expect(stageOf(claim({ lowConfidenceFields: 1 })).label).toBe('Assessment')
    expect(stageOf(claim({ missingFields: 1 })).label).toBe('Assessment')
    expect(stageOf(claim({ flag: 'Agent failed', confidence: null })).label).toBe('Assessment')
  })
  it('moves a clean In review to Decision', () => {
    expect(stageOf(claim())).toEqual({ step: 4, label: 'Decision' })
  })
  it('puts a claim waiting on a senior approver in Decision, even with fields to verify', () => {
    expect(stageOf(claim({ waiting: waiting('senior approver'), lowConfidenceFields: 2 })).label).toBe('Decision')
  })
  it('maps Approved to Payment', () => {
    expect(stageOf(claim({ status: 'Approved' }))).toEqual({ step: 5, label: 'Payment' })
  })
})

describe('deadlineKind and deadlineLabel', () => {
  it('names the clock by status', () => {
    expect(deadlineKind(claim({ status: 'New' }))).toBe('First contact')
    expect(deadlineKind(claim({ status: 'Approved' }))).toBe('Payment')
    expect(deadlineKind(claim({ status: 'In review' }))).toBe('Decision')
    expect(deadlineKind(claim({ status: 'Info requested' }))).toBe('Decision')
    expect(deadlineKind(claim({ status: 'Reopened' }))).toBe('Decision')
  })
  it('words overdue, today and upcoming', () => {
    expect(deadlineLabel(claim({ status: 'New', slaDays: -2 }))).toBe('First contact overdue 2 d')
    expect(deadlineLabel(claim({ slaDays: -1 }))).toBe('Decision overdue 1 d')
    expect(deadlineLabel(claim({ slaDays: 0 }))).toBe('Decision due today')
    expect(deadlineLabel(claim({ slaDays: 1 }))).toBe('Decision due in 1 d')
    expect(deadlineLabel(claim({ slaDays: 3 }))).toBe('Decision due in 3 d')
    expect(deadlineLabel(claim({ status: 'Approved', slaDays: 1 }))).toBe('Payment due in 1 d')
  })
  it('says "No deadline" without an SLA', () => {
    expect(deadlineLabel(claim({ slaDays: null }))).toBe('No deadline')
  })
})

describe('nextAction', () => {
  it('first contact for a New claim', () => {
    expect(nextAction(claim({ status: 'New' }), TODAY)).toEqual({ kind: 'first-contact', text: 'Call the policyholder (first contact)' })
  })
  it('manual entry when the agent failed', () => {
    expect(nextAction(claim({ flag: 'Agent failed', confidence: null, missingFields: 6, payable: null }), TODAY)).toEqual({
      kind: 'enter-fields',
      text: 'Enter fields manually (agent failed)',
    })
  })
  it('verify low-confidence fields, singular and plural', () => {
    expect(nextAction(claim({ lowConfidenceFields: 1 }), TODAY)).toEqual({ kind: 'review-fields', text: 'Verify 1 low-confidence field' })
    expect(nextAction(claim({ lowConfidenceFields: 2 }), TODAY).text).toBe('Verify 2 low-confidence fields')
  })
  it('complete missing fields, singular and plural', () => {
    expect(nextAction(claim({ missingFields: 1 }), TODAY)).toEqual({ kind: 'enter-fields', text: 'Complete 1 missing field' })
    expect(nextAction(claim({ missingFields: 3 }), TODAY).text).toBe('Complete 3 missing fields')
  })
  it('combines low-confidence and missing fields', () => {
    expect(nextAction(claim({ lowConfidenceFields: 2, missingFields: 1 }), TODAY)).toEqual({
      kind: 'review-fields',
      text: 'Verify 2 low-confidence fields, 1 missing',
    })
    expect(nextAction(claim({ lowConfidenceFields: 1, missingFields: 4 }), TODAY).text).toBe('Verify 1 low-confidence field, 4 missing')
  })
  it('senior approval above the authority limit, not at it', () => {
    expect(nextAction(claim({ payable: 10000.01 }), TODAY)).toEqual({ kind: 'senior-approval', text: 'Send for senior approval' })
    expect(nextAction(claim({ payable: 10000 }), TODAY).kind).toBe('decide')
  })
  it('decide payout with the formatted amount when ready and within authority', () => {
    expect(nextAction(claim(), TODAY)).toEqual({ kind: 'decide', text: 'Decide payout €5,950.00' })
  })
  it('decide without an amount when the payout cannot be calculated', () => {
    expect(nextAction(claim({ payable: null }), TODAY)).toEqual({ kind: 'decide', text: 'Decide payout (amount missing)' })
  })
  it('release payment for an Approved claim, using the claimed amount when there is no payable', () => {
    expect(nextAction(claim({ status: 'Approved', payable: 1234.5 }), TODAY)).toEqual({ kind: 'release-payment', text: 'Release payment €1,234.50' })
    expect(nextAction(claim({ status: 'Approved', payable: null, claimed: 80 }), TODAY).text).toBe('Release payment €80.00')
  })
  it('reviews a new document by name', () => {
    expect(nextAction(claim({ status: 'Info requested', waiting: waiting('provider'), lastEvent: event('document-received') }), TODAY)).toEqual({
      kind: 'review-new-info',
      text: 'Review new document: discharge letter',
    })
  })
  it('falls back to the event text for a new document without a waiting entry', () => {
    expect(nextAction(claim({ lastEvent: event('document-received', true, 'Photo of receipt') }), TODAY).text).toBe('Review new document: Photo of receipt')
  })
  it('reviews a returned senior approval', () => {
    expect(nextAction(claim({ waiting: waiting('senior approver'), lastEvent: event('approval-returned') }), TODAY)).toEqual({
      kind: 'review-new-info',
      text: 'Review senior approval decision',
    })
  })
  it('reviews a policyholder reply', () => {
    expect(nextAction(claim({ waiting: waiting('policyholder', '2026-09-26', 'signed statement'), lastEvent: event('policyholder-replied') }), TODAY)).toEqual({
      kind: 'review-new-info',
      text: 'Review policyholder reply: signed statement',
    })
    expect(nextAction(claim({ lastEvent: event('policyholder-replied') }), TODAY).text).toBe('Review policyholder reply')
  })
  it('ignores an event that is not new', () => {
    expect(nextAction(claim({ waiting: waiting('provider'), lastEvent: event('document-received', false) }), TODAY).kind).toBe('await')
  })
  it('ignores sla-warning and reopened events for the wording', () => {
    expect(nextAction(claim({ lastEvent: event('sla-warning') }), TODAY).kind).toBe('decide')
    expect(nextAction(claim({ status: 'Reopened', lastEvent: event('reopened') }), TODAY).kind).toBe('decide')
  })
  describe('waiting on the policyholder or provider', () => {
    const base = { status: 'Info requested' as const, waiting: waiting('policyholder', '2026-09-26', 'police report') }
    it('chases when the follow-up is overdue', () => {
      expect(nextAction(claim({ ...base, followUp: followUp('2026-09-28') }), TODAY)).toEqual({ kind: 'chase', text: 'Chase police report · follow-up 28 Sep' })
    })
    it('chases when the follow-up is today', () => {
      expect(nextAction(claim({ ...base, followUp: followUp('2026-09-29') }), TODAY).kind).toBe('chase')
    })
    it('awaits when the follow-up is tomorrow', () => {
      expect(nextAction(claim({ ...base, followUp: followUp('2026-09-30') }), TODAY)).toEqual({
        kind: 'await',
        text: 'Awaiting police report from policyholder · since 3 d',
      })
    })
    it('awaits without a follow-up, naming the provider', () => {
      expect(nextAction(claim({ status: 'Info requested', waiting: waiting('provider', '2026-09-24', 'invoice') }), TODAY).text).toBe('Awaiting invoice from provider · since 5 d')
    })
    it('says "since today" for a request sent today', () => {
      expect(nextAction(claim({ waiting: waiting('policyholder', TODAY, 'photos') }), TODAY).text).toBe('Awaiting photos from policyholder · since today')
    })
    it('waits even when an Approved claim is on hold for a document', () => {
      expect(nextAction(claim({ status: 'Approved', waiting: waiting('policyholder', '2026-09-25', 'bank letter'), followUp: followUp('2026-10-02') }), TODAY).kind).toBe('await')
    })
  })
  describe('waiting on a senior approver', () => {
    it('words the age of the request', () => {
      expect(nextAction(claim({ waiting: waiting('senior approver', '2026-09-27', 'senior approval') }), TODAY)).toEqual({
        kind: 'await',
        text: 'Awaiting senior approval · sent 2 d ago',
      })
      expect(nextAction(claim({ waiting: waiting('senior approver', TODAY, 'senior approval') }), TODAY).text).toBe('Awaiting senior approval · sent today')
    })
    it('never chases, even with a due follow-up', () => {
      expect(nextAction(claim({ waiting: waiting('senior approver'), followUp: followUp('2026-09-20') }), TODAY).kind).toBe('await')
    })
  })
})

describe('worklistGroup', () => {
  it('waiting when the action is to wait', () => {
    expect(worklistGroup(claim({ slaDays: -3, waiting: waiting('provider') }), TODAY)).toBe('waiting')
  })
  it('act-now at the SLA boundary: overdue and today, not tomorrow', () => {
    expect(worklistGroup(claim({ slaDays: -1 }), TODAY)).toBe('act-now')
    expect(worklistGroup(claim({ slaDays: 0 }), TODAY)).toBe('act-now')
    expect(worklistGroup(claim({ slaDays: 1 }), TODAY)).toBe('ready')
  })
  it('ready without a deadline', () => {
    expect(worklistGroup(claim({ slaDays: null }), TODAY)).toBe('ready')
  })
  it('act-now when a follow-up is due: yesterday and today, not tomorrow', () => {
    const chase = (due: string) => claim({ status: 'Info requested', waiting: waiting('policyholder'), followUp: followUp(due) })
    expect(worklistGroup(chase('2026-09-28'), TODAY)).toBe('act-now')
    expect(worklistGroup(chase('2026-09-29'), TODAY)).toBe('act-now')
    expect(worklistGroup(chase('2026-09-30'), TODAY)).toBe('waiting')
  })
  it('act-now for a new document, approval, reply or reopening', () => {
    for (const kind of ['document-received', 'approval-returned', 'policyholder-replied', 'reopened'] as const) {
      expect(worklistGroup(claim({ lastEvent: event(kind) }), TODAY), kind).toBe('act-now')
    }
  })
  it('does not escalate for an event that is not new, or an sla-warning', () => {
    expect(worklistGroup(claim({ lastEvent: event('document-received', false) }), TODAY)).toBe('ready')
    expect(worklistGroup(claim({ lastEvent: event('sla-warning') }), TODAY)).toBe('ready')
  })
  it('a new document on a waiting claim brings it back into act-now', () => {
    expect(worklistGroup(claim({ status: 'Info requested', waiting: waiting('provider'), lastEvent: event('document-received') }), TODAY)).toBe('act-now')
  })
  it('ready when the next step is mine and not urgent', () => {
    expect(worklistGroup(claim(), TODAY)).toBe('ready')
    expect(worklistGroup(claim({ status: 'Approved', slaDays: 5 }), TODAY)).toBe('ready')
  })
})

describe('compareWorklist', () => {
  const sort = (list: AssignedClaim[]) => [...list].sort(compareWorklist).map((c) => c.id)
  it('puts the most overdue first, then the soonest deadline', () => {
    const list = [
      claim({ id: 'a', slaDays: 3 }),
      claim({ id: 'b', slaDays: -1 }),
      claim({ id: 'c', slaDays: 0 }),
      claim({ id: 'd', slaDays: -5 }),
      claim({ id: 'e', slaDays: 1 }),
    ]
    expect(sort(list)).toEqual(['d', 'b', 'c', 'e', 'a'])
  })
  it('puts claims without a deadline last', () => {
    expect(sort([claim({ id: 'a', slaDays: null }), claim({ id: 'b', slaDays: 9 })])).toEqual(['b', 'a'])
  })
  it('breaks ties with the oldest assignment, then id', () => {
    const list = [
      claim({ id: 'b', slaDays: 2, assignedAt: '2026-09-25' }),
      claim({ id: 'a', slaDays: 2, assignedAt: '2026-09-25' }),
      claim({ id: 'c', slaDays: 2, assignedAt: '2026-09-20' }),
    ]
    expect(sort(list)).toEqual(['c', 'a', 'b'])
  })
})

describe('summarise', () => {
  it('counts overdue, due today and groups', () => {
    const list = [
      claim({ id: 'a', slaDays: -2 }),
      claim({ id: 'b', slaDays: 0 }),
      claim({ id: 'c', slaDays: 4 }),
      claim({ id: 'd', slaDays: 2, waiting: waiting('provider') }),
      claim({ id: 'e', slaDays: -1, waiting: waiting('policyholder') }),
    ]
    expect(summarise(list, TODAY)).toMatchObject({ open: 5, overdue: 2, dueToday: 1, actNow: 2, ready: 1, waiting: 2 })
  })
  it('sums payable, falling back to claimed, without float noise', () => {
    const list = [claim({ payable: 0.1, claimed: 5 }), claim({ payable: 0.2, claimed: 5 }), claim({ payable: null, claimed: 100 })]
    expect(summarise(list, TODAY).openAmount).toBe(100.3)
  })
  it('reports the age of the oldest assignment', () => {
    const list = [claim({ assignedAt: '2026-09-29' }), claim({ assignedAt: '2026-09-15' })]
    expect(summarise(list, TODAY).oldestDays).toBe(14)
  })
  it('is all zero for an empty caseload', () => {
    expect(summarise([], TODAY)).toEqual({ open: 0, overdue: 0, dueToday: 0, ready: 0, waiting: 0, actNow: 0, openAmount: 0, oldestDays: 0 })
  })
})
