import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent } from 'storybook/test'
import { needsAttention } from '@/data/overview'
import { NeedsAttentionList } from './NeedsAttentionList'

const meta = {
  title: 'Claims/NeedsAttentionList',
  component: NeedsAttentionList,
  args: { items: needsAttention, onRetry: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Claims sorted by SLA and risk flags. Each row is one link to the claim (claim #, SLA, policyholder, reason). Hover any row to see its hover state.',
      },
    },
  },
} satisfies Meta<typeof NeedsAttentionList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Focus ring comes from keyboard focus (:focus-visible), so the play function tabs to the first row.
export const Focus: Story = {
  play: async () => {
    await userEvent.tab()
  },
}

export const Loading: Story = { args: { state: 'loading' } }

export const Empty: Story = { args: { state: 'empty', items: [] } }

export const ErrorState: Story = { name: 'Error', args: { state: 'error' } }

export const LongContent: Story = {
  args: {
    items: [
      {
        id: 'CLM-2026-004819',
        policyholder: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
        flag: 'Loss date outside policy period',
        slaDays: -128,
      },
      { id: 'CLM-2026-004817', policyholder: 'Sarah Mitchell', flag: 'Above authority limit', slaDays: null },
      ...needsAttention.slice(3),
    ],
  },
}

/** 20 items: the card grows with its content; large sets belong on the queue page (link in the footer). */
export const ManyItems: Story = {
  args: {
    items: Array.from({ length: 20 }, (_, i) => ({
      ...needsAttention[i % needsAttention.length],
      id: `CLM-2026-${String(4800 + i).padStart(6, '0')}`,
    })),
  },
}
