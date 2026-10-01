import * as React from "react"
import { Bell, Search } from "lucide-react"

import { DisplayMenu } from "@/components/layout/DisplayMenu"
import { UnavailableButton } from "@/components/patterns/UnavailableButton"
import { UserAvatar } from "@/components/patterns/UserAvatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { currentUser } from "@/data/current-user"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { DisplaySettings } from "@/lib/use-display-settings"

export type BreadcrumbEntry = {
  label: string
  /** Omit on the last entry: it is the current page. */
  href?: string
}

type AppHeaderProps = Omit<React.ComponentProps<"header">, "children"> & {
  /** Last entry is the current page. */
  breadcrumb: BreadcrumbEntry[]
  displaySettings: DisplaySettings
}

export function AppHeader({
  breadcrumb,
  displaySettings,
  className,
  ...props
}: AppHeaderProps) {
  return (
    <header
      data-slot="app-header"
      className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center gap-x-stack gap-y-2 border-b border-border bg-surface px-inset py-inset md:flex-nowrap",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="shrink-0" />
        <Breadcrumb aria-label="Breadcrumb" className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumb.map((entry, index) => {
              const isLast = index === breadcrumb.length - 1
              return (
                <React.Fragment key={`${index}-${entry.label}`}>
                  <BreadcrumbItem className={isLast ? "max-w-64 min-w-16" : "max-w-40 min-w-10"}>
                    {isLast || !entry.href ? (
                      <BreadcrumbPage title={entry.label}>{entry.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={entry.href} title={entry.label}>
                        {entry.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="shrink-0" />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <search className="order-last basis-full md:order-none md:basis-auto md:w-64 lg:w-96">
        <div className="relative">
          <label htmlFor="app-header-search" className="sr-only">
            Search claims
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-muted"
          />
          <Input
            id="app-header-search"
            type="search"
            placeholder="Search claim #, policy #, policyholder"
            className="pl-8"
          />
        </div>
      </search>

      <div className="flex shrink-0 items-center gap-2 md:gap-stack">
        <UnavailableButton variant="outline" size="icon" aria-label="Notifications">
          <Bell aria-hidden="true" />
        </UnavailableButton>
        <DisplayMenu settings={displaySettings} />
        <UserAvatar name={currentUser.name} initials={currentUser.initials} />
      </div>
    </header>
  )
}
