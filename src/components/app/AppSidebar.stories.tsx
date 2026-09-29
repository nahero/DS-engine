import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

// The sidebar is position: fixed on desktop, so it needs a provider and (for the mobile sheet) a trigger.
const withShell: Decorator = (Story) => (
  <SidebarProvider>
    <Story />
    <SidebarInset>
      <div className="flex items-center gap-2 border-b border-border p-inset">
        <SidebarTrigger />
      </div>
      <main className="p-inset">
        <h1 className="text-body text-fg-muted">Page content</h1>
      </main>
    </SidebarInset>
  </SidebarProvider>
)

const meta = {
  title: 'App/AppSidebar',
  component: AppSidebar,
  decorators: [withShell],
  args: { activeItem: 'overview' },
  argTypes: {
    activeItem: {
      control: 'select',
      options: ['overview', 'claims-queue', 'my-assigned', 'referred', 'policies', 'policyholders', 'reports', 'settings'],
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 640 },
      description: {
        component:
          'Primary navigation. shadcn `Sidebar` (offcanvas, becomes a sheet below 768px). Figma Overview `28:434`. Counts are read out as part of the link name ("Claims queue, 128 awaiting"). Ctrl/Cmd+B toggles it.',
      },
    },
  },
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const QueueActive: Story = {
  args: { activeItem: 'claims-queue' },
}

export const LongUserName: Story = {
  args: {
    user: {
      name: 'Bartholomew Featherstonehaugh-Montgomery III',
      role: 'Senior claims handler, complex liability and subrogation',
    },
  },
}

export const KeyboardFocus: Story = {
  parameters: {
    docs: { description: { story: 'Tab twice from the page start: focus lands on "Claims queue" with the visible focus ring.' } },
  },
  play: async () => {
    await userEvent.tab()
    await userEvent.tab()
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    docs: { description: { story: 'Below 768px the sidebar is a sheet opened by the header trigger. Focus is trapped while open; Esc closes it.' } },
  },
  play: async ({ canvasElement }) => {
    const trigger = await within(canvasElement).findByRole('button', { name: 'Toggle sidebar' })
    await userEvent.click(trigger)
  },
}
