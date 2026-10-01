import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  CONFIDENCE_BANDS,
  LINES_OF_BUSINESS,
  STATUSES,
  UNASSIGNED,
  activeChips,
  emptyFilters,
  type ClaimFilters,
} from './queue-utils'

const ALL = 'all'
const SEARCH_DEBOUNCE_MS = 150

function FilterSelect<T extends string>({
  name,
  allLabel,
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  name: string
  allLabel: string
  value: T | null
  options: readonly T[]
  onChange: (value: T | null) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) => onChange(v === ALL ? null : (v as T))}
      disabled={disabled}
    >
      <SelectTrigger aria-label={value ? `${name}: ${value}` : name} className={cn('min-w-32 flex-1 sm:w-35 sm:flex-none', className)}>
        <SelectValue placeholder={name} />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Search, four filters, removable chips for what is active, and a live result count.
 * `children` render at the end of the chip row (the queue puts the sort indicator there).
 */
export function FilterBar({
  filters,
  onChange,
  handlers,
  resultCount,
  disabled = false,
  children,
}: {
  filters: ClaimFilters
  onChange: (next: ClaimFilters) => void
  handlers: string[]
  resultCount: number
  disabled?: boolean
  children?: React.ReactNode
}) {
  const searchId = React.useId()
  const [text, setText] = React.useState(filters.query)
  const lastEmitted = React.useRef(filters.query)
  const filtersRef = React.useRef(filters)
  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    filtersRef.current = filters
    onChangeRef.current = onChange
  })

  // Debounce typing into the filter state.
  React.useEffect(() => {
    if (text === lastEmitted.current) return
    const t = window.setTimeout(() => {
      lastEmitted.current = text
      onChangeRef.current({ ...filtersRef.current, query: text })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [text])

  // Follow external changes (chip removed, Clear all).
  React.useEffect(() => {
    if (filters.query !== lastEmitted.current) {
      lastEmitted.current = filters.query
      setText(filters.query)
    }
  }, [filters.query])

  const chips = activeChips(filters)
  const set = (patch: Partial<ClaimFilters>) => onChange({ ...filters, ...patch })
  const clearAll = () => onChange(emptyFilters)
  const countText = `${resultCount.toLocaleString('en-US')} ${resultCount === 1 ? 'result' : 'results'}`

  return (
    <search aria-label="Filter claims" className="flex flex-col gap-stack">
      <div className="flex flex-wrap items-center gap-cell">
        <div className="relative w-full sm:w-75">
          <label htmlFor={searchId} className="sr-only">
            Search claims
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            id={searchId}
            type="text"
            autoComplete="off"
            placeholder="Search claim #, policyholder"
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            className="pl-8"
          />
        </div>
        <FilterSelect name="Status" allLabel="All statuses" value={filters.status} options={STATUSES} onChange={(status) => set({ status })} disabled={disabled} />
        <FilterSelect
          name="Line of business"
          allLabel="All lines"
          value={filters.lob}
          options={LINES_OF_BUSINESS}
          onChange={(lob) => set({ lob })}
          disabled={disabled}
          className="sm:w-42.5"
        />
        <FilterSelect
          name="Confidence"
          allLabel="Any confidence"
          value={filters.confidence}
          options={CONFIDENCE_BANDS}
          onChange={(confidence) => set({ confidence })}
          disabled={disabled}
        />
        <FilterSelect
          name="Handler"
          allLabel="All handlers"
          value={filters.handler}
          options={[UNASSIGNED, ...handlers]}
          onChange={(handler) => set({ handler })}
          disabled={disabled}
        />
        <p role="status" className="ml-auto text-body whitespace-nowrap text-fg-muted tabular-nums">
          {disabled ? '' : countText}
        </p>
      </div>

      {(chips.length > 0 || children) && (
        <div className="flex flex-wrap items-center gap-cell">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="outline" className="h-6 gap-1 py-0 pr-0 pl-2 font-semibold">
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter ${chip.label}`}
                onClick={() => set({ [chip.key]: chip.key === 'query' ? '' : null })}
                className="inline-flex size-6 items-center justify-center rounded-full outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          ))}
          {chips.length > 0 && (
            <Button variant="link" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          )}
          {children && <div className="ml-auto">{children}</div>}
        </div>
      )}
    </search>
  )
}
