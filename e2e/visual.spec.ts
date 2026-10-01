import { expect, test } from '@playwright/test'
import { disableAnimations, setDisplay, type DisplayOptions } from './fixtures.ts'

// Baselines are rendered on CI Linux; local macOS fonts differ. CI sets VISUAL=1 once baselines are committed.
test.skip(process.platform !== 'linux', 'Baselines are generated on CI Linux')
test.skip(!process.env.VISUAL, 'Set VISUAL=1 to run visual regression')

const SCREENS = [
  { name: 'overview', hash: 'overview', heading: 'Overview' },
  { name: 'claims-queue', hash: 'claims-queue', heading: 'Claims queue' },
  { name: 'claim-detail', hash: 'claim-CLM-2026-004817', heading: 'CLM-2026-004817' },
]

const MODES: { name: string; display: DisplayOptions }[] = [
  { name: 'light-comfortable', display: { theme: 'light', density: 'comfortable' } },
  { name: 'dark-compact', display: { theme: 'dark', density: 'compact' } },
]

for (const { name: mode, display } of MODES) {
  test.describe(mode, () => {
    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await disableAnimations(page)
        await setDisplay(page, display)
        await page.goto(`#${screen.hash}`)
        await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        // Seeded data only; the single time-dependent area is audit entries added at runtime, none on first load.
        await expect(page).toHaveScreenshot(`${screen.name}-${mode}.png`, { fullPage: true, maxDiffPixelRatio: 0.01 })
      })
    }
  })
}
