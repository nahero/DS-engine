import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { getClaimDetail } from '@/data/claim-detail'
import type { ClaimDocument } from '@/data/types'
import { DocumentList } from './DocumentList'

const documents = getClaimDetail('CLM-2026-004817')!.documents

const meta = {
  title: 'Review/DocumentList',
  component: DocumentList,
  args: { documents },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Documents received for the claim. A cited document gets the citation highlight, a "Cited on p.N" label (not colour only) and focus when `highlight` changes.',
      },
    },
  },
} satisfies Meta<typeof DocumentList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4)
    await expect(canvas.getByText('Discharge letter')).toBeInTheDocument()
    await expect(canvas.queryByText(/Cited on/)).not.toBeInTheDocument()
  },
}

/** A citation was followed: the row is marked, labelled and focused. */
export const Cited: Story = {
  args: { highlight: { docId: 'doc-invoice', page: 1, nonce: 1 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const row = canvas.getByTitle('Invoice').closest('li')!
    await waitFor(() => expect(row).toHaveFocus())
    await expect(row).toHaveAttribute('aria-current', 'true')
    await expect(row).toHaveTextContent('Cited on p.1')
    await expect(canvas.getAllByRole('listitem').filter((li) => li.hasAttribute('aria-current'))).toHaveLength(1)
  },
}

export const Empty: Story = {
  args: { documents: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No documents received')).toBeInTheDocument()
  },
}

export const SinglePage: Story = {
  args: { documents: [{ id: 'one', name: 'Invoice', type: 'Invoice', pages: 1, receivedAt: '2026-09-22' }] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('1 page')).toBeInTheDocument()
  },
}

const longDocs: ClaimDocument[] = [
  {
    id: 'long-1',
    name: 'Scanned handwritten discharge letter from Montgomery-Whitfield-Featherstonehaugh Memorial Hospital and Research Institute.pdf',
    type: 'Discharge',
    pages: 12,
    receivedAt: '2026-09-22',
  },
  ...documents,
]

export const LongContent: Story = {
  args: { documents: longDocs, highlight: { docId: 'long-1', page: 7, nonce: 1 } },
}

export const ManyDocuments: Story = {
  args: {
    documents: Array.from({ length: 40 }, (_, i) => ({
      id: `d-${i}`,
      name: `Supporting document ${i + 1}`,
      type: 'Photo',
      pages: (i % 4) + 1,
      receivedAt: '2026-09-23',
    })),
  },
}

export const Narrow: Story = {
  args: { highlight: { docId: 'doc-invoice', page: 1, nonce: 1 } },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
}
