import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent, waitFor } from 'storybook/test'
import { Button } from './button'
import { Input } from './input'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet'

const sides = ['right', 'left', 'top', 'bottom'] as const

function ClaimSheet({ side = 'right', ...props }: { side?: (typeof sides)[number] } & React.ComponentProps<typeof Sheet>) {
  return (
    <Sheet {...props}>
      <SheetTrigger asChild>
        <Button variant="outline">Edit claim</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Edit claim CLM-2026-004821</SheetTitle>
          <SheetDescription>Change the claimant details. Changes are saved to the audit trail.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-1.5 px-inset">
          <label htmlFor={`sheet-policyholder-${side}`} className="text-label font-medium text-fg">
            Policyholder
          </label>
          <Input id={`sheet-policyholder-${side}`} defaultValue="Emily Carter" />
        </div>
        <SheetFooter>
          <Button>Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  render: (args) => <ClaimSheet {...args} />,
  parameters: {
    docs: {
      description: {
        component: 'Modal panel that slides from an edge (Radix Dialog). Title and description are required for assistive tech; Esc closes and focus returns to the trigger.',
      },
    },
  },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

// Modal Radix overlays aria-hide the page (trigger included) while open. Known false positive; focus is trapped inside the dialog.
const modalA11y = {
  a11y: {
    config: {
      rules: [{ id: 'aria-hidden-focus', enabled: false }],
    },
  },
}

export const Closed: Story = {}

export const Focus: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Edit claim' })).toHaveFocus()
  },
}

export const Open: Story = {
  parameters: modalA11y,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit claim' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit claim CLM-2026-004821' })
    await waitFor(() => expect(dialog).toBeVisible())
    await expect(dialog).toHaveAccessibleDescription('Change the claimant details. Changes are saved to the audit trail.')
  },
}

export const Left: Story = {
  parameters: modalA11y,
  render: (args) => <ClaimSheet {...args} side="left" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit claim' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
  },
}

export const Top: Story = {
  parameters: modalA11y,
  render: (args) => <ClaimSheet {...args} side="top" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit claim' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
  },
}

export const Bottom: Story = {
  parameters: modalA11y,
  render: (args) => <ClaimSheet {...args} side="bottom" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Edit claim' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
  },
}

export const LongContent: Story = {
  parameters: modalA11y,
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <Button variant="outline">Audit trail</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Audit trail for Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC</SheetTitle>
          <SheetDescription>Every change to CLM-2026-004819, newest first.</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-1 flex-col gap-3 overflow-y-auto px-inset text-body text-fg" tabIndex={0} aria-label="Audit events">
          {Array.from({ length: 30 }, (_, i) => (
            <li key={i}>
              Event {30 - i}: Emily Carter changed the loss date and the agent re-ran the coverage checks.
            </li>
          ))}
        </ul>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Audit trail' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toBeVisible())
  },
}
