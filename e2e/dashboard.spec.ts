import { expect, test, type Page } from '@playwright/test'
import { expectNoViolations } from './support/axe'
import { installApp, seedCategories } from './support/mock-api'

test.use({ locale: 'en-US', reducedMotion: 'reduce' })

const statsRequests = (api: Awaited<ReturnType<typeof installApp>>, path: string) =>
  api.requests.filter((r) => r.path === path)

async function open(page: Page, url = '/'): Promise<Awaited<ReturnType<typeof installApp>>> {
  const api = await installApp(page)
  await page.goto(url)
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  return api
}

test.describe('dashboard', () => {
  test('renders the key figures and every card for the current month', async ({ page }) => {
    const api = await open(page)
    await expect(page).toHaveURL(/period=month&from=2026-10-01&to=2026-10-31/)

    const kpi = page.getByRole('region', { name: 'Key figures' })
    await expect(kpi).toContainText('€51.90')
    await expect(kpi).toContainText('-36.9% vs previous period')
    await expect(kpi).toContainText('€1.67')
    await expect(kpi).toContainText('Over 31 days')
    await expect(kpi.getByText('3', { exact: true })).toBeVisible()

    for (const name of [
      'Spending over time',
      'Spending by category',
      'Compared with the previous period',
      'Top expenses',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
    }
    await expect(page.locator('canvas')).toHaveCount(3)
    await expect(
      page.getByRole('img', { name: /^Spending over time: €51.90 in total/ }),
    ).toBeVisible()

    const categories = page.getByRole('list', { name: 'Categories ranked by spending' })
    await expect(categories.getByRole('listitem')).toHaveText([
      /Travel.*€34\.90.*67%/,
      /Groceries.*€12\.50.*24%/,
      /Coffee.*€4\.50.*9%/,
    ])
    const top = page.getByRole('list', { name: 'Your largest expenses in this period' })
    await expect(top.getByRole('listitem').first()).toContainText('Train ticket')
    await expect(top.getByRole('listitem').first()).toContainText('€34.90')

    expect(statsRequests(api, '/stats/summary')[0]?.query).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      currency: 'EUR',
    })
    const series = statsRequests(api, '/stats/timeseries').map((r) => r.query.from)
    expect(series.sort()).toEqual(['2026-08-31', '2026-10-01'])
    expect(statsRequests(api, '/stats/top-expenses')[0]?.query.limit).toBe('5')
  })

  test('refetches with the right range when the period changes', async ({ page }) => {
    const api = await open(page)
    await page.getByRole('button', { name: 'Previous period' }).click()
    await expect(page).toHaveURL(/from=2026-09-01&to=2026-09-30/)
    await expect(page.getByRole('region', { name: 'Key figures' })).toContainText('€82.20')
    const last = statsRequests(api, '/stats/summary').at(-1)
    expect(last?.query).toMatchObject({ from: '2026-09-01', to: '2026-09-30' })

    await page.getByRole('button', { name: 'Week', exact: true }).click()
    await expect(page).toHaveURL(/period=week&from=2026-09-28&to=2026-10-04/)
    expect(statsRequests(api, '/stats/summary').at(-1)?.query).toMatchObject({
      from: '2026-09-28',
      to: '2026-10-04',
    })
    await expect(page.getByRole('button', { name: 'Next period' })).toBeEnabled()
  })

  test('applies a custom range and compares it with the range before it', async ({ page }) => {
    const api = await open(page)
    await page.getByRole('button', { name: 'Custom range' }).click()
    await page.getByLabel('From', { exact: true }).fill('2026-09-01')
    await page.getByLabel('To', { exact: true }).fill('2026-09-30')
    await page.getByRole('button', { name: 'Show range' }).click()
    await expect(page).toHaveURL(/period=custom&from=2026-09-01&to=2026-09-30/)
    await expect(page.getByRole('region', { name: 'Key figures' })).toContainText('€82.20')
    const from = statsRequests(api, '/stats/timeseries').map((r) => r.query.from)
    expect(from).toContain('2026-08-02')
  })

  test('switches the currency and shows the empty state for it', async ({ page }) => {
    const api = await open(page)
    await page.getByLabel('Currency').selectOption('USD')
    await expect(page).toHaveURL(/currency=USD/)
    await expect(
      page.getByRole('heading', { level: 2, name: 'No expenses in this period' }),
    ).toBeVisible()
    expect(statsRequests(api, '/stats/summary').at(-1)?.query.currency).toBe('USD')
  })

  test('revalidates a cached period with its ETag when coming back to it', async ({ page }) => {
    const api = await open(page)
    await page.getByRole('link', { name: 'Expenses' }).first().click()
    await expect(page.getByRole('heading', { level: 1, name: 'Expenses' })).toBeVisible()
    await page.getByRole('link', { name: 'Dashboard' }).first().click()
    await expect(page.getByRole('region', { name: 'Key figures' })).toContainText('€51.90')
    const summaries = statsRequests(api, '/stats/summary')
    expect(summaries).toHaveLength(2)
    expect(summaries[0]?.ifNoneMatch).toBeUndefined()
    expect(summaries[1]?.ifNoneMatch).toMatch(/^"[0-9a-f]+"$/)
  })

  test('refreshes after adding an expense from the page', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Add expense' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'New expense' })
    await dialog.getByLabel('Amount').fill('10')
    await dialog.getByLabel('Category').selectOption({ label: 'Coffee' })
    await dialog.getByLabel('Description').fill('Espresso')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('region', { name: 'Key figures' })).toContainText('€61.90')
  })

  test('shows an empty state with a way to add an expense', async ({ page }) => {
    await installApp(page, { expenses: [], categories: seedCategories() })
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 2, name: 'No expenses in this period' }),
    ).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
    await expectNoViolations(page)
    await page.locator('main').getByRole('button', { name: 'Add expense' }).click()
    await expect(page.getByRole('dialog', { name: 'New expense' })).toBeVisible()
  })

  test('shows an error in the failed card and recovers on retry', async ({ page }) => {
    const api = await installApp(page)
    api.failNext('GET /stats/by-category', 500)
    await page.goto('/')
    const card = page.getByRole('region', { name: 'Spending by category' })
    await expect(card.getByRole('alert')).toContainText('We could not load your data.')
    await expect(page.getByRole('region', { name: 'Key figures' })).toContainText('€51.90')
    await expectNoViolations(page)
    await card.getByRole('button', { name: 'Try again' }).click()
    await expect(card.getByRole('list', { name: 'Categories ranked by spending' })).toBeVisible()
  })

  test('says so when the connection drops', async ({ page, context }) => {
    const api = await installApp(page)
    api.dropNext('GET /stats/summary')
    await page.goto('/')
    const kpi = page.getByRole('region', { name: 'Key figures' })
    await expect(kpi.getByRole('alert')).toContainText('You are offline. Reconnect and try again.')
    await context.setOffline(true)
    await expect(page.getByText('You are offline. Changes cannot be saved')).toBeVisible()
    await context.setOffline(false)
    await expect(page.getByText('You are offline. Changes cannot be saved')).toBeHidden()
    await kpi.getByRole('button', { name: 'Try again' }).click()
    await expect(kpi).toContainText('€51.90')
  })

  test('keeps the page usable with the keyboard', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: 'Day', exact: true }).focus()
    await expect(page.getByRole('button', { name: 'Day', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/period=day&from=2026-10-12&to=2026-10-12/)
    await expect(page.getByRole('region', { name: 'Key figures' })).toContainText('€17.00')
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme })

    test('has no accessibility violations on the dashboard', async ({ page }) => {
      await open(page)
      await expect(page.getByRole('list', { name: 'Categories ranked by spending' })).toBeVisible()
      await expectNoViolations(page)
    })

    test('has no accessibility violations with the custom range open', async ({ page }) => {
      await open(page)
      await page.getByRole('button', { name: 'Custom range' }).click()
      await expectNoViolations(page)
    })
  })
}
