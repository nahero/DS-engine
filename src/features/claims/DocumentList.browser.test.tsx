import { describe, expect, it } from 'vitest'
import { getClaimDetail } from '@/data/claim-detail'
import type { ClaimDocument } from '@/data/types'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { DocumentList } from './DocumentList'

const documents = getClaimDetail('CLM-2026-004817')!.documents

describe('DocumentList', () => {
  it('lists every document with type, pages and received date, without axe violations', async () => {
    const { container, getByRole } = await render(<DocumentList documents={documents} />)
    const items = getByRole('listitem').elements()
    expect(items).toHaveLength(4)
    expect(items[2].textContent).toContain('Discharge letter')
    expect(items[2].textContent).toContain('2 pages')
    expect(items[1].textContent).toContain('1 page')
    expect(items[1].textContent).not.toContain('1 pages')
    expect(items[1].textContent).toContain('Received 22 Sep 2026')
    expect(container.textContent).not.toContain('Cited on')
    expect(container.querySelector('[aria-current]')).toBeNull()
    await expectNoA11yViolations(container)
  })

  it('highlights, labels and focuses the cited document', async () => {
    const { container, getByRole } = await render(<DocumentList documents={documents} highlight={{ docId: 'doc-invoice', page: 1, nonce: 1 }} />)
    const row = getByRole('listitem').nth(1)
    await expect.element(row).toHaveAttribute('aria-current', 'true')
    await expect.element(row).toMatchTextContent('Cited on p.1')
    await expect.element(row).toHaveFocus()
    // Only the cited row is marked.
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(1)
    await expectNoA11yViolations(container)
  })

  it('moves focus again when the same document is cited again (new nonce)', async () => {
    const { rerender, getByRole } = await render(<DocumentList documents={documents} highlight={{ docId: 'doc-invoice', page: 1, nonce: 1 }} />)
    const row = getByRole('listitem').nth(1)
    await expect.element(row).toHaveFocus()
    row.element().blur()
    await rerender(<DocumentList documents={documents} highlight={{ docId: 'doc-invoice', page: 1, nonce: 2 }} />)
    await expect.element(getByRole('listitem').nth(1)).toHaveFocus()
  })

  it('shows the empty message with no documents', async () => {
    const { container, getByText } = await render(<DocumentList documents={[] as ClaimDocument[]} />)
    await expect.element(getByText('No documents received')).toBeVisible()
    expect(container.querySelector('li')).toBeNull()
    await expectNoA11yViolations(container)
  })
})
