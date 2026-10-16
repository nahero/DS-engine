import { useId, useMemo, useState } from 'react'
import { BadgeCheck, ClockAlert, FileCheck, MessageSquare, RotateCcw, type LucideIcon } from 'lucide-react'
import { StateBlock } from '@/components/patterns/StateBlock'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ASSIGNED_NOW } from '@/data/assigned'
import type { AssignedClaim, AssignedEvent, AssignedEventKind } from '@/data/types'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { NBSP, type ViewState } from '@/lib/view-state'
import { relativeTime } from '@/lib/worklist'

const SKELETON_ROWS = 4
const MAX_SHOWN = 6

const icons: Record<AssignedEventKind, LucideIcon> = {
  'document-received': FileCheck,
  'approval-returned': BadgeCheck,
  'policyholder-replied': MessageSquare,
  'sla-warning': ClockAlert,
  reopened: RotateCcw,
}

interface Update {
  event: AssignedEvent
  claimId: string
  policyholder: string
}

/** New events first, then older ones; newest first within each. */
function collect(claims: AssignedClaim[]): Update[] {
  return claims
    .flatMap((c) => (c.lastEvent ? [{ event: c.lastEvent, claimId: c.id, policyholder: c.policyholder }] : []))
    .sort(
      (a, b) => Number(b.event.isNew) - Number(a.event.isNew) || b.event.at.localeCompare(a.event.at) || a.claimId.localeCompare(b.claimId),
    )
}

function UpdateItem({ update, now }: { update: Update; now: string }) {
  const { event } = update
  const Icon = icons[event.kind]
  return (
    <li className="border-b border-border last:border-b-0">
      <a
        href={routes.claim(update.claimId)}
        className="-mx-2 flex items-start gap-2 rounded-control px-2 py-2 outline-none hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring"
      >
        <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', event.isNew ? 'text-fg' : 'text-fg-muted')} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('text-body text-fg', event.isNew && 'font-medium')}>{event.text}</span>
          <span className="flex flex-wrap items-center gap-x-2 text-caption text-fg-muted">
            {event.isNew && (
              <span className="inline-flex items-center gap-1 font-medium text-fg">
                <span aria-hidden="true" className="size-2 rounded-full bg-action-primary" />
                New
              </span>
            )}
            <span className="min-w-0 truncate">{update.policyholder}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={event.at} className="whitespace-nowrap tabular-nums">
              {relativeTime(event.at, now)}
            </time>
            <span className="sr-only">, {update.claimId}</span>
          </span>
        </span>
      </a>
    </li>
  )
}

/**
 * What happened on the handler's claims since they were last here: document received, approval returned, policyholder
 * replied, SLA about to breach, reopened. New events first, marked with a dot and the word "New". Each item links to its claim.
 * Shows the first six; the rest sit behind "Show all".
 */
export function UpdatesPanel({
  claims,
  now = ASSIGNED_NOW,
  state = 'default',
  announce = true,
  onRetry,
}: {
  claims: AssignedClaim[]
  /** ISO date-time that relative times count from. */
  now?: string
  state?: ViewState
  /** Loading announces itself as a live region. A screen that announces loading once sets this to false. */
  announce?: boolean
  onRetry?: () => void
}) {
  const titleId = useId()
  const listId = useId()
  const [expanded, setExpanded] = useState(false)
  const updates = useMemo(() => collect(claims), [claims])
  const view = state === 'default' && updates.length === 0 ? 'empty' : state
  const shown = expanded ? updates : updates.slice(0, MAX_SHOWN)
  const newCount = updates.filter((u) => u.event.isNew).length

  return (
    <Card role="region" aria-labelledby={titleId} aria-busy={view === 'loading' || undefined}>
      <CardHeader>
        <CardTitle as="h2" id={titleId}>
          Since you were last here
        </CardTitle>
        <CardDescription>{view === 'default' ? `${newCount} new on your claims` : 'Events on your claims'}</CardDescription>
      </CardHeader>

      <CardContent>
        {view === 'loading' && (
          <div role={announce ? 'status' : undefined}>
            {announce && <span className="sr-only">Loading updates</span>}
            <ul aria-hidden="true">
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <li key={i} className="flex items-start gap-2 border-b border-border py-2 last:border-b-0">
                  <span className="mt-0.5 size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Skeleton className="w-full max-w-56 text-body">{NBSP}</Skeleton>
                    <Skeleton className="w-40 text-caption">{NBSP}</Skeleton>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'empty' && (
          <StateBlock
            kind="empty"
            size="sm"
            title="Nothing new since your last visit"
            description="Document replies, approvals and SLA warnings appear here"
          />
        )}

        {view === 'error' && (
          <StateBlock
            kind="error"
            size="sm"
            title="Couldn’t load updates"
            description="The updates didn’t load. Check your connection and try again."
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        )}

        {view === 'default' && (
          <>
            <ul id={listId}>
              {shown.map((u) => (
                <UpdateItem key={u.event.id} update={u} now={now} />
              ))}
            </ul>
            {updates.length > MAX_SHOWN && (
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 -ml-2.5"
              >
                {expanded ? 'Show fewer' : `Show all (${updates.length})`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
