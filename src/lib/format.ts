import type { ConfidenceLevel } from '@/data/types'

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
