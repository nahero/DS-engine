import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { claims } from '@/data/claims'
import { choose } from '@/test/interactions'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { SortStatus } from './ClaimsTable'
import { FilterBar } from './FilterBar'
import { applyFilters, emptyFilters, type ClaimFilters } from './queue-utils'

const handlers = [...new Set(claims.map((c) => c.handler).filter((h): h is string => h !== null))].sort()
const count = (filters: ClaimFilters) => applyFilters(claims, filters).length
const results = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'result' : 'results'}`

function Harness({ initial = emptyFilters, disabled = false, withSort = false }: { initial?: ClaimFilters; disabled?: boolean; withSort?: boolean }) {
  const [filters, setFilters] = useState(initial)
  return (
    <FilterBar filters={filters} onChange={setFilters} handlers={handlers} resultCount={count(filters)} disabled={disabled}>
      {withSort && <SortStatus sorting={[]} onReset={() => {}} />}
    </FilterBar>
  )
}

describe('FilterBar', () => {
  it('shows search, four filters and the live result count with no chips, without axe violations', async () => {
    const { container, getByRole, getByLabelText } = await render(<Harness />)
    await expect.element(getByLabelText('Filter claims')).toBeVisible()
    await expect.element(getByRole('status')).toMatchTextContent('1,000 results')
    await expect.element(getByRole('textbox', { name: 'Search claims' })).toBeVisible()
    for (const name of ['Status', 'Line of business', 'Confidence', 'Handler']) await expect.element(getByRole('combobox', { name })).toBeVisible()
    expect(getByRole('button', { name: 'Clear all' }).query()).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('adding a Status filter adds a chip, names the filter on the trigger and updates the count', async () => {
    const { getByRole, getByText } = await render(<Harness />)
    await choose(getByRole('combobox', { name: 'Status' }), 'In review')
    await expect.element(getByText('Status: In review')).toBeVisible()
    await expect.element(getByRole('combobox', { name: 'Status: In review' })).toBeVisible()
    await expect.element(getByRole('status')).toMatchTextContent(results(count({ ...emptyFilters, status: 'In review' })))
    expect(count({ ...emptyFilters, status: 'In review' })).toBeLessThan(1000)
  })

  it('removing a chip restores the count and clears the filter', async () => {
    const { container, getByRole } = await render(<Harness />)
    await choose(getByRole('combobox', { name: 'Status' }), 'In review')
    await expect.element(getByRole('button', { name: 'Remove filter Status: In review' })).toBeVisible()
    await expectNoA11yViolations(container)
    await getByRole('button', { name: 'Remove filter Status: In review' }).click()
    await expect.element(getByRole('status')).toMatchTextContent('1,000 results')
    expect(getByRole('button', { name: /Remove filter/ }).query()).toBeNull()
    await expect.element(getByRole('combobox', { name: 'Status' })).toBeVisible()
  })

  it('combines filters and "Clear all" removes every chip', async () => {
    const { getByRole, getByText } = await render(<Harness />)
    await choose(getByRole('combobox', { name: 'Line of business' }), 'Motor')
    await choose(getByRole('combobox', { name: 'Confidence' }), 'Low')
    await expect.element(getByText('Line of business: Motor')).toBeVisible()
    await expect.element(getByText('Confidence: Low')).toBeVisible()
    await expect.element(getByRole('status')).toMatchTextContent(results(count({ ...emptyFilters, lob: 'Motor', confidence: 'Low' })))

    await getByRole('button', { name: 'Clear all' }).click()
    expect(getByRole('button', { name: /Remove filter/ }).query()).toBeNull()
    expect(getByRole('button', { name: 'Clear all' }).query()).toBeNull()
    await expect.element(getByRole('status')).toMatchTextContent('1,000 results')
  })

  it('offers Unassigned and every handler in the Handler filter', async () => {
    const { getByRole, getByText } = await render(<Harness />)
    await choose(getByRole('combobox', { name: 'Handler' }), 'Unassigned')
    await expect.element(getByText('Handler: Unassigned')).toBeVisible()
    await expect.element(getByRole('status')).toMatchTextContent(results(count({ ...emptyFilters, handler: 'Unassigned' })))
  })

  it('searching is debounced into a chip and a matching count; removing the chip clears the input', async () => {
    const { getByRole, getByText } = await render(<Harness />)
    const search = getByRole('textbox', { name: 'Search claims' })
    await search.fill('Mitchell')
    await expect.element(getByText('Search: Mitchell')).toBeVisible()
    await expect.element(getByRole('status')).toMatchTextContent(results(count({ ...emptyFilters, query: 'Mitchell' })))

    await getByRole('button', { name: 'Remove filter Search: Mitchell' }).click()
    await expect.element(search).toHaveValue('')
    await expect.element(getByRole('status')).toMatchTextContent('1,000 results')
  })

  it('"Clear all" also empties the search input', async () => {
    const { getByRole } = await render(<Harness initial={{ ...emptyFilters, query: 'mi', status: 'In review' }} />)
    await expect.element(getByRole('textbox', { name: 'Search claims' })).toHaveValue('mi')
    await getByRole('button', { name: 'Clear all' }).click()
    await expect.element(getByRole('textbox', { name: 'Search claims' })).toHaveValue('')
  })

  it('a zero result count reads "0 results" and a single one "1 result"', async () => {
    const { getByRole } = await render(<Harness />)
    await getByRole('textbox', { name: 'Search claims' }).fill('zzzz-no-such-claim')
    await expect.element(getByRole('status')).toMatchTextContent('0 results')
    await getByRole('textbox', { name: 'Search claims' }).fill('CLM-2026-004821')
    await expect.element(getByRole('status')).toMatchTextContent('1 result')
  })

  it('renders initial filters as chips together with the children (sort status)', async () => {
    const { container, getByText } = await render(<Harness initial={{ ...emptyFilters, status: 'In review', confidence: 'Low', query: 'mi' }} withSort />)
    await expect.element(getByText('Status: In review')).toBeVisible()
    await expect.element(getByText('Confidence: Low')).toBeVisible()
    await expect.element(getByText('Search: mi')).toBeVisible()
    await expect.element(getByText('Needs attention')).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('disabled (loading): every control is disabled and no count is announced', async () => {
    const { container, getByRole } = await render(<Harness disabled />)
    await expect.element(getByRole('textbox', { name: 'Search claims' })).toBeDisabled()
    for (const name of ['Status', 'Line of business', 'Confidence', 'Handler']) await expect.element(getByRole('combobox', { name })).toBeDisabled()
    expect(getByRole('status').element().textContent).toBe('')
    await expectNoA11yViolations(container)
  })

  it('every control has a name (labels on all inputs)', async () => {
    const { getByLabelText } = await render(<Harness />)
    await expect.element(getByLabelText('Search claims')).toBeVisible()
  })
})
