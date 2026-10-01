import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TruncatedText } from './TruncatedText'

const long = 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC'

const meta = {
  title: 'Patterns/TruncatedText',
  component: TruncatedText,
  args: { text: 'Sarah Mitchell', className: 'text-body text-fg' },
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'One line with an ellipsis. Only when it is cut off does it take focus and show the full text in a tooltip. The full text is always in the DOM.',
      },
    },
  },
} satisfies Meta<typeof TruncatedText>

export default meta
type Story = StoryObj<typeof meta>

/** Fits: not focusable, no tooltip. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText('Sarah Mitchell')
    await expect(text).not.toHaveAttribute('tabindex')
  },
}

/** Cut off: a tab stop that reveals the full value in a tooltip. */
export const Truncated: Story = {
  args: { text: long },
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText(long)
    await waitFor(() => expect(text).toHaveAttribute('tabindex', '0'))
    await userEvent.tab()
    await expect(text).toHaveFocus()
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent(long))
  },
}

export const Focus: Story = {
  args: { text: long },
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText(long)
    await waitFor(() => expect(text).toHaveAttribute('tabindex', '0'))
    await userEvent.tab()
    await expect(text).toHaveFocus()
  },
}

export const Hover: Story = {
  args: { text: long },
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText(long)
    await waitFor(() => expect(text).toHaveAttribute('tabindex', '0'))
    await userEvent.hover(text)
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent(long))
  },
}

/** An unbroken string with no spaces still truncates. */
export const LongUnbroken: Story = {
  args: { text: 'CLM-2026-004817-CLM-2026-004817-CLM-2026-004817-CLM-2026-004817' },
}

export const Empty: Story = { args: { text: '' } }
