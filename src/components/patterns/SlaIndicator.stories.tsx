import type { Meta, StoryObj } from '@storybook/react-vite'
import { SlaIndicator } from './SlaIndicator'

const meta = {
  title: 'Patterns/SlaIndicator',
  component: SlaIndicator,
  args: { days: -1 },
  argTypes: { days: { control: 'number' } },
  parameters: {
    docs: {
      description: {
        component:
          'SLA deadline as icon + words: overdue (danger), due today (warning), due in N days (muted), or "—" when not applicable. Meaning is in the words; colour is secondary.',
      },
    },
  },
} satisfies Meta<typeof SlaIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Overdue: Story = { args: { days: -1 } }
export const DueToday: Story = { args: { days: 0 } }
export const DueSoon: Story = { args: { days: 2 } }
/** Paid, denied or closed claims have no SLA: "—" with a visually hidden "Not applicable". */
export const NotApplicable: Story = { args: { days: null } }

export const LongOverdue: Story = { args: { days: -128 } }

export const AllVariants: Story = {
  render: () => (
    <ul className="flex flex-col gap-3">
      {[-14, -1, 0, 1, 7, null].map((d) => (
        <li key={String(d)}>
          <SlaIndicator days={d} />
        </li>
      ))}
    </ul>
  ),
}
