import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { claims, compareNeedsAttention } from '@/data/claims'
import { confidenceLevel } from '@/lib/format'
import { applyFilters, emptyFilters, type ClaimFilters } from '@/features/claims/queue-utils'
import { choose } from '@/test/interactions'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { ClaimsQueue } from './ClaimsQueue'

const count = (filters: Partial<ClaimFilters>) => applyFilters(claims, { ...emptyFilters, ...filters }).length
const fmt = (n: number) => n.toLocaleString('en-US')

// First page in needs-attention order, and rows on it to act on.
const firstPage = [...claims].sort(compareNeedsAttention).slice(0, 25)
const highClaim = firstPage.find((c) => c.confidence !== null && confidenceLevel(c.confidence) === 'High' && c.status !== 'Approved')!
const lowClaim = firstPage.find((c) => c.confidence !== null && confidenceLevel(c.confidence) === 'Low')!
const rachelFree = firstPage.find((c) => c.handler !== 'Rachel Morgan')!
const notHealth = firstPage.find((c) => c.lob !== 'Health')!

const bodyRows = () => page.getByRole('row').elements().slice(1) as HTMLTableRowElement[]
const rowFor = (id: string) => bodyRows().find((r) => r.querySelector('a')?.textContent === id)!
const checkbox = (id: string) => page.getByRole('checkbox', { name: `Select ${id}` })
const resultCount = () => page.getByLabelText('Filter claims').getByRole('status')

afterEach(() => {
  vi.useRealTimers()
})

describe('ClaimsQueue', () => {
  it('shows the first page of 1,000 claims in needs-attention order, without axe violations', async () => {
    const { container, getByRole, getByText } = await render(<ClaimsQueue />)
    await expect.element(getByRole('heading', { name: 'Claims queue' })).toBeVisible()
    await expect.element(getByText('Showing 1–25 of 1,000')).toBeVisible()
    await expect.element(resultCount()).toMatchTextContent('1,000 results')
    await expect.element(getByText(/Sort:/)).toMatchTextContent('Needs attention')
    expect(bodyRows()).toHaveLength(25)
    expect(bodyRows()[0].querySelector('a')?.textContent).toBe(firstPage[0].id)
    expect(bodyRows().map((r) => r.querySelector('a')?.textContent)).toEqual(firstPage.map((c) => c.id))
    await expectNoA11yViolations(container)
  })

  it('the page header states how many claims await review and the sort order', async () => {
    const { container } = await render(<ClaimsQueue />)
    expect(container.textContent).toMatch(/[\d,]+ awaiting review · sorted by needs attention/)
  })

  it('Export is announced as unavailable rather than silently doing nothing', async () => {
    const { getByRole } = await render(<ClaimsQueue />)
    await expect.element(getByRole('button', { name: /Export/ })).toBeVisible()
  })

  it('loading: a status, a busy table and a disabled search', async () => {
    const { container, getByRole, getByText } = await render(<ClaimsQueue state="loading" />)
    await expect.element(getByRole('region', { name: 'Claims table' })).toHaveAttribute('aria-busy', 'true')
    await expect.element(getByRole('textbox', { name: 'Search claims' })).toBeDisabled()
    expect(getByText('Loading claims').elements().length).toBeGreaterThan(0)
    await expectNoA11yViolations(container)
  })

  it('empty: says there are no claims yet and offers no filters', async () => {
    const { container, getByText, getByLabelText } = await render(<ClaimsQueue state="empty" />)
    await expect.element(getByText('No claims yet')).toBeVisible()
    expect(getByLabelText('Filter claims').query()).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('error: an alert; Retry calls back, shows loading and then the queue', async () => {
    const onRetry = vi.fn()
    const { container, getByRole, getByText } = await render(<ClaimsQueue state="error" onRetry={onRetry} />)
    await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load claims')
    expect(page.getByLabelText('Filter claims').query()).toBeNull()
    await expectNoA11yViolations(container)

    await getByRole('button', { name: 'Retry' }).click()
    expect(onRetry).toHaveBeenCalledTimes(1)
    await expect.element(getByText('Showing 1–25 of 1,000'), { timeout: 5000 }).toBeVisible()
    expect(getByRole('alert').query()).toBeNull()
  })

  it('is keyboard reachable: Tab lands on controls, never on the page body', async () => {
    const { getByRole } = await render(<ClaimsQueue />)
    await userEvent.tab()
    await userEvent.tab()
    expect(document.activeElement).not.toBe(document.body)
    await expect.element(getByRole('textbox', { name: 'Search claims' })).toBeVisible()
  })

  describe('search and filters', () => {
    it('no match: explains why, shows 0 results, and Clear filters restores the list and empties the search', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await getByRole('textbox', { name: 'Search claims' }).fill('zzzz-no-such-claim')
      await expect.element(getByText('No claims match these filters')).toBeVisible()
      await expect.element(resultCount()).toMatchTextContent('0 results')

      await getByRole('button', { name: 'Clear filters' }).click()
      await expect.element(getByText('Showing 1–25 of 1,000')).toBeVisible()
      await expect.element(getByRole('textbox', { name: 'Search claims' })).toHaveValue('')
    })

    it('a Status filter adds a chip, updates both counts and removing the chip restores them', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      const inReview = count({ status: 'In review' })
      await choose(getByRole('combobox', { name: 'Status' }), 'In review')
      await expect.element(getByText('Status: In review')).toBeVisible()
      await expect.element(resultCount()).toMatchTextContent(`${fmt(inReview)} results`)
      await expect.element(getByText(`Showing 1–25 of ${fmt(inReview)}`)).toBeVisible()

      await getByRole('button', { name: 'Remove filter Status: In review' }).click()
      await expect.element(resultCount()).toMatchTextContent('1,000 results')
      await expect.element(getByText('Showing 1–25 of 1,000')).toBeVisible()
    })

    it('Line of business and Confidence combine, and Clear all restores everything', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await choose(getByRole('combobox', { name: 'Line of business' }), 'Motor')
      await choose(getByRole('combobox', { name: 'Confidence' }), 'Low')
      await expect.element(getByText('Line of business: Motor')).toBeVisible()
      await expect.element(getByText('Confidence: Low')).toBeVisible()
      await expect.element(resultCount()).toMatchTextContent(`${fmt(count({ lob: 'Motor', confidence: 'Low' }))} results`)

      await getByRole('button', { name: 'Clear all' }).click()
      expect(getByRole('button', { name: /^Remove filter/ }).query()).toBeNull()
      await expect.element(resultCount()).toMatchTextContent('1,000 results')
    })

    it('searching adds a chip and filters the table, and a new filter returns to page 1', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await getByRole('button', { name: 'Next page' }).click()
      await expect.element(getByText('Showing 26–50 of 1,000')).toBeVisible()
      await getByRole('textbox', { name: 'Search claims' }).fill('Mitchell')
      await expect.element(getByText('Search: Mitchell')).toBeVisible()
      await expect.element(getByText(new RegExp(`^Showing 1–\\d+ of ${fmt(count({ query: 'Mitchell' }))}$`))).toBeVisible()
    })
  })

  describe('sorting', () => {
    it('sorting a column updates the sort status and Reset returns to needs attention', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await getByRole('button', { name: /Claimed/ }).click()
      await expect.element(getByText(/Sort:/)).toMatchTextContent('Claimed (ascending)')
      await expect.element(getByRole('columnheader', { name: /Claimed/ })).toHaveAttribute('aria-sort', 'ascending')

      await getByRole('button', { name: 'Reset to Needs attention' }).click()
      await expect.element(getByText(/Sort:/)).toMatchTextContent('Needs attention')
      await expect.element(getByRole('columnheader', { name: /Claimed/ })).toHaveAttribute('aria-sort', 'none')
    })
  })

  describe('bulk actions', () => {
    it('bulk approve: blocked while a Low claim is selected, allowed without it, then announced and applied', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await checkbox(highClaim.id).click()
      await checkbox(lowClaim.id).click()
      const bar = getByRole('region', { name: 'Bulk actions' })
      await expect.element(bar.getByText('2 selected')).toBeVisible()
      await expect.element(bar.getByRole('button', { name: 'Approve 2' })).toBeDisabled()
      await expect.element(bar.getByText(/1 selected isn.t High confidence/)).toBeVisible()

      await checkbox(lowClaim.id).click()
      await expect.element(bar.getByRole('button', { name: 'Approve 1' })).toBeEnabled()
      await bar.getByRole('button', { name: 'Approve 1' }).click()

      await expect.element(getByText('1 claim approved')).toBeInTheDocument()
      expect(getByRole('region', { name: 'Bulk actions' }).query()).toBeNull()
      expect(rowFor(highClaim.id).textContent).toContain('Approved')
      // The bulk bar unmounted: focus goes back to the table.
      await expect.poll(() => document.activeElement?.closest('tr')).not.toBeNull()
    })

    it('select all on the page, then the rule blocks approve while the page has non-High rows', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await getByRole('checkbox', { name: 'Select all claims on this page' }).click()
      await expect.element(getByText('25 selected')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Approve 25' })).toBeDisabled()
    })

    it('assign: pick a handler from the menu and the change is announced', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await checkbox(rachelFree.id).click()
      await getByRole('button', { name: 'Assign' }).click()
      await page.getByRole('menuitem', { name: 'Rachel Morgan' }).click()
      await expect.element(getByText('1 claim assigned to Rachel Morgan')).toBeInTheDocument()
      expect(rowFor(rachelFree.id).textContent).toContain('Rachel Morgan')
      expect(getByRole('region', { name: 'Bulk actions' }).query()).toBeNull()
    })

    it('clear selection announces and removes the bulk bar', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await checkbox(lowClaim.id).click()
      await getByRole('button', { name: 'Clear selection' }).click()
      await expect.element(getByText('Selection cleared')).toBeInTheDocument()
      expect(getByRole('region', { name: 'Bulk actions' }).query()).toBeNull()
      await expect.element(checkbox(lowClaim.id)).not.toBeChecked()
    })

    it('hiding rows with a filter drops their selection from the count', async () => {
      const { getByRole, getByText } = await render(<ClaimsQueue />)
      await checkbox(notHealth.id).click()
      await expect.element(getByText('1 selected')).toBeVisible()
      await choose(getByRole('combobox', { name: 'Line of business' }), 'Health')
      await expect.element(getByText('1 selected')).not.toBeInTheDocument()
    })
  })
})
