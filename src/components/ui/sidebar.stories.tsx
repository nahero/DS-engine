import type { Meta, StoryObj } from '@storybook/react-vite'
import { Forward, Inbox, LayoutDashboard, Settings, UserCheck } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
} from './sidebar'

type NavItem = { id: string; label: string; icon: typeof Inbox; count?: number; countLabel?: string }

const items: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'queue', label: 'Claims queue', icon: Inbox, count: 128, countLabel: 'awaiting' },
  { id: 'assigned', label: 'My assigned', icon: UserCheck, count: 17, countLabel: 'open' },
  { id: 'referred', label: 'Referred', icon: Forward, count: 9, countLabel: 'pending' },
]

function Nav({ activeId = 'queue', longLabel }: { activeId?: string; longLabel?: boolean }) {
  return (
    <>
      <SidebarHeader>
        <span className="px-2 text-label font-medium text-sidebar-foreground">ClaimDesk</span>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Primary">
          <SidebarGroup>
            <SidebarGroupLabel>Claims</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={item.id === activeId} tooltip={item.label}>
                      <a
                        href={`#${item.id}`}
                        aria-current={item.id === activeId ? 'page' : undefined}
                        aria-label={item.count !== undefined ? `${item.label}, ${item.count} ${item.countLabel}` : undefined}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{longLabel && item.id === 'assigned' ? 'Claims assigned to me and my team for second review' : item.label}</span>
                      </a>
                    </SidebarMenuButton>
                    {item.count !== undefined && <SidebarMenuBadge aria-hidden="true">{item.count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Settings">
                    <a href="#settings">
                      <Settings aria-hidden="true" />
                      <span>Settings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
    </>
  )
}

// The sidebar is position: fixed on desktop and becomes a sheet below 768px, so every story needs a provider and (for the sheet) a trigger.
const meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 640 },
      description: {
        component:
          'shadcn sidebar. `collapsible="offcanvas"` slides away, `collapsible="icon"` shrinks to icons with tooltips, and below 768px it becomes a sheet. The active item carries `aria-current="page"`; counts are folded into the link name. Ctrl/Cmd+B toggles it.',
      },
    },
  },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <SidebarProvider>
      <Sidebar {...args}>
        <Nav />
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b border-border p-inset">
          <SidebarTrigger />
        </div>
        <main className="p-inset">
          <h1 className="text-body text-fg-muted">Page content</h1>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
}

export const Collapsed: Story = {
  render: (args) => (
    <SidebarProvider defaultOpen={false}>
      <Sidebar {...args} collapsible="icon">
        <Nav />
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b border-border p-inset">
          <SidebarTrigger />
        </div>
        <main className="p-inset">
          <h1 className="text-body text-fg-muted">Page content</h1>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
}

export const OtherItemActive: Story = {
  render: (args) => (
    <SidebarProvider>
      <Sidebar {...args}>
        <Nav activeId="referred" />
      </Sidebar>
      <SidebarInset>
        <main className="p-inset">
          <h1 className="text-body text-fg-muted">Referred claims</h1>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
}

export const Loading: Story = {
  render: (args) => (
    <SidebarProvider>
      <Sidebar {...args}>
        <SidebarContent>
          <SidebarGroup aria-busy="true">
            <div role="status" className="sr-only">
              Loading navigation
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 5 }, (_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="p-inset">
          <h1 className="text-body text-fg-muted">Loading</h1>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
}

export const Empty: Story = {
  render: (args) => (
    <SidebarProvider>
      <Sidebar {...args}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Saved views</SidebarGroupLabel>
            <SidebarGroupContent>
              <p className="px-2 text-caption text-fg-muted">No saved views yet. Save a filter from the claims queue to pin it here.</p>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="p-inset">
          <h1 className="text-body text-fg-muted">Claims queue</h1>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
}

export const LongLabel: Story = {
  render: (args) => (
    <SidebarProvider>
      <Sidebar {...args}>
        <Nav longLabel />
      </Sidebar>
      <SidebarInset>
        <main className="p-inset">
          <h1 className="text-body text-fg-muted">Page content</h1>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
}
