import { Clock, ClockAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SlaDays } from '@/data/types'

/**
 * SLA deadline as words + icon: overdue, due today, due in N days, or not applicable. Colour is a secondary cue.
 * `label` replaces the words (e.g. "Decision due in 3 d" to name the clock); the icon and colour still follow `days`.
 */
export function SlaIndicator({ days, label: custom, className }: { days: SlaDays; label?: string; className?: string }) {
  if (days === null) {
    return (
      <span className={cn('inline-flex items-center text-caption whitespace-nowrap text-fg-subtle', className)}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not applicable</span>
      </span>
    )
  }

  const overdue = days < 0
  const today = days === 0
  const Icon = overdue ? ClockAlert : Clock
  const label = custom ?? (overdue ? `Overdue ${Math.abs(days)} d` : today ? 'Due today' : `Due in ${days} d`)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-caption font-medium whitespace-nowrap tabular-nums',
        overdue ? 'text-status-danger-fg' : today ? 'text-status-warning-fg' : 'text-fg-muted',
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}
