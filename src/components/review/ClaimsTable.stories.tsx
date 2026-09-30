import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { RowSelectionState, SortingState } from '@tanstack/react-table'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { claims, getClaim } from '@/data/claims'
import type { Claim } from '@/data/types'
import { BulkBar } from './BulkBar'
import { ClaimsTable } from './ClaimsTable'

// The 12 rows designed in Figma. Needs-attention order: 004821, 004819, 004809, 004803, then oldest first.
const figma = claims.slice(0, 12)
const idOf = (n: string) => `CLM-2026-${n}`

type TableProps = React.ComponentProps<typeof ClaimsTable>

function Harness({
  initialSorting = [],
  initialSelection = {},
  withBulk = false,
  onApprove,
  ...props
}: Partial<TableProps> & { initialSorting?: SortingState; initialSelection?: RowSelectionState; withBulk?: boolean; onApprove?: () => void }) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialSelection)
  const data = props.data ?? figma
  const selected = data.filter((c) => rowSelection[c.id])
  return (
    <div className="flex flex-col gap-stack">
      {withBulk && (
        <BulkBar selected={selected} handlers={['Emily Carter']} onApprove={onApprove ?? (() => {})} onAssign={() => {}} onClear={() => setRowSelection({})} />
      )}
      <ClaimsTable
        {...props}
        data={data}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  )
}

const meta = {
  title: 'Review/ClaimsTable',
  component: ClaimsTable,
  args: {
    data: figma,
    sorting: [],
    onSortingChange: fn(),
    rowSelection: {},
    onRowSelectionChange: fn(),
    onClearFilters: fn(),
    onRetry: fn(),
  },
  render: (args) => <Harness data={args.data} state={args.state} emptyReason={args.emptyReason} onRetry={args.onRetry} onClearFilters={args.onClearFilters} />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Dense claims table: client-side sort (needs attention first by default), selection and pagination (25/50/100), sticky header, roving-focus rows. Keyboard: ↑/↓ or j/k move, Enter opens, x or Space selects, Shift+↑/↓ extends. Numbers right-aligned in tabular figures; long names truncate with the full value on focus/hover.',
      },
    },
  },
  decorators: [
    (Story) => (
      <main className="p-inset">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ClaimsTable>

export default meta
type Story = StoryObj<typeof meta>

const rowOf = (canvas: ReturnType<typeof within>, id: string) => canvas.getByRole('link', { name: id }).closest('tr') as HTMLTableRowElement
const bodyRows = (canvas: ReturnType<typeof within>) => canvas.getAllByRole('row').slice(1)

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = bodyRows(canvas)
    await expect(rows).toHaveLength(12)
    // Needs attention first: overdue, then agent failed, then low confidence.
    await expect(within(rows[0]).getByRole('link')).toHaveTextContent(idOf('004821'))
    await expect(within(rows[1]).getByRole('link')).toHaveTextContent(idOf('004819'))
    await expect(within(rows[2]).getByRole('link')).toHaveTextContent(idOf('004809'))
    await expect(canvas.getByText('Showing 1–12 of 12')).toBeInTheDocument()
  },
}

export const Loading: Story = {
  args: { state: 'loading' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading claims')
    await expect(canvas.getByRole('region', { name: 'Claims table' })).toHaveAttribute('aria-busy', 'true')
  },
}

export const Empty: Story = {
  args: { state: 'empty', data: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No claims yet')).toBeVisible()
  },
}

/** Filters match nothing: says so and offers Clear filters. */
export const EmptyFiltered: Story = {
  args: { data: [], emptyReason: 'filters' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No claims match these filters')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }))
    await expect(args.onClearFilters).toHaveBeenCalledTimes(1)
  },
}

export const ErrorState: Story = {
  name: 'Error',
  args: { state: 'error' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('Couldn’t load claims')
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

/** All 1,000 claims: paginated at 25; the header stays sticky inside its scroll region. */
export const ManyRows: Story = {
  args: { data: claims },
  render: (args) => <Harness data={args.data} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Showing 1–25 of 1,000')).toBeInTheDocument()
    await expect(bodyRows(canvas)).toHaveLength(25)
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
    await expect(canvas.getByText('Showing 26–50 of 1,000')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(canvas.getByRole('button', { name: 'Previous page' }))
    await expect(canvas.getByText('Showing 1–25 of 1,000')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  },
}

export const SelectedRows: Story = {
  render: () => <Harness initialSelection={{ [idOf('004803')]: true, [idOf('004799')]: true }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: `Select ${idOf('004803')}` })).toBeChecked()
    await expect(rowOf(canvas, idOf('004803'))).toHaveAttribute('data-state', 'selected')
    await expect(canvas.getByRole('checkbox', { name: 'Select all claims on this page' })).toHaveAttribute('aria-checked', 'mixed')
  },
}

export const SortedByConfidence: Story = {
  render: () => <Harness initialSorting={[{ id: 'confidence', desc: true }]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('columnheader', { name: /Confidence/ })).toHaveAttribute('aria-sort', 'descending')
    await expect(within(bodyRows(canvas)[0]).getByRole('link')).toHaveTextContent(idOf('004795'))
    // No score always sorts last.
    await expect(within(bodyRows(canvas).at(-1)!).getByRole('link')).toHaveTextContent(idOf('004819'))
  },
}

/** Missing data: no score, no handler, no flag, SLA not applicable. Nothing renders blank. */
const missingRow: Claim = {
  ...getClaim(idOf('004819'))!,
  id: 'CLM-2026-009999',
  policyholder: 'Unknown submitter',
  slaDays: null,
  confidence: null,
  flag: null,
  handler: null,
  status: 'New',
}

export const MissingData: Story = {
  render: () => <Harness data={[missingRow]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const row = within(bodyRows(canvas)[0])
    await expect(row.getByText('No score')).toBeInTheDocument()
    await expect(row.getByText('Unassigned')).toBeInTheDocument()
    await expect(row.getByText('No flag')).toBeInTheDocument()
  },
}

const longRows: Claim[] = [
  {
    ...getClaim(idOf('004819'))!,
    policyholder: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
    flag: 'Loss date outside policy period',
    claimed: 1234567.89,
  },
  ...figma.slice(1, 5),
]

export const LongContent: Story = {
  render: () => <Harness data={longRows} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const name = canvas.getByText(longRows[0].policyholder)
    // Cut off: a tab stop carrying the full value.
    await waitFor(() => expect(name).toHaveAttribute('tabindex', '0'))
    await expect(canvas.getByText('€1,234,567.89')).toBeInTheDocument()
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    bodyRows(canvas)[0].focus()
    await expect(bodyRows(canvas)[0]).toHaveFocus()
    await expect(bodyRows(canvas)[0]).toHaveAttribute('tabindex', '0')
  },
}

/** Sorting a column toggles aria-sort and re-orders the rows. */
export const SortByColumn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const claimed = canvas.getByRole('columnheader', { name: /Claimed/ })
    await userEvent.click(within(claimed).getByRole('button', { name: /Claimed/ }))
    await expect(claimed).toHaveAttribute('aria-sort', 'ascending')
    await expect(within(bodyRows(canvas)[0]).getByRole('link')).toHaveTextContent(idOf('004795'))
    await userEvent.click(within(claimed).getByRole('button', { name: /Claimed/ }))
    await expect(claimed).toHaveAttribute('aria-sort', 'descending')
    await expect(within(bodyRows(canvas)[0]).getByRole('link')).toHaveTextContent(idOf('004819'))
  },
}

/**
 * Keyboard: ↓ moves the active row (roving tabindex), x toggles selection, Shift+↓ extends it,
 * Enter opens the claim (location.hash → #claim-<id>). Shortcuts never fire while typing.
 */
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = bodyRows(canvas)
    rows[0].focus()
    await expect(rows[0]).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await expect(rows[1]).toHaveFocus()
    await expect(rows[1]).toHaveAttribute('tabindex', '0')
    await expect(rows[0]).toHaveAttribute('tabindex', '-1')

    await userEvent.keyboard('x')
    await expect(canvas.getByRole('checkbox', { name: `Select ${idOf('004819')}` })).toBeChecked()
    await userEvent.keyboard('x')
    await expect(canvas.getByRole('checkbox', { name: `Select ${idOf('004819')}` })).not.toBeChecked()

    // j / k also move.
    await userEvent.keyboard('j')
    await expect(rows[2]).toHaveFocus()
    await userEvent.keyboard('k')
    await expect(rows[1]).toHaveFocus()

    // Shift+↓ extends the selection from the row where it started.
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
    await expect(rows[3]).toHaveFocus()
    for (const n of ['004819', '004809', '004803']) {
      await expect(canvas.getByRole('checkbox', { name: `Select ${idOf(n)}` })).toBeChecked()
    }
    await expect(canvas.getByRole('checkbox', { name: `Select ${idOf('004821')}` })).not.toBeChecked()

    // Enter opens the focused claim.
    const before = window.location.href
    try {
      rows[1].focus()
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(window.location.hash).toBe(`#claim-${idOf('004819')}`))
    } finally {
      history.replaceState(null, '', before)
    }
  },
}

/** Bulk approve rule: Approve is blocked while a non-High row is selected, and says why. */
const approveSpy = fn()

export const BulkApproveRule: Story = {
  render: () => <Harness withBulk onApprove={approveSpy} />,
  play: async ({ canvasElement }) => {
    approveSpy.mockClear()
    const canvas = within(canvasElement)
    const high = canvas.getByRole('checkbox', { name: `Select ${idOf('004803')}` }) // 96% High
    const low = canvas.getByRole('checkbox', { name: `Select ${idOf('004821')}` }) // 52% Low

    await userEvent.click(high)
    await userEvent.click(low)
    const approve = canvas.getByRole('button', { name: 'Approve 2' })
    await expect(approve).toBeDisabled()
    await expect(canvas.getByText(/1 selected isn.t High confidence/)).toBeVisible()

    await userEvent.click(low)
    const enabled = canvas.getByRole('button', { name: 'Approve 1' })
    await expect(enabled).toBeEnabled()
    await expect(canvas.getByText('Bulk approve only for High confidence')).toBeVisible()
    await userEvent.click(enabled)
    await expect(approveSpy).toHaveBeenCalledTimes(1)
  },
}

export const SelectAllOnPage: Story = {
  render: () => <Harness data={claims} withBulk />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all claims on this page' }))
    await expect(canvas.getByText('25 selected')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Approve 25' })).toBeDisabled() // page 1 holds non-High rows
  },
}
