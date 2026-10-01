import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import type { DisplaySettings } from '@/lib/use-display-settings'
import { useMockDisplaySettings } from './use-mock-display-settings'
import { DisplayMenu } from './DisplayMenu'

function MenuWithSettings() {
  const settings = useMockDisplaySettings()
  return <DisplayMenu settings={settings} />
}

const withPage: Decorator = (Story) => (
  <main className="flex min-h-96 justify-end p-inset">
    <h1 className="sr-only">Display menu</h1>
    <Story />
  </main>
)

const meta = {
  title: 'Layout/DisplayMenu',
  component: DisplayMenu,
  decorators: [withPage],
  args: { settings: undefined as unknown as DisplaySettings },
  render: () => <MenuWithSettings />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Theme, brand and density switcher for the running app. Not in Figma: it exists to demo the token system. The app wires it to `useDisplaySettings`.',
      },
    },
  },
} satisfies Meta<typeof DisplayMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  parameters: {
    a11y: {
      config: {
        // Radix false positives for a modal menu: it aria-hides the page (trigger included) while focus is trapped
        // in the menu, and its scrollable content only holds roving-tabindex items (tabindex -1).
        rules: [
          { id: 'aria-hidden-focus', enabled: false },
          { id: 'scrollable-region-focusable', enabled: false },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const trigger = await within(canvasElement).findByRole('button', { name: 'Display settings' })
    await userEvent.click(trigger)
  },
}
