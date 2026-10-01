import { expect, test } from '@playwright/test'
import { disableAnimations, expectNoA11yViolations, setDisplay } from './fixtures.ts'

const PAGES = ['overview', 'claims-queue', 'claim-CLM-2026-004817', 'claim-CLM-2026-004819', 'reports']

for (const theme of ['light', 'dark'] as const) {
  test.describe(`axe, ${theme}`, () => {
    for (const hash of PAGES) {
      test(`#${hash}`, async ({ page }) => {
        await disableAnimations(page)
        await setDisplay(page, { theme })
        await page.goto(`#${hash}`)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expectNoA11yViolations(page)
      })
    }
  })
}

test.describe('axe, brand purple', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`#claims-queue ${theme}`, async ({ page }) => {
      await disableAnimations(page)
      await setDisplay(page, { theme, brand: 'purple' })
      await page.goto('#claims-queue')
      await expect(page.getByRole('heading', { level: 1, name: 'Claims queue' })).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})

test.describe('axe, compact density', () => {
  test('#claim-CLM-2026-004817 dark', async ({ page }) => {
    await disableAnimations(page)
    await setDisplay(page, { theme: 'dark', density: 'compact' })
    await page.goto('#claim-CLM-2026-004817')
    await expect(page.getByRole('heading', { level: 1, name: 'CLM-2026-004817' })).toBeVisible()
    await expectNoA11yViolations(page)
  })
})

test.describe('no page-level horizontal scroll at 375px', () => {
  for (const hash of PAGES) {
    test(`#${hash}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'Only meaningful at the mobile viewport')
      await disableAnimations(page)
      await page.goto(`#${hash}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })
  }
})
