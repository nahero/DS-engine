import { BellRing, Banknote, FileCheck, Hourglass, Keyboard, ListChecks, Phone, Scale, Send, type LucideIcon } from 'lucide-react'
import { TruncatedText } from '@/components/patterns/TruncatedText'
import { cn } from '@/lib/utils'
import type { NextActionKind } from '@/lib/worklist'

const icons: Record<NextActionKind, LucideIcon> = {
  'review-fields': ListChecks,
  'enter-fields': Keyboard,
  decide: Scale,
  'senior-approval': Send,
  'first-contact': Phone,
  'release-payment': Banknote,
  'review-new-info': FileCheck,
  chase: BellRing,
  await: Hourglass,
}

/**
 * The next step on a claim as a verb phrase with an icon. Waiting (`await`) is muted: nothing to do yet.
 * One line; when cut off, the full text shows in a tooltip and on focus.
 */
export function NextAction({ kind, text, className }: { kind: NextActionKind; text: string; className?: string }) {
  const Icon = icons[kind]
  return (
    <span
      data-kind={kind}
      className={cn('inline-flex min-w-0 items-center gap-1.5 text-body', kind === 'await' ? 'text-fg-muted' : 'font-medium text-fg', className)}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <TruncatedText text={text} />
    </span>
  )
}
