import { Avatar, AvatarFallback } from '@/components/ui/avatar'

/** Initials avatar. Decorative when the name is written next to it; otherwise it is an image named after the user. */
export function UserAvatar({
  name,
  initials,
  decorative = false,
  className,
}: {
  name: string
  initials: string
  decorative?: boolean
  className?: string
}) {
  return (
    <Avatar
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name })}
    >
      <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
    </Avatar>
  )
}
