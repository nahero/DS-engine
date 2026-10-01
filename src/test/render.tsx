import type { ReactElement } from 'react'
import { render as renderBrowser, type RenderOptions } from 'vitest-browser-react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Wrap in `SidebarProvider` (for the app shell and sidebar). */
  sidebar?: boolean
}

/** Renders inside the providers the app mounts (`TooltipProvider`, optionally `SidebarProvider`), in a `<main>` landmark. */
export async function render(ui: ReactElement, { sidebar = false, ...options }: Options = {}) {
  return renderBrowser(
    <TooltipProvider>
      {sidebar ? <SidebarProvider>{ui}</SidebarProvider> : <main className="bg-canvas">{ui}</main>}
    </TooltipProvider>,
    options,
  )
}
