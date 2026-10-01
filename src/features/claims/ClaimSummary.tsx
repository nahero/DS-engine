import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import type { Claim } from '@/data/types'
import { maskPolicyNo } from '@/lib/claim-logic'
import { SlaIndicator } from '@/components/patterns/SlaIndicator'
import { NBSP } from '@/lib/view-state'

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 xl:shrink-0">
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="flex min-h-6 flex-wrap items-center gap-x-2 text-body font-medium text-fg">{children}</dd>
    </div>
  )
}

const gridClass = 'grid grid-cols-2 gap-x-stack gap-y-cell md:grid-cols-3 xl:flex xl:justify-between'

/** Key facts about the claim and its policy. The policy number is masked until revealed; revealing is audited by the caller. */
export function ClaimSummary({
  claim,
  policyPeriod,
  policyRevealed = false,
  loading = false,
  onToggleReveal,
}: {
  claim?: Claim
  policyPeriod?: { start: string; end: string }
  policyRevealed?: boolean
  loading?: boolean
  onToggleReveal?: () => void
}) {
  if (loading || !claim || !policyPeriod) {
    return (
      <Card aria-busy="true">
        <CardContent>
          <div role="status">
            <span className="sr-only">Loading claim summary</span>
            <div aria-hidden="true" className={gridClass}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="w-20 text-caption">{NBSP}</Skeleton>
                  <Skeleton className="w-32 text-body">{NBSP}</Skeleton>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <dl className={gridClass}>
          <Item label="Policy #">
            <span className="font-mono tabular-nums">{policyRevealed ? claim.policyNo : maskPolicyNo(claim.policyNo)}</span>
            <Button
              variant="ghost"
              size="xs"
              aria-pressed={policyRevealed}
              aria-label={`${policyRevealed ? 'Hide' : 'Reveal'} policy number`}
              onClick={onToggleReveal}
            >
              {policyRevealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              {policyRevealed ? 'Hide' : 'Reveal'}
            </Button>
          </Item>
          <Item label="Policy period">
            <span className="tabular-nums">
              {formatDate(policyPeriod.start)} – {formatDate(policyPeriod.end)}
            </span>
          </Item>
          <Item label="Loss date">
            <span className="tabular-nums">{formatDate(claim.lossDate)}</span>
          </Item>
          <Item label="Reported (FNOL)">
            <span className="tabular-nums">{formatDate(claim.reportedDate)}</span>
          </Item>
          <Item label="SLA">
            <SlaIndicator days={claim.slaDays} className="text-body" />
          </Item>
          <Item label="Handler">
            {claim.handler ?? <span className="font-normal text-fg-muted">Unassigned</span>}
          </Item>
        </dl>
      </CardContent>
    </Card>
  )
}
