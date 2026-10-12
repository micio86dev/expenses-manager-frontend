import { expect, test, type Page } from '@playwright/test'
import { expectNoViolations } from './support/axe'
import { installApp } from './support/mock-api'

const mockApi = (page: Page) => installApp(page, { signedIn: false, expenses: [] })

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme, locale: 'en-US' })

    test('login page renders without accessibility violations', async ({ page }) => {
      await mockApi(page)
      await page.goto('/')
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
      await expectNoViolations(page)
    })
  })
}

test('signs in against the mocked API and shows the app shell', async ({ page }) => {
  await mockApi(page)
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByLabel('Password').fill('secret-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/\?period=month/)
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()

  await expectNoViolations(page)
})
