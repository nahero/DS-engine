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
 * One line; when cut off, the full text shows in a tooltip and on focus. With `wrap` the text breaks onto more lines
 * instead and is plain text with no focus stop of its own, for use inside a link or a row that is one control.
 */
export function NextAction({
  kind,
  text,
  wrap = false,
  className,
}: {
  kind: NextActionKind
  text: string
  wrap?: boolean
  className?: string
}) {
  const Icon = icons[kind]
  return (
    <span
      data-kind={kind}
      className={cn(
        'inline-flex min-w-0 gap-1.5 text-body',
        wrap ? 'items-start' : 'items-center',
        kind === 'await' ? 'text-fg-muted' : 'font-medium text-fg',
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn('size-4 shrink-0', wrap && 'mt-0.5')} />
      {wrap ? <span className="min-w-0 break-words">{text}</span> : <TruncatedText text={text} />}
    </span>
  )
}
