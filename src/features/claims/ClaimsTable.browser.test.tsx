import { useState } from 'react'
import type { RowSelectionState, SortingState } from '@tanstack/react-table'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { claims, getClaim } from '@/data/claims'
import type { Claim } from '@/data/types'
import { routes } from '@/lib/routes'
import { choose } from '@/test/interactions'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { BulkBar } from './BulkBar'
import { ClaimsTable } from './ClaimsTable'
import { countNotHighConfidence } from './queue-utils'

// The 12 rows designed in Figma. Needs-attention order: 004821, 004819, 004809, 004803, then oldest first.
const figma = claims.slice(0, 12)
const idOf = (n: string) => `CLM-2026-${n}`

type TableProps = React.ComponentProps<typeof ClaimsTable>

/** Owns sort and selection like the queue does; a BulkBar on top when asked. */
function Harness({
  initialSorting = [],
  initialSelection = {},
  withBulkBar = false,
  data = figma,
  ...props
}: Partial<TableProps> & { initialSorting?: SortingState; initialSelection?: RowSelectionState; withBulkBar?: boolean }) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialSelection)
  const [approved, setApproved] = useState(false)
  const selected = data.filter((c) => rowSelection[c.id])
  return (
    <>
      {withBulkBar && (
        <BulkBar
          selected={selected}
          handlers={['Emily Carter']}
          onApprove={() => {
            setApproved(true)
            setRowSelection({})
          }}
          onAssign={() => {}}
          onClear={() => setRowSelection({})}
        />
      )}
      {approved && <p>Bulk approve requested</p>}
      <ClaimsTable
        {...props}
        data={data}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </>
  )
}

const bodyRows = () => page.getByRole('row').elements().slice(1) as HTMLTableRowElement[]
const rowIds = () => bodyRows().map((r) => r.querySelector('a')?.textContent)
const checkbox = (id: string) => page.getByRole('checkbox', { name: `Select ${idOf(id)}` })
const rowFor = (id: string) => bodyRows().find((r) => r.querySelector('a')?.textContent === idOf(id))!

const originalHash = window.location.hash
afterEach(() => {
  history.replaceState(null, '', window.location.pathname + window.location.search + originalHash)
})

describe('ClaimsTable', () => {
  it('lists claims in needs-attention order with a range summary, without axe violations', async () => {
    const { container, getByRole, getByText } = await render(<Harness />)
    await expect.element(getByRole('region', { name: 'Claims table' })).toBeVisible()
    expect(bodyRows()).toHaveLength(12)
    expect(rowIds().slice(0, 4)).toEqual([idOf('004821'), idOf('004819'), idOf('004809'), idOf('004803')])
    await expect.element(getByText('Showing 1–12 of 12')).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('links every claim number to routes.claim(id)', async () => {
    const { getByRole } = await render(<Harness />)
    await expect.element(getByRole('link', { name: idOf('004821') })).toHaveAttribute('href', routes.claim(idOf('004821')))
  })

  it('shows money right-aligned in tabular figures and dates in a fixed format', async () => {
    const { getByRole, getByText } = await render(<Harness />)
    const amount = getByText('€8,920.00').element()
    expect(getComputedStyle(amount).fontVariantNumeric).toContain('tabular-nums')
    expect(getComputedStyle(amount.closest('td')!).textAlign).toBe('right')
    expect(getComputedStyle(getByRole('columnheader', { name: /Claimed/ }).element()).textAlign).toBe('right')
    await expect.element(getByText('21 Sep 2026').first()).toBeVisible()
  })

  it('states SLA, status and flag as text next to icons, not colour alone', async () => {
    await render(<Harness />)
    const row = rowFor('004821')
    expect(row.textContent).toContain('Overdue 1 d')
    expect(row.textContent).toContain('In review')
    expect(row.textContent).toContain('Loss date outside policy period')
  })

  it('missing data never renders blank: no score, unassigned, no flag, SLA not applicable', async () => {
    const missing: Claim = {
      ...getClaim(idOf('004819'))!,
      id: 'CLM-2026-009999',
      policyholder: 'Unknown submitter',
      slaDays: null,
      confidence: null,
      flag: null,
      handler: null,
      status: 'New',
    }
    const { container } = await render(<Harness data={[missing]} />)
    const row = bodyRows()[0].textContent ?? ''
    for (const text of ['No score', 'Unassigned', 'No flag', 'Not applicable']) expect(row).toContain(text)
    await expectNoA11yViolations(container)
  })

  it('keeps long names reachable by truncating with the full value available', async () => {
    const long = 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC'
    const { container } = await render(
      <Harness data={[{ ...getClaim(idOf('004819'))!, policyholder: long, claimed: 1234567.89 }, ...figma.slice(1, 5)]} />,
    )
    expect(container.textContent).toContain(long)
    expect(container.textContent).toContain('€1,234,567.89')
    await expectNoA11yViolations(container)
  })

  describe('sorting', () => {
    it('clicking a sortable header sorts ascending then descending and exposes aria-sort', async () => {
      const { getByRole } = await render(<Harness />)
      const header = getByRole('columnheader', { name: /Claimed/ })
      await expect.element(header).toHaveAttribute('aria-sort', 'none')

      await getByRole('button', { name: /Claimed/ }).click()
      await expect.element(header).toHaveAttribute('aria-sort', 'ascending')
      expect(rowIds()[0]).toBe(idOf('004795'))

      await getByRole('button', { name: /Claimed/ }).click()
      await expect.element(header).toHaveAttribute('aria-sort', 'descending')
      expect(rowIds()[0]).toBe(idOf('004819'))
    })

    it('sorting by confidence descending puts claims without a score last', async () => {
      const { getByRole } = await render(<Harness initialSorting={[{ id: 'confidence', desc: true }]} />)
      await expect.element(getByRole('columnheader', { name: /Confidence/ })).toHaveAttribute('aria-sort', 'descending')
      expect(rowIds()[0]).toBe(idOf('004795'))
      expect(rowIds().at(-1)).toBe(idOf('004819'))
    })

    it('columns that cannot be sorted have no aria-sort and no button', async () => {
      const { getByRole } = await render(<Harness />)
      await expect.element(getByRole('columnheader', { name: 'Policyholder' })).not.toHaveAttribute('aria-sort')
      expect(getByRole('button', { name: 'Policyholder' }).query()).toBeNull()
    })
  })

  describe('selection', () => {
    it('selecting rows marks them and shows the header checkbox as mixed', async () => {
      const { getByRole } = await render(<Harness initialSelection={{ [idOf('004803')]: true, [idOf('004799')]: true }} />)
      await expect.element(checkbox('004803')).toBeChecked()
      expect(rowFor('004803')).toHaveAttribute('data-state', 'selected')
      await expect.element(getByRole('checkbox', { name: 'Select all claims on this page' })).toHaveAttribute('aria-checked', 'mixed')
    })

    it('select all selects every row on the page only', async () => {
      const { getByRole, getByText } = await render(<Harness data={claims} withBulkBar />)
      await getByRole('checkbox', { name: 'Select all claims on this page' }).click()
      await expect.element(getByText('25 selected')).toBeVisible()
      // The page has non-High rows, so bulk approve stays blocked.
      await expect.element(getByRole('button', { name: 'Approve 25' })).toBeDisabled()
      expect(bodyRows().every((r) => r.getAttribute('data-state') === 'selected')).toBe(true)
    })

    it('bulk approve is blocked by a Low claim with the reason shown and unblocked when it is deselected', async () => {
      const { getByRole, getByText } = await render(<Harness withBulkBar />)
      await checkbox('004803').click() // 96% High
      await checkbox('004821').click() // 52% Low
      await expect.element(getByText('2 selected')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Approve 2' })).toBeDisabled()
      await expect.element(getByText(/1 selected isn.t High confidence/)).toBeVisible()

      await checkbox('004821').click()
      await expect.element(getByRole('button', { name: 'Approve 1' })).toBeEnabled()
      await expect.element(getByText('Bulk approve only for High confidence')).toBeVisible()
      expect(countNotHighConfidence([getClaim(idOf('004803'))!])).toBe(0)

      await getByRole('button', { name: 'Approve 1' }).click()
      await expect.element(getByText('Bulk approve requested')).toBeVisible()
    })
  })

  describe('keyboard', () => {
    const focusFirstRow = async () => {
      const rows = bodyRows()
      rows[0].focus()
      await expect.poll(() => document.activeElement).toBe(rows[0])
    }

    it('rows are a roving tab stop: one row is tabbable', async () => {
      await render(<Harness />)
      const rows = bodyRows()
      expect(rows[0]).toHaveAttribute('tabindex', '0')
      expect(rows.slice(1).every((r) => r.getAttribute('tabindex') === '-1')).toBe(true)
    })

    it('ArrowDown and j move down, ArrowUp and k move up, and the tab stop follows', async () => {
      await render(<Harness />)
      await focusFirstRow()
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(() => document.activeElement).toBe(bodyRows()[1])
      expect(bodyRows()[1]).toHaveAttribute('tabindex', '0')
      expect(bodyRows()[0]).toHaveAttribute('tabindex', '-1')
      await userEvent.keyboard('j')
      await expect.poll(() => document.activeElement).toBe(bodyRows()[2])
      await userEvent.keyboard('k')
      await expect.poll(() => document.activeElement).toBe(bodyRows()[1])
      await userEvent.keyboard('{ArrowUp}')
      await expect.poll(() => document.activeElement).toBe(bodyRows()[0])
      // Stops at the first row.
      await userEvent.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(bodyRows()[0])
    })

    it('x toggles selection of the active row on and off', async () => {
      await render(<Harness />)
      await focusFirstRow()
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('x')
      await expect.element(checkbox('004819')).toBeChecked()
      await userEvent.keyboard('x')
      await expect.element(checkbox('004819')).not.toBeChecked()
    })

    it('Space on the row toggles selection', async () => {
      await render(<Harness />)
      await focusFirstRow()
      await userEvent.keyboard(' ')
      await expect.element(checkbox('004821')).toBeChecked()
      await userEvent.keyboard(' ')
      await expect.element(checkbox('004821')).not.toBeChecked()
    })

    it('Shift+ArrowDown extends the selection', async () => {
      await render(<Harness />)
      await focusFirstRow()
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
      await expect.element(checkbox('004819')).toBeChecked()
      await expect.element(checkbox('004809')).toBeChecked()
      await expect.element(checkbox('004803')).toBeChecked()
      await expect.element(checkbox('004821')).not.toBeChecked()
    })

    it('Enter opens the claim by setting the hash to #claim-<id>', async () => {
      await render(<Harness />)
      await focusFirstRow()
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{Enter}')
      await expect.poll(() => window.location.hash).toBe(routes.claim(idOf('004819')))
    })

    it('shortcuts do not fire while typing in a field', async () => {
      await render(
        <>
          <input aria-label="Notes" />
          <Harness />
        </>,
      )
      await page.getByRole('textbox', { name: 'Notes' }).click()
      await userEvent.keyboard('x')
      expect(bodyRows().every((r) => r.getAttribute('data-state') !== 'selected')).toBe(true)
    })
  })

  describe('pagination', () => {
    it('shows 25 rows, page 1 and a disabled Previous by default', async () => {
      const { getByRole, getByText } = await render(<Harness data={claims} />)
      await expect.element(getByText('Showing 1–25 of 1,000')).toBeVisible()
      expect(bodyRows()).toHaveLength(25)
      await expect.element(getByRole('button', { name: 'Previous page' })).toBeDisabled()
      await expect.element(getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    })

    it('Next shows rows 26–50 and Previous returns to page 1', async () => {
      const { getByRole, getByText } = await render(<Harness data={claims} />)
      const firstPage = rowIds()
      await getByRole('button', { name: 'Next page' }).click()
      await expect.element(getByText('Showing 26–50 of 1,000')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
      expect(rowIds()).not.toEqual(firstPage)

      await getByRole('button', { name: 'Previous page' }).click()
      await expect.element(getByText('Showing 1–25 of 1,000')).toBeVisible()
      expect(rowIds()).toEqual(firstPage)
    })

    it('rows per page offers 25, 50 and 100', async () => {
      const { getByRole, getByText } = await render(<Harness data={claims} />)
      await getByRole('combobox', { name: 'Rows per page' }).click()
      for (const n of ['25', '50', '100']) await expect.element(page.getByRole('option', { name: n, exact: true })).toBeVisible()
      await page.getByRole('option', { name: '50', exact: true }).click()
      await expect.element(getByText('Showing 1–50 of 1,000')).toBeVisible()
      expect(bodyRows()).toHaveLength(50)

      await choose(getByRole('combobox', { name: 'Rows per page' }), '100')
      await expect.element(getByText('Showing 1–100 of 1,000')).toBeVisible()
      expect(bodyRows()).toHaveLength(100)
    })

    it('a page number jumps to that page', async () => {
      const { getByRole, getByText } = await render(<Harness data={claims} />)
      await getByRole('button', { name: 'Page 3' }).click()
      await expect.element(getByText('Showing 51–75 of 1,000')).toBeVisible()
    })
  })

  describe('states', () => {
    it('loading: a status, a busy region, skeleton rows and no sortable headers', async () => {
      const { container, getByRole } = await render(<Harness state="loading" />)
      await expect.element(getByRole('status')).toMatchTextContent('Loading claims')
      await expect.element(getByRole('region', { name: 'Claims table' })).toHaveAttribute('aria-busy', 'true')
      expect(container.querySelector('a')).toBeNull()
      expect(getByRole('button', { name: /Claimed/ }).query()).toBeNull()
      await expectNoA11yViolations(container)
    })

    it('empty: says there are no claims yet', async () => {
      const { container, getByText } = await render(<Harness state="empty" data={[]} />)
      await expect.element(getByText('No claims yet')).toBeVisible()
      await expectNoA11yViolations(container)
    })

    it('empty because of filters: says so and Clear filters calls back', async () => {
      const onClearFilters = vi.fn()
      const { container, getByRole, getByText } = await render(<Harness data={[]} emptyReason="filters" onClearFilters={onClearFilters} />)
      await expect.element(getByText('No claims match these filters')).toBeVisible()
      await expectNoA11yViolations(container)
      await getByRole('button', { name: 'Clear filters' }).click()
      expect(onClearFilters).toHaveBeenCalledTimes(1)
    })

    it('error: an alert with Retry that calls back', async () => {
      const onRetry = vi.fn()
      const { container, getByRole } = await render(<Harness state="error" onRetry={onRetry} />)
      await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load claims')
      await expectNoA11yViolations(container)
      await getByRole('button', { name: 'Retry' }).click()
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })
})
