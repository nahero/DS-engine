import type { Claim, ClaimFlag, ClaimStatus, ConfidenceLevel, LineOfBusiness } from './types'

// ---------------------------------------------------------------------------
// Formatting and scoring helpers
// ---------------------------------------------------------------------------

const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

/** `€12,480.00` */
export function formatMoney(n: number): string {
  return eur.format(n)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `12 Sep 2026` from an ISO date or date-time (day is zero-padded, as in the Figma rows: `09 Sep 2026`). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`
}

/** High ≥ 90, Medium 70–89, Low < 70. */
export function confidenceLevel(score: number): ConfidenceLevel {
  return score >= 90 ? 'High' : score >= 70 ? 'Medium' : 'Low'
}

/** 0 overdue · 1 agent failed · 2 low confidence · 3 missing data (no score or unassigned) · 4 the rest. */
export function needsAttentionRank(claim: Claim): number {
  if (claim.slaDays !== null && claim.slaDays < 0) return 0
  if (claim.flag === 'Agent failed') return 1
  if (claim.confidence !== null && confidenceLevel(claim.confidence) === 'Low') return 2
  if (claim.confidence === null || claim.handler === null) return 3
  return 4
}

/** Rank first, then oldest reported date first, then id for a stable order. */
export function compareNeedsAttention(a: Claim, b: Claim): number {
  return (
    needsAttentionRank(a) - needsAttentionRank(b) ||
    a.reportedDate.localeCompare(b.reportedDate) ||
    a.id.localeCompare(b.id)
  )
}

// ---------------------------------------------------------------------------
// Seeded data
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HANDLERS = ['Emily Carter', 'Rachel Morgan', 'Daniel Brooks', 'Jessica Turner', 'Andrew Sullivan', 'Megan Foster']

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
  'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Karen', 'Daniel', 'Nancy',
  'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Steven', 'Sandra', 'Andrew', 'Ashley',
  'Joshua', 'Kimberly', 'Brian', 'Donna', 'Nathan', 'Carol', 'Tyler', 'Amanda', 'Jacob', 'Melissa',
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Wilson', 'Anderson',
  'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis',
  'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams',
  'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner',
]

const COMPANY_SUFFIXES = [
  'Property Holdings LLC',
  'Logistics & Freight Services Inc.',
  'Construction Group Ltd.',
  'Medical Supplies Corp.',
  'Fleet Management Partners LLP',
  'Hospitality & Events Co.',
]

const STATUS_WEIGHTS: [ClaimStatus, number][] = [
  ['New', 28],
  ['In review', 30],
  ['Info requested', 10],
  ['Approved', 8],
  ['Denied', 6],
  ['Paid', 9],
  ['Closed', 6],
  ['Reopened', 3],
]

const LOBS: LineOfBusiness[] = ['Motor', 'Property', 'Health', 'Travel']

const AMOUNT_RANGE: Record<LineOfBusiness, [number, number]> = {
  Travel: [80, 3000],
  Health: [150, 25000],
  Motor: [300, 40000],
  Property: [500, 120000],
}

const FLAGS: ClaimFlag[] = [
  'Referred for review',
  'Loss date outside policy period',
  'Awaiting document',
  'Above authority limit',
  'Agent failed',
  'Duplicate suspected',
]

const FIRST_ID = 4780
const GENERATED_COUNT = 988
const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'

function isoDate(ms: number) {
  return new Date(ms).toISOString().slice(0, 10)
}

const DAY = 86_400_000
const YEAR_START = Date.UTC(2026, 0, 1)
// Newest generated claim was reported on 30 Aug 2026; the oldest on 2 Jan 2026.
const NEWEST_REPORTED = Date.UTC(2026, 7, 30)
const OLDEST_REPORTED = Date.UTC(2026, 0, 2)

/** The 12 rows designed in Figma (02 Claims queue). `slaDays` from the SLA text; reported dates are 1–3 days after the loss. */
const figmaClaims: Claim[] = [
  { id: 'CLM-2026-004821', policyholder: 'Michael Johnson', lob: 'Motor', lossDate: '2026-09-21', reportedDate: '2026-09-23', slaDays: -1, status: 'In review', confidence: 52, flag: 'Loss date outside policy period', claimed: 8920, handler: 'Emily Carter', policyNo: 'POL-MTRX-3305' },
  { id: 'CLM-2026-004819', policyholder: 'Montgomery-Whitfield Property Holdings LLC', lob: 'Property', lossDate: '2026-09-18', reportedDate: '2026-09-21', slaDays: 0, status: 'New', confidence: null, flag: 'Agent failed', claimed: 48300, handler: null, policyNo: 'POL-PRPW-7712' },
  { id: 'CLM-2026-004817', policyholder: 'Sarah Mitchell', lob: 'Health', lossDate: '2026-09-20', reportedDate: '2026-09-22', slaDays: 1, status: 'In review', confidence: 71, flag: 'Above authority limit', claimed: 12480, handler: 'Emily Carter', policyNo: 'POL-HRTN-4821' },
  { id: 'CLM-2026-004812', policyholder: 'James Wilson', lob: 'Motor', lossDate: '2026-09-19', reportedDate: '2026-09-21', slaDays: 2, status: 'Info requested', confidence: 88, flag: 'Awaiting document', claimed: 3150, handler: 'Rachel Morgan', policyNo: 'POL-MTRK-2094' },
  { id: 'CLM-2026-004809', policyholder: 'Olivia Bennett', lob: 'Travel', lossDate: '2026-09-14', reportedDate: '2026-09-16', slaDays: 2, status: 'In review', confidence: 64, flag: 'Duplicate suspected', claimed: 1240, handler: 'Emily Carter', policyNo: 'POL-TRVL-5568' },
  { id: 'CLM-2026-004806', policyholder: 'Christopher Hayes', lob: 'Property', lossDate: '2026-09-11', reportedDate: '2026-09-14', slaDays: 3, status: 'In review', confidence: 91, flag: null, claimed: 6700, handler: 'Rachel Morgan', policyNo: 'POL-PRPH-8843' },
  { id: 'CLM-2026-004803', policyholder: 'Ashley Turner', lob: 'Motor', lossDate: '2026-09-16', reportedDate: '2026-09-18', slaDays: 3, status: 'New', confidence: 96, flag: null, claimed: 2140, handler: null, policyNo: 'POL-MTRT-1170' },
  { id: 'CLM-2026-004799', policyholder: 'Ryan Cooper', lob: 'Health', lossDate: '2026-09-09', reportedDate: '2026-09-11', slaDays: 4, status: 'In review', confidence: 93, flag: null, claimed: 870.5, handler: 'Daniel Brooks', policyNo: 'POL-HRTC-6029' },
  { id: 'CLM-2026-004795', policyholder: 'Emma Collins', lob: 'Travel', lossDate: '2026-09-07', reportedDate: '2026-09-10', slaDays: 5, status: 'Approved', confidence: 97, flag: null, claimed: 460, handler: 'Emily Carter', policyNo: 'POL-TRVC-3917' },
  { id: 'CLM-2026-004790', policyholder: 'Matthew Reed', lob: 'Motor', lossDate: '2026-09-02', reportedDate: '2026-09-04', slaDays: null, status: 'Paid', confidence: 95, flag: null, claimed: 2140, handler: 'Emily Carter', policyNo: 'POL-MTRR-4486' },
  { id: 'CLM-2026-004788', policyholder: 'Lauren Price', lob: 'Property', lossDate: '2026-08-30', reportedDate: '2026-09-02', slaDays: null, status: 'Denied', confidence: 83, flag: 'Referred for review', claimed: 19900, handler: 'Daniel Brooks', policyNo: 'POL-PRPL-2751' },
  { id: 'CLM-2026-004781', policyholder: 'Kevin Parker', lob: 'Health', lossDate: '2026-08-28', reportedDate: '2026-08-31', slaDays: 6, status: 'In review', confidence: 89, flag: null, claimed: 1015.2, handler: 'Rachel Morgan', policyNo: 'POL-HRTP-9304' },
]

function generateClaims(): Claim[] {
  const rnd = mulberry32(20260929)
  const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1))
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rnd() * list.length)]
  const weighted = <T,>(list: readonly [T, number][]): T => {
    const total = list.reduce((sum, [, w]) => sum + w, 0)
    let r = rnd() * total
    for (const [value, w] of list) {
      r -= w
      if (r < 0) return value
    }
    return list[list.length - 1][0]
  }

  const rows: Claim[] = []
  for (let i = 0; i < GENERATED_COUNT; i++) {
    const id = `CLM-2026-${String(FIRST_ID - i).padStart(6, '0')}`

    let policyholder: string
    if (i === 6) policyholder = 'Montgomery-Whitfield Property Holdings LLC'
    else if (i === 41) policyholder = 'Northbridge Logistics & Freight Services Inc.'
    else if (rnd() < 0.08) policyholder = `${pick(LAST_NAMES)}-${pick(LAST_NAMES)} ${pick(COMPANY_SUFFIXES)}`
    else policyholder = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

    const lob = pick(LOBS)
    const [lo, hi] = AMOUNT_RANGE[lob]
    // Skew towards smaller amounts, as real claim sizes are.
    let claimed = Math.round((lo + (hi - lo) * Math.pow(rnd(), 2.2)) * 100) / 100

    const status = weighted(STATUS_WEIGHTS)

    const reportedMs =
      NEWEST_REPORTED -
      Math.floor((i * (NEWEST_REPORTED - OLDEST_REPORTED)) / DAY / GENERATED_COUNT) * DAY -
      int(0, 1) * DAY
    const reportedDate = isoDate(Math.max(reportedMs, OLDEST_REPORTED))
    const lossMs = Math.max(Date.parse(reportedDate) - int(1, 14) * DAY, YEAR_START)
    const lossDate = isoDate(Math.min(lossMs, Date.parse(reportedDate) - DAY))

    const conf = rnd()
    let confidence: number | null =
      rnd() < 0.08 ? null : conf < 0.55 ? int(90, 99) : conf < 0.8 ? int(70, 89) : int(38, 69)

    let flag: ClaimFlag | null = null
    if (rnd() < 0.1) {
      flag = pick(FLAGS)
      if (flag === 'Above authority limit') {
        // Only meaningful above the €10,000 handler authority: bump the amount, or pick a different reason.
        if (hi > 10000) claimed = Math.round((10000 + rnd() * (hi - 10000) * 0.6 + 100) * 100) / 100
        else flag = 'Referred for review'
      }
      if (flag === 'Agent failed') confidence = null
    }

    const handler = rnd() < 0.2 ? null : pick(HANDLERS)
    const slaDays = status === 'Paid' || status === 'Denied' || status === 'Closed' ? null : int(-5, 10)

    const policyNo = `POL-${Array.from({ length: 4 }, () => LETTERS[Math.floor(rnd() * LETTERS.length)]).join('')}-${String(int(0, 9999)).padStart(4, '0')}`

    rows.push({ id, policyholder, lob, lossDate, reportedDate, slaDays, status, confidence, flag, claimed, handler, policyNo })
  }
  return rows
}

/** 1,000 claims: the 12 rows designed in Figma first, then 988 seeded rows with descending ids. Deterministic. */
export const claims: Claim[] = [...figmaClaims, ...generateClaims()]

let index: Map<string, Claim> | null = null

export function getClaim(id: string): Claim | undefined {
  if (!index) index = new Map(claims.map((c) => [c.id, c]))
  return index.get(id)
}
