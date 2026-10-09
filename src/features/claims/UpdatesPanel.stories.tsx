import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent } from 'storybook/test'
import { assignedClaims } from '@/data/assigned'
import type { AssignedClaim } from '@/data/types'
import { UpdatesPanel } from './UpdatesPanel'

const meta = {
  title: 'Claims/UpdatesPanel',
  component: UpdatesPanel,
  args: { claims: assignedClaims, onRetry: fn() },
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
          'What happened on the handler’s claims since they were last here: document received, approval returned, policyholder replied, SLA about to breach, reopened. New events first, marked with a dot and the word "New"; each item links to its claim. Shows six; the rest sit behind "Show all".',
      },
    },
  },
} satisfies Meta<typeof UpdatesPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Focus ring comes from keyboard focus (:focus-visible), so the play function tabs to the first item.
export const Focus: Story = {
  play: async () => {
    await userEvent.tab()
  },
}

export const Loading: Story = { args: { state: 'loading' } }

/** No claim has an event: "Nothing new since your last visit". */
export const Empty: Story = { args: { state: 'empty', claims: [] } }

export const ErrorState: Story = { name: 'Error', args: { state: 'error' } }

/** Only older events: nothing carries the "New" marker. */
export const NothingNew: Story = {
  args: { claims: assignedClaims.map((c): AssignedClaim => (c.lastEvent ? { ...c, lastEvent: { ...c.lastEvent, isNew: false } } : c)) },
}

export const LongContent: Story = {
  args: {
    claims: [
      {
        ...assignedClaims[0],
        policyholder: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
        lastEvent: {
          id: 'ev-long',
          at: '2026-09-29T07:30:00',
          kind: 'document-received',
          text: 'Signed statement of loss and itemised repair invoice received from the policyholder’s representative',
          isNew: true,
        },
      },
      ...assignedClaims.slice(1),
    ],
  },
}

/** More than six events: six are shown, "Show all (N)" reveals the rest. */
export const ManyEvents: Story = {
  args: {
    claims: assignedClaims.map(
      (c, i): AssignedClaim => ({
        ...c,
        lastEvent: c.lastEvent ?? {
          id: `ev-extra-${i}`,
          at: `2026-09-${String(20 + (i % 8)).padStart(2, '0')}T10:00:00`,
          kind: 'document-received',
          text: 'Document received',
          isNew: i % 3 === 0,
        },
      }),
    ),
  },
}
