import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleAlert } from 'lucide-react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from './select'

const labelClass = 'text-label font-medium text-fg'

const statusOptions = ['New', 'In review', 'Info requested', 'Approved', 'Denied', 'Paid', 'Closed', 'Reopened']

function StatusItems() {
  return statusOptions.map((s) => (
    <SelectItem key={s} value={s}>
      {s}
    </SelectItem>
  ))
}

const meta = {
  title: 'UI/Select',
  component: Select,
  decorators: [
    (Story) => (
      <div className="flex w-64 flex-col gap-1.5">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Radix select at control height. Always paired with a visible `<label>` (`htmlFor` = trigger `id`). Arrow keys, Home/End and typeahead come from Radix.',
      },
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <>
      <label htmlFor="status-default" className={labelClass}>
        Status
      </label>
      <Select {...args} defaultValue="In review">
        <SelectTrigger id="status-default" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <StatusItems />
        </SelectContent>
      </Select>
    </>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <>
      <label htmlFor="status-size-default" className={labelClass}>
        Status (default)
      </label>
      <Select {...args} defaultValue="New">
        <SelectTrigger id="status-size-default" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <StatusItems />
        </SelectContent>
      </Select>
      <label htmlFor="status-size-sm" className={`${labelClass} mt-2`}>
        Status (small)
      </label>
      <Select {...args} defaultValue="New">
        <SelectTrigger id="status-size-sm" size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <StatusItems />
        </SelectContent>
      </Select>
    </>
  ),
}

// Empty: nothing chosen yet, the placeholder shows.
export const Placeholder: Story = {
  render: (args) => (
    <>
      <label htmlFor="handler-empty" className={labelClass}>
        Handler
      </label>
      <Select {...args}>
        <SelectTrigger id="handler-empty" className="w-full">
          <SelectValue placeholder="Select a handler" />
        </SelectTrigger>
        <SelectContent>
          {['Emily Carter', 'Rachel Morgan', 'Daniel Brooks'].map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  ),
}

export const Grouped: Story = {
  render: (args) => (
    <>
      <label htmlFor="handler-grouped" className={labelClass}>
        Assign to
      </label>
      <Select {...args} defaultValue="Emily Carter">
        <SelectTrigger id="handler-grouped" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>My team</SelectLabel>
            <SelectItem value="Emily Carter">Emily Carter</SelectItem>
            <SelectItem value="Rachel Morgan">Rachel Morgan</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Underwriting</SelectLabel>
            <SelectItem value="Daniel Brooks">Daniel Brooks</SelectItem>
            <SelectItem value="Jessica Turner">Jessica Turner</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  ),
}

export const Focus: Story = {
  ...Default,
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveFocus()
  },
}

export const Disabled: Story = {
  render: (args) => (
    <>
      <label htmlFor="status-disabled" className={labelClass}>
        Status
      </label>
      <Select {...args} defaultValue="Paid" disabled>
        <SelectTrigger id="status-disabled" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <StatusItems />
        </SelectContent>
      </Select>
    </>
  ),
}

export const Invalid: Story = {
  render: (args) => (
    <>
      <label htmlFor="handler-invalid" className={labelClass}>
        Handler
      </label>
      <Select {...args}>
        <SelectTrigger id="handler-invalid" className="w-full" aria-invalid="true" aria-describedby="handler-invalid-error">
          <SelectValue placeholder="Select a handler" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Emily Carter">Emily Carter</SelectItem>
          <SelectItem value="Rachel Morgan">Rachel Morgan</SelectItem>
        </SelectContent>
      </Select>
      <p id="handler-invalid-error" className="flex items-center gap-1 text-caption text-status-danger-fg">
        <CircleAlert aria-hidden="true" className="size-3.5" />
        Error: assign a handler before approving.
      </p>
    </>
  ),
}

// The trigger truncates the selected value (line-clamp); the list options wrap at the content width.
export const LongOption: Story = {
  render: (args) => (
    <>
      <label htmlFor="policyholder-long" className={labelClass}>
        Policyholder
      </label>
      <Select {...args} defaultValue="long">
        <SelectTrigger id="policyholder-long" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="long">Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC</SelectItem>
          <SelectItem value="short">Sarah Mitchell</SelectItem>
        </SelectContent>
      </Select>
    </>
  ),
}

export const Open: Story = {
  ...Default,
  parameters: {
    a11y: {
      config: {
        // Radix false positives for a modal select: it aria-hides the page (trigger included) while focus is trapped in the list,
        // and its scrollable viewport only holds roving-tabindex options (tabindex -1).
        rules: [
          { id: 'aria-hidden-focus', enabled: false },
          { id: 'scrollable-region-focusable', enabled: false },
        ],
      },
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Status' }))
    const option = await screen.findByRole('option', { name: 'Info requested' })
    await waitFor(() => expect(option).toBeVisible())
    await expect(screen.getAllByRole('option')).toHaveLength(statusOptions.length)
  },
}
