import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { Payout } from '@/data/types'
import { PayoutBreakdown } from './PayoutBreakdown'

const within_: Payout = { claimed: 3150, deductible: 500, limit: 50000 }

const meta = {
  title: 'Review/PayoutBreakdown',
  component: PayoutBreakdown,
  args: { payout: within_ },
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
          'How the payable amount is calculated (claimed − deductible, capped at the policy limit) and whether it needs senior approval (above €10,000). Money is right-aligned in tabular figures. A missing input shows "Missing" and no result; denied pays nothing.',
      },
    },
  },
} satisfies Meta<typeof PayoutBreakdown>

export default meta
type Story = StoryObj<typeof meta>

export const WithinLimit: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Payout' })
    await expect(region).toHaveTextContent('€3,150.00')
    await expect(region).toHaveTextContent('€2,650.00')
    await expect(within(region).getByText('Within your authority limit (€10,000.00)')).toBeInTheDocument()
  },
}

export const AboveAuthorityLimit: Story = {
  args: { payout: { claimed: 12480, deductible: 500, limit: 50000 } },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Payout' })
    await expect(region).toHaveTextContent('€11,980.00')
    await expect(within(region).getByRole('status')).toHaveTextContent('Exceeds your authority limit (€10,000.00). Needs senior approval.')
  },
}

export const CappedByPolicyLimit: Story = {
  args: { payout: { claimed: 62000, deductible: 500, limit: 50000 } },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Payout' })
    await expect(region).toHaveTextContent('Capped at policy limit')
    await expect(region).toHaveTextContent('€11,500.00 not covered')
  },
}

export const DeductibleMissing: Story = {
  args: { payout: { claimed: 3150, deductible: null, limit: 50000 } },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Payout' })
    await expect(region).toHaveTextContent('Can’t calculate until deductible is confirmed')
    await expect(within(region).getAllByText('Missing').length).toBeGreaterThan(0)
  },
}

export const ClaimedMissing: Story = {
  args: { payout: { claimed: null, deductible: 500, limit: 50000 } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Can’t calculate until the claimed amount is confirmed')).toBeInTheDocument()
  },
}

export const Denied: Story = {
  args: { payout: { ...within_, denied: { reasonCode: 'EXC-04', reason: 'Loss type is excluded under the policy terms.' } } },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Payout' })
    await expect(region).toHaveTextContent('Denied · Reason code EXC-04')
    await expect(region).toHaveTextContent('€0.00')
  },
}

export const Loading: Story = {
  args: { payout: undefined, loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading payout')
    await expect(canvas.getByRole('region', { name: 'Payout' })).toHaveAttribute('aria-busy', 'true')
  },
}

/** Six-figure amounts keep the right-aligned tabular column. */
export const LargeAmounts: Story = {
  args: { payout: { claimed: 1234567.89, deductible: 750, limit: 2500000 } },
}

export const Narrow: Story = {
  args: { payout: { claimed: 62000, deductible: 500, limit: 50000 } },
  decorators: [
    (Story) => (
      <div className="max-w-64">
        <Story />
      </div>
    ),
  ],
}
