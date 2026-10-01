import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { getClaim } from '@/data/claims'
import { getClaimDetail } from '@/data/claim-detail'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { ClaimSummary } from './ClaimSummary'

const claim = getClaim('CLM-2026-004817')! // POL-HRTN-4821, Emily Carter
const policyPeriod = getClaimDetail('CLM-2026-004817')!.policyPeriod

function Stateful({ onToggle }: { onToggle?: () => void }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <ClaimSummary
      claim={claim}
      policyPeriod={policyPeriod}
      policyRevealed={revealed}
      onToggleReveal={() => {
        onToggle?.()
        setRevealed((v) => !v)
      }}
    />
  )
}

describe('ClaimSummary', () => {
  it('shows the key facts with a masked policy number, without axe violations', async () => {
    const { container, getByText, getByRole } = await render(<ClaimSummary claim={claim} policyPeriod={policyPeriod} />)
    await expect.element(getByText('POL-••••-4821')).toBeVisible()
    expect(container.textContent).not.toContain('POL-HRTN-4821')
    await expect.element(getByText('01 Jan 2026 – 31 Dec 2026')).toBeVisible()
    await expect.element(getByText('20 Sep 2026')).toBeVisible()
    await expect.element(getByText('22 Sep 2026')).toBeVisible()
    await expect.element(getByText('Emily Carter')).toBeVisible()
    for (const label of ['Policy #', 'Policy period', 'Loss date', 'Reported (FNOL)', 'SLA', 'Handler']) {
      expect(container.querySelector('dl')!.textContent).toContain(label)
    }
    await expect.element(getByRole('button', { name: 'Reveal policy number' })).toHaveAttribute('aria-pressed', 'false')
    await expectNoA11yViolations(container)
  })

  it('reveals and hides the policy number, exposing the state with aria-pressed', async () => {
    const onToggle = vi.fn()
    const { getByText, getByRole } = await render(<Stateful onToggle={onToggle} />)
    await getByRole('button', { name: 'Reveal policy number' }).click()
    expect(onToggle).toHaveBeenCalledTimes(1)
    await expect.element(getByText('POL-HRTN-4821')).toBeVisible()
    await expect.element(getByRole('button', { name: 'Hide policy number' })).toHaveAttribute('aria-pressed', 'true')

    await getByRole('button', { name: 'Hide policy number' }).click()
    await expect.element(getByText('POL-••••-4821')).toBeVisible()
    await expect.element(getByRole('button', { name: 'Reveal policy number' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows Unassigned when no handler is set', async () => {
    const { getByText } = await render(<ClaimSummary claim={{ ...claim, handler: null }} policyPeriod={policyPeriod} />)
    await expect.element(getByText('Unassigned')).toBeVisible()
  })

  it('announces loading and marks the card busy', async () => {
    const { container, getByRole } = await render(<ClaimSummary loading />)
    await expect.element(getByRole('status')).toMatchTextContent('Loading claim summary')
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    await expectNoA11yViolations(container)
  })
})
