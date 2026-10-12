import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { CategoryStat, StatsSummary } from '@/api/types'
import { useExpenseSheetStore } from '@/stores/expenseSheet'
import { useExpensesStore } from '@/stores/expenses'
import { categoriesApi, expensesApi, statsApi } from '../../tests/api-mock'
import { chartStub } from '../../tests/chart-stubs'
import { deferred } from '../../tests/deferred'
import { makeCategory, makeExpense } from '../../tests/fixtures'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import DashboardView from './DashboardView.vue'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)
vi.mock('vue-chartjs', () => ({
  Bar: chartStub('Bar'),
  Doughnut: chartStub('Doughnut'),
  Line: chartStub('Line'),
}))

const summary: StatsSummary = {
  currency: 'EUR',
  totalCents: 10_000,
  count: 4,
  dailyAverageCents: 323,
  previousPeriod: { totalCents: 8000, deltaPercent: 25 },
  topCategory: null,
  biggestExpense: null,
}
const stat = (categoryId: string, name: string, totalCents: number): CategoryStat => ({
  categoryId,
  name,
  totalCents,
  count: 1,
  sharePercent: 0,
})
const fresh = <T>(data: T) => ({ notModified: false as const, data, etag: null })

const rent = makeCategory({ id: 'c1', name: 'Rent', color: '#3D4F9E' })

async function render(route = '/') {
  const result = await renderWithApp(DashboardView, { route, token: 'tok' })
  await flushPromises()
  return result
}

const lastRange = (mock: typeof statsApi.summary) =>
  mock.mock.lastCall?.[0] as Record<string, string>

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime('2026-10-12T10:00:00')
    categoriesApi.list.mockResolvedValue([rent])
    expensesApi.list.mockResolvedValue({ data: [], meta: {} })
    statsApi.summary.mockResolvedValue(fresh(summary))
    statsApi.byCategory.mockResolvedValue(
      fresh([stat('c1', 'Rent', 7000), stat('c2', 'Food', 3000)]),
    )
    statsApi.timeseries.mockResolvedValue(
      fresh([{ periodStart: '2026-10-05', totalCents: 500, count: 1 }]),
    )
    statsApi.topExpenses.mockResolvedValue(
      fresh([
        makeExpense({ id: 'big', description: 'Deposit', amountCents: 9000, categoryId: 'c1' }),
      ]),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the current month and its previous period, and puts the period in the URL', async () => {
    const { router } = await render()
    expect(lastRange(statsApi.summary)).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      currency: 'EUR',
    })
    expect(statsApi.timeseries).toHaveBeenCalledTimes(2)
    expect(
      statsApi.timeseries.mock.calls
        .map((call: unknown[]) => (call[0] as { from: string }).from)
        .sort(),
    ).toEqual(['2026-08-31', '2026-10-01'])
    expect(router.currentRoute.value.query).toEqual({
      period: 'month',
      from: '2026-10-01',
      to: '2026-10-31',
    })
  })

  it('renders every card under one heading, in order', async () => {
    const { wrapper } = await render()
    expect(wrapper.findAll('h1').map((h) => h.text())).toEqual(['Dashboard'])
    expect(wrapper.findAll('h2').map((h) => h.text())).toEqual([
      'Key figures',
      'Spending over time',
      'Spending by category',
      'Compared with the previous period',
      'Top expenses',
    ])
    expect(wrapper.find('[data-chart=Bar]').exists()).toBe(true)
    expect(wrapper.find('[data-chart=Doughnut]').exists()).toBe(true)
    expect(wrapper.find('[data-chart=Line]').exists()).toBe(true)
  })

  it('shows the key figures with the currency of the response', async () => {
    const { wrapper } = await render()
    const text = wrapper.get('.kpi').text()
    expect(text).toContain('€100.00')
    expect(text).toContain('+25% vs previous period')
    expect(text).toContain('€3.23')
    expect(text).toContain('Over 31 days')
  })

  it('colours the categories with their own colour and a palette colour when unknown', async () => {
    const { wrapper } = await render()
    const swatches = wrapper.findAll('.ranking__swatch').map((node) => node.attributes('style'))
    expect(swatches[0]).toContain('#3D4F9E')
    expect(swatches[1]).not.toContain('#3D4F9E')
    expect(wrapper.get('ol[aria-label="Categories ranked by spending"]').text()).toContain('70%')
  })

  it('lists the top five expenses with their category', async () => {
    const { wrapper } = await render()
    expect(statsApi.topExpenses).toHaveBeenCalledWith(expect.anything(), 5, expect.anything())
    expect(wrapper.get('ol[aria-label="Your largest expenses in this period"]').text()).toContain(
      'Deposit',
    )
  })

  it('goes to the previous period and fetches it', async () => {
    const { wrapper, router } = await render()
    await wrapper.get('button[aria-label="Previous period"]').trigger('click')
    await flushPromises()
    expect(lastRange(statsApi.summary)).toMatchObject({ from: '2026-09-01', to: '2026-09-30' })
    expect(router.currentRoute.value.query).toMatchObject({ from: '2026-09-01' })
  })

  it('changes the kind of period and the currency', async () => {
    const { wrapper } = await render()
    await wrapper.get('[role=group] button:nth-child(2)').trigger('click')
    await flushPromises()
    expect(lastRange(statsApi.summary)).toMatchObject({ from: '2026-10-12', to: '2026-10-18' })
    await wrapper.get('select').setValue('USD')
    await flushPromises()
    expect(lastRange(statsApi.summary)).toMatchObject({ currency: 'USD' })
  })

  it('applies a custom range and asks for the matching previous range', async () => {
    const { wrapper } = await render()
    await wrapper.get('[role=group] button:nth-child(4)').trigger('click')
    const [from, to] = wrapper.findAll('input[type=date]')
    await from?.setValue('2026-09-01')
    await to?.setValue('2026-09-10')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(lastRange(statsApi.summary)).toMatchObject({ from: '2026-09-01', to: '2026-09-10' })
    expect(
      statsApi.timeseries.mock.calls.map((call: unknown[]) => (call[0] as { from: string }).from),
    ).toContain('2026-08-22')
  })

  it('restores the period from the URL', async () => {
    await render('/?period=week&from=2026-10-05&to=2026-10-11&currency=GBP')
    expect(lastRange(statsApi.summary)).toEqual({
      from: '2026-10-05',
      to: '2026-10-11',
      currency: 'GBP',
    })
  })

  it('shows a skeleton in every card while loading', async () => {
    const pending = deferred<ReturnType<typeof fresh<StatsSummary>>>()
    statsApi.summary.mockReturnValue(pending.promise)
    statsApi.byCategory.mockReturnValue(new Promise(() => undefined))
    statsApi.timeseries.mockReturnValue(new Promise(() => undefined))
    statsApi.topExpenses.mockReturnValue(new Promise(() => undefined))
    const { wrapper } = await render()
    expect(wrapper.findAll('[data-skeleton]').length).toBeGreaterThanOrEqual(5)
    expect(wrapper.find('[data-chart]').exists()).toBe(false)
    expect(wrapper.findAll('[role=status]').length).toBeGreaterThanOrEqual(5)
    pending.resolve(fresh(summary))
    await flushPromises()
    expect(wrapper.find('.kpi__list').exists()).toBe(true)
  })

  it('shows an empty state with a way to add an expense', async () => {
    statsApi.summary.mockResolvedValue(fresh({ ...summary, count: 0, totalCents: 0 }))
    const { wrapper } = await render()
    expect(wrapper.get('h2').text()).toBe('No expenses in this period')
    expect(wrapper.find('[data-chart]').exists()).toBe(false)
    await wrapper.get('.empty-state button').trigger('click')
    expect(useExpenseSheetStore().isOpen).toBe(true)
  })

  it('shows one error with a retry when nothing could be loaded', async () => {
    const failure = new ApiError({ kind: 'problem', status: 500, title: 'Server error' })
    statsApi.summary.mockRejectedValue(failure)
    statsApi.byCategory.mockRejectedValue(failure)
    statsApi.timeseries.mockRejectedValue(failure)
    statsApi.topExpenses.mockRejectedValue(failure)
    const { wrapper } = await render()
    expect(wrapper.findAll('[role=alert]')).toHaveLength(1)
    expect(wrapper.get('[role=alert]').text()).toContain('We could not load your data.')
    statsApi.summary.mockResolvedValue(fresh(summary))
    statsApi.byCategory.mockResolvedValue(fresh([]))
    statsApi.timeseries.mockResolvedValue(fresh([]))
    statsApi.topExpenses.mockResolvedValue(fresh([]))
    await wrapper.get('.error-state button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role=alert]').exists()).toBe(false)
    expect(wrapper.find('.kpi__list').exists()).toBe(true)
  })

  it('keeps the cards that loaded and retries only through the failed card', async () => {
    statsApi.byCategory.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 500, title: 'x' }),
    )
    const { wrapper } = await render()
    const card = wrapper
      .findAll('section.card')
      .find((node) => node.text().includes('Spending by category'))
    expect(card?.get('[role=alert]').text()).toContain('We could not load your data.')
    expect(wrapper.find('.kpi__list').exists()).toBe(true)
    await card?.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-chart=Doughnut]').exists()).toBe(true)
  })

  it('tells the person they are offline, in the page and in the error', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    statsApi.summary.mockRejectedValue(ApiError.network())
    statsApi.byCategory.mockRejectedValue(ApiError.network())
    statsApi.timeseries.mockRejectedValue(ApiError.network())
    statsApi.topExpenses.mockRejectedValue(ApiError.network())
    const { wrapper } = await render()
    expect(wrapper.text()).toContain('You are offline.')
    expect(wrapper.get('[role=alert]').text()).toContain(
      'You are offline. Reconnect and try again.',
    )
  })

  it('refreshes after an expense was added, edited or deleted', async () => {
    const { pinia } = await render()
    const calls = statsApi.summary.mock.calls.length
    expensesApi.create.mockResolvedValue(makeExpense())
    await useExpensesStore(pinia).create({
      description: 'Coffee',
      amountCents: 150,
      currency: 'EUR',
      categoryId: 'c1',
      spentOn: '2026-10-12',
    })
    await flushPromises()
    expect(statsApi.summary.mock.calls.length).toBe(calls + 1)
  })

  it('has no axe violations', async () => {
    const { wrapper } = await render()
    await expectNoA11yViolations(wrapper.element)
  })
})
