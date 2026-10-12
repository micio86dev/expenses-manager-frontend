import { expect, test } from '@playwright/test'
import { expectNoViolations } from '../e2e/support/axe'

// One signed-in journey against the real API. A fresh account per run keeps it repeatable on a
// database that is never reset. Everything goes through the UI; the API is only reached by the SPA.
const runId = crypto.randomUUID().slice(0, 8)
const account = {
  name: 'Fullstack Runner',
  email: `fullstack-${runId}@example.com`,
  password: `pw-${crypto.randomUUID()}`,
}
const category = 'Gym ' + runId

test('register, categorise, spend, review and sign out', async ({ page }) => {
  await test.step('register a new account', async () => {
    await page.goto('/register')
    await page.getByLabel('Name').fill(account.name)
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Password').fill(account.password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'No expenses in this period' }),
    ).toBeVisible()
    await expectNoViolations(page)
  })

  await test.step('add a custom category with a colour and an icon', async () => {
    await page.getByRole('link', { name: 'Categories' }).first().click()
    await page.getByRole('button', { name: 'Add category' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'New category' })
    await dialog.getByLabel('Name').fill(category)
    await dialog.locator('label', { hasText: 'Brick' }).click()
    await dialog.locator('label', { hasText: 'Health' }).click()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('listitem').filter({ hasText: category })).toBeVisible()
  })

  let spentOn = ''
  await test.step('add two expenses with the amount-first sheet', async () => {
    await page.getByRole('link', { name: 'Expenses' }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Expenses' })).toBeVisible()

    await page.getByRole('button', { name: 'Add expense' }).first().click()
    let dialog = page.getByRole('dialog', { name: 'New expense' })
    await expect(dialog.getByLabel('Amount')).toBeFocused()
    spentOn = await dialog.getByLabel('Date').inputValue()
    expect(spentOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    await dialog.getByLabel('Amount').fill('12,50')
    await dialog.getByLabel('Category').selectOption({ label: category })
    await dialog.getByLabel('Description').fill('Day pass')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: /Day pass/ })).toContainText('€12.50')

    // The category is now a "recent" chip, so the second expense needs no dropdown.
    await page.getByRole('button', { name: 'Add expense' }).first().click()
    dialog = page.getByRole('dialog', { name: 'New expense' })
    await dialog.getByLabel('Amount').fill('7,50')
    await dialog.getByRole('button', { name: category }).click()
    await dialog.getByLabel('Description').fill('Towel hire')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: /Towel hire/ })).toContainText('€7.50')
  })

  await test.step('the dashboard reflects the spending', async () => {
    await page.getByRole('link', { name: 'Dashboard' }).first().click()
    const kpi = page.getByRole('region', { name: 'Key figures' })
    await expect(kpi).toContainText('€20.00')
    await expect(kpi.getByText('2', { exact: true })).toBeVisible()
    const ranked = page.getByRole('list', { name: 'Categories ranked by spending' })
    await expect(ranked.getByRole('listitem')).toHaveCount(1)
    await expect(ranked).toContainText(category)
    await expect(ranked).toContainText('100%')
    await expectNoViolations(page)
  })

  await test.step('the date range filter excludes and includes the expenses', async () => {
    await page.getByRole('link', { name: 'Expenses' }).first().click()

    await page.getByRole('button', { name: 'Filters' }).click()
    let dialog = page.getByRole('dialog', { name: 'Filter expenses' })
    await dialog.getByLabel('Custom range').check()
    await dialog.getByLabel('From', { exact: true }).fill('2020-01-01')
    await dialog.getByLabel('To', { exact: true }).fill('2020-01-31')
    await dialog.getByRole('button', { name: 'Apply filters' }).click()
    await expect(page).toHaveURL(/period=custom&from=2020-01-01&to=2020-01-31/)
    await expect(page.getByRole('button', { name: /Day pass/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Towel hire/ })).toHaveCount(0)

    await page.getByRole('button', { name: 'Filters' }).click()
    dialog = page.getByRole('dialog', { name: 'Filter expenses' })
    await dialog.getByLabel('Custom range').check()
    await dialog.getByLabel('From', { exact: true }).fill(spentOn)
    await dialog.getByLabel('To', { exact: true }).fill(spentOn)
    await dialog.getByRole('button', { name: 'Apply filters' }).click()
    await expect(page).toHaveURL(new RegExp(`from=${spentOn}&to=${spentOn}`))
    await expect(page.getByRole('button', { name: /Day pass/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Towel hire/ })).toBeVisible()
    await expectNoViolations(page)
  })

  await test.step('sign out', async () => {
    await page.getByRole('link', { name: 'Settings' }).first().click()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
  })
})
