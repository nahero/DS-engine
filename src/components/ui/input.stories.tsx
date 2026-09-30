import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleAlert } from 'lucide-react'
import { expect, userEvent } from 'storybook/test'
import { Input } from './input'

const labelClass = 'text-label font-medium text-fg'

const meta = {
  title: 'UI/Input',
  component: Input,
  args: { id: 'claim-number', placeholder: 'CLM-2026-000000' },
  decorators: [
    (Story) => (
      <div className="flex max-w-sm flex-col gap-1.5">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'number', 'search', 'password', 'date'] },
  },
  parameters: {
    docs: {
      description: {
        component: 'Text field at control height (follows density). Always paired with a visible `<label>`.',
      },
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <>
      <label htmlFor={args.id} className={labelClass}>
        Claim number
      </label>
      <Input {...args} />
    </>
  ),
}

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { id: 'in-text', label: 'Policyholder', type: 'text', value: 'Emily Carter' },
        { id: 'in-email', label: 'Email', type: 'email', value: 'emily.carter@example.com' },
        { id: 'in-number', label: 'Claimed amount (EUR)', type: 'number', value: '12480' },
        { id: 'in-search', label: 'Search claims', type: 'search', value: 'CLM-2026' },
        { id: 'in-date', label: 'Loss date', type: 'date', value: '2026-09-09' },
      ].map(({ id, label, type, value }) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label htmlFor={id} className={labelClass}>
            {label}
          </label>
          <Input id={id} type={type} defaultValue={value} />
        </div>
      ))}
    </div>
  ),
}

export const Empty: Story = {
  ...Default,
  args: { id: 'claim-empty', placeholder: 'Enter a claim number' },
}

export const Filled: Story = {
  ...Default,
  args: { id: 'claim-filled', defaultValue: 'CLM-2026-004821' },
}

export const Focus: Story = {
  ...Default,
  args: { id: 'claim-focus' },
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByLabelText('Claim number')).toHaveFocus()
  },
}

export const Typing: Story = {
  ...Default,
  args: { id: 'claim-typing' },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Claim number')
    await userEvent.type(input, 'CLM-2026-004821')
    await expect(input).toHaveValue('CLM-2026-004821')
  },
}

export const Disabled: Story = {
  ...Default,
  args: { id: 'claim-disabled', disabled: true, defaultValue: 'CLM-2026-004821' },
}

export const Invalid: Story = {
  render: () => (
    <>
      <label htmlFor="claim-invalid" className={labelClass}>
        Claim number
      </label>
      <Input id="claim-invalid" aria-invalid="true" aria-describedby="claim-invalid-error" defaultValue="CLM-26-4821" />
      <p id="claim-invalid-error" className="flex items-center gap-1 text-caption text-status-danger-fg">
        <CircleAlert aria-hidden="true" className="size-3.5" />
        Error: use the format CLM-2026-000000.
      </p>
    </>
  ),
}

// Long values scroll inside the field; the field never grows.
export const LongValue: Story = {
  ...Default,
  args: {
    id: 'claim-long',
    defaultValue: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
  },
}
