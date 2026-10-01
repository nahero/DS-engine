import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { getClaim } from '@/data/claims'
import type { Claim } from '@/data/types'
import { BulkBar } from './BulkBar'

const pick = (...ids: string[]): Claim[] => ids.map((id) => getClaim(`CLM-2026-${id}`)!)
// 004803 = 96% High · 004799 = 93% High · 004821 = 52% Low · 004819 = no score
const high = pick('004803', '004799')
const withLow = pick('004803', '004821')

const meta = {
  title: 'Claims/BulkBar',
  component: BulkBar,
  args: {
    selected: high,
    handlers: ['Emily Carter', 'Rachel Morgan', 'Daniel Brooks'],
    onApprove: fn(),
    onAssign: fn(),
    onClear: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Actions for the selected claims. Renders nothing when nothing is selected. Approve is disabled, with the reason as visible text, unless every selected claim is High confidence.',
      },
    },
  },
} satisfies Meta<typeof BulkBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('2 selected')).toBeInTheDocument()
    await expect(canvas.getByText('Bulk approve only for High confidence')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Approve 2' })).toBeEnabled()
  },
}

/** Rule: one Low-confidence row blocks Approve, and the reason is visible text (and the button's description). */
export const BlockedByLowConfidence: Story = {
  args: { selected: withLow },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const approve = canvas.getByRole('button', { name: 'Approve 2' })
    await expect(approve).toBeDisabled()
    await expect(canvas.getByText(/1 selected isn.t High confidence/)).toBeVisible()
    await expect(approve).toHaveAccessibleDescription(/isn.t High confidence/)
    await expect(args.onApprove).not.toHaveBeenCalled()
  },
}

export const BlockedByMissingScore: Story = {
  args: { selected: pick('004803', '004819', '004821') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/2 selected aren.t High confidence/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Approve 3' })).toBeDisabled()
  },
}

export const OneSelected: Story = {
  args: { selected: pick('004803') },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Approve 1' })).toBeEnabled()
  },
}

/** Nothing selected: the bar is not rendered at all. */
export const NothingSelected: Story = {
  args: { selected: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Approve 2' })).toHaveFocus()
  },
}

/** 25 selected (a full page): the count and button label stay on one line each. */
export const ManySelected: Story = {
  args: { selected: Array.from({ length: 25 }, () => high[0]) },
}

export const LongHandlerList: Story = {
  args: {
    handlers: Array.from({ length: 24 }, (_, i) => `Maximilian Alexander von Hohenzollern-Sigmaringen ${i + 1}`),
  },
}

export const Narrow: Story = {
  args: { selected: withLow },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
}
