import type { Meta, StoryObj } from '@storybook/react-vite'
import { Overview } from './Overview'

const meta = {
  title: 'Screens/Overview',
  component: Overview,
  // The app shell supplies <main>; stories stand in for it so the page has a landmark.
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-canvas">
        <Story />
      </main>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Claims operations landing page. `state` drives every child: loading skeletons, empty (zero/missing KPIs, empty lists and chart), error (chart and lists fail, KPIs still render), stale (inline "Updated 3 h ago" notice with Refresh).',
      },
    },
  },
} satisfies Meta<typeof Overview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Loading: Story = { args: { state: 'loading' } }
export const Empty: Story = { args: { state: 'empty' } }
export const Error: Story = { args: { state: 'error' } }
export const Stale: Story = { args: { state: 'stale' } }

/** 375px viewport: KPIs wrap to two columns, chart and lists stack, no horizontal scroll. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
