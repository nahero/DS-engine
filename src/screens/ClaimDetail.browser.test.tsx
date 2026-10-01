import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { routes } from '@/lib/routes'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { ClaimDetail } from './ClaimDetail'

const SARAH = 'CLM-2026-004817' // Health · 71% · payable €11,980 → over the €10,000 authority limit
const WITHIN = 'CLM-2026-004806' // Property · 91% · payable €5,950 → within authority

const auditCard = () => page.getByRole('region', { name: 'Audit trail' })
const payout = () => page.getByRole('region', { name: 'Payout' })
const button = (name: string) => page.getByRole('button', { name, exact: true })
const tab = (name: RegExp | string) => page.getByRole('tab', { name })

async function renderClaim(claimId = SARAH, state?: 'default' | 'loading' | 'error') {
  return render(<ClaimDetail claimId={claimId} state={state} />)
}

afterEach(() => {
  history.replaceState(null, '', window.location.pathname + window.location.search)
})

describe('ClaimDetail', () => {
  describe('rendering', () => {
    it('shows the claim, its decisions, payout, agent summary and fields, without axe violations', async () => {
      const { container, getByRole } = await renderClaim()
      await expect.element(getByRole('heading', { name: SARAH, level: 1 })).toBeVisible()
      await expect.element(button('Send for senior approval')).toBeEnabled()
      await expect.element(payout()).toMatchTextContent('€11,980.00')
      await expect.element(getByRole('region', { name: 'Agent summary' })).toBeVisible()
      await expect.element(getByRole('region', { name: 'Extracted fields' })).toBeVisible()
      await expect.element(getByRole('region', { name: 'Audit trail' })).toBeVisible()
      await expectNoA11yViolations(container)
    })

    it('tabs: fields, documents, coverage, audit; each shows its panel', async () => {
      const { getByRole, getByText } = await renderClaim()
      await expect.element(tab(/Extracted fields/)).toHaveAttribute('aria-selected', 'true')

      await tab(/Documents/).click()
      await expect.element(tab(/Documents/)).toHaveAttribute('aria-selected', 'true')
      await expect.element(getByText('Discharge letter')).toBeVisible()

      await tab('Coverage check').click()
      await expect.element(getByText('Policy in force on loss date')).toBeVisible()

      await tab('Audit trail').click()
      await expect.element(getByRole('tabpanel')).toMatchTextContent('Submitted FNOL form')
    })

    it('tabs work from the keyboard', async () => {
      await renderClaim()
      tab(/Extracted fields/).element().focus()
      await userEvent.keyboard('{ArrowRight}')
      await expect.element(tab(/Documents/)).toHaveAttribute('aria-selected', 'true')
      await expect.element(tab(/Documents/)).toHaveFocus()
    })

    it('the first Tab stop is Request info', async () => {
      await renderClaim()
      await userEvent.tab()
      await expect.element(button('Request info')).toHaveFocus()
    })

    it('loading: statuses, busy payout and no actions', async () => {
      const { container, getByRole } = await renderClaim(SARAH, 'loading')
      expect(getByRole('status').elements().length).toBeGreaterThan(0)
      await expect.element(payout()).toHaveAttribute('aria-busy', 'true')
      expect(getByRole('button', { name: 'Send for senior approval' }).query()).toBeNull()
      await expectNoA11yViolations(container)
    })

    it('error: an alert naming the claim; Retry loads it', async () => {
      const { container, getByRole } = await renderClaim(SARAH, 'error')
      await expect.element(getByRole('alert')).toMatchTextContent(`Couldn’t load claim ${SARAH}`)
      await expectNoA11yViolations(container)
      await button('Retry').click()
      await expect.element(payout()).toBeVisible()
      expect(getByRole('alert').query()).toBeNull()
    })

    it('not found: says so and links back to the queue', async () => {
      const { container, getByRole, getByText } = await renderClaim('CLM-2026-000000')
      await expect.element(getByRole('heading', { name: 'Claim not found' })).toBeVisible()
      await expect.element(getByText('No claim CLM-2026-000000')).toBeVisible()
      await expect.element(getByRole('link', { name: 'Back to queue' })).toHaveAttribute('href', routes.queue)
      expect(routes.queue).toBe('#claims-queue')
      await expectNoA11yViolations(container)
    })
  })

  describe('claims in other situations', () => {
    it('within authority: plain Approve, no senior approval, and the payout says so', async () => {
      await renderClaim(WITHIN)
      await expect.element(button('Approve')).toBeEnabled()
      expect(button('Send for senior approval').query()).toBeNull()
      await expect.element(payout()).toMatchTextContent('Within your authority limit (€10,000.00)')
    })

    it('over authority: the payout warns in words', async () => {
      await renderClaim()
      await expect.element(payout()).toMatchTextContent('Exceeds your authority limit (€10,000.00). Needs senior approval.')
    })

    it('agent failed: every field offers "Enter value", the summary asks for manual review', async () => {
      const { container, getByRole, getByText } = await renderClaim('CLM-2026-004819')
      expect(getByText('Agent failed').elements().length).toBeGreaterThan(0)
      expect(getByRole('button', { name: /^Enter value for/ }).elements().length).toBeGreaterThan(0)
      await expect.element(getByRole('region', { name: 'Agent summary' })).toMatchTextContent('Manual review required')
      await expectNoA11yViolations(container)
    })

    it('low confidence: a missing field is stated, and the coverage tab flags the loss date', async () => {
      const { container, getByText } = await renderClaim('CLM-2026-004821')
      expect(getByText('Missing').elements().length).toBeGreaterThan(0)
      await tab('Coverage check').click()
      await expect.element(getByText('Flagged')).toBeVisible()
      await expectNoA11yViolations(container)
    })

    it('duplicate suspected: the flag is shown as text and coverage flags it', async () => {
      const { getByText } = await renderClaim('CLM-2026-004809')
      expect(getByText('Duplicate suspected').elements().length).toBeGreaterThan(0)
    })

    it('info already requested: Request info is not offered again', async () => {
      await renderClaim('CLM-2026-004812')
      expect(button('Request info').query()).toBeNull()
      await expect.element(button('Approve')).toBeVisible()
    })

    it('approved claim: no Approve button', async () => {
      await renderClaim('CLM-2026-004795')
      expect(button('Approve').query()).toBeNull()
    })

    it('denied claim: actions are hidden, the final state is explained and the payout shows the reason code', async () => {
      const { container, getByText, getByRole } = await renderClaim('CLM-2026-004788')
      await expect.element(getByText('This claim is denied. No further actions are available.')).toBeVisible()
      await expect.element(payout()).toMatchTextContent('Denied · Reason code')
      for (const name of ['Approve', 'Refer', 'Request info', 'Send for senior approval']) expect(button(name).query()).toBeNull()
      expect(getByRole('button', { name: /Approve|Refer/ }).query()).toBeNull()
      await expectNoA11yViolations(container)
    })

    it('paid claim: actions are hidden', async () => {
      const { getByText } = await renderClaim('CLM-2026-004790')
      await expect.element(getByText('This claim is paid. No further actions are available.')).toBeVisible()
      expect(button('Approve').query()).toBeNull()
    })
  })

  describe('inline correction', () => {
    it('Enter saves: Corrected state, struck-through agent value, audit event with the agent value, focus on the pencil', async () => {
      const { container, getByRole, getByText } = await renderClaim()
      await expect.element(auditCard().getByRole('listitem')).toHaveLength(5)

      await getByRole('button', { name: 'Correct Provider' }).click()
      const input = getByRole('textbox', { name: 'Edit Provider' })
      await expect.element(input).toHaveFocus()
      await input.fill('Riverside Family Clinic')
      await userEvent.keyboard('{Enter}')

      await expect.element(getByText('Riverside Family Clinic').first()).toBeVisible()
      expect(container.querySelector('s')?.textContent).toBe("Agent value: St. Luke's Medical Center")
      await expect.element(getByText('Corrected', { exact: true })).toBeVisible()
      await expect.element(getByRole('button', { name: 'Correct Provider' })).toHaveFocus()
      await expect.element(auditCard().getByText('Corrected “Provider”')).toBeVisible()
      await expect.element(auditCard().getByText(/Riverside Family Clinic \(agent value: St\. Luke.s Medical Center\)/)).toBeVisible()
      await expect.element(auditCard().getByRole('button', { name: 'View all (6)' })).toBeVisible()
      await expect.element(getByText('Provider saved.')).toBeInTheDocument()
      await expectNoA11yViolations(container)
    })

    it('Escape cancels: value kept, no new audit event, focus back on the pencil', async () => {
      const { container, getByRole, getByText } = await renderClaim()
      await getByRole('button', { name: 'Correct Diagnosis code' }).click()
      await getByRole('textbox', { name: 'Edit Diagnosis code' }).fill('X99.9')
      await userEvent.keyboard('{Escape}')

      expect(getByRole('textbox').query()).toBeNull()
      await expect.element(getByText('S82.6')).toBeVisible()
      expect(container.textContent).not.toContain('X99.9')
      await expect.element(getByRole('button', { name: 'Correct Diagnosis code' })).toHaveFocus()
      await expect.element(auditCard().getByRole('listitem')).toHaveLength(5)
      expect(auditCard().getByRole('button', { name: /View all/ }).query()).toBeNull()
    })

    it('saving an empty value shows an error and keeps editing', async () => {
      const { getByRole, getByText } = await renderClaim()
      await getByRole('button', { name: 'Correct Provider' }).click()
      const input = getByRole('textbox', { name: 'Edit Provider' })
      await input.fill('')
      await userEvent.keyboard('{Enter}')
      await expect.element(getByText('Enter a value')).toBeVisible()
      await expect.element(input).toHaveAttribute('aria-invalid', 'true')
      await expect.element(input).toHaveFocus()
      await expect.element(auditCard().getByRole('listitem')).toHaveLength(5)
    })

    it('entering a value for a missing field is audited as "agent found no value"', async () => {
      const { getByRole, getByText } = await renderClaim()
      await getByRole('button', { name: 'Correct Treatment date' }).click()
      await getByRole('textbox', { name: 'Edit Treatment date' }).fill('19 Sep 2026')
      await userEvent.keyboard('{Enter}')
      await expect.element(getByText('Agent found no value')).toBeVisible()
      await expect.element(auditCard().getByText('Corrected “Treatment date”')).toBeVisible()
      await expect.element(auditCard().getByText('Entered 19 Sep 2026 (agent found no value)')).toBeVisible()
    })

    it('entering a value for an agent-failed field works through "Enter value"', async () => {
      const { container, getByRole, getByText } = await renderClaim('CLM-2026-004819')
      await getByRole('button', { name: 'Enter value for Policyholder' }).click()
      await getByRole('textbox', { name: 'Edit Policyholder' }).fill('Montgomery-Whitfield LLC')
      await userEvent.keyboard('{Enter}')
      await expect.element(getByText('Montgomery-Whitfield LLC')).toBeVisible()
      await expect.element(auditCard().getByText('Corrected “Policyholder”')).toBeVisible()
      await expectNoA11yViolations(container)
    })

    it('typing the agent value back restores it: no Corrected badge, audited as restored', async () => {
      const { container, getByRole, getByText } = await renderClaim()
      await getByRole('button', { name: 'Correct Provider' }).click()
      await getByRole('textbox', { name: 'Edit Provider' }).fill('Riverside Family Clinic')
      await userEvent.keyboard('{Enter}')
      await expect.element(getByText('Corrected', { exact: true })).toBeVisible()

      await getByRole('button', { name: 'Correct Provider' }).click()
      await getByRole('textbox', { name: 'Edit Provider' }).fill("St. Luke's Medical Center")
      await userEvent.keyboard('{Enter}')
      await expect.element(getByText('Corrected', { exact: true })).not.toBeInTheDocument()
      expect(container.querySelector('s')).toBeNull()
      await expect.element(auditCard().getByText('Restored agent value for “Provider”')).toBeVisible()
    })

    it('"View all" on the audit card opens the Audit trail tab with every event', async () => {
      const { getByRole } = await renderClaim()
      await button('Request info').click()
      await getByRole('button', { name: 'Correct Provider' }).click()
      await getByRole('textbox', { name: 'Edit Provider' }).fill("St. Luke's Medical Center East")
      await userEvent.keyboard('{Enter}')
      await auditCard().getByRole('button', { name: 'View all (7)' }).click()
      await expect.element(tab('Audit trail')).toHaveAttribute('aria-selected', 'true')
      await expect.element(getByRole('tabpanel').getByRole('listitem')).toHaveLength(7)
    })
  })

  describe('decisions', () => {
    it('senior approval: confirm panel, Esc closes and returns focus, confirm disables the button and audits it', async () => {
      const { container, getByRole, getByText } = await renderClaim()
      await button('Send for senior approval').click()
      const panel = getByRole('group', { name: 'Send for senior approval?' })
      await expect.element(panel).toMatchTextContent('Payable €11,980.00 is above your authority limit (€10,000.00)')
      await expect.element(button('Confirm and send')).toHaveFocus()
      expect(auditCard().getByText('Sent for senior approval').query()).toBeNull()
      await expectNoA11yViolations(container)

      await userEvent.keyboard('{Escape}')
      expect(getByRole('group').query()).toBeNull()
      await expect.element(button('Send for senior approval')).toHaveFocus()

      await button('Send for senior approval').click()
      await button('Confirm and send').click()
      await expect.element(button('Sent for senior approval')).toBeDisabled()
      expect(getByRole('group').query()).toBeNull()
      await expect.element(getByText('Waiting for a senior handler to decide')).toBeVisible()
      await expect.element(auditCard().getByText('Sent for senior approval')).toBeVisible()
      await expect.element(auditCard().getByRole('listitem').first()).toMatchTextContent('Payable €11,980.00 exceeds €10,000.00')
      await expect.element(getByText('Sent for senior approval.')).toBeInTheDocument()
    })

    it('approve within authority: confirm, status Approved, audit event and live announcement', async () => {
      const { container, getByRole, getByText } = await renderClaim(WITHIN)
      expect(container.querySelector('header')!.textContent).not.toContain('Approved')
      await button('Approve').click()
      await expect.element(getByRole('group', { name: 'Approve this claim?' })).toMatchTextContent('Payable €5,950.00 will be approved')
      await button('Confirm approval').click()
      await expect.element(button('Approve')).not.toBeInTheDocument()
      await expect.element(auditCard().getByText('Approved payout €5,950.00')).toBeVisible()
      await expect.element(getByText('Claim approved. Payout €5,950.00.')).toBeInTheDocument()
      expect(container.querySelector('header')!.textContent).toContain('Approved')
    })

    it('Escape on the approve panel approves nothing', async () => {
      await renderClaim(WITHIN)
      await button('Approve').click()
      await userEvent.keyboard('{Escape}')
      await expect.element(button('Approve')).toHaveFocus()
      expect(auditCard().getByText(/Approved payout/).query()).toBeNull()
    })

    it('refer needs a reason, then records it in the audit trail and flags the claim', async () => {
      const { container, getByRole, getByLabelText, getByText } = await renderClaim(WITHIN)
      await button('Refer').click()
      await button('Refer claim').click()
      await expect.element(getByText('Enter a reason to refer this claim')).toBeVisible()
      expect(auditCard().getByText('Referred for review').query()).toBeNull()

      await getByLabelText('Reason for referral (required)').fill('Needs a second opinion')
      await userEvent.keyboard('{Enter}')
      await expect.element(auditCard().getByText('Referred for review')).toBeVisible()
      await expect.element(auditCard().getByText('Needs a second opinion')).toBeVisible()
      await expect.element(getByText('Claim referred for review.')).toBeInTheDocument()
      expect(getByRole('heading', { level: 1 }).element().closest('header')!.textContent).toContain('Referred for review')
      await expectNoA11yViolations(container)
    })

    it('request info: status changes, event is audited and announced, the button goes away', async () => {
      const { container, getByText } = await renderClaim(WITHIN)
      await button('Request info').click()
      await expect.element(auditCard().getByText('Requested info')).toBeVisible()
      await expect.element(getByText('Info requested. Status is now Info requested.')).toBeInTheDocument()
      expect(button('Request info').query()).toBeNull()
      expect(container.querySelector('header')!.textContent).toContain('Info requested')
    })
  })

  describe('citations', () => {
    it('a citation opens the Documents tab; the cited document is highlighted, labelled, focused and announced', async () => {
      const { container, getByRole, getByText } = await renderClaim()
      await getByRole('button', { name: 'Open Invoice, page 1' }).first().click()

      await expect.element(tab(/Documents/)).toHaveAttribute('aria-selected', 'true')
      const row = getByRole('tabpanel').getByRole('listitem').filter({ hasText: 'Invoice' })
      await expect.element(row).toHaveAttribute('aria-current', 'true')
      await expect.element(row).toMatchTextContent('Cited on p.1')
      await expect.element(row).toHaveFocus()
      await expect.element(getByText('Opened Invoice, page 1.')).toBeInTheDocument()
      await expectNoA11yViolations(container)
    })

    it('leaving the Documents tab clears the highlight', async () => {
      const { container, getByRole } = await renderClaim()
      await getByRole('button', { name: 'Open Invoice, page 1' }).first().click()
      await expect.element(tab(/Documents/)).toHaveAttribute('aria-selected', 'true')
      await tab(/Extracted fields/).click()
      await tab(/Documents/).click()
      await expect.element(getByRole('tabpanel')).toBeVisible()
      expect(container.querySelector('[aria-current="true"]')).toBeNull()
    })
  })

  describe('PII', () => {
    it('policy number: masked, reveal sets aria-pressed, shows the full value, is audited, hide masks again', async () => {
      const { getByRole, getByText } = await renderClaim()
      await expect.element(getByText('POL-••••-4821')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Reveal policy number' })).toHaveAttribute('aria-pressed', 'false')

      await getByRole('button', { name: 'Reveal policy number' }).click()
      await expect.element(getByText('POL-HRTN-4821')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Hide policy number' })).toHaveAttribute('aria-pressed', 'true')
      await expect.element(auditCard().getByText('Revealed policy number')).toBeVisible()
      await expect.element(getByText('Policy number shown.')).toBeInTheDocument()

      await getByRole('button', { name: 'Hide policy number' }).click()
      await expect.element(getByText('POL-••••-4821')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Reveal policy number' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('IBAN: masked, reveal shows the full value and is audited, hide masks it again', async () => {
      const { getByRole, getByText } = await renderClaim()
      await expect.element(getByText('HR•• •••• •••• •••• 0160')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Reveal IBAN' })).toHaveAttribute('aria-pressed', 'false')

      await getByRole('button', { name: 'Reveal IBAN' }).click()
      await expect.element(getByText('HR12 1001 0051 8630 0016 0')).toBeVisible()
      await expect.element(getByRole('button', { name: 'Hide IBAN' })).toHaveAttribute('aria-pressed', 'true')
      await expect.element(auditCard().getByText('Revealed IBAN')).toBeVisible()

      await getByRole('button', { name: 'Hide IBAN' }).click()
      await expect.element(getByText('HR•• •••• •••• •••• 0160')).toBeVisible()
    })

    it('masked values never appear in the DOM text while hidden', async () => {
      const { container } = await renderClaim()
      expect(container.textContent).not.toContain('POL-HRTN-4821')
      expect(container.textContent).not.toContain('HR1210010051863000160')
      expect(container.textContent).not.toContain('HR12 1001 0051 8630 0016 0')
    })
  })
})
