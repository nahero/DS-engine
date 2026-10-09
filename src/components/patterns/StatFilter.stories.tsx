import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { StatFilter } from './StatFilter'

const meta = {
  title: 'Patterns/StatFilter',
  component: StatFilter,
  args: { label: 'Ready for you', count: 6, pressed: false, onPressedChange: fn() },
  argTypes: { tone: { control: 'inline-radio', options: ['default', 'danger', 'warning'] } },
  decorators: [
    (Story, context) =>
      context.name === 'Strip' ? (
        <Story />
      ) : (
        <div className="max-w-56">
          <Story />
        </div>
      ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A count that is also a filter: a toggle button (`aria-pressed`) with a large number and a label. `tone` adds an icon beside the label (danger: overdue, warning: due today); the label always carries the meaning. A count of 0 stays operable.',
      },
    },
  },
} satisfies Meta<typeof StatFilter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Pressed: Story = {
  args: { pressed: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '6 Ready for you' })).toHaveAttribute('aria-pressed', 'true')
  },
}

// Tab to the button: visible focus ring.
export const Focus: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: '6 Ready for you' })).toHaveFocus()
  },
}

export const Disabled: Story = { args: { disabled: true } }

/** 0 is shown as "0" and the filter still toggles: it leads to an empty list, not a dead control. */
export const Zero: Story = {
  args: { count: 0, label: 'Overdue', tone: 'danger' },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: '0 Overdue' })
    await userEvent.click(button)
    await expect(args.onPressedChange).toHaveBeenCalledWith(true)
  },
}

export const Danger: Story = { args: { label: 'Overdue', count: 3, tone: 'danger' } }
export const DangerPressed: Story = { args: { label: 'Overdue', count: 3, tone: 'danger', pressed: true } }
export const Warning: Story = { args: { label: 'Due today', count: 2, tone: 'warning' } }
export const WarningPressed: Story = { args: { label: 'Due today', count: 2, tone: 'warning', pressed: true } }

/** Long label wraps inside the button; the count stays on its own line. */
export const LongContent: Story = {
  args: { label: 'Waiting on policyholders, providers and senior approvers', count: 1284 },
  decorators: [
    (Story) => (
      <div className="w-44">
        <Story />
      </div>
    ),
  ],
}

/** The four counts of the "My assigned" screen, one pressed. */
export const Strip: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-stack lg:grid-cols-4">
      <StatFilter label="Overdue" count={3} tone="danger" pressed onPressedChange={fn()} />
      <StatFilter label="Due today" count={2} tone="warning" pressed={false} onPressedChange={fn()} />
      <StatFilter label="Ready for you" count={6} pressed={false} onPressedChange={fn()} />
      <StatFilter label="Waiting on others" count={3} pressed={false} onPressedChange={fn()} />
    </div>
  ),
}
