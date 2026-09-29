import * as React from 'react'
import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, CircleAlert, Inbox, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { compareNeedsAttention, formatDate, formatMoney } from '@/data/claims'
import type { Claim } from '@/data/types'
import { ConfidenceIndicator } from './ConfidenceIndicator'
import { FlagLabel } from './FlagLabel'
import { SlaIndicator } from './SlaIndicator'
import { sortLabel } from './queue-utils'
import { StatusBadge } from './StatusBadge'

const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

type ClaimColumn = ColumnDef<typeof features, Claim>

const PAGE_SIZES = [25, 50, 100]
const SKELETON_ROWS = 10

const columns: ClaimColumn[] = [
  {
    id: 'select',
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all claims on this page"
        checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.id}`}
        // Keyboard users select with x / Space on the row, so 25 checkboxes don't become 25 tab stops.
        tabIndex={-1}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value === true)}
      />
    ),
  },
  {
    id: 'id',
    header: 'Claim #',
    accessorFn: (c) => c.id,
    sortFn: sortFn_alphanumeric,
    sortDescFirst: false,
    cell: ({ row }) => (
      <a
        href={`#claim-${row.original.id}`}
        tabIndex={-1}
        className="rounded-inner font-mono text-caption whitespace-nowrap text-fg underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
      >
        {row.original.id}
      </a>
    ),
  },
  {
    id: 'policyholder',
    header: 'Policyholder',
    enableSorting: false,
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block max-w-36 truncate">{row.original.policyholder}</span>
        </TooltipTrigger>
        <TooltipContent>{row.original.policyholder}</TooltipContent>
      </Tooltip>
    ),
  },
  { id: 'lob', header: 'LOB', enableSorting: false, cell: ({ row }) => row.original.lob },
  {
    id: 'lossDate',
    header: 'Loss date',
    accessorFn: (c) => c.lossDate,
    sortFn: sortFn_basic,
    sortDescFirst: false,
    cell: ({ row }) => <span className="tabular-nums">{formatDate(row.original.lossDate)}</span>,
  },
  {
    id: 'sla',
    header: 'SLA',
    // Not applicable (closed claims) always sorts last, in either direction.
    accessorFn: (c) => c.slaDays ?? undefined,
    sortFn: sortFn_basic,
    sortUndefined: 'last',
    sortDescFirst: false,
    cell: ({ row }) => <SlaIndicator days={row.original.slaDays} />,
  },
  { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    id: 'confidence',
    header: 'Confidence',
    // No score always sorts last, in either direction.
    accessorFn: (c) => c.confidence ?? undefined,
    sortFn: sortFn_basic,
    sortUndefined: 'last',
    sortDescFirst: false,
    cell: ({ row }) => <ConfidenceIndicator score={row.original.confidence} />,
  },
  {
    id: 'flag',
    header: 'Flag',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.flag ? (
        <FlagLabel flag={row.original.flag} className="max-w-32" />
      ) : (
        <span className="text-caption text-fg-subtle">
          <span aria-hidden="true">—</span>
          <span className="sr-only">No flag</span>
        </span>
      ),
  },
  {
    id: 'claimed',
    header: 'Claimed',
    accessorFn: (c) => c.claimed,
    sortFn: sortFn_basic,
    sortDescFirst: false,
    meta: { align: 'right' },
    cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.claimed)}</span>,
  },
  {
    id: 'handler',
    header: 'Handler',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.handler ?? (
        <span className="text-fg-muted">
          Unassigned
        </span>
      ),
  },
]

const SKELETON_WIDTHS: Record<string, string> = {
  select: 'w-4',
  id: 'w-28',
  policyholder: 'w-28',
  lob: 'w-12',
  lossDate: 'w-20',
  sla: 'w-16',
  status: 'w-16',
  confidence: 'w-20',
  flag: 'w-32',
  claimed: 'w-16',
  handler: 'w-20',
}

function alignOf(column: { columnDef: { meta?: unknown } }): 'right' | undefined {
  return (column.columnDef.meta as { align?: 'right' } | undefined)?.align
}

/** Page numbers with ellipses: first, last, and the neighbours of the current page. */
function pageItems(current: number, count: number): (number | 'start' | 'end')[] {
  const last = count - 1
  if (count <= 7) return Array.from({ length: count }, (_, i) => i)
  if (current <= 2) return [0, 1, 2, 3, 'end', last]
  if (current >= last - 2) return [0, 'start', last - 3, last - 2, last - 1, last]
  return [0, 'start', current - 1, current, current + 1, 'end', last]
}

/** "Sort: Needs attention" (the default), or the active column and direction, with a reset. */
export function SortStatus({ sorting, onReset }: { sorting: SortingState; onReset: () => void }) {
  const active = sorting[0]
  return (
    <p className="flex items-center gap-2 text-body text-fg-muted">
      <ArrowUpDown aria-hidden="true" className="size-4 shrink-0" />
      <span>
        Sort:{' '}
        <span className="font-medium text-fg">{sortLabel(sorting)}</span>
      </span>
      {active && (
        <Button variant="link" size="sm" onClick={onReset}>
          Reset to Needs attention
        </Button>
      )}
    </p>
  )
}

export interface ClaimsTableHandle {
  /** Moves focus to the active row (e.g. after the bulk bar closes). */
  focusActiveRow: () => void
}

export interface ClaimsTableProps {
  /** Already filtered claims. */
  data: Claim[]
  state?: 'default' | 'loading' | 'empty' | 'error'
  /** Why there is nothing to show: no claims at all, or the filters match none. */
  emptyReason?: 'none' | 'filters'
  sorting: SortingState
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>
  rowSelection: RowSelectionState
  onRowSelectionChange: React.Dispatch<React.SetStateAction<RowSelectionState>>
  /** Changing this value returns to page 1 (the queue passes the active filters). */
  resetPageKey?: string
  onClearFilters?: () => void
  onRetry?: () => void
  ref?: React.Ref<ClaimsTableHandle>
}

/**
 * Dense claims table: client-side sort, selection and pagination (TanStack Table), sticky header,
 * roving-focus rows (↑/↓ or j/k move, Enter opens, x/Space selects, Shift+↑/↓ extends).
 */
export function ClaimsTable({
  data,
  state = 'default',
  emptyReason = 'none',
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  resetPageKey,
  onClearFilters,
  onRetry,
  ref,
}: ClaimsTableProps) {
  // Needs attention is the default order; a column sort re-orders on top of it (ties keep this order).
  const sorted = React.useMemo(() => [...data].sort(compareNeedsAttention), [data])

  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZES[0] })
  const [activeIndex, setActiveIndex] = React.useState(0)

  // Filters changed: back to the first page.
  const [prevResetKey, setPrevResetKey] = React.useState(resetPageKey)
  if (prevResetKey !== resetPageKey) {
    setPrevResetKey(resetPageKey)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    setActiveIndex(0)
  }

  // Rows left the list (approved out of a filter): stay on a page that exists.
  const total = sorted.length
  const lastPage = Math.max(0, Math.ceil(total / pagination.pageSize) - 1)
  const pageIndex = Math.min(pagination.pageIndex, lastPage)
  const pageSize = pagination.pageSize

  const table = useTable({
    features,
    columns,
    data: sorted,
    getRowId: (claim) => claim.id,
    autoResetPageIndex: false,
    enableMultiSort: false,
    state: { sorting, rowSelection, pagination: { pageIndex, pageSize } },
    onSortingChange,
    onRowSelectionChange,
    onPaginationChange: setPagination,
  })

  const pageCount = table.getPageCount()
  const rows = table.getRowModel().rows

  // Roving focus.
  const active = Math.min(activeIndex, Math.max(rows.length - 1, 0))
  const rowRefs = React.useRef<(HTMLTableRowElement | null)[]>([])
  const anchor = React.useRef<{ index: number; base: RowSelectionState } | null>(null)

  React.useImperativeHandle(ref, () => ({ focusActiveRow: () => rowRefs.current[active]?.focus() }), [active])

  const goToPage = (index: number) => {
    table.setPageIndex(index)
    setActiveIndex(0)
    anchor.current = null
  }

  const onBodyKeyDown = (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const target = e.target as HTMLElement
    // Shortcuts never fire while typing.
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return
    const rowEl = target.closest<HTMLTableRowElement>('tr[data-row-index]')
    if (!rowEl) return
    const index = Number(rowEl.dataset.rowIndex)
    const row = rows[index]
    const onRow = target === rowEl
    const last = rows.length - 1

    let next: number | null = null
    if (e.key === 'ArrowDown' || (e.key === 'j' && !e.shiftKey)) next = Math.min(index + 1, last)
    else if (e.key === 'ArrowUp' || (e.key === 'k' && !e.shiftKey)) next = Math.max(index - 1, 0)

    if (next !== null) {
      e.preventDefault()
      if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        if (!anchor.current) anchor.current = { index, base: { ...rowSelection } }
        const { index: from, base } = anchor.current
        const extended: RowSelectionState = { ...base }
        for (let i = Math.min(from, next); i <= Math.max(from, next); i++) extended[rows[i].id] = true
        onRowSelectionChange(extended)
      } else {
        anchor.current = null
      }
      setActiveIndex(next)
      rowRefs.current[next]?.focus()
    } else if (e.key === 'x' || (e.key === ' ' && onRow)) {
      // Space on the row's own checkbox is handled natively.
      e.preventDefault()
      row.toggleSelected()
    } else if (e.key === 'Enter' && onRow) {
      e.preventDefault()
      window.location.assign(`#claim-${row.original.id}`)
    }
  }

  if (state === 'error') {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 rounded-surface border bg-surface px-inset py-12 text-center">
        <CircleAlert aria-hidden="true" className="size-5 text-status-danger-fg" />
        <p className="text-body font-medium text-fg">Couldn’t load claims</p>
        <p className="text-caption text-fg-muted">The claims queue didn’t load. Check your connection and try again.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  if (state === 'empty' || (state === 'default' && total === 0)) {
    const filtered = state === 'default' && emptyReason === 'filters'
    return (
      <div className="flex flex-col items-center gap-2 rounded-surface border bg-surface px-inset py-12 text-center">
        {filtered ? (
          <SearchX aria-hidden="true" className="size-5 text-fg-muted" />
        ) : (
          <Inbox aria-hidden="true" className="size-5 text-fg-muted" />
        )}
        <p className="text-body font-medium text-fg">{filtered ? 'No claims match these filters' : 'No claims yet'}</p>
        <p className="text-caption text-fg-muted">
          {filtered
            ? 'Try removing a filter or searching for something else.'
            : 'New claims appear here as soon as they are submitted.'}
        </p>
        {filtered && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    )
  }

  const loading = state === 'loading'
  const rangeStart = pageIndex * pageSize + 1
  const rangeEnd = Math.min(total, rangeStart + pageSize - 1)

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-stack">
        <div
          role="region"
          aria-label="Claims table"
          tabIndex={0}
          aria-busy={loading || undefined}
          className="max-h-svh scroll-pt-control overflow-auto rounded-surface border bg-surface outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          {loading && <p role="status" className="sr-only">Loading claims</p>}
          <Table containerClassName="overflow-visible" className="border-separate border-spacing-0" aria-hidden={loading || undefined}>
            <TableCaption className="sr-only">
              Claims, page {pageIndex + 1} of {pageCount}
            </TableCaption>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="border-0 hover:bg-transparent">
                  {group.headers.map((header) => {
                    const column = header.column
                    const align = alignOf(column)
                    const sortable = !loading && column.getCanSort()
                    const dir = column.getIsSorted()
                    const SortIcon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown
                    return (
                      <TableHead
                        key={header.id}
                        scope="col"
                        aria-sort={sortable ? (dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none') : undefined}
                        className={cn('sticky top-0 z-10 border-b border-border bg-subtle', align === 'right' && 'text-right')}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={column.getToggleSortingHandler()}
                            className={cn(
                              '-mx-1.5 inline-flex h-7 items-center gap-1 rounded-inner px-1.5 font-medium outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring',
                              align === 'right' && 'flex-row-reverse',
                            )}
                          >
                            <table.FlexRender header={header} />
                            <SortIcon aria-hidden="true" className={cn('size-3.5 shrink-0', !dir && 'text-fg-muted')} />
                          </button>
                        ) : loading && column.id === 'select' ? null : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            {loading ? (
              <TableBody className="[&_tr:last-child>td]:border-b-0">
                {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <TableRow key={i} className="h-row border-0 hover:bg-transparent">
                    {columns.map((col) => (
                      <TableCell key={col.id} className="border-b border-border py-0">
                        <Skeleton className={cn('h-4', SKELETON_WIDTHS[col.id ?? ''], col.id === 'claimed' && 'ml-auto')} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody onKeyDown={onBodyKeyDown} onFocus={(e) => {
                const idx = (e.target as HTMLElement).closest<HTMLElement>('tr[data-row-index]')?.dataset.rowIndex
                if (idx !== undefined) setActiveIndex(Number(idx))
              }} className="[&_tr:last-child>td]:border-b-0">
                {rows.map((row, i) => (
                  <TableRow
                    key={row.id}
                    ref={(el) => {
                      rowRefs.current[i] = el
                    }}
                    data-row-index={i}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    tabIndex={i === active ? 0 : -1}
                    className="h-row border-0 outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3"
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn('border-b border-border py-0', alignOf(cell.column) === 'right' && 'text-right')}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>

        {!loading && (
          <div className="flex flex-wrap items-center gap-x-stack gap-y-2">
            <p className="text-body text-fg-muted tabular-nums">
              Showing {rangeStart.toLocaleString('en-US')}–{rangeEnd.toLocaleString('en-US')} of {total.toLocaleString('en-US')}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-x-stack gap-y-2">
              <div className="flex items-center gap-2">
                <span id="claims-rows-per-page" className="text-body text-fg-muted">
                  Rows per page
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    table.setPageSize(Number(v))
                    goToPage(0)
                  }}
                >
                  <SelectTrigger aria-labelledby="claims-rows-per-page" className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end">
                    {PAGE_SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination aria-label="Claims pagination" className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <Button variant="ghost" aria-label="Previous page" disabled={pageIndex === 0} onClick={() => goToPage(pageIndex - 1)}>
                      <ChevronLeft aria-hidden="true" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                  </PaginationItem>
                  {pageItems(pageIndex, pageCount).map((item) =>
                    typeof item === 'number' ? (
                      <PaginationItem key={item}>
                        <Button
                          variant={item === pageIndex ? 'outline' : 'ghost'}
                          size="icon"
                          aria-label={`Page ${item + 1}`}
                          aria-current={item === pageIndex ? 'page' : undefined}
                          onClick={() => goToPage(item)}
                          className="tabular-nums"
                        >
                          {item + 1}
                        </Button>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <Button variant="ghost" aria-label="Next page" disabled={pageIndex >= pageCount - 1} onClick={() => goToPage(pageIndex + 1)}>
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
