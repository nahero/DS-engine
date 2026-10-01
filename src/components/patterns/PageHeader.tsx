import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Screen title row: the one h1 size for every screen, an optional subtitle and page-level actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
  titleClassName,
  titleProps,
  badges,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  /** e.g. `font-mono` for a claim number. */
  titleClassName?: string
  /** Ref or tabIndex for the h1 (focus target). */
  titleProps?: Omit<ComponentProps<'h1'>, 'children' | 'className'>
  /** Status badges shown next to the title. */
  badges?: ReactNode
  className?: string
}) {
  const heading = (
    <h1 {...titleProps} className={cn('text-heading-md font-medium tracking-tight text-fg', titleClassName)}>
      {title}
    </h1>
  )
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-stack gap-y-3', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {badges ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {heading}
            {badges}
          </div>
        ) : (
          heading
        )}
        {subtitle && <p className="text-body text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-stack">{actions}</div>}
    </div>
  )
}
