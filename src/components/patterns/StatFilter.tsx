import { Clock, ClockAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A count that is also a filter: a toggle button (`aria-pressed`) with a large number and a label.
 * `tone` adds an icon beside the label (danger: overdue, warning: due today); the label carries the meaning.
 * A count of 0 stays operable, so the filter can still be switched on and shows an empty list.
 */
export function StatFilter({
  label,
  count,
  pressed,
  onPressedChange,
  tone = 'default',
  disabled = false,
  className,
}: {
  label: string
  count: number
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  tone?: 'default' | 'danger' | 'warning'
  disabled?: boolean
  className?: string
}) {
  const Icon = tone === 'danger' ? ClockAlert : tone === 'warning' ? Clock : null
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'flex min-h-6 min-w-0 flex-col items-start gap-1 rounded-surface border px-inset py-stack text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        pressed ? 'border-border-hover bg-accent' : 'border-border bg-surface hover:bg-subtle',
        className,
      )}
    >
      <span className="text-heading-lg font-medium tracking-tight text-fg tabular-nums">{count}</span>
      <span className="flex items-center gap-1.5 text-body text-fg-muted">
        {Icon && (
          <Icon
            aria-hidden="true"
            className={cn('size-3.5 shrink-0', tone === 'danger' ? 'text-status-danger-fg' : 'text-status-warning-fg')}
          />
        )}
        {label}
      </span>
    </button>
  )
}
