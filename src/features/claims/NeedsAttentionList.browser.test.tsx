import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { needsAttention } from '@/data/overview'
import { routes } from '@/lib/routes'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { NeedsAttentionList } from './NeedsAttentionList'

describe('NeedsAttentionList', () => {
  it('shows each claim as one link with number, SLA in words, policyholder and flag, without axe violations', async () => {
    const { container, getByRole } = await render(<NeedsAttentionList items={needsAttention} />)
    await expect.element(getByRole('region', { name: 'Needs attention' })).toBeVisible()
    const rows = getByRole('listitem').elements()
    expect(rows).toHaveLength(needsAttention.length)
    expect(rows[0].textContent).toContain('CLM-2026-004821')
    expect(rows[0].textContent).toContain('Overdue 1 d')
    expect(rows[0].textContent).toContain('Michael Johnson')
    expect(rows[0].textContent).toContain('Loss date outside policy period')
    expect(rows[1].textContent).toContain('Due today')
    expect(rows[2].textContent).toContain('Due in 1 d')
    await expectNoA11yViolations(container)
  })

  it('links each row to routes.claim(id) and the footer to the queue', async () => {
    const { getByRole } = await render(<NeedsAttentionList items={needsAttention} />)
    for (const item of needsAttention) {
      const link = getByRole('link', { name: new RegExp(item.id) })
      await expect.element(link).toHaveAttribute('href', routes.claim(item.id))
    }
    await expect.element(getByRole('link', { name: 'View queue' })).toHaveAttribute('href', routes.queue)
  })

  it('rows are keyboard reachable in order', async () => {
    const { getByRole } = await render(<NeedsAttentionList items={needsAttention} />)
    await userEvent.tab()
    await expect.element(getByRole('link', { name: new RegExp(needsAttention[0].id) })).toHaveFocus()
    await userEvent.tab()
    await expect.element(getByRole('link', { name: new RegExp(needsAttention[1].id) })).toHaveFocus()
  })

  it('shows the long policyholder name in a tooltip on keyboard focus', async () => {
    const long = 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC'
    const { getByRole } = await render(
      <div className="max-w-xs">
        <NeedsAttentionList items={[{ id: 'CLM-2026-004819', policyholder: long, flag: 'Loss date outside policy period', slaDays: -128 }]} />
      </div>,
    )
    await userEvent.tab()
    await expect.element(getByRole('tooltip')).toMatchTextContent(long)
  })

  it('SLA not applicable is read as text', async () => {
    const { getByRole } = await render(
      <NeedsAttentionList items={[{ id: 'CLM-2026-004817', policyholder: 'Sarah Mitchell', flag: 'Above authority limit', slaDays: null }]} />,
    )
    expect(getByRole('listitem').element().textContent).toContain('Not applicable')
  })

  it('shows the empty message with no items, keeping the link to the queue', async () => {
    const { container, getByText, getByRole } = await render(<NeedsAttentionList items={[]} />)
    await expect.element(getByText('Nothing needs attention')).toBeVisible()
    await expect.element(getByRole('link', { name: 'View queue' })).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('error: an alert with a Retry button that calls back', async () => {
    const onRetry = vi.fn()
    const { container, getByRole } = await render(<NeedsAttentionList state="error" onRetry={onRetry} />)
    await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load claims that need attention')
    await expectNoA11yViolations(container)
    await getByRole('button', { name: 'Retry' }).click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('loading: one status message and a busy region', async () => {
    const { container, getByRole } = await render(<NeedsAttentionList state="loading" />)
    expect(getByRole('status').elements()).toHaveLength(1)
    await expect.element(getByRole('status')).toMatchTextContent('Loading claims that need attention')
    await expect.element(getByRole('region', { name: 'Needs attention' })).toHaveAttribute('aria-busy', 'true')
    await expectNoA11yViolations(container)
  })

  it('loading with announce off renders no status', async () => {
    const { getByRole } = await render(<NeedsAttentionList state="loading" announce={false} />)
    expect(getByRole('status').query()).toBeNull()
  })
})
