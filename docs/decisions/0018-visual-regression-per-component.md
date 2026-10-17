# 0018: Visual regression per component, in the Purple brand

**Status:** accepted · 2026-10-17

## Context
Visual baselines covered 4 screens in 2 modes. A token change that broke a component not on those screens, or only in one theme, went unseen. The goal: a token change shows a diff on every component it touches.

Every story (415) in 4 modes was the first plan. Measured, it is about 1,660 images and 50 MB, and every wide token change would rewrite most of them, adding up to ~50 MB of git history each time.

## Decision
- **Playwright `toHaveScreenshot` on the built Storybook**, not Chromatic: free, no snapshot quota, the same tool and Linux-baseline workflow as the screen baselines, and diffs land in the Playwright report.
- **Scope (Igor's choice):** the first story (export order) of each of the 56 components and the Tokens page, in the Purple brand, light and dark, comfortable density: 114 images, a few MB. The Default brand and compact density stay covered by the screen baselines (`visual.spec.ts`).
- Each screenshot is taken after the story's play function has finished (a story that errors fails instead), fonts are loaded and the layout has settled, with reduced motion. It is cropped to what the story drew; portals (dialogs, menus, tooltips) are included in the crop, though no first story opens one today.
- Tolerance is tight (per-pixel threshold 0.05, at most 25 differing pixels), so a recoloured border or icon on a small component fails.
- `e2e/stories.visual.spec.ts` reads `storybook-static/index.json`; CI builds Storybook before the e2e job's tests. Baselines and components must match: a new component, a renamed or reordered first story, or a baseline whose story is gone fails until the Update screenshots workflow has run. Nothing is skipped silently.
- The Update screenshots workflow regenerates both sets (`--update-snapshots=all`).

## Consequences
- A semantic token change shows up across the component set in one PR; review the images in the PR diff.
- States other than the first story (hover, error, long content…) are not compared as images; their behaviour and accessibility are still checked by the story tests in light/comfortable and dark/compact.
- Adding a component means running the Update screenshots workflow on its branch and committing the baselines before CI goes green.
