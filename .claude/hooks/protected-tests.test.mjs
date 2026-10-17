import { describe, expect, it } from 'vitest'
import { switchesOff } from './protected-tests.mjs'

describe('protected tests: lines that switch a test off', () => {
  it.each([
    ["it.skip('formats euros', () => {"],
    ["test.skip('opens the claim', async ({ page }) => {"],
    ["describe.skip('worklist', () => {"],
    ["test.describe.skip('stories', () => {"],
    ['test.skip()'],
    ['test.skip(isMobile)'],
    ["it.only('formats euros', () => {"],
    ["it.todo('handles refunds')"],
    ["test.fixme('flaky on webkit', async () => {"],
    ["xit('formats euros', () => {"],
    ["a11y: { test: 'todo' },"],
    ["parameters: { a11y: { test: 'off' } },"],
  ])('blocks %s', (line) => {
    expect(switchesOff(line)).toBe(true)
  })

  it.each([
    ["test.skip(process.platform !== 'linux', 'Baselines are generated on CI Linux')"],
    ["test.skip(!process.env.VISUAL, 'Set VISUAL=1 to run visual regression')"],
    ["  test.skip(updating, 'baselines are being generated')"],
    ["it('skips weekends when counting days', () => {"],
    ['const skipped = items.filter((i) => i.skip)'],
    ["a11y: { test: 'error' },"],
  ])('allows %s', (line) => {
    expect(switchesOff(line)).toBe(false)
  })
})
