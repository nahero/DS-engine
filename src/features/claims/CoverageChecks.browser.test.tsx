import { describe, expect, it } from 'vitest'
import { getClaimDetail } from '@/data/claim-detail'
import type { CoverageCheck } from '@/data/types'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { CoverageChecks } from './CoverageChecks'

const checks = getClaimDetail('CLM-2026-004817')!.coverage

const oneOfEach: CoverageCheck[] = [
  { id: 'a', label: 'Policy in force', result: 'pass', detail: 'Within period.' },
  { id: 'b', label: 'Loss type covered', result: 'flag', detail: 'Excluded.' },
  { id: 'c', label: 'Documents present', result: 'unknown', detail: 'Awaiting document' },
]

describe('CoverageChecks', () => {
  it('renders every check with its label and detail, without axe violations', async () => {
    const { container, getByRole } = await render(<CoverageChecks checks={checks} />)
    await expect.element(getByRole('listitem').first()).toBeVisible()
    expect(container.querySelectorAll('li')).toHaveLength(checks.length)
    for (const check of checks) {
      expect(container.textContent).toContain(check.label)
      expect(container.textContent).toContain(check.detail)
    }
    await expectNoA11yViolations(container)
  })

  it('states each result in words next to an icon, not by colour alone', async () => {
    const { container, getByRole } = await render(<CoverageChecks checks={oneOfEach} />)
    const items = getByRole('listitem').elements()
    expect(items).toHaveLength(3)
    const expected = ['Pass', 'Flagged', 'Unknown']
    items.forEach((item, i) => {
      expect(item.textContent).toContain(expected[i])
      // The icon is decorative; the word is what carries the result.
      const icon = item.querySelector('svg')
      expect(icon).not.toBeNull()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
    await expectNoA11yViolations(container)
  })

  it('shows the empty state when there are no checks', async () => {
    const { container, getByText } = await render(<CoverageChecks checks={[]} />)
    await expect.element(getByText('No coverage checks yet')).toBeVisible()
    expect(container.querySelector('li')).toBeNull()
    await expectNoA11yViolations(container)
  })
})
