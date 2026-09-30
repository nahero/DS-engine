import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { claims } from '@/data/claims'
import { FilterBar } from './FilterBar'
import { SortStatus } from './ClaimsTable'
import { applyFilters, emptyFilters, type ClaimFilters } from './queue-utils'

const handlers = [...new Set(claims.map((c) => c.handler).filter((h): h is string => h !== null))].sort()
const count = (filters: Partial<ClaimFilters>) => applyFilters(claims, { ...emptyFilters, ...filters }).length.toLocaleString('en-US')
const results = (n: string) => `${n} ${n === '1' ? 'result' : 'results'}`

function Harness({ initial = emptyFilters, disabled = false, withSort = false }: { initial?: ClaimFilters; disabled?: boolean; withSort?: boolean }) {
  const [filters, setFilters] = useState(initial)
  return (
    <FilterBar
      filters={filters}
      onChange={setFilters}
      handlers={handlers}
      resultCount={applyFilters(claims, filters).length}
      disabled={disabled}
    >
      {withSort && <SortStatus sorting={[]} onReset={() => {}} />}
    </FilterBar>
  )
}

const meta = {
  title: 'Review/FilterBar',
  component: FilterBar,
  args: { filters: emptyFilters, onChange: () => {}, handlers, resultCount: claims.length },
  render: () => <Harness />,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Search (debounced), four filters, removable chips for what is active, "Clear all", and a live result count (polite status). `children` render at the end of the chip row.',
      },
    },
  },
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

// Radix restores aria-hidden on the page a beat after the listbox closes; wait so the a11y check sees the final DOM.
const settled = () => waitFor(() => expect(document.querySelector('[data-aria-hidden]')).toBeNull())

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('1,000 results')
    await expect(canvas.getByRole('textbox', { name: 'Search claims' })).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
  },
}

export const WithFilters: Story = {
  render: () => <Harness initial={{ ...emptyFilters, status: 'In review', confidence: 'Low', query: 'mi' }} withSort />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Status: In review')).toBeInTheDocument()
    await expect(canvas.getByText('Confidence: Low')).toBeInTheDocument()
    await expect(canvas.getByText('Search: mi')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()
    await expect(canvas.getByText('Sort:', { exact: false })).toBeInTheDocument()
  },
}

export const AllFilters: Story = {
  render: () => (
    <Harness initial={{ query: 'Smith', status: 'New', lob: 'Motor', confidence: 'High', handler: 'Emily Carter' }} withSort />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('button', { name: /^Remove filter/ })).toHaveLength(5)
  },
}

/** Loading: controls are disabled and the count is empty. */
export const Disabled: Story = {
  render: () => <Harness disabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Search claims' })).toBeDisabled()
    await expect(canvas.getByRole('combobox', { name: 'Status' })).toBeDisabled()
  },
}

export const NoResults: Story = {
  render: () => <Harness initial={{ ...emptyFilters, query: 'zzzz-no-such-claim' }} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('0 results')
  },
}

export const SingleResult: Story = {
  render: () => <Harness initial={{ ...emptyFilters, query: 'CLM-2026-004817' }} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('1 result')
  },
}

export const LongSearch: Story = {
  render: () => (
    <Harness initial={{ ...emptyFilters, query: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC' }} />
  ),
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('textbox', { name: 'Search claims' })).toHaveFocus()
  },
}

export const Narrow: Story = {
  render: () => <Harness initial={{ ...emptyFilters, status: 'In review', lob: 'Motor' }} withSort />,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
}

/**
 * Filter chips: choose a Status → chip + new result count; remove the chip with its button → count restored;
 * two filters → "Clear all" clears both.
 */
export const FilterChips: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const total = results(count({}))
    await expect(canvas.getByRole('status')).toHaveTextContent(total)

    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }))
    await userEvent.click(await body.findByRole('option', { name: 'In review' }))
    await settled()
    await expect(canvas.getByText('Status: In review')).toBeInTheDocument()
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(results(count({ status: 'In review' }))))
    await expect(canvas.getByRole('status')).not.toHaveTextContent(total)

    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter Status: In review' }))
    await expect(canvas.queryByText('Status: In review')).not.toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent(total)

    await userEvent.click(canvas.getByRole('combobox', { name: 'Line of business' }))
    await userEvent.click(await body.findByRole('option', { name: 'Motor' }))
    await settled()
    await userEvent.click(canvas.getByRole('combobox', { name: 'Confidence' }))
    await userEvent.click(await body.findByRole('option', { name: 'Low' }))
    await settled()
    await expect(canvas.getByText('Line of business: Motor')).toBeInTheDocument()
    await expect(canvas.getByText('Confidence: Low')).toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent(results(count({ lob: 'Motor', confidence: 'Low' })))

    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }))
    await expect(canvas.queryByRole('button', { name: /^Remove filter/ })).not.toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent(total)
  },
}

/** Typing is debounced into a "Search:" chip; removing the chip clears the box. */
export const SearchChip: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Search claims' })
    await userEvent.type(input, 'Mitchell')
    await waitFor(() => expect(canvas.getByText('Search: Mitchell')).toBeInTheDocument())
    await expect(canvas.getByRole('status')).toHaveTextContent(results(count({ query: 'Mitchell' })))
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter Search: Mitchell' }))
    await waitFor(() => expect(input).toHaveValue(''))
    await expect(canvas.getByRole('status')).toHaveTextContent('1,000 results')
  },
}
