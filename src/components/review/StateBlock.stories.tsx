import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchX } from 'lucide-react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '@/components/ui/button'
import { StateBlock } from './StateBlock'

const meta = {
  title: 'Review/StateBlock',
  component: StateBlock,
  args: {
    kind: 'empty',
    title: 'No claims yet',
    description: 'New claims appear here as soon as they are submitted.',
  },
  parameters: {
    docs: {
      description: {
        component:
          'Empty or error block: icon, what happened, why, and a next action. Errors are announced (`role="alert"`). `size` follows where it sits: `sm` inside a card, `md` for a whole region; `framed` draws the surface border when it replaces a region.',
      },
    },
  },
} satisfies Meta<typeof StateBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No claims yet')).toBeInTheDocument()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}

export const ErrorState: Story = {
  name: 'Error',
  args: {
    kind: 'error',
    title: 'Couldn’t load claims',
    description: 'The claims queue didn’t load. Check your connection and try again.',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('Couldn’t load claims')
  },
}

export const Small: Story = { args: { size: 'sm' } }

export const SmallError: Story = {
  args: { kind: 'error', size: 'sm', title: 'Couldn’t load activity', description: 'Try again in a moment.' },
}

export const Framed: Story = { args: { framed: true } }

export const FramedError: Story = {
  args: {
    kind: 'error',
    framed: true,
    title: 'Couldn’t load claim CLM-2026-004817',
    description: 'The claim didn’t load. Check your connection and try again.',
  },
}

export const WithAction: Story = {
  args: {
    framed: true,
    icon: SearchX,
    title: 'No claims match these filters',
    description: 'Try removing a filter or searching for something else.',
    action: <Button variant="outline" size="sm" onClick={fn()}>Clear filters</Button>,
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Clear filters' })
    await userEvent.tab()
    await expect(button).toHaveFocus()
  },
}

export const ErrorWithRetry: Story = {
  args: {
    kind: 'error',
    framed: true,
    title: 'Couldn’t load claims',
    description: 'The claims queue didn’t load. Check your connection and try again.',
    action: <Button variant="outline" size="sm" onClick={fn()}>Retry</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(canvas.getByRole('button', { name: 'Retry' })).toBeVisible()
  },
}

export const NoDescription: Story = { args: { description: undefined, title: 'Nothing here' } }

export const LongContent: Story = {
  args: {
    kind: 'error',
    framed: true,
    title:
      'Couldn’t load claims for Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
    description:
      'The claims service returned an unexpected response while loading this list. Nothing was changed. Check your connection and try again; if the problem continues, contact your administrator and quote the reference shown in the page footer so the request can be found in the logs.',
  },
}
