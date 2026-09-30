import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { getClaimDetail } from '@/data/claim-detail'
import type { AuditEvent } from '@/data/types'
import { AuditTrail } from './AuditTrail'

const events = getClaimDetail('CLM-2026-004817')!.audit

const many: AuditEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `many-${i}`,
  at: `2026-09-23T${String(18 - i).padStart(2, '0')}:10:00`,
  actor: i % 3 === 0 ? { kind: 'agent' } : i % 3 === 1 ? { kind: 'system' } : { kind: 'person', name: 'Emily Carter' },
  event: `Event ${12 - i}`,
}))

const meta = {
  title: 'Review/AuditTrail',
  component: AuditTrail,
  args: { events, onViewAll: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Chronological record, newest first. Each entry: time, who (label + icon, never colour only), what, optional detail. `compact` is the side-panel card with the latest 5 and a "View all" action.',
      },
    },
  },
} satisfies Meta<typeof AuditTrail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole('listitem')
    await expect(items).toHaveLength(5)
    await expect(items[0]).toHaveTextContent('Started review')
    await expect(items[4]).toHaveTextContent('Submitted FNOL form')
  },
}

export const Compact: Story = {
  args: { compact: true },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Audit trail' })
    await expect(within(region).getAllByRole('listitem')).toHaveLength(5)
    await expect(within(region).queryByRole('button', { name: /View all/ })).not.toBeInTheDocument()
  },
}

/** More than 5 events: the card shows the latest 5 and a "View all (n)" button. */
export const CompactViewAll: Story = {
  args: { compact: true, events: many },
  play: async ({ args, canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Audit trail' })
    await expect(within(region).getAllByRole('listitem')).toHaveLength(5)
    const button = within(region).getByRole('button', { name: 'View all (12)' })
    await userEvent.click(button)
    await expect(args.onViewAll).toHaveBeenCalledTimes(1)
  },
}

export const Loading: Story = {
  args: { compact: true, loading: true, events: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading audit trail')
    await expect(canvas.getByRole('region', { name: 'Audit trail' })).toHaveAttribute('aria-busy', 'true')
  },
}

export const Empty: Story = {
  args: { events: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No activity yet')).toBeInTheDocument()
  },
}

export const CompactEmpty: Story = {
  args: { compact: true, events: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No activity yet')).toBeInTheDocument()
  },
}

export const Focus: Story = {
  args: { compact: true, events: many },
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'View all (12)' })).toHaveFocus()
  },
}

export const LongContent: Story = {
  args: {
    events: [
      {
        id: 'long-2',
        at: '2026-09-24T09:05:00',
        actor: { kind: 'person', name: 'Maximilian Alexander von Hohenzollern-Sigmaringen' },
        event:
          'Corrected “Provider” to Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
        detail:
          'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC (agent value: St. Luke’s Medical Center, Zagreb, Republic of Croatia)',
      },
      { id: 'long-1', at: '2026-09-22T09:12:00', actor: { kind: 'policyholder' }, event: 'Submitted FNOL form', detail: '3 pages' },
    ],
  },
}

export const ManyEvents: Story = { args: { events: many } }
