import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Check, Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { userEvent } from 'storybook/test'
import { Button } from './button'

const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const labels: Record<(typeof variants)[number], string> = {
  default: 'Approve',
  secondary: 'Refer',
  outline: 'Correct',
  ghost: 'Skip',
  destructive: 'Reject',
  link: 'View source',
}

const Row = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Approve' },
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'select', options: ['default', 'sm', 'xs', 'icon', 'icon-sm', 'icon-xs'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Obra kit `Button - Nova`. Default size follows density (comfortable 36px, compact 32px). Hover any button to see its hover state.',
      },
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <Row>
      {variants.map((v) => (
        <Button key={v} variant={v}>
          {labels[v]}
        </Button>
      ))}
    </Row>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Row>
        <Button>Default</Button>
        <Button size="sm">Small</Button>
        <Button size="xs">Extra small</Button>
      </Row>
      <Row>
        <Button size="icon" aria-label="Add item">
          <Plus />
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Add item">
          <Plus />
        </Button>
        <Button size="icon-xs" variant="ghost" aria-label="Add item">
          <Plus />
        </Button>
      </Row>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Row>
      <Button>
        <Check /> Approve
      </Button>
      <Button variant="outline">
        Next item <ArrowRight />
      </Button>
      <Button variant="destructive">
        <Trash2 /> Reject
      </Button>
    </Row>
  ),
}

// Focus ring comes from keyboard focus (:focus-visible), so the play function tabs to the button.
export const Focus: Story = {
  play: async () => {
    await userEvent.tab()
  },
}

export const Disabled: Story = {
  render: () => (
    <Row>
      {variants.map((v) => (
        <Button key={v} variant={v} disabled>
          {labels[v]}
        </Button>
      ))}
    </Row>
  ),
}

export const Loading: Story = {
  render: () => (
    <Row>
      <Button loading>Approving</Button>
      <Button variant="secondary" loading>
        Referring
      </Button>
      <Button variant="outline" size="sm" loading>
        Saving
      </Button>
      <Button variant="destructive" loading>
        Rejecting
      </Button>
    </Row>
  ),
}

// Error state: aria-invalid, e.g. a submit button tied to a form with errors.
export const Invalid: Story = {
  render: () => (
    <Row>
      <Button aria-invalid>Submit</Button>
      <Button variant="outline" aria-invalid>
        Submit
      </Button>
    </Row>
  ),
}

// Labels don't wrap. Constrain the width and truncate inside; the full text stays the accessible name and title.
export const LongLabel: Story = {
  render: () => {
    const label = 'Approve all 1,000 high-confidence submissions from Northwind Mutual Insurance Holdings'
    return (
      <div className="flex max-w-xs flex-col items-start gap-3">
        <Button className="max-w-full" title={label}>
          <span className="truncate">{label}</span>
        </Button>
        <Button variant="outline" className="max-w-full" title={label}>
          <Check />
          <span className="truncate">{label}</span>
        </Button>
      </div>
    )
  },
}

export const AsLink: Story = {
  render: () => (
    <Button asChild variant="outline">
      <a href="#source">Open source document</a>
    </Button>
  ),
}
