import { confidenceLevel } from '@/lib/format'
import type { ExtractedField } from '@/data/types'

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
