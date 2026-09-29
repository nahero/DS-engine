import { confidenceLevel } from '@/data/claims'
import type { Claim, ClaimStatus, LineOfBusiness } from '@/data/types'
import type { SortingState } from '@tanstack/react-table'

export type ConfidenceFilter = 'High' | 'Medium' | 'Low' | 'No score'

export interface ClaimFilters {
  query: string
  status: ClaimStatus | null
  lob: LineOfBusiness | null
  confidence: ConfidenceFilter | null
  /** A handler name, or `UNASSIGNED`. */
  handler: string | null
}

export const UNASSIGNED = 'Unassigned'

export const emptyFilters: ClaimFilters = { query: '', status: null, lob: null, confidence: null, handler: null }

export const STATUSES: ClaimStatus[] = ['New', 'In review', 'Info requested', 'Approved', 'Denied', 'Paid', 'Closed', 'Reopened']
export const LINES_OF_BUSINESS: LineOfBusiness[] = ['Motor', 'Property', 'Health', 'Travel']
export const CONFIDENCE_BANDS: ConfidenceFilter[] = ['High', 'Medium', 'Low', 'No score']

/** Applies every active filter (AND). Search matches claim # and policyholder, case-insensitive. */
export function applyFilters(claims: Claim[], filters: ClaimFilters): Claim[] {
  const query = filters.query.trim().toLowerCase()
  return claims.filter((c) => {
    if (query && !c.id.toLowerCase().includes(query) && !c.policyholder.toLowerCase().includes(query)) return false
    if (filters.status && c.status !== filters.status) return false
    if (filters.lob && c.lob !== filters.lob) return false
    if (filters.confidence) {
      const band = c.confidence === null ? 'No score' : confidenceLevel(c.confidence)
      if (band !== filters.confidence) return false
    }
    if (filters.handler) {
      if (filters.handler === UNASSIGNED ? c.handler !== null : c.handler !== filters.handler) return false
    }
    return true
  })
}

export interface Chip {
  key: keyof ClaimFilters
  label: string
}

export function activeChips(filters: ClaimFilters): Chip[] {
  const chips: Chip[] = []
  const query = filters.query.trim()
  if (query) chips.push({ key: 'query', label: `Search: ${query}` })
  if (filters.status) chips.push({ key: 'status', label: `Status: ${filters.status}` })
  if (filters.lob) chips.push({ key: 'lob', label: `Line of business: ${filters.lob}` })
  if (filters.confidence) chips.push({ key: 'confidence', label: `Confidence: ${filters.confidence}` })
  if (filters.handler) chips.push({ key: 'handler', label: `Handler: ${filters.handler}` })
  return chips
}

export function hasActiveFilters(filters: ClaimFilters): boolean {
  return activeChips(filters).length > 0
}

/** Bulk approve is only allowed when every selected claim has a High confidence score. */
export function countNotHighConfidence(selected: Claim[]): number {
  return selected.filter((c) => c.confidence === null || confidenceLevel(c.confidence) !== 'High').length
}

/** Header label of each sortable column, for the sort indicator. */
export const SORT_LABELS: Record<string, string> = {
  id: 'Claim #',
  lossDate: 'Loss date',
  sla: 'SLA',
  confidence: 'Confidence',
  claimed: 'Claimed',
}

/** "Needs attention" (the default) or "Confidence (descending)". */
export function sortLabel(sorting: SortingState): string {
  const active = sorting[0]
  return active ? `${SORT_LABELS[active.id] ?? active.id} (${active.desc ? 'descending' : 'ascending'})` : 'Needs attention'
}

