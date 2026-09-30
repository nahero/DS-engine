import { useId } from 'react'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/data/claims'
import type { AuditEvent } from '@/data/types'
import { ActorBadge } from './ActorBadge'
import { NBSP } from './shared'

const COMPACT_COUNT = 5

/** `22 Sep 09:03` from an ISO date-time. */
function formatStamp(iso: string): string {
  return `${formatDate(iso).slice(0, 6)} ${iso.slice(11, 16)}`
}

function AuditList({ events }: { events: AuditEvent[] }) {
  return (
    <ol>
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <time dateTime={event.at} className="shrink-0 font-mono text-caption text-fg-muted tabular-nums">
              {formatStamp(event.at)}
            </time>
            <ActorBadge actor={event.actor} />
          </div>
          <p className="text-body text-fg">{event.event}</p>
          {event.detail && <p className="text-caption text-fg-muted">{event.detail}</p>}
        </li>
      ))}
    </ol>
  )
}

/**
 * Chronological record, newest first. Each entry: time, who (label + icon), what, optional detail.
 * `compact` is the side-panel version: a titled card with the latest 5 and a "View all" action.
 */
export function AuditTrail({
  events,
  compact = false,
  loading = false,
  onViewAll,
}: {
  events: AuditEvent[]
  compact?: boolean
  loading?: boolean
  onViewAll?: () => void
}) {
  const titleId = useId()
  const shown = compact ? events.slice(0, COMPACT_COUNT) : events

  if (loading) {
    return (
      <Card role="region" aria-labelledby={titleId} aria-busy="true">
        <CardHeader>
          <CardTitle as="h2" id={titleId}>
            Audit trail
          </CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="status">
            <span className="sr-only">Loading audit trail</span>
            <ul aria-hidden="true" className="flex flex-col gap-stack">
              {Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <Skeleton className="w-40 text-caption">{NBSP}</Skeleton>
                  <Skeleton className="w-full text-body">{NBSP}</Skeleton>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  const list =
    events.length === 0 ? (
      <div className="flex flex-col items-center gap-1 py-6 text-center">
        <History aria-hidden="true" className="size-5 text-fg-muted" />
        <p className="text-body font-medium text-fg">No activity yet</p>
        <p className="text-caption text-fg-muted">Agent and handler actions on this claim will be recorded here</p>
      </div>
    ) : (
      <AuditList events={shown} />
    )

  if (!compact) return list

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle as="h2" id={titleId}>
          Audit trail
        </CardTitle>
        <CardDescription>Newest first</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-stack">
        {list}
        {events.length > COMPACT_COUNT && (
          <Button variant="outline" className="self-start" onClick={onViewAll}>
            View all ({events.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
