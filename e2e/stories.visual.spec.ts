import fs from 'node:fs'
import { expect, test } from '@playwright/test'

// Visual regression per component: the first story of every Storybook component, in the Purple brand, light and dark,
// comfortable density. A token change shows up as a diff on every component it touches. The Default brand and compact
// density are covered by the screen baselines in visual.spec.ts. Scope chosen for repo weight (ADR 0018).
// Reads the built Storybook's index (storybook-static/index.json), so build Storybook first; the `stories` project
// serves it on its own port.
test.skip(process.platform !== 'linux', 'Baselines are generated on CI Linux')
test.skip(!process.env.VISUAL, 'Set VISUAL=1 to run visual regression')

const INDEX = 'storybook-static/index.json'
type Entry = { id: string; type: string; title: string; name: string }
const all: Entry[] = fs.existsSync(INDEX)
  ? Object.values((JSON.parse(fs.readFileSync(INDEX, 'utf8')) as { entries: Record<string, Entry> }).entries)
  : []
// First story per component (index order follows the story file's export order).
const firstPerTitle = new Map<string, Entry>()
for (const e of all) if (e.type === 'story' && !firstPerTitle.has(e.title)) firstPerTitle.set(e.title, e)

const MODES = [
  { name: 'purple-light', globals: 'brand:purple;theme:light' },
  { name: 'purple-dark', globals: 'brand:purple;theme:dark' },
]

test('Storybook was built', () => {
  expect(firstPerTitle.size, `No stories in ${INDEX}: run npm run build-storybook first`).toBeGreaterThan(0)
})

for (const story of firstPerTitle.values()) {
  test.describe(story.title, () => {
    for (const mode of MODES) {
      test(mode.name, async ({ page }, testInfo) => {
        // A new component's baseline doesn't exist until the Update screenshots workflow has run; skip it until then,
        // so adding a component never blocks the deploy. Existing baselines always compare.
        const file = `${story.id}--${mode.name}.png`
        const updating = testInfo.config.updateSnapshots === 'all' || testInfo.config.updateSnapshots === 'changed'
        test.skip(!updating && !fs.existsSync(testInfo.snapshotPath(file)), 'baseline not generated yet')

        await page.goto(`iframe.html?id=${story.id}&viewMode=story&globals=${mode.globals};density:comfortable;motion:reduced`)
        // Wait until the story has rendered and its play function (if any) has finished.
        await page.waitForFunction(() => {
          const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__
          return ['completed', 'finished', 'errored', 'aborted'].includes(preview?.currentRender?.phase ?? '')
        })
        await page.evaluate(() => document.fonts.ready)
        // Crop to what the story drew: its root plus any portal on <body> (dialogs, menus, tooltips).
        const clip = await page.evaluate(() => {
          const drawn = document.querySelectorAll(
            '#storybook-root > *, body > [data-radix-popper-content-wrapper], body > [data-slot], body > [role]',
          )
          const rects = [...drawn].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
          if (!rects.length) return undefined
          const x = Math.max(0, Math.min(...rects.map((r) => r.left)) - 8)
          const y = Math.max(0, Math.min(...rects.map((r) => r.top)) - 8)
          const right = Math.min(Math.max(...rects.map((r) => r.right)) + 8, document.documentElement.scrollWidth)
          const bottom = Math.min(Math.max(...rects.map((r) => r.bottom)) + 8, document.documentElement.scrollHeight)
          return { x, y, width: right - x, height: bottom - y }
        })
        await expect(page).toHaveScreenshot(file, { fullPage: true, clip, maxDiffPixelRatio: 0.01 })
      })
    }
  })
}
