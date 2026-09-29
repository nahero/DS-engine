import { useId } from 'react'
import { ArrowRight, ChevronRight, CircleAlert, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { NeedsAttentionItem } from '@/data/types'
import { FlagLabel } from './FlagLabel'
import { SlaIndicator } from './SlaIndicator'

const NBSP = ' '
const SKELETON_ROWS = 5

/** Claims the handler should look at first, sorted by SLA and risk flags. Each row is one link to the claim. */
export function NeedsAttentionList({
  items = [],
  state = 'default',
  onRetry,
}: {
  items?: NeedsAttentionItem[]
  state?: 'default' | 'loading' | 'empty' | 'error'
  onRetry?: () => void
}) {
  const titleId = useId()
  const view = state === 'default' && items.length === 0 ? 'empty' : state

  return (
    <Card role="region" aria-labelledby={titleId} aria-busy={view === 'loading' || undefined} className="gap-stack overflow-hidden pb-0">
      <CardHeader>
        <CardTitle as="h2" id={titleId}>
          Needs attention
        </CardTitle>
        <CardDescription>Sorted by SLA and risk flags</CardDescription>
      </CardHeader>

      <CardContent>
        {view === 'loading' && (
          <div role="status">
            <span className="sr-only">Loading claims that need attention</span>
            <ul aria-hidden="true">
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <li key={i} className="border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="w-36 text-body">{NBSP}</Skeleton>
                        <Skeleton className="w-20 text-caption">{NBSP}</Skeleton>
                      </div>
                      <Skeleton className="w-40 text-caption">{NBSP}</Skeleton>
                      <Skeleton className="w-48 text-caption">{NBSP}</Skeleton>
                    </div>
                    <span className="size-4 shrink-0" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'empty' && (
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <CircleCheck aria-hidden="true" className="size-5 text-fg-muted" />
            <p className="text-body font-medium text-fg">Nothing needs attention</p>
            <p className="text-caption text-fg-muted">All claims are within SLA and have no open flags</p>
          </div>
        )}

        {view === 'error' && (
          <div role="alert" className="flex flex-col items-center gap-2 py-6 text-center">
            <CircleAlert aria-hidden="true" className="size-5 text-status-danger-fg" />
            <p className="text-body font-medium text-fg">Couldn’t load claims that need attention</p>
            <p className="text-caption text-fg-muted">The list didn’t load. Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}

        {view === 'default' && (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="border-b border-border last:border-b-0">
                <a
                  href={`#claim-${item.id}`}
                  className="-mx-2 flex items-center gap-2 rounded-control px-2 py-2 outline-none hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="shrink-0 font-mono text-body font-semibold whitespace-nowrap text-fg">{item.id}</span>
                      <SlaIndicator days={item.slaDays} className="shrink-0" />
                    </span>
                    <span className="truncate text-caption text-fg-muted" title={item.policyholder}>
                      {item.policyholder}
                    </span>
                    <FlagLabel flag={item.flag} />
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="border-t bg-subtle py-inset">
        <Button asChild variant="outline">
          <a href="#claims-queue">
            View queue
            <ArrowRight aria-hidden="true" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
