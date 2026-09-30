import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppShell } from './AppShell'
import { useMockDisplaySettings } from './use-mock-display-settings'
import { routes } from '@/lib/routes'

const Placeholder = () => (
  <div className="flex flex-col gap-stack p-inset">
    <h1 className="text-heading-md font-semibold text-fg">Overview</h1>
    <p className="max-w-prose text-body text-fg-muted">
      Placeholder page content. Tab from the top: the skip link comes first, then the sidebar, header, and this area.
    </p>
    <div className="grid gap-stack sm:grid-cols-3">
      {['Awaiting review', 'Assigned to me', 'Referred'].map((label) => (
        <div key={label} className="flex flex-col gap-1 rounded-surface border border-border bg-surface p-inset">
          <span className="text-caption text-fg-muted">{label}</span>
          <span className="text-heading-md font-semibold tabular-nums text-fg">--</span>
        </div>
      ))}
    </div>
  </div>
)

// Stories use local display state so the shell can't fight the Storybook toolbar; the app itself omits the prop.
function ShellWithMockSettings(props: React.ComponentProps<typeof AppShell>) {
  const settings = useMockDisplaySettings()
  return <AppShell {...props} displaySettings={settings} />
}

const meta = {
  title: 'App/AppShell',
  component: AppShell,
  render: (args) => <ShellWithMockSettings {...args} />,
  args: {
    activeItem: 'overview',
    breadcrumb: [{ label: 'Claims', href: routes.queue }, { label: 'Overview' }],
    children: <Placeholder />,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 640 },
      description: {
        component:
          'Sidebar + header + main landmark. In the app the Display menu is wired to `useDisplaySettings` (applies to <html>, persists in localStorage). In these stories the menu holds local state only: use the Storybook toolbar for theme, brand and density.',
      },
    },
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Compact: Story = {
  globals: { density: 'compact' },
  parameters: {
    docs: { description: { story: 'Compact density: controls 32px, tighter inset and stack. Also switchable from the Density toolbar or the Display menu.' } },
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}
