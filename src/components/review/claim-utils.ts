import { AUTHORITY_LIMIT } from '@/data/claim-detail'
import { confidenceLevel } from '@/data/claims'
import type { ExtractedField, Payout } from '@/data/types'

/** A handler's correction of an agent value. The original agent value is kept. */
export interface FieldCorrection {
  /** Agent value before the first correction; null = the agent found nothing. */
  original: string | null
  by: string
  /** `HH:MM` */
  time: string
}

export type ExtractedFieldState = 'default' | 'low-confidence' | 'missing' | 'agent-failed' | 'editing' | 'corrected'

/** Row state from the field and its current edit/correction status. Editing wins, then corrected. */
export function fieldState(field: ExtractedField, value: string | null, opts: { editing?: boolean; corrected?: boolean } = {}): ExtractedFieldState {
  if (opts.editing) return 'editing'
  if (opts.corrected) return 'corrected'
  if (field.agentFailed) return 'agent-failed'
  if (value === null) return 'missing'
  if (field.confidence !== null && confidenceLevel(field.confidence) === 'Low') return 'low-confidence'
  return 'default'
}

/** 0 missing or agent failed · 1 low confidence · 2 the rest. Uses the agent's data, so rows don't jump while a field is corrected. */
function attentionRank(field: ExtractedField): number {
  if (field.agentFailed || field.value === null) return 0
  if (field.confidence !== null && confidenceLevel(field.confidence) === 'Low') return 1
  return 2
}

/** Missing and agent-failed fields first, then low confidence, then the rest (stable within a group). */
export function sortFields(fields: ExtractedField[]): ExtractedField[] {
  return fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => attentionRank(a.field) - attentionRank(b.field) || a.index - b.index)
    .map(({ field }) => field)
}

/** `HR•• •••• •••• •••• 7730`: country code and last four only. */
export function maskIban(iban: string): string {
  return `${iban.slice(0, 2)}•• •••• •••• •••• ${iban.slice(-4)}`
}

/** `HR12 1001 0051 8630 0016 0` */
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})(?=.)/g, '$1 ')
}

/** `POL-••••-4821`: prefix and last four only. */
export function maskPolicyNo(policyNo: string): string {
  const parts = policyNo.split('-')
  return `${parts[0]}-••••-${parts[parts.length - 1]}`
}

export interface PayoutDerived {
  /** Which input blocks the calculation, if any. */
  missing: 'claimed amount' | 'deductible' | null
  denied: boolean
  covered: number | null
  /** Amount to pay: 0 when denied, null when it can't be calculated. */
  payable: number | null
  capped: boolean
  /** Covered amount above the policy limit (only when capped). */
  notCovered: number
  overAuthority: boolean
}

/** claimed − deductible, capped at the policy limit. Denied pays nothing; a missing input means no result. */
export function derivePayout(payout: Payout): PayoutDerived {
  const { claimed, deductible, limit } = payout
  const denied = payout.denied !== undefined
  const missing = claimed === null ? 'claimed amount' : deductible === null ? 'deductible' : null
  if (denied) return { missing, denied, covered: null, payable: 0, capped: false, notCovered: 0, overAuthority: false }
  if (missing || claimed === null || deductible === null) {
    return { missing, denied, covered: null, payable: null, capped: false, notCovered: 0, overAuthority: false }
  }
  const covered = Math.max(claimed - deductible, 0)
  const capped = limit !== null && covered > limit
  const payable = capped ? limit : covered
  return { missing, denied, covered, payable, capped, notCovered: capped ? covered - limit : 0, overAuthority: payable > AUTHORITY_LIMIT }
}
