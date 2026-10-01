import { describe, expect, it } from 'vitest'
import { getClaimDetail } from '@/data/claim-detail'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { AgentSummary } from './AgentSummary'

const summary = getClaimDetail('CLM-2026-004817')!.agentSummary

describe('AgentSummary', () => {
  it('shows the recommendation and every note, labelled as AI-generated, without axe violations', async () => {
    const { container, getByRole, getByText } = await render(<AgentSummary summary={summary} />)
    const region = getByRole('region', { name: 'Agent summary' })
    await expect.element(region).toBeVisible()
    await expect.element(getByText('AI-generated, review before acting')).toBeVisible()
    await expect.element(region).toMatchTextContent(`Agent recommendation: ${summary.recommendation}`)
    expect(region.element().querySelectorAll('li')).toHaveLength(summary.notes.length)
    for (const note of summary.notes) await expect.element(getByText(note)).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('names the author as the agent in words, not by icon or colour alone', async () => {
    const { getByRole } = await render(<AgentSummary summary={summary} />)
    expect(getByRole('region', { name: 'Agent summary' }).element().textContent).toContain('Agent')
  })

  it('announces loading once and marks the region busy', async () => {
    const { container, getByRole } = await render(<AgentSummary loading />)
    await expect.element(getByRole('region', { name: 'Agent summary' })).toHaveAttribute('aria-busy', 'true')
    await expect.element(getByRole('status')).toMatchTextContent('Loading agent summary')
    await expectNoA11yViolations(container)
  })

  it('omits the notes list when there are none', async () => {
    const { container, getByRole } = await render(<AgentSummary summary={{ recommendation: 'Approve', notes: [] }} />)
    await expect.element(getByRole('region', { name: 'Agent summary' })).toMatchTextContent('Agent recommendation: Approve')
    expect(container.querySelector('ul')).toBeNull()
  })
})
