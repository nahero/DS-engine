import {
  CircleAlert,
  Inbox,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Kpi } from '@/data/types'

const hintIcons: Record<NonNullable<Kpi['hint']>['icon'], LucideIcon> = {
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
  queue: Inbox,
  target: Target,
  percent: Percent,
  overdue: CircleAlert,
}

// Skeleton text uses a non-breaking space so it takes the exact line height of the text it stands in for.
const NBSP = ' '

/** One headline number with a label and a hint row. `<dl>` keeps label, value and hint associated. */
export function KpiCard({ kpi, loading = false, className }: { kpi?: Kpi; loading?: boolean; className?: string }) {
  if (loading || !kpi) {
    return (
      <Card aria-busy="true" className={className}>
        <CardContent>
          <span className="sr-only" role="status">
            Loading
          </span>
          <div aria-hidden="true" className="flex flex-col gap-2">
            <Skeleton className="w-28 text-body">{NBSP}</Skeleton>
            <Skeleton className="w-20 text-heading-lg">{NBSP}</Skeleton>
            <div className="flex min-h-5.5 items-center">
              <Skeleton className="w-36 text-caption">{NBSP}</Skeleton>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const missing = kpi.value === null
  const HintIcon = kpi.hint ? hintIcons[kpi.hint.icon] : null
  const danger = kpi.tone === 'danger'

  return (
    <Card className={className}>
      <CardContent>
        <dl className="flex flex-col gap-2">
          <dt className="text-body font-medium text-fg-muted">{kpi.label}</dt>
          <dd className="text-heading-lg font-medium tracking-tight text-fg tabular-nums">
            {missing ? (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">Not available</span>
              </>
            ) : (
              kpi.value
            )}
          </dd>
          <dd className="flex min-h-5.5 items-center text-caption text-fg-muted">
            {missing ? (
              <span>Missing</span>
            ) : kpi.hint ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  danger && 'rounded-full bg-status-danger-bg px-2 py-0.5 font-semibold text-status-danger-fg',
                )}
              >
                {HintIcon && <HintIcon aria-hidden="true" className={danger ? 'size-3' : 'size-3.5'} />}
                {kpi.hint.text}
              </span>
            ) : null}
          </dd>
        </dl>
      </CardContent>
    </Card>
  )
}
