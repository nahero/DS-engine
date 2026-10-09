import * as React from 'react'
import { PageHeader } from '@/components/patterns/PageHeader'
import { StatFilter } from '@/components/patterns/StatFilter'
import { StateBlock } from '@/components/patterns/StateBlock'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ASSIGNED_TODAY, assignedClaims } from '@/data/assigned'
import type { AssignedClaim, AssignedFollowUp } from '@/data/types'
import { FollowUpList } from '@/features/claims/FollowUpList'
import { UpdatesPanel } from '@/features/claims/UpdatesPanel'
import { Worklist } from '@/features/claims/Worklist'
import { formatMoney } from '@/lib/format'
import { NBSP, type ViewState } from '@/lib/view-state'
import { addDays, summarise, worklistGroup } from '@/lib/worklist'

export type MyAssignedState = ViewState

type TodayFilter = 'overdue' | 'due-today' | 'ready' | 'waiting'

const FILTERS: { id: TodayFilter; label: string; tone: 'default' | 'danger' | 'warning' }[] = [
  { id: 'overdue', label: 'Overdue', tone: 'danger' },
  { id: 'due-today', label: 'Due today', tone: 'warning' },
  { id: 'ready', label: 'Ready for you', tone: 'default' },
  { id: 'waiting', label: 'Waiting on others', tone: 'default' },
]

const RETRY_DELAY_MS = 600

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Overdue and Due today cut across the groups by deadline; Ready and Waiting are the groups. */
function matches(filter: TodayFilter, claim: AssignedClaim, today: string): boolean {
  switch (filter) {
    case 'overdue':
      return claim.slaDays !== null && claim.slaDays < 0
    case 'due-today':
      return claim.slaDays === 0
    case 'ready':
      return worklistGroup(claim, today) === 'ready'
    case 'waiting':
      return worklistGroup(claim, today) === 'waiting'
  }
}

/** The handler's personal workbench: what to do next, what came back, what they are waiting on. */
export function MyAssigned({ state = 'default', onRetry }: { state?: MyAssignedState; onRetry?: () => void }) {
  const today = ASSIGNED_TODAY

  // Follow-ups the handler marked done (null) or snoozed; everything else comes from the data.
  const [followUps, setFollowUps] = React.useState<Record<string, AssignedFollowUp | null>>({})
  const [filter, setFilter] = React.useState<TodayFilter | null>(null)
  const [announcement, setAnnouncement] = React.useState('')

  // Retry: show the loading state briefly, then the data.
  const [phase, setPhase] = React.useState<{ for: MyAssignedState; step: 'loading' | 'done' } | null>(null)
  const retryTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(retryTimer.current), [])
  const view: MyAssignedState = phase && phase.for === state ? (phase.step === 'loading' ? 'loading' : 'default') : state
  const retry = () => {
    onRetry?.()
    setPhase({ for: state, step: 'loading' })
    retryTimer.current = window.setTimeout(() => setPhase({ for: state, step: 'done' }), RETRY_DELAY_MS)
  }

  const loading = view === 'loading'
  const showData = view === 'default'

  const all = React.useMemo<AssignedClaim[]>(() => {
    if (view === 'empty') return []
    return assignedClaims.map((c) => (c.id in followUps ? { ...c, followUp: followUps[c.id] ?? undefined } : c))
  }, [view, followUps])

  const summary = React.useMemo(() => summarise(all, today), [all, today])
  const visible = React.useMemo(() => (filter ? all.filter((c) => matches(filter, c, today)) : all), [all, filter, today])
  const activeLabel = FILTERS.find((f) => f.id === filter)?.label

  const countOf: Record<TodayFilter, number> = {
    overdue: summary.overdue,
    'due-today': summary.dueToday,
    ready: summary.ready,
    waiting: summary.waiting,
  }

  const announce = (message: string) => setAnnouncement((prev) => (prev === message ? `${message}​` : message))

  const toggle = (id: TodayFilter, pressed: boolean) => {
    const label = FILTERS.find((f) => f.id === id)?.label ?? ''
    if (pressed) {
      setFilter(id)
      announce(`Showing ${label}: ${plural(countOf[id], 'claim', 'claims')}`)
    } else {
      clear()
    }
  }
  const clear = () => {
    setFilter(null)
    announce(`Filter cleared. Showing all ${plural(all.length, 'claim', 'claims')}`)
  }

  const done = (claimId: string) => setFollowUps((prev) => ({ ...prev, [claimId]: null }))
  // "Snooze 2 d" means: remind me in 2 days. From today, so snoozing an overdue reminder does not leave it overdue.
  const snooze = (claimId: string, days: number) => {
    const current = all.find((c) => c.id === claimId)?.followUp
    if (!current) return
    const from = current.due > today ? current.due : today
    setFollowUps((prev) => ({ ...prev, [claimId]: { ...current, due: addDays(from, days) } }))
  }

  const subtitle = loading
    ? 'Loading your claims'
    : view === 'empty'
      ? '0 open claims'
      : view === 'error'
        ? 'Couldn’t load your claims'
        : `${plural(summary.open, 'open claim', 'open claims')} · ${summary.actNow} need${summary.actNow === 1 ? 's' : ''} action today`

  const noMatches = showData && filter !== null && visible.length === 0

  return (
    <div className="flex flex-col gap-stack p-inset">
      {loading && (
        <div role="status" className="sr-only">
          Loading your claims
        </div>
      )}

      <PageHeader title="My assigned" subtitle={subtitle} />

      {(showData || loading) && (
        <section aria-labelledby="my-assigned-today" className="flex flex-col gap-2">
          <h2 id="my-assigned-today" className="sr-only">
            Today
          </h2>
          <div className="grid grid-cols-2 gap-stack md:grid-cols-4">
            {FILTERS.map((f) =>
              loading ? (
                // The real control, invisible, inside the skeleton: loading has the exact final size.
                <Skeleton key={f.id} aria-hidden="true" className="rounded-surface">
                  <StatFilter label={f.label} count={0} pressed={false} onPressedChange={() => {}} tone={f.tone} disabled className="invisible" />
                </Skeleton>
              ) : (
                <StatFilter
                  key={f.id}
                  label={f.label}
                  count={countOf[f.id]}
                  tone={f.tone}
                  pressed={filter === f.id}
                  onPressedChange={(pressed) => toggle(f.id, pressed)}
                />
              ),
            )}
          </div>
          {loading ? (
            <Skeleton aria-hidden="true" className="w-72 max-w-full text-body">
              {NBSP}
            </Skeleton>
          ) : (
            <p className="text-body text-fg-muted tabular-nums">
              {summary.open} open · {formatMoney(summary.openAmount)} open amount ·{' '}
              {summary.oldestDays === 0 ? 'oldest assigned today' : `oldest assigned ${summary.oldestDays} d ago`}
            </p>
          )}
          {filter && activeLabel && (
            <p className="flex items-center gap-2 text-body text-fg">
              <span>
                Showing: <span className="font-medium tabular-nums">{activeLabel} ({visible.length})</span>
              </span>
              <span aria-hidden="true" className="text-fg-muted">
                ·
              </span>
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear
              </Button>
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-stack lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {noMatches ? (
            <StateBlock
              kind="empty"
              framed
              title={`No ${activeLabel?.toLowerCase()} claims`}
              description="Nothing on your list matches this filter"
              action={
                <Button variant="outline" onClick={clear}>
                  Clear filter
                </Button>
              }
            />
          ) : (
            <Worklist
              claims={visible}
              today={today}
              state={view}
              announce={false}
              onRetry={retry}
              filtered={filter !== null}
              expandWaiting={filter === 'waiting'}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-stack">
          <UpdatesPanel claims={all} state={view} announce={false} onRetry={retry} />
          <FollowUpList claims={all} today={today} state={view} announce={false} onDone={done} onSnooze={snooze} onRetry={retry} />
        </div>
      </div>

      {!loading && (
        <div role="status" className="sr-only">
          {announcement}
        </div>
      )}
    </div>
  )
}
