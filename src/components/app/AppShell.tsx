import * as React from "react"

import { AppHeader, type BreadcrumbEntry } from "@/components/app/AppHeader"
import { AppSidebar } from "@/components/app/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useDisplaySettings, type DisplaySettings } from "@/lib/use-display-settings"

type AppShellProps = {
  /** Id of the current sidebar item, see AppSidebar. */
  activeItem?: string
  /** Last entry is the current page. */
  breadcrumb: BreadcrumbEntry[]
  children?: React.ReactNode
  /** Override the display settings (stories, tests). Omitted: the shell uses `useDisplaySettings`, which applies to <html> and persists. */
  displaySettings?: DisplaySettings
}

export function AppShell({ displaySettings, ...props }: AppShellProps) {
  return displaySettings ? (
    <Shell displaySettings={displaySettings} {...props} />
  ) : (
    <ConnectedShell {...props} />
  )
}

function ConnectedShell(props: Omit<AppShellProps, "displaySettings">) {
  const displaySettings = useDisplaySettings()
  return <Shell displaySettings={displaySettings} {...props} />
}

function Shell({
  activeItem,
  breadcrumb,
  children,
  displaySettings,
}: AppShellProps & { displaySettings: DisplaySettings }) {
  return (
    <SidebarProvider>
      <nav aria-label="Skip links">
        <a
          href="#main"
          className="sr-only rounded-control bg-surface px-3 py-2 text-label font-medium text-fg ring-3 ring-ring focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
        >
          Skip to content
        </a>
      </nav>
      <AppSidebar activeItem={activeItem} />
      <SidebarInset>
        <AppHeader breadcrumb={breadcrumb} displaySettings={displaySettings} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
