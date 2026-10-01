import { useId, useRef, useState } from 'react'
import { ArrowRight, ChevronRight, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { NeedsAttentionItem } from '@/data/types'
import { useIsTruncated } from '@/hooks/use-truncated'
import { routes } from '@/lib/routes'
import { FlagLabel } from '@/components/patterns/FlagLabel'
import { NBSP, type ViewState } from '@/lib/view-state'
import { SlaIndicator } from '@/components/patterns/SlaIndicator'
import { StateBlock } from '@/components/patterns/StateBlock'

const SKELETON_ROWS = 5

/** One claim link. If the policyholder is cut off, the link itself carries the tooltip (hover and keyboard focus). */
function AttentionRow({ item }: { item: NeedsAttentionItem }) {
  const nameRef = useRef<HTMLSpanElement>(null)
  const truncated = useIsTruncated(nameRef, item.policyholder)
  const [open, setOpen] = useState(false)
  return (
    <li className="border-b border-border last:border-b-0">
      <Tooltip open={truncated && open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <a
            href={routes.claim(item.id)}
            className="-mx-2 flex items-center gap-2 rounded-control px-2 py-2 outline-none hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center justify-between gap-2">
                <span className="shrink-0 font-mono text-body font-semibold whitespace-nowrap text-fg">{item.id}</span>
                <SlaIndicator days={item.slaDays} className="shrink-0" />
              </span>
              <span ref={nameRef} className="truncate text-caption text-fg-muted">
                {item.policyholder}
              </span>
              <FlagLabel flag={item.flag} />
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
          </a>
        </TooltipTrigger>
        <TooltipContent>{item.policyholder}</TooltipContent>
      </Tooltip>
    </li>
  )
}

/** Claims the handler should look at first, sorted by SLA and risk flags. Each row is one link to the claim. */
export function NeedsAttentionList({
  items = [],
  state = 'default',
  announce = true,
  onRetry,
}: {
  items?: NeedsAttentionItem[]
  state?: ViewState
  /** Loading announces itself as a live region. A screen that announces loading once sets this to false. */
  announce?: boolean
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
          <div role={announce ? 'status' : undefined}>
            {announce && <span className="sr-only">Loading claims that need attention</span>}
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
          <StateBlock
            kind="empty"
            size="sm"
            icon={CircleCheck}
            title="Nothing needs attention"
            description="All claims are within SLA and have no open flags"
          />
        )}

        {view === 'error' && (
          <StateBlock
            kind="error"
            size="sm"
            title="Couldn’t load claims that need attention"
            description="The list didn’t load. Check your connection and try again."
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            }
          />
        )}

        {view === 'default' && (
          <TooltipProvider>
            <ul>
              {items.map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </ul>
          </TooltipProvider>
        )}
      </CardContent>

      <CardFooter className="border-t bg-subtle py-inset">
        <Button asChild variant="outline">
          <a href={routes.queue}>
            View queue
            <ArrowRight aria-hidden="true" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
