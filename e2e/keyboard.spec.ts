import { expect, test } from '@playwright/test'
import { disableAnimations } from './fixtures.ts'

const CLAIM = 'CLM-2026-004817'

test.beforeEach(async ({ page }) => {
  await disableAnimations(page)
})

test('keyboard-only: skip link, queue rows, open a claim', async ({ page }) => {
  await page.goto('#claims-queue')
  await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()

  // Tab to the skip link and activate it.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()

  // Into the table: the first row is the roving tab stop.
  const rows = page.locator('tbody tr[data-row-index]')
  await rows.first().focus()
  await expect(rows.nth(0)).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(rows.nth(1)).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(rows.nth(2)).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(rows.nth(1)).toBeFocused()

  // x toggles selection of the focused row.
  await page.keyboard.press('x')
  await expect(rows.nth(1)).toHaveAttribute('data-state', 'selected')
  await expect(page.getByRole('region', { name: 'Bulk actions' }).getByText('1 selected', { exact: true })).toBeVisible()
  await page.keyboard.press('x')
  await expect(rows.nth(1)).not.toHaveAttribute('data-state', 'selected')
  await expect(page.getByRole('region', { name: 'Bulk actions' })).toHaveCount(0)

  // Enter opens the claim.
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#claim-CLM-/)
  await expect(page.locator('main#main')).toBeFocused()
})

test('Esc closes the confirmation panel and returns focus to its trigger', async ({ page }) => {
  await page.goto(`#claim-${CLAIM}`)
  await expect(page.getByRole('heading', { level: 1, name: CLAIM })).toBeVisible()

  const trigger = page.getByRole('button', { name: 'Send for senior approval' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const panel = page.getByRole('group', { name: 'Send for senior approval?' })
  await expect(panel).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.getByRole('button', { name: 'Confirm and send' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  // Nothing was recorded.
  await expect(page.getByRole('region', { name: 'Audit trail' }).getByText('Sent for senior approval')).toHaveCount(0)
})

test('Esc closes the refer panel and returns focus to Refer', async ({ page }) => {
  await page.goto(`#claim-${CLAIM}`)
  const refer = page.getByRole('button', { name: 'Refer', exact: true })
  await refer.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Reason for referral (required)')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Reason for referral (required)')).toHaveCount(0)
  await expect(refer).toBeFocused()
})
