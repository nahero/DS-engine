import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { CitationChip } from './CitationChip'

const meta = {
  title: 'Review/CitationChip',
  component: CitationChip,
  args: { source: { doc: 'Invoice', page: 1 }, onOpen: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Where an extracted value came from. Names the document and page (not just an icon) and opens that document at the cited passage.',
      },
    },
  },
} satisfies Meta<typeof CitationChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Open Invoice, page 1' })
    await expect(chip).toHaveTextContent('Invoice p.1')
    await userEvent.click(chip)
    await expect(args.onOpen).toHaveBeenCalledWith({ doc: 'Invoice', page: 1 })
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Open Invoice, page 1' })).toHaveFocus()
  },
}

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button'))
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent('Open Invoice, page 1'))
  },
}

export const KeyboardActivate: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await expect(args.onOpen).toHaveBeenCalledTimes(1)
    await expect(within(canvasElement).getByRole('button')).toHaveFocus()
  },
}

export const HighPage: Story = { args: { source: { doc: 'FNOL', page: 12 } } }

export const LongDocumentName: Story = {
  args: { source: { doc: 'Photo of receipt with handwritten notes from the treating physician', page: 3 } },
  decorators: [
    (Story) => (
      <div className="max-w-56">
        <Story />
      </div>
    ),
  ],
}

export const InlineGroup: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <CitationChip {...args} source={{ doc: 'Invoice', page: 1 }} />
      <CitationChip {...args} source={{ doc: 'FNOL', page: 2 }} />
      <CitationChip {...args} source={{ doc: 'Discharge', page: 1 }} />
    </div>
  ),
}
