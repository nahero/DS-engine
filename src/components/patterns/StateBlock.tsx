import type { ElementType, ReactNode } from 'react'
import { CircleAlert, Inbox, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Empty or error block: icon, what happened, why, and a next action (Retry, Clear filters).
 * Errors are announced (`role="alert"`). Same spacing everywhere; `size` follows where it sits (`sm` inside a card, `md` for a whole region).
 */
export function StateBlock({
  kind,
  title,
  description,
  icon,
  action,
  size = 'md',
  framed = false,
  className,
}: {
  kind: 'empty' | 'error'
  title: string
  description?: string
  /** Defaults to an inbox (empty) or an alert circle (error). */
  icon?: LucideIcon
  /** Button or link for the next step. */
  action?: ReactNode
  size?: 'sm' | 'md'
  /** Draws the surface border, for blocks that replace a whole region. */
  framed?: boolean
  className?: string
}) {
  const Icon: ElementType = icon ?? (kind === 'error' ? CircleAlert : Inbox)
  return (
    <div
      role={kind === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center',
        size === 'sm' ? 'py-6' : 'px-inset py-12',
        framed && 'rounded-surface border bg-surface',
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn('shrink-0', size === 'sm' ? 'size-5' : 'size-6', kind === 'error' ? 'text-status-danger-fg' : 'text-fg-muted')} />
      <p className="text-body font-medium text-fg">{title}</p>
      {description && <p className="max-w-prose text-caption text-fg-muted">{description}</p>}
      {action}
    </div>
  )
}
