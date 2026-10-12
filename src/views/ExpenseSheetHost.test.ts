import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { recentCategoriesKey } from '@/composables/useRecentCategories'
import { useAuthStore } from '@/stores/auth'
import { useExpenseSheetStore } from '@/stores/expenseSheet'
import { useNoticesStore } from '@/stores/notices'
import { categoriesApi, expensesApi, sampleUser } from '../../tests/api-mock'
import { makeCategory, makeExpense } from '../../tests/fixtures'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import ExpenseSheetHost from './ExpenseSheetHost.vue'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

const groceries = makeCategory({ id: 'c1', name: 'Groceries' })
const travel = makeCategory({ id: 'c2', name: 'Travel', icon: 'plane' })
const retired = makeCategory({ id: 'c3', name: 'Old hobby', archived: true })

async function render(recent: string[] = []) {
  const result = await renderWithApp(ExpenseSheetHost, { route: '/settings', token: 'tok' })
  if (recent.length > 0) {
    localStorage.setItem(recentCategoriesKey(sampleUser.id), JSON.stringify(recent))
  }
  useAuthStore().user = sampleUser
  await flushPromises()
  return { ...result, sheet: useExpenseSheetStore() }
}

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof render>>['wrapper']) {
  await wrapper.get('input[inputmode=decimal]').setValue('12,50')
  await wrapper.get('select[data-category]').setValue('c1')
  await wrapper.get('input[data-description]').setValue('Lunch')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('ExpenseSheetHost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime('2026-10-12T10:00:00')
    categoriesApi.list.mockResolvedValue([groceries, travel, retired])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing until it is opened', async () => {
    const { wrapper } = await render()
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
  })

  it('opens on the amount field with today and EUR preselected', async () => {
    const { wrapper, sheet } = await render()
    sheet.openCreate()
    await flushPromises()
    expect(wrapper.get('[role=dialog] h2').text()).toBe('New expense')
    expect(document.activeElement).toBe(wrapper.get('input[inputmode=decimal]').element)
    expect(wrapper.get<HTMLSelectElement>('select[data-currency]').element.value).toBe('EUR')
    expect(wrapper.get<HTMLInputElement>('input[type=date]').element.value).toBe('2026-10-12')
    expect(categoriesApi.list).toHaveBeenCalled()
  })

  it('offers active categories only', async () => {
    const { wrapper, sheet } = await render()
    sheet.openCreate()
    await flushPromises()
    const options = wrapper.findAll('select[data-category] option').map((o) => o.text())
    expect(options).toEqual(['Choose a category', 'Groceries', 'Travel'])
  })

  it('shows the recent categories of the signed-in user', async () => {
    const { wrapper, sheet } = await render(['c2', 'c1', 'gone', 'c3'])
    sheet.openCreate()
    await flushPromises()
    expect(wrapper.findAll('button[aria-pressed]').map((c) => c.text())).toEqual([
      'Travel',
      'Groceries',
    ])
  })

  it('creates the expense in cents, closes the sheet and remembers the category', async () => {
    expensesApi.create.mockResolvedValue(makeExpense({ id: 'e9' }))
    const { wrapper, sheet } = await render()
    sheet.openCreate()
    await flushPromises()
    await fillAndSubmit(wrapper)
    expect(expensesApi.create).toHaveBeenCalledWith({
      amountCents: 1250,
      currency: 'EUR',
      description: 'Lunch',
      categoryId: 'c1',
      spentOn: '2026-10-12',
    })
    expect(sheet.isOpen).toBe(false)
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(JSON.parse(localStorage.getItem(recentCategoriesKey(sampleUser.id)) ?? '[]')).toEqual([
      'c1',
    ])
  })

  it('closes at once and reports a failed save without reopening', async () => {
    expensesApi.create.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 500, title: 'Server error' }),
    )
    const { wrapper, sheet } = await render()
    sheet.openCreate()
    await flushPromises()
    await fillAndSubmit(wrapper)
    expect(sheet.isOpen).toBe(false)
    expect(useNoticesStore().items[0]?.message).toContain('Could not save the expense')
    expect(localStorage.getItem(recentCategoriesKey(sampleUser.id))).toBeNull()
  })

  it('gives the draft back with the server message when validation fails', async () => {
    expensesApi.create.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 422,
        title: 'Invalid',
        fieldErrors: { amountCents: ['The amount is too large.'] },
      }),
    )
    const { wrapper, sheet } = await render()
    sheet.openCreate()
    await flushPromises()
    await fillAndSubmit(wrapper)
    expect(sheet.isOpen).toBe(true)
    expect(wrapper.get<HTMLInputElement>('input[inputmode=decimal]').element.value).toBe('12.50')
    expect(wrapper.get('[data-error]').text()).toBe('The amount is too large.')
    expect(wrapper.get<HTMLInputElement>('input[data-description]').element.value).toBe('Lunch')
  })

  it('edits an expense, prefilled with its formatted amount', async () => {
    expensesApi.update.mockResolvedValue(makeExpense())
    const { wrapper, sheet } = await render()
    sheet.openEdit(makeExpense({ amountCents: 123456, categoryId: 'c3', currency: 'USD' }))
    await flushPromises()
    expect(wrapper.get('[role=dialog] h2').text()).toBe('Edit expense')
    expect(wrapper.get<HTMLInputElement>('input[inputmode=decimal]').element.value).toBe('1234.56')
    expect(wrapper.get<HTMLSelectElement>('select[data-currency]').element.value).toBe('USD')
    const options = wrapper.findAll('select[data-category] option').map((o) => o.text())
    expect(options).toContain('Old hobby')
    await wrapper.get('input[data-description]').setValue('Dinner')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(expensesApi.update).toHaveBeenCalledWith('e1', {
      amountCents: 123456,
      currency: 'USD',
      description: 'Dinner',
      categoryId: 'c3',
      spentOn: '2026-10-12',
    })
    expect(sheet.isOpen).toBe(false)
  })

  it('asks before deleting and then deletes', async () => {
    expensesApi.remove.mockResolvedValue(undefined)
    const { wrapper, sheet } = await render()
    sheet.openEdit(makeExpense())
    await flushPromises()
    await wrapper.get('button[data-delete]').trigger('click')
    const dialog = wrapper.get('[role=alertdialog]')
    expect(dialog.text()).toContain('Lunch')
    expect(expensesApi.remove).not.toHaveBeenCalled()
    await dialog.get('button[data-confirm]').trigger('click')
    await flushPromises()
    expect(expensesApi.remove).toHaveBeenCalledWith('e1')
    expect(sheet.isOpen).toBe(false)
  })

  it('keeps the form open when the deletion is cancelled', async () => {
    const { wrapper, sheet } = await render()
    sheet.openEdit(makeExpense())
    await flushPromises()
    await wrapper.get('button[data-delete]').trigger('click')
    await wrapper.get('[role=alertdialog] button[data-cancel]').trigger('click')
    expect(wrapper.find('[role=alertdialog]').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(expensesApi.remove).not.toHaveBeenCalled()
  })

  it('closes with Escape and gives focus back to what opened it', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const { sheet } = await render()
    sheet.openCreate()
    await flushPromises()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(sheet.isOpen).toBe(false)
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('has no axe violations', async () => {
    const { wrapper, sheet } = await render(['c1'])
    sheet.openEdit(makeExpense())
    await flushPromises()
    await expectNoA11yViolations(wrapper.element)
  })
})
