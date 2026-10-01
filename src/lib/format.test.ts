import { describe, expect, it } from 'vitest'
import { confidenceLevel, formatDate, formatMoney } from './format'

describe('confidenceLevel', () => {
  it.each([
    [100, 'High'],
    [90, 'High'],
    [89, 'Medium'],
    [70, 'Medium'],
    [69, 'Low'],
    [0, 'Low'],
  ] as const)('%i is %s', (score, level) => {
    expect(confidenceLevel(score)).toBe(level)
  })
})

describe('formatMoney', () => {
  it('formats euros with thousands separator and two decimals', () => {
    expect(formatMoney(12480)).toBe('€12,480.00')
    expect(formatMoney(870.5)).toBe('€870.50')
  })
  it('formats zero', () => {
    expect(formatMoney(0)).toBe('€0.00')
  })
  it('formats negatives with a minus sign', () => {
    expect(formatMoney(-1250.5)).toBe('-€1,250.50')
  })
})

describe('formatDate', () => {
  it('formats an ISO date with a zero-padded day', () => {
    expect(formatDate('2026-09-09')).toBe('09 Sep 2026')
    expect(formatDate('2026-12-31')).toBe('31 Dec 2026')
  })
  it('ignores the time part of an ISO date-time', () => {
    expect(formatDate('2026-01-02T23:59:00')).toBe('02 Jan 2026')
  })
})
