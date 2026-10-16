import type { AssignedClaim } from '@/data/types'
import { AUTHORITY_LIMIT } from './claim-logic'
import { formatMoney } from './format'

/** Whose move it is, and how urgent: `act-now` (urgent, mine), `ready` (mine, not urgent), `waiting` (someone else's). */
export type WorklistGroup = 'act-now' | 'ready' | 'waiting'

/** Display order of the groups. */
export const WORKLIST_GROUPS: readonly WorklistGroup[] = ['act-now', 'ready', 'waiting']

export type StageLabel = 'Assigned' | 'Coverage' | 'Assessment' | 'Decision' | 'Payment'

export interface Stage {
  step: 1 | 2 | 3 | 4 | 5
  label: StageLabel
}

export type NextActionKind =
  | 'review-fields'
  | 'enter-fields'
  | 'decide'
  | 'senior-approval'
  | 'first-contact'
  | 'release-payment'
  | 'review-new-info'
  | 'chase'
  | 'await'

export interface NextActionResult {
  kind: NextActionKind
  text: string
}

export type DeadlineKind = 'First contact' | 'Decision' | 'Payment'

export interface WorklistSummary {
  open: number
  overdue: number
  dueToday: number
  ready: number
  waiting: number
  actNow: number
  /** Sum of `payable ?? claimed`, rounded to cents. */
  openAmount: number
  /** Days since the oldest assignment. */
  oldestDays: number
}

// ---------------------------------------------------------------------------
// Dates (ISO `YYYY-MM-DD`, compared as calendar days, no time zones)
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dayNumber(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). Accepts dates and date-times. */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from)
}

/** The calendar date `days` after `iso` (negative = before), as `YYYY-MM-DD`. */
export function addDays(iso: string, days: number): string {
  return new Date((dayNumber(iso) + days) * 86_400_000).toISOString().slice(0, 10)
}

function instant(iso: string): number {
  if (iso.length <= 10) return Date.parse(`${iso}T00:00:00Z`)
  return Date.parse(/(Z|[+-]\d\d:?\d\d)$/.test(iso) ? iso : `${iso}Z`)
}

/**
 * How long ago `at` was, relative to `now` (both ISO date-times read as the same clock):
 * `Just now` · `12 min ago` · `2 h ago` (same day) · `Yesterday` · `3 d ago` · `12 Sep` (a week or more).
 */
export function relativeTime(at: string, now: string): string {
  const minutes = Math.floor((instant(now) - instant(at)) / 60_000)
  if (minutes < 1) return minutes < 0 ? formatShortDate(at) : 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const days = daysBetween(at, now)
  if (days === 0) return `${Math.floor(minutes / 60)} h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} d ago`
  return formatShortDate(at)
}

/** `2 Oct`: short form for inline wording (no year, no zero padding). */
export function formatShortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

// ---------------------------------------------------------------------------
// Stage and deadline
// ---------------------------------------------------------------------------

const STAGES: Record<Stage['step'], StageLabel> = { 1: 'Assigned', 2: 'Coverage', 3: 'Assessment', 4: 'Decision', 5: 'Payment' }

function stage(step: Stage['step']): Stage {
  return { step, label: STAGES[step] }
}

/** Where the claim is on its way from assignment to payment. */
export function stageOf(claim: AssignedClaim): Stage {
  if (claim.status === 'Approved') return stage(5)
  if (claim.status === 'New') return stage(1)
  if (claim.waiting?.on === 'senior approver') return stage(4)
  if (claim.status === 'Info requested' || claim.status === 'Reopened') return stage(3)
  const needsWork = claim.lowConfidenceFields > 0 || claim.missingFields > 0 || claim.flag === 'Agent failed'
  return stage(needsWork ? 3 : 4)
}

/** Which promise the SLA clock counts down: acknowledge (New), pay (Approved), or decide. */
export function deadlineKind(claim: AssignedClaim): DeadlineKind {
  if (claim.status === 'New') return 'First contact'
  if (claim.status === 'Approved') return 'Payment'
  return 'Decision'
}

/** `First contact overdue 2 d` · `Decision due today` · `Decision due in 3 d` · `No deadline`. */
export function deadlineLabel(claim: AssignedClaim): string {
  const days = claim.slaDays
  if (days === null) return 'No deadline'
  const kind = deadlineKind(claim)
  if (days < 0) return `${kind} overdue ${Math.abs(days)} d`
  if (days === 0) return `${kind} due today`
  return `${kind} due in ${days} d`
}

// ---------------------------------------------------------------------------
// Next action and group
// ---------------------------------------------------------------------------

function ago(from: string, today: string, prefix: 'since' | 'sent'): string {
  const d = Math.max(daysBetween(from, today), 0)
  if (prefix === 'since') return d === 0 ? 'since today' : `since ${d} d`
  return d === 0 ? 'sent today' : `sent ${d} d ago`
}

/** True when the follow-up date is today or earlier. */
export function followUpIsDue(claim: AssignedClaim, today: string): boolean {
  return claim.followUp !== undefined && claim.followUp.due <= today
}

/**
 * The single next step, in words. Evaluated in this order:
 * 1. something new came back (document, senior decision, reply): review it
 * 2. waiting on someone: chase when the follow-up is due or overdue, otherwise pure waiting
 * 3. Approved: release payment
 * 4. New: first contact
 * 5. agent failed, then low-confidence / missing fields, then senior approval above authority, then decide
 *
 * `waiting` is kept on a claim when its answer has just come back, so the new-event wording can name the document.
 */
export function nextAction(claim: AssignedClaim, today: string): NextActionResult {
  const event = claim.lastEvent
  if (event?.isNew) {
    if (event.kind === 'approval-returned') return { kind: 'review-new-info', text: 'Review senior approval decision' }
    if (event.kind === 'document-received') {
      return { kind: 'review-new-info', text: `Review new document: ${claim.waiting?.what ?? event.text}` }
    }
    if (event.kind === 'policyholder-replied') {
      return {
        kind: 'review-new-info',
        text: claim.waiting ? `Review policyholder reply: ${claim.waiting.what}` : 'Review policyholder reply',
      }
    }
  }

  const waiting = claim.waiting
  if (waiting) {
    if (waiting.on === 'senior approver') {
      return { kind: 'await', text: `Awaiting senior approval · ${ago(waiting.since, today, 'sent')}` }
    }
    if (claim.followUp && followUpIsDue(claim, today)) {
      return { kind: 'chase', text: `Chase ${waiting.what} · follow-up ${formatShortDate(claim.followUp.due)}` }
    }
    return { kind: 'await', text: `Awaiting ${waiting.what} from ${waiting.on} · ${ago(waiting.since, today, 'since')}` }
  }

  if (claim.status === 'Approved') {
    const amount = claim.payable ?? claim.claimed
    return { kind: 'release-payment', text: `Release payment ${formatMoney(amount)}` }
  }
  if (claim.status === 'New') return { kind: 'first-contact', text: 'Call the policyholder (first contact)' }
  if (claim.flag === 'Agent failed') return { kind: 'enter-fields', text: 'Enter fields manually (agent failed)' }

  const low = claim.lowConfidenceFields
  const missing = claim.missingFields
  if (low > 0) {
    const text = `Verify ${plural(low, 'low-confidence field', 'low-confidence fields')}${missing > 0 ? `, ${missing} missing` : ''}`
    return { kind: 'review-fields', text }
  }
  if (missing > 0) return { kind: 'enter-fields', text: `Complete ${plural(missing, 'missing field', 'missing fields')}` }

  if (claim.payable === null) return { kind: 'decide', text: 'Decide payout (amount missing)' }
  if (claim.payable > AUTHORITY_LIMIT) return { kind: 'senior-approval', text: 'Send for senior approval' }
  return { kind: 'decide', text: `Decide payout ${formatMoney(claim.payable)}` }
}

const URGENT_EVENTS = new Set<NonNullable<AssignedClaim['lastEvent']>['kind']>([
  'document-received',
  'approval-returned',
  'policyholder-replied',
  'reopened',
])

/**
 * `waiting` when the next action is to wait. Otherwise `act-now` when the SLA is due or overdue, a follow-up is due,
 * or something new came back; else `ready`.
 */
export function worklistGroup(claim: AssignedClaim, today: string): WorklistGroup {
  if (nextAction(claim, today).kind === 'await') return 'waiting'
  const deadlineHit = claim.slaDays !== null && claim.slaDays <= 0
  const newEvent = claim.lastEvent !== undefined && claim.lastEvent.isNew && URGENT_EVENTS.has(claim.lastEvent.kind)
  return deadlineHit || followUpIsDue(claim, today) || newEvent ? 'act-now' : 'ready'
}

// ---------------------------------------------------------------------------
// Sort and summary
// ---------------------------------------------------------------------------

/**
 * Order within a group: most overdue first, then soonest deadline (one ascending sort on `slaDays`),
 * claims without a deadline last, then the oldest assignment, then id for a stable order.
 */
export function compareWorklist(a: AssignedClaim, b: AssignedClaim): number {
  const rank = (c: AssignedClaim) => c.slaDays ?? Number.POSITIVE_INFINITY
  const ra = rank(a)
  const rb = rank(b)
  if (ra !== rb) return ra < rb ? -1 : 1
  return a.assignedAt.localeCompare(b.assignedAt) || a.id.localeCompare(b.id)
}

/** Header and strip numbers for a caseload. */
export function summarise(claims: readonly AssignedClaim[], today: string): WorklistSummary {
  const summary: WorklistSummary = {
    open: claims.length,
    overdue: 0,
    dueToday: 0,
    ready: 0,
    waiting: 0,
    actNow: 0,
    openAmount: 0,
    oldestDays: 0,
  }
  let cents = 0
  for (const c of claims) {
    if (c.slaDays !== null && c.slaDays < 0) summary.overdue++
    if (c.slaDays === 0) summary.dueToday++
    const group = worklistGroup(c, today)
    if (group === 'act-now') summary.actNow++
    else if (group === 'ready') summary.ready++
    else summary.waiting++
    cents += Math.round((c.payable ?? c.claimed) * 100)
    summary.oldestDays = Math.max(summary.oldestDays, daysBetween(c.assignedAt, today))
  }
  summary.openAmount = cents / 100
  return summary
}
