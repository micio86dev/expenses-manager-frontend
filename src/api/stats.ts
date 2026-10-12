import type { ApiClient, Conditional } from './client'
import type { CategoryStat, Expense, Granularity, StatsSummary, TimeseriesBucket } from './types'

interface Envelope<T> {
  data: T
}

/** `from` and `to` are required by the contract; totals are never mixed across currencies. */
export interface StatsRange {
  from: string
  to: string
  currency: string
}

/** Lets a caller revalidate a cached answer and cancel a request that is no longer needed. */
export interface StatsRequestOptions {
  etag?: string
  signal?: AbortSignal
}

export function createStatsApi(client: ApiClient) {
  async function get<T>(
    path: string,
    range: StatsRange,
    extra: Record<string, string | number>,
    { etag, signal }: StatsRequestOptions = {},
  ): Promise<Conditional<T>> {
    const result = await client.conditional<Envelope<T>>('GET', path, {
      query: { from: range.from, to: range.to, currency: range.currency, ...extra },
      ...(etag === undefined ? {} : { etag }),
      ...(signal === undefined ? {} : { signal }),
    })
    return result.notModified ? result : { ...result, data: result.data.data }
  }

  return {
    summary: (range: StatsRange, options?: StatsRequestOptions) =>
      get<StatsSummary>('/stats/summary', range, {}, options),
    byCategory: (range: StatsRange, options?: StatsRequestOptions) =>
      get<CategoryStat[]>('/stats/by-category', range, {}, options),
    timeseries: (range: StatsRange, granularity: Granularity, options?: StatsRequestOptions) =>
      get<TimeseriesBucket[]>('/stats/timeseries', range, { granularity }, options),
    topExpenses: (range: StatsRange, limit: number, options?: StatsRequestOptions) =>
      get<Expense[]>('/stats/top-expenses', range, { limit }, options),
  }
}

export type StatsApi = ReturnType<typeof createStatsApi>
