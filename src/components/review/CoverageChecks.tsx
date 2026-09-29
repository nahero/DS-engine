import { CircleCheck, CircleDashed, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CoverageCheck } from '@/data/types'

const results: Record<CoverageCheck['result'], { Icon: LucideIcon; label: string; tone: string }> = {
  pass: { Icon: CircleCheck, label: 'Pass', tone: 'text-status-success-fg' },
  flag: { Icon: TriangleAlert, label: 'Flagged', tone: 'text-status-warning-fg' },
  unknown: { Icon: CircleDashed, label: 'Unknown', tone: 'text-fg-muted' },
}

/** Policy checks the agent ran. Result is always icon + word; colour is a secondary cue. */
export function CoverageChecks({ checks, className }: { checks: CoverageCheck[]; className?: string }) {
  if (checks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-6 text-center">
        <CircleDashed aria-hidden="true" className="size-5 text-fg-muted" />
        <p className="text-body font-medium text-fg">No coverage checks yet</p>
        <p className="text-caption text-fg-muted">Checks appear once the agent has processed the claim</p>
      </div>
    )
  }
  return (
    <ul className={className}>
      {checks.map((check) => {
        const { Icon, label, tone } = results[check.result]
        return (
          <li key={check.id} className="flex flex-wrap items-start justify-between gap-x-stack gap-y-1 border-b border-border py-2 last:border-b-0">
            <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
              <span className="text-body font-medium text-fg">{check.label}</span>
              <span className="text-caption text-fg-muted">{check.detail}</span>
            </div>
            <span className={cn('inline-flex shrink-0 items-center gap-1 text-caption font-medium whitespace-nowrap', tone)}>
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
