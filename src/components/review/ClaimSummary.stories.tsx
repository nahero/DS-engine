import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { getClaim } from '@/data/claims'
import { ClaimSummary } from './ClaimSummary'

const claim = getClaim('CLM-2026-004817')!
const policyPeriod = { start: '2026-01-01', end: '2026-12-31' }

const meta = {
  title: 'Review/ClaimSummary',
  component: ClaimSummary,
  args: { claim, policyPeriod, onToggleReveal: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Key facts about the claim and its policy. The policy number is masked until revealed (the caller records the reveal in the audit trail). Missing handler and SLA not applicable are labelled, never blank.',
      },
    },
  },
} satisfies Meta<typeof ClaimSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('POL-••••-4821')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Reveal policy number' })).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByText('Emily Carter')).toBeInTheDocument()
  },
}

export const Revealed: Story = {
  args: { policyRevealed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('POL-HRTN-4821')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Hide policy number' })).toHaveAttribute('aria-pressed', 'true')
  },
}

/** Stateful: Reveal shows the full number and flips `aria-pressed`; the caller is told so it can audit it. */
export const RevealToggle: Story = {
  render: function Render(args) {
    const [revealed, setRevealed] = useState(false)
    return (
      <ClaimSummary
        {...args}
        policyRevealed={revealed}
        onToggleReveal={() => {
          args.onToggleReveal?.()
          setRevealed((r) => !r)
        }}
      />
    )
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Reveal policy number' }))
    await expect(args.onToggleReveal).toHaveBeenCalledTimes(1)
    await expect(canvas.getByText('POL-HRTN-4821')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Hide policy number' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Hide policy number' }))
    await expect(canvas.getByText('POL-••••-4821')).toBeInTheDocument()
  },
}

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(within(canvasElement).getByRole('button', { name: 'Reveal policy number' })).toHaveFocus()
  },
}

export const Loading: Story = {
  args: { claim: undefined, policyPeriod: undefined, loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Loading claim summary')
  },
}

/** Missing data: no handler ("Unassigned"), SLA not applicable. */
export const MissingData: Story = {
  args: { claim: { ...claim, handler: null, slaDays: null } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Unassigned')).toBeInTheDocument()
  },
}

export const Overdue: Story = { args: { claim: getClaim('CLM-2026-004821')! } }

export const LongContent: Story = {
  args: {
    claim: { ...claim, handler: 'Maximilian Alexander von Hohenzollern-Sigmaringen-Montgomery', policyNo: 'POL-MTRX-3305' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
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
