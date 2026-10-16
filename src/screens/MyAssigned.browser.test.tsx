import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ASSIGNED_TODAY, assignedClaims } from '@/data/assigned'
import { routes } from '@/lib/routes'
import { compareWorklist, worklistGroup } from '@/lib/worklist'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { MyAssigned } from './MyAssigned'

const strip = (label: string) => page.getByRole('button', { name: new RegExp(`^\\d+\\s*${label}$`) })
const rowLinks = () => Array.from(document.querySelectorAll<HTMLAnchorElement>('ul:not([hidden]) a[data-worklist-row]'))
const rowIds = () => rowLinks().map((a) => a.getAttribute('href')!.replace('#claim-', ''))
const rowEl = (id: string) => rowLinks().find((a) => a.getAttribute('href') === routes.claim(id))!
const heading = (name: string) => page.getByRole('heading', { level: 2, name })
const announcements = () =>
  page
    .getByRole('status')
    .elements()
    .map((e) => e.textContent ?? '')
const done = (note: string) => page.getByRole('button', { name: new RegExp(`^Mark follow-up done: ${note},`) })
const snooze = (note: string) => page.getByRole('button', { name: new RegExp(`^Snooze 2 d: ${note},`) })

const overdue = assignedClaims.filter((c) => c.slaDays !== null && c.slaDays < 0).map((c) => c.id)
const dueToday = assignedClaims.filter((c) => c.slaDays === 0).map((c) => c.id)
const ready = assignedClaims
  .filter((c) => worklistGroup(c, ASSIGNED_TODAY) === 'ready')
  .sort(compareWorklist)
  .map((c) => c.id)
const waiting = assignedClaims
  .filter((c) => worklistGroup(c, ASSIGNED_TODAY) === 'waiting')
  .sort(compareWorklist)
  .map((c) => c.id)

const originalHash = window.location.hash
afterEach(() => {
  vi.useRealTimers()
  history.replaceState(null, '', window.location.pathname + window.location.search + originalHash)
})

describe('MyAssigned', () => {
  describe('page', () => {
    it('has the title, the derived subtitle, the three groups and the two panels, without axe violations', async () => {
      const { container, getByRole, getByText } = await render(<MyAssigned />)
      await expect.element(getByRole('heading', { level: 1, name: 'My assigned' })).toBeVisible()
      await expect.element(getByText('17 open claims · 8 need action today')).toBeVisible()
      await expect.element(heading('Act now · 8')).toBeVisible()
      await expect.element(heading('Ready for you · 6')).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Waiting on others · 3' })).toBeVisible()
      await expect.element(getByRole('region', { name: 'Since you were last here' })).toBeVisible()
      await expect.element(getByRole('region', { name: 'Follow-ups' })).toBeVisible()
      expect(rowLinks()).toHaveLength(14)
      await expectNoA11yViolations(container)
    })

    it('keeps the heading order: one h1, then h2s only', async () => {
      const { container } = await render(<MyAssigned />)
      const levels = Array.from(container.querySelectorAll('h1, h2, h3, h4')).map((h) => h.tagName)
      expect(levels.filter((l) => l === 'H1')).toHaveLength(1)
      expect(levels[0]).toBe('H1')
      expect(levels.filter((l) => l !== 'H1' && l !== 'H2')).toEqual([])
    })

    it('shows the four counts of the Today strip and the workload line', async () => {
      const { container } = await render(<MyAssigned />)
      for (const [label, n] of [
        ['Overdue', 3],
        ['Due today', 2],
        ['Ready for you', 6],
        ['Waiting on others', 3],
      ] as const) {
        await expect.element(strip(label)).toBeVisible()
        expect(strip(label).element().textContent).toContain(String(n))
        await expect.element(strip(label)).toHaveAttribute('aria-pressed', 'false')
      }
      expect(container.textContent).toMatch(/17 open · €[\d,.]+ open amount · oldest assigned 14 d ago/)
    })

    it('lists the 17 claims’ updates and follow-ups beside the worklist', async () => {
      await render(<MyAssigned />)
      const updates = page.getByRole('region', { name: 'Since you were last here' }).element()
      expect(updates.querySelectorAll('li')).toHaveLength(6)
      const followUps = page.getByRole('region', { name: 'Follow-ups' }).element()
      expect(followUps.querySelectorAll('li')).toHaveLength(4)
    })
  })

  describe('Today strip filters', () => {
    it('Overdue shows only overdue claims, across groups, and presses the button', async () => {
      await render(<MyAssigned />)
      await strip('Overdue').click()
      await expect.element(strip('Overdue')).toHaveAttribute('aria-pressed', 'true')
      expect(rowIds().sort()).toEqual([...overdue].sort())
      await expect.element(heading('Act now · 3')).toBeVisible()
      expect(heading('Ready for you · 6').query()).toBeNull()
    })

    it('Due today shows only claims due today', async () => {
      await render(<MyAssigned />)
      await strip('Due today').click()
      expect(rowIds().sort()).toEqual([...dueToday].sort())
    })

    it('Ready for you shows the ready group only', async () => {
      await render(<MyAssigned />)
      await strip('Ready for you').click()
      expect(rowIds()).toEqual(ready)
      await expect.element(heading('Ready for you · 6')).toBeVisible()
      expect(heading('Act now · 8').query()).toBeNull()
    })

    it('Waiting on others shows the waiting group, expanded, without claiming all is caught up', async () => {
      const { getByText } = await render(<MyAssigned />)
      await strip('Waiting on others').click()
      expect(rowIds()).toEqual(waiting)
      await expect.element(page.getByRole('button', { name: 'Waiting on others · 3' })).toHaveAttribute('aria-expanded', 'true')
      expect(getByText('All caught up.').query()).toBeNull()
    })

    it('the filters exclude each other: pressing one un-presses the other', async () => {
      await render(<MyAssigned />)
      await strip('Overdue').click()
      await strip('Ready for you').click()
      await expect.element(strip('Ready for you')).toHaveAttribute('aria-pressed', 'true')
      await expect.element(strip('Overdue')).toHaveAttribute('aria-pressed', 'false')
      expect(rowIds()).toEqual(ready)
    })

    it('pressing the same filter again clears it', async () => {
      await render(<MyAssigned />)
      await strip('Overdue').click()
      await strip('Overdue').click()
      await expect.element(strip('Overdue')).toHaveAttribute('aria-pressed', 'false')
      expect(rowLinks()).toHaveLength(14)
    })

    it('shows "Showing: Overdue (3) · Clear" while a filter is active, and Clear removes it', async () => {
      const { container, getByRole } = await render(<MyAssigned />)
      expect(container.textContent).not.toContain('Showing:')
      await strip('Overdue').click()
      expect(container.textContent).toContain('Showing: Overdue (3)')
      await getByRole('button', { name: 'Clear' }).click()
      expect(container.textContent).not.toContain('Showing:')
      await expect.element(strip('Overdue')).toHaveAttribute('aria-pressed', 'false')
      expect(rowLinks()).toHaveLength(14)
    })

    it('announces the result count in a polite live region, and the clearing', async () => {
      await render(<MyAssigned />)
      await strip('Due today').click()
      await expect.poll(announcements).toContain('Showing Due today: 2 claims')
      await strip('Due today').click()
      await expect.poll(announcements).toContain('Filter cleared. Showing all 17 claims')
    })

    it('is free of axe violations with a filter applied', async () => {
      const { container } = await render(<MyAssigned />)
      await strip('Waiting on others').click()
      await expectNoA11yViolations(container)
    })
  })

  describe('follow-ups change the worklist', () => {
    it('Done on a chase: the claim goes back to Waiting on others and out of Act now', async () => {
      const { getByText } = await render(<MyAssigned />)
      expect(rowEl('CLM-2026-004416')).toBeTruthy()
      await done('Chase signed statement').click()
      await expect.element(heading('Act now · 7')).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Waiting on others · 4' })).toBeVisible()
      expect(rowIds()).not.toContain('CLM-2026-004416')
      await expect.element(getByText('17 open claims · 7 need action today')).toBeVisible()
      expect(strip('Waiting on others').element().textContent).toContain('4')
      // Its deadline is still overdue: the Overdue count does not change.
      expect(strip('Overdue').element().textContent).toContain('3')
    })

    it('Done removes it from Follow-ups and announces it', async () => {
      await render(<MyAssigned />)
      await done('Chase signed statement').click()
      expect(page.getByRole('region', { name: 'Follow-ups' }).element().querySelectorAll('li')).toHaveLength(3)
      await expect.poll(announcements).toContain('Follow-up done: Chase signed statement, King-Martin Hospitality & Events Co.')
    })

    it('Done: the claim then shows as waiting, with who and since when', async () => {
      await render(<MyAssigned />)
      await done('Chase signed statement').click()
      await page.getByRole('button', { name: 'Waiting on others · 4' }).click()
      expect(rowEl('CLM-2026-004416').textContent).toContain('Awaiting signed statement from policyholder · since 8 d')
    })

    it('Snooze on a follow-up due today: it moves to 1 Oct and the claim goes to Waiting', async () => {
      await render(<MyAssigned />)
      await snooze('Chase police report').click()
      await expect.element(heading('Act now · 7')).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Waiting on others · 4' })).toBeVisible()
      const followUps = page.getByRole('region', { name: 'Follow-ups' }).element()
      expect(followUps.querySelectorAll('li')).toHaveLength(4)
      const row = Array.from(followUps.querySelectorAll('li')).find((li) => li.textContent!.includes('Chase police report'))!
      expect(row.textContent).toContain('1 Oct')
      await expect.poll(announcements).toContain('Follow-up snoozed 2 days: Chase police report, Garcia-Williams Property Holdings LLC')
    })

    it('with a filter on, a claim that becomes waiting moves into the collapsed Waiting on others group', async () => {
      await render(<MyAssigned />)
      await strip('Due today').click()
      expect(rowIds()).toContain('CLM-2026-004484')
      await snooze('Chase police report').click()
      // Still due today by deadline, so it stays under the filter, but it is waiting now.
      expect(rowIds()).toEqual(['CLM-2026-004743'])
      await expect.element(page.getByRole('button', { name: 'Waiting on others · 1' })).toHaveAttribute('aria-expanded', 'false')
      expect(strip('Due today').element().textContent).toContain('2')
    })
  })

  describe('keyboard', () => {
    it('↓ and j move between rows across groups; Enter opens the claim', async () => {
      await render(<MyAssigned />)
      const ids = rowIds()
      rowEl(ids[0]).focus()
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(() => document.activeElement).toBe(rowEl(ids[1]))
      await userEvent.keyboard('j')
      await expect.poll(() => document.activeElement).toBe(rowEl(ids[2]))
      await userEvent.keyboard('k')
      await expect.poll(() => document.activeElement).toBe(rowEl(ids[1]))
      await userEvent.keyboard('{Enter}')
      await expect.poll(() => window.location.hash).toBe(routes.claim(ids[1]))
    })

    it('the filters are reachable by Tab and toggle with Space', async () => {
      await render(<MyAssigned />)
      await userEvent.tab()
      await expect.element(strip('Overdue')).toHaveFocus()
      await userEvent.keyboard(' ')
      await expect.element(strip('Overdue')).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('states', () => {
    it('loading: one status, placeholders at final size and no data, without axe violations', async () => {
      const { container, getByRole } = await render(<MyAssigned state="loading" />)
      expect(getByRole('status').elements()).toHaveLength(1)
      await expect.element(getByRole('status')).toMatchTextContent('Loading your claims')
      await expect.element(getByRole('heading', { level: 1, name: 'My assigned' })).toBeVisible()
      expect(rowLinks()).toHaveLength(0)
      expect(getByRole('button').query()).toBeNull()
      await expectNoA11yViolations(container)
    })

    it('empty: "No claims assigned" with a link to the queue, and empty panels', async () => {
      const { container, getByText, getByRole } = await render(<MyAssigned state="empty" />)
      await expect.element(getByText('0 open claims')).toBeVisible()
      await expect.element(getByText('No claims assigned')).toBeVisible()
      await expect.element(getByRole('link', { name: 'Go to claims queue' })).toHaveAttribute('href', routes.queue)
      await expect.element(getByText('Nothing new since your last visit')).toBeVisible()
      await expect.element(getByText('No follow-ups scheduled')).toBeVisible()
      expect(strip('Overdue').query()).toBeNull()
      await expectNoA11yViolations(container)
    })

    it('error: alerts with Retry; Retry calls back, shows loading and then the data', async () => {
      const onRetry = vi.fn()
      const { container, getByRole } = await render(<MyAssigned state="error" onRetry={onRetry} />)
      expect(getByRole('alert').elements()).toHaveLength(3)
      await expect.element(getByRole('alert').first()).toMatchTextContent('Couldn’t load your claims')
      await expectNoA11yViolations(container)
      await getByRole('button', { name: 'Retry' }).first().click()
      expect(onRetry).toHaveBeenCalledTimes(1)
      await expect.element(heading('Act now · 8'), { timeout: 5000 }).toBeVisible()
      expect(getByRole('alert').query()).toBeNull()
    })
  })
})
