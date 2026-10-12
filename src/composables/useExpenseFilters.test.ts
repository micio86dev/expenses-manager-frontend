import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePeriod } from '@/domain/period'
import { useExpenseFilters } from './useExpenseFilters'

async function setup(initial = '/expenses', from?: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/expenses', component: { render: () => h('div') } },
      { path: '/other', component: { render: () => h('div') } },
    ],
  })
  if (from !== undefined) await router.push(from)
  await router.push(initial)
  let filters: ReturnType<typeof useExpenseFilters> | undefined
  mount(
    defineComponent({
      setup() {
        filters = useExpenseFilters()
        return () => h('div')
      },
    }),
    { global: { plugins: [router] } },
  )
  if (filters === undefined) throw new Error('composable did not run')
  return { router, filters }
}

describe('useExpenseFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime('2026-10-12T10:00:00')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to the current month and writes it to the URL', async () => {
    const { router, filters } = await setup()
    expect(filters.filters.value.period).toEqual(resolvePeriod('month', '2026-10-12'))
    await filters.ensureCanonicalUrl()
    expect(router.currentRoute.value.query).toEqual({
      period: 'month',
      from: '2026-10-01',
      to: '2026-10-31',
    })
  })

  it('leaves an existing query alone', async () => {
    const { router, filters } = await setup('/expenses?period=week&from=2026-10-05&to=2026-10-11')
    await filters.ensureCanonicalUrl()
    expect(router.currentRoute.value.fullPath).toBe(
      '/expenses?period=week&from=2026-10-05&to=2026-10-11',
    )
    expect(filters.filters.value.period).toEqual({
      kind: 'week',
      from: '2026-10-05',
      to: '2026-10-11',
    })
  })

  it('restores every filter from the URL after a reload', async () => {
    const { filters } = await setup(
      '/expenses?period=custom&from=2026-09-01&to=2026-09-09&category=c1&q=taxi',
    )
    expect(filters.filters.value).toEqual({
      period: { kind: 'custom', from: '2026-09-01', to: '2026-09-09' },
      categoryId: 'c1',
      q: 'taxi',
    })
  })

  it('moves to the previous and next period, stopping at the present', async () => {
    const { router, filters } = await setup()
    expect(filters.canGoNext.value).toBe(false)
    await filters.shift(1)
    expect(router.currentRoute.value.query.from).toBeUndefined()
    await filters.shift(-1)
    expect(router.currentRoute.value.query).toMatchObject({ period: 'month', from: '2026-09-01' })
    expect(filters.canGoNext.value).toBe(true)
    await filters.shift(1)
    expect(router.currentRoute.value.query).toMatchObject({ from: '2026-10-01' })
  })

  it('switches the period kind around today and keeps the category and search', async () => {
    const { router, filters } = await setup('/expenses?category=c1&q=taxi')
    await filters.setPeriodKind('week')
    expect(router.currentRoute.value.query).toEqual({
      period: 'week',
      from: '2026-10-12',
      to: '2026-10-18',
      category: 'c1',
      q: 'taxi',
    })
  })

  it('applies a custom range only when it is valid', async () => {
    const { router, filters } = await setup()
    await expect(filters.setCustomRange('2026-09-10', '2026-09-01')).resolves.toBe(false)
    await expect(filters.setCustomRange('2026-09-01', '2026-10-30')).resolves.toBe(false)
    expect(router.currentRoute.value.query.period).toBeUndefined()
    await expect(filters.setCustomRange('2026-09-01', '2026-09-10')).resolves.toBe(true)
    expect(router.currentRoute.value.query).toMatchObject({
      period: 'custom',
      from: '2026-09-01',
      to: '2026-09-10',
    })
  })

  it('sets and clears the category', async () => {
    const { router, filters } = await setup()
    await filters.setCategory('c2')
    expect(router.currentRoute.value.query.category).toBe('c2')
    await filters.setCategory(null)
    expect(router.currentRoute.value.query.category).toBeUndefined()
  })

  it('replaces the history entry while typing a search and drops it when cleared', async () => {
    const { router, filters } = await setup()
    await filters.setQuery('lunch')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('lunch')
    router.back()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/expenses')
    await filters.setQuery('')
    expect(router.currentRoute.value.query.q).toBeUndefined()
  })
})
