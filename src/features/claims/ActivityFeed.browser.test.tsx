import { describe, expect, it, vi } from 'vitest'
import { recentActivity } from '@/data/overview'
import { routes } from '@/lib/routes'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { ActivityFeed } from './ActivityFeed'

describe('ActivityFeed', () => {
  it('lists every event with time, actor, text and a link to its claim, without axe violations', async () => {
    const { container, getByRole } = await render(<ActivityFeed events={recentActivity} />)
    await expect.element(getByRole('region', { name: 'Recent activity' })).toBeVisible()
    const items = getByRole('listitem').elements()
    expect(items).toHaveLength(recentActivity.length)
    expect(items[0].textContent).toContain('10:42')
    expect(items[0].textContent).toContain('Agent')
    expect(items[0].textContent).toContain('Extracted 14 fields from FNOL')
    expect(items[1].textContent).toContain('Emily Carter')
    await expectNoA11yViolations(container)
  })

  it('links each event to routes.claim(id)', async () => {
    const { getByRole } = await render(<ActivityFeed events={recentActivity} />)
    const links = getByRole('link').elements()
    expect(links).toHaveLength(recentActivity.length)
    recentActivity.forEach((event, i) => {
      expect(links[i]).toHaveTextContent(event.claimId)
      expect(links[i]).toHaveAttribute('href', routes.claim(event.claimId))
    })
  })

  it('keeps long text reachable: truncated text carries the full value', async () => {
    const long = 'Requested additional information from the policyholder: signed discharge letter, itemised hospital invoice and proof of payment'
    const { container } = await render(
      <div className="max-w-xl">
        <ActivityFeed events={[{ id: 'l1', time: '10:42', actor: { kind: 'person', name: 'Alexandra Montgomery-Whitfield-Featherstonehaugh' }, event: long, claimId: 'CLM-2026-004812' }]} />
      </div>,
    )
    expect(container.textContent).toContain(long)
    await expectNoA11yViolations(container)
  })

  it('shows the empty message when there are no events (default state with an empty list, and the empty state)', async () => {
    const a = await render(<ActivityFeed events={[]} />)
    await expect.element(a.getByText('No recent activity')).toBeVisible()
    expect(a.getByRole('listitem').query()).toBeNull()
    await a.unmount()

    const b = await render(<ActivityFeed state="empty" />)
    await expect.element(b.getByText('No recent activity')).toBeVisible()
    await expectNoA11yViolations(b.container)
  })

  it('error: an alert with a Retry button that calls back', async () => {
    const onRetry = vi.fn()
    const { container, getByRole } = await render(<ActivityFeed state="error" onRetry={onRetry} />)
    await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load recent activity')
    await expectNoA11yViolations(container)
    await getByRole('button', { name: 'Retry' }).click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('loading: one status message, a busy region and no links', async () => {
    const { container, getByRole } = await render(<ActivityFeed state="loading" />)
    await expect.element(getByRole('status')).toMatchTextContent('Loading recent activity')
    expect(getByRole('status').elements()).toHaveLength(1)
    await expect.element(getByRole('region', { name: 'Recent activity' })).toHaveAttribute('aria-busy', 'true')
    expect(getByRole('link').query()).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('loading with announce off renders no status (the screen announces once)', async () => {
    const { getByRole } = await render(<ActivityFeed state="loading" announce={false} />)
    expect(getByRole('status').query()).toBeNull()
  })
})
