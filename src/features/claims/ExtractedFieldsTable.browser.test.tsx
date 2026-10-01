import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { getClaimDetail } from '@/data/claim-detail'
import type { CitationSource } from '@/components/patterns/CitationChip'
import type { ExtractedField } from '@/data/types'
import type { FieldCorrection } from '@/lib/claim-logic'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { ExtractedFieldsTable } from './ExtractedFieldsTable'

const fields = getClaimDetail('CLM-2026-004817')!.fields
const agentFailedFields = getClaimDetail('CLM-2026-004819')!.fields

type Props = React.ComponentProps<typeof ExtractedFieldsTable>

const noop = () => {}
const baseProps = (list: ExtractedField[]): Props => ({
  fields: list,
  values: Object.fromEntries(list.map((f) => [f.id, f.value])),
  corrections: {},
  editingId: null,
  revealedIds: [],
  onEdit: noop,
  onSave: noop,
  onCancel: noop,
  onToggleReveal: noop,
  onOpenCitation: noop,
})

/** Owns the edit/correction/reveal state the way the claim screen does. */
function Stateful({ list = fields, onOpenCitation = noop }: { list?: ExtractedField[]; onOpenCitation?: (s: CitationSource) => void }) {
  const [values, setValues] = useState<Record<string, string | null>>(() => Object.fromEntries(list.map((f) => [f.id, f.value])))
  const [corrections, setCorrections] = useState<Record<string, FieldCorrection>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<string[]>([])
  return (
    <ExtractedFieldsTable
      fields={list}
      values={values}
      corrections={corrections}
      editingId={editingId}
      revealedIds={revealed}
      onEdit={setEditingId}
      onSave={(id, next) => {
        const field = list.find((f) => f.id === id)!
        setCorrections((prev) => ({ ...prev, [id]: { original: field.value, by: 'Emily Carter', time: '10:00' } }))
        setValues((prev) => ({ ...prev, [id]: next }))
        setEditingId(null)
      }}
      onCancel={() => setEditingId(null)}
      onToggleReveal={(id) => setRevealed((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]))}
      onOpenCitation={onOpenCitation}
    />
  )
}

describe('ExtractedFieldsTable', () => {
  it('renders every field as a row in a labelled region, needs-attention first, without axe violations', async () => {
    const { container, getByRole } = await render(<ExtractedFieldsTable {...baseProps(fields)} />)
    await expect.element(getByRole('region', { name: 'Extracted fields' })).toBeVisible()
    const rows = getByRole('row').elements().slice(1)
    expect(rows).toHaveLength(fields.length)
    // Missing first, then low confidence, then the rest.
    expect(rows[0].textContent).toContain('Treatment date')
    expect(rows[1].textContent).toContain('Diagnosis code')
    await expectNoA11yViolations(container)
  })

  it('states missing and low-confidence fields in words, not by colour alone', async () => {
    const { getByRole } = await render(<ExtractedFieldsTable {...baseProps(fields)} />)
    const rows = getByRole('row').elements().slice(1)
    expect(rows[0].textContent).toContain('Missing')
    expect(rows[1].textContent).toMatch(/Low/)
  })

  it('shows the empty state with no fields', async () => {
    const { container, getByText } = await render(<ExtractedFieldsTable {...baseProps([])} />)
    await expect.element(getByText('No fields extracted')).toBeVisible()
    await expectNoA11yViolations(container)
  })

  it('renders the loading skeleton as a busy region with no rows to read', async () => {
    const { container, getByRole } = await render(<ExtractedFieldsTable {...baseProps([])} loading />)
    await expect.element(getByRole('region', { name: 'Extracted fields' })).toHaveAttribute('aria-busy', 'true')
    expect(container.textContent).not.toContain('No fields extracted')
    await expectNoA11yViolations(container)
  })

  it('corrects a value with Enter: new value, struck-through agent value, Corrected badge, focus back on the pencil', async () => {
    const { container, getByRole, getByText } = await render(<Stateful />)
    await getByRole('button', { name: 'Correct Provider' }).click()
    const input = getByRole('textbox', { name: 'Edit Provider' })
    await expect.element(input).toHaveFocus()
    await input.fill('Riverside Family Clinic')
    await userEvent.keyboard('{Enter}')

    await expect.element(getByText('Riverside Family Clinic')).toBeVisible()
    const struck = container.querySelector('s')
    expect(struck?.textContent).toBe("Agent value: St. Luke's Medical Center")
    await expect.element(getByText('Corrected')).toBeVisible()
    await expect.element(getByRole('button', { name: 'Correct Provider' })).toHaveFocus()
  })

  it('cancels with Escape: value kept, no textbox, focus back on the pencil', async () => {
    const { getByRole, getByText, container } = await render(<Stateful />)
    await getByRole('button', { name: 'Correct Diagnosis code' }).click()
    await getByRole('textbox', { name: 'Edit Diagnosis code' }).fill('X99.9')
    await userEvent.keyboard('{Escape}')

    expect(getByRole('textbox').query()).toBeNull()
    await expect.element(getByText('S82.6')).toBeVisible()
    expect(container.textContent).not.toContain('X99.9')
    await expect.element(getByRole('button', { name: 'Correct Diagnosis code' })).toHaveFocus()
  })

  it('cancels with the Cancel button', async () => {
    const { getByRole } = await render(<Stateful />)
    await getByRole('button', { name: 'Correct Provider' }).click()
    await getByRole('button', { name: 'Cancel' }).click()
    expect(getByRole('textbox').query()).toBeNull()
    await expect.element(getByRole('button', { name: 'Correct Provider' })).toHaveFocus()
  })

  it('refuses an empty save: error text, aria-invalid, focus stays, onSave not called', async () => {
    const onSave = vi.fn()
    const { getByRole, getByText } = await render(
      <ExtractedFieldsTable {...baseProps(fields)} editingId="provider" onSave={onSave} />,
    )
    const input = getByRole('textbox', { name: 'Edit Provider' })
    await input.fill('')
    await userEvent.keyboard('{Enter}')
    await expect.element(getByText('Enter a value')).toBeVisible()
    await expect.element(input).toHaveAttribute('aria-invalid', 'true')
    await expect.element(input).toHaveFocus()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('enters a value for a missing field and says the agent found none', async () => {
    const { getByRole, getByText } = await render(<Stateful />)
    await getByRole('button', { name: 'Correct Treatment date' }).click()
    await getByRole('textbox', { name: 'Edit Treatment date' }).fill('19 Sep 2026')
    await userEvent.keyboard('{Enter}')
    await expect.element(getByText('19 Sep 2026')).toBeVisible()
    await expect.element(getByText('Agent found no value')).toBeVisible()
  })

  it('offers "Enter value" for agent-failed fields and edits through it', async () => {
    const onEdit = vi.fn()
    const { getByRole, container } = await render(<ExtractedFieldsTable {...baseProps(agentFailedFields)} onEdit={onEdit} />)
    expect(container.textContent).toContain('Agent failed')
    const buttons = getByRole('button', { name: /^Enter value for/ }).elements()
    expect(buttons).toHaveLength(agentFailedFields.length)
    await getByRole('button', { name: 'Enter value for Policyholder' }).click()
    expect(onEdit).toHaveBeenCalledWith('policyholder')
    await expectNoA11yViolations(container)
  })

  it('hands the cited document and page to onOpenCitation', async () => {
    const onOpenCitation = vi.fn()
    const { getByRole } = await render(<ExtractedFieldsTable {...baseProps(fields)} onOpenCitation={onOpenCitation} />)
    await getByRole('button', { name: 'Open Invoice, page 1' }).first().click()
    expect(onOpenCitation).toHaveBeenCalledWith({ doc: 'Invoice', page: 1 })
  })

  it('opens a citation from the keyboard', async () => {
    const onOpenCitation = vi.fn()
    const { getByRole } = await render(<ExtractedFieldsTable {...baseProps(fields)} onOpenCitation={onOpenCitation} />)
    getByRole('button', { name: 'Open Invoice, page 1' }).first().element().focus()
    await userEvent.keyboard('{Enter}')
    expect(onOpenCitation).toHaveBeenCalledWith({ doc: 'Invoice', page: 1 })
  })

  it('masks the IBAN until revealed, with aria-pressed on the toggle', async () => {
    const { getByRole, getByText } = await render(<Stateful />)
    await expect.element(getByText('HR•• •••• •••• •••• 0160')).toBeVisible()
    await expect.element(getByRole('button', { name: 'Reveal IBAN' })).toHaveAttribute('aria-pressed', 'false')
    await getByRole('button', { name: 'Reveal IBAN' }).click()
    await expect.element(getByText('HR12 1001 0051 8630 0016 0')).toBeVisible()
    await expect.element(getByRole('button', { name: 'Hide IBAN' })).toHaveAttribute('aria-pressed', 'true')
    await getByRole('button', { name: 'Hide IBAN' }).click()
    await expect.element(getByText('HR•• •••• •••• •••• 0160')).toBeVisible()
  })

  it('right-aligns the confidence column in tabular figures', async () => {
    const { getByRole } = await render(<ExtractedFieldsTable {...baseProps(fields)} />)
    const header = getByRole('columnheader', { name: 'Confidence' }).element()
    expect(getComputedStyle(header).textAlign).toBe('right')
  })
})
