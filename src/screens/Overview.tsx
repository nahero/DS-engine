import { useId, useState } from 'react'
import { Clock, Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/app/PageHeader'
import { UnavailableButton } from '@/components/app/UnavailableButton'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityFeed } from '@/components/review/ActivityFeed'
import { ClaimsVolumeChart } from '@/components/review/ClaimsVolumeChart'
import { KpiCard } from '@/components/review/KpiCard'
import { NeedsAttentionList } from '@/components/review/NeedsAttentionList'
import type { ViewState } from '@/components/review/shared'
import { kpis, needsAttention, recentActivity, weeklyVolume, weeklyVolumeYear } from '@/data/overview'
import type { Kpi } from '@/data/types'

export type OverviewState = ViewState | 'stale'

// Each period shows the last N weeks of the weekly series. KPIs are static in this demo.
const PERIODS = [
  { label: 'Last 7 days', weeks: 1 },
  { label: 'Last 30 days', weeks: 4 },
  { label: 'Quarter to date', weeks: weeklyVolume.length },
]
const DEFAULT_PERIOD = 'Last 30 days'

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
  const childState: ViewState = loading ? 'loading' : empty ? 'empty' : error ? 'error' : 'default'
  const kpiHeadingId = useId()

  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const weeks = PERIODS.find((p) => p.label === period)?.weeks ?? weeklyVolume.length
  const shownWeeks = weeklyVolume.slice(-weeks)
  const latestWeek = weeklyVolume[weeklyVolume.length - 1]?.week.replace(/\D/g, '')

  return (
    <div className="flex flex-col gap-stack p-inset">
      {loading && (
        <div role="status" className="sr-only">
          Loading overview
        </div>
      )}

      <PageHeader
        title="Overview"
        subtitle={latestWeek ? `Claims operations · Week ${Number(latestWeek)}, ${weeklyVolumeYear}` : 'Claims operations'}
        actions={
          <>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger aria-label="Period" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {PERIODS.map((p) => (
                  <SelectItem key={p.label} value={p.label}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <UnavailableButton variant="outline">
              <Download aria-hidden="true" />
              Export
            </UnavailableButton>
          </>
        }
      />

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

      <section aria-labelledby={kpiHeadingId}>
        <h2 id={kpiHeadingId} className="sr-only">
          Key figures
        </h2>
        <div className="grid grid-cols-2 gap-stack md:grid-cols-3 xl:grid-cols-5">
          {loading
            ? kpis.map((k) => <KpiCard key={k.id} loading announce={false} />)
            : (empty ? emptyKpis : kpis).map((k) => <KpiCard key={k.id} kpi={k} />)}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-stack lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ClaimsVolumeChart data={empty ? [] : shownWeeks} year={weeklyVolumeYear} state={childState} announce={false} onRetry={onRetry} />
        </div>
        <div className="min-w-0">
          <NeedsAttentionList items={empty ? [] : needsAttention} state={childState} announce={false} onRetry={onRetry} />
        </div>
      </div>

      <ActivityFeed events={empty ? [] : recentActivity} state={childState} announce={false} onRetry={onRetry} />
    </div>
  )
}
