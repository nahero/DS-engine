import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { getClaim } from '@/data/claims'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { ClaimHeader } from './ClaimHeader'

const withinAuthority = getClaim('CLM-2026-004806')! // Property · 91% · €5,950 payable
const overAuthority = getClaim('CLM-2026-004817')! // Health · 71% · €11,980 payable

type Props = React.ComponentProps<typeof ClaimHeader>

const props = (extra: Partial<Props> = {}): Props => ({
  claim: withinAuthority,
  status: 'In review',
  flag: null,
  payable: 5950,
  overAuthority: false,
  onRequestInfo: vi.fn(),
  onApprove: vi.fn(),
  onSendForSeniorApproval: vi.fn(),
  onRefer: vi.fn(),
  ...extra,
})

const overProps = (extra: Partial<Props> = {}) =>
  props({ claim: overAuthority, flag: 'Above authority limit', payable: 11980, overAuthority: true, ...extra })

describe('ClaimHeader', () => {
  it('shows the claim number, status, confidence, policyholder and the three actions, without axe violations', async () => {
    const { container, getByRole, getByText } = await render(<ClaimHeader {...props()} />)
    await expect.element(getByRole('heading', { name: 'CLM-2026-004806' })).toBeVisible()
    await expect.element(getByText('In review', { exact: true })).toBeVisible()
    await expect.element(getByText('Christopher Hayes · Property claim')).toBeVisible()
    await expect.element(getByRole('button', { name: 'Approve', exact: true })).toBeEnabled()
    await expect.element(getByRole('button', { name: 'Refer', exact: true })).toBeVisible()
    await expect.element(getByRole('button', { name: 'Request info', exact: true })).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('shows the flag as text', async () => {
    const { getByText } = await render(<ClaimHeader {...overProps()} />)
    await expect.element(getByText('Above authority limit', { exact: true }).first()).toBeVisible()
  })

  it('over the authority limit the primary action is "Send for senior approval", with the reason visible', async () => {
    const { container, getByRole, getByText } = await render(<ClaimHeader {...overProps()} />)
    await expect.element(getByRole('button', { name: 'Send for senior approval', exact: true })).toBeEnabled()
    expect(getByRole('button', { name: 'Approve', exact: true }).query()).toBeNull()
    await expect.element(getByText('Needs senior approval above €10,000.00')).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('Request info calls back once and is hidden when info is already requested', async () => {
    const onRequestInfo = vi.fn()
    const first = await render(<ClaimHeader {...props({ onRequestInfo })} />)
    await first.getByRole('button', { name: 'Request info' }).click()
    expect(onRequestInfo).toHaveBeenCalledTimes(1)
    await first.unmount()

    const second = await render(<ClaimHeader {...props({ status: 'Info requested' })} />)
    expect(second.getByRole('button', { name: 'Request info' }).query()).toBeNull()
  })

  it('approve asks for confirmation: panel with payable, focus on Confirm, nothing fires until confirmed, focus returns to the trigger', async () => {
    const onApprove = vi.fn()
    const { container, getByRole } = await render(<ClaimHeader {...props({ onApprove })} />)
    const trigger = getByRole('button', { name: 'Approve', exact: true })
    await trigger.click()

    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = getByRole('group', { name: 'Approve this claim?' })
    await expect.element(panel).toMatchTextContent('Payable €5,950.00 will be approved')
    await expect.element(getByRole('button', { name: 'Confirm approval' })).toHaveFocus()
    expect(onApprove).not.toHaveBeenCalled()
    await expectNoA11yViolations(container)

    await getByRole('button', { name: 'Confirm approval' }).click()
    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(getByRole('group').query()).toBeNull()
    await expect.element(getByRole('button', { name: 'Approve', exact: true })).toHaveFocus()
  })

  it('Escape closes the approve panel, returns focus to the trigger and approves nothing', async () => {
    const onApprove = vi.fn()
    const { getByRole } = await render(<ClaimHeader {...props({ onApprove })} />)
    await getByRole('button', { name: 'Approve', exact: true }).click()
    await expect.element(getByRole('button', { name: 'Confirm approval' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(getByRole('group').query()).toBeNull()
    await expect.element(getByRole('button', { name: 'Approve', exact: true })).toHaveFocus()
    expect(onApprove).not.toHaveBeenCalled()
  })

  it('Cancel closes the approve panel without approving', async () => {
    const onApprove = vi.fn()
    const { getByRole } = await render(<ClaimHeader {...props({ onApprove })} />)
    await getByRole('button', { name: 'Approve', exact: true }).click()
    await getByRole('button', { name: 'Cancel' }).click()
    expect(getByRole('group').query()).toBeNull()
    expect(onApprove).not.toHaveBeenCalled()
  })

  it('senior approval: the panel states the amount and limit; Confirm and send calls the senior callback, not approve', async () => {
    const onApprove = vi.fn()
    const onSend = vi.fn()
    const { getByRole } = await render(<ClaimHeader {...overProps({ onApprove, onSendForSeniorApproval: onSend })} />)
    await getByRole('button', { name: 'Send for senior approval', exact: true }).click()
    const panel = getByRole('group', { name: 'Send for senior approval?' })
    await expect.element(panel).toMatchTextContent('Payable €11,980.00 is above your authority limit (€10,000.00)')
    expect(onSend).not.toHaveBeenCalled()

    await getByRole('button', { name: 'Confirm and send' }).click()
    expect(onSend).toHaveBeenCalledTimes(1)
    expect(onApprove).not.toHaveBeenCalled()
  })

  it('senior approval: Escape closes the panel and returns focus to the trigger', async () => {
    const onSend = vi.fn()
    const { getByRole } = await render(<ClaimHeader {...overProps({ onSendForSeniorApproval: onSend })} />)
    await getByRole('button', { name: 'Send for senior approval', exact: true }).click()
    await userEvent.keyboard('{Escape}')
    expect(getByRole('group').query()).toBeNull()
    await expect.element(getByRole('button', { name: 'Send for senior approval', exact: true })).toHaveFocus()
    expect(onSend).not.toHaveBeenCalled()
  })

  it('once sent, the button is disabled and relabelled, with a waiting message', async () => {
    const { container, getByRole, getByText } = await render(<ClaimHeader {...overProps({ sentForSenior: true })} />)
    await expect.element(getByRole('button', { name: 'Sent for senior approval' })).toBeDisabled()
    await expect.element(getByText('Waiting for a senior handler to decide')).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('refer needs a reason: empty submit shows an error and keeps focus; a reason submits and closes', async () => {
    const onRefer = vi.fn()
    const { container, getByRole, getByLabelText, getByText } = await render(<ClaimHeader {...props({ onRefer })} />)
    await getByRole('button', { name: 'Refer', exact: true }).click()
    const reason = getByLabelText('Reason for referral (required)')
    await expect.element(reason).toHaveFocus()
    await expect.element(getByRole('button', { name: 'Refer', exact: true })).toHaveAttribute('aria-expanded', 'true')

    await getByRole('button', { name: 'Refer claim' }).click()
    await expect.element(getByText('Enter a reason to refer this claim')).toBeVisible()
    await expect.element(reason).toHaveAttribute('aria-invalid', 'true')
    await expect.element(reason).toHaveFocus()
    expect(onRefer).not.toHaveBeenCalled()
    await expectNoA11yViolations(container)

    await reason.fill('Needs medical review')
    await expect.element(reason).not.toHaveAttribute('aria-invalid')
    await userEvent.keyboard('{Enter}')
    expect(onRefer).toHaveBeenCalledExactlyOnceWith('Needs medical review')
    expect(getByLabelText('Reason for referral (required)').query()).toBeNull()
  })

  it('a whitespace-only reason is rejected', async () => {
    const onRefer = vi.fn()
    const { getByRole, getByLabelText, getByText } = await render(<ClaimHeader {...props({ onRefer })} />)
    await getByRole('button', { name: 'Refer', exact: true }).click()
    await getByLabelText('Reason for referral (required)').fill('   ')
    await getByRole('button', { name: 'Refer claim' }).click()
    await expect.element(getByText('Enter a reason to refer this claim')).toBeVisible()
    expect(onRefer).not.toHaveBeenCalled()
  })

  it('Escape closes the refer form, returns focus to Refer and refers nothing', async () => {
    const onRefer = vi.fn()
    const { getByRole, getByLabelText } = await render(<ClaimHeader {...props({ onRefer })} />)
    await getByRole('button', { name: 'Refer', exact: true }).click()
    await getByLabelText('Reason for referral (required)').fill('Something')
    await userEvent.keyboard('{Escape}')
    expect(getByLabelText('Reason for referral (required)').query()).toBeNull()
    await expect.element(getByRole('button', { name: 'Refer', exact: true })).toHaveFocus()
    expect(onRefer).not.toHaveBeenCalled()
  })

  it('cannot approve until the payout can be calculated, and says why', async () => {
    const { getByRole, getByText } = await render(<ClaimHeader {...props({ payable: null })} />)
    await expect.element(getByRole('button', { name: 'Approve', exact: true })).toBeDisabled()
    await expect.element(getByText('Can’t approve until the payout can be calculated')).toBeVisible()
  })

  it('an approved claim has no approve button but can still be referred', async () => {
    const { getByRole } = await render(<ClaimHeader {...props({ status: 'Approved' })} />)
    expect(getByRole('button', { name: 'Approve', exact: true }).query()).toBeNull()
    await expect.element(getByRole('button', { name: 'Refer', exact: true })).toBeVisible()
  })

  it.each(['Denied', 'Paid', 'Closed'] as const)('a %s claim hides every action and says so', async (status) => {
    const { container, getByRole, getByText } = await render(<ClaimHeader {...props({ status })} />)
    await expect.element(getByText(`This claim is ${status.toLowerCase()}. No further actions are available.`)).toBeVisible()
    expect(getByRole('button').query()).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('announces loading and marks the header busy', async () => {
    const { container, getByRole } = await render(<ClaimHeader loading />)
    await expect.element(getByRole('status')).toMatchTextContent('Loading claim')
    expect(container.querySelector('header')).toHaveAttribute('aria-busy', 'true')
    expect(getByRole('button').query()).toBeNull()
    await expectNoA11yViolations(container)
  })
})
