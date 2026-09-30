import type { Meta, StoryObj } from '@storybook/react-vite'
import { Clock } from 'lucide-react'
import { expect, userEvent } from 'storybook/test'
import { Badge } from './badge'

const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const
const labels: Record<(typeof variants)[number], string> = {
  default: 'In review',
  secondary: 'New',
  destructive: 'Denied',
  outline: 'Info requested',
  ghost: 'Closed',
  link: 'Reopened',
}

const meta = {
  title: 'UI/Badge',
  component: Badge,
  args: { children: 'In review' },
  argTypes: {
    variant: { control: 'select', options: variants },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Short label. Always carries text: never use colour alone to say a claim is denied or overdue. Domain status badges live in `StatusBadge`.',
      },
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((v) => (
        <Badge key={v} variant={v}>
          {labels[v]}
        </Badge>
      ))}
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="outline">
        <Clock aria-hidden="true" /> Due in 2 days
      </Badge>
      <Badge variant="destructive">
        <Clock aria-hidden="true" /> Overdue by 4 days
      </Badge>
    </div>
  ),
}

// As a link the badge is focusable; Tab shows the focus ring.
export const Focus: Story = {
  render: () => (
    <Badge asChild variant="outline">
      <a href="#claim-CLM-2026-004821">CLM-2026-004821</a>
    </Badge>
  ),
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: 'CLM-2026-004821' })).toHaveFocus()
  },
}

// A badge is not interactive, so "disabled" is shown on its link form.
export const Disabled: Story = {
  render: () => (
    <Badge asChild variant="outline" className="opacity-50">
      <a aria-disabled="true">Escalate</a>
    </Badge>
  ),
}

// Invalid: aria-invalid draws the destructive border. The message names the problem; the border alone is not the signal.
export const Invalid: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge variant="outline" aria-invalid="true" aria-describedby="badge-error">
        Loss date
      </Badge>
      <span id="badge-error" className="text-caption text-status-danger-fg">
        Error: outside the policy period
      </span>
    </div>
  ),
}

// The badge never wraps; constrain the width and truncate inside. The full text stays in `title`.
export const LongLabel: Story = {
  render: () => {
    const label = 'Referred for review: loss date outside policy period and above authority limit'
    return (
      <div className="flex max-w-56 flex-col items-start gap-3">
        <Badge variant="outline" className="max-w-full" title={label}>
          <span className="truncate">{label}</span>
        </Badge>
        <Badge className="max-w-full" title={label}>
          <span className="truncate">{label}</span>
        </Badge>
      </div>
    )
  },
}
