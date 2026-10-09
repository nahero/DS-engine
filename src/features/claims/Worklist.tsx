import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronRight, CircleCheck } from 'lucide-react'
import { NextAction } from '@/components/patterns/NextAction'
import { SlaIndicator } from '@/components/patterns/SlaIndicator'
import { StageIndicator } from '@/components/patterns/StageIndicator'
import { StateBlock } from '@/components/patterns/StateBlock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AssignedClaim } from '@/data/types'
import { useIsTruncated } from '@/hooks/use-truncated'
import { formatMoney } from '@/lib/format'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { NBSP, type ViewState } from '@/lib/view-state'
import { compareWorklist, deadlineLabel, nextAction, stageOf, worklistGroup, WORKLIST_GROUPS, type WorklistGroup } from '@/lib/worklist'

const SKELETON_ROWS = 6
/** Keeps "5 d" together when a deadline wraps. */
const NBSP_D = '\u00a0d'

const GROUPS: Record<WorklistGroup, { title: string; hint: string }> = {
  'act-now': { title: 'Act now', hint: 'Overdue, due today, or something just came back' },
  ready: { title: 'Ready for you', hint: 'Your move, not urgent yet' },
  waiting: { title: 'Waiting on others', hint: 'Nothing to do until they respond or a follow-up is due' },
}

// Row layout, shared by real rows and skeletons so loading has the final size. The grid reacts to the width of the
// list itself (container queries), not the viewport: the list sits in a two-thirds column beside the panels.
//   narrow (< @xl)  : name + claim / amount, next action, deadline + stage (stacked)
//   medium (@xl+)   : name + claim / amount, next action + deadline + stage
//   wide (@5xl+)    : one line: name over claim, next action, deadline, stage, amount
const rowClass = 'flex min-h-row items-center gap-3 px-inset py-2'
const gridClass = 'grid min-w-0 flex-1 grid-cols-12 items-start gap-y-1 @5xl:items-center'
const cellClass = {
  who: 'col-span-8 flex min-w-0 flex-col pe-stack @xl:col-span-9 @xl:flex-row @xl:items-baseline @xl:gap-x-2 @5xl:col-span-3 @5xl:flex-col @5xl:items-stretch @5xl:gap-x-0',
  amount: 'col-span-4 flex min-w-0 items-baseline justify-end gap-1 text-right @xl:col-span-3 @5xl:order-last @5xl:col-span-2',
  action: 'col-span-12 min-w-0 pe-stack @xl:col-span-6 @5xl:col-span-3',
  deadline: 'col-span-6 min-w-0 pe-stack @xl:col-span-3 @5xl:col-span-2',
  stage: 'col-span-6 min-w-0 @xl:col-span-3 @5xl:col-span-2',
}

/** "Sarah Mitchell, CLM-2026-004817: Send for senior approval, Decision due in 1 d": the row's accessible name. */
function rowName(claim: AssignedClaim, action: string): string {
  const parts = [`${claim.policyholder}, ${claim.id}: ${action}`, deadlineLabel(claim)]
  if (claim.lastEvent?.isNew) parts.push('new update')
  return parts.join(', ')
}

/** One claim as one link. When the policyholder is cut off, the link carries the tooltip (hover and keyboard focus). */
function WorklistRow({ claim, today }: { claim: AssignedClaim; today: string }) {
  const nameRef = useRef<HTMLSpanElement>(null)
  const truncated = useIsTruncated(nameRef, claim.policyholder)
  const [open, setOpen] = useState(false)
  const action = nextAction(claim, today)
  const isNew = claim.lastEvent?.isNew === true
  return (
    <li>
      <Tooltip open={truncated && open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <a
            href={routes.claim(claim.id)}
            data-worklist-row=""
            aria-label={rowName(claim, action.text)}
            className={cn(rowClass, 'text-body outline-none hover:bg-subtle focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring')}
          >
            <span className={gridClass}>
              <span className={cellClass.who}>
                <span className="flex min-w-0 items-center gap-2">
                  <span ref={nameRef} className="truncate font-semibold text-fg">
                    {claim.policyholder}
                  </span>
                  {isNew && <Badge variant="secondary">New</Badge>}
                </span>
                <span className="text-caption whitespace-nowrap text-fg-muted">
                  <span className="font-mono">{claim.id}</span> · {claim.lob}
                </span>
              </span>
              <span className={cellClass.amount}>
                {claim.payable === null ? (
                  <>
                    <span aria-hidden="true" className="font-semibold text-fg-muted">
                      —
                    </span>
                    <span className="text-caption text-fg-muted">Missing</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-fg tabular-nums">{formatMoney(claim.payable)}</span>
                    {/* Nothing payable because the claimed amount is under the deductible: say so, a bare €0.00 reads as an error. */}
                    {claim.payable === 0 && claim.claimed > 0 && (
                      <span className="text-caption whitespace-nowrap text-fg-muted">Below deductible</span>
                    )}
                  </>
                )}
              </span>
              <span className={cellClass.action}>
                <NextAction {...action} wrap />
              </span>
              <span className={cellClass.deadline}>
                <SlaIndicator days={claim.slaDays} label={deadlineLabel(claim).replace(/ d$/, NBSP_D)} className="items-start whitespace-normal" />
              </span>
              <span className={cellClass.stage}>
                <StageIndicator {...stageOf(claim)} />
              </span>
            </span>
            <ChevronRight aria-hidden="true" className="hidden size-4 shrink-0 text-fg-muted @xl:block" />
          </a>
        </TooltipTrigger>
        <TooltipContent>{claim.policyholder}</TooltipContent>
      </Tooltip>
    </li>
  )
}

function SkeletonRow() {
  return (
    <li className={rowClass}>
      <span className={gridClass}>
        <span className={cellClass.who}>
          <Skeleton className="w-40 text-body">{NBSP}</Skeleton>
          <Skeleton className="mt-1 w-32 text-caption @xl:mt-0">{NBSP}</Skeleton>
        </span>
        <span className={cellClass.amount}>
          <Skeleton className="w-20 text-body">{NBSP}</Skeleton>
        </span>
        <span className={cellClass.action}>
          <Skeleton className="w-full max-w-72 text-body">{NBSP}</Skeleton>
        </span>
        <span className={cellClass.deadline}>
          <Skeleton className="w-28 text-caption">{NBSP}</Skeleton>
        </span>
        <span className={cellClass.stage}>
          <Skeleton className="w-28 text-caption">{NBSP}</Skeleton>
        </span>
      </span>
      <span className="hidden size-4 shrink-0 @xl:block" />
    </li>
  )
}

const listClass = 'divide-y divide-border overflow-hidden rounded-surface border bg-surface'

function GroupHeader({ children, hint, className }: { children: ReactNode; hint: string; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-stack gap-y-0.5 pb-2', className)}>
      {children}
      <p className="text-caption text-fg-muted">{hint}</p>
    </div>
  )
}

const claimsCount = (n: number) => `${n} ${n === 1 ? 'claim is' : 'claims are'}`

/**
 * A handler's caseload in three groups by whose move it is: Act now, Ready for you, Waiting on others. Each row is one
 * link to the claim and states the next action in words. Waiting on others is collapsed to its heading and count
 * unless it is all there is (or a filter targets it). Keyboard: Tab through the links, or ↑/↓ and j/k between rows
 * across groups. Rows follow the density setting; the layout follows the width of the list.
 */
export function Worklist({
  claims,
  today,
  state = 'default',
  announce = true,
  onRetry,
  emptyAction,
  filtered = false,
  expandWaiting = false,
}: {
  claims: AssignedClaim[]
  /** ISO date (YYYY-MM-DD) the worklist is evaluated for. */
  today: string
  state?: ViewState
  /** Loading announces itself as a live region. A screen that announces loading once sets this to false. */
  announce?: boolean
  onRetry?: () => void
  /** Replaces the "Go to claims queue" button of the empty state. */
  emptyAction?: ReactNode
  /** A filter is applied: groups that do not match are not "caught up", they are filtered out. */
  filtered?: boolean
  /** A filter targets Waiting on others: show its rows. */
  expandWaiting?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const waitingId = useId()
  const headingId = (g: WorklistGroup) => `${waitingId}-${g}`

  const grouped = useMemo(() => {
    const result: Record<WorklistGroup, AssignedClaim[]> = { 'act-now': [], ready: [], waiting: [] }
    for (const c of claims) result[worklistGroup(c, today)].push(c)
    for (const g of WORKLIST_GROUPS) result[g].sort(compareWorklist)
    return result
  }, [claims, today])

  const shown = WORKLIST_GROUPS.filter((g) => grouped[g].length > 0)
  const onlyWaiting = shown.length === 1 && shown[0] === 'waiting'
  const caughtUp = !filtered && grouped['act-now'].length === 0 && grouped.ready.length === 0 && grouped.waiting.length > 0
  const forced = onlyWaiting || expandWaiting

  // A manual toggle wins until the reason to expand changes.
  const [manual, setManual] = useState<boolean | null>(null)
  const [prevForced, setPrevForced] = useState(forced)
  if (prevForced !== forced) {
    setPrevForced(forced)
    setManual(null)
  }
  const waitingOpen = manual ?? forced

  const view = state === 'default' && claims.length === 0 ? 'empty' : state

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    const target = e.target as HTMLElement
    // Shortcuts never fire while typing.
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return
    const row = target.closest<HTMLAnchorElement>('a[data-worklist-row]')
    if (!row) return
    const step = e.key === 'ArrowDown' || e.key === 'j' ? 1 : e.key === 'ArrowUp' || e.key === 'k' ? -1 : 0
    if (step === 0) return
    e.preventDefault()
    const rows = Array.from(rootRef.current?.querySelectorAll<HTMLAnchorElement>('ul:not([hidden]) a[data-worklist-row]') ?? [])
    const next = rows[Math.min(Math.max(rows.indexOf(row) + step, 0), rows.length - 1)]
    next?.focus()
  }

  if (view === 'loading') {
    return (
      <div className="@container" aria-busy="true">
        <div role={announce ? 'status' : undefined}>
          {announce && <span className="sr-only">Loading your claims</span>}
          <ul aria-hidden="true" className={listClass}>
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <SkeletonRow key={i} />
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (view === 'empty') {
    return (
      <StateBlock
        kind="empty"
        framed
        title="No claims assigned"
        description="Pick one up from the queue"
        action={
          emptyAction ?? (
            <Button asChild variant="outline">
              <a href={routes.queue}>Go to claims queue</a>
            </Button>
          )
        }
      />
    )
  }

  if (view === 'error') {
    return (
      <StateBlock
        kind="error"
        framed
        title="Couldn’t load your claims"
        description="Your worklist didn’t load. Check your connection and try again."
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <TooltipProvider>
      {/* Keyboard shortcuts bubble up from the row links; the container itself is not interactive. */}
      <div ref={rootRef} className="@container flex flex-col gap-inset" onKeyDown={onKeyDown}>
        {caughtUp && (
          <div className="flex items-center gap-2 rounded-surface border bg-surface px-inset py-3 text-body">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-status-success-fg" />
            <p>
              <span className="font-medium text-fg">All caught up.</span>{' '}
              <span className="text-fg-muted tabular-nums">{claimsCount(grouped.waiting.length)} waiting on others.</span>
            </p>
          </div>
        )}

        {shown.map((group) => {
          const items = grouped[group]
          const { title, hint } = GROUPS[group]
          const id = headingId(group)
          const count = <span className="tabular-nums">{items.length}</span>
          const list = (
            <ul id={`${id}-list`} hidden={group === 'waiting' && !waitingOpen} className={listClass}>
              {items.map((claim) => (
                <WorklistRow key={claim.id} claim={claim} today={today} />
              ))}
            </ul>
          )
          if (group !== 'waiting') {
            return (
              <section key={group} aria-labelledby={id}>
                <GroupHeader hint={hint}>
                  <h2 id={id} className="text-body-lg font-medium text-fg">
                    {title} · {count}
                  </h2>
                </GroupHeader>
                {list}
              </section>
            )
          }
          return (
            <section key={group} aria-labelledby={id}>
              <GroupHeader hint={hint}>
                <h2 id={id} className="text-body-lg font-medium text-fg">
                  <button
                    type="button"
                    aria-expanded={waitingOpen}
                    aria-controls={`${id}-list`}
                    onClick={() => setManual(!waitingOpen)}
                    className="-ml-1 flex items-center gap-1 rounded-control px-1 outline-none hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    <ChevronRight aria-hidden="true" className={cn('size-4 shrink-0 text-fg-muted transition-transform', waitingOpen && 'rotate-90')} />
                    {title} · {count}
                  </button>
                </h2>
              </GroupHeader>
              {list}
            </section>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
