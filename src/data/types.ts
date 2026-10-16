export type LineOfBusiness = 'Motor' | 'Property' | 'Health' | 'Travel'

export type ClaimStatus = 'New' | 'In review' | 'Info requested' | 'Approved' | 'Denied' | 'Paid' | 'Closed' | 'Reopened'

export type ClaimFlag =
  | 'Referred for review'
  | 'Loss date outside policy period'
  | 'Awaiting document'
  | 'Above authority limit'
  | 'Agent failed'
  | 'Duplicate suspected'

/** Days until the SLA deadline: negative = overdue, 0 = due today, null = not applicable (paid, denied, closed). */
export type SlaDays = number | null

export type Actor = { kind: 'agent' } | { kind: 'system' } | { kind: 'policyholder' } | { kind: 'person'; name: string }

export interface ClaimRef {
  id: string
  policyholder: string
}

export interface NeedsAttentionItem extends ClaimRef {
  flag: ClaimFlag
  slaDays: SlaDays
}

export interface ActivityEvent {
  id: string
  time: string
  actor: Actor
  event: string
  claimId: string
}

export type KpiTone = 'default' | 'danger'

export interface Kpi {
  id: string
  label: string
  /** Pre-formatted display value; null = missing. */
  value: string | null
  hint?: { icon: 'trend-up' | 'trend-down' | 'queue' | 'target' | 'percent' | 'overdue'; text: string }
  tone?: KpiTone
}

export interface WeeklyVolume {
  week: string
  Motor: number
  Property: number
  Health: number
  Travel: number
}

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface Claim {
  id: string
  policyholder: string
  lob: LineOfBusiness
  /** ISO date (YYYY-MM-DD). */
  lossDate: string
  /** ISO date (YYYY-MM-DD). */
  reportedDate: string
  slaDays: SlaDays
  status: ClaimStatus
  /** Agent confidence 0–100; null = no score. */
  confidence: number | null
  flag: ClaimFlag | null
  /** Claimed amount in EUR. */
  claimed: number
  /** Assigned handler; null = unassigned. */
  handler: string | null
  policyNo: string
}

export interface ExtractedField {
  id: string
  label: string
  /** null = missing. For kind 'iban' the full value; the UI masks it. */
  value: string | null
  confidence: number | null
  source: { doc: string; page: number } | null
  agentFailed?: boolean
  kind?: 'text' | 'money' | 'date' | 'code' | 'iban'
}

export interface ClaimDocument {
  id: string
  name: string
  type: string
  pages: number
  /** ISO date (YYYY-MM-DD). */
  receivedAt: string
}

export interface CoverageCheck {
  id: string
  label: string
  result: 'pass' | 'flag' | 'unknown'
  detail: string
}

export interface Payout {
  claimed: number | null
  deductible: number | null
  limit: number | null
  denied?: { reasonCode: string; reason: string }
}

export interface AuditEvent {
  id: string
  /** ISO date-time. */
  at: string
  actor: Actor
  event: string
  detail?: string
}

export interface ClaimDetail {
  claim: Claim
  /** ISO dates. */
  policyPeriod: { start: string; end: string }
  fields: ExtractedField[]
  documents: ClaimDocument[]
  coverage: CoverageCheck[]
  payout: Payout
  agentSummary: { recommendation: string; notes: string[] }
  audit: AuditEvent[]
}

// ---------------------------------------------------------------------------
// My assigned: a handler's caseload with work-item extras
// ---------------------------------------------------------------------------

/** Who a claim is waiting on when the next step is not the handler's. */
export type WaitingOn = 'policyholder' | 'provider' | 'senior approver'

export interface AssignedWaiting {
  on: WaitingOn
  /** ISO date (YYYY-MM-DD) the request was sent. */
  since: string
  /** Lower-case noun phrase: `discharge letter`, `senior approval`. */
  what: string
}

export interface AssignedFollowUp {
  id: string
  /** ISO date (YYYY-MM-DD). */
  due: string
  /** `Chase discharge letter` */
  note: string
}

export type AssignedEventKind = 'document-received' | 'approval-returned' | 'policyholder-replied' | 'sla-warning' | 'reopened'

export interface AssignedEvent {
  id: string
  /** ISO date-time. */
  at: string
  kind: AssignedEventKind
  text: string
  /** Happened since the handler was last here. */
  isNew: boolean
}

/** A claim on a handler's worklist: the base claim plus values derived from its detail and hand-authored work-item extras. */
export type AssignedClaim = Claim & {
  /** Amount to pay (EUR, cents), derived from the claim detail; null = cannot be calculated. */
  payable: number | null
  /** Extracted fields with a confidence below 70. */
  lowConfidenceFields: number
  /** Extracted fields without a value. */
  missingFields: number
  /** ISO date (YYYY-MM-DD) the claim came to this handler. */
  assignedAt: string
  waiting?: AssignedWaiting
  followUp?: AssignedFollowUp
  lastEvent?: AssignedEvent
}
