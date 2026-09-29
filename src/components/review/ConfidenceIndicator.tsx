import { CircleAlert, CircleCheck, CircleDashed, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { confidenceLevel } from '@/data/claims'
import type { ConfidenceLevel } from '@/data/types'

const levels: Record<ConfidenceLevel, { Icon: LucideIcon; tone: string }> = {
  High: { Icon: CircleCheck, tone: 'text-confidence-high' },
  Medium: { Icon: CircleAlert, tone: 'text-confidence-medium' },
  Low: { Icon: TriangleAlert, tone: 'text-confidence-low' },
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
  const { Icon, tone } = levels[level]
  return (
    <span className={cn('inline-flex items-center gap-1 text-caption font-medium whitespace-nowrap', tone, className)}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">{`Confidence ${score}%, ${level.toLowerCase()}`}</span>
      <span aria-hidden="true">
        <span className="font-mono tabular-nums">{score}%</span>
        {' · '}
        {level}
      </span>
    </span>
  )
}
