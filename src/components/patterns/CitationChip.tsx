import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface CitationSource {
  doc: string
  page: number
}

/** Where an extracted value came from. Names the document and page; opens that document at the cited passage. */
export function CitationChip({
  source,
  onOpen,
  className,
}: {
  source: CitationSource
  onOpen?: (source: CitationSource) => void
  className?: string
}) {
  const label = `${source.doc} p.${source.page}`
  const name = `Open ${source.doc}, page ${source.page}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge asChild variant="outline" className={cn('cursor-pointer font-semibold outline-none hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring', className)}>
          <button type="button" aria-label={name} onClick={() => onOpen?.(source)}>
            <FileText aria-hidden="true" />
            {label}
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  )
}
