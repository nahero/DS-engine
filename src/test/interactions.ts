import { page, type Locator } from 'vitest/browser'

/** Opens a Radix select (or any listbox trigger) and picks the option with exactly this name. */
export async function choose(trigger: Locator, option: string): Promise<void> {
  await trigger.click()
  await page.getByRole('option', { name: option, exact: true }).click()
}
