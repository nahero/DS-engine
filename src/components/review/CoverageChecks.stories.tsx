import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { getClaimDetail } from '@/data/claim-detail'
import type { CoverageCheck } from '@/data/types'
import { CoverageChecks } from './CoverageChecks'

const checks = getClaimDetail('CLM-2026-004817')!.coverage

const meta = {
  title: 'Review/CoverageChecks',
  component: CoverageChecks,
  args: { checks },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Policy checks the agent ran. The result is always icon + word (Pass, Flagged, Unknown); colour is a secondary cue.',
      },
    },
  },
} satisfies Meta<typeof CoverageChecks>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4)
    await expect(canvas.getAllByText('Pass')).toHaveLength(3)
    await expect(canvas.getByText('Unknown')).toBeInTheDocument()
  },
}

export const Flagged: Story = {
  args: { checks: getClaimDetail('CLM-2026-004821')!.coverage },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Flagged')).toBeInTheDocument()
  },
}

/** Agent failed: nothing could be checked. */
export const AllUnknown: Story = {
  args: { checks: getClaimDetail('CLM-2026-004819')!.coverage },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Unknown')).toHaveLength(4)
  },
}

export const AllPass: Story = {
  args: { checks: getClaimDetail('CLM-2026-004803')!.coverage },
}

export const Empty: Story = {
  args: { checks: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No coverage checks yet')).toBeInTheDocument()
    await expect(within(canvasElement).queryByRole('list')).not.toBeInTheDocument()
  },
}

const longCheck: CoverageCheck = {
  id: 'long',
  label:
    'Loss type covered (Inpatient treatment at a non-network provider outside the country of residence including air ambulance repatriation)',
  result: 'flag',
  detail:
    'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC is not a registered network provider; out-of-network treatment is reimbursed at 60% up to the annual sub-limit, subject to prior authorisation which was not found on file for this claim.',
}

export const LongContent: Story = {
  args: { checks: [longCheck, ...checks] },
}

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
}
