import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { ClaimStatus } from '@/data/types'
import { StatusBadge } from './StatusBadge'

const STATUSES: ClaimStatus[] = ['New', 'In review', 'Info requested', 'Approved', 'Denied', 'Paid', 'Closed', 'Reopened']

const meta = {
  title: 'Patterns/StatusBadge',
  component: StatusBadge,
  args: { status: 'In review' },
  argTypes: { status: { control: 'select', options: STATUSES } },
  parameters: {
    docs: {
      description: {
        component: 'Claim lifecycle status. The text label is always shown; the badge variant is a secondary cue.',
      },
    },
  },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const New: Story = { args: { status: 'New' } }
export const InReview: Story = { args: { status: 'In review' } }
export const InfoRequested: Story = { args: { status: 'Info requested' } }
export const Approved: Story = { args: { status: 'Approved' } }
export const Denied: Story = { args: { status: 'Denied' } }
export const Paid: Story = { args: { status: 'Paid' } }
export const Closed: Story = { args: { status: 'Closed' } }
export const Reopened: Story = { args: { status: 'Reopened' } }

export const AllStatuses: Story = {
  render: () => (
    <ul className="flex flex-wrap items-center gap-2">
      {STATUSES.map((status) => (
        <li key={status}>
          <StatusBadge status={status} />
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const status of STATUSES) await expect(canvas.getByText(status)).toBeInTheDocument()
  },
}
