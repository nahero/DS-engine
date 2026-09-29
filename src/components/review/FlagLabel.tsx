import { BotOff, CalendarX, Copy, FileClock, Flag, ShieldAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClaimFlag } from '@/data/types'

const icons: Record<ClaimFlag, LucideIcon> = {
  'Loss date outside policy period': CalendarX,
  'Agent failed': BotOff,
  'Above authority limit': ShieldAlert,
  'Duplicate suspected': Copy,
  'Awaiting document': FileClock,
  'Referred for review': Flag,
}

/** Neutral reason a claim needs attention: icon + plain text, never accusatory. */
export function FlagLabel({ flag, className }: { flag: ClaimFlag; className?: string }) {
  const Icon = icons[flag]
  return (
    <span className={cn('inline-flex items-center gap-1 text-caption text-fg', className)}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-fg-muted" />
      {flag}
    </span>
  )
}
