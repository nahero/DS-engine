import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination'

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  parameters: {
    docs: {
      description: {
        component: 'Page links for a long list. The current page carries `aria-current="page"` and the outline style; Previous and Next have accessible names.',
      },
    },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Pagination {...args}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#page-1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-1" aria-label="Go to page 1">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-2" isActive aria-label="Page 2, current page">
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-3" aria-label="Go to page 3">
            3
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#page-3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
}

export const ManyPages: Story = {
  render: (args) => (
    <Pagination {...args}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#page-49" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-1" aria-label="Go to page 1">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-49" aria-label="Go to page 49">
            49
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-50" isActive aria-label="Page 50, current page">
            50
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-51" aria-label="Go to page 51">
            51
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-128" aria-label="Go to page 128">
            128
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#page-51" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
}

export const Focus: Story = {
  ...Default,
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: 'Go to previous page' })).toHaveFocus()
  },
}

// First page: Previous is `aria-disabled` and out of the tab order.
export const Disabled: Story = {
  render: (args) => (
    <Pagination {...args}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious aria-disabled="true" tabIndex={-1} className="pointer-events-none opacity-50" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-1" isActive aria-label="Page 1, current page">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-2" aria-label="Go to page 2">
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#page-2" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
}

// Single page (an empty result set still has page 1): both arrows are disabled.
export const SinglePage: Story = {
  render: (args) => (
    <Pagination {...args}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious aria-disabled="true" tabIndex={-1} className="pointer-events-none opacity-50" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-1" isActive aria-label="Page 1, current page">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext aria-disabled="true" tabIndex={-1} className="pointer-events-none opacity-50" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
}

// Five-digit page numbers still fit: links size to content (min one control wide).
export const LongLabels: Story = {
  render: (args) => (
    <Pagination {...args}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#page-10000" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-10000" size="default" aria-label="Go to page 10,000">
            10,000
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#page-10001" size="default" isActive aria-label="Page 10,001, current page">
            10,001
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#page-10002" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
}
