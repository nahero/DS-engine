import { describe, expect, it, vi } from 'vitest'
import { getClaimDetail } from '@/data/claim-detail'
import type { AuditEvent } from '@/data/types'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { AuditTrail } from './AuditTrail'

const events = getClaimDetail('CLM-2026-004817')!.audit

const many: AuditEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `many-${i}`,
  at: `2026-09-23T${String(18 - i).padStart(2, '0')}:10:00`,
  actor: i % 3 === 0 ? { kind: 'agent' } : i % 3 === 1 ? { kind: 'system' } : { kind: 'person', name: 'Emily Carter' },
  event: `Event ${12 - i}`,
}))

describe('AuditTrail', () => {
  it('lists every event newest first with time, actor, what and detail, without axe violations', async () => {
    const { container, getByRole } = await render(<AuditTrail events={events} />)
    const items = getByRole('listitem').elements()
    expect(items).toHaveLength(events.length)
    expect(items[0].textContent).toContain('Started review')
    expect(items[0].textContent).toContain('Emily Carter')
    expect(items[0].querySelector('time')).toHaveAttribute('datetime', events[0].at)
    expect(items[0].textContent).toContain('23 Sep 14:32')
    expect(items[items.length - 1].textContent).toContain('Submitted FNOL form')
    expect(items[items.length - 1].textContent).toContain('3 pages')
    await expectNoA11yViolations(container)
  })

  it('names each actor in words (agent, system, policyholder, person)', async () => {
    const { getByRole } = await render(<AuditTrail events={events} />)
    const text = getByRole('list').element().textContent ?? ''
    for (const who of ['Agent', 'System', 'Policyholder', 'Emily Carter']) expect(text).toContain(who)
  })

  it('compact shows the latest 5 in a titled region and a View all button with the total', async () => {
    const onViewAll = vi.fn()
    const { container, getByRole } = await render(<AuditTrail events={many} compact onViewAll={onViewAll} />)
    const region = getByRole('region', { name: 'Audit trail' })
    await expect.element(region).toBeVisible()
    expect(region.getByRole('listitem').elements()).toHaveLength(5)
    expect(region.getByRole('listitem').first().element().textContent).toContain('Event 12')
    await expectNoA11yViolations(container)

    await region.getByRole('button', { name: 'View all (12)', exact: true }).click()
    expect(onViewAll).toHaveBeenCalledTimes(1)
  })

  it('compact hides View all when everything is already shown', async () => {
    const { getByRole } = await render(<AuditTrail events={events} compact />)
    expect(getByRole('listitem').elements()).toHaveLength(5)
    expect(getByRole('button').query()).toBeNull()
  })

  it('shows the empty message with no events (full and compact)', async () => {
    const full = await render(<AuditTrail events={[]} />)
    await expect.element(full.getByText('No activity yet')).toBeVisible()
    await expectNoA11yViolations(full.container)
    await full.unmount()

    const compact = await render(<AuditTrail events={[]} compact />)
    await expect.element(compact.getByText('No activity yet')).toBeVisible()
    expect(compact.getByRole('button').query()).toBeNull()
  })

  it('announces loading and marks the region busy', async () => {
    const { container, getByRole } = await render(<AuditTrail events={[]} loading />)
    await expect.element(getByRole('region', { name: 'Audit trail' })).toHaveAttribute('aria-busy', 'true')
    await expect.element(getByRole('status')).toMatchTextContent('Loading audit trail')
    await expectNoA11yViolations(container)
  })
})
