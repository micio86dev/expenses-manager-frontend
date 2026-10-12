import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePeriod } from '@/domain/period'
import { useDashboardPeriod } from './useDashboardPeriod'

async function setup(initial = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => h('div') } }],
  })
  await router.push(initial)
  let result: ReturnType<typeof useDashboardPeriod> | undefined
  mount(
    defineComponent({
      setup() {
        result = useDashboardPeriod()
        return () => h('div')
      },
    }),
    { global: { plugins: [router] } },
  )
  if (result === undefined) throw new Error('composable did not run')
  return { router, dashboard: result }
}

describe('useDashboardPeriod', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime('2026-10-12T10:00:00')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to the current month in euros and writes it to the URL', async () => {
    const { router, dashboard } = await setup()
    expect(dashboard.period.value).toEqual(resolvePeriod('month', '2026-10-12'))
    expect(dashboard.currency.value).toBe('EUR')
    await dashboard.ensureCanonicalUrl()
    expect(router.currentRoute.value.query).toEqual({
      period: 'month',
      from: '2026-10-01',
      to: '2026-10-31',
    })
  })

  it('leaves an existing query alone', async () => {
    const { router, dashboard } = await setup('/?period=week&from=2026-10-05&to=2026-10-11')
    await dashboard.ensureCanonicalUrl()
    expect(router.currentRoute.value.fullPath).toBe('/?period=week&from=2026-10-05&to=2026-10-11')
  })

  it('moves to the previous and next period, stopping at the present', async () => {
    const { router, dashboard } = await setup()
    expect(dashboard.canGoNext.value).toBe(false)
    await dashboard.shift(1)
    expect(router.currentRoute.value.query.from).toBeUndefined()
    await dashboard.shift(-1)
    expect(router.currentRoute.value.query).toMatchObject({ period: 'month', from: '2026-09-01' })
    expect(dashboard.canGoNext.value).toBe(true)
  })

  it('switches to another kind around the end of the shown period, capped at today', async () => {
    const { router, dashboard } = await setup()
    await dashboard.select('week')
    expect(router.currentRoute.value.query).toMatchObject({ period: 'week', from: '2026-10-12' })
    await dashboard.shift(-1)
    await dashboard.select('month')
    expect(router.currentRoute.value.query).toMatchObject({ period: 'month', from: '2026-10-01' })
    await dashboard.shift(-1)
    await dashboard.select('day')
    expect(router.currentRoute.value.query).toMatchObject({
      period: 'day',
      from: '2026-09-30',
      to: '2026-09-30',
    })
  })

  it('applies a custom range only when it is valid', async () => {
    const { router, dashboard } = await setup()
    await expect(dashboard.applyCustom('2026-09-10', '2026-09-01')).resolves.toBe(false)
    await expect(dashboard.applyCustom('2026-09-01', '2026-10-30')).resolves.toBe(false)
    expect(router.currentRoute.value.query.period).toBeUndefined()
    await expect(dashboard.applyCustom('2026-09-01', '2026-09-10')).resolves.toBe(true)
    expect(router.currentRoute.value.query).toMatchObject({
      period: 'custom',
      from: '2026-09-01',
      to: '2026-09-10',
    })
  })

  it('keeps the currency in the URL and drops it when it is the default', async () => {
    const { router, dashboard } = await setup('/?period=week&from=2026-10-05&to=2026-10-11')
    await dashboard.setCurrency('USD')
    expect(router.currentRoute.value.query).toMatchObject({ period: 'week', currency: 'USD' })
    expect(dashboard.currency.value).toBe('USD')
    await dashboard.shift(-1)
    expect(router.currentRoute.value.query).toMatchObject({ from: '2026-09-28', currency: 'USD' })
    await dashboard.setCurrency('EUR')
    await flushPromises()
    expect(router.currentRoute.value.query.currency).toBeUndefined()
  })
})
