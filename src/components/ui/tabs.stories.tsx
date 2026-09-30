import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileText, History } from 'lucide-react'
import { expect, userEvent } from 'storybook/test'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  args: { defaultValue: 'summary' },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'Radix tabs in two looks: `default` (pill on a subtle track) and `line` (underline). Arrow keys move between tabs, Home/End jump, Tab moves into the panel.',
      },
    },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const panelClass = 'text-body text-fg'

export const Default: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Claim sections">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className={panelClass}>
        Rear-end collision reported 09 Sep 2026. Emily Carter is the assigned handler.
      </TabsContent>
      <TabsContent value="documents" className={panelClass}>
        4 documents received: police report, repair estimate, photos, policy schedule.
      </TabsContent>
      <TabsContent value="activity" className={panelClass}>
        Agent extracted 12 fields with 94% confidence.
      </TabsContent>
    </Tabs>
  ),
}

export const Line: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="line" aria-label="Claim sections">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className={panelClass}>
        Rear-end collision reported 09 Sep 2026. Emily Carter is the assigned handler.
      </TabsContent>
      <TabsContent value="documents" className={panelClass}>
        4 documents received: police report, repair estimate, photos, policy schedule.
      </TabsContent>
      <TabsContent value="activity" className={panelClass}>
        Agent extracted 12 fields with 94% confidence.
      </TabsContent>
    </Tabs>
  ),
}

export const WithIcons: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="documents">
      <TabsList aria-label="Claim sections">
        <TabsTrigger value="documents">
          <FileText aria-hidden="true" /> Documents
        </TabsTrigger>
        <TabsTrigger value="history">
          <History aria-hidden="true" /> History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="documents" className={panelClass}>
        4 documents received.
      </TabsContent>
      <TabsContent value="history" className={panelClass}>
        12 events.
      </TabsContent>
    </Tabs>
  ),
}

export const Vertical: Story = {
  render: (args) => (
    <Tabs {...args} orientation="vertical" className="flex-row">
      <TabsList variant="line" aria-label="Claim sections">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className={panelClass}>
        Rear-end collision reported 09 Sep 2026.
      </TabsContent>
      <TabsContent value="documents" className={panelClass}>
        4 documents received.
      </TabsContent>
      <TabsContent value="activity" className={panelClass}>
        12 events.
      </TabsContent>
    </Tabs>
  ),
}

export const Focus: Story = {
  ...Default,
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('tab', { name: 'Summary' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('tab', { name: 'Documents' })).toHaveFocus()
  },
}

export const Disabled: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Claim sections">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="payout" disabled>
          Payout
        </TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className={panelClass}>
        Payout opens once the claim is approved.
      </TabsContent>
      <TabsContent value="documents" className={panelClass}>
        4 documents received.
      </TabsContent>
    </Tabs>
  ),
}

// Empty panel: say what is missing and what to do, never a blank area.
export const EmptyPanel: Story = {
  render: (args) => (
    <Tabs {...args} defaultValue="documents">
      <TabsList aria-label="Claim sections">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className={panelClass}>
        Rear-end collision reported 09 Sep 2026.
      </TabsContent>
      <TabsContent value="documents" className="text-body text-fg-muted">
        No documents yet. Request the repair estimate from the policyholder.
      </TabsContent>
    </Tabs>
  ),
}

// Many tabs with long labels: the list scrolls horizontally inside its own width, triggers never wrap.
export const LongLabels: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Claim sections">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="documents">Supporting documents and correspondence</TabsTrigger>
        <TabsTrigger value="activity">Agent activity and audit trail</TabsTrigger>
        <TabsTrigger value="payout">Payout breakdown</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className={panelClass}>
        Rear-end collision reported 09 Sep 2026.
      </TabsContent>
    </Tabs>
  ),
}
