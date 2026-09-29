import { useId, useMemo, useState, useSyncExternalStore, type ComponentProps } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleAlert, ChartColumn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { weeklyVolume } from '@/data/overview'
import type { LineOfBusiness, WeeklyVolume } from '@/data/types'
import { cn } from '@/lib/utils'

// Series order is fixed: it sets stacking order (first = bottom), legend order and colour (chart-1..4).
const SERIES: readonly LineOfBusiness[] = ['Motor', 'Property', 'Health', 'Travel']

const chartConfig = {
  Motor: { label: 'Motor', color: 'var(--chart-1)' },
  Property: { label: 'Property', color: 'var(--chart-2)' },
  Health: { label: 'Health', color: 'var(--chart-3)' },
  Travel: { label: 'Travel', color: 'var(--chart-4)' },
} satisfies ChartConfig

// Shared by the chart and every state so swapping states never shifts the layout.
const plotHeight = 'h-80 md:h-112'

const numberFormat = new Intl.NumberFormat('en-US')
const fmt = (n: number) => numberFormat.format(n)
const total = (row: WeeklyVolume) => SERIES.reduce((sum, key) => sum + row[key], 0)

/** True under prefers-reduced-motion or the Storybook/app override `data-motion="reduced"`. */
function subscribeReducedMotion(notify: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', notify)
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })
  return () => {
    query.removeEventListener('change', notify)
    observer.disconnect()
  }
}
const getReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced'

function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
}

/** Recharts takes radius as a number, so resolve a radius token to pixels. Bars use half of `radius.control` (≈ the kit's 6px). */
function useTokenPx(cssVar: string, fallback: number) {
  const [px] = useState(() => {
    if (typeof document === 'undefined') return fallback
    const probe = document.createElement('div')
    probe.style.cssText = `position:absolute;visibility:hidden;width:var(${cssVar})`
    document.body.append(probe)
    const width = probe.getBoundingClientRect().width
    probe.remove()
    return width > 0 ? width : fallback
  })
  return px
}

type SegmentShape = (props: ComponentProps<typeof Rectangle> & { payload?: WeeklyVolume }) => React.JSX.Element

/** Only the topmost non-empty segment of each bar gets rounded top corners. */
function segmentShape(key: LineOfBusiness, radius: number): SegmentShape {
  const above = SERIES.slice(SERIES.indexOf(key) + 1)
  return function Segment(props) {
    const row = props.payload
    const isTop = row ? above.every((k) => row[k] === 0) : false
    return <Rectangle {...props} radius={isTop ? [radius, radius, 0, 0] : 0} />
  }
}

function summarise(data: WeeklyVolume[]) {
  const first = data[0]
  const last = data[data.length - 1]
  const largest = SERIES.map((key) => ({ key, sum: data.reduce((s, r) => s + r[key], 0) })).sort((a, b) => b.sum - a.sum)[0]
  if (data.length === 1) {
    return `${first.week} had ${fmt(total(first))} claims; ${largest.key} is the largest line.`
  }
  const from = total(first)
  const to = total(last)
  const verb = to > from ? 'rose from' : to < from ? 'fell from' : 'stayed at'
  const range = to === from ? `${fmt(from)} from ${first.week} to ${last.week}` : `${fmt(from)} in ${first.week} to ${fmt(to)} in ${last.week}`
  return `Weekly claims ${verb} ${range}; ${largest.key} is the largest line.`
}

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((p) => typeof p.value === 'number') as Array<{ dataKey: LineOfBusiness; value: number }>
  const sum = rows.reduce((s, p) => s + p.value, 0)
  return (
    <div className="grid min-w-40 gap-1.5 rounded-surface border border-border bg-popover px-2.5 py-1.5 text-caption text-popover-foreground shadow-overlay">
      <div className="font-medium">{label}</div>
      <ul className="grid gap-1.5">
        {rows.map((p) => (
          <li key={p.dataKey} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-inner" style={{ backgroundColor: chartConfig[p.dataKey].color }} />
            <span className="flex-1 text-muted-foreground">{chartConfig[p.dataKey].label}</span>
            <span className="font-medium text-foreground tabular-nums">{fmt(p.value)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5 font-medium">
        <span>Total</span>
        <span className="tabular-nums">{fmt(sum)}</span>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <ul aria-label="Lines of business" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {SERIES.map((key) => (
        <li key={key} className="flex items-center gap-1 text-caption text-fg-muted">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-inner" style={{ backgroundColor: chartConfig[key].color }} />
          {chartConfig[key].label}
        </li>
      ))}
    </ul>
  )
}

/** Stacked weekly claim counts by line of business. Chart is decorative for assistive tech: a summary and a hidden data table carry the meaning. */
export function ClaimsVolumeChart({
  data = weeklyVolume,
  state = 'default',
  onRetry,
}: {
  data?: WeeklyVolume[]
  state?: 'default' | 'loading' | 'empty' | 'error'
  onRetry?: () => void
}) {
  const titleId = useId()
  const summaryId = useId()
  const reducedMotion = useReducedMotion()
  const radius = useTokenPx('--ds-radius-control', 10) / 2

  const view = state === 'default' && (data.length === 0 || data.every((r) => total(r) === 0)) ? 'empty' : state
  const rows = data.map((row) => ({ ...row, total: total(row) }))

  const shapes = useMemo(() => Object.fromEntries(SERIES.map((key) => [key, segmentShape(key, radius)])) as Record<LineOfBusiness, SegmentShape>, [radius])

  return (
    <Card role="region" aria-labelledby={titleId} aria-busy={view === 'loading' || undefined}>
      <CardHeader className="@container/card-header">
        <CardTitle as="h2" id={titleId} className="col-start-1">
          Claims reported by line of business
        </CardTitle>
        <CardDescription className="col-start-1">Claims per week, W34–W39 2026</CardDescription>
        {(view === 'default' || view === 'loading') && (
          <CardAction className="col-start-1 row-span-1 row-start-3 mt-2 justify-self-start @xl/card-header:col-start-2 @xl/card-header:row-span-2 @xl/card-header:row-start-1 @xl/card-header:mt-0 @xl/card-header:justify-self-end">
            <Legend />
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {view === 'loading' && (
          <div role="status">
            <span className="sr-only">Loading claims volume</span>
            <Skeleton aria-hidden="true" className={cn('w-full', plotHeight)} />
          </div>
        )}

        {view === 'empty' && (
          <div className={cn('flex flex-col items-center justify-center gap-1 text-center', plotHeight)}>
            <ChartColumn aria-hidden="true" className="size-5 text-fg-muted" />
            <p className="text-body font-medium text-fg">No claims reported in this period</p>
            <p className="text-caption text-fg-muted">Choose a longer period, or check back once new claims are registered.</p>
          </div>
        )}

        {view === 'error' && (
          <div role="alert" className={cn('flex flex-col items-center justify-center gap-2 text-center', plotHeight)}>
            <CircleAlert aria-hidden="true" className="size-5 text-status-danger-fg" />
            <p className="text-body font-medium text-fg">Couldn’t load claims volume</p>
            <p className="text-caption text-fg-muted">The chart didn’t load. Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}

        {view === 'default' && (
          <figure aria-labelledby={titleId} aria-describedby={summaryId} className="m-0">
            <div aria-hidden="true">
              <ChartContainer config={chartConfig} className={cn('aspect-auto w-full', plotHeight)}>
                <BarChart data={rows} accessibilityLayer={false} margin={{ top: 20 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width="auto" tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} tickFormatter={fmt} />
                  <Tooltip content={<VolumeTooltip />} />
                  {SERIES.map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="volume"
                      fill={chartConfig[key].color}
                      // Card-coloured stroke reads as a small gap between stacked segments.
                      stroke="var(--card)"
                      strokeWidth={2}
                      maxBarSize={40}
                      shape={shapes[key]}
                      isAnimationActive={!reducedMotion}
                    >
                      {key === SERIES[SERIES.length - 1] && (
                        <LabelList
                          dataKey="total"
                          position="top"
                          offset={8}
                          formatter={(v: unknown) => fmt(Number(v))}
                          className="fill-fg text-caption font-medium tabular-nums"
                        />
                      )}
                    </Bar>
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
            <p id={summaryId} className="sr-only">
              {summarise(data)}
            </p>
            <table className="sr-only">
              <caption>Claims reported per week by line of business</caption>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  {SERIES.map((key) => (
                    <th key={key} scope="col">
                      {key}
                    </th>
                  ))}
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.week}>
                    <th scope="row">{row.week}</th>
                    {SERIES.map((key) => (
                      <td key={key}>{fmt(row[key])}</td>
                    ))}
                    <td>{fmt(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        )}
      </CardContent>
    </Card>
  )
}
