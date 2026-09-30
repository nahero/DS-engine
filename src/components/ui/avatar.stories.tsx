import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check } from 'lucide-react'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar'

// A 1x1 transparent GIF: a valid image that paints nothing, so the story needs no network.
const blankImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          'Radix avatar with an initials fallback. The fallback is text, so name the avatar (`role="img"` + `aria-label`) or hide it when the name is written beside it.',
      },
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Avatar {...args} role="img" aria-label="Emily Carter">
      <AvatarFallback aria-hidden="true">EC</AvatarFallback>
    </Avatar>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm" role="img" aria-label="Emily Carter, small">
        <AvatarFallback aria-hidden="true">EC</AvatarFallback>
      </Avatar>
      <Avatar role="img" aria-label="Emily Carter, default">
        <AvatarFallback aria-hidden="true">EC</AvatarFallback>
      </Avatar>
      <Avatar size="lg" role="img" aria-label="Emily Carter, large">
        <AvatarFallback aria-hidden="true">EC</AvatarFallback>
      </Avatar>
    </div>
  ),
}

// The image never paints here (blank GIF); the fallback stays the fallback when an image fails to load.
export const WithImage: Story = {
  render: () => (
    <Avatar role="img" aria-label="Rachel Morgan">
      <AvatarImage src={blankImage} alt="" />
      <AvatarFallback aria-hidden="true">RM</AvatarFallback>
    </Avatar>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm" role="img" aria-label="Daniel Brooks, online">
        <AvatarFallback aria-hidden="true">DB</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <Avatar role="img" aria-label="Jessica Turner, verified">
        <AvatarFallback aria-hidden="true">JT</AvatarFallback>
        <AvatarBadge>
          <Check aria-hidden="true" />
        </AvatarBadge>
      </Avatar>
      <Avatar size="lg" role="img" aria-label="Megan Foster, verified">
        <AvatarFallback aria-hidden="true">MF</AvatarFallback>
        <AvatarBadge>
          <Check aria-hidden="true" />
        </AvatarBadge>
      </Avatar>
    </div>
  ),
}

export const Group: Story = {
  render: () => (
    <AvatarGroup role="group" aria-label="Claim handlers: Emily Carter, Rachel Morgan, Daniel Brooks and 4 more">
      <Avatar aria-hidden="true">
        <AvatarFallback>EC</AvatarFallback>
      </Avatar>
      <Avatar aria-hidden="true">
        <AvatarFallback>RM</AvatarFallback>
      </Avatar>
      <Avatar aria-hidden="true">
        <AvatarFallback>DB</AvatarFallback>
      </Avatar>
      <AvatarGroupCount aria-hidden="true">+4</AvatarGroupCount>
    </AvatarGroup>
  ),
}

// Initials are expected to be 1-2 characters. Longer fallback text is clipped by the circle (overflow-hidden), never wraps or grows the avatar.
export const LongFallback: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar role="img" aria-label="Bartholomew Featherstonehaugh-Montgomery">
        <AvatarFallback aria-hidden="true">
          <span className="truncate px-1">Bartholomew Featherstonehaugh-Montgomery</span>
        </AvatarFallback>
      </Avatar>
      <Avatar size="sm" role="img" aria-label="Unassigned">
        <AvatarFallback aria-hidden="true">?</AvatarFallback>
      </Avatar>
    </div>
  ),
}
