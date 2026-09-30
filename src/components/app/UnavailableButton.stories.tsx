import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download } from 'lucide-react'
import { expect, screen, userEvent } from 'storybook/test'
import { UnavailableButton } from './UnavailableButton'

const meta = {
  title: 'App/UnavailableButton',
  component: UnavailableButton,
  args: { children: 'Export report' },
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A control the demo does not implement. It uses `aria-disabled` (not `disabled`) so it stays focusable and the tooltip explaining why opens on keyboard focus as well as hover. Clicks do nothing.',
      },
    },
  },
} satisfies Meta<typeof UnavailableButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Tab to the button: the tooltip opens on focus and says why it is unavailable.
export const Focus: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Export report' })).toHaveFocus()
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Not available in this demo')
  },
}

export const CustomReason: Story = {
  args: { reason: 'Payouts above €25,000.00 are disabled in this demo', children: 'Approve payout' },
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Approve payout' })).toHaveFocus()
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Payouts above €25,000.00 are disabled in this demo')
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <UnavailableButton>Approve</UnavailableButton>
      <UnavailableButton variant="outline">
        <Download /> Export
      </UnavailableButton>
      <UnavailableButton variant="ghost">Skip</UnavailableButton>
      <UnavailableButton variant="destructive">Reject</UnavailableButton>
      <UnavailableButton size="icon" variant="outline" aria-label="Download report">
        <Download />
      </UnavailableButton>
    </div>
  ),
}

export const LongLabel: Story = {
  render: () => {
    const label = 'Approve all 1,000 high-confidence submissions from Northwind Mutual Insurance Holdings'
    return (
      <div className="max-w-xs">
        <UnavailableButton className="max-w-full" title={label}>
          <span className="truncate">{label}</span>
        </UnavailableButton>
      </div>
    )
  },
}
