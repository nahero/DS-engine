import { expect, test, type Page } from '@playwright/test'
import { disableAnimations } from './fixtures.ts'

const CLAIM = 'CLM-2026-004817'

// The header also has a global search with the same accessible name, so scope to the queue's filter bar.
const filterSearch = (page: Page) => page.getByRole('search', { name: 'Filter claims' }).getByRole('textbox', { name: 'Search claims' })

test.beforeEach(async ({ page }) => {
  await disableAnimations(page)
})

test('review a claim end to end: find, open, correct a field, send for senior approval', async ({ page }) => {
  // Queue
  await page.goto('#claims-queue')
  await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()

  // Sort by a column, then search for the claim.
  await page.getByRole('button', { name: /^Claimed/ }).click()
  await expect(page.getByRole('columnheader', { name: /Claimed/ })).toHaveAttribute('aria-sort', /ascending|descending/)

  await filterSearch(page).fill('004817')
  const row = page.getByRole('row', { name: new RegExp(CLAIM) })
  await expect(row).toHaveCount(1)
  await expect(page.getByText('1 result', { exact: true })).toBeVisible()

  // Open it with the keyboard: focus the row, press Enter.
  await row.focus()
  await expect(row).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`#claim-${CLAIM}$`))
  await expect(page.getByRole('heading', { level: 1, name: CLAIM })).toBeVisible()
  await expect(page.getByText('Sarah Mitchell · Health claim')).toBeVisible()

  // Correct a field: Treatment date is missing, so enter a value.
  const treatment = page.getByRole('row', { name: /Treatment date/ })
  await treatment.getByRole('button', { name: 'Correct Treatment date' }).click()
  const input = page.getByRole('textbox', { name: 'Edit Treatment date' })
  await expect(input).toBeFocused()
  await input.fill('21 Sep 2026')
  await page.keyboard.press('Enter')
  await expect(input).toHaveCount(0)
  await expect(treatment.getByText('21 Sep 2026')).toBeVisible()
  await expect(treatment.getByText('Corrected')).toBeVisible()
  // Focus returns to the row's edit trigger.
  await expect(page.locator('[data-edit-trigger="treatment-date"]')).toBeFocused()

  // The audit trail (side panel) shows the correction.
  const sideAudit = page.getByRole('region', { name: 'Audit trail' })
  await expect(sideAudit.getByText(/Corrected .Treatment date./)).toBeVisible()

  // And the full audit tab.
  await page.getByRole('tab', { name: 'Audit trail' }).click()
  await expect(page.getByRole('tabpanel').getByText(/Corrected .Treatment date./)).toBeVisible()

  // Send for senior approval (payable is above the authority limit).
  await expect(page.getByText(/Needs senior approval above/)).toBeVisible()
  await page.getByRole('button', { name: 'Send for senior approval' }).click()
  const panel = page.getByRole('group', { name: 'Send for senior approval?' })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Confirm and send' }).click()

  // Button state and audit event.
  await expect(panel).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sent for senior approval' })).toBeDisabled()
  await expect(page.getByText('Waiting for a senior handler to decide')).toBeVisible()
  await expect(page.getByRole('tabpanel').getByText('Sent for senior approval', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('tabpanel').getByRole('listitem').filter({ hasText: 'Sent for senior approval' }).getByText(/exceeds/),
  ).toBeVisible()
})

test('bulk approve is only enabled when every selected claim is High confidence', async ({ page }) => {
  await page.goto('#claims-queue')
  await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()

  // CLM-2026-004817 is 71% confidence: not High.
  await filterSearch(page).fill('004817')
  const row = page.getByRole('row', { name: new RegExp(CLAIM) })
  await expect(row).toHaveCount(1)
  await row.getByRole('checkbox').check()

  const bulk = page.getByRole('region', { name: 'Bulk actions' })
  await expect(bulk.getByText('1 selected', { exact: true })).toBeVisible()
  await expect(bulk.getByRole('button', { name: 'Approve 1' })).toBeDisabled()
  await expect(bulk.getByText('1 selected isn’t High confidence')).toBeVisible()

  // Clear, then pick only High-confidence claims.
  await bulk.getByRole('button', { name: 'Clear selection' }).click()
  await expect(bulk).toHaveCount(0)

  await filterSearch(page).fill('')
  await page.getByRole('combobox', { name: /^Confidence/ }).click()
  await page.getByRole('option', { name: 'High' }).click()
  await expect(page.getByRole('combobox', { name: 'Confidence: High' })).toBeVisible()

  const rowChecks = page.getByRole('checkbox', { name: /^Select CLM-/ })
  await rowChecks.nth(0).check()
  await rowChecks.nth(1).check()
  await expect(bulk.getByText('2 selected', { exact: true })).toBeVisible()
  await expect(bulk.getByRole('button', { name: 'Approve 2' })).toBeEnabled()
  await expect(bulk.getByText('Bulk approve only for High confidence')).toBeVisible()

  await bulk.getByRole('button', { name: 'Approve 2' }).click()
  await expect(page.getByRole('status').filter({ hasText: '2 claims approved' })).toHaveCount(1)
  await expect(bulk).toHaveCount(0)
})

test('revealing PII records an audit event', async ({ page }) => {
  await page.goto(`#claim-${CLAIM}`)
  await expect(page.getByRole('heading', { level: 1, name: CLAIM })).toBeVisible()

  const sideAudit = page.getByRole('region', { name: 'Audit trail' })
  await expect(sideAudit.getByText('Revealed IBAN')).toHaveCount(0)

  const ibanRow = page.getByRole('row', { name: /IBAN/ })
  await expect(ibanRow.getByText(/^HR•• •••• •••• •••• \d{4}$/)).toBeVisible()
  await page.getByRole('button', { name: 'Reveal IBAN' }).click()
  await expect(ibanRow.getByText(/^HR\d{2} \d{4} \d{4} \d{4} \d{4} \d$/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hide IBAN' })).toHaveAttribute('aria-pressed', 'true')
  await expect(sideAudit.getByText('Revealed IBAN')).toBeVisible()
})
