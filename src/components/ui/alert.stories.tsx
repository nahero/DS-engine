import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleAlert, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './alert'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Inline message that announces itself (`role="alert"`). Status is carried by the icon and the title text, not by colour alone.',
      },
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info aria-hidden="true" />
      <AlertTitle>Claim CLM-2026-004821 is awaiting a document</AlertTitle>
      <AlertDescription>
        <p>The policyholder has 5 days to upload the repair estimate before the SLA clock resumes.</p>
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>Error: extraction failed for CLM-2026-004819</AlertTitle>
      <AlertDescription>
        <p>The agent could not read the loss adjuster report. Retry the extraction or enter the fields manually.</p>
      </AlertDescription>
    </Alert>
  ),
}

export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info aria-hidden="true" />
      <AlertTitle>Emily Carter assigned this claim to you</AlertTitle>
    </Alert>
  ),
}

export const WithoutIcon: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Payout above authority limit</AlertTitle>
      <AlertDescription>
        <p>Claims over €25,000.00 need a second approver before payment.</p>
      </AlertDescription>
    </Alert>
  ),
}

export const LongContent: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>Error: Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC could not be matched</AlertTitle>
      <AlertDescription>
        <p>
          The policyholder name on the submitted loss adjuster report does not match any policy in the register. Check the policy number
          POL-MTR-2026-0048213, confirm the legal entity name with the broker, and resubmit the claim with the corrected documents attached. If the
          policy was renewed under a different entity, link the new policy before approving any payout.
        </p>
      </AlertDescription>
    </Alert>
  ),
}
