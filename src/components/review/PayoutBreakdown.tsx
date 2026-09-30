import { useId, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AUTHORITY_LIMIT } from '@/data/claim-detail'
import { formatMoney } from '@/data/claims'
import type { Payout } from '@/data/types'
import { cn } from '@/lib/utils'
import { derivePayout } from './claim-utils'
import { NBSP } from './shared'

/** "—" for a missing figure, read as "Missing". With a visible label beside it (`labelled`), the dash is decoration only. */
function Dash({ labelled = false }: { labelled?: boolean }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      {!labelled && <span className="sr-only">Missing</span>}
    </>
  )
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-stack">
      <dt className="text-body text-fg-muted">{label}</dt>
      <dd className="text-right font-mono text-body text-fg tabular-nums">{children}</dd>
    </div>
  )
}

function Note({ icon: Icon, tone, children }: { icon: typeof CircleCheck; tone?: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-cell">
      <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', tone ?? 'text-fg-muted')} />
      <p className={cn('min-w-0 flex-1 text-body', tone ? 'text-fg' : 'text-fg-muted')}>{children}</p>
    </div>
  )
}

const SKELETON_ROWS = [
  ['w-18', 'w-22'],
  ['w-20', 'w-20'],
  ['w-26', 'w-22'],
  ['w-22', 'w-22'],
]

/** How the payable amount is calculated, and whether it needs senior approval. Money right-aligned in tabular figures. */
export function PayoutBreakdown({ payout, loading = false }: { payout?: Payout; loading?: boolean }) {
  const titleId = useId()
  const header = (
    <CardHeader>
      <CardTitle as="h2" id={titleId}>
        Payout
      </CardTitle>
      <CardDescription>Calculated from invoice and policy terms</CardDescription>
    </CardHeader>
  )

  if (loading || !payout) {
    return (
      <Card role="region" aria-labelledby={titleId} aria-busy="true">
        {header}
        <CardContent>
          <div role="status">
            <span className="sr-only">Loading payout</span>
            <div aria-hidden="true" className="flex flex-col gap-cell">
              {SKELETON_ROWS.map(([a, b], i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className={cn(a, 'text-body')}>{NBSP}</Skeleton>
                  <Skeleton className={cn(b, 'text-body')}>{NBSP}</Skeleton>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <Skeleton className="w-16 text-body-lg">{NBSP}</Skeleton>
                <Skeleton className="w-24 text-body-lg">{NBSP}</Skeleton>
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const d = derivePayout(payout)
  const authority = formatMoney(AUTHORITY_LIMIT)
  const money = (n: number | null) => (n === null ? <Dash /> : formatMoney(n))

  return (
    <Card role="region" aria-labelledby={titleId}>
      {header}
      <CardContent className="flex flex-col gap-stack">
        <div className="flex flex-col gap-cell">
          <dl className="flex flex-col gap-cell">
            <Line label="Claimed">{payout.claimed === null ? <MissingValue /> : formatMoney(payout.claimed)}</Line>
            <Line label="Deductible">{payout.deductible === null ? <MissingValue /> : `− ${formatMoney(payout.deductible)}`}</Line>
            <Line label="Covered amount">{money(d.covered)}</Line>
            <Line label="Policy limit">{d.denied ? <Dash /> : money(payout.limit)}</Line>
          </dl>
          <Separator />
          <div className="flex flex-col gap-0.5">
            <dl>
              <div className="flex items-center justify-between gap-stack">
                <dt className="text-body-lg font-medium text-fg">Payable</dt>
                <dd className="text-right font-mono text-body-lg font-medium text-fg tabular-nums">{money(d.payable)}</dd>
              </div>
            </dl>
            {d.capped && (
              <p className="text-right text-caption text-fg-muted">
                Capped at policy limit · <span className="tabular-nums">{formatMoney(d.notCovered)}</span> not covered
              </p>
            )}
          </div>
        </div>

        {d.denied && payout.denied ? (
          <Note icon={CircleX} tone="text-status-danger-fg">
            Denied · Reason code {payout.denied.reasonCode}: {payout.denied.reason}
          </Note>
        ) : d.missing ? (
          <Note icon={CircleAlert}>Can’t calculate until {d.missing === 'deductible' ? 'deductible' : 'the claimed amount'} is confirmed</Note>
        ) : d.overAuthority ? (
          <Alert role="status">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Exceeds your authority limit ({authority}). Needs senior approval.</AlertTitle>
          </Alert>
        ) : (
          <Note icon={CircleCheck}>Within your authority limit ({authority})</Note>
        )}
      </CardContent>
    </Card>
  )
}

function MissingValue() {
  return (
    <span className="inline-flex items-center gap-cell">
      <Badge variant="outline" className="font-semibold">
        Missing
      </Badge>
      <Dash labelled />
    </span>
  )
}
