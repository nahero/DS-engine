import { confidenceLevel, formatDate, formatMoney, getClaim } from './claims'
import type {
  AuditEvent,
  Claim,
  ClaimDetail,
  ClaimDocument,
  CoverageCheck,
  ExtractedField,
  LineOfBusiness,
  Payout,
} from './types'

const SARAH_ID = 'CLM-2026-004817'

/** Handler authority in EUR: above this a claim needs senior approval. */
export const AUTHORITY_LIMIT = 10000

const DEFAULT_POLICY_PERIOD = { start: '2026-01-01', end: '2026-12-31' }

// ---------------------------------------------------------------------------
// CLM-2026-004817: fully specified in the Figma brief
// ---------------------------------------------------------------------------

function sarahDetail(claim: Claim): ClaimDetail {
  return {
    claim,
    policyPeriod: DEFAULT_POLICY_PERIOD,
    fields: [
      { id: 'treatment-date', label: 'Treatment date', value: null, confidence: null, source: null, kind: 'date' },
      { id: 'diagnosis-code', label: 'Diagnosis code', value: 'S82.6', confidence: 58, source: { doc: 'Discharge', page: 1 }, kind: 'code' },
      { id: 'provider', label: 'Provider', value: "St. Luke's Medical Center", confidence: 74, source: { doc: 'Invoice', page: 1 }, kind: 'text' },
      { id: 'invoiced-amount', label: 'Invoiced amount', value: formatMoney(12480), confidence: 97, source: { doc: 'Invoice', page: 1 }, kind: 'money' },
      { id: 'policyholder', label: 'Policyholder', value: 'Sarah Mitchell', confidence: 99, source: { doc: 'FNOL', page: 1 }, kind: 'text' },
      { id: 'loss-date', label: 'Loss date', value: formatDate('2026-09-20'), confidence: 95, source: { doc: 'FNOL', page: 2 }, kind: 'date' },
      // Full (fake) IBAN; the UI masks it to `HR•• •••• •••• •••• 7730` and offers Reveal.
      { id: 'iban', label: 'IBAN', value: 'HR1210010051863000160', confidence: 92, source: { doc: 'FNOL', page: 3 }, kind: 'iban' },
    ],
    documents: [
      { id: 'doc-fnol', name: 'FNOL form', type: 'FNOL', pages: 3, receivedAt: '2026-09-22' },
      { id: 'doc-invoice', name: 'Invoice', type: 'Invoice', pages: 1, receivedAt: '2026-09-22' },
      { id: 'doc-discharge', name: 'Discharge letter', type: 'Discharge', pages: 2, receivedAt: '2026-09-22' },
      { id: 'doc-receipt', name: 'Photo of receipt', type: 'Photo', pages: 1, receivedAt: '2026-09-23' },
    ],
    coverage: [
      { id: 'in-force', label: 'Policy in force on loss date', result: 'pass', detail: 'Loss date 20 Sep 2026 is within 01 Jan 2026 – 31 Dec 2026.' },
      { id: 'covered', label: 'Loss type covered (Health inpatient)', result: 'pass', detail: 'Inpatient treatment is covered under this policy.' },
      { id: 'limit', label: 'Within policy limit €50,000', result: 'pass', detail: `Claimed ${formatMoney(12480)} is below the policy limit of ${formatMoney(50000)}.` },
      { id: 'treatment-date', label: 'Treatment date present', result: 'unknown', detail: 'Awaiting document' },
    ],
    payout: { claimed: 12480, deductible: 500, limit: 50000 },
    agentSummary: {
      recommendation: 'Approve with senior sign-off',
      notes: [
        'Diagnosis code confidence is low; verify against discharge letter.',
        'Treatment date is missing from the submitted documents.',
        `Payable ${formatMoney(11980)} exceeds the handler authority limit of ${formatMoney(AUTHORITY_LIMIT)}.`,
      ],
    },
    // Newest first.
    audit: [
      { id: 'ev-5', at: '2026-09-23T14:32:00', actor: { kind: 'person', name: 'Emily Carter' }, event: 'Started review' },
      { id: 'ev-4', at: '2026-09-22T09:16:00', actor: { kind: 'system' }, event: 'Assigned to Emily Carter' },
      { id: 'ev-3', at: '2026-09-22T09:15:00', actor: { kind: 'agent' }, event: 'Flagged “Above authority limit”', detail: `Payable ${formatMoney(11980)} exceeds ${formatMoney(AUTHORITY_LIMIT)}` },
      { id: 'ev-2', at: '2026-09-22T09:14:00', actor: { kind: 'agent' }, event: 'Extracted 7 fields from 4 documents', detail: 'Treatment date not found' },
      { id: 'ev-1', at: '2026-09-22T09:12:00', actor: { kind: 'policyholder' }, event: 'Submitted FNOL form', detail: '3 pages' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Generic detail derived from a claim row (pure, deterministic)
// ---------------------------------------------------------------------------

const DEDUCTIBLE: Record<LineOfBusiness, number> = { Motor: 500, Property: 750, Health: 500, Travel: 100 }
const LIMIT: Record<LineOfBusiness, number> = { Motor: 60000, Property: 250000, Health: 50000, Travel: 5000 }
const LOSS_TYPE: Record<LineOfBusiness, string> = {
  Motor: 'Collision damage',
  Property: 'Water damage',
  Health: 'Outpatient treatment',
  Travel: 'Trip cancellation',
}

const GARAGES = ['Lakeside Auto Repair', 'Summit Collision Center', 'Ridgeway Motors', 'Harborview Body Shop']
const PROVIDERS = ["St. Luke's Medical Center", 'Riverside Family Clinic', 'Mercy General Hospital', 'Oakwood Health Partners']
const DIAGNOSES = ['J18.9', 'M54.5', 'S82.6', 'K35.8', 'I10']
const CAUSES = ['Burst pipe', 'Storm damage', 'Kitchen fire', 'Roof leak']
const DESTINATIONS = ['Lisbon, Portugal', 'Split, Croatia', 'Vienna, Austria', 'Athens, Greece']
const INCIDENTS = ['Flight cancelled', 'Lost luggage', 'Medical emergency abroad', 'Trip interrupted']
const STREETS = ['Maple Street', 'Harbor Road', 'Elm Avenue', 'Cedar Lane']
const DENIAL_REASONS: { reasonCode: string; reason: string }[] = [
  { reasonCode: 'EXC-04', reason: 'Loss type is excluded under the policy terms.' },
  { reasonCode: 'POL-11', reason: 'Loss occurred outside the policy period.' },
  { reasonCode: 'DOC-02', reason: 'Required documents were not provided within the deadline.' },
]

function seedOf(id: string): number {
  return Number.parseInt(id.slice(-6), 10) || 0
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function fakeIban(n: number): string {
  return `HR12${'1001005'}${String((n * 104729) % 10_000_000_000).padStart(10, '0')}`
}

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

function at(date: string, minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${date}T${h}:${m}:00`
}

function lobDocument(claim: Claim): { name: string; type: string; pages: number } {
  switch (claim.lob) {
    case 'Motor':
      return { name: 'Repair estimate', type: 'Estimate', pages: 2 }
    case 'Property':
      return { name: 'Damage report', type: 'Report', pages: 4 }
    case 'Health':
      return { name: 'Invoice', type: 'Invoice', pages: 1 }
    case 'Travel':
      return { name: 'Booking confirmation', type: 'Booking', pages: 2 }
  }
}

function buildDocuments(claim: Claim): ClaimDocument[] {
  const second = lobDocument(claim)
  return [
    { id: 'doc-fnol', name: 'FNOL form', type: 'FNOL', pages: 3, receivedAt: claim.reportedDate },
    { id: 'doc-supporting', ...second, receivedAt: addDays(claim.reportedDate, claim.status === 'Info requested' ? 3 : 0) },
  ]
}

function buildFields(claim: Claim, n: number, docs: ClaimDocument[]): ExtractedField[] {
  const supporting = docs[1]
  const specific: { id: string; label: string; value: string; kind: ExtractedField['kind']; doc: string; page: number }[] = (() => {
    switch (claim.lob) {
      case 'Motor':
        return [
          { id: 'vehicle', label: 'Vehicle registration', value: `ZG ${1000 + (n % 9000)}-${'ABCDEFGHJK'[n % 10]}${'LMNPRSTUVZ'[n % 10]}`, kind: 'code' as const, doc: 'FNOL', page: 1 },
          { id: 'garage', label: 'Repair garage', value: GARAGES[n % GARAGES.length], kind: 'text' as const, doc: supporting.type, page: 1 },
          { id: 'amount', label: 'Repair estimate', value: formatMoney(claim.claimed), kind: 'money' as const, doc: supporting.type, page: supporting.pages },
        ]
      case 'Property':
        return [
          { id: 'address', label: 'Property address', value: `${1 + (n % 90)} ${STREETS[n % STREETS.length]}`, kind: 'text' as const, doc: 'FNOL', page: 1 },
          { id: 'cause', label: 'Cause of loss', value: CAUSES[n % CAUSES.length], kind: 'text' as const, doc: 'FNOL', page: 2 },
          { id: 'amount', label: 'Estimated damage', value: formatMoney(claim.claimed), kind: 'money' as const, doc: supporting.type, page: supporting.pages },
        ]
      case 'Health':
        return [
          { id: 'diagnosis', label: 'Diagnosis code', value: DIAGNOSES[n % DIAGNOSES.length], kind: 'code' as const, doc: supporting.type, page: 1 },
          { id: 'provider', label: 'Provider', value: PROVIDERS[n % PROVIDERS.length], kind: 'text' as const, doc: supporting.type, page: 1 },
          { id: 'amount', label: 'Invoiced amount', value: formatMoney(claim.claimed), kind: 'money' as const, doc: supporting.type, page: 1 },
        ]
      case 'Travel':
        return [
          { id: 'destination', label: 'Destination', value: DESTINATIONS[n % DESTINATIONS.length], kind: 'text' as const, doc: supporting.type, page: 1 },
          { id: 'incident', label: 'Incident type', value: INCIDENTS[n % INCIDENTS.length], kind: 'text' as const, doc: 'FNOL', page: 2 },
          { id: 'amount', label: 'Claimed amount', value: formatMoney(claim.claimed), kind: 'money' as const, doc: supporting.type, page: supporting.pages },
        ]
    }
  })()

  const draft = [
    { id: 'policyholder', label: 'Policyholder', value: claim.policyholder, kind: 'text' as const, doc: 'FNOL', page: 1, offset: 4 },
    { id: 'loss-date', label: 'Loss date', value: formatDate(claim.lossDate), kind: 'date' as const, doc: 'FNOL', page: 2, offset: 2 },
    { ...specific[0], offset: -12 },
    { ...specific[1], offset: -5 },
    { ...specific[2], offset: 3 },
    { id: 'iban', label: 'IBAN', value: fakeIban(n), kind: 'iban' as const, doc: 'FNOL', page: 3, offset: -2 },
  ]

  const lowScore = claim.confidence !== null && confidenceLevel(claim.confidence) === 'Low'
  const fields = draft.map((d, i): ExtractedField => {
    if (claim.flag === 'Agent failed') {
      return { id: d.id, label: d.label, value: null, confidence: null, source: null, agentFailed: true, kind: d.kind }
    }
    // A low-scoring claim is missing its first claim-specific detail.
    if (lowScore && i === 3) {
      return { id: d.id, label: d.label, value: null, confidence: null, source: null, kind: d.kind }
    }
    return {
      id: d.id,
      label: d.label,
      value: d.value,
      confidence: claim.confidence === null ? null : clamp(claim.confidence + d.offset, 30, 99),
      source: { doc: d.doc, page: d.page },
      kind: d.kind,
    }
  })

  // Missing and low-confidence fields first, then ascending confidence.
  const key = (f: ExtractedField) => (f.value === null ? -1 : f.confidence ?? 101)
  return fields.sort((a, b) => key(a) - key(b))
}

function buildCoverage(claim: Claim, period: { start: string; end: string }): CoverageCheck[] {
  if (claim.flag === 'Agent failed') {
    const detail = 'Not checked: the agent could not process this claim.'
    return [
      { id: 'in-force', label: 'Policy in force on loss date', result: 'unknown', detail },
      { id: 'covered', label: `Loss type covered (${claim.lob})`, result: 'unknown', detail },
      { id: 'limit', label: `Within policy limit ${formatMoney(LIMIT[claim.lob])}`, result: 'unknown', detail },
      { id: 'documents', label: 'Required documents present', result: 'unknown', detail },
    ]
  }
  const outside = claim.flag === 'Loss date outside policy period'
  const awaiting = claim.flag === 'Awaiting document' || claim.status === 'Info requested'
  const limit = LIMIT[claim.lob]
  const checks: CoverageCheck[] = [
    {
      id: 'in-force',
      label: 'Policy in force on loss date',
      result: outside ? 'flag' : 'pass',
      detail: outside
        ? `Loss date ${formatDate(claim.lossDate)} is before the policy period ${formatDate(period.start)} – ${formatDate(period.end)}.`
        : `Loss date ${formatDate(claim.lossDate)} is within ${formatDate(period.start)} – ${formatDate(period.end)}.`,
    },
    { id: 'covered', label: `Loss type covered (${LOSS_TYPE[claim.lob]})`, result: 'pass', detail: `${LOSS_TYPE[claim.lob]} is covered under this policy.` },
    {
      id: 'limit',
      label: `Within policy limit ${formatMoney(limit)}`,
      result: claim.claimed <= limit ? 'pass' : 'flag',
      detail: `Claimed ${formatMoney(claim.claimed)} ${claim.claimed <= limit ? 'is below' : 'exceeds'} the policy limit of ${formatMoney(limit)}.`,
    },
    {
      id: 'authority',
      label: `Within handler authority ${formatMoney(AUTHORITY_LIMIT)}`,
      result: claim.claimed <= AUTHORITY_LIMIT ? 'pass' : 'flag',
      detail:
        claim.claimed <= AUTHORITY_LIMIT
          ? 'A handler can approve this amount.'
          : `Needs senior approval above ${formatMoney(AUTHORITY_LIMIT)}.`,
    },
    {
      id: 'documents',
      label: 'Required documents present',
      result: awaiting ? 'unknown' : 'pass',
      detail: awaiting ? 'Awaiting document' : 'All required documents received.',
    },
    {
      id: 'duplicate',
      label: 'No duplicate claim found',
      result: claim.flag === 'Duplicate suspected' ? 'flag' : 'pass',
      detail: claim.flag === 'Duplicate suspected' ? 'A similar claim exists for the same policy and loss date.' : 'No matching claim found.',
    },
  ]
  return checks
}

function buildSummary(claim: Claim, payable: number): ClaimDetail['agentSummary'] {
  if (claim.flag === 'Agent failed') {
    return {
      recommendation: 'Manual review required',
      notes: ['The agent could not extract fields from the submitted documents.', 'Review the documents and enter the values manually.'],
    }
  }
  const notes: string[] = []
  const level = claim.confidence === null ? null : confidenceLevel(claim.confidence)
  if (level === 'Low') notes.push(`Confidence is low (${claim.confidence}%); verify extracted fields against the documents.`)
  if (level === null) notes.push('No confidence score is available for this claim.')
  switch (claim.flag) {
    case 'Loss date outside policy period':
      notes.push('Loss date falls outside the policy period; check the policy dates before approving.')
      break
    case 'Above authority limit':
      notes.push(`Payable ${formatMoney(payable)} exceeds the handler authority limit of ${formatMoney(AUTHORITY_LIMIT)}.`)
      break
    case 'Awaiting document':
      notes.push('A required document is still missing.')
      break
    case 'Duplicate suspected':
      notes.push('A similar claim exists for the same policy; compare before approving.')
      break
    case 'Referred for review':
      notes.push('This claim was referred for review.')
      break
  }

  let recommendation: string
  if (claim.status === 'Denied') recommendation = 'Deny'
  else if (claim.status === 'Paid' || claim.status === 'Closed') recommendation = 'No action needed'
  else if (claim.flag === 'Above authority limit' || claim.claimed > AUTHORITY_LIMIT) recommendation = 'Approve with senior sign-off'
  else if (claim.flag || level === 'Low' || level === null) recommendation = 'Review before deciding'
  else if (level === 'Medium') recommendation = 'Approve after review'
  else recommendation = 'Approve'
  if (notes.length === 0) notes.push('All checks passed.')
  return { recommendation, notes }
}

function buildAudit(claim: Claim, n: number, fieldCount: number, payable: number, denial?: { reason: string }): AuditEvent[] {
  const base = 8 * 60 + (n % 90)
  const events: Omit<AuditEvent, 'id'>[] = [
    { at: at(claim.reportedDate, base), actor: { kind: 'policyholder' }, event: 'Submitted FNOL form', detail: '3 pages' },
    { at: at(claim.reportedDate, base + 2), actor: { kind: 'agent' }, ...(claim.flag === 'Agent failed'
      ? { event: 'Failed to extract fields', detail: 'Manual review required' }
      : { event: `Extracted ${fieldCount} fields from FNOL` }) },
  ]
  if (claim.flag && claim.flag !== 'Agent failed') {
    events.push({ at: at(claim.reportedDate, base + 3), actor: { kind: 'agent' }, event: `Flagged “${claim.flag}”` })
  }
  const next = addDays(claim.reportedDate, 1)
  if (claim.handler) {
    events.push({ at: at(claim.reportedDate, base + 4), actor: { kind: 'system' }, event: `Assigned to ${claim.handler}` })
    const actor = { kind: 'person', name: claim.handler } as const
    switch (claim.status) {
      case 'In review':
        events.push({ at: at(next, 9 * 60 + (n % 120)), actor, event: 'Started review' })
        break
      case 'Info requested':
        events.push({ at: at(next, 9 * 60 + (n % 120)), actor, event: 'Requested info', detail: 'Missing document' })
        break
      case 'Approved':
        events.push({ at: at(next, 9 * 60 + (n % 120)), actor, event: `Approved payout ${formatMoney(payable)}` })
        break
      case 'Denied':
        events.push({ at: at(next, 9 * 60 + (n % 120)), actor, event: 'Denied claim', detail: denial?.reason })
        break
      case 'Paid':
        events.push({ at: at(next, 9 * 60 + (n % 120)), actor, event: `Approved payout ${formatMoney(payable)}` })
        events.push({ at: at(addDays(next, 2), 10 * 60), actor: { kind: 'system' }, event: `Payout ${formatMoney(payable)} sent` })
        break
      case 'Closed':
        events.push({ at: at(next, 9 * 60 + (n % 120)), actor, event: 'Closed claim' })
        break
      case 'Reopened':
        events.push({ at: at(next, 9 * 60 + (n % 120)), actor, event: 'Reopened claim' })
        break
    }
  }
  // Newest first.
  return events
    .map((e, i) => ({ ...e, id: `ev-${i + 1}` }))
    .reverse()
}

function genericDetail(claim: Claim): ClaimDetail {
  const n = seedOf(claim.id)
  const outside = claim.flag === 'Loss date outside policy period'
  const start = outside ? addDays(claim.lossDate, 9) : DEFAULT_POLICY_PERIOD.start
  const policyPeriod = outside ? { start, end: addDays(start, 364) } : DEFAULT_POLICY_PERIOD

  const documents = buildDocuments(claim)
  const fields = buildFields(claim, n, documents)

  const deductible = DEDUCTIBLE[claim.lob]
  const limit = LIMIT[claim.lob]
  const payable = Math.min(Math.max(claim.claimed - deductible, 0), limit)
  const payout: Payout = {
    claimed: claim.claimed,
    deductible,
    limit,
    ...(claim.status === 'Denied' ? { denied: DENIAL_REASONS[n % DENIAL_REASONS.length] } : {}),
  }

  return {
    claim,
    policyPeriod,
    fields,
    documents,
    coverage: buildCoverage(claim, policyPeriod),
    payout,
    agentSummary: buildSummary(claim, payable),
    audit: buildAudit(claim, n, fields.filter((f) => f.value !== null).length, payable, payout.denied),
  }
}

/** Detail for a claim id; null when the id is unknown. Pure: the same id always gives the same detail. */
export function getClaimDetail(id: string): ClaimDetail | null {
  const claim = getClaim(id)
  if (!claim) return null
  return id === SARAH_ID ? sarahDetail(claim) : genericDetail(claim)
}
