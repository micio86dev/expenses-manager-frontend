import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const user = {
  id: '0b6b7f0e-0000-4000-8000-000000000001',
  name: 'Ada',
  email: 'ada@example.com',
  locale: 'en',
  created_at: '2026-10-12T10:00:00Z',
}

async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ json: { data: { token: 'test-token', user } } }),
  )
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: { data: user } }))
  await page.route('**/api/v1/auth/logout', (route) => route.fulfill({ status: 204 }))
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`login page renders without accessibility violations (${colorScheme})`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      ...testInfo.project.use,
      colorScheme,
      locale: 'en-US',
    })
    const page = await context.newPage()
    await mockApi(page)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
    await context.close()
  })
}

test('signs in against the mocked API and shows the app shell', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('expenses.locale', 'en')
  })
  await mockApi(page)
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByLabel('Password').fill('secret-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
})
