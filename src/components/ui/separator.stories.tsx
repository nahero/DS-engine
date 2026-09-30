import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator } from './separator'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    docs: {
      description: {
        component: 'Hairline divider. Decorative by default (hidden from assistive tech); set `decorative={false}` only when it separates regions that need announcing.',
      },
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-label font-medium text-fg">CLM-2026-004821</h2>
        <p className="text-caption text-fg-muted">Motor · Emily Carter</p>
      </div>
      <Separator {...args} className="my-3" />
      <p className="text-body text-fg">Rear-end collision, reported 09 Sep 2026.</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-5 items-center gap-3 text-body text-fg">
      <span>Claims</span>
      <Separator {...args} orientation="vertical" />
      <span>Policies</span>
      <Separator {...args} orientation="vertical" />
      <span>Reports</span>
    </div>
  ),
}

export const Semantic: Story = {
  render: (args) => (
    <div className="max-w-sm text-body text-fg">
      <p>Claimant details</p>
      <Separator {...args} decorative={false} className="my-3" aria-label="Claimant details end" />
      <p>Payout details</p>
    </div>
  ),
}
