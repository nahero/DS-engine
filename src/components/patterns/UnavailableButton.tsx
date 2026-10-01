import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * A control the demo doesn't implement. `aria-disabled` (not `disabled`) keeps it focusable, so the tooltip
 * explaining why opens on focus as well as hover. Clicks do nothing.
 */
export function UnavailableButton({
  className,
  reason = 'Not available in this demo',
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick'> & { reason?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...props}
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
            className={cn('cursor-not-allowed opacity-50', className)}
          />
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
