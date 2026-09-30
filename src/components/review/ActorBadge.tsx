import { Bot, Settings, User, UserRound, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Actor } from '@/data/types'
import { TruncatedText } from './TruncatedText'

function describe(actor: Actor): { Icon: LucideIcon; label: string } {
  switch (actor.kind) {
    case 'agent':
      return { Icon: Bot, label: 'Agent' }
    case 'person':
      return { Icon: User, label: actor.name }
    case 'system':
      return { Icon: Settings, label: 'System' }
    case 'policyholder':
      return { Icon: UserRound, label: 'Policyholder' }
  }
}

/** Who did something: agent, handler (by name), system or policyholder. Icon + text, never colour alone. Long names truncate; the full name shows in a tooltip (also on keyboard focus). */
export function ActorBadge({ actor, className }: { actor: Actor; className?: string }) {
  const { Icon, label } = describe(actor)
  return (
    <Badge
      variant={actor.kind === 'agent' ? 'secondary' : 'outline'}
      className={cn('max-w-full min-w-0 shrink font-semibold', className)}
    >
      <Icon aria-hidden="true" className="shrink-0" />
      <TruncatedText text={label} />
    </Badge>
  )
}
