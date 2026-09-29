import * as React from 'react'
import { Download } from 'lucide-react'
import type { RowSelectionState, SortingState } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { BulkBar } from '@/components/review/BulkBar'
import { ClaimsTable, SortStatus, type ClaimsTableHandle } from '@/components/review/ClaimsTable'
import { FilterBar } from '@/components/review/FilterBar'
import { applyFilters, emptyFilters, hasActiveFilters, sortLabel, type ClaimFilters } from '@/components/review/queue-utils'
import { claims as seedClaims } from '@/data/claims'
import type { Claim, ClaimStatus } from '@/data/types'

export type ClaimsQueueState = 'default' | 'loading' | 'empty' | 'error'

const AWAITING_REVIEW: ClaimStatus[] = ['New', 'In review', 'Info requested', 'Reopened']
const RETRY_DELAY_MS = 600

const plural = (n: number, one: string, many: string) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`

/** Every claim awaiting a decision, filterable, sortable (needs attention first) and bulk-actionable. */
export function ClaimsQueue({ state = 'default', onRetry }: { state?: ClaimsQueueState; onRetry?: () => void }) {
  const [data, setData] = React.useState<Claim[]>(seedClaims)
  const [filters, setFilters] = React.useState<ClaimFilters>(emptyFilters)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [announcement, setAnnouncement] = React.useState('')
  const tableRef = React.useRef<ClaimsTableHandle>(null)

  // Retry: show the loading state briefly, then the data.
  const [phase, setPhase] = React.useState<{ for: ClaimsQueueState; step: 'loading' | 'done' } | null>(null)
  const retryTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(retryTimer.current), [])
  const view: ClaimsQueueState = phase && phase.for === state ? (phase.step === 'loading' ? 'loading' : 'default') : state
  const retry = () => {
    onRetry?.()
    setPhase({ for: state, step: 'loading' })
    retryTimer.current = window.setTimeout(() => setPhase({ for: state, step: 'done' }), RETRY_DELAY_MS)
  }

  const loading = view === 'loading'
  const noClaims = view === 'empty'
  const showData = view === 'default'

  const handlers = React.useMemo(
    () => [...new Set(seedClaims.map((c) => c.handler).filter((h): h is string => h !== null))].sort(),
    [],
  )
  const awaitingReview = React.useMemo(() => data.filter((c) => AWAITING_REVIEW.includes(c.status)).length, [data])
  const filtered = React.useMemo(() => applyFilters(data, filters), [data, filters])
  const selected = React.useMemo(() => filtered.filter((c) => rowSelection[c.id]), [filtered, rowSelection])

  const announce = (message: string) => {
    // Alternate a zero-width space so repeating the same message is announced again.
    setAnnouncement((prev) => (prev === message ? `${message}​` : message))
  }

  const finishBulk = (message: string) => {
    setRowSelection({})
    announce(message)
    // The bulk bar unmounts, so hand focus back to the table.
    window.requestAnimationFrame(() => tableRef.current?.focusActiveRow())
  }

  const approve = () => {
    const ids = new Set(selected.map((c) => c.id))
    setData((rows) => rows.map((c) => (ids.has(c.id) ? { ...c, status: 'Approved' as const } : c)))
    finishBulk(`${plural(ids.size, 'claim', 'claims')} approved`)
  }

  const assign = (handler: string) => {
    const ids = new Set(selected.map((c) => c.id))
    setData((rows) => rows.map((c) => (ids.has(c.id) ? { ...c, handler } : c)))
    finishBulk(`${plural(ids.size, 'claim', 'claims')} assigned to ${handler}`)
  }

  const subtitle = loading
    ? 'Loading claims'
    : noClaims
      ? '0 awaiting review'
      : view === 'error'
        ? 'Couldn’t load claims'
        : `${awaitingReview.toLocaleString('en-US')} awaiting review · sorted by ${sortLabel(sorting).toLowerCase()}`

  return (
    <div className="flex flex-col gap-stack p-inset">
      <div className="flex flex-wrap items-center justify-between gap-stack">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-md font-medium tracking-tight text-fg">Claims queue</h1>
          <p className="text-body text-fg-muted">{subtitle}</p>
        </div>
        <Button variant="outline" disabled={!showData}>
          <Download aria-hidden="true" />
          Export
        </Button>
      </div>

      {!noClaims && view !== 'error' && (
        <FilterBar filters={filters} onChange={setFilters} handlers={handlers} resultCount={filtered.length} disabled={loading}>
          <SortStatus sorting={sorting} onReset={() => setSorting([])} />
        </FilterBar>
      )}

      {showData && (
        <BulkBar
          selected={selected}
          handlers={handlers}
          onApprove={approve}
          onAssign={assign}
          onClear={() => finishBulk('Selection cleared')}
        />
      )}

      <ClaimsTable
        ref={tableRef}
        data={filtered}
        state={view}
        emptyReason={hasActiveFilters(filters) ? 'filters' : 'none'}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        resetPageKey={JSON.stringify(filters)}
        onClearFilters={() => setFilters(emptyFilters)}
        onRetry={retry}
      />

      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}
