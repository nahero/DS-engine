import { describe, expect, it } from 'vitest'
import type { ExtractedField } from '@/data/types'
import { sortFields } from './claim-utils'

function field(overrides: Partial<ExtractedField> = {}): ExtractedField {
  return {
    id: 'f',
    label: 'Field',
    value: 'Value',
    confidence: 95,
    source: { doc: 'FNOL', page: 1 },
    ...overrides,
  }
}

describe('sortFields', () => {
  it('puts missing and agent-failed first, then low confidence, then the rest, stable within a group', () => {
    const ok1 = field({ id: 'ok1' })
    const low = field({ id: 'low', confidence: 50 })
    const missing = field({ id: 'missing', value: null, confidence: null })
    const ok2 = field({ id: 'ok2', confidence: 80 })
    const failed = field({ id: 'failed', value: 'x', agentFailed: true })
    expect(sortFields([ok1, low, missing, ok2, failed]).map((f) => f.id)).toEqual(['missing', 'failed', 'low', 'ok1', 'ok2'])
  })
  it('does not mutate the input', () => {
    const input = [field({ id: 'a' }), field({ id: 'b', value: null })]
    sortFields(input)
    expect(input.map((f) => f.id)).toEqual(['a', 'b'])
  })
})
