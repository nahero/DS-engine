import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ClaimFlag } from '@/data/types'
import { FlagLabel } from './FlagLabel'

const flags: ClaimFlag[] = [
  'Loss date outside policy period',
  'Agent failed',
  'Above authority limit',
  'Duplicate suspected',
  'Awaiting document',
  'Referred for review',
]

const meta = {
  title: 'Review/FlagLabel',
  component: FlagLabel,
  args: { flag: 'Loss date outside policy period' },
  argTypes: { flag: { control: 'select', options: flags } },
  parameters: {
    docs: {
      description: {
        component: 'Neutral reason a claim needs attention: icon + plain text. Never accusatory, never colour-only.',
      },
    },
  },
} satisfies Meta<typeof FlagLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <ul className="flex flex-col gap-3">
      {flags.map((f) => (
        <li key={f}>
          <FlagLabel flag={f} />
        </li>
      ))}
    </ul>
  ),
}

/** Narrow container: the label wraps rather than clipping, since the reason is the point of the row. */
export const LongContent: Story = {
  render: () => (
    <div className="w-32">
      <FlagLabel flag="Loss date outside policy period" />
    </div>
  ),
}
