import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ASSIGNED_TODAY, assignedClaims } from '@/data/assigned'
import { routes } from '@/lib/routes'
import { compareWorklist, worklistGroup, type WorklistGroup } from '@/lib/worklist'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { Worklist } from './Worklist'

const idsIn = (group: WorklistGroup) =>
  assignedClaims
    .filter((c) => worklistGroup(c, ASSIGNED_TODAY) === group)
    .sort(compareWorklist)
    .map((c) => c.id)

const find = (id: string) => assignedClaims.find((c) => c.id === id)!
const rowLink = (id: string) => page.getByRole('link', { name: new RegExp(id) })
const rowEl = (id: string) => rowLink(id).element() as HTMLAnchorElement
const focusRow = (id: string) => rowEl(id).focus()
const section = (name: string) => page.getByRole('region', { name })
/** Text of a row with non-breaking spaces read as spaces. */
const textOf = (id: string) => rowEl(id).textContent!.replaceAll('\u00a0', ' ')
const idsOfLinks = (root: Element) =>
  Array.from(root.querySelectorAll('a[data-worklist-row]')).map((a) => a.getAttribute('href')!.replace('#claim-', ''))

const originalHash = window.location.hash
afterEach(() => {
  history.replaceState(null, '', window.location.pathname + window.location.search + originalHash)
})

const waitingOnly = assignedClaims.filter((c) => worklistGroup(c, ASSIGNED_TODAY) === 'waiting')

describe('Worklist', () => {
  describe('groups', () => {
    it('shows Act now, Ready for you and Waiting on others as h2 headings with counts, in that order', async () => {
      const { container } = await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const headings = Array.from(container.querySelectorAll('h2')).map((h) => h.textContent)
      expect(headings).toEqual(['Act now · 8', 'Ready for you · 6', 'Waiting on others · 3'])
    })

    it('gives each group its one-line hint', async () => {
      const { getByText } = await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      await expect.element(getByText('Overdue, due today, or something just came back')).toBeVisible()
      await expect.element(getByText('Your move, not urgent yet')).toBeVisible()
      await expect.element(getByText('Nothing to do until they respond or a follow-up is due')).toBeVisible()
    })

    it('sorts rows within a group with compareWorklist: most overdue first', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const act = idsOfLinks(section('Act now · 8').element())
      expect(act).toEqual(idsIn('act-now'))
      expect(act[0]).toBe('CLM-2026-004769')
      expect(idsOfLinks(section('Ready for you · 6').element())).toEqual(idsIn('ready'))
    })

    it('regroups when the claims change (a chased claim goes back to waiting)', async () => {
      const chased = find('CLM-2026-004416')
      const { rerender } = await render(<Worklist claims={[chased]} today={ASSIGNED_TODAY} />)
      await expect.element(section('Act now · 1')).toBeVisible()
      await rerender(<Worklist claims={[{ ...chased, followUp: undefined }]} today={ASSIGNED_TODAY} />)
      expect(section('Act now · 1').query()).toBeNull()
      await expect.element(page.getByRole('heading', { name: 'Waiting on others · 1' })).toBeVisible()
    })
  })

  describe('rows', () => {
    it('is one link per claim to routes.claim(id), named with person, number, next action and deadline', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const link = page.getByRole('link', {
        name: 'Sarah Mitchell, CLM-2026-004817: Verify 1 low-confidence field, 1 missing, Decision due in 1 d',
      })
      await expect.element(link).toHaveAttribute('href', routes.claim('CLM-2026-004817'))
      expect(page.getByRole('link').elements()).toHaveLength(14)
    })

    it('shows person, claim number, line of business, next action, deadline, stage and amount', async () => {
      await render(<Worklist claims={[find('CLM-2026-004817')]} today={ASSIGNED_TODAY} />)
      const text = textOf('CLM-2026-004817')
      expect(text).toContain('Sarah Mitchell')
      expect(text).toContain('CLM-2026-004817 · Health')
      expect(text).toContain('Verify 1 low-confidence field, 1 missing')
      expect(text).toContain('Decision due in 1 d')
      expect(text).toContain('Assessment')
      expect(text).toContain('€11,980.00')
      expect(rowEl('CLM-2026-004817').querySelector('.tabular-nums')?.textContent).toBe('€11,980.00')
    })

    it('marks claims with a new event with a "New" badge, in the name too', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      expect(rowEl('CLM-2026-004821').textContent).toContain('New')
      expect(rowEl('CLM-2026-004821').getAttribute('aria-label')).toMatch(/, new update$/)
      expect(rowEl('CLM-2026-004817').textContent).not.toContain('New')
      expect(rowEl('CLM-2026-004817').getAttribute('aria-label')).not.toContain('new update')
    })

    it('names the clock in the deadline: first contact for new claims, decision after', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      expect(textOf('CLM-2026-004769')).toContain('First contact overdue 5 d')
      expect(textOf('CLM-2026-004743')).toContain('First contact due today')
      expect(textOf('CLM-2026-004821')).toContain('Decision overdue 1 d')
      expect(textOf('CLM-2026-004795')).toContain('Payment due in 5 d')
    })

    it('missing amount: "—" with a visible "Missing" label', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const row = rowEl('CLM-2026-004633')
      expect(row.textContent).toContain('Enter fields manually (agent failed)')
      expect(row.textContent).toContain('—')
      expect(row.textContent).toContain('Missing')
      expect(row.textContent).not.toContain('€')
    })

    it('long policyholder: cut off in the row, the full name in the link name and in a tooltip on keyboard focus', async () => {
      const long = 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC'
      await render(
        <div className="w-96">
          <Worklist claims={[{ ...find('CLM-2026-004817'), policyholder: long }]} today={ASSIGNED_TODAY} />
        </div>,
      )
      expect(rowEl('CLM-2026-004817').getAttribute('aria-label')).toContain(long)
      await userEvent.tab()
      await expect.element(page.getByRole('tooltip')).toMatchTextContent(long)
    })
  })

  describe('Waiting on others', () => {
    it('is collapsed to its heading and count: a disclosure button that controls the list', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const toggle = page.getByRole('button', { name: 'Waiting on others · 3' })
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'false')
      const list = document.getElementById(toggle.element().getAttribute('aria-controls')!)!
      expect(list.hidden).toBe(true)
      expect(rowLink('CLM-2026-004377').query()).toBeNull()
    })

    it('expands and collapses on click and shows who each claim waits on', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const toggle = page.getByRole('button', { name: 'Waiting on others · 3' })
      await toggle.click()
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect.element(rowLink('CLM-2026-004377')).toBeVisible()
      expect(rowEl('CLM-2026-004377').textContent).toContain('Awaiting senior approval · sent 2 d ago')
      expect(rowEl('CLM-2026-004301').textContent).toContain('Awaiting itemised hospital invoice from provider · since 5 d')
      expect(rowEl('CLM-2026-003910').textContent).toContain('Awaiting signed payment authorisation from policyholder · since 4 d')
      await toggle.click()
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(rowLink('CLM-2026-004377').query()).toBeNull()
    })

    it('is expanded when a filter targets it; a manual toggle holds until that changes', async () => {
      const { rerender } = await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} filtered expandWaiting />)
      const toggle = page.getByRole('button', { name: /^Waiting on others/ })
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'true')
      await toggle.click()
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'false')
      await rerender(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} filtered />)
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'false')
      await rerender(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} filtered expandWaiting />)
      await expect.element(toggle).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('all caught up', () => {
    it('Act now and Ready empty: says so, counts the waiting claims and shows them expanded', async () => {
      const { container, getByText } = await render(<Worklist claims={waitingOnly} today={ASSIGNED_TODAY} />)
      await expect.element(getByText('All caught up.')).toBeVisible()
      expect(container.textContent).toContain('3 claims are waiting on others.')
      await expect.element(page.getByRole('button', { name: 'Waiting on others · 3' })).toHaveAttribute('aria-expanded', 'true')
      expect(page.getByRole('link').elements()).toHaveLength(3)
      await expectNoA11yViolations(container)
    })

    it('uses the singular for one claim', async () => {
      const { container } = await render(<Worklist claims={waitingOnly.slice(0, 1)} today={ASSIGNED_TODAY} />)
      expect(container.textContent).toContain('1 claim is waiting on others.')
    })

    it('is not claimed while a filter is applied', async () => {
      const { getByText } = await render(<Worklist claims={waitingOnly} today={ASSIGNED_TODAY} filtered />)
      expect(getByText('All caught up.').query()).toBeNull()
    })

    it('does not appear while there is work to do', async () => {
      const { getByText } = await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      expect(getByText('All caught up.').query()).toBeNull()
    })
  })

  describe('keyboard', () => {
    it('Tab reaches each row link in order', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const act = idsIn('act-now')
      await userEvent.tab()
      await expect.poll(() => document.activeElement).toBe(rowEl(act[0]))
      await userEvent.tab()
      await expect.poll(() => document.activeElement).toBe(rowEl(act[1]))
    })

    it('ArrowDown and j move down, ArrowUp and k move up, stopping at the ends', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const act = idsIn('act-now')
      focusRow(act[0])
      await userEvent.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(rowEl(act[0]))
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(() => document.activeElement).toBe(rowEl(act[1]))
      await userEvent.keyboard('j')
      await expect.poll(() => document.activeElement).toBe(rowEl(act[2]))
      await userEvent.keyboard('k')
      await expect.poll(() => document.activeElement).toBe(rowEl(act[1]))
      await userEvent.keyboard('{ArrowUp}')
      await expect.poll(() => document.activeElement).toBe(rowEl(act[0]))
    })

    it('moves across groups, and skips the rows of a collapsed group', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const act = idsIn('act-now')
      const ready = idsIn('ready')
      focusRow(act[act.length - 1])
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(() => document.activeElement).toBe(rowEl(ready[0]))
      focusRow(ready[ready.length - 1])
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(rowEl(ready[ready.length - 1]))

      await page.getByRole('button', { name: 'Waiting on others · 3' }).click()
      focusRow(ready[ready.length - 1])
      await userEvent.keyboard('j')
      await expect.poll(() => document.activeElement).toBe(rowEl(idsIn('waiting')[0]))
    })

    it('Enter follows the link to #claim-<id>', async () => {
      await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      const first = idsIn('act-now')[0]
      focusRow(first)
      await userEvent.keyboard('{ArrowDown}')
      await userEvent.keyboard('{Enter}')
      await expect.poll(() => window.location.hash).toBe(routes.claim(idsIn('act-now')[1]))
    })

    it('ignores j and k typed into a text field', async () => {
      await render(
        <>
          <Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />
        </>,
      )
      // A field inside the list's container would be typed into, not navigated from.
      const act = idsIn('act-now')
      focusRow(act[0])
      const input = document.createElement('input')
      rowEl(act[0]).closest('ul')!.parentElement!.append(input)
      input.focus()
      await userEvent.keyboard('j')
      expect(document.activeElement).toBe(input)
      expect(input.value).toBe('j')
    })
  })

  describe('states', () => {
    it('loading: one status, a busy region, skeleton rows and no links', async () => {
      const { container, getByRole } = await render(<Worklist claims={[]} today={ASSIGNED_TODAY} state="loading" />)
      expect(getByRole('status').elements()).toHaveLength(1)
      await expect.element(getByRole('status')).toMatchTextContent('Loading your claims')
      expect(container.querySelectorAll('li')).toHaveLength(6)
      expect(getByRole('link').query()).toBeNull()
      await expectNoA11yViolations(container)
    })

    it('loading with announce off renders no status', async () => {
      const { getByRole } = await render(<Worklist claims={[]} today={ASSIGNED_TODAY} state="loading" announce={false} />)
      expect(getByRole('status').query()).toBeNull()
    })

    it('empty: "No claims assigned" with a link to the queue', async () => {
      const { container, getByText, getByRole } = await render(<Worklist claims={[]} today={ASSIGNED_TODAY} />)
      await expect.element(getByText('No claims assigned')).toBeVisible()
      await expect.element(getByText('Pick one up from the queue')).toBeVisible()
      await expect.element(getByRole('link', { name: 'Go to claims queue' })).toHaveAttribute('href', routes.queue)
      await expectNoA11yViolations(container)
    })

    it('empty: the action can be replaced', async () => {
      const { getByRole } = await render(
        <Worklist claims={[]} today={ASSIGNED_TODAY} emptyAction={<button type="button">Refresh</button>} />,
      )
      await expect.element(getByRole('button', { name: 'Refresh' })).toBeVisible()
      expect(getByRole('link', { name: 'Go to claims queue' }).query()).toBeNull()
    })

    it('error: an alert with a Retry button that calls back', async () => {
      const onRetry = vi.fn()
      const { container, getByRole } = await render(<Worklist claims={[]} today={ASSIGNED_TODAY} state="error" onRetry={onRetry} />)
      await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load your claims')
      await expectNoA11yViolations(container)
      await getByRole('button', { name: 'Retry' }).click()
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('default, collapsed and expanded, without axe violations', async () => {
      const { container } = await render(<Worklist claims={assignedClaims} today={ASSIGNED_TODAY} />)
      await expectNoA11yViolations(container)
      await page.getByRole('button', { name: 'Waiting on others · 3' }).click()
      await expectNoA11yViolations(container)
    })

    it('a long name and a missing amount, without axe violations', async () => {
      const long = 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC'
      const { container } = await render(
        <div className="w-96">
          <Worklist claims={[{ ...find('CLM-2026-004633'), policyholder: long }, find('CLM-2026-004821')]} today={ASSIGNED_TODAY} />
        </div>,
      )
      await expectNoA11yViolations(container)
    })
  })
})
