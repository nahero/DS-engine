import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { kpis, needsAttention, recentActivity, weeklyVolume } from '@/data/overview'
import { routes } from '@/lib/routes'
import { choose } from '@/test/interactions'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { Overview } from './Overview'

const fmt = (n: number) => n.toLocaleString('en-US')
const volumeRegion = () => page.getByRole('region', { name: 'Claims reported by line of business' })
const dataTableRows = () => volumeRegion().getByRole('table').getByRole('row').elements().slice(1)

describe('Overview', () => {
  it('shows the title, week, key figures, chart, needs-attention list and activity, without axe violations', async () => {
    const { container, getByRole, getByText } = await render(<Overview />)
    await expect.element(getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
    await expect.element(getByText('Claims operations · Week 39, 2026')).toBeVisible()
    const figures = getByRole('region', { name: 'Key figures' })
    for (const kpi of kpis) {
      await expect.element(figures.getByText(kpi.label)).toBeVisible()
      await expect.element(figures.getByText(kpi.value!, { exact: true })).toBeVisible()
    }
    await expect.element(volumeRegion()).toBeVisible()
    await expect.element(getByRole('region', { name: 'Needs attention' })).toBeVisible()
    await expect.element(getByRole('region', { name: 'Recent activity' })).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('the SLA breaches figure is worded, not just coloured', async () => {
    const { getByRole } = await render(<Overview />)
    await expect.element(getByRole('region', { name: 'Key figures' }).getByText('Overdue')).toBeVisible()
  })

  describe('period', () => {
    it('defaults to the last 30 days (4 weeks)', async () => {
      const { getByRole, getByText } = await render(<Overview />)
      await expect.element(getByRole('combobox', { name: 'Period' })).toMatchTextContent('Last 30 days')
      await expect.element(getByText('Claims per week, W36–W39 2026')).toBeVisible()
      expect(dataTableRows()).toHaveLength(4)
    })

    it('changing the period changes the chart description and the data table rows', async () => {
      const { getByRole, getByText } = await render(<Overview />)

      await choose(getByRole('combobox', { name: 'Period' }), 'Last 7 days')
      await expect.element(getByText('Claims per week, W39 2026')).toBeVisible()
      expect(dataTableRows()).toHaveLength(1)
      expect(dataTableRows()[0].textContent).toContain('W39')

      await choose(getByRole('combobox', { name: 'Period' }), 'Quarter to date')
      await expect.element(getByText('Claims per week, W34–W39 2026')).toBeVisible()
      expect(dataTableRows()).toHaveLength(weeklyVolume.length)
      expect(dataTableRows()[0].textContent).toContain('W34')

      await choose(getByRole('combobox', { name: 'Period' }), 'Last 30 days')
      await expect.element(getByText('Claims per week, W36–W39 2026')).toBeVisible()
      expect(dataTableRows()).toHaveLength(4)
    })
  })

  describe('chart data table', () => {
    it('"Show data table" toggles aria-expanded and shows every number', async () => {
      const { getByRole } = await render(<Overview />)
      await choose(getByRole('combobox', { name: 'Period' }), 'Quarter to date')
      const toggle = volumeRegion().getByRole('button', { name: 'Show data table' })
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.click()
      await expect.element(volumeRegion().getByRole('button', { name: 'Hide data table' })).toHaveAttribute('aria-expanded', 'true')
      await expect.element(volumeRegion().getByRole('table')).toBeVisible()
      const rows = dataTableRows()
      expect(rows).toHaveLength(weeklyVolume.length)
      weeklyVolume.forEach((week, i) => {
        const text = rows[i].textContent ?? ''
        expect(text).toContain(week.week)
        for (const n of [week.Motor, week.Property, week.Health, week.Travel]) expect(text).toContain(fmt(n))
      })
    })
  })

  describe('links', () => {
    it('needs-attention rows link to routes.claim(id) and the footer to routes.queue', async () => {
      const { getByRole } = await render(<Overview />)
      const list = getByRole('region', { name: 'Needs attention' })
      for (const item of needsAttention) {
        await expect.element(list.getByRole('link', { name: new RegExp(item.id) })).toHaveAttribute('href', routes.claim(item.id))
      }
      await expect.element(list.getByRole('link', { name: 'View queue' })).toHaveAttribute('href', routes.queue)
    })

    it('every activity row links to its claim', async () => {
      const { getByRole } = await render(<Overview />)
      const feed = getByRole('region', { name: 'Recent activity' })
      const links = feed.getByRole('link').elements()
      expect(links).toHaveLength(recentActivity.length)
      recentActivity.forEach((event, i) => expect(links[i]).toHaveAttribute('href', routes.claim(event.claimId)))
    })
  })

  describe('states', () => {
    it('loading: exactly one status for the whole page, busy regions and no data', async () => {
      const { container, getByRole } = await render(<Overview state="loading" />)
      expect(getByRole('status').elements()).toHaveLength(1)
      await expect.element(getByRole('status')).toMatchTextContent('Loading overview')
      for (const name of ['Claims reported by line of business', 'Needs attention', 'Recent activity']) {
        await expect.element(getByRole('region', { name })).toHaveAttribute('aria-busy', 'true')
      }
      expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThan(kpis.length)
      expect(getByRole('link').elements().map((l) => l.getAttribute('href'))).not.toContain(routes.claim(needsAttention[0].id))
      await expectNoA11yViolations(container)
    })

    it('empty: zero counts, missing averages in words and an empty message in each section', async () => {
      const { container, getByRole, getByText } = await render(<Overview state="empty" />)
      const figures = getByRole('region', { name: 'Key figures' })
      expect(figures.element().textContent).toContain('Missing')
      expect(figures.element().textContent).not.toContain('1,284')
      await expect.element(getByText('No claims reported in this period')).toBeVisible()
      await expect.element(getByText('Nothing needs attention')).toBeVisible()
      await expect.element(getByText('No recent activity')).toBeVisible()
      await expectNoA11yViolations(container)
    })

    it('error: an alert per failed section and Retry calls back', async () => {
      const onRetry = vi.fn()
      const { container, getByRole } = await render(<Overview state="error" onRetry={onRetry} />)
      expect(getByRole('alert').elements()).toHaveLength(3)
      await expectNoA11yViolations(container)
      await getByRole('button', { name: 'Retry' }).first().click()
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('stale: says when the figures were updated and Refresh calls back', async () => {
      const onRefresh = vi.fn()
      const { container, getByRole, getByText } = await render(<Overview state="stale" onRefresh={onRefresh} />)
      await expect.element(getByText('Updated 3 h ago')).toBeVisible()
      await expect.element(getByText('Figures may be out of date.')).toBeVisible()
      await expectNoA11yViolations(container)
      await getByRole('button', { name: 'Refresh' }).click()
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('Export is focusable and explains why it does nothing', async () => {
    const { getByRole } = await render(<Overview />)
    const exportButton = getByRole('button', { name: /Export/ })
    await expect.element(exportButton).toHaveAttribute('aria-disabled', 'true')
    exportButton.element().focus()
    await expect.element(getByRole('tooltip')).toMatchTextContent('Not available in this demo')
  })
})
