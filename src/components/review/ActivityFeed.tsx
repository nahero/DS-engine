import { useId } from 'react'
import { CircleAlert, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ActivityEvent } from '@/data/types'
import { ActorBadge } from './ActorBadge'

const NBSP = ' '
const SKELETON_ROWS = 6

// Row layout shared by real rows and skeletons so loading has the final size.
const rowClass = 'flex min-h-row flex-wrap items-center gap-x-stack gap-y-1 border-b border-border py-2 last:border-b-0 sm:flex-nowrap sm:py-0'

/** Latest agent and handler actions. Row height follows density; each row links to its claim. */
export function ActivityFeed({
  events = [],
  state = 'default',
  onRetry,
}: {
  events?: ActivityEvent[]
  state?: 'default' | 'loading' | 'empty' | 'error'
  onRetry?: () => void
}) {
  const titleId = useId()
  const view = state === 'default' && events.length === 0 ? 'empty' : state

  return (
    <Card role="region" aria-labelledby={titleId} aria-busy={view === 'loading' || undefined}>
      <CardHeader>
        <CardTitle as="h2" id={titleId}>
          Recent activity
        </CardTitle>
        <CardDescription>Latest agent and handler actions</CardDescription>
      </CardHeader>

      <CardContent>
        {view === 'loading' && (
          <div role="status">
            <span className="sr-only">Loading recent activity</span>
            <ul aria-hidden="true">
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <li key={i} className={rowClass}>
                  <Skeleton className="w-14 shrink-0 text-caption">{NBSP}</Skeleton>
                  <Skeleton className="w-40 shrink-0 text-caption">{NBSP}</Skeleton>
                  <Skeleton className="min-w-0 flex-1 text-body">{NBSP}</Skeleton>
                  <Skeleton className="w-32 shrink-0 text-caption">{NBSP}</Skeleton>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'empty' && (
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <Inbox aria-hidden="true" className="size-5 text-fg-muted" />
            <p className="text-body font-medium text-fg">No recent activity</p>
            <p className="text-caption text-fg-muted">Agent and handler actions will appear here as claims are processed</p>
          </div>
        )}

        {view === 'error' && (
          <div role="alert" className="flex flex-col items-center gap-2 py-6 text-center">
            <CircleAlert aria-hidden="true" className="size-5 text-status-danger-fg" />
            <p className="text-body font-medium text-fg">Couldn’t load recent activity</p>
            <p className="text-caption text-fg-muted">The activity list didn’t load. Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}

        {view === 'default' && (
          <ul>
            {events.map((event) => (
              <li key={event.id} className={rowClass}>
                <time dateTime={event.time} className="w-14 shrink-0 font-mono text-caption text-fg-muted tabular-nums">
                  {event.time}
                </time>
                <div className="flex shrink-0 items-center sm:w-40">
                  <ActorBadge actor={event.actor} />
                </div>
                <span className="order-last min-w-0 basis-full truncate text-body text-fg sm:order-none sm:flex-1 sm:basis-auto" title={event.event}>
                  {event.event}
                </span>
                <a
                  href={`#claim-${event.claimId}`}
                  className="ml-auto inline-flex min-h-6 shrink-0 items-center rounded-inner text-right sm:ml-0 font-mono text-caption text-fg-muted tabular-nums outline-none hover:text-fg hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                >
                  {event.claimId}
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
