import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { statsApi } from '@/api'
import type { Conditional } from '@/api/client'
import { ApiError } from '@/api/errors'
import type { StatsRequestOptions } from '@/api/stats'
import type { CategoryStat, Expense, StatsSummary, TimeseriesBucket } from '@/api/types'
import {
  alignPeriods,
  DEFAULT_CURRENCY,
  describeDelta,
  fillBuckets,
  granularityFor,
  type KpiView,
  periodDays,
  previousPeriod,
  rankCategories,
} from '@/domain/dashboard'
import type { Period } from '@/domain/period'

const TOP_LIMIT = 5

type SlotStatus = 'idle' | 'loading' | 'ready' | 'error'

interface Slot<T> {
  status: SlotStatus
  data: T | null
  error: ApiError | null
}

interface CacheEntry {
  data: unknown
  etag: string | null
}

export interface CardState {
  status: SlotStatus
  error: ApiError | null
}

const idle = <T>(): Slot<T> => ({ status: 'idle', data: null, error: null })

/** A card that needs several answers is loading until all arrive and failed if any failed. */
function combine(...slots: Slot<unknown>[]): CardState {
  const failed = slots.find((slot) => slot.status === 'error')
  if (failed !== undefined) return { status: 'error', error: failed.error }
  const waiting = slots.some((slot) => slot.status === 'idle' || slot.status === 'loading')
  return { status: waiting ? 'loading' : 'ready', error: null }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const period = ref<Period | null>(null)
  const requestedCurrency = ref(DEFAULT_CURRENCY)

  const summary = ref<Slot<StatsSummary>>(idle())
  const byCategory = ref<Slot<CategoryStat[]>>(idle())
  const series = ref<Slot<TimeseriesBucket[]>>(idle())
  const previousSeries = ref<Slot<TimeseriesBucket[]>>(idle())
  const top = ref<Slot<Expense[]>>(idle())
  const slots = [summary, byCategory, series, previousSeries, top]

  // Answers by resource, period and currency, with the ETag to revalidate them. Never evicted:
  // a session only visits a handful of periods and each entry is small.
  const cache = new Map<string, CacheEntry>()
  // Bumped by every load so an answer for a period that is no longer shown is ignored.
  let generation = 0
  let controller: AbortController | null = null

  const granularity = computed(() => (period.value === null ? 'day' : granularityFor(period.value)))
  const currency = computed(() => summary.value.data?.currency ?? requestedCurrency.value)

  const status = computed<SlotStatus>(() => {
    if (period.value === null) return 'idle'
    const states = slots.map((slot) => slot.value.status)
    if (states.every((state) => state === 'error')) return 'error'
    return states.some((state) => state === 'loading' || state === 'idle') ? 'loading' : 'ready'
  })

  const isEmpty = computed(() => summary.value.data?.count === 0)

  const kpi = computed<KpiView | null>(() => {
    const data = summary.value.data
    if (data === null || period.value === null) return null
    return {
      currency: data.currency,
      totalCents: data.totalCents,
      count: data.count,
      dailyAverageCents: data.dailyAverageCents,
      days: periodDays(period.value),
      delta: describeDelta(data.previousPeriod.deltaPercent),
    }
  })

  const categories = computed(() => rankCategories(byCategory.value.data ?? []))

  const bars = computed(() =>
    period.value === null
      ? []
      : fillBuckets(period.value, granularity.value, series.value.data ?? []),
  )

  const comparison = computed(() =>
    period.value === null
      ? []
      : alignPeriods(
          bars.value,
          fillBuckets(
            previousPeriod(period.value),
            granularity.value,
            previousSeries.value.data ?? [],
          ),
        ),
  )

  const cards = computed(() => ({
    kpi: combine(summary.value),
    spend: combine(series.value),
    categories: combine(byCategory.value),
    comparison: combine(series.value, previousSeries.value),
    top: combine(top.value),
  }))

  async function fetchInto<T>(
    slot: Ref<Slot<T>>,
    cacheKey: string,
    mine: number,
    signal: AbortSignal,
    call: (options: StatsRequestOptions) => Promise<Conditional<T>>,
  ): Promise<void> {
    const cached = cache.get(cacheKey)
    // Stale-while-revalidate: show the cached copy at once, then confirm it with the ETag.
    slot.value = cached
      ? { status: 'ready', data: cached.data as T, error: null }
      : { status: 'loading', data: null, error: null }
    try {
      const result = await call({
        signal,
        ...(cached?.etag == null ? {} : { etag: cached.etag }),
      })
      const entry: CacheEntry | undefined = result.notModified
        ? cached
        : { data: result.data, etag: result.etag }
      // An ETag is only sent for a cached copy, so a 304 always has one to fall back on.
      if (entry === undefined) throw new Error('Received 304 Not Modified without a cached copy')
      cache.set(cacheKey, entry)
      if (mine !== generation) return
      slot.value = { status: 'ready', data: entry.data as T, error: null }
    } catch (caught) {
      if (mine !== generation) return
      if (!(caught instanceof ApiError)) throw caught
      // A failed revalidation is not worth hiding data we already have.
      slot.value = cached
        ? { status: 'ready', data: cached.data as T, error: null }
        : { status: 'error', data: null, error: caught }
    }
  }

  async function load(next: Period, nextCurrency: string): Promise<void> {
    controller?.abort()
    const active = new AbortController()
    controller = active
    generation += 1
    const mine = generation
    period.value = next
    requestedCurrency.value = nextCurrency

    const unit = granularityFor(next)
    const before = previousPeriod(next)
    const range = { from: next.from, to: next.to, currency: nextCurrency }
    const previousRange = { from: before.from, to: before.to, currency: nextCurrency }
    const key = (name: string, from: string, to: string, extra = ''): string =>
      [name, nextCurrency, from, to, extra].join('|')
    const { signal } = active

    await Promise.all([
      fetchInto(summary, key('summary', next.from, next.to), mine, signal, (options) =>
        statsApi.summary(range, options),
      ),
      fetchInto(byCategory, key('categories', next.from, next.to), mine, signal, (options) =>
        statsApi.byCategory(range, options),
      ),
      fetchInto(series, key('series', next.from, next.to, unit), mine, signal, (options) =>
        statsApi.timeseries(range, unit, options),
      ),
      fetchInto(
        previousSeries,
        key('series', before.from, before.to, unit),
        mine,
        signal,
        (options) => statsApi.timeseries(previousRange, unit, options),
      ),
      fetchInto(top, key('top', next.from, next.to, String(TOP_LIMIT)), mine, signal, (options) =>
        statsApi.topExpenses(range, TOP_LIMIT, options),
      ),
    ])
  }

  async function retry(): Promise<void> {
    if (period.value !== null) await load(period.value, requestedCurrency.value)
  }

  return {
    period,
    status,
    isEmpty,
    granularity,
    currency,
    kpi,
    categories,
    bars,
    comparison,
    top: computed(() => top.value.data ?? []),
    cards,
    load,
    retry,
  }
})
