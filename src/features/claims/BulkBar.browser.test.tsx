import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { getClaim } from '@/data/claims'
import type { Claim } from '@/data/types'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { BulkBar } from './BulkBar'

const pick = (...ids: string[]): Claim[] => ids.map((id) => getClaim(`CLM-2026-${id}`)!)
// 004803 = 96% High · 004799 = 93% High · 004821 = 52% Low · 004819 = no score
const high = pick('004803', '004799')
const handlers = ['Emily Carter', 'Rachel Morgan', 'Daniel Brooks']

const props = (extra: Partial<React.ComponentProps<typeof BulkBar>> = {}) => ({
  selected: high,
  handlers,
  onApprove: vi.fn(),
  onAssign: vi.fn(),
  onClear: vi.fn(),
  ...extra,
})

describe('BulkBar', () => {
  it('shows the count and enables Approve when every selected claim is High confidence, without axe violations', async () => {
    const { container, getByRole, getByText } = await render(<BulkBar {...props()} />)
    await expect.element(getByRole('region', { name: 'Bulk actions' })).toBeVisible()
    await expect.element(getByText('2 selected')).toBeVisible()
    await expect.element(getByText('Bulk approve only for High confidence')).toBeVisible()
    await expect.element(getByRole('button', { name: 'Approve 2' })).toBeEnabled()
    await expectNoA11yViolations(container)
  })

  it('renders nothing when nothing is selected', async () => {
    const { container } = await render(<BulkBar {...props({ selected: [] })} />)
    expect(container.querySelector('[role="region"]')).toBeNull()
    expect(container.textContent).not.toContain('selected')
  })

  it('one Low-confidence claim blocks Approve and the reason is visible text that also describes the button', async () => {
    const onApprove = vi.fn()
    const { container, getByRole, getByText } = await render(<BulkBar {...props({ selected: pick('004803', '004821'), onApprove })} />)
    const approve = getByRole('button', { name: 'Approve 2' })
    await expect.element(approve).toBeDisabled()
    await expect.element(getByText(/1 selected isn.t High confidence/)).toBeVisible()
    await expect.element(approve).toHaveAccessibleDescription(/isn.t High confidence/)
    expect(onApprove).not.toHaveBeenCalled()
    await expectNoA11yViolations(container)
  })

  it('a claim without a score blocks Approve and the count says how many', async () => {
    const { getByRole, getByText } = await render(<BulkBar {...props({ selected: pick('004803', '004819', '004821') })} />)
    await expect.element(getByRole('button', { name: 'Approve 3' })).toBeDisabled()
    await expect.element(getByText(/2 selected aren.t High confidence/)).toBeVisible()
  })

  it('Approve calls back once', async () => {
    const onApprove = vi.fn()
    const { getByRole } = await render(<BulkBar {...props({ onApprove })} />)
    await getByRole('button', { name: 'Approve 2' }).click()
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it('Assign opens a menu of handlers and picking one calls back with the name', async () => {
    const onAssign = vi.fn()
    const { getByRole } = await render(<BulkBar {...props({ onAssign })} />)
    await getByRole('button', { name: 'Assign' }).click()
    for (const h of handlers) await expect.element(page.getByRole('menuitem', { name: h })).toBeVisible()
    await page.getByRole('menuitem', { name: 'Rachel Morgan' }).click()
    expect(onAssign).toHaveBeenCalledExactlyOnceWith('Rachel Morgan')
    await expect.poll(() => page.getByRole('menu').query()).toBeNull()
  })

  it('Clear selection calls back once', async () => {
    const onClear = vi.fn()
    const { getByRole } = await render(<BulkBar {...props({ onClear })} />)
    await getByRole('button', { name: 'Clear selection' }).click()
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
