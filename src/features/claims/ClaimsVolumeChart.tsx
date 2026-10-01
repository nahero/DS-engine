import { useId, useMemo, useState, useSyncExternalStore, type ComponentProps } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartColumn, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { weeklyVolume, weeklyVolumeYear } from '@/data/overview'
import type { LineOfBusiness, WeeklyVolume } from '@/data/types'
import { cn } from '@/lib/utils'
import { StateBlock } from '@/components/patterns/StateBlock'
import type { ViewState } from '@/lib/view-state'

// Series order is fixed: it sets stacking order (first = bottom), legend order and colour (chart-1..4).
const SERIES: readonly LineOfBusiness[] = ['Motor', 'Property', 'Health', 'Travel']

const chartConfig = {
  Motor: { label: 'Motor', color: 'var(--chart-1)' },
  Property: { label: 'Property', color: 'var(--chart-2)' },
  Health: { label: 'Health', color: 'var(--chart-3)' },
  Travel: { label: 'Travel', color: 'var(--chart-4)' },
} satisfies ChartConfig

// Recharts SVG geometry props (px, no CSS token equivalent). Everything else here is token-backed.
const CHART_GEOMETRY = {
  maxBarSize: 40,
  strokeWidth: 2,
  labelOffset: 8,
  tickMargin: 8,
  margin: { top: 20 },
  // Bar corner radius is this share of `radius.control`; the fallback (px) applies when the token can't be resolved.
  radiusShare: 0.5,
  radiusFallback: 10,
} as const

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

/** "Claims per week, W36–W39 2026", derived from the weeks shown. */
function describeWeeks(data: WeeklyVolume[], year?: number) {
  if (data.length === 0) return 'Claims per week'
  const first = data[0].week
  const last = data[data.length - 1].week
  const range = first === last ? first : `${first}–${last}`
  return `Claims per week, ${range}${year ? ` ${year}` : ''}`
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

/** Stacked weekly claim counts by line of business. The chart is decorative for assistive tech: a summary and the data table carry the meaning. The table is visible on request. */
export function ClaimsVolumeChart({
  data = weeklyVolume,
  year = weeklyVolumeYear,
  state = 'default',
  announce = true,
  onRetry,
}: {
  data?: WeeklyVolume[]
  /** Calendar year of the weeks, shown in the description. */
  year?: number
  state?: ViewState
  /** Loading announces itself as a live region. A screen that announces loading once sets this to false. */
  announce?: boolean
  onRetry?: () => void
}) {
  const titleId = useId()
  const summaryId = useId()
  const tableId = useId()
  const [showTable, setShowTable] = useState(false)
  const reducedMotion = useReducedMotion()
  const radius = useTokenPx('--ds-radius-control', CHART_GEOMETRY.radiusFallback) * CHART_GEOMETRY.radiusShare

  const view = state === 'default' && (data.length === 0 || data.every((r) => total(r) === 0)) ? 'empty' : state
  const rows = data.map((row) => ({ ...row, total: total(row) }))

  const shapes = useMemo(() => Object.fromEntries(SERIES.map((key) => [key, segmentShape(key, radius)])) as Record<LineOfBusiness, SegmentShape>, [radius])

  return (
    <Card role="region" aria-labelledby={titleId} aria-busy={view === 'loading' || undefined}>
      <CardHeader className="@container/card-header">
        <CardTitle as="h2" id={titleId} className="col-start-1">
          Claims reported by line of business
        </CardTitle>
        <CardDescription className="col-start-1">{describeWeeks(data, year)}</CardDescription>
        {(view === 'default' || view === 'loading') && (
          <CardAction className="col-start-1 row-span-1 row-start-3 mt-2 justify-self-start @xl/card-header:col-start-2 @xl/card-header:row-span-2 @xl/card-header:row-start-1 @xl/card-header:mt-0 @xl/card-header:justify-self-end">
            <Legend />
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {view === 'loading' && (
          <div role={announce ? 'status' : undefined}>
            {announce && <span className="sr-only">Loading claims volume</span>}
            <Skeleton aria-hidden="true" className={cn('w-full', plotHeight)} />
          </div>
        )}

        {view === 'empty' && (
          <StateBlock
            kind="empty"
            size="sm"
            icon={ChartColumn}
            title="No claims reported in this period"
            description="Choose a longer period, or check back once new claims are registered."
            className={plotHeight}
          />
        )}

        {view === 'error' && (
          <StateBlock
            kind="error"
            size="sm"
            title="Couldn’t load claims volume"
            description="The chart didn’t load. Check your connection and try again."
            className={plotHeight}
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        )}

        {view === 'default' && (
          <figure aria-labelledby={titleId} aria-describedby={summaryId} className="m-0 flex flex-col gap-2">
            <div aria-hidden="true">
              <ChartContainer config={chartConfig} className={cn('aspect-auto w-full', plotHeight)}>
                <BarChart data={rows} accessibilityLayer={false} margin={CHART_GEOMETRY.margin}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={CHART_GEOMETRY.tickMargin} />
                  <YAxis width="auto" tickLine={false} axisLine={false} tickMargin={CHART_GEOMETRY.tickMargin} allowDecimals={false} tickFormatter={fmt} />
                  <Tooltip content={<VolumeTooltip />} />
                  {SERIES.map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="volume"
                      fill={chartConfig[key].color}
                      // Card-coloured stroke reads as a small gap between stacked segments.
                      stroke="var(--card)"
                      strokeWidth={CHART_GEOMETRY.strokeWidth}
                      maxBarSize={CHART_GEOMETRY.maxBarSize}
                      shape={shapes[key]}
                      isAnimationActive={!reducedMotion}
                    >
                      {key === SERIES[SERIES.length - 1] && (
                        <LabelList
                          dataKey="total"
                          position="top"
                          offset={CHART_GEOMETRY.labelOffset}
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
            <div>
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={showTable}
                aria-controls={tableId}
                onClick={() => setShowTable((v) => !v)}
              >
                <Table2 aria-hidden="true" />
                {showTable ? 'Hide data table' : 'Show data table'}
              </Button>
            </div>
            {/* Always in the DOM for assistive tech; visible when toggled. */}
            <div
              id={tableId}
              // Visible: a keyboard-scrollable region, for narrow screens.
              {...(showTable ? { role: 'region', 'aria-label': 'Claims volume data table', tabIndex: 0 } : {})}
              className={cn(showTable ? 'overflow-x-auto rounded-inner outline-none focus-visible:ring-3 focus-visible:ring-ring' : 'sr-only')}
            >
              <Table containerClassName="overflow-visible" className="border-separate border-spacing-0">
                <TableCaption className="mt-0 pb-2 text-left text-caption caption-top">Claims reported per week by line of business</TableCaption>
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead scope="col" className="border-b border-border bg-subtle">
                      Week
                    </TableHead>
                    {SERIES.map((key) => (
                      <TableHead key={key} scope="col" className="border-b border-border bg-subtle text-right">
                        {key}
                      </TableHead>
                    ))}
                    <TableHead scope="col" className="border-b border-border bg-subtle text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child>*]:border-b-0">
                  {rows.map((row) => (
                    <TableRow key={row.week} className="border-0">
                      <TableHead scope="row" className="h-row border-b border-border font-normal">
                        {row.week}
                      </TableHead>
                      {SERIES.map((key) => (
                        <TableCell key={key} className="border-b border-border text-right tabular-nums">
                          {fmt(row[key])}
                        </TableCell>
                      ))}
                      <TableCell className="border-b border-border text-right font-medium tabular-nums">{fmt(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </figure>
        )}
      </CardContent>
    </Card>
  )
}
