import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import type { NextActionResult } from '@/lib/worklist'
import { NextAction } from './NextAction'

const actions: NextActionResult[] = [
  { kind: 'first-contact', text: 'Call the policyholder (first contact)' },
  { kind: 'enter-fields', text: 'Enter fields manually (agent failed)' },
  { kind: 'review-fields', text: 'Verify 2 low-confidence fields, 1 missing' },
  { kind: 'senior-approval', text: 'Send for senior approval' },
  { kind: 'decide', text: 'Decide payout €5,950.00' },
  { kind: 'release-payment', text: 'Release payment €360.00' },
  { kind: 'review-new-info', text: 'Review new document: discharge letter' },
  { kind: 'chase', text: 'Chase discharge letter · follow-up 12 Oct' },
  { kind: 'await', text: 'Awaiting senior approval · sent 2 d ago' },
]

const meta = {
  title: 'Patterns/NextAction',
  component: NextAction,
  args: actions[4],
  argTypes: { kind: { control: 'select', options: actions.map((a) => a.kind) } },
  decorators: [
    (Story, context) =>
      context.name === 'All kinds' ? (
        <Story />
      ) : (
        <div className="max-w-96">
          <Story />
        </div>
      ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The next step on a claim, as a verb phrase with an icon. Waiting ("await") is muted because there is nothing to do yet. One line: when cut off, the full text opens in a tooltip and the text takes focus.',
      },
    },
  },
} satisfies Meta<typeof NextAction>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ReviewFields: Story = { args: actions[2] }
export const EnterFields: Story = { args: actions[1] }
export const Decide: Story = { args: actions[4] }
export const SeniorApproval: Story = { args: actions[3] }
export const FirstContact: Story = { args: actions[0] }
export const ReleasePayment: Story = { args: actions[5] }
export const ReviewNewInfo: Story = { args: actions[6] }
export const Chase: Story = { args: actions[7] }

/** Waiting on someone else: muted text and an hourglass. */
export const Await: Story = { args: actions[8] }

/** Narrow container: one line with an ellipsis; the full text is in the DOM and in the tooltip. */
export const LongContent: Story = {
  args: { kind: 'chase', text: 'Chase signed statement from Montgomery-Whitfield Property Holdings LLC · follow-up 12 Oct' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Chase signed statement from Montgomery/)).toBeInTheDocument()
  },
}

/** `wrap`: the text breaks onto more lines instead of being cut off. Plain text, no focus stop; for rows that are one link. */
export const Wrapping: Story = {
  args: { kind: 'await', text: 'Awaiting signed payment authorisation from policyholder · since 4 d', wrap: true },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

export const AllKinds: Story = {
  name: 'All kinds',
  render: () => (
    <ul className="flex flex-col gap-3">
      {actions.map((a) => (
        <li key={a.kind}>
          <NextAction {...a} />
        </li>
      ))}
    </ul>
  ),
}
