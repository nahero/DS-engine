import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ActivityEvent } from '@/data/types'
import { routes } from '@/lib/routes'
import { ActorBadge } from '@/components/patterns/ActorBadge'
import { NBSP, type ViewState } from '@/lib/view-state'
import { StateBlock } from '@/components/patterns/StateBlock'
import { TruncatedText } from '@/components/patterns/TruncatedText'
const SKELETON_ROWS = 6

// Row layout shared by real rows and skeletons so loading has the final size.
const rowClass = 'flex min-h-row flex-wrap items-center gap-x-stack gap-y-1 border-b border-border py-2 last:border-b-0 sm:flex-nowrap sm:py-0'

/** Latest agent and handler actions. Row height follows density; each row links to its claim. */
export function ActivityFeed({
  events = [],
  state = 'default',
  announce = true,
  onRetry,
}: {
  events?: ActivityEvent[]
  state?: ViewState
  /** Loading announces itself as a live region. A screen that announces loading once sets this to false. */
  announce?: boolean
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
          <div role={announce ? 'status' : undefined}>
            {announce && <span className="sr-only">Loading recent activity</span>}
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
          <StateBlock
            kind="empty"
            size="sm"
            title="No recent activity"
            description="Agent and handler actions will appear here as claims are processed"
          />
        )}

        {view === 'error' && (
          <StateBlock
            kind="error"
            size="sm"
            title="Couldn’t load recent activity"
            description="The activity list didn’t load. Check your connection and try again."
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            }
          />
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
                <TruncatedText
                  text={event.event}
                  className="order-last min-w-0 basis-full text-body text-fg sm:order-none sm:flex-1 sm:basis-auto"
                />
                <a
                  href={routes.claim(event.claimId)}
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
