import axe, { type Result } from 'axe-core'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']

function describe(violation: Result): string {
  const nodes = violation.nodes
    .slice(0, 5)
    .map((n) => `    - ${n.target.join(' ')}\n      ${n.failureSummary?.replace(/\n/g, '\n      ') ?? ''}`)
    .join('\n')
  const more = violation.nodes.length > 5 ? `\n    … and ${violation.nodes.length - 5} more` : ''
  return `  [${violation.impact ?? 'n/a'}] ${violation.id}: ${violation.help}\n${nodes}${more}\n    ${violation.helpUrl}`
}

/** Fails with a readable list when axe finds WCAG 2.2 AA violations inside `container`. CSS transitions are off while it runs. */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const style = document.createElement('style')
  style.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'
  document.head.append(style)
  try {
    const { violations } = await axe.run(container, { runOnly: { type: 'tag', values: TAGS } })
    if (violations.length > 0) {
      throw new Error(`${violations.length} accessibility violation(s):\n${violations.map(describe).join('\n')}`)
    }
  } finally {
    style.remove()
  }
}
