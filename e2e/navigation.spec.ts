import { expect, test } from '@playwright/test'
import { disableAnimations } from './fixtures.ts'

const CLAIM = 'CLM-2026-004817'

const PAGES = [
  { hash: 'overview', title: 'Overview · ClaimDesk' },
  { hash: 'claims-queue', title: 'Claims queue · ClaimDesk' },
  { hash: 'my-assigned', title: 'My assigned · ClaimDesk' },
  { hash: 'referred', title: 'Referred · ClaimDesk' },
  { hash: 'policies', title: 'Policies · ClaimDesk' },
  { hash: 'policyholders', title: 'Policyholders · ClaimDesk' },
  { hash: 'reports', title: 'Reports · ClaimDesk' },
  { hash: 'settings', title: 'Settings · ClaimDesk' },
  { hash: `claim-${CLAIM}`, title: `${CLAIM} · ClaimDesk` },
]

test.beforeEach(async ({ page }) => {
  await disableAnimations(page)
})

test.describe('routes', () => {
  for (const { hash, title } of PAGES) {
    test(`#${hash} loads with title "${title}"`, async ({ page }) => {
      await page.goto(`#${hash}`)
      await expect(page).toHaveTitle(title)
      await expect(page.locator('main#main')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }

  test('no hash shows the Overview', async ({ page }) => {
    await page.goto('')
    await expect(page).toHaveTitle('Overview · ClaimDesk')
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  })
})

test('unknown claim id shows not-found with a link back to the queue', async ({ page }) => {
  await page.goto('#claim-CLM-0000-000000')
  await expect(page.getByRole('heading', { level: 1, name: 'Claim not found' })).toBeVisible()
  await expect(page.getByText('No claim CLM-0000-000000')).toBeVisible()
  await page.getByRole('link', { name: 'Back to queue' }).click()
  await expect(page).toHaveURL(/#claims-queue$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()
})

test('in-app navigation moves focus to main#main and updates the title', async ({ page }) => {
  await page.goto('#overview')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()

  await page.evaluate(() => {
    window.location.hash = '#claims-queue'
  })
  await expect(page).toHaveTitle('Claims queue · ClaimDesk')
  await expect(page.locator('main#main')).toBeFocused()

  await page.evaluate((id) => {
    window.location.hash = `#claim-${id}`
  }, CLAIM)
  await expect(page).toHaveTitle(`${CLAIM} · ClaimDesk`)
  await expect(page.locator('main#main')).toBeFocused()
})

test('skip link is first in tab order, appears on focus and moves focus to main', async ({ page }) => {
  await page.goto('#claims-queue')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await page.keyboard.press('Tab')
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()
  // The skip link's own hash must not change the page.
  await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()
  await expect(page).toHaveTitle('Claims queue · ClaimDesk')
})

test('browser back and forward between queue and claim', async ({ page }) => {
  await page.goto('#claims-queue')
  await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()

  await page.evaluate((id) => {
    window.location.hash = `#claim-${id}`
  }, CLAIM)
  await expect(page.getByRole('heading', { level: 1, name: CLAIM })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/#claims-queue$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()
  await expect(page).toHaveTitle('Claims queue · ClaimDesk')

  await page.goForward()
  await expect(page).toHaveURL(new RegExp(`#claim-${CLAIM}$`))
  await expect(page.getByRole('heading', { level: 1, name: CLAIM })).toBeVisible()
  await expect(page).toHaveTitle(`${CLAIM} · ClaimDesk`)
})
