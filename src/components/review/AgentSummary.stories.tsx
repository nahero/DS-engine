import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { getClaimDetail } from '@/data/claim-detail'
import { AgentSummary } from './AgentSummary'

const summary = getClaimDetail('CLM-2026-004817')!.agentSummary

const meta = {
  title: 'Review/AgentSummary',
  component: AgentSummary,
  args: { summary },
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
          'The agent\'s recommendation and the reasons behind it. Always labelled as AI-generated; the handler decides. Loading shows a skeleton at final layout size.',
      },
    },
  },
} satisfies Meta<typeof AgentSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const region = canvas.getByRole('region', { name: 'Agent summary' })
    await expect(region).toHaveTextContent('AI-generated, review before acting')
    await expect(within(region).getByText('Approve with senior sign-off')).toBeInTheDocument()
    await expect(within(region).getAllByRole('listitem')).toHaveLength(3)
  },
}

export const Loading: Story = {
  args: { summary: undefined, loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading agent summary')
    await expect(canvas.getByRole('region', { name: 'Agent summary' })).toHaveAttribute('aria-busy', 'true')
  },
}

/** Recommendation with no supporting notes: the list is omitted. */
export const Empty: Story = {
  args: { summary: { recommendation: 'Approve', notes: [] } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('list')).not.toBeInTheDocument()
  },
}

export const ManualReview: Story = {
  args: { summary: getClaimDetail('CLM-2026-004819')!.agentSummary },
}

export const LongContent: Story = {
  args: {
    summary: {
      recommendation:
        'Approve with senior sign-off after verifying the treatment date against the discharge letter and the invoiced amount against the provider’s price list',
      notes: [
        'Diagnosis code confidence is low (58%); verify against the discharge letter, the referral note and the pharmacy receipt before approving any amount.',
        'Treatment date is missing from every submitted document, including the invoice, the discharge letter and the photographed receipt.',
        'Payable €11,980.00 exceeds the handler authority limit of €10,000.00 and requires a senior handler’s sign-off, which is recorded in the audit trail.',
        'Montgomery-Whitfield-Featherstonehaugh-Property-Holdings-and-Development-Group-International-LLC-Policy-Number-ABCDEFGHIJKLMNOP',
      ],
    },
  },
}

export const ManyNotes: Story = {
  args: {
    summary: {
      recommendation: 'Review before deciding',
      notes: Array.from({ length: 12 }, (_, i) => `Check ${i + 1}: compare the extracted value with the cited document.`),
    },
  },
}
