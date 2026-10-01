import { useRef, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsTruncated } from '@/hooks/use-truncated'
import { cn } from '@/lib/utils'

/**
 * One line with an ellipsis. When (and only when) it is cut off, it takes focus and shows the full text in a tooltip,
 * so keyboard users get the value too. The full text is always in the DOM, so screen readers read it whole.
 */
export function TruncatedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const truncated = useIsTruncated(ref, text)
  const [open, setOpen] = useState(false)
  return (
    <TooltipProvider>
      <Tooltip open={truncated && open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span
            ref={ref}
            tabIndex={truncated ? 0 : undefined}
            className={cn('block truncate rounded-inner outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring', className)}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
