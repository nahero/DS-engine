import type { Meta, StoryObj } from '@storybook/react-vite'
import { Info } from 'lucide-react'
import { expect, screen, userEvent } from 'storybook/test'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  decorators: [
    (Story) => (
      <div className="flex min-h-32 items-center justify-center">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Short supplementary label. Opens on hover and on keyboard focus, closes on Esc. Never the only place critical information lives; the trigger keeps its own accessible name.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="outline">Export</Button>
      </TooltipTrigger>
      <TooltipContent>Export the current view as CSV</TooltipContent>
    </Tooltip>
  ),
}

// Tab to the trigger: the tooltip opens on focus.
export const OnFocus: Story = {
  ...Default,
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Export' })).toHaveFocus()
    const tip = await screen.findByRole('tooltip')
    await expect(tip).toHaveTextContent('Export the current view as CSV')
  },
}

export const IconOnlyTrigger: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Claim details">
          <Info />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Claim details</TooltipContent>
    </Tooltip>
  ),
  play: async () => {
    await userEvent.tab()
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Claim details')
  },
}

export const Sides: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} {...args}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Tooltip on the {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}

// A disabled button gets no focus or pointer events, so the tooltip would never open. Use `aria-disabled` (see UnavailableButton).
export const Disabled: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="outline" aria-disabled="true" className="opacity-50" onClick={(e) => e.preventDefault()}>
          Approve
        </Button>
      </TooltipTrigger>
      <TooltipContent>Needs a second approver above €25,000.00</TooltipContent>
    </Tooltip>
  ),
  play: async () => {
    await userEvent.tab()
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Needs a second approver above €25,000.00')
  },
}

export const LongContent: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="outline">Policyholder</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC, policy POL-PRP-2026-0048213, renewed 01 Jan 2026.
      </TooltipContent>
    </Tooltip>
  ),
  play: async () => {
    await userEvent.tab()
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Montgomery-Whitfield')
  },
}
