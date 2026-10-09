import { cn } from '@/lib/utils'
import type { Stage } from '@/lib/worklist'

const STEPS = [1, 2, 3, 4, 5] as const

/**
 * Where a claim is between assignment and payment: five segments, filled up to the current step, then the stage name.
 * The name is always shown, so the position never relies on the segments or their colour.
 */
export function StageIndicator({ step, label, className }: Stage & { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      <span aria-hidden="true" className="flex items-center gap-0.5">
        {STEPS.map((s) => (
          <span
            key={s}
            data-filled={s <= step ? '' : undefined}
            className={cn('h-2 w-3 rounded-full border', s <= step ? 'border-action-primary bg-action-primary' : 'border-border bg-subtle')}
          />
        ))}
      </span>
      <span className="text-caption text-fg-muted">
        <span className="sr-only">
          Stage {step} of {STEPS.length}:{' '}
        </span>
        {label}
      </span>
    </span>
  )
}
