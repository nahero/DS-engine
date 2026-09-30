import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ClaimDetail } from './ClaimDetail'

const SARAH = 'CLM-2026-004817' // Health · 71% · payable €11,980 → over the €10,000 authority limit

const meta = {
  title: 'Screens/ClaimDetail',
  component: ClaimDetail,
  args: { claimId: SARAH },
  // The app shell supplies <main>; stories stand in for it so the page has a landmark.
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-canvas">
        <Story />
      </main>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'One claim: header with decisions, key facts, extracted fields (inline correction, citations), documents, coverage checks, payout, agent summary and audit trail. Every handler action is recorded in the audit trail. `claimId` picks the seeded claim; `state` drives loading and error (with Retry).',
      },
    },
  },
} satisfies Meta<typeof ClaimDetail>

export default meta
type Story = StoryObj<typeof meta>

const auditCard = (canvas: ReturnType<typeof within>) => within(canvas.getByRole('region', { name: 'Audit trail' }))

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: SARAH })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Send for senior approval' })).toBeEnabled()
    await expect(canvas.getByRole('region', { name: 'Payout' })).toHaveTextContent('€11,980.00')
    await expect(canvas.getByRole('region', { name: 'Agent summary' })).toBeInTheDocument()
    await expect(canvas.getByRole('region', { name: 'Extracted fields' })).toBeInTheDocument()
  },
}

export const Loading: Story = {
  args: { state: 'loading' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('status').length).toBeGreaterThan(0)
    await expect(canvas.getByRole('region', { name: 'Payout' })).toHaveAttribute('aria-busy', 'true')
  },
}

/** Error → Retry loads the claim. */
export const ErrorState: Story = {
  name: 'Error',
  args: { state: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(`Couldn’t load claim ${SARAH}`)
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(await canvas.findByRole('region', { name: 'Payout' })).toBeInTheDocument()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}

/** Unknown claim number. */
export const NotFound: Story = {
  args: { claimId: 'CLM-2026-000000' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Claim not found' })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Back to queue' })).toHaveAttribute('href', '#claims-queue')
  },
}

/** Within authority: the primary action is plain Approve. */
export const WithinAuthority: Story = {
  args: { claimId: 'CLM-2026-004806' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeEnabled()
    await expect(canvas.queryByRole('button', { name: 'Send for senior approval' })).not.toBeInTheDocument()
    await expect(canvas.getByText('Within your authority limit (€10,000.00)')).toBeInTheDocument()
  },
}

/** Agent failed: every field is empty with an "Enter value" action, coverage is unknown. */
export const AgentFailed: Story = {
  args: { claimId: 'CLM-2026-004819' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Agent failed').length).toBeGreaterThan(0)
    await expect(canvas.getAllByRole('button', { name: /^Enter value for/ }).length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Manual review required').length).toBeGreaterThan(0)
  },
}

/** Low confidence, loss date outside the policy period, a missing field. */
export const LowConfidence: Story = {
  args: { claimId: 'CLM-2026-004821' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Missing').length).toBeGreaterThan(0)
    await userEvent.click(canvas.getByRole('tab', { name: 'Coverage check' }))
    await expect(await canvas.findByText('Flagged')).toBeInTheDocument()
  },
}

export const DuplicateSuspected: Story = { args: { claimId: 'CLM-2026-004809' } }
export const InfoRequested: Story = { args: { claimId: 'CLM-2026-004812' } }

export const Approved: Story = {
  args: { claimId: 'CLM-2026-004795' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  },
}

/** Denied, paid and closed claims are final: no decision buttons. */
export const Denied: Story = {
  args: { claimId: 'CLM-2026-004788' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('This claim is denied. No further actions are available.')).toBeVisible()
    await expect(canvas.getByRole('region', { name: 'Payout' })).toHaveTextContent('Denied · Reason code')
  },
}

export const Paid: Story = { args: { claimId: 'CLM-2026-004790' } }

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Request info' })).toHaveFocus()
  },
}

/** 375px viewport: the layout stacks; the fields table scrolls inside its own region. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

/**
 * Inline correction: pencil → type → Enter shows the Corrected state (new value, struck-through agent value) and adds an
 * audit event. A second edit cancelled with Escape keeps the original, adds no event, and returns focus to its pencil button.
 */
export const InlineCorrection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(auditCard(canvas).getAllByRole('listitem')).toHaveLength(5)

    await userEvent.click(canvas.getByRole('button', { name: 'Correct Provider' }))
    const input = canvas.getByRole('textbox', { name: 'Edit Provider' })
    await waitFor(() => expect(input).toHaveFocus())
    await userEvent.clear(input)
    await userEvent.type(input, 'Riverside Family Clinic{Enter}')

    await expect(canvas.getByText('Riverside Family Clinic')).toBeInTheDocument()
    await expect(canvas.getByText("St. Luke's Medical Center", { selector: 's' })).toBeInTheDocument()
    await expect(canvas.getByText('Corrected')).toBeInTheDocument()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Correct Provider' })).toHaveFocus())
    const audit = auditCard(canvas)
    await expect(audit.getByText('Corrected “Provider”')).toBeInTheDocument()
    await expect(audit.getByText(/Riverside Family Clinic \(agent value: St\. Luke.s Medical Center\)/)).toBeInTheDocument()
    await expect(audit.getByRole('button', { name: 'View all (6)' })).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Correct Diagnosis code' }))
    const other = canvas.getByRole('textbox', { name: 'Edit Diagnosis code' })
    await userEvent.clear(other)
    await userEvent.type(other, 'X99.9{Escape}')
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
    await expect(canvas.getByText('S82.6')).toBeInTheDocument()
    await expect(canvas.queryByText('X99.9')).not.toBeInTheDocument()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Correct Diagnosis code' })).toHaveFocus())
    await expect(auditCard(canvas).getByRole('button', { name: 'View all (6)' })).toBeInTheDocument()
  },
}

/** Senior approval: the primary action opens a confirmation; confirming disables it, relabels it and records an event. */
export const SeniorApproval: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const primary = canvas.getByRole('button', { name: 'Send for senior approval' })
    await userEvent.click(primary)
    const panel = canvas.getByRole('group', { name: 'Send for senior approval?' })
    await expect(panel).toHaveTextContent('Payable €11,980.00 is above your authority limit (€10,000.00)')
    await expect(auditCard(canvas).queryByText('Sent for senior approval')).not.toBeInTheDocument()

    await userEvent.click(within(panel).getByRole('button', { name: 'Confirm and send' }))
    const sent = await canvas.findByRole('button', { name: 'Sent for senior approval' })
    await expect(sent).toBeDisabled()
    await expect(canvas.queryByRole('group')).not.toBeInTheDocument()
    await expect(canvas.getByText('Waiting for a senior handler to decide')).toBeVisible()
    await expect(auditCard(canvas).getByText('Sent for senior approval')).toBeInTheDocument()
    await expect(canvas.getByText('Sent for senior approval.')).toBeInTheDocument()
  },
}

/** Within authority: Approve → confirm → claim approved, payout recorded. */
export const ApproveWithinAuthority: Story = {
  args: { claimId: 'CLM-2026-004806' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Approve' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm approval' }))
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument())
    await expect(auditCard(canvas).getByText('Approved payout €5,950.00')).toBeInTheDocument()
    await expect(canvas.getByText('Claim approved. Payout €5,950.00.')).toBeInTheDocument()
  },
}

/** Refer needs a reason, which goes into the audit trail. */
export const Refer: Story = {
  args: { claimId: 'CLM-2026-004806' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Refer' }))
    await userEvent.type(canvas.getByLabelText('Reason for referral (required)'), 'Needs a second opinion{Enter}')
    await expect(auditCard(canvas).getByText('Referred for review')).toBeInTheDocument()
    await expect(auditCard(canvas).getByText('Needs a second opinion')).toBeInTheDocument()
  },
}

/** Citation: the chip opens the Documents tab and the cited document is highlighted, labelled and focused. */
export const Citation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getAllByRole('button', { name: 'Open Invoice, page 1' })[0])

    await expect(canvas.getByRole('tab', { name: /Documents/ })).toHaveAttribute('aria-selected', 'true')
    const row = (await canvas.findByTitle('Invoice')).closest('li')!
    await waitFor(() => expect(row).toHaveFocus())
    await expect(row).toHaveAttribute('aria-current', 'true')
    await expect(row).toHaveTextContent('Cited on p.1')
    await expect(canvas.getByText('Opened Invoice, page 1.')).toBeInTheDocument()
  },
}

/** PII reveal: the policy number is masked until Reveal; revealing is pressed, shows the full number and is audited. */
export const PiiReveal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('POL-••••-4821')).toBeInTheDocument()
    const reveal = canvas.getByRole('button', { name: 'Reveal policy number' })
    await expect(reveal).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(reveal)

    await expect(canvas.getByText('POL-HRTN-4821')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Hide policy number' })).toHaveAttribute('aria-pressed', 'true')
    await expect(auditCard(canvas).getByText('Revealed policy number')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Hide policy number' }))
    await expect(canvas.getByText('POL-••••-4821')).toBeInTheDocument()
  },
}

export const IbanReveal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('HR•• •••• •••• •••• 0160')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Reveal IBAN' }))
    await expect(canvas.getByText('HR12 1001 0051 8630 0016 0')).toBeInTheDocument()
    await expect(auditCard(canvas).getByText('Revealed IBAN')).toBeInTheDocument()
  },
}

/** "View all" on the audit card opens the Audit trail tab. */
export const ViewAllAudit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Request info' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Correct Provider' }))
    await userEvent.type(canvas.getByRole('textbox', { name: 'Edit Provider' }), ' East{Enter}')
    await userEvent.click(await canvas.findByRole('button', { name: 'View all (7)' }))
    await expect(canvas.getByRole('tab', { name: 'Audit trail' })).toHaveAttribute('aria-selected', 'true')
    const panel = canvas.getByRole('tabpanel')
    await expect(within(panel).getAllByRole('listitem')).toHaveLength(7)
  },
}
