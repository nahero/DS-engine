import { derivePayout } from '@/lib/claim-logic'
import { getClaimDetail } from './claim-detail'
import { getClaim } from './claims'
import type { AssignedClaim, AssignedEvent, AssignedFollowUp, AssignedWaiting } from './types'

export type { AssignedClaim, AssignedEvent, AssignedFollowUp, AssignedWaiting } from './types'

/** The mock "today" of the worklist. Every relative date (follow-ups, events, "since 3 d") derives from it. */
export const ASSIGNED_TODAY = '2026-09-29'

/** Work-item extras that the generated claims don't have. Hand-authored per claim and consistent with its status and flag. */
interface Extras {
  /** ISO date the claim came to this handler. */
  assignedAt: string
  waiting?: AssignedWaiting
  followUp?: Omit<AssignedFollowUp, 'id'>
  lastEvent?: Omit<AssignedEvent, 'id'>
}

/**
 * The curated caseload: 17 open claims of Emily Carter (the generated data gives her 121). Order is the id order below;
 * screens sort with `compareWorklist`. Base claim fields are never overridden, so the Claim detail screen agrees.
 * Group = group under `ASSIGNED_TODAY`.
 */
const CASELOAD: readonly (readonly [id: string, extras: Extras])[] = [
  // Act now · Figma row. In review, overdue 1 d, loss date outside policy period, 5 low-confidence fields + 1 missing.
  ['CLM-2026-004821', {
    assignedAt: '2026-09-23',
    lastEvent: { at: '2026-09-29T07:30:00', kind: 'sla-warning', text: 'Decision deadline passed yesterday', isNew: true },
  }],
  // Ready · Figma row. In review, above authority limit, 1 low-confidence + 1 missing field.
  ['CLM-2026-004817', { assignedAt: '2026-09-22' }],
  // Ready · Approved, releasing a small payment (Payment stage, due in 5 d).
  ['CLM-2026-004795', { assignedAt: '2026-09-18' }],
  // Act now · New, due today: first contact. Low confidence (43), 5 low + 1 missing fields behind it.
  ['CLM-2026-004743', {
    assignedAt: '2026-09-26',
    lastEvent: { at: '2026-09-29T06:00:00', kind: 'sla-warning', text: 'First contact is due today', isNew: true },
  }],
  // Act now · Info requested, due today, long company name, 38 confidence. Waiting on the policyholder, follow-up is today: chase.
  ['CLM-2026-004484', {
    assignedAt: '2026-09-17',
    waiting: { on: 'policyholder', since: '2026-09-24', what: 'police report' },
    followUp: { due: '2026-09-29', note: 'Chase police report' },
    lastEvent: { at: '2026-09-26T15:10:00', kind: 'policyholder-replied', text: 'Policyholder acknowledged the request', isNew: false },
  }],
  // Act now · Info requested + Duplicate suspected, overdue 1 d, no confidence score, long company name. Follow-up overdue since 27 Sep: chase.
  ['CLM-2026-004416', {
    assignedAt: '2026-09-15',
    waiting: { on: 'policyholder', since: '2026-09-21', what: 'signed statement' },
    followUp: { due: '2026-09-27', note: 'Chase signed statement' },
  }],
  // Ready · In review, 2 low-confidence fields, none missing (pure "Verify 2 low-confidence fields").
  ['CLM-2026-004662', { assignedAt: '2026-09-21' }],
  // Waiting · In review, payout above authority, sent for senior approval 2 d ago.
  ['CLM-2026-004377', {
    assignedAt: '2026-09-16',
    waiting: { on: 'senior approver', since: '2026-09-27', what: 'senior approval' },
  }],
  // Act now · In review, senior approval came back this morning: my move again.
  ['CLM-2026-004321', {
    assignedAt: '2026-09-16',
    waiting: { on: 'senior approver', since: '2026-09-25', what: 'senior approval' },
    lastEvent: { at: '2026-09-28T16:20:00', kind: 'approval-returned', text: 'Senior approver approved the payout', isNew: true },
  }],
  // Act now · Info requested, the provider's discharge letter arrived yesterday: my move again.
  ['CLM-2026-004300', {
    assignedAt: '2026-09-19',
    waiting: { on: 'provider', since: '2026-09-22', what: 'discharge letter' },
    lastEvent: { at: '2026-09-28T11:05:00', kind: 'document-received', text: 'Discharge letter received from the provider', isNew: true },
  }],
  // Waiting · Awaiting document flag, Approved: payment on hold until the policyholder returns a signed authorisation. Follow-up 2 Oct.
  ['CLM-2026-003910', {
    assignedAt: '2026-09-15',
    waiting: { on: 'policyholder', since: '2026-09-25', what: 'signed payment authorisation' },
    followUp: { due: '2026-10-02', note: 'Chase signed payment authorisation' },
  }],
  // Act now · Reopened: the policyholder reopened it yesterday with a further invoice.
  ['CLM-2026-004367', {
    assignedAt: '2026-09-28',
    lastEvent: { at: '2026-09-28T09:40:00', kind: 'reopened', text: 'Policyholder reopened the claim with a further invoice', isNew: true },
  }],
  // Act now · New, overdue 5 d (most overdue on the list): first contact. High confidence, nothing to verify.
  ['CLM-2026-004769', { assignedAt: '2026-09-24' }],
  // Ready · New with no confidence score, first contact due in 1 d.
  ['CLM-2026-004756', { assignedAt: '2026-09-27' }],
  // Ready · In review, no flags, payout above authority and not yet sent: "Send for senior approval".
  ['CLM-2026-004303', { assignedAt: '2026-09-25' }],
  // Ready · In review, high confidence, within authority: "Decide payout".
  ['CLM-2026-004732', { assignedAt: '2026-09-28' }],
  // Waiting · Info requested, waiting on the provider's invoice. Follow-up 6 Oct.
  ['CLM-2026-004301', {
    assignedAt: '2026-09-20',
    waiting: { on: 'provider', since: '2026-09-24', what: 'itemised hospital invoice' },
    followUp: { due: '2026-10-06', note: 'Chase itemised hospital invoice' },
  }],
]

function cents(n: number): number {
  return Math.round(n * 100) / 100
}

function build([id, extras]: readonly [string, Extras], index: number): AssignedClaim {
  const claim = getClaim(id)
  const detail = getClaimDetail(id)
  if (!claim || !detail) throw new Error(`Assigned caseload: unknown claim ${id}`)
  const derived = derivePayout(detail.payout)
  const number = String(index + 1).padStart(2, '0')
  return {
    ...claim,
    payable: derived.payable === null ? null : cents(derived.payable),
    lowConfidenceFields: detail.fields.filter((f) => f.confidence !== null && f.confidence < 70).length,
    missingFields: detail.fields.filter((f) => f.value === null).length,
    assignedAt: extras.assignedAt,
    ...(extras.waiting ? { waiting: extras.waiting } : {}),
    ...(extras.followUp ? { followUp: { id: `fu-${number}`, ...extras.followUp } } : {}),
    ...(extras.lastEvent ? { lastEvent: { id: `ev-${number}`, ...extras.lastEvent } } : {}),
  }
}

/** 17 open claims of the current user, in the order above (not sorted). Deterministic. */
export const assignedClaims: AssignedClaim[] = CASELOAD.map(build)
