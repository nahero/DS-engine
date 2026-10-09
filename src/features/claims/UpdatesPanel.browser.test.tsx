import { describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ASSIGNED_NOW, assignedClaims } from '@/data/assigned'
import type { AssignedClaim } from '@/data/types'
import { routes } from '@/lib/routes'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { UpdatesPanel } from './UpdatesPanel'

const items = () => page.getByRole('listitem').elements()
const manyEvents = assignedClaims.map(
  (c, i): AssignedClaim => ({
    ...c,
    lastEvent: c.lastEvent ?? { id: `ev-extra-${i}`, at: `2026-09-2${i % 8}T10:00:00`, kind: 'document-received', text: `Extra document ${i}`, isNew: false },
  }),
)

describe('UpdatesPanel', () => {
  it('lists the events of the caseload in a region titled "Since you were last here", without axe violations', async () => {
    const { container, getByRole } = await render(<UpdatesPanel claims={assignedClaims} />)
    await expect.element(getByRole('region', { name: 'Since you were last here' })).toBeVisible()
    await expect.element(getByRole('heading', { level: 2, name: 'Since you were last here' })).toBeVisible()
    expect(items()).toHaveLength(6)
    await expectNoA11yViolations(container)
  })

  it('puts new events first, newest first, then older ones', async () => {
    await render(<UpdatesPanel claims={assignedClaims} />)
    const text = items().map((li) => li.textContent!)
    expect(text[0]).toContain('Decision deadline passed yesterday') // 07:30 today
    expect(text[1]).toContain('First contact is due today') // 06:00 today
    expect(text[2]).toContain('Senior approver approved the payout') // 28 Sep 16:20
    expect(text[3]).toContain('Discharge letter received from the provider') // 28 Sep 11:05
    expect(text[4]).toContain('Policyholder reopened the claim with a further invoice') // 28 Sep 09:40
    expect(text[5]).toContain('Policyholder acknowledged the request') // older, not new
  })

  it('marks new events with the word "New" and a dot, and older ones with neither', async () => {
    await render(<UpdatesPanel claims={assignedClaims} />)
    const rows = items()
    for (const li of rows.slice(0, 5)) expect(li.textContent).toContain('New')
    expect(rows[5].textContent).not.toContain('New')
    expect(rows[0].querySelector('[aria-hidden="true"].rounded-full')).not.toBeNull()
    expect(rows[5].querySelector('.rounded-full')).toBeNull()
  })

  it('shows event, policyholder and relative time', async () => {
    await render(<UpdatesPanel claims={assignedClaims} now={ASSIGNED_NOW} />)
    const rows = items().map((li) => li.textContent!)
    expect(rows[0]).toContain('Michael Johnson')
    expect(rows[0]).toContain('2 h ago')
    expect(rows[1]).toContain('3 h ago')
    expect(rows[2]).toContain('Yesterday')
    expect(rows[5]).toContain('3 d ago')
  })

  it('links each item to its claim, named with the event and the claim number', async () => {
    await render(<UpdatesPanel claims={assignedClaims} />)
    const link = page.getByRole('link', { name: /Decision deadline passed yesterday/ })
    await expect.element(link).toHaveAttribute('href', routes.claim('CLM-2026-004821'))
    expect(link.element().textContent).toContain('CLM-2026-004821')
  })

  it('items are keyboard reachable in order', async () => {
    await render(<UpdatesPanel claims={assignedClaims} />)
    await userEvent.tab()
    await expect.element(page.getByRole('link', { name: /Decision deadline passed yesterday/ })).toHaveFocus()
    await userEvent.tab()
    await expect.element(page.getByRole('link', { name: /First contact is due today/ })).toHaveFocus()
  })

  it('shows six events and "Show all (N)" reveals the rest, "Show fewer" hides them again', async () => {
    const { container } = await render(<UpdatesPanel claims={manyEvents} />)
    expect(items()).toHaveLength(6)
    const toggle = page.getByRole('button', { name: `Show all (${manyEvents.length})` })
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    expect(items()).toHaveLength(manyEvents.length)
    await expect.element(page.getByRole('button', { name: 'Show fewer' })).toHaveAttribute('aria-expanded', 'true')
    await expectNoA11yViolations(container)
    await page.getByRole('button', { name: 'Show fewer' }).click()
    expect(items()).toHaveLength(6)
  })

  it('has no "Show all" with six events or fewer', async () => {
    const { getByRole } = await render(<UpdatesPanel claims={assignedClaims} />)
    expect(getByRole('button').query()).toBeNull()
  })

  it('empty: "Nothing new since your last visit"', async () => {
    const { container, getByText } = await render(<UpdatesPanel claims={[]} />)
    await expect.element(getByText('Nothing new since your last visit')).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('claims without any event also give the empty message', async () => {
    const { getByText } = await render(<UpdatesPanel claims={assignedClaims.map((c) => ({ ...c, lastEvent: undefined }))} />)
    await expect.element(getByText('Nothing new since your last visit')).toBeVisible()
  })

  it('loading: one status and a busy region', async () => {
    const { container, getByRole } = await render(<UpdatesPanel claims={assignedClaims} state="loading" />)
    expect(getByRole('status').elements()).toHaveLength(1)
    await expect.element(getByRole('status')).toMatchTextContent('Loading updates')
    await expect.element(getByRole('region', { name: 'Since you were last here' })).toHaveAttribute('aria-busy', 'true')
    await expectNoA11yViolations(container)
  })

  it('loading with announce off renders no status', async () => {
    const { getByRole } = await render(<UpdatesPanel claims={assignedClaims} state="loading" announce={false} />)
    expect(getByRole('status').query()).toBeNull()
  })

  it('error: an alert with a Retry button that calls back', async () => {
    const onRetry = vi.fn()
    const { container, getByRole } = await render(<UpdatesPanel claims={assignedClaims} state="error" onRetry={onRetry} />)
    await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load updates')
    await expectNoA11yViolations(container)
    await getByRole('button', { name: 'Retry' }).click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
