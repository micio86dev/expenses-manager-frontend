import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { useExpenseSheetStore } from '@/stores/expenseSheet'
import { categoriesApi, expensesApi } from '../../tests/api-mock'
import { deferred } from '../../tests/deferred'
import { makeCategory, makeExpense } from '../../tests/fixtures'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import ExpensesView from './ExpensesView.vue'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

const groceries = makeCategory({ id: 'c1', name: 'Groceries', icon: 'cart' })
const travel = makeCategory({ id: 'c2', name: 'Travel', icon: 'plane', color: '#3D4F9E' })
const lunch = makeExpense({ id: 'e1', description: 'Lunch', amountCents: 1250 })
const coffee = makeExpense({
  id: 'e2',
  description: 'Coffee',
  amountCents: 250,
  createdAt: '2026-10-12T13:00:00Z',
})
const taxi = makeExpense({
  id: 'e3',
  description: 'Taxi',
  amountCents: 900,
  categoryId: 'c2',
  spentOn: '2026-10-10',
})
const meta = { currentPage: 1, perPage: 50, total: 3, lastPage: 1 }

async function render(route = '/expenses') {
  const result = await renderWithApp(ExpensesView, { route, token: 'tok' })
  await flushPromises()
  return result
}

const lastParams = () => expensesApi.list.mock.lastCall?.[0] as Record<string, unknown>

describe('ExpensesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime('2026-10-12T10:00:00')
    categoriesApi.list.mockResolvedValue([groceries, travel])
    expensesApi.list.mockResolvedValue({ data: [coffee, lunch, taxi], meta })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the current month and always sends the required period', async () => {
    const { wrapper, router } = await render()
    expect(lastParams()).toMatchObject({ from: '2026-10-01', to: '2026-10-31', page: 1 })
    expect(wrapper.get('h1').text()).toBe('Expenses')
    expect(wrapper.get('[aria-live=polite]').text()).toBe('October 2026')
    expect(router.currentRoute.value.query).toEqual({
      period: 'month',
      from: '2026-10-01',
      to: '2026-10-31',
    })
    expect(expensesApi.list).toHaveBeenCalledTimes(1)
  })

  it('shows a skeleton while loading', async () => {
    const pending = deferred<{ data: never[]; meta: typeof meta }>()
    expensesApi.list.mockReturnValue(pending.promise)
    const { wrapper } = await render()
    expect(wrapper.find('.skeleton').exists()).toBe(true)
    expect(wrapper.get('[aria-busy=true]').text()).toContain('Loading')
    pending.resolve({ data: [], meta })
    await flushPromises()
    expect(wrapper.find('.skeleton').exists()).toBe(false)
  })

  it('groups expenses by day with totals and category names', async () => {
    const { wrapper } = await render()
    const sections = wrapper.findAll('section.day')
    expect(sections).toHaveLength(2)
    expect(sections[0]?.get('h2').text()).toContain('Monday 12 October')
    expect(sections[0]?.get('h2').text()).toContain('€15.00')
    expect(sections[0]?.findAll('li').map((li) => li.get('.row__description').text())).toEqual([
      'Coffee',
      'Lunch',
    ])
    expect(sections[1]?.text()).toContain('Travel')
    expect(wrapper.text()).toContain('Showing 3 of 3')
  })

  it('goes to the previous period and cannot go past today', async () => {
    const { wrapper, router } = await render()
    expect(wrapper.get('button[aria-label="Next period"]').attributes('disabled')).toBeDefined()
    await wrapper.get('button[aria-label="Previous period"]').trigger('click')
    await flushPromises()
    expect(lastParams()).toMatchObject({ from: '2026-09-01', to: '2026-09-30' })
    expect(wrapper.get('[aria-live=polite]').text()).toBe('September 2026')
    expect(router.currentRoute.value.query).toMatchObject({ from: '2026-09-01' })
    expect(wrapper.get('button[aria-label="Next period"]').attributes('disabled')).toBeUndefined()
  })

  it('filters by period and category from the filter sheet', async () => {
    const { wrapper } = await render()
    await wrapper.get('button[data-filters]').trigger('click')
    const dialog = wrapper.get('[role=dialog]')
    expect(dialog.get('h2').text()).toBe('Filter expenses')
    await dialog.get('input[value=week]').setValue(true)
    await dialog.get('select').setValue('c2')
    await dialog.get('form').trigger('submit')
    await flushPromises()
    expect(lastParams()).toMatchObject({
      from: '2026-10-12',
      to: '2026-10-18',
      categoryId: 'c2',
    })
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(wrapper.get('[data-chip]').text()).toContain('Category: Travel')
  })

  it('removes the category filter with its chip', async () => {
    const { wrapper } = await render(
      '/expenses?period=month&from=2026-10-01&to=2026-10-31&category=c2',
    )
    expect(lastParams()).toMatchObject({ categoryId: 'c2' })
    await wrapper.get('[data-chip] button').trigger('click')
    await flushPromises()
    expect(lastParams()).not.toHaveProperty('categoryId')
    expect(wrapper.find('[data-chip]').exists()).toBe(false)
  })

  it('applies a custom past range and rejects an invalid one', async () => {
    const { wrapper } = await render()
    await wrapper.get('button[data-filters]').trigger('click')
    const dialog = wrapper.get('[role=dialog]')
    await dialog.get('input[value=custom]').setValue(true)
    const [from, to] = dialog.findAll('input[type=date]')
    await from?.setValue('2026-09-10')
    await to?.setValue('2026-09-01')
    await dialog.get('form').trigger('submit')
    expect(dialog.get('[data-error]').text()).toContain('Choose dates up to today')
    await to?.setValue('2026-09-20')
    await dialog.get('form').trigger('submit')
    await flushPromises()
    expect(lastParams()).toMatchObject({ from: '2026-09-10', to: '2026-09-20' })
    expect(wrapper.get('[aria-live=polite]').text()).toBe('10 Sep – 20 Sep 2026')
  })

  it('restores every filter from the URL', async () => {
    const { wrapper } = await render(
      '/expenses?period=custom&from=2026-09-01&to=2026-09-09&category=c1&q=taxi',
    )
    expect(lastParams()).toMatchObject({
      from: '2026-09-01',
      to: '2026-09-09',
      categoryId: 'c1',
      q: 'taxi',
    })
    expect(wrapper.get<HTMLInputElement>('input[type=search]').element.value).toBe('taxi')
  })

  it('searches descriptions after the typing pauses', async () => {
    const { wrapper, router } = await render()
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    vi.setSystemTime('2026-10-12T10:00:00')
    const input = wrapper.get('input[type=search]')
    await input.setValue('tax')
    await input.setValue('taxi')
    await vi.advanceTimersByTimeAsync(200)
    expect(expensesApi.list).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(100)
    await flushPromises()
    expect(expensesApi.list).toHaveBeenCalledTimes(2)
    expect(lastParams()).toMatchObject({ q: 'taxi' })
    expect(router.currentRoute.value.query.q).toBe('taxi')
  })

  it('follows the URL when the search changes elsewhere', async () => {
    const { wrapper, router } = await render('/expenses?q=taxi')
    await router.push('/expenses?period=month&from=2026-10-01&to=2026-10-31')
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('input[type=search]').element.value).toBe('')
  })

  it('loads more without repeating what is already shown', async () => {
    expensesApi.list.mockResolvedValueOnce({
      data: [coffee, lunch],
      meta: { ...meta, total: 3, lastPage: 2 },
    })
    const { wrapper } = await render()
    expect(wrapper.text()).toContain('Showing 2 of 3')
    expensesApi.list.mockResolvedValueOnce({
      data: [taxi],
      meta: { ...meta, total: 3, currentPage: 2, lastPage: 2 },
    })
    await wrapper.get('button[data-load-more]').trigger('click')
    await flushPromises()
    expect(lastParams()).toMatchObject({ page: 2 })
    expect(wrapper.findAll('.row')).toHaveLength(3)
    expect(wrapper.find('button[data-load-more]').exists()).toBe(false)
  })

  it('invites you to add the first expense', async () => {
    expensesApi.list.mockResolvedValue({ data: [], meta: { ...meta, total: 0 } })
    const { wrapper } = await render()
    expect(wrapper.get('h2').text()).toBe('No expenses recorded')
    await wrapper.get('.empty-state button').trigger('click')
    expect(useExpenseSheetStore().isOpen).toBe(true)
  })

  it('explains an empty result under filters and offers to clear them', async () => {
    expensesApi.list.mockResolvedValue({ data: [], meta: { ...meta, total: 0 } })
    const { wrapper, router } = await render(
      '/expenses?period=month&from=2026-10-01&to=2026-10-31&category=c1',
    )
    expect(wrapper.get('h2').text()).toBe('No matching expenses')
    await wrapper.get('.empty-state button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.category).toBeUndefined()
  })

  it('shows an error with a retry', async () => {
    expensesApi.list.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 500, title: 'Server error' }),
    )
    const { wrapper } = await render()
    expect(wrapper.get('[role=alert]').text()).toContain('We could not load your data.')
    await wrapper.get('.error-state button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.row')).toHaveLength(3)
  })

  it('says so when the network is down', async () => {
    expensesApi.list.mockRejectedValueOnce(ApiError.network())
    const { wrapper } = await render()
    expect(wrapper.get('[role=alert]').text()).toContain('You are offline')
  })

  it('warns while the browser reports being offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { wrapper } = await render()
    expect(wrapper.get('[role=status]').text()).toContain('You are offline')
  })

  it('opens the sheet on an expense when its row is chosen', async () => {
    const { wrapper } = await render()
    await wrapper.findAll('.row')[1]?.trigger('click')
    const sheet = useExpenseSheetStore()
    expect(sheet.isOpen).toBe(true)
    expect(sheet.editing?.id).toBe('e1')
  })

  it('has no axe violations in any state', async () => {
    const { wrapper } = await render()
    await expectNoA11yViolations(wrapper.element)
    await wrapper.get('button[data-filters]').trigger('click')
    await expectNoA11yViolations(wrapper.element)
  })
})
