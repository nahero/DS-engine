import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

// Visual regression per component: the first story (export order) of every Storybook component, in the Purple brand,
// light and dark, comfortable density. A token change shows up as a diff on every component it touches. The Default
// brand and compact density are covered by the screen baselines in visual.spec.ts. Scope chosen for repo weight (ADR 0018).
// Reads the built Storybook's index (storybook-static/index.json), so build Storybook first; the `stories` project
// serves it on its own port.
test.skip(process.platform !== 'linux', 'Baselines are generated on CI Linux')
test.skip(!process.env.VISUAL, 'Set VISUAL=1 to run visual regression')

const INDEX = 'storybook-static/index.json'
const SNAPSHOTS = 'e2e/stories.visual.spec.ts-snapshots'
type Entry = { id: string; type: string; title: string; name: string }
const all: Entry[] = fs.existsSync(INDEX)
  ? Object.values((JSON.parse(fs.readFileSync(INDEX, 'utf8')) as { entries: Record<string, Entry> }).entries)
  : []
const firstPerTitle = new Map<string, Entry>()
for (const e of all) if (e.type === 'story' && !firstPerTitle.has(e.title)) firstPerTitle.set(e.title, e)

const MODES = [
  { name: 'purple-light', globals: 'brand:purple;theme:light' },
  { name: 'purple-dark', globals: 'brand:purple;theme:dark' },
]
const fileName = (story: Entry, mode: (typeof MODES)[number]) => `${story.id}--${mode.name}.png`

test('Storybook was built', () => {
  expect(firstPerTitle.size, `No stories in ${INDEX}: run npm run build-storybook first`).toBeGreaterThan(0)
})

// Baselines and components stay in step: a new component, or a renamed or reordered first story, fails here until the
// Update screenshots workflow has run; a baseline whose story is gone fails too. Nothing is skipped silently.
test('every component has baselines, and every baseline has a component', () => {
  const { updateSnapshots } = test.info().config
  const updating = updateSnapshots === 'all' || updateSnapshots === 'changed'
  test.skip(updating, 'baselines are being generated')
  const expected = new Set([...firstPerTitle.values()].flatMap((s) => MODES.map((m) => fileName(s, m).replace(/\.png$/, ''))))
  const present = new Set((fs.existsSync(SNAPSHOTS) ? fs.readdirSync(SNAPSHOTS) : []).map((f) => f.replace(/-stories-linux\.png$/, '')))
  expect(
    [...expected].filter((f) => !present.has(f)),
    'components without a baseline: run the Update screenshots workflow',
  ).toEqual([])
  expect(
    [...present].filter((f) => !expected.has(f)),
    `baselines without a story: delete them from ${path.basename(SNAPSHOTS)}`,
  ).toEqual([])
})

for (const story of firstPerTitle.values()) {
  test.describe(story.title, () => {
    for (const mode of MODES) {
      test(mode.name, async ({ page }) => {
        await page.goto(`iframe.html?id=${story.id}&viewMode=story&globals=${mode.globals};density:comfortable;motion:reduced`)
        // Wait until the story has rendered and its play function (if any) has finished. A story that throws fails
        // here instead of becoming its own baseline.
        const phase = await page.waitForFunction(() => {
          const preview = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__
          const p = preview?.currentRender?.phase ?? ''
          return ['completed', 'finished', 'errored', 'aborted'].includes(p) && p
        })
        expect(await phase.jsonValue(), `story ${story.id} did not render`).not.toMatch(/errored|aborted/)

        // Fonts (including late unicode-range subsets such as €), then a settled layout: the crop is measured until it
        // is the same twice, a frame apart, in page coordinates.
        await page.evaluate(async () => {
          await document.fonts.ready
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
          await document.fonts.ready
          window.scrollTo(0, 0)
        })
        const measure = () =>
          page.evaluate(() => {
            // What the story drew: its root plus any portal on <body> (dialogs, menus, tooltips).
            const drawn = document.querySelectorAll(
              '#storybook-root > *, body > [data-radix-popper-content-wrapper], body > [data-slot], body > [role]',
            )
            const rects = [...drawn].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
            if (!rects.length) return undefined
            const x = Math.floor(Math.max(0, Math.min(...rects.map((r) => r.left)) + window.scrollX))
            const y = Math.floor(Math.max(0, Math.min(...rects.map((r) => r.top)) + window.scrollY))
            const right = Math.ceil(Math.max(...rects.map((r) => r.right)) + window.scrollX)
            const bottom = Math.ceil(Math.max(...rects.map((r) => r.bottom)) + window.scrollY)
            return { x, y, width: right - x, height: bottom - y }
          })
        let clip = await measure()
        for (let i = 0; i < 10; i++) {
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
          const next = await measure()
          if (JSON.stringify(next) === JSON.stringify(clip)) break
          clip = next
        }
        expect(clip, `story ${story.id} drew nothing`).toBeDefined()

        // Tight tolerance: a recoloured 1px border or icon on a small component must fail. Same CI image every run,
        // so rendering is pixel-stable; the few pixels allow for anti-aliasing.
        await expect(page).toHaveScreenshot(fileName(story, mode), { fullPage: true, clip, threshold: 0.05, maxDiffPixels: 25 })
      })
    }
  })
}
