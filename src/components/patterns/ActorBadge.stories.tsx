import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Actor } from '@/data/types'
import { ActorBadge } from './ActorBadge'

const actors: Actor[] = [
  { kind: 'agent' },
  { kind: 'person', name: 'Emily Carter' },
  { kind: 'system' },
  { kind: 'policyholder' },
]

const meta = {
  title: 'Patterns/ActorBadge',
  component: ActorBadge,
  args: { actor: { kind: 'agent' } },
  parameters: {
    docs: {
      description: {
        component:
          'Who acted: agent, handler (by name), system or policyholder. Icon + text, never colour alone. Long names truncate with the full name in `title`.',
      },
    },
  },
} satisfies Meta<typeof ActorBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {actors.map((a) => (
        <ActorBadge key={a.kind} actor={a} />
      ))}
    </div>
  ),
}

export const LongName: Story = {
  render: () => (
    <div className="w-40">
      <ActorBadge actor={{ kind: 'person', name: 'Alexandra Montgomery-Whitfield-Featherstonehaugh' }} />
    </div>
  ),
}
