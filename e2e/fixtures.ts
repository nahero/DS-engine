import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export type DisplayOptions = {
  theme?: 'light' | 'dark'
  density?: 'comfortable' | 'compact'
  brand?: 'default' | 'purple'
}

/** Writes display settings to localStorage before the app loads (index.html applies them before first paint). */
export async function setDisplay(page: Page, { theme = 'light', density = 'comfortable', brand = 'default' }: DisplayOptions = {}) {
  await page.addInitScript((settings) => {
    try {
      localStorage.setItem('ds-display-settings', JSON.stringify(settings))
    } catch {
      /* storage unavailable */
    }
  }, { theme, brand, density })
}

/** Kills transitions and animations (CSS) and asks for reduced motion. Call before `goto`. */
export async function disableAnimations(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const css = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'
    const add = () => {
      const style = document.createElement('style')
      style.textContent = css
      document.head.appendChild(style)
    }
    if (document.head) add()
    else document.addEventListener('DOMContentLoaded', add)
  })
}

/** Runs axe (WCAG 2.0/2.1/2.2 A and AA) on the current page and fails with a readable list of violations. */
export async function expectNoA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()

  const report = violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 5)
        .map((n) => `    - ${n.target.join(' ')}\n      ${n.failureSummary?.split('\n').join('\n      ')}`)
        .join('\n')
      const more = v.nodes.length > 5 ? `\n    ... and ${v.nodes.length - 5} more` : ''
      return `[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${nodes}${more}`
    })
    .join('\n\n')

  expect(violations, `${violations.length} accessibility violation(s):\n\n${report}\n`).toEqual([])
}
