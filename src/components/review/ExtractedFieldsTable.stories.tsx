import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { getClaimDetail } from '@/data/claim-detail'
import type { ExtractedField } from '@/data/types'
import { ExtractedFieldsTable } from './ExtractedFieldsTable'
import type { FieldCorrection } from './claim-utils'

const fields = getClaimDetail('CLM-2026-004817')!.fields
const agentFailedFields = getClaimDetail('CLM-2026-004819')!.fields

const initialValues = (list: ExtractedField[]) => Object.fromEntries(list.map((f) => [f.id, f.value]))

const meta = {
  title: 'Review/ExtractedFieldsTable',
  component: ExtractedFieldsTable,
  args: {
    fields,
    values: initialValues(fields),
    corrections: {},
    editingId: null,
    revealedIds: [],
    onEdit: fn(),
    onSave: fn(),
    onCancel: fn(),
    onToggleReveal: fn(),
    onOpenCitation: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'Extracted fields, missing and low-confidence first. A labelled, focusable scroll region on narrow screens. When an edit ends, focus returns to that row\'s edit button.',
      },
    },
  },
} satisfies Meta<typeof ExtractedFieldsTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rows = canvas.getAllByRole('row')
    // header + 7 fields; missing first, then low confidence.
    await expect(rows).toHaveLength(8)
    await expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('Treatment date')
    await expect(within(rows[2]).getByRole('rowheader')).toHaveTextContent('Diagnosis code')
  },
}

export const Loading: Story = {
  args: { loading: true, fields: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('region', { name: 'Extracted fields' })).toHaveAttribute('aria-busy', 'true')
  },
}

export const Empty: Story = {
  args: { fields: [], values: {} },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No fields extracted')).toBeVisible()
  },
}

/** Agent failed: every field is empty with an "Enter value" action. */
export const AgentFailed: Story = {
  args: { fields: agentFailedFields, values: initialValues(agentFailedFields) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Agent failed')).toHaveLength(agentFailedFields.length)
  },
}

export const Editing: Story = { args: { editingId: 'provider' } }

export const Corrected: Story = {
  args: {
    values: { ...initialValues(fields), provider: 'Riverside Family Clinic' },
    corrections: { provider: { original: "St. Luke's Medical Center", by: 'Emily Carter', time: '14:32' } },
  },
}

export const IbanRevealed: Story = { args: { revealedIds: ['iban'] } }

const longFields: ExtractedField[] = [
  {
    id: 'long',
    label: 'Treating provider and registered clinical department at time of admission',
    value: 'Montgomery-Whitfield-Featherstonehaugh Memorial Hospital and Research Institute, Department of Orthopaedic Surgery and Trauma',
    confidence: 61,
    source: { doc: 'Photo of receipt with handwritten notes', page: 12 },
    kind: 'text',
  },
  ...fields,
]

export const LongContent: Story = { args: { fields: longFields, values: initialValues(longFields) } }

/** 60 fields: the table grows, the header row stays one line. */
export const ManyFields: Story = {
  args: {
    fields: Array.from({ length: 60 }, (_, i) => ({ ...fields[(i % (fields.length - 1)) + 1], id: `f-${i}`, label: `${fields[(i % (fields.length - 1)) + 1].label} ${i + 1}` })),
    values: {},
  },
  render: (args) => <ExtractedFieldsTable {...args} values={initialValues(args.fields)} />,
}

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
}

function Stateful(args: React.ComponentProps<typeof ExtractedFieldsTable>) {
  const [values, setValues] = useState<Record<string, string | null>>(args.values)
  const [corrections, setCorrections] = useState<Record<string, FieldCorrection>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  return (
    <ExtractedFieldsTable
      {...args}
      values={values}
      corrections={corrections}
      editingId={editingId}
      onEdit={setEditingId}
      onCancel={() => setEditingId(null)}
      onSave={(id, next) => {
        const field = args.fields.find((f) => f.id === id)!
        setCorrections((prev) => ({ ...prev, [id]: { original: field.value, by: 'Emily Carter', time: '14:32' } }))
        setValues((prev) => ({ ...prev, [id]: next }))
        setEditingId(null)
      }}
    />
  )
}

/** Inline correction: Enter saves (Corrected state, focus back on the pencil); Escape cancels (original kept, focus back on the pencil). */
export const InlineCorrection: Story = {
  render: (args) => <Stateful {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Correct Provider' }))
    const input = canvas.getByRole('textbox', { name: 'Edit Provider' })
    await waitFor(() => expect(input).toHaveFocus())
    await userEvent.clear(input)
    await userEvent.type(input, 'Riverside Family Clinic{Enter}')
    await expect(canvas.getByText('Riverside Family Clinic')).toBeInTheDocument()
    await expect(canvas.getByText("St. Luke's Medical Center", { selector: 's' })).toBeInTheDocument()
    await expect(canvas.getByText('Corrected')).toBeInTheDocument()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Correct Provider' })).toHaveFocus())

    await userEvent.click(canvas.getByRole('button', { name: 'Correct Diagnosis code' }))
    const other = canvas.getByRole('textbox', { name: 'Edit Diagnosis code' })
    await userEvent.clear(other)
    await userEvent.type(other, 'X99.9{Escape}')
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
    await expect(canvas.getByText('S82.6')).toBeInTheDocument()
    await expect(canvas.queryByText('X99.9')).not.toBeInTheDocument()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Correct Diagnosis code' })).toHaveFocus())
  },
}

/** Missing field: the row's own action enters a value; it becomes a Corrected field. */
export const EnterMissingValue: Story = {
  render: (args) => <Stateful {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Correct Treatment date' }))
    const input = canvas.getByRole('textbox', { name: 'Edit Treatment date' })
    await userEvent.type(input, '19 Sep 2026{Enter}')
    await expect(canvas.getByText('19 Sep 2026')).toBeInTheDocument()
    await expect(canvas.getByText('Agent found no value')).toBeVisible()
  },
}

export const Citation: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getAllByRole('button', { name: 'Open Invoice, page 1' })[0])
    await expect(args.onOpenCitation).toHaveBeenCalledWith({ doc: 'Invoice', page: 1 })
  },
}
