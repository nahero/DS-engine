import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { applyFilters, emptyFilters, type ClaimFilters } from '@/components/review/queue-utils'
import { claims } from '@/data/claims'
import { ClaimsQueue } from './ClaimsQueue'

const count = (filters: Partial<ClaimFilters>) => applyFilters(claims, { ...emptyFilters, ...filters }).length
const fmt = (n: number) => n.toLocaleString('en-US')

const meta = {
  title: 'Screens/ClaimsQueue',
  component: ClaimsQueue,
  args: { onRetry: fn() },
  // The app shell supplies <main>; stories stand in for it so the page has a landmark.
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-canvas">
        <Story />
      </main>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every claim awaiting a decision: filterable, sortable (needs attention first), paginated, bulk-actionable. Runs on the 1,000-claim seed. `state` drives loading, empty (no claims at all) and error (with Retry, which shows loading briefly and then the data).',
      },
    },
  },
} satisfies Meta<typeof ClaimsQueue>

export default meta
type Story = StoryObj<typeof meta>

const bodyRows = (canvas: ReturnType<typeof within>) => canvas.getAllByRole('row').slice(1)
const filterBar = (canvas: ReturnType<typeof within>) => within(canvas.getByLabelText('Filter claims'))
// Radix restores aria-hidden on the page a beat after a menu/listbox closes; wait so the a11y check sees the final DOM.
const settled = () => waitFor(() => expect(document.querySelector('[data-aria-hidden]')).toBeNull())

/** 1,000 claims, 25 per page, needs-attention order. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Claims queue' })).toBeInTheDocument()
    await expect(canvas.getByText('Showing 1–25 of 1,000')).toBeInTheDocument()
    await expect(filterBar(canvas).getByRole('status')).toHaveTextContent('1,000 results')
    await expect(canvas.getByText(/Sort:/)).toHaveTextContent('Needs attention')
    await expect(bodyRows(canvas)).toHaveLength(25)
  },
}

export const Loading: Story = {
  args: { state: 'loading' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Loading claims').length).toBeGreaterThan(0)
    await expect(canvas.getByRole('region', { name: 'Claims table' })).toHaveAttribute('aria-busy', 'true')
    await expect(canvas.getByRole('textbox', { name: 'Search claims' })).toBeDisabled()
  },
}

export const Empty: Story = {
  args: { state: 'empty' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No claims yet')).toBeVisible()
    await expect(canvas.queryByLabelText('Filter claims')).not.toBeInTheDocument()
  },
}

/** Error → Retry shows the loading state briefly, then the queue. */
export const ErrorState: Story = {
  name: 'Error',
  args: { state: 'error' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('Couldn’t load claims')
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(canvas.getByText('Showing 1–25 of 1,000')).toBeInTheDocument(), { timeout: 3000 })
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await userEvent.tab()
    await expect(canvas.getByRole('textbox', { name: 'Search claims' })).toBeInTheDocument()
    await expect(document.activeElement).not.toBe(document.body)
  },
}

/** No match: the empty state explains why and Clear filters restores the list. */
export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search claims' }), 'zzzz-no-such-claim')
    await waitFor(() => expect(canvas.getByText('No claims match these filters')).toBeVisible())
    await expect(filterBar(canvas).getByRole('status')).toHaveTextContent('0 results')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(canvas.getByText('Showing 1–25 of 1,000')).toBeInTheDocument())
    await expect(canvas.getByRole('textbox', { name: 'Search claims' })).toHaveValue('')
  },
}

/** Choose a Status: chip + new count; remove the chip: count restored; two filters then "Clear all". */
export const FilterChips: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const bar = filterBar(canvas)
    const total = `${fmt(claims.length)} results`

    await userEvent.click(bar.getByRole('combobox', { name: 'Status' }))
    await userEvent.click(await body.findByRole('option', { name: 'In review' }))
    await settled()
    const inReview = count({ status: 'In review' })
    await expect(bar.getByText('Status: In review')).toBeInTheDocument()
    await waitFor(() => expect(bar.getByRole('status')).toHaveTextContent(`${fmt(inReview)} results`))
    await expect(canvas.getByText(`Showing 1–25 of ${fmt(inReview)}`)).toBeInTheDocument()
    await expect(bar.getByRole('status')).not.toHaveTextContent(total)

    await userEvent.click(bar.getByRole('button', { name: 'Remove filter Status: In review' }))
    await expect(bar.queryByText('Status: In review')).not.toBeInTheDocument()
    await expect(bar.getByRole('status')).toHaveTextContent(total)
    await expect(canvas.getByText('Showing 1–25 of 1,000')).toBeInTheDocument()

    await userEvent.click(bar.getByRole('combobox', { name: 'Line of business' }))
    await userEvent.click(await body.findByRole('option', { name: 'Motor' }))
    await settled()
    await userEvent.click(bar.getByRole('combobox', { name: 'Confidence' }))
    await userEvent.click(await body.findByRole('option', { name: 'Low' }))
    await settled()
    await expect(bar.getByText('Line of business: Motor')).toBeInTheDocument()
    await expect(bar.getByText('Confidence: Low')).toBeInTheDocument()
    await waitFor(() => expect(bar.getByRole('status')).toHaveTextContent(`${fmt(count({ lob: 'Motor', confidence: 'Low' }))} results`))

    await userEvent.click(bar.getByRole('button', { name: 'Clear all' }))
    await expect(bar.queryByRole('button', { name: /^Remove filter/ })).not.toBeInTheDocument()
    await expect(bar.getByRole('status')).toHaveTextContent(total)
  },
}

/**
 * Bulk approve rule: one High and one Low row selected → Approve is disabled and the reason is visible;
 * deselect the Low one → Approve enabled; click → live region announces it and the rows become Approved.
 */
export const BulkApprove: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = bodyRows(canvas)
    const withConfidence = (re: RegExp) => rows.find((r: HTMLElement) => within(r).queryByText(re))!
    const highRow = withConfidence(/^Confidence \d+%, high$/)
    const lowRow = withConfidence(/^Confidence \d+%, low$/)
    await expect(highRow).toBeTruthy()
    await expect(lowRow).toBeTruthy()
    const highBox = within(highRow).getByRole('checkbox')
    const lowBox = within(lowRow).getByRole('checkbox')
    const highId = within(highRow).getByRole('link').textContent!

    await userEvent.click(highBox)
    await userEvent.click(lowBox)
    const bar = within(canvas.getByRole('region', { name: 'Bulk actions' }))
    await expect(bar.getByText('2 selected')).toBeInTheDocument()
    await expect(bar.getByRole('button', { name: 'Approve 2' })).toBeDisabled()
    await expect(bar.getByText(/1 selected isn.t High confidence/)).toBeVisible()

    await userEvent.click(lowBox)
    const approve = bar.getByRole('button', { name: 'Approve 1' })
    await expect(approve).toBeEnabled()
    await userEvent.click(approve)

    await expect(canvas.getByText('1 claim approved')).toBeInTheDocument()
    await expect(canvas.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()
    await expect(within(rows.find((r: HTMLElement) => within(r).queryByText(highId))!).getByText('Approved')).toBeInTheDocument()
    // The bulk bar unmounted: focus goes back to the table.
    await waitFor(() => expect(document.activeElement?.closest('tr')).not.toBeNull())
  },
}

export const BulkAssign: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(within(bodyRows(canvas)[0]).getByRole('checkbox'))
    await userEvent.click(canvas.getByRole('button', { name: 'Assign' }))
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Rachel Morgan' }))
    await expect(canvas.getByText('1 claim assigned to Rachel Morgan')).toBeInTheDocument()
    await settled()
  },
}

export const ClearSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(within(bodyRows(canvas)[0]).getByRole('checkbox'))
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }))
    await expect(canvas.getByText('Selection cleared')).toBeInTheDocument()
    await expect(canvas.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()
  },
}

/** 375px viewport: filters wrap, the table scrolls inside its own focusable region. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
