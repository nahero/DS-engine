import { expect, test } from '@playwright/test'
import { disableAnimations } from './fixtures.ts'

test.beforeEach(async ({ page }) => {
  await disableAnimations(page)
})

test('sidebar → My assigned: title, focus on main, and the badge equals the page’s open count', async ({ page }) => {
  await page.goto('#overview')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()

  const link = page.getByRole('link', { name: /^My assigned, \d+ open$/ })
  const badge = Number((await link.getAttribute('aria-label'))!.match(/(\d+) open/)![1])
  await link.click()

  await expect(page).toHaveURL(/#my-assigned$/)
  await expect(page).toHaveTitle('My assigned · ClaimDesk')
  await expect(page.locator('main#main')).toBeFocused()
  await expect(page.getByRole('heading', { level: 1, name: 'My assigned' })).toBeVisible()
  await expect(link).toHaveAttribute('aria-current', 'page')

  // Same number in the header, in the workload line and in the list once Waiting on others is open.
  await expect(page.getByText(new RegExp(`^${badge} open claims · \\d+ need action today$`))).toBeVisible()
  await expect(page.getByText(new RegExp(`^${badge} open · €`))).toBeVisible()
  await page.getByRole('button', { name: /^Waiting on others/ }).click()
  await expect(page.locator('a[data-worklist-row]')).toHaveCount(badge)
})

test('open the first Act now claim, then browser back returns to My assigned', async ({ page }) => {
  await page.goto('#my-assigned')
  await expect(page.getByRole('heading', { level: 1, name: 'My assigned' })).toBeVisible()

  const first = page
    .getByRole('region', { name: /^Act now/ })
    .getByRole('link')
    .first()
  const id = (await first.getAttribute('href'))!.replace('#claim-', '')
  await first.click()
  await expect(page).toHaveURL(new RegExp(`#claim-${id}$`))
  await expect(page.getByRole('heading', { level: 1, name: id })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/#my-assigned$/)
  await expect(page).toHaveTitle('My assigned · ClaimDesk')
  await expect(page.getByRole('heading', { level: 1, name: 'My assigned' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /^Act now/ })).toBeVisible()
})

test('keyboard: ↓ moves between rows, Enter opens the claim', async ({ page }) => {
  await page.goto('#my-assigned')
  const rows = page.locator('a[data-worklist-row]')
  await rows.first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(rows.nth(1)).toBeFocused()
  await page.keyboard.press('j')
  await expect(rows.nth(2)).toBeFocused()
  const href = await rows.nth(2).getAttribute('href')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`${href}$`))
})

test('filter by Overdue, then clear', async ({ page }) => {
  await page.goto('#my-assigned')
  const overdue = page.getByRole('button', { name: /^\d+\s*Overdue$/ })
  const count = Number((await overdue.textContent())!.match(/\d+/)![0])
  expect(count).toBeGreaterThan(0)
  const rows = page.locator('ul:not([hidden]) a[data-worklist-row]')
  const all = await rows.count()

  await overdue.click()
  await expect(overdue).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(`Showing: Overdue (${count})`)).toBeVisible()
  await expect(rows).toHaveCount(count)
  for (const label of await rows.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))) expect(label).toMatch(/overdue \d+ d/)

  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(overdue).toHaveAttribute('aria-pressed', 'false')
  await expect(rows).toHaveCount(all)
})

test('mark a follow-up done: it leaves the list and the claim moves to Waiting on others', async ({ page }) => {
  await page.goto('#my-assigned')
  const followUps = page.getByRole('region', { name: 'Follow-ups' })
  await expect(followUps.getByRole('listitem')).toHaveCount(4)
  const before = 4
  const actNow = page.getByRole('heading', { level: 2, name: /^Act now · \d+$/ })
  const actCount = Number((await actNow.textContent())!.match(/(\d+)$/)![1])

  await followUps.getByRole('button', { name: /^Mark follow-up done: Chase signed statement,/ }).click()

  await expect(followUps.getByRole('listitem')).toHaveCount(before - 1)
  await expect(page.getByRole('heading', { level: 2, name: `Act now · ${actCount - 1}` })).toBeVisible()
  await expect(page.getByText('Follow-up done: Chase signed statement')).toBeAttached()
})
