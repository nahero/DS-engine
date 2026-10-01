import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { getClaim } from '@/data/claims'
import { ClaimHeader } from './ClaimHeader'

const sarah = getClaim('CLM-2026-004817')! // Health · 71% · over authority once payout is derived (€11,980)
const within_ = getClaim('CLM-2026-004806')! // Property · 91% · €5,950 payable

const meta = {
  title: 'Claims/ClaimHeader',
  component: ClaimHeader,
  args: {
    claim: within_,
    status: 'In review',
    flag: null,
    payable: 5950,
    overAuthority: false,
    onRequestInfo: fn(),
    onApprove: fn(),
    onSendForSeniorApproval: fn(),
    onRefer: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Claim number, status, confidence, flag and the handler\'s decisions. Approve and Refer never fire on one click: each opens an inline confirmation (Refer also needs a reason). Above the authority limit the primary action becomes "Send for senior approval". Focus moves into the panel on open and back to its trigger on close.',
      },
    },
  },
} satisfies Meta<typeof ClaimHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'CLM-2026-004806' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'Refer' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Request info' })).toBeInTheDocument()
  },
}

export const OverAuthority: Story = {
  args: { claim: sarah, flag: 'Above authority limit', payable: 11980, overAuthority: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Send for senior approval' })).toBeEnabled()
    await expect(canvas.getByText('Needs senior approval above €10,000.00')).toBeVisible()
  },
}

export const SentForSenior: Story = {
  args: { ...OverAuthority.args, sentForSenior: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Sent for senior approval' })).toBeDisabled()
    await expect(canvas.getByText('Waiting for a senior handler to decide')).toBeVisible()
  },
}

export const Approved: Story = {
  args: { status: 'Approved' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Refer' })).toBeInTheDocument()
  },
}

export const InfoRequested: Story = {
  args: { status: 'Info requested', flag: 'Awaiting document' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: 'Request info' })).not.toBeInTheDocument()
  },
}

/** Denied, paid and closed claims are final: no actions, with the reason stated. */
export const Denied: Story = {
  args: { claim: getClaim('CLM-2026-004788')!, status: 'Denied', flag: 'Referred for review', payable: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('This claim is denied. No further actions are available.')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

export const Paid: Story = { args: { claim: getClaim('CLM-2026-004790')!, status: 'Paid' } }
export const Closed: Story = { args: { status: 'Closed' } }

/** Payout can't be calculated (missing deductible): Approve is disabled and says why. */
export const CannotDecide: Story = {
  args: { payable: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeDisabled()
    await expect(canvas.getByText('Can’t approve until the payout can be calculated')).toBeVisible()
  },
}

export const AgentFailed: Story = {
  args: { claim: getClaim('CLM-2026-004819')!, status: 'New', flag: 'Agent failed', payable: 47550 },
}

export const LowConfidence: Story = {
  args: { claim: getClaim('CLM-2026-004821')!, flag: 'Loss date outside policy period', payable: 8420 },
}

export const Loading: Story = {
  args: { claim: undefined, status: undefined, loading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading claim')
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

export const LongContent: Story = {
  args: {
    claim: { ...within_, policyholder: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC' },
    flag: 'Loss date outside policy period',
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Request info' })).toHaveFocus()
  },
}

/** The inline confirmation panel after one click on Approve (a pre-set state; the component keeps it internally). */
export const ApproveConfirmationOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }))
    await expect(canvas.getByRole('group', { name: 'Approve this claim?' })).toHaveTextContent('Payable €5,950.00 will be approved')
  },
}

export const SeniorApprovalConfirmationOpen: Story = {
  args: { ...OverAuthority.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Send for senior approval' }))
    await expect(canvas.getByRole('group', { name: 'Send for senior approval?' })).toHaveTextContent('Payable €11,980.00 is above your authority limit (€10,000.00)')
  },
}

export const ReferPanelOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Refer' }))
    await waitFor(() => expect(canvas.getByLabelText('Reason for referral (required)')).toHaveFocus())
  },
}
