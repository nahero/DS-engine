import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { claims } from '@/data/claims'
import { formatMoney } from '@/lib/format'
import { Badge } from './badge'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table'

const rows = claims.slice(0, 8)

// Missing values show a dash plus hidden text, never blank.
const Missing = () => (
  <>
    <span aria-hidden="true" className="text-fg-muted">
      —
    </span>
    <span className="sr-only">Missing</span>
  </>
)

type Row = (typeof rows)[number]

function ClaimsTable({
  data,
  caption = 'Claims awaiting review, newest first',
  selectedId,
  sortedBy,
  containerClassName,
}: {
  data: Row[]
  caption?: string
  selectedId?: string
  sortedBy?: 'claimed'
  containerClassName?: string
}) {
  return (
    <Table containerClassName={containerClassName}>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Claim</TableHead>
          <TableHead scope="col">Policyholder</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Handler</TableHead>
          <TableHead scope="col" className="text-right" aria-sort={sortedBy === 'claimed' ? 'descending' : undefined}>
            Claimed
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-fg-muted">
              No claims match these filters.
            </TableCell>
          </TableRow>
        ) : (
          data.map((c) => (
            <TableRow key={c.id} data-state={c.id === selectedId ? 'selected' : undefined}>
              <TableCell>
                <a href={`#${c.id}`} className="font-mono text-fg underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
                  {c.id}
                </a>
              </TableCell>
              <TableCell className="max-w-48 truncate" title={c.policyholder}>
                {c.policyholder}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{c.status}</Badge>
              </TableCell>
              <TableCell>{c.handler ?? <Missing />}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(c.claimed)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          'Semantic `<table>`. Header cells use `scope="col"`, numbers are right-aligned with `tabular-nums`, long text truncates with the full value in `title`, missing values show a dash plus hidden "Missing" text. The container scrolls horizontally; it holds focusable links so keyboard users can reach the overflow.',
      },
    },
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ClaimsTable data={rows} />,
}

export const Sorted: Story = {
  render: () => <ClaimsTable data={[...rows].sort((a, b) => b.claimed - a.claimed)} sortedBy="claimed" caption="Claims by claimed amount, highest first" />,
}

export const SelectedRow: Story = {
  render: () => <ClaimsTable data={rows} selectedId={rows[2].id} />,
}

export const Focus: Story = {
  render: () => <ClaimsTable data={rows} />,
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: rows[0].id })).toHaveFocus()
  },
}

export const Empty: Story = {
  render: () => <ClaimsTable data={[]} caption="Claims matching your filters" />,
}

export const MissingValues: Story = {
  render: () => <ClaimsTable data={rows.map((c, i) => (i % 2 === 0 ? { ...c, handler: null } : c))} caption="Claims, some unassigned" />,
}

export const LongName: Story = {
  render: () => (
    <ClaimsTable
      data={[
        { ...rows[0], policyholder: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC' },
        ...rows.slice(1, 4),
      ]}
    />
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableCaption>Claimed amounts for the first 8 claims</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Claim</TableHead>
          <TableHead scope="col" className="text-right">
            Claimed
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-mono">{c.id}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(c.claimed)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row">Total</TableHead>
          <TableCell className="text-right tabular-nums">{formatMoney(rows.reduce((sum, c) => sum + c.claimed, 0))}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}

// Many rows: the container scrolls vertically and is itself focusable so keyboard users can scroll it.
export const ManyRows: Story = {
  render: () => (
    <div role="region" aria-label="All claims" tabIndex={0} className="max-h-96 overflow-y-auto focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
      <ClaimsTable data={claims.slice(0, 200)} caption={`200 of ${claims.length.toLocaleString('en-US')} claims`} />
    </div>
  ),
}
