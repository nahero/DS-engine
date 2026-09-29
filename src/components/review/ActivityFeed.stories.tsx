import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent } from 'storybook/test'
import { recentActivity } from '@/data/overview'
import { ActivityFeed } from './ActivityFeed'

const meta = {
  title: 'Review/ActivityFeed',
  component: ActivityFeed,
  args: { events: recentActivity, onRetry: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Latest agent and handler actions: time, actor, event and claim link. Row height follows density (comfortable 48px, compact 32px). Switch density in the toolbar.',
      },
    },
  },
} satisfies Meta<typeof ActivityFeed>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Focus ring comes from keyboard focus (:focus-visible), so the play function tabs to the first claim link.
export const Focus: Story = {
  play: async () => {
    await userEvent.tab()
  },
}

export const Loading: Story = { args: { state: 'loading' } }

export const Empty: Story = { args: { state: 'empty', events: [] } }

export const ErrorState: Story = { args: { state: 'error' } }

export const LongContent: Story = {
  args: {
    events: [
      {
        id: 'l1',
        time: '10:42',
        actor: { kind: 'person', name: 'Alexandra Montgomery-Whitfield-Featherstonehaugh' },
        event:
          'Requested additional information from the policyholder: signed discharge letter, itemised hospital invoice and proof of payment',
        claimId: 'CLM-2026-004812',
      },
      { id: 'l2', time: '10:31', actor: { kind: 'system' }, event: 'Reminder sent', claimId: 'CLM-2026-004790' },
      { id: 'l3', time: '10:12', actor: { kind: 'policyholder' }, event: 'Uploaded 3 documents', claimId: 'CLM-2026-004821' },
      ...recentActivity.slice(0, 3),
    ],
  },
}

/** Narrow container: the event text truncates first (full text in `title`); time, actor and claim # never clip. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
}
