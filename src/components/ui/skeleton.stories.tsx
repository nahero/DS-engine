import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component:
          'Placeholder while content loads. Purely visual: wrap a group in `role="status"` with a screen-reader label, and mark the region `aria-busy`. Pulse stops under reduced motion.',
      },
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { className: 'h-4 w-48' },
}

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-control w-24" />
    </div>
  ),
}

export const Loading: Story = {
  render: () => (
    <div aria-busy="true" className="flex max-w-sm flex-col gap-3">
      <div role="status" className="sr-only">
        Loading claims
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  ),
}
