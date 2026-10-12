import { expect, test } from '@playwright/test'
import { expectNoViolations } from './support/axe'
import { installApp } from './support/mock-api'

// Animations are disabled so axe sees the final state of the sheets and dialogs.
test.use({ locale: 'en-US', reducedMotion: 'reduce' })

test.describe('categories', () => {
  test('lists categories, hides archived ones and reveals them on demand', async ({ page }) => {
    await installApp(page)
    await page.goto('/categories')
    const list = page.getByRole('list', { name: 'Your categories' })
    await expect(page.getByRole('heading', { level: 1, name: 'Categories' })).toBeVisible()
    await expect(list.getByRole('listitem')).toHaveCount(3)
    await expect(list).not.toContainText('Old hobby')
    await expectNoViolations(page)

    await page.getByLabel('Show archived').check()
    await expect(list.getByRole('listitem')).toHaveCount(4)
    await expect(list.getByRole('listitem').filter({ hasText: 'Old hobby' })).toContainText(
      'Archived',
    )
  })

  test('keeps system categories read-only', async ({ page }) => {
    await installApp(page)
    await page.goto('/categories')
    const system = page.getByRole('listitem').filter({ hasText: 'Groceries' })
    await expect(system).toContainText('Default')
    await expect(system.getByRole('button')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Edit Travel' })).toBeVisible()
  })

  test('creates a category from the sheet', async ({ page }) => {
    const api = await installApp(page)
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Add category' }).click()
    const dialog = page.getByRole('dialog', { name: 'New category' })
    await expect(dialog.getByLabel('Name')).toBeFocused()
    await dialog.getByLabel('Name').fill('Gym')
    await dialog.locator('label', { hasText: 'Brick' }).click()
    await dialog.locator('label', { hasText: 'Health' }).click()
    await expectNoViolations(page)
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('listitem').filter({ hasText: 'Gym' })).toBeVisible()
    expect(api.requests.find((r) => r.method === 'POST' && r.path === '/categories')?.body).toEqual(
      {
        name: 'Gym',
        color: '#A32A3A',
        icon: 'heart',
      },
    )
  })

  test('validates the name before sending anything', async ({ page }) => {
    const api = await installApp(page)
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Add category' }).click()
    const dialog = page.getByRole('dialog', { name: 'New category' })
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog.getByText('Enter a name.')).toBeVisible()
    await expectNoViolations(page)
    expect(api.requests.some((r) => r.method === 'POST')).toBe(false)
  })

  test('hands the draft back when the server rejects the name', async ({ page }) => {
    await installApp(page)
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Add category' }).click()
    const dialog = page.getByRole('dialog', { name: 'New category' })
    await dialog.getByLabel('Name').fill('Travel')
    await dialog.getByRole('button', { name: 'Save' }).click()
    const reopened = page.getByRole('dialog', { name: 'New category' })
    await expect(reopened.getByLabel('Name')).toHaveValue('Travel')
    await expect(reopened.getByText('The name has already been taken.')).toBeVisible()
  })

  test('edits, archives and restores a category', async ({ page }) => {
    await installApp(page)
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Edit Travel' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit category' })
    await dialog.getByLabel('Name').fill('Journeys')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'Journeys' })).toBeVisible()

    await page.getByRole('button', { name: 'Archive Journeys' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'Journeys' })).toHaveCount(0)
    await page.getByLabel('Show archived').check()
    await page.getByRole('button', { name: 'Restore Journeys' }).click()
    await expect(page.getByRole('button', { name: 'Archive Journeys' })).toBeVisible()
  })

  test('confirms before deleting an unused category', async ({ page }) => {
    await installApp(page)
    await page.goto('/categories')
    await page.getByLabel('Show archived').check()
    await page.getByRole('button', { name: 'Delete Old hobby' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Delete this category?' })
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
    await expectNoViolations(page)
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'Old hobby' })).toBeVisible()

    await page.getByRole('button', { name: 'Delete Old hobby' }).click()
    await page.getByRole('button', { name: 'Delete category' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'Old hobby' })).toHaveCount(0)
  })

  test('puts a category back and suggests archiving when it is in use', async ({ page }) => {
    await installApp(page)
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Delete Travel' }).click()
    await page.getByRole('button', { name: 'Delete category' }).click()
    await expect(page.getByRole('alert')).toContainText('Archive it instead')
    await expect(page.getByRole('listitem').filter({ hasText: 'Travel' })).toBeVisible()
  })

  test('shows an empty state with a way to start', async ({ page }) => {
    await installApp(page, { categories: [], expenses: [] })
    await page.goto('/categories')
    await expect(page.getByRole('heading', { level: 2, name: 'No categories' })).toBeVisible()
    await expectNoViolations(page)
    await page.getByRole('main').getByRole('button', { name: 'Add category' }).last().click()
    await expect(page.getByRole('dialog', { name: 'New category' })).toBeVisible()
  })

  test('shows an error with a retry, then recovers', async ({ page }) => {
    const api = await installApp(page)
    api.failNext('GET /categories', 500)
    await page.goto('/categories')
    await expect(page.getByRole('alert')).toContainText('We could not load your data.')
    await expectNoViolations(page)
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('list', { name: 'Your categories' })).toBeVisible()
  })

  test('says so when the network is down', async ({ page }) => {
    const api = await installApp(page)
    api.dropNext('GET /categories')
    await page.goto('/categories')
    await expect(page.getByRole('alert')).toContainText('You are offline')
  })
})
