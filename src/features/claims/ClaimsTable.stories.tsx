import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { RowSelectionState, SortingState } from '@tanstack/react-table'
import { expect, fn, waitFor, within } from 'storybook/test'
import { claims, getClaim } from '@/data/claims'
import type { Claim } from '@/data/types'
import { ClaimsTable } from './ClaimsTable'

// The 12 rows designed in Figma. Needs-attention order: 004821, 004819, 004809, 004803, then oldest first.
const figma = claims.slice(0, 12)
const idOf = (n: string) => `CLM-2026-${n}`

type TableProps = React.ComponentProps<typeof ClaimsTable>

function Harness({
  initialSorting = [],
  initialSelection = {},
  ...props
}: Partial<TableProps> & { initialSorting?: SortingState; initialSelection?: RowSelectionState }) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialSelection)
  const data = props.data ?? figma
  return (
    <ClaimsTable
      {...props}
      data={data}
      sorting={sorting}
      onSortingChange={setSorting}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
    />
  )
}

const meta = {
  title: 'Claims/ClaimsTable',
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No claims match these filters')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Clear filters' })).toBeVisible()
  },
}

export const ErrorState: Story = {
  name: 'Error',
  args: { state: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('Couldn’t load claims')
    await expect(canvas.getByRole('button', { name: 'Retry' })).toBeVisible()
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
