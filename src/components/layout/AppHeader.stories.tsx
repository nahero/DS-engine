import * as React from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { DisplaySettings } from '@/lib/use-display-settings'
import { useMockDisplaySettings } from './use-mock-display-settings'
import { AppHeader } from './AppHeader'
import { routes } from '@/lib/routes'

function HeaderWithSettings(props: React.ComponentProps<typeof AppHeader>) {
  const settings = useMockDisplaySettings()
  return <AppHeader {...props} displaySettings={settings} />
}

const withProvider: Decorator = (Story) => (
  <SidebarProvider>
    <div className="w-full">
      <Story />
      <main className="p-inset">
        <h1 className="text-body text-fg-muted">Page content scrolls under the sticky header.</h1>
      </main>
    </div>
  </SidebarProvider>
)

const meta = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  decorators: [withProvider],
  args: {
    breadcrumb: [{ label: 'Claims', href: routes.queue }, { label: 'Overview' }],
    displaySettings: undefined as unknown as DisplaySettings,
  },
  render: (args) => <HeaderWithSettings {...args} />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sticky top bar: sidebar trigger, breadcrumb, search, notifications, display menu, user avatar. Figma Overview `28:436`. On narrow widths the search drops to its own row.',
      },
    },
  },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LongBreadcrumb: Story = {
  args: {
    breadcrumb: [
      { label: 'Claims', href: routes.queue },
      { label: 'Motor vehicle and third-party liability', href: routes.queue },
      { label: 'Referred to underwriting review', href: '#referred' },
      { label: 'Policyholder: Bartholomew Featherstonehaugh-Montgomery', href: '#policyholders' },
      { label: 'CLM-2026-0048213 supplementary assessment' },
    ],
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}
