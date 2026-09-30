import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { getClaim } from '@/data/claims'
import { ClaimHeader } from './ClaimHeader'

const sarah = getClaim('CLM-2026-004817')! // Health · 71% · over authority once payout is derived (€11,980)
const within_ = getClaim('CLM-2026-004806')! // Property · 91% · €5,950 payable

const meta = {
  title: 'Review/ClaimHeader',
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

/** Approve → confirmation panel (focus moves in) → Confirm calls onApprove and focus returns to the trigger. */
export const ApproveConfirmation: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Approve' })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = canvas.getByRole('group', { name: 'Approve this claim?' })
    await expect(panel).toHaveTextContent('Payable €5,950.00 will be approved')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Confirm approval' })).toHaveFocus())
    await expect(args.onApprove).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm approval' }))
    await expect(args.onApprove).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(canvas.queryByRole('group')).not.toBeInTheDocument()
  },
}

/** Escape cancels the confirmation without deciding; focus returns to the trigger. */
export const ApproveEscape: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Approve' })
    await userEvent.click(trigger)
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Confirm approval' })).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await expect(canvas.queryByRole('group')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(args.onApprove).not.toHaveBeenCalled()
  },
}

export const SeniorApprovalConfirmation: Story = {
  args: { ...OverAuthority.args },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Send for senior approval' }))
    const panel = canvas.getByRole('group', { name: 'Send for senior approval?' })
    await expect(panel).toHaveTextContent('Payable €11,980.00 is above your authority limit (€10,000.00)')
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm and send' }))
    await expect(args.onSendForSeniorApproval).toHaveBeenCalledTimes(1)
    await expect(args.onApprove).not.toHaveBeenCalled()
  },
}

/** Refer needs a reason: empty submit shows an error and keeps focus in the field; a reason is passed to onRefer. */
export const ReferRequiresReason: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Refer' }))
    const input = canvas.getByLabelText('Reason for referral (required)')
    await waitFor(() => expect(input).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: 'Refer claim' }))
    await expect(canvas.getByText('Enter a reason to refer this claim')).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveFocus()
    await expect(args.onRefer).not.toHaveBeenCalled()
    await userEvent.type(input, 'Needs medical review{Enter}')
    await expect(args.onRefer).toHaveBeenCalledWith('Needs medical review')
    await expect(canvas.queryByRole('form')).not.toBeInTheDocument()
  },
}

export const ReferCancel: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Refer' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(args.onRefer).not.toHaveBeenCalled()
  },
}

export const RequestInfo: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Request info' }))
    await expect(args.onRequestInfo).toHaveBeenCalledTimes(1)
  },
}
