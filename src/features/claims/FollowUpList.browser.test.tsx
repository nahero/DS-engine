import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ASSIGNED_TODAY, assignedClaims } from '@/data/assigned'
import type { AssignedClaim } from '@/data/types'
import { routes } from '@/lib/routes'
import { addDays } from '@/lib/worklist'
import { expectNoA11yViolations } from '@/test/axe'
import { render } from '@/test/render'
import { FollowUpList } from './FollowUpList'

/** Owns the claims like the screen does: done removes the follow-up, snooze moves it on from today (or from its date when later). */
function Harness({
  initial = assignedClaims,
  onDone = () => {},
  onSnooze = () => {},
}: {
  initial?: AssignedClaim[]
  onDone?: (id: string) => void
  onSnooze?: (id: string, days: number) => void
}) {
  const [claims, setClaims] = useState(initial)
  return (
    <FollowUpList
      claims={claims}
      today={ASSIGNED_TODAY}
      onDone={(id) => {
        onDone(id)
        setClaims((rows) => rows.map((c) => (c.id === id ? { ...c, followUp: undefined } : c)))
      }}
      onSnooze={(id, days) => {
        onSnooze(id, days)
        setClaims((rows) =>
          rows.map((c) =>
            c.id === id && c.followUp
              ? { ...c, followUp: { ...c.followUp, due: addDays(c.followUp.due > ASSIGNED_TODAY ? c.followUp.due : ASSIGNED_TODAY, days) } }
              : c,
          ),
        )
      }}
    />
  )
}

const items = () => page.getByRole('listitem').elements()
const noteOrder = () => items().map((li) => li.querySelector('span')?.textContent)
const done = (note: string, who: string) => page.getByRole('button', { name: `Mark follow-up done: ${note}, ${who}` })
const snooze = (note: string, who: string) => page.getByRole('button', { name: `Snooze 2 d: ${note}, ${who}` })

const KING = 'King-Martin Hospitality & Events Co.'
const GARCIA = 'Garcia-Williams Property Holdings LLC'

describe('FollowUpList', () => {
  it('lists the four follow-ups in a region titled "Follow-ups", without axe violations', async () => {
    const { container, getByRole } = await render(<Harness />)
    await expect.element(getByRole('region', { name: 'Follow-ups' })).toBeVisible()
    await expect.element(getByRole('heading', { level: 2, name: 'Follow-ups' })).toBeVisible()
    expect(items()).toHaveLength(4)
    await expectNoA11yViolations(container)
  })

  it('sorts overdue, then today, then upcoming by date', async () => {
    await render(<Harness />)
    expect(noteOrder()).toEqual([
      'Chase signed statement',
      'Chase police report',
      'Chase signed payment authorisation',
      'Chase itemised hospital invoice',
    ])
  })

  it('states each due date in words with an icon: Overdue 2 d, Today, 2 Oct, 6 Oct', async () => {
    await render(<Harness />)
    const rows = items().map((li) => li.textContent!)
    expect(rows[0]).toContain('Overdue 2 d')
    expect(rows[1]).toContain('Today')
    expect(rows[2]).toContain('2 Oct')
    expect(rows[3]).toContain('6 Oct')
    for (const li of items()) expect(li.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })

  it('shows the policyholder and a link to the claim', async () => {
    await render(<Harness />)
    const first = items()[0]
    expect(first.textContent).toContain(KING)
    expect(first.querySelector('a')?.getAttribute('href')).toBe(routes.claim('CLM-2026-004416'))
    expect(first.querySelector('a')?.textContent).toBe('CLM-2026-004416')
  })

  it('names its buttons after the follow-up and the policyholder', async () => {
    await render(<Harness />)
    await expect.element(done('Chase signed statement', KING)).toHaveTextContent('Done')
    await expect.element(snooze('Chase signed statement', KING)).toHaveTextContent('Snooze 2 d')
  })

  describe('Done', () => {
    it('calls onDone with the claim id, removes the item and announces it politely', async () => {
      const onDone = vi.fn()
      await render(<Harness onDone={onDone} />)
      await done('Chase signed statement', KING).click()
      expect(onDone).toHaveBeenCalledWith('CLM-2026-004416')
      expect(items()).toHaveLength(3)
      expect(noteOrder()[0]).toBe('Chase police report')
      await expect.element(page.getByRole('status')).toMatchTextContent('Follow-up done: Chase signed statement')
    })

    it('moves focus to the next follow-up’s Done button', async () => {
      await render(<Harness />)
      await done('Chase signed statement', KING).click()
      await expect.poll(() => document.activeElement).toBe(done('Chase police report', GARCIA).element())
    })

    it('the last one: focus goes to the card, the empty message shows and the announcement stays', async () => {
      const onlyOne = assignedClaims.filter((c) => c.id === 'CLM-2026-004416')
      const { getByRole, getByText } = await render(<Harness initial={onlyOne} />)
      await done('Chase signed statement', KING).click()
      await expect.element(getByText('No follow-ups scheduled')).toBeVisible()
      await expect.element(getByRole('region', { name: 'Follow-ups' })).toHaveFocus()
      await expect.element(getByRole('status')).toMatchTextContent('Follow-up done')
    })
  })

  describe('Snooze', () => {
    it('calls onSnooze with the claim id and 2 days, and announces it', async () => {
      const onSnooze = vi.fn()
      await render(<Harness onSnooze={onSnooze} />)
      await snooze('Chase police report', GARCIA).click()
      expect(onSnooze).toHaveBeenCalledWith('CLM-2026-004484', 2)
      await expect.element(page.getByRole('status')).toMatchTextContent('Follow-up snoozed 2 days: Chase police report')
    })

    it('moves the date on and re-sorts: today becomes 1 Oct, ahead of 2 Oct', async () => {
      await render(<Harness />)
      await snooze('Chase police report', GARCIA).click()
      expect(noteOrder()).toEqual([
        'Chase signed statement',
        'Chase police report',
        'Chase signed payment authorisation',
        'Chase itemised hospital invoice',
      ])
      expect(items()[1].textContent).toContain('1 Oct')
      expect(items()[1].textContent).not.toContain('Today')
    })

    it('an overdue follow-up is snoozed from today, so it is no longer overdue', async () => {
      await render(<Harness />)
      await snooze('Chase signed statement', KING).click()
      expect(noteOrder()[0]).toBe('Chase police report')
      const moved = items().find((li) => li.textContent!.includes('Chase signed statement'))!
      expect(moved.textContent).toContain('1 Oct')
      expect(moved.textContent).not.toContain('Overdue')
    })

    it('keeps the follow-up and keeps focus on its Snooze button', async () => {
      await render(<Harness />)
      await snooze('Chase police report', GARCIA).click()
      expect(items()).toHaveLength(4)
      await expect.element(snooze('Chase police report', GARCIA)).toHaveFocus()
    })
  })

  describe('keyboard', () => {
    it('Tab goes claim link, Done, Snooze for each item; Enter on Done acts', async () => {
      const onDone = vi.fn()
      await render(<Harness onDone={onDone} />)
      await userEvent.tab()
      expect(document.activeElement?.textContent).toBe('CLM-2026-004416')
      await userEvent.tab()
      await expect.element(done('Chase signed statement', KING)).toHaveFocus()
      await userEvent.tab()
      await expect.element(snooze('Chase signed statement', KING)).toHaveFocus()
      await userEvent.tab()
      expect(document.activeElement?.textContent).toBe('CLM-2026-004484')
      await userEvent.tab()
      await userEvent.keyboard('{Enter}')
      expect(onDone).toHaveBeenCalledWith('CLM-2026-004484')
    })
  })

  describe('states', () => {
    it('empty: "No follow-ups scheduled"', async () => {
      const { container, getByText } = await render(<Harness initial={[]} />)
      await expect.element(getByText('No follow-ups scheduled')).toBeVisible()
      await expectNoA11yViolations(container)
    })

    it('claims without a follow-up give the empty message', async () => {
      const { getByText } = await render(<Harness initial={assignedClaims.map((c) => ({ ...c, followUp: undefined }))} />)
      await expect.element(getByText('No follow-ups scheduled')).toBeVisible()
    })

    it('loading: one status and a busy region', async () => {
      const { container, getByRole } = await render(
        <FollowUpList claims={assignedClaims} today={ASSIGNED_TODAY} state="loading" onDone={() => {}} onSnooze={() => {}} />,
      )
      expect(getByRole('status').elements()).toHaveLength(1)
      await expect.element(getByRole('status')).toMatchTextContent('Loading follow-ups')
      await expect.element(getByRole('region', { name: 'Follow-ups' })).toHaveAttribute('aria-busy', 'true')
      await expectNoA11yViolations(container)
    })

    it('loading with announce off renders no status', async () => {
      const { getByRole } = await render(
        <FollowUpList
          claims={assignedClaims}
          today={ASSIGNED_TODAY}
          state="loading"
          announce={false}
          onDone={() => {}}
          onSnooze={() => {}}
        />,
      )
      expect(getByRole('status').query()).toBeNull()
    })

    it('error: an alert with a Retry button that calls back', async () => {
      const onRetry = vi.fn()
      const { container, getByRole } = await render(
        <FollowUpList
          claims={assignedClaims}
          today={ASSIGNED_TODAY}
          state="error"
          onRetry={onRetry}
          onDone={() => {}}
          onSnooze={() => {}}
        />,
      )
      await expect.element(getByRole('alert')).toMatchTextContent('Couldn’t load follow-ups')
      await expectNoA11yViolations(container)
      await getByRole('button', { name: 'Retry' }).click()
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('a long note and name are cut off in one line, with the full text available', async () => {
      const long = 'Montgomery-Whitfield-Featherstonehaugh Property Holdings and Development Group International LLC'
      const note = 'Chase the signed statement of loss and the itemised repair invoice for every affected unit'
      const claim = {
        ...assignedClaims.find((c) => c.id === 'CLM-2026-004416')!,
        policyholder: long,
        followUp: { id: 'fu-long', due: '2026-09-20', note },
      }
      const { container } = await render(
        <div className="w-72">
          <Harness initial={[claim]} />
        </div>,
      )
      expect(items()[0].textContent).toContain(note)
      expect(done(note, long).element()).toBeTruthy()
      await expectNoA11yViolations(container)
    })
  })
})
