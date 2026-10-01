import type { Meta, StoryObj } from '@storybook/react-vite'
import { kpis } from '@/data/overview'
import { KpiCard } from './KpiCard'

const [open, , , , breaches] = kpis

const meta = {
  title: 'Patterns/KpiCard',
  component: KpiCard,
  args: { kpi: open },
  decorators: [
    // Single cards are shown at dashboard-column width; the Row story lays out its own grid.
    (Story, context) =>
      context.name === 'Row' ? (
        <Story />
      ) : (
        <div className="max-w-64">
          <Story />
        </div>
      ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Headline number with a label and a hint row (`<dl>` keeps them associated). `tone: "danger"` renders the hint as a soft danger pill with icon + text. Missing value shows "—" plus "Missing".',
      },
    },
  },
} satisfies Meta<typeof KpiCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Danger: Story = { args: { kpi: breaches } }

export const MissingValue: Story = { args: { kpi: { id: 'time', label: 'Avg time to decision', value: null } } }

export const Loading: Story = { args: { kpi: undefined, loading: true } }

export const NoHint: Story = { args: { kpi: { id: 'x', label: 'Open claims', value: '1,284' } } }

export const LongContent: Story = {
  args: {
    kpi: {
      id: 'long',
      label: 'Average time to first decision across all lines of business',
      value: '1,234,567.89',
      hint: { icon: 'target', text: 'Target 5 d · within target for every line of business this period' },
    },
  },
}

/** All five overview KPIs in the dashboard row, plus loading and missing. */
export const Row: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-stack lg:grid-cols-5">
      {kpis.map((k) => (
        <KpiCard key={k.id} kpi={k} />
      ))}
      <KpiCard loading />
      <KpiCard kpi={{ id: 'm', label: 'Agent auto-approved', value: null }} />
    </div>
  ),
}
