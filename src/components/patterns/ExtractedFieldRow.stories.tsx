import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { getClaimDetail } from '@/data/claim-detail'
import type { ExtractedField } from '@/data/types'
import { ExtractedFieldRow } from './ExtractedFieldRow'
import type { FieldCorrection } from '@/lib/claim-logic'

const fields = getClaimDetail('CLM-2026-004817')!.fields
const byId = (id: string) => fields.find((f) => f.id === id)!

const provider = byId('provider') // 74% Medium
const diagnosis = byId('diagnosis-code') // 58% Low
const treatmentDate = byId('treatment-date') // missing
const iban = byId('iban')
const agentFailed: ExtractedField = { id: 'provider', label: 'Provider', value: null, confidence: null, source: null, agentFailed: true, kind: 'text' }
const correction: FieldCorrection = { original: provider.value, by: 'Emily Carter', time: '14:32' }

const meta = {
  title: 'Patterns/ExtractedFieldRow',
  component: ExtractedFieldRow,
  args: {
    field: provider,
    value: provider.value,
    onEdit: fn(),
    onSave: fn(),
    onCancel: fn(),
    onToggleReveal: fn(),
    onOpenCitation: fn(),
  },
  // The row is a <tr>: give it the table it lives in.
  decorators: [
    (Story) => (
      <table className="w-full min-w-160 border-collapse text-body">
        <caption className="sr-only">Extracted fields</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-left text-caption font-medium text-fg-muted">Field</th>
            <th scope="col" className="px-2 py-1 text-left text-caption font-medium text-fg-muted">Value</th>
            <th scope="col" className="px-2 py-1 text-right text-caption font-medium text-fg-muted">Confidence</th>
            <th scope="col" className="px-2 py-1 text-left text-caption font-medium text-fg-muted">Source</th>
            <th scope="col" className="px-2 py-1 text-caption font-medium text-fg-muted"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <Story />
        </tbody>
      </table>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One extracted field as a table row: Field · Value · Confidence · Source · action. States: default, low confidence (tinted + bold, with the Low label), missing ("—" + Missing badge), agent failed ("Enter value" action), editing, corrected (new value, struck-through agent value, who and when). IBANs are masked until revealed.',
      },
    },
  },
} satisfies Meta<typeof ExtractedFieldRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('rowheader', { name: 'Provider' })).toBeInTheDocument()
    await expect(canvas.getByText("St. Luke's Medical Center")).toBeInTheDocument()
    await expect(canvas.getByText('Confidence 74%, medium')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Open Invoice, page 1' })).toBeInTheDocument()
  },
}

export const LowConfidence: Story = {
  args: { field: diagnosis, value: diagnosis.value },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Confidence 58%, low')).toBeInTheDocument()
  },
}

export const Missing: Story = {
  args: { field: treatmentDate, value: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Missing')[0]).toBeVisible()
    await expect(canvas.getByText('No score')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Open .*, page/ })).not.toBeInTheDocument()
  },
}

export const AgentFailed: Story = {
  args: { field: agentFailed, value: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Agent failed')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Enter value for Provider' })).toBeVisible()
  },
}

export const Editing: Story = {
  args: { editing: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Edit Provider' })
    await waitFor(() => expect(input).toHaveFocus())
    await expect(input).toHaveValue("St. Luke's Medical Center")
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  },
}

export const Corrected: Story = {
  args: { value: 'Riverside Family Clinic', correction },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Riverside Family Clinic')).toBeInTheDocument()
    await expect(canvas.getByText("St. Luke's Medical Center", { selector: 's' })).toBeInTheDocument()
    await expect(canvas.getByText('Corrected')).toBeInTheDocument()
    await expect(canvas.getByText(/Edited by Emily Carter/)).toBeInTheDocument()
  },
}

/** Corrected a field the agent left empty: no struck-through value, "Agent found no value" instead. */
export const CorrectedFromMissing: Story = {
  args: {
    field: treatmentDate,
    value: '19 Sep 2026',
    correction: { original: null, by: 'Emily Carter', time: '14:32' },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Agent found no value')).toBeVisible()
  },
}

export const IbanMasked: Story = {
  args: { field: iban, value: iban.value },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('HR•• •••• •••• •••• 0160')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Reveal IBAN' })).toHaveAttribute('aria-pressed', 'false')
  },
}

export const IbanRevealed: Story = {
  args: { field: iban, value: iban.value, revealed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('HR12 1001 0051 8630 0016 0')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Hide IBAN' })).toHaveAttribute('aria-pressed', 'true')
  },
}

export const HighConfidence: Story = { args: { field: byId('invoiced-amount'), value: byId('invoiced-amount').value } }

export const NoSource: Story = {
  args: { field: { ...provider, source: null } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: /Open .*, page/ })).not.toBeInTheDocument()
  },
}

export const LongContent: Story = {
  args: {
    field: { ...provider, label: 'Treating provider and registered clinical department at time of admission' },
    value:
      'Montgomery-Whitfield-Featherstonehaugh Memorial Hospital and Research Institute, Department of Orthopaedic Surgery and Trauma, Zagreb',
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Open Invoice, page 1' })).toHaveFocus()
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Correct Provider' })).toHaveFocus()
  },
}
