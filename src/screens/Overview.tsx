import { Clock, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityFeed } from '@/components/review/ActivityFeed'
import { ClaimsVolumeChart } from '@/components/review/ClaimsVolumeChart'
import { KpiCard } from '@/components/review/KpiCard'
import { NeedsAttentionList } from '@/components/review/NeedsAttentionList'
import { kpis, needsAttention, recentActivity, weeklyVolume } from '@/data/overview'
import type { Kpi } from '@/data/types'

export type OverviewState = 'default' | 'loading' | 'empty' | 'error' | 'stale'

const PERIODS = ['Last 7 days', 'Last 30 days', 'Quarter to date']

// Empty period: counts are zero, rates and durations have nothing to average and show as missing.
const emptyKpis: Kpi[] = kpis.map((k) => ({
  id: k.id,
  label: k.label,
  value: k.id === 'time' || k.id === 'auto' ? null : '0',
}))

/** Claims operations landing page: headline KPIs, weekly volume, what needs attention, recent activity. */
export function Overview({
  state = 'default',
  onRetry,
  onRefresh,
}: {
  state?: OverviewState
  onRetry?: () => void
  onRefresh?: () => void
}) {
  const loading = state === 'loading'
  const empty = state === 'empty'
  const error = state === 'error'
  const childState = loading ? 'loading' : empty ? 'empty' : error ? 'error' : 'default'

  return (
    <div className="flex flex-col gap-stack p-inset">
      <div className="flex flex-wrap items-center justify-between gap-stack">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-md font-medium tracking-tight text-fg">Overview</h1>
          <p className="text-body text-fg-muted">Claims operations · Week 39, 2026</p>
        </div>
        <div className="flex items-center gap-stack">
          <Select defaultValue="Last 30 days">
            <SelectTrigger aria-label="Period" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      {state === 'stale' && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-control border border-status-neutral-border bg-status-neutral-bg px-3 py-2 text-body text-status-neutral-fg"
        >
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          <span className="font-medium">Updated 3 h ago</span>
          <span>Figures may be out of date.</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={onRefresh}>
            <RefreshCw aria-hidden="true" />
            Refresh
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-stack md:grid-cols-3 xl:grid-cols-5">
        {loading
          ? kpis.map((k) => <KpiCard key={k.id} loading />)
          : (empty ? emptyKpis : kpis).map((k) => <KpiCard key={k.id} kpi={k} />)}
      </div>

      <div className="grid grid-cols-1 gap-stack lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ClaimsVolumeChart data={empty ? [] : weeklyVolume} state={childState} onRetry={onRetry} />
        </div>
        <div className="min-w-0">
          <NeedsAttentionList items={empty ? [] : needsAttention} state={childState} onRetry={onRetry} />
        </div>
      </div>

      <ActivityFeed events={empty ? [] : recentActivity} state={childState} onRetry={onRetry} />
    </div>
  )
}
