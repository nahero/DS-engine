import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ASSIGNED_TODAY, assignedClaims } from '@/data/assigned'
import type { AssignedClaim } from '@/data/types'
import { worklistGroup } from '@/lib/worklist'
import { Worklist } from './Worklist'

const waitingOnly = assignedClaims.filter((c) => worklistGroup(c, ASSIGNED_TODAY) === 'waiting')
const missingAmount = assignedClaims.find((c) => c.payable === null)!

const meta = {
  title: 'Claims/Worklist',
  component: Worklist,
  args: { claims: assignedClaims, today: ASSIGNED_TODAY, onRetry: fn() },
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
          'A handler’s caseload in three groups by whose move it is: Act now, Ready for you, Waiting on others (collapsed to its count unless it is all there is). Each row is one link to the claim and states the next action in words. The row layout follows the width of the list (container queries): stacked when narrow, two lines in a two-thirds column, one line when wide. ↑/↓ and j/k move between rows across groups.',
      },
    },
  },
} satisfies Meta<typeof Worklist>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2, name: 'Act now · 8' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Waiting on others · 3' })).toHaveAttribute('aria-expanded', 'false')
  },
}

// Focus ring comes from keyboard focus (:focus-visible), so the play function tabs to the first row.
export const Focus: Story = {
  play: async () => {
    await userEvent.tab()
  },
}

export const Loading: Story = { args: { state: 'loading' } }

export const Empty: Story = { args: { state: 'empty', claims: [] } }

export const ErrorState: Story = { name: 'Error', args: { state: 'error' } }

/** Act now and Ready are empty: a line says so, and the waiting claims are shown. */
export const AllCaughtUp: Story = { args: { claims: waitingOnly } }

/** The Waiting on others group, expanded: each row says who it waits on and since when. */
export const WaitingExpanded: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Waiting on others/ }))
  },
}

/** The agent could not read the policy schedule: the amount is "—" with a visible "Missing". */
export const MissingAmount: Story = { args: { claims: [missingAmount, ...assignedClaims.slice(0, 2)] } }

export const LongContent: Story = {
  args: {
    claims: [
      {
        ...assignedClaims[0],
        policyholder: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
        waiting: { on: 'policyholder', since: '2026-09-20', what: 'itemised repair invoice and signed statement of loss for every affected unit' },
        followUp: undefined,
        lastEvent: { id: 'ev-long', at: '2026-09-29T07:30:00', kind: 'policyholder-replied', text: 'Replied', isNew: true },
      },
      ...assignedClaims.slice(1, 4),
    ],
  },
}

/** A narrow list (a phone, or a small column) stacks each row. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-sm">
        <Story />
      </div>
    ),
  ],
}

/** A wide list shows each claim on one line. */
export const Wide: Story = {
  decorators: [
    (Story) => (
      <div className="w-6xl max-w-full">
        <Story />
      </div>
    ),
  ],
}

/** 40 claims: the list grows with its content; every row keeps its size. */
export const ManyRows: Story = {
  args: {
    claims: Array.from({ length: 40 }, (_, i): AssignedClaim => ({
      ...assignedClaims[i % assignedClaims.length],
      id: `CLM-2026-${String(5000 + i).padStart(6, '0')}`,
    })),
  },
}
