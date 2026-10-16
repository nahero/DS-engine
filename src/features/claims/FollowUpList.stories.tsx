import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent } from 'storybook/test'
import { ASSIGNED_TODAY, assignedClaims } from '@/data/assigned'
import type { AssignedClaim } from '@/data/types'
import { FollowUpList } from './FollowUpList'

const meta = {
  title: 'Claims/FollowUpList',
  component: FollowUpList,
  args: { claims: assignedClaims, today: ASSIGNED_TODAY, onDone: fn(), onSnooze: fn(), onRetry: fn() },
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
          'The handler’s diary: dated reminders on claims they are waiting on, overdue first, then today, then upcoming. "Done" removes a reminder and "Snooze 2 d" moves it two days on; both are announced in a live region. The parent owns the data and applies the change.',
      },
    },
  },
} satisfies Meta<typeof FollowUpList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Focus ring comes from keyboard focus (:focus-visible), so the play function tabs to the first claim link and then Done.
export const Focus: Story = {
  play: async () => {
    await userEvent.tab()
    await userEvent.tab()
  },
}

export const Loading: Story = { args: { state: 'loading' } }

export const Empty: Story = { args: { state: 'empty', claims: [] } }

export const ErrorState: Story = { name: 'Error', args: { state: 'error' } }

export const LongContent: Story = {
  args: {
    claims: [
      {
        ...assignedClaims[0],
        policyholder: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
        followUp: {
          id: 'fu-long',
          due: '2026-09-20',
          note: 'Chase the signed statement of loss and the itemised repair invoice for every affected unit',
        },
      },
      ...assignedClaims.slice(1),
    ],
  },
}

/** One reminder per claim for 12 claims: the card grows with its content. */
export const ManyFollowUps: Story = {
  args: {
    claims: Array.from({ length: 12 }, (_, i): AssignedClaim => ({
      ...assignedClaims[i],
      id: `CLM-2026-${String(5000 + i).padStart(6, '0')}`,
      followUp: { id: `fu-many-${i}`, due: `2026-09-${String(25 + (i % 8)).padStart(2, '0')}`, note: 'Chase discharge letter' },
    })),
  },
}
