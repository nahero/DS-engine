# 0018: Visual regression per component, in the Purple brand

**Status:** accepted · 2026-10-17

## Context
Visual baselines covered 4 screens in 2 modes. A token change that broke a component not on those screens, or only in one theme, went unseen. The goal: a token change shows a diff on every component it touches.

Every story (415) in 4 modes was the first plan. Measured, it is about 1,660 images and 50 MB, and every wide token change would rewrite most of them, adding up to ~50 MB of git history each time.

## Decision
- **Playwright `toHaveScreenshot` on the built Storybook**, not Chromatic: free, no snapshot quota, the same tool and Linux-baseline workflow as the screen baselines, and diffs land in the Playwright report.
- **Scope (Igor's choice):** the first story of each of the 57 components, in the Purple brand, light and dark, comfortable density: 114 images, a few MB. The Default brand and compact density stay covered by the screen baselines (`visual.spec.ts`).
- Each screenshot is cropped to what the story drew, including portals (dialogs, menus, tooltips), after the story's play function has finished, with reduced motion.
- `e2e/stories.visual.spec.ts` reads `storybook-static/index.json`; CI builds Storybook before the e2e job's tests. A component without a baseline is skipped until the Update screenshots workflow has generated it, so a new component never blocks the deploy.
- The Update screenshots workflow regenerates both sets (`--update-snapshots=all`).

## Consequences
- A semantic token change shows up across the component set in one PR; review the images in the PR diff.
- States other than the first story (hover, error, long content…) are not compared as images; their behaviour and accessibility are still checked by the story tests in light/comfortable and dark/compact.
- Adding a story file means generating its baselines with the workflow before it is compared.
