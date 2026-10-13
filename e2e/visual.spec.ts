import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { disableAnimations, setDisplay, type DisplayOptions } from './fixtures.ts'

// Baselines are rendered on CI Linux; local macOS fonts differ. CI sets VISUAL=1 once baselines are committed.
test.skip(process.platform !== 'linux', 'Baselines are generated on CI Linux')
test.skip(!process.env.VISUAL, 'Set VISUAL=1 to run visual regression')

// `pending`: the baseline is not committed yet. The test runs only when its own baseline file exists, or when a run
// updates snapshots (the "Update screenshots" workflow), so a new screen never fails the deploy before its baseline
// has been generated. Remove the flag once the baselines are committed.
const SCREENS: { name: string; hash: string; heading: string; pending?: boolean }[] = [
  { name: 'overview', hash: 'overview', heading: 'Overview' },
  { name: 'claims-queue', hash: 'claims-queue', heading: 'Claims queue' },
  { name: 'claim-detail', hash: 'claim-CLM-2026-004817', heading: 'CLM-2026-004817' },
  { name: 'my-assigned', hash: 'my-assigned', heading: 'My assigned' },
]

const MODES: { name: string; display: DisplayOptions }[] = [
  { name: 'light-comfortable', display: { theme: 'light', density: 'comfortable' } },
  { name: 'dark-compact', display: { theme: 'dark', density: 'compact' } },
]

for (const { name: mode, display } of MODES) {
  test.describe(mode, () => {
    for (const screen of SCREENS) {
      test(screen.name, async ({ page }, testInfo) => {
        const file = `${screen.name}-${mode}.png`
        const updating = testInfo.config.updateSnapshots === 'all' || testInfo.config.updateSnapshots === 'changed'
        test.skip(screen.pending === true && !updating && !fs.existsSync(testInfo.snapshotPath(file)), 'baseline not generated yet')
        await disableAnimations(page)
        await setDisplay(page, display)
        await page.goto(`#${screen.hash}`)
        await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        // Seeded data only; the single time-dependent area is audit entries added at runtime, none on first load.
        await expect(page).toHaveScreenshot(file, { fullPage: true, maxDiffPixelRatio: 0.01 })
      })
    }
  })
}
