import type { Meta, StoryObj } from '@storybook/react-vite'
import { UserAvatar } from './UserAvatar'

const meta = {
  title: 'Patterns/UserAvatar',
  component: UserAvatar,
  args: { name: 'Emily Carter', initials: 'EC' },
  parameters: {
    docs: {
      description: {
        component:
          'Initials avatar for the signed-in user. Labelled (`role="img"` named after the user) when it stands alone; decorative (hidden from assistive tech) when the name is written beside it.',
      },
    },
  },
} satisfies Meta<typeof UserAvatar>

export default meta
type Story = StoryObj<typeof meta>

// Standalone: announced as "Emily Carter, image".
export const Labelled: Story = {}

// Name written next to it: the avatar adds nothing for screen readers.
export const Decorative: Story = {
  args: { decorative: true },
  render: (args) => (
    <div className="flex items-center gap-2">
      <UserAvatar {...args} />
      <div className="flex flex-col">
        <span className="text-label font-medium text-fg">Emily Carter</span>
        <span className="text-caption text-fg-muted">Claims handler</span>
      </div>
    </div>
  ),
}

export const CustomUser: Story = {
  args: { name: 'Rachel Morgan', initials: 'RM' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <UserAvatar name="Emily Carter, small" initials="EC" className="size-6" />
      <UserAvatar name="Emily Carter, default" initials="EC" />
      <UserAvatar name="Emily Carter, large" initials="EC" className="size-10" />
    </div>
  ),
}

// Unassigned or unknown user: the fallback is a single placeholder character and the name says so.
export const Unassigned: Story = {
  args: { name: 'Unassigned', initials: '?' },
}

export const LongName: Story = {
  args: { name: 'Bartholomew Featherstonehaugh-Montgomery', initials: 'BF' },
}
