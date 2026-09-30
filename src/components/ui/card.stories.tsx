import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Card',
  component: Card,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Surface for a group of related content. Use `CardTitle as="h2"` when the title belongs in the page outline.',
      },
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle as="h2">Claim summary</CardTitle>
        <CardDescription>CLM-2026-004821 · Motor</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body text-fg">Emily Carter is reviewing a rear-end collision claim reported on 09 Sep 2026.</p>
      </CardContent>
    </Card>
  ),
}

export const WithActionAndFooter: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle as="h2">Needs attention</CardTitle>
        <CardDescription>Sorted by SLA and risk flags</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Refresh
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-body text-fg">3 claims are overdue and 2 agent runs failed.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm">
          Dismiss
        </Button>
        <Button size="sm">View all claims</Button>
      </CardFooter>
    </Card>
  ),
}

export const Loading: Story = {
  render: (args) => (
    <Card {...args} aria-busy="true">
      <CardHeader>
        <div role="status" className="sr-only">
          Loading claim summary
        </div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  ),
}

// Header only: a card with no content collapses to its header and the content slot is left out.
export const Empty: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle as="h2">Activity</CardTitle>
        <CardDescription>No activity yet. Events appear here once the claim is assigned.</CardDescription>
      </CardHeader>
    </Card>
  ),
}

export const LongContent: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle as="h2" className="truncate" title="Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC">
          Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC
        </CardTitle>
        <CardDescription className="truncate">CLM-2026-004819 · Policy POL-PRP-2026-0048213 · Loss date outside policy period</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body text-fg">
          The adjuster report describes water damage across three floors of the warehouse. The agent flagged the loss date as outside the policy period and
          referred the claim to underwriting for a coverage decision before any payout is approved.
        </p>
      </CardContent>
    </Card>
  ),
}
