import type { Meta, StoryObj } from '@storybook/react-vite'
import { weeklyVolume } from '@/data/overview'
import { ClaimsVolumeChart } from './ClaimsVolumeChart'

const meta = {
  title: 'Review/ClaimsVolumeChart',
  component: ClaimsVolumeChart,
  args: { data: weeklyVolume },
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-inset">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Stacked weekly claims by line of business (Motor, Property, Health, Travel = chart-1..4, fixed order). Total above each bar, tooltip with all four values and the total. The SVG is hidden from assistive tech; the figure carries a summary sentence and a visually hidden data table. Animation is off under reduced motion.',
      },
    },
  },
} satisfies Meta<typeof ClaimsVolumeChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Loading: Story = { args: { state: 'loading' } }

export const Empty: Story = { args: { state: 'empty', data: [] } }

export const ErrorState: Story = { name: 'Error', args: { state: 'error' } }

export const SingleWeek: Story = { args: { data: weeklyVolume.slice(-1) } }

/** ×40 volumes: checks Y-axis width and thousands separators. */
export const LargeValues: Story = {
  args: {
    data: weeklyVolume.map((r) => ({
      week: r.week,
      Motor: r.Motor * 40,
      Property: r.Property * 40,
      Health: r.Health * 40,
      Travel: r.Travel * 40,
    })),
  },
}
