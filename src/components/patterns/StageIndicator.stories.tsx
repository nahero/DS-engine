import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { Stage } from '@/lib/worklist'
import { StageIndicator } from './StageIndicator'

const stages: Stage[] = [
  { step: 1, label: 'Assigned' },
  { step: 2, label: 'Coverage' },
  { step: 3, label: 'Assessment' },
  { step: 4, label: 'Decision' },
  { step: 5, label: 'Payment' },
]

const meta = {
  title: 'Patterns/StageIndicator',
  component: StageIndicator,
  args: { step: 3, label: 'Assessment' },
  argTypes: { step: { control: 'select', options: [1, 2, 3, 4, 5] } },
  parameters: {
    docs: {
      description: {
        component:
          'Where a claim is between assignment and payment: five segments filled up to the current step, then the stage name. The name is always shown (accessible name "Stage 3 of 5: Assessment"), so position never relies on the segments or on colour.',
      },
    },
  },
} satisfies Meta<typeof StageIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Stage 3 of 5:', { exact: false })).toBeInTheDocument()
  },
}

export const Assigned: Story = { args: { step: 1, label: 'Assigned' } }
export const Coverage: Story = { args: { step: 2, label: 'Coverage' } }
export const Assessment: Story = { args: { step: 3, label: 'Assessment' } }
export const Decision: Story = { args: { step: 4, label: 'Decision' } }
export const Payment: Story = { args: { step: 5, label: 'Payment' } }

/** Narrow container: one line, never wraps; the row it sits in decides how much room it gets. */
export const LongContent: Story = {
  render: () => (
    <div className="w-32 overflow-hidden">
      <StageIndicator step={3} label="Assessment" />
    </div>
  ),
}

export const AllSteps: Story = {
  render: () => (
    <ul className="flex flex-col gap-3">
      {stages.map((s) => (
        <li key={s.step}>
          <StageIndicator {...s} />
        </li>
      ))}
    </ul>
  ),
}
