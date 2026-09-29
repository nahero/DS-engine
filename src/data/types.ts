export type LineOfBusiness = 'Motor' | 'Property' | 'Health' | 'Travel'

export type ClaimStatus =
  | 'New'
  | 'In review'
  | 'Info requested'
  | 'Approved'
  | 'Denied'
  | 'Paid'
  | 'Closed'
  | 'Reopened'

export type ClaimFlag =
  | 'Referred for review'
  | 'Loss date outside policy period'
  | 'Awaiting document'
  | 'Above authority limit'
  | 'Agent failed'
  | 'Duplicate suspected'

/** Days until the SLA deadline: negative = overdue, 0 = due today, null = not applicable (paid, denied, closed). */
export type SlaDays = number | null

export type Actor =
  | { kind: 'agent' }
  | { kind: 'system' }
  | { kind: 'policyholder' }
  | { kind: 'person'; name: string }

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
