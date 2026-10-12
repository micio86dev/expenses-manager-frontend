import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { CategoryStat, StatsSummary, TimeseriesBucket } from '@/api/types'
import { resolvePeriod, type Period } from '@/domain/period'
import { statsApi } from '../../tests/api-mock'
import { deferred } from '../../tests/deferred'
import { makeExpense } from '../../tests/fixtures'
import { useDashboardStore } from './dashboard'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

const week = resolvePeriod('week', '2026-10-12')
const otherWeek = resolvePeriod('week', '2026-10-05')

function summary(overrides: Partial<StatsSummary> = {}): StatsSummary {
  return {
    currency: 'EUR',
    totalCents: 10_000,
    count: 4,
    dailyAverageCents: 1429,
    previousPeriod: { totalCents: 8000, deltaPercent: 25 },
    topCategory: null,
    biggestExpense: null,
    ...overrides,
  }
}

const stat = (name: string, totalCents: number): CategoryStat => ({
  categoryId: name.toLowerCase(),
  name,
  totalCents,
  count: 1,
  sharePercent: 0,
})

const bucket = (periodStart: string, totalCents: number): TimeseriesBucket => ({
  periodStart,
  totalCents,
  count: 1,
})

const fresh = <T>(data: T, etag: string | null = null) => ({
  notModified: false as const,
  data,
  etag,
})
const unchanged = { notModified: true as const }

function mockAll() {
  statsApi.summary.mockResolvedValue(fresh(summary(), 's1'))
  statsApi.byCategory.mockResolvedValue(fresh([stat('Food', 300), stat('Rent', 700)], 'c1'))
  statsApi.timeseries.mockImplementation((range: { from: string }) =>
    Promise.resolve(
      fresh(range.from === week.from ? [bucket('2026-10-13', 500)] : [bucket('2026-10-06', 300)]),
    ),
  )
  statsApi.topExpenses.mockResolvedValue(fresh([makeExpense({ id: 'big' })], 't1'))
}

const anySignal: unknown = expect.any(AbortSignal)

const range = (period: Period, currency = 'EUR') => ({
  from: period.from,
  to: period.to,
  currency,
})

describe('dashboard store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockAll()
  })

  it('requests the period, the previous period, the categories and the top five', async () => {
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(statsApi.summary).toHaveBeenCalledWith(range(week), expect.anything())
    expect(statsApi.byCategory).toHaveBeenCalledWith(range(week), expect.anything())
    expect(statsApi.timeseries).toHaveBeenCalledWith(range(week), 'day', expect.anything())
    expect(statsApi.timeseries).toHaveBeenCalledWith(
      { from: '2026-10-05', to: '2026-10-11', currency: 'EUR' },
      'day',
      expect.anything(),
    )
    expect(statsApi.topExpenses).toHaveBeenCalledWith(range(week), 5, expect.anything())
    expect(store.status).toBe('ready')
    expect(store.isEmpty).toBe(false)
  })

  it('exposes derived view models', async () => {
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(store.kpi).toEqual({
      currency: 'EUR',
      totalCents: 10_000,
      count: 4,
      dailyAverageCents: 1429,
      days: 7,
      delta: { direction: 'up', percent: 25 },
    })
    expect(store.categories.map((item) => [item.name, item.percent])).toEqual([
      ['Rent', 70],
      ['Food', 30],
    ])
    expect(store.bars).toHaveLength(7)
    expect(store.bars[1]).toEqual({ start: '2026-10-13', totalCents: 500 })
    expect(store.comparison[1]).toEqual({
      index: 1,
      currentStart: '2026-10-13',
      previousStart: '2026-10-06',
      current: 500,
      previous: 300,
    })
    expect(store.top.map((expense) => expense.id)).toEqual(['big'])
    expect(store.currency).toBe('EUR')
  })

  it('uses a coarser granularity for long custom ranges, for both periods', async () => {
    const store = useDashboardStore()
    await store.load({ kind: 'custom', from: '2026-01-01', to: '2026-06-30' }, 'EUR')
    expect(statsApi.timeseries).toHaveBeenCalledTimes(2)
    expect(statsApi.timeseries.mock.calls.map((call: unknown[]) => call[1])).toEqual([
      'week',
      'week',
    ])
    expect(store.granularity).toBe('week')
  })

  it('reports the empty period', async () => {
    statsApi.summary.mockResolvedValue(fresh(summary({ count: 0, totalCents: 0 })))
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(store.isEmpty).toBe(true)
  })

  it('shows loading cards until each answer arrives', async () => {
    const pending = deferred<ReturnType<typeof fresh<StatsSummary>>>()
    statsApi.summary.mockReturnValue(pending.promise)
    const store = useDashboardStore()
    const loading = store.load(week, 'EUR')
    expect(store.status).toBe('loading')
    expect(store.cards.kpi.status).toBe('loading')
    expect(store.isEmpty).toBe(false)
    pending.resolve(fresh(summary()))
    await loading
    expect(store.cards.kpi.status).toBe('ready')
  })

  it('revalidates a cached answer with its ETag and keeps it on 304', async () => {
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    statsApi.summary.mockResolvedValue(unchanged)
    statsApi.byCategory.mockResolvedValue(unchanged)
    statsApi.timeseries.mockResolvedValue(unchanged)
    statsApi.topExpenses.mockResolvedValue(unchanged)
    const pending = deferred<typeof unchanged>()
    statsApi.summary.mockReturnValue(pending.promise)

    const reloading = store.load(week, 'EUR')
    // The cached data is on screen while the revalidation is in flight.
    expect(store.cards.kpi.status).toBe('ready')
    expect(store.kpi?.totalCents).toBe(10_000)
    pending.resolve(unchanged)
    await reloading

    expect(statsApi.summary).toHaveBeenLastCalledWith(
      range(week),
      expect.objectContaining({ etag: 's1' }),
    )
    expect(statsApi.byCategory).toHaveBeenLastCalledWith(
      range(week),
      expect.objectContaining({ etag: 'c1' }),
    )
    expect(statsApi.topExpenses).toHaveBeenLastCalledWith(
      range(week),
      5,
      expect.objectContaining({ etag: 't1' }),
    )
    expect(store.kpi?.totalCents).toBe(10_000)
    expect(store.categories).toHaveLength(2)
  })

  it('replaces cached data and its ETag when the server sends a new copy', async () => {
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    statsApi.summary.mockResolvedValue(fresh(summary({ totalCents: 12_345 }), 's2'))
    await store.load(week, 'EUR')
    expect(store.kpi?.totalCents).toBe(12_345)
    await store.load(week, 'EUR')
    expect(statsApi.summary).toHaveBeenLastCalledWith(
      range(week),
      expect.objectContaining({ etag: 's2' }),
    )
  })

  it('does not send an ETag it never received', async () => {
    statsApi.topExpenses.mockResolvedValue(fresh([], null))
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    await store.load(week, 'EUR')
    expect(statsApi.topExpenses).toHaveBeenLastCalledWith(range(week), 5, {
      signal: anySignal,
    })
  })

  it('caches per period and per currency', async () => {
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    await store.load(otherWeek, 'EUR')
    expect(statsApi.summary).toHaveBeenLastCalledWith(range(otherWeek), {
      signal: anySignal,
    })
    await store.load(week, 'USD')
    expect(statsApi.summary).toHaveBeenLastCalledWith(range(week, 'USD'), {
      signal: anySignal,
    })
    await store.load(week, 'EUR')
    expect(statsApi.summary).toHaveBeenLastCalledWith(
      range(week),
      expect.objectContaining({ etag: 's1' }),
    )
  })

  it('ignores an answer for a period that is no longer shown', async () => {
    const slow = deferred<ReturnType<typeof fresh<StatsSummary>>>()
    statsApi.summary.mockReturnValueOnce(slow.promise)
    const store = useDashboardStore()
    const first = store.load(week, 'EUR')
    statsApi.summary.mockResolvedValueOnce(fresh(summary({ totalCents: 777 }), 'new'))
    await store.load(otherWeek, 'EUR')
    slow.resolve(fresh(summary({ totalCents: 1 }), 'old'))
    await first
    expect(store.kpi?.totalCents).toBe(777)
    expect(store.period).toEqual(otherWeek)
  })

  it('ignores a failure for a period that is no longer shown', async () => {
    const slow = deferred<never>()
    statsApi.summary.mockReturnValueOnce(slow.promise)
    const store = useDashboardStore()
    const first = store.load(week, 'EUR')
    await store.load(otherWeek, 'EUR')
    slow.reject(ApiError.network())
    await first
    expect(store.cards.kpi.status).toBe('ready')
  })

  it('marks only the failed card as errored and keeps the others', async () => {
    const failure = new ApiError({ kind: 'problem', status: 500, title: 'Server error' })
    statsApi.byCategory.mockRejectedValue(failure)
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(store.cards.categories.status).toBe('error')
    expect(store.cards.categories.error).toBe(failure)
    expect(store.cards.kpi.status).toBe('ready')
    expect(store.status).toBe('ready')
  })

  it('combines both timeseries into the comparison card', async () => {
    statsApi.timeseries.mockImplementation((range: { from: string }) =>
      range.from === week.from ? Promise.resolve(fresh([])) : Promise.reject(ApiError.network()),
    )
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(store.cards.spend.status).toBe('ready')
    expect(store.cards.comparison.status).toBe('error')
    expect(store.cards.comparison.error?.kind).toBe('network')
  })

  it('reports the whole page as failed when nothing could be loaded', async () => {
    statsApi.summary.mockRejectedValue(ApiError.network())
    statsApi.byCategory.mockRejectedValue(ApiError.network())
    statsApi.timeseries.mockRejectedValue(ApiError.network())
    statsApi.topExpenses.mockRejectedValue(ApiError.network())
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(store.status).toBe('error')
  })

  it('keeps cached data on screen when a revalidation fails', async () => {
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    statsApi.summary.mockRejectedValue(ApiError.network())
    await store.load(week, 'EUR')
    expect(store.cards.kpi.status).toBe('ready')
    expect(store.kpi?.totalCents).toBe(10_000)
  })

  it('flags a 304 that arrives without a cached copy instead of waiting forever', async () => {
    statsApi.summary.mockResolvedValue(unchanged)
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(store.cards.kpi.status).toBe('error')
    expect(store.cards.kpi.error?.status).toBe(304)
  })

  it('retries the failed period', async () => {
    statsApi.summary.mockRejectedValueOnce(ApiError.network())
    const store = useDashboardStore()
    await store.load(week, 'EUR')
    expect(store.cards.kpi.status).toBe('error')
    await store.retry()
    expect(store.cards.kpi.status).toBe('ready')
    expect(statsApi.summary).toHaveBeenCalledTimes(2)
  })

  it('does nothing on retry before the first load', async () => {
    const store = useDashboardStore()
    await store.retry()
    expect(statsApi.summary).not.toHaveBeenCalled()
  })

  it('rethrows unexpected errors instead of hiding them', async () => {
    statsApi.summary.mockRejectedValue(new TypeError('bug'))
    const store = useDashboardStore()
    await expect(store.load(week, 'EUR')).rejects.toThrow('bug')
  })

  it('has empty view models before anything is loaded', () => {
    const store = useDashboardStore()
    expect(store.status).toBe('idle')
    expect(store.kpi).toBeNull()
    expect(store.categories).toEqual([])
    expect(store.bars).toEqual([])
    expect(store.comparison).toEqual([])
    expect(store.top).toEqual([])
    expect(store.currency).toBe('EUR')
    expect(store.isEmpty).toBe(false)
  })
})
