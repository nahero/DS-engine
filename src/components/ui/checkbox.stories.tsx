import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleAlert } from 'lucide-react'
import { expect, userEvent } from 'storybook/test'
import { Checkbox } from './checkbox'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  args: { id: 'cb-default' },
  parameters: {
    docs: {
      description: {
        component: 'Radix checkbox. Always paired with a visible `<label>`. Supports checked, unchecked and indeterminate (mixed) states.',
      },
    },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

const labelClass = 'text-label text-fg'

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} />
      <label htmlFor={args.id} className={labelClass}>
        Notify the policyholder
      </label>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="cb-unchecked" />
        <label htmlFor="cb-unchecked" className={labelClass}>
          Unchecked
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb-checked" defaultChecked />
        <label htmlFor="cb-checked" className={labelClass}>
          Checked
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb-mixed" checked="indeterminate" />
        <label htmlFor="cb-mixed" className={labelClass}>
          Indeterminate: 3 of 8 claims selected
        </label>
      </div>
    </div>
  ),
}

export const Focus: Story = {
  ...Default,
  args: { id: 'cb-focus' },
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('checkbox', { name: 'Notify the policyholder' })).toHaveFocus()
  },
}

export const Toggle: Story = {
  ...Default,
  args: { id: 'cb-toggle' },
  play: async ({ canvas }) => {
    const box = canvas.getByRole('checkbox', { name: 'Notify the policyholder' })
    await userEvent.click(box)
    await expect(box).toBeChecked()
    await userEvent.keyboard(' ')
    await expect(box).not.toBeChecked()
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="cb-disabled" disabled />
        <label htmlFor="cb-disabled" className={`${labelClass} opacity-50`}>
          Disabled, unchecked
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb-disabled-checked" disabled defaultChecked />
        <label htmlFor="cb-disabled-checked" className={`${labelClass} opacity-50`}>
          Disabled, checked
        </label>
      </div>
    </div>
  ),
}

export const Invalid: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-1">
      <div className="flex items-center gap-2">
        <Checkbox id="cb-invalid" aria-invalid="true" aria-describedby="cb-invalid-error" />
        <label htmlFor="cb-invalid" className={labelClass}>
          I confirm the payout amount is correct
        </label>
      </div>
      <p id="cb-invalid-error" className="flex items-center gap-1 text-caption text-status-danger-fg">
        <CircleAlert aria-hidden="true" className="size-3.5" />
        Error: confirm the amount before approving.
      </p>
    </div>
  ),
}

export const LongLabel: Story = {
  render: () => (
    <div className="flex max-w-xs items-start gap-2">
      <Checkbox id="cb-long" className="mt-0.5" />
      <label htmlFor="cb-long" className={labelClass}>
        I confirm that the loss adjuster report, the repair estimate and the police report for Montgomery-Whitfield-Featherstonehaugh Property Holdings
        have been received and reviewed
      </label>
    </div>
  ),
}
