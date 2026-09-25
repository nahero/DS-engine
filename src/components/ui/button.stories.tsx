import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'

// Placeholder story to verify the Storybook pipeline. Full-state stories come with the new-component skill.
const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Approve' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
    size: { control: 'select', options: ['default', 'xs', 'sm', 'lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
