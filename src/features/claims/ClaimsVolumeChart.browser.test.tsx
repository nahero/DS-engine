import { describe, expect, it, vi } from 'vitest'
import { weeklyVolume } from '@/data/overview'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { ClaimsVolumeChart } from './ClaimsVolumeChart'

const fmt = (n: number) => n.toLocaleString('en-US')
const rowTotal = (r: (typeof weeklyVolume)[number]) => r.Motor + r.Property + r.Health + r.Travel

describe('ClaimsVolumeChart', () => {
  it('describes the weeks shown and summarises the trend in text, without axe violations', async () => {
    const { container, getByRole, getByText } = await render(<ClaimsVolumeChart />)
    await expect.element(getByRole('region', { name: 'Claims reported by line of business' })).toBeVisible()
    await expect.element(getByText('Claims per week, W34–W39 2026')).toBeVisible()
    const first = rowTotal(weeklyVolume[0])
    const last = rowTotal(weeklyVolume[weeklyVolume.length - 1])
    expect(container.textContent).toContain(`Weekly claims rose from ${fmt(first)} in W34 to ${fmt(last)} in W39; Motor is the largest line.`)
    await expectNoA11yViolations(container)
  })

  it('names the lines of business in a legend list (not colour alone)', async () => {
    const { getByRole } = await render(<ClaimsVolumeChart />)
    const legend = getByRole('list', { name: 'Lines of business' })
    for (const line of ['Motor', 'Property', 'Health', 'Travel']) expect(legend.element().textContent).toContain(line)
  })

  it('keeps the SVG chart out of the accessibility tree', async () => {
    const { container } = await render(<ClaimsVolumeChart />)
    const hidden = container.querySelector('figure [aria-hidden="true"]')
    expect(hidden?.querySelector('svg')).not.toBeNull()
  })

  it('"Show data table" toggles aria-expanded, reveals the table with every number, and hides it again', async () => {
    const { container, getByRole } = await render(<ClaimsVolumeChart />)
    const toggle = getByRole('button', { name: 'Show data table' })
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'false')
    // Not visible, but still in the DOM for assistive tech.
    expect(container.querySelector('table')).not.toBeNull()
    expect(getByRole('region', { name: 'Claims volume data table' }).query()).toBeNull()

    await toggle.click()
    const hide = getByRole('button', { name: 'Hide data table' })
    await expect.element(hide).toHaveAttribute('aria-expanded', 'true')
    const table = getByRole('table')
    await expect.element(table).toBeVisible()
    await expect.element(getByRole('region', { name: 'Claims volume data table' })).toBeVisible()
    const rows = table.getByRole('row').elements()
    expect(rows).toHaveLength(weeklyVolume.length + 1)
    for (const [i, week] of weeklyVolume.entries()) {
      const text = rows[i + 1].textContent ?? ''
      expect(text).toContain(week.week)
      for (const n of [week.Motor, week.Property, week.Health, week.Travel, rowTotal(week)]) expect(text).toContain(fmt(n))
    }
    await expectNoA11yViolations(container)

    await hide.click()
    await expect.element(getByRole('button', { name: 'Show data table' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('right-aligns the numbers in the data table', async () => {
    const { getByRole } = await render(<ClaimsVolumeChart />)
    await getByRole('button', { name: 'Show data table' }).click()
    const cell = getByRole('table').getByRole('row').nth(1).getByRole('cell').first().element()
    expect(getComputedStyle(cell).textAlign).toBe('right')
  })

  it('describes a single week', async () => {
    const week = weeklyVolume[weeklyVolume.length - 1]
    const { container, getByText } = await render(<ClaimsVolumeChart data={[week]} />)
    await expect.element(getByText('Claims per week, W39 2026')).toBeVisible()
    expect(container.textContent).toContain(`W39 had ${fmt(rowTotal(week))} claims; Motor is the largest line.`)
  })

  it('shows the empty message with no data', async () => {
    const { container, getByText } = await render(<ClaimsVolumeChart data={[]} />)
    await expect.element(getByText('No claims reported in this period')).toBeVisible()
    expect(container.querySelector('table')).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('error: an alert with a Retry button that calls back', async () => {
    const onRetry = vi.fn()
    const { container, getByRole } = await render(<ClaimsVolumeChart state="error" onRetry={onRetry} />)
    await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load claims volume')
    await expectNoA11yViolations(container)
    await getByRole('button', { name: 'Retry' }).click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('loading: one status message and a busy region', async () => {
    const { container, getByRole } = await render(<ClaimsVolumeChart state="loading" />)
    expect(getByRole('status').elements()).toHaveLength(1)
    await expect.element(getByRole('status')).toMatchTextContent('Loading claims volume')
    await expect.element(getByRole('region', { name: 'Claims reported by line of business' })).toHaveAttribute('aria-busy', 'true')
    await expectNoA11yViolations(container)
  })

  it('loading with announce off renders no status', async () => {
    const { getByRole } = await render(<ClaimsVolumeChart state="loading" announce={false} />)
    expect(getByRole('status').query()).toBeNull()
  })
})
