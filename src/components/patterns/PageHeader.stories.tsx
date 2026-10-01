import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { expect } from 'storybook/test'
import { PageHeader } from './PageHeader'

const meta = {
  title: 'Patterns/PageHeader',
  component: PageHeader,
  args: { title: 'Claims queue', subtitle: '128 claims awaiting review' },
  parameters: {
    docs: {
      description: {
        component:
          'Screen title row: the one `h1` per page, an optional subtitle, status badges beside the title and page-level actions on the right. Wraps on narrow widths.',
      },
    },
  },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button variant="outline">
          <Download /> Export
        </Button>
        <Button>Assign to me</Button>
      </>
    ),
  },
}

export const ClaimDetail: Story = {
  args: {
    title: 'CLM-2026-004821',
    titleClassName: 'font-mono',
    subtitle: 'Emily Carter · Motor · reported 09 Sep 2026',
    badges: (
      <>
        <Badge variant="outline">In review</Badge>
        <Badge variant="destructive">Overdue by 4 days</Badge>
      </>
    ),
    actions: (
      <>
        <Button variant="outline">Refer</Button>
        <Button>Approve</Button>
      </>
    ),
  },
}

export const TitleOnly: Story = {
  args: { subtitle: undefined },
}

export const Focus: Story = {
  args: {
    title: 'Claims queue',
    titleProps: { tabIndex: -1 },
    actions: <Button>Assign to me</Button>,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Assign to me' })).toHaveFocus()
  },
}

// The title wraps; it never truncates, because it is the page's name.
export const LongTitle: Story = {
  args: {
    title: 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC',
    subtitle: 'Policy POL-PRP-2026-0048213 · 14 open claims · renewed 01 Jan 2026 with a coverage change that needs underwriting review',
    badges: <Badge variant="outline">Referred for review</Badge>,
    actions: <Button>Assign to me</Button>,
  },
}
