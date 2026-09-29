import { CircleAlert, CircleCheck, CircleDashed, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { confidenceLevel } from '@/data/claims'
import type { ConfidenceLevel } from '@/data/types'

// Marks use the confidence colours (3:1 non-text); text uses status foregrounds (4.5:1).
const levels: Record<ConfidenceLevel, { Icon: LucideIcon; mark: string; text: string }> = {
  High: { Icon: CircleCheck, mark: 'text-confidence-high', text: 'text-status-success-fg' },
  Medium: { Icon: CircleAlert, mark: 'text-confidence-medium', text: 'text-status-warning-fg' },
  Low: { Icon: TriangleAlert, mark: 'text-confidence-low', text: 'text-status-danger-fg' },
}

/** Agent confidence as icon + number + label (`94% · High`). Missing score reads "No score", never 0%. Colour is a secondary cue. */
export function ConfidenceIndicator({ score, className }: { score: number | null; className?: string }) {
  if (score === null) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-caption whitespace-nowrap text-fg-muted', className)}>
        <CircleDashed aria-hidden="true" className="size-3.5 shrink-0" />
        No score
      </span>
    )
  }

  const level = confidenceLevel(score)
  const { Icon, mark, text } = levels[level]
  return (
    <span className={cn('inline-flex items-center gap-1 text-caption font-medium whitespace-nowrap', text, className)}>
      <Icon aria-hidden="true" className={cn('size-3.5 shrink-0', mark)} />
      <span className="sr-only">{`Confidence ${score}%, ${level.toLowerCase()}`}</span>
      <span aria-hidden="true">
        <span className="font-mono tabular-nums">{score}%</span>
        {' · '}
        {level}
      </span>
    </span>
  )
}
