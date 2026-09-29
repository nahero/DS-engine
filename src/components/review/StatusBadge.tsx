import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ClaimStatus } from '@/data/types'

const variants: Record<ClaimStatus, React.ComponentProps<typeof Badge>['variant']> = {
  New: 'secondary',
  'In review': 'outline',
  'Info requested': 'outline',
  Approved: 'default',
  Denied: 'destructive',
  Paid: 'secondary',
  Closed: 'outline',
  Reopened: 'outline',
}

/** Claim lifecycle status. The text label is always shown; the variant is a secondary cue. */
export function StatusBadge({ status, className }: { status: ClaimStatus; className?: string }) {
  return (
    <Badge variant={variants[status]} className={cn(status === 'Closed' && 'text-fg-muted', className)}>
      {status}
    </Badge>
  )
}
