import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check, Forward, MoreHorizontal, Trash2, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu'

function ClaimActions() {
  const [showNotes, setShowNotes] = useState(true)
  const [sort, setSort] = useState('sla')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>CLM-2026-004821</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserCheck /> Assign to me <DropdownMenuShortcut>A</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Forward /> Refer to underwriting
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Check /> Approve (needs second approver)
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showNotes} onCheckedChange={setShowNotes}>
          Show internal notes
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="sla">SLA</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="amount">Claimed amount</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 /> Reject claim
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  render: () => <ClaimActions />,
  decorators: [
    (Story) => (
      <div className="min-h-96">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Radix dropdown menu. Arrow keys, Home/End and typeahead move between items; Esc closes and returns focus to the trigger. Icon-only triggers need an `aria-label`.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

// Modal Radix menus aria-hide the page (trigger included) while open, and their scrollable content only holds roving-tabindex
// items (tabindex -1). Known false positives; same override as DisplayMenu. Focus is trapped in the menu.
const modalA11y = {
  a11y: {
    config: {
      rules: [
        { id: 'aria-hidden-focus', enabled: false },
        { id: 'scrollable-region-focusable', enabled: false },
      ],
    },
  },
}

export const Closed: Story = {}

export const Focus: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Actions' })).toHaveFocus()
  },
}

export const Open: Story = {
  parameters: modalA11y,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
    const item = await screen.findByRole('menuitem', { name: /Assign to me/ })
    await waitFor(() => expect(item).toBeVisible())
    await expect(screen.getByRole('menuitemcheckbox', { name: 'Show internal notes' })).toBeChecked()
    await expect(screen.getByRole('menuitemradio', { name: 'SLA' })).toBeChecked()
    await expect(screen.getByRole('menuitem', { name: /Approve/ })).toHaveAttribute('aria-disabled', 'true')
  },
}

export const Keyboard: Story = {
  parameters: modalA11y,
  play: async ({ canvas }) => {
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    await waitFor(() => expect(menu).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Actions' })).toHaveFocus())
  },
}

export const IconTrigger: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Row actions for CLM-2026-004821">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>Open claim</DropdownMenuItem>
        <DropdownMenuItem>Copy claim number</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

export const DisabledTrigger: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled>
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Assign to me</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

// Items never wrap past the menu width: long labels truncate and keep the full text in `title`.
export const LongItem: Story = {
  parameters: modalA11y,
  render: () => {
    const name = 'Reassign to Bartholomew Featherstonehaugh-Montgomery (Senior Underwriting Referrals Team)'
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Reassign</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem title={name}>
            <span className="truncate">{name}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>Reassign to Emily Carter</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Reassign' }))
    const item = await screen.findByRole('menuitem', { name: /Bartholomew/ })
    await waitFor(() => expect(item).toBeVisible())
  },
}
