import { expect, test } from '@playwright/test'
import { expectNoViolations } from './support/axe'
import { installApp } from './support/mock-api'

test.use({ locale: 'en-US', reducedMotion: 'reduce' })

test.describe('expenses', () => {
  test('groups the current month by day with totals', async ({ page }) => {
    await installApp(page)
    await page.goto('/expenses')
    await expect(page.getByRole('heading', { level: 1, name: 'Expenses' })).toBeVisible()
    await expect(page).toHaveURL(/period=month&from=2026-10-01&to=2026-10-31/)
    const monday = page.getByRole('region', { name: /Monday 12 October/ })
    await expect(monday).toContainText('€17.00')
    await expect(monday.getByRole('listitem')).toHaveCount(2)
    await expect(page.getByRole('region', { name: /Saturday 10 October/ })).toContainText('€34.90')
    await expect(page.getByText('Showing 3 of 3')).toBeVisible()
    await expectNoViolations(page)
  })

  test('adds an expense amount first and shows it at once', async ({ page }) => {
    const api = await installApp(page)
    await page.goto('/expenses')
    await page.getByRole('button', { name: 'Add expense' }).click()
    const dialog = page.getByRole('dialog', { name: 'New expense' })
    const amount = dialog.getByLabel('Amount')
    await expect(amount).toBeFocused()
    await expect(amount).toHaveAttribute('inputmode', 'decimal')
    await expect(dialog.getByLabel('Currency')).toHaveValue('EUR')
    await expect(dialog.getByLabel('Date')).toHaveValue('2026-10-12')
    await amount.fill('7,30')
    await dialog.getByLabel('Category').selectOption({ label: 'Coffee' })
    await dialog.getByLabel('Description').fill('Espresso')
    await expectNoViolations(page)
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: /Espresso/ })).toBeVisible()
    await expect(page.getByRole('region', { name: /Monday 12 October/ })).toContainText('€24.30')
    expect(api.requests.find((r) => r.method === 'POST' && r.path === '/expenses')?.body).toEqual({
      amount_cents: 730,
      currency: 'EUR',
      description: 'Espresso',
      category_id: 'c-3',
      spent_on: '2026-10-12',
    })
  })

  test('offers the last used categories as chips', async ({ page }) => {
    await installApp(page)
    await page.goto('/expenses')
    await page.getByRole('button', { name: 'Add expense' }).click()
    let dialog = page.getByRole('dialog', { name: 'New expense' })
    await expect(dialog.getByRole('group', { name: 'Recent categories' })).toHaveCount(0)
    await dialog.getByLabel('Amount').fill('3')
    await dialog.getByLabel('Category').selectOption({ label: 'Travel' })
    await dialog.getByLabel('Description').fill('Bus')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    await page.getByRole('button', { name: 'Add expense' }).click()
    dialog = page.getByRole('dialog', { name: 'New expense' })
    const chip = dialog.getByRole('button', { name: 'Travel' })
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
    await chip.click()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog.getByLabel('Category')).toHaveValue('c-2')
    await expectNoViolations(page)
  })

  test('rejects invalid amounts with a clear message', async ({ page }) => {
    const api = await installApp(page)
    await page.goto('/expenses')
    await page.getByRole('button', { name: 'Add expense' }).click()
    const dialog = page.getByRole('dialog', { name: 'New expense' })
    await dialog.getByLabel('Amount').fill('1,234')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(
      dialog.getByText('Enter an amount above zero with at most two decimals.'),
    ).toBeVisible()
    await expect(dialog.getByText('Pick a category.')).toBeVisible()
    await expectNoViolations(page)
    expect(api.requests.some((r) => r.method === 'POST')).toBe(false)
  })

  test('rolls the list back and says why when saving fails', async ({ page }) => {
    const api = await installApp(page)
    api.failNext('POST /expenses', 500)
    await page.goto('/expenses')
    await page.getByRole('button', { name: 'Add expense' }).click()
    const dialog = page.getByRole('dialog', { name: 'New expense' })
    await dialog.getByLabel('Amount').fill('9')
    await dialog.getByLabel('Category').selectOption({ label: 'Coffee' })
    await dialog.getByLabel('Description').fill('Doomed')
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('alert')).toContainText('Could not save the expense')
    await expect(page.getByRole('button', { name: /Doomed/ })).toHaveCount(0)
    await expect(page.getByText('Showing 3 of 3')).toBeVisible()
    await expectNoViolations(page)
  })

  test('edits an expense', async ({ page }) => {
    const api = await installApp(page)
    await page.goto('/expenses')
    await page.getByRole('button', { name: /Lunch/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit expense' })
    await expect(dialog.getByLabel('Amount')).toHaveValue('12.50')
    await dialog.getByLabel('Amount').fill('13,00')
    await dialog.getByLabel('Description').fill('Late lunch')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: /Late lunch/ })).toContainText('€13.00')
    expect(api.requests.find((r) => r.method === 'PUT')?.body).toMatchObject({
      amount_cents: 1300,
      description: 'Late lunch',
    })
  })

  test('deletes an expense after confirmation', async ({ page }) => {
    await installApp(page)
    await page.goto('/expenses')
    await page.getByRole('button', { name: /Lunch/ }).click()
    await page.getByRole('button', { name: 'Delete expense' }).click()
    const confirm = page.getByRole('alertdialog', { name: 'Delete this expense?' })
    await expect(confirm).toContainText('Lunch')
    await expectNoViolations(page)
    await confirm.getByRole('button', { name: 'Delete expense' }).click()
    await expect(page.getByRole('button', { name: /Lunch/ })).toHaveCount(0)
    await expect(page.getByText('Showing 2 of 2')).toBeVisible()
  })

  test('navigates between periods and keeps them in the URL across a reload', async ({ page }) => {
    const api = await installApp(page)
    await page.goto('/expenses')
    await expect(page.getByRole('button', { name: 'Next period' })).toBeDisabled()
    await page.getByRole('button', { name: 'Previous period' }).click()
    await expect(
      page.locator('[aria-live=polite]').filter({ hasText: 'September 2026' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Taxi/ })).toBeVisible()
    await expect(page).toHaveURL(/period=month&from=2026-09-01&to=2026-09-30/)
    expect(
      api.requests.filter((r) => r.path === '/expenses' && r.query.from === '2026-09-01'),
    ).not.toHaveLength(0)

    await page.reload()
    await expect(page.getByRole('button', { name: /Taxi/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next period' })).toBeEnabled()
    await page.getByRole('button', { name: 'Next period' }).click()
    await expect(page.getByRole('button', { name: /Lunch/ })).toBeVisible()
  })

  test('filters by week, custom range and category from the filter sheet', async ({ page }) => {
    await installApp(page)
    await page.goto('/expenses')
    await page.getByRole('button', { name: 'Filters' }).click()
    let dialog = page.getByRole('dialog', { name: 'Filter expenses' })
    await dialog.getByLabel('Week').check()
    await dialog.getByLabel('Category').selectOption({ label: 'Coffee' })
    await expectNoViolations(page)
    await dialog.getByRole('button', { name: 'Apply filters' }).click()
    await expect(page).toHaveURL(/period=week&from=2026-10-12&to=2026-10-18&category=c-3/)
    await expect(page.getByRole('button', { name: /Coffee beans/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Lunch/ })).toHaveCount(0)
    await expect(page.getByText('Category: Coffee')).toBeVisible()

    await page.getByRole('button', { name: 'Filters' }).click()
    dialog = page.getByRole('dialog', { name: 'Filter expenses' })
    await dialog.getByLabel('Custom range').check()
    await dialog.getByLabel('From', { exact: true }).fill('2026-09-10')
    await dialog.getByLabel('To', { exact: true }).fill('2026-09-01')
    await dialog.getByRole('button', { name: 'Apply filters' }).click()
    await expect(dialog.getByText('Choose dates up to today')).toBeVisible()
    await expectNoViolations(page)
    await dialog.getByLabel('To', { exact: true }).fill('2026-09-30')
    await dialog.getByLabel('Category').selectOption({ label: 'Travel' })
    await dialog.getByRole('button', { name: 'Apply filters' }).click()
    await expect(page).toHaveURL(/period=custom&from=2026-09-10&to=2026-09-30&category=c-2/)
    await expect(page.getByRole('button', { name: /Taxi/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Weekly shop/ })).toHaveCount(0)

    await page.getByRole('button', { name: 'Remove category filter Travel' }).click()
    await expect(page.getByRole('button', { name: /Weekly shop/ })).toBeVisible()
  })

  test('searches descriptions after a short pause', async ({ page }) => {
    const api = await installApp(page)
    await page.goto('/expenses')
    await page.getByRole('searchbox', { name: 'Search expenses' }).fill('train')
    await expect(page).toHaveURL(/q=train/)
    await expect(page.getByRole('button', { name: /Train ticket/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Lunch/ })).toHaveCount(0)
    const searches = api.requests.filter((r) => r.path === '/expenses' && r.query.q !== undefined)
    expect(searches).toHaveLength(1)
  })

  test('loads more expenses a page at a time', async ({ page }) => {
    const many = Array.from({ length: 120 }, (_, index) => ({
      id: `e-${String(index + 1)}`,
      description: `Item ${String(index + 1)}`,
      amount_cents: 100,
      currency: 'EUR',
      category_id: 'c-1',
      spent_on: '2026-10-05',
      created_at: `2026-10-05T10:00:${String(index % 60).padStart(2, '0')}Z`,
      updated_at: '2026-10-05T10:00:00Z',
    }))
    await installApp(page, { expenses: many })
    await page.goto('/expenses')
    await expect(page.getByText('Showing 50 of 120')).toBeVisible()
    await page.getByRole('button', { name: 'Load more' }).click()
    await expect(page.getByText('Showing 100 of 120')).toBeVisible()
    await page.getByRole('button', { name: 'Load more' }).click()
    await expect(page.getByText('Showing 120 of 120')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0)
  })

  test('shows an empty state with a way to add the first expense', async ({ page }) => {
    await installApp(page, { expenses: [] })
    await page.goto('/expenses')
    await expect(
      page.getByRole('heading', { level: 2, name: 'No expenses recorded' }),
    ).toBeVisible()
    await expectNoViolations(page)
    await page.getByRole('main').getByRole('button', { name: 'Add expense' }).click()
    await expect(page.getByRole('dialog', { name: 'New expense' })).toBeVisible()
  })

  test('explains when filters match nothing and clears them', async ({ page }) => {
    await installApp(page)
    await page.goto('/expenses?period=month&from=2026-10-01&to=2026-10-31&q=zzz')
    await expect(
      page.getByRole('heading', { level: 2, name: 'No matching expenses' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByRole('button', { name: /Lunch/ })).toBeVisible()
  })

  test('shows an error with a retry, then recovers', async ({ page }) => {
    const api = await installApp(page)
    api.failNext('GET /expenses', 500)
    await page.goto('/expenses')
    await expect(page.getByRole('alert')).toContainText('We could not load your data.')
    await expectNoViolations(page)
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('button', { name: /Lunch/ })).toBeVisible()
  })

  test('says so when the network is down', async ({ page }) => {
    const api = await installApp(page)
    api.dropNext('GET /expenses')
    await page.goto('/expenses')
    await expect(page.getByRole('alert')).toContainText('You are offline')
    await expectNoViolations(page)
  })

  test('uses the viewport-appropriate add button', async ({ page }, testInfo) => {
    await installApp(page)
    await page.goto('/expenses')
    const add = page.getByRole('button', { name: 'Add expense' })
    await expect(add).toHaveCount(1)
    const box = await add.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    if (testInfo.project.name === 'mobile') {
      await expect(add).toHaveClass(/fab/)
    } else {
      await expect(
        page.locator('header').getByRole('button', { name: 'Add expense' }),
      ).toBeVisible()
    }
  })
})

test.describe('dark theme', () => {
  test.use({ colorScheme: 'dark' })

  test('the expense list and the sheet have no accessibility violations', async ({ page }) => {
    await installApp(page)
    await page.goto('/expenses')
    await expect(page.getByRole('button', { name: /Lunch/ })).toBeVisible()
    await expectNoViolations(page)
    await page.getByRole('button', { name: 'Add expense' }).click()
    await expect(page.getByRole('dialog', { name: 'New expense' })).toBeVisible()
    await expectNoViolations(page)
  })
})
