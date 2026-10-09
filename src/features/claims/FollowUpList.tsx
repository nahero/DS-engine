import { useId, useMemo, useRef, useState } from 'react'
import { CalendarDays, Clock, ClockAlert, type LucideIcon } from 'lucide-react'
import { StateBlock } from '@/components/patterns/StateBlock'
import { TruncatedText } from '@/components/patterns/TruncatedText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AssignedClaim } from '@/data/types'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { NBSP, type ViewState } from '@/lib/view-state'
import { daysBetween, formatShortDate } from '@/lib/worklist'

const SKELETON_ROWS = 3

/** Days a snooze moves the follow-up. */
export const SNOOZE_DAYS = 2

interface Item {
  claim: AssignedClaim
  due: string
  /** Days from today: negative = overdue. */
  offset: number
}

function dueLabel(offset: number, due: string): { text: string; Icon: LucideIcon; className: string } {
  if (offset < 0) return { text: `Overdue ${Math.abs(offset)} d`, Icon: ClockAlert, className: 'text-status-danger-fg' }
  if (offset === 0) return { text: 'Today', Icon: Clock, className: 'text-status-warning-fg' }
  return { text: formatShortDate(due), Icon: CalendarDays, className: 'text-fg-muted' }
}

/** Overdue first (most overdue first), then today, then upcoming by date. */
function collect(claims: AssignedClaim[], today: string): Item[] {
  return claims
    .flatMap((claim) => (claim.followUp ? [{ claim, due: claim.followUp.due, offset: daysBetween(today, claim.followUp.due) }] : []))
    .sort((a, b) => a.due.localeCompare(b.due) || a.claim.id.localeCompare(b.claim.id))
}

/**
 * The handler's diary: dated reminders on claims they are waiting on ("Chase discharge letter"), overdue first.
 * "Done" removes a reminder, "Snooze 2 d" moves it two days on; both are announced. Callbacks get the claim id.
 */
export function FollowUpList({
  claims,
  today,
  state = 'default',
  announce = true,
  onDone,
  onSnooze,
  onRetry,
}: {
  claims: AssignedClaim[]
  /** ISO date (YYYY-MM-DD). */
  today: string
  state?: ViewState
  /** Loading announces itself as a live region. A screen that announces loading once sets this to false. */
  announce?: boolean
  onDone: (claimId: string) => void
  onSnooze: (claimId: string, days: number) => void
  onRetry?: () => void
}) {
  const titleId = useId()
  const items = useMemo(() => collect(claims, today), [claims, today])
  const view = state === 'default' && items.length === 0 ? 'empty' : state
  const listRef = useRef<HTMLUListElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')

  const say = (text: string) => setMessage((prev) => (prev === text ? `${text}​` : text))

  const done = (item: Item, index: number) => {
    onDone(item.claim.id)
    say(`Follow-up done: ${item.claim.followUp?.note ?? ''}, ${item.claim.policyholder}`)
    // The item is gone: hand focus to the one that took its place, or to the card when it was the last.
    window.requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLElement>('[data-follow-up-done]')
      const target = buttons && buttons.length > 0 ? buttons[Math.min(index, buttons.length - 1)] : regionRef.current
      target?.focus()
    })
  }

  const snooze = (item: Item) => {
    onSnooze(item.claim.id, SNOOZE_DAYS)
    say(`Follow-up snoozed ${SNOOZE_DAYS} days: ${item.claim.followUp?.note ?? ''}, ${item.claim.policyholder}`)
  }

  return (
    <Card ref={regionRef} role="region" aria-labelledby={titleId} aria-busy={view === 'loading' || undefined} tabIndex={-1} className="outline-none">
      <CardHeader>
        <CardTitle as="h2" id={titleId}>
          Follow-ups
        </CardTitle>
        <CardDescription>Reminders to chase what you are waiting on</CardDescription>
      </CardHeader>

      <CardContent>
        {view === 'loading' && (
          <div role={announce ? 'status' : undefined}>
            {announce && <span className="sr-only">Loading follow-ups</span>}
            <ul aria-hidden="true">
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <li key={i} className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0">
                  <Skeleton className="w-48 text-body">{NBSP}</Skeleton>
                  <Skeleton className="w-40 text-caption">{NBSP}</Skeleton>
                  <Skeleton className="h-control w-44" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'empty' && <StateBlock kind="empty" size="sm" title="No follow-ups scheduled" description="Set one when you start waiting on someone" />}

        {view === 'error' && (
          <StateBlock
            kind="error"
            size="sm"
            title="Couldn’t load follow-ups"
            description="The follow-ups didn’t load. Check your connection and try again."
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        )}

        {view === 'default' && (
          <ul ref={listRef}>
            {items.map((item, index) => {
              const { claim } = item
              const note = claim.followUp?.note ?? ''
              const due = dueLabel(item.offset, item.due)
              return (
                <li key={claim.id} className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <TruncatedText text={note} className="text-body font-medium text-fg" />
                    <span className={cn('inline-flex shrink-0 items-center gap-1 text-caption font-medium whitespace-nowrap tabular-nums', due.className)}>
                      <due.Icon aria-hidden="true" className="size-3.5 shrink-0" />
                      {due.text}
                    </span>
                  </div>
                  <p className="flex min-w-0 items-baseline gap-x-2 text-caption text-fg-muted">
                    <span className="min-w-0 truncate">{claim.policyholder}</span>
                    <span aria-hidden="true">·</span>
                    <a
                      href={routes.claim(claim.id)}
                      className="shrink-0 rounded-inner font-mono tabular-nums outline-none hover:text-fg hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      {claim.id}
                    </a>
                  </p>
                  <div className="-ml-2.5 flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-follow-up-done=""
                      aria-label={`Mark follow-up done: ${note}, ${claim.policyholder}`}
                      onClick={() => done(item, index)}
                    >
                      Done
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Snooze ${SNOOZE_DAYS} d: ${note}, ${claim.policyholder}`}
                      onClick={() => snooze(item)}
                    >
                      Snooze {SNOOZE_DAYS} d
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Stays mounted when the last follow-up goes, so that announcement is still read. */}
        {view !== 'loading' && view !== 'error' && (
          <div role="status" className="sr-only">
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
