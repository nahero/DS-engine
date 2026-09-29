import * as React from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Claim } from '@/data/types'
import { countNotHighConfidence } from './queue-utils'

/**
 * Actions for the selected claims. Renders nothing when nothing is selected.
 * Approve is disabled, with the reason as visible text, unless every selected claim is High confidence.
 */
export function BulkBar({
  selected,
  handlers,
  onApprove,
  onAssign,
  onClear,
}: {
  selected: Claim[]
  handlers: string[]
  onApprove: () => void
  onAssign: (handler: string) => void
  onClear: () => void
}) {
  const noteId = React.useId()
  if (selected.length === 0) return null

  const blocked = countNotHighConfidence(selected)
  const note =
    blocked === 0
      ? 'Bulk approve only for High confidence'
      : `${blocked} selected ${blocked === 1 ? 'isn’t' : 'aren’t'} High confidence`

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-x-stack gap-y-2 rounded-surface border border-border bg-subtle p-cell"
    >
      <p className="text-body font-medium text-fg tabular-nums">{selected.length} selected</p>
      <Button size="sm" disabled={blocked > 0} aria-describedby={noteId} onClick={onApprove}>
        Approve {selected.length}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            Assign
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {handlers.map((h) => (
            <DropdownMenuItem key={h} onSelect={() => onAssign(h)}>
              {h}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <p id={noteId} className="flex items-center gap-2 text-body text-fg-muted">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        {note}
      </p>
      <Button size="sm" variant="ghost" className="ml-auto" onClick={onClear}>
        Clear selection
      </Button>
    </div>
  )
}
