import * as React from "react"
import {
  ChartBar,
  FileText,
  Forward,
  Inbox,
  LayoutDashboard,
  Settings,
  Shield,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  /** Awaiting-work count shown right-aligned; `countLabel` completes the accessible name. */
  count?: number
  countLabel?: string
}

type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: "Claims",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "claims-queue", label: "Claims queue", icon: Inbox, count: 128, countLabel: "awaiting" },
      { id: "my-assigned", label: "My assigned", icon: UserCheck, count: 17, countLabel: "open" },
      { id: "referred", label: "Referred", icon: Forward, count: 9, countLabel: "pending" },
    ],
  },
  {
    label: "Policies",
    items: [
      { id: "policies", label: "Policies", icon: FileText },
      { id: "policyholders", label: "Policyholders", icon: Users },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "reports", label: "Reports", icon: ChartBar },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
]

export type AppSidebarUser = {
  name: string
  role: string
  initials?: string
}

type AppSidebarProps = Omit<React.ComponentProps<typeof Sidebar>, "children"> & {
  /** Id of the current page: `overview`, `claims-queue`, `my-assigned`, `referred`, `policies`, `policyholders`, `reports`, `settings`. */
  activeItem?: string
  user?: AppSidebarUser
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length === 0 ? "?" : (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

export function AppSidebar({
  activeItem,
  user = { name: "Emily Carter", role: "Claims handler" },
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar role="complementary" aria-label="Sidebar" {...props}>
      <SidebarHeader>
        <div className="flex min-h-8 items-center gap-2 py-1.5 pr-2 pl-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-control bg-inverse text-fg-inverse"
          >
            <Shield className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label font-medium text-sidebar-foreground">ClaimDesk</span>
            <span className="truncate text-caption text-fg-muted">Claims operations</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Primary" className="flex flex-col gap-stack">
          {navGroups.map((group) => {
            const labelId = `app-sidebar-group-${group.label.toLowerCase()}`
            return (
              <SidebarGroup key={group.label} role="group" aria-labelledby={labelId}>
                <SidebarGroupLabel id={labelId}>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = item.id === activeItem
                      const hasCount = item.count !== undefined
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <a
                              href={`#${item.id}`}
                              aria-current={isActive ? "page" : undefined}
                              aria-label={hasCount ? `${item.label}, ${item.count} ${item.countLabel}` : undefined}
                            >
                              <item.icon aria-hidden="true" />
                              <span>{item.label}</span>
                            </a>
                          </SidebarMenuButton>
                          {hasCount && <SidebarMenuBadge aria-hidden="true">{item.count}</SidebarMenuBadge>}
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex min-h-8 items-center gap-2 py-1.5 pr-2 pl-2.5">
          <Avatar aria-hidden="true">
            <AvatarFallback>{user.initials ?? initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label font-medium text-sidebar-foreground" title={user.name}>
              {user.name}
            </span>
            <span className="truncate text-caption text-fg-muted" title={user.role}>
              {user.role}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
