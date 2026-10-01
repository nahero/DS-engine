import { useId } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ClaimDetail } from '@/data/types'
import { ActorBadge } from '@/components/patterns/ActorBadge'
import { NBSP } from '@/lib/view-state'

/** The agent's recommendation and the reasons behind it. Always labelled as AI-generated; the handler decides. */
export function AgentSummary({ summary, loading = false }: { summary?: ClaimDetail['agentSummary']; loading?: boolean }) {
  const titleId = useId()
  return (
    <Card role="region" aria-labelledby={titleId} aria-busy={loading || undefined}>
      <CardHeader>
        <CardTitle as="h2" id={titleId}>
          Agent summary
        </CardTitle>
        <CardDescription>AI-generated, review before acting</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-stack">
        {loading || !summary ? (
          <div role="status">
            <span className="sr-only">Loading agent summary</span>
            <div aria-hidden="true" className="flex flex-col gap-2">
              <Skeleton className="w-16 text-caption">{NBSP}</Skeleton>
              <Skeleton className="w-full text-body">{NBSP}</Skeleton>
              <Skeleton className="w-3/4 text-body">{NBSP}</Skeleton>
            </div>
          </div>
        ) : (
          <>
            <ActorBadge actor={{ kind: 'agent' }} className="self-start" />
            <p className="text-body font-medium text-fg">
              <span className="sr-only">Agent recommendation: </span>
              {summary.recommendation}
            </p>
            {summary.notes.length > 0 && (
              <ul className="flex list-disc flex-col gap-1 pl-4 text-body text-fg-muted marker:text-fg-muted">
                {summary.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
