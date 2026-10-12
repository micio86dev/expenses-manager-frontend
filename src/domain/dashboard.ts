// Dashboard view models: periods, bucketing, shares and comparisons. Pure TypeScript.
import type { CategoryStat, Granularity, TimeseriesBucket } from '@/api/types'
import {
  addDays,
  addMonths,
  diffDays,
  type IsoDate,
  startOfIsoWeek,
  startOfMonth,
} from '@/lib/dates'
import { CATEGORY_COLORS } from './categories'
import { CURRENCIES } from './money'
import type { Period } from './period'

export type { Granularity }

export const DEFAULT_CURRENCY = 'EUR'

/** The currency in the URL when it is one the app offers, otherwise the default. */
export function currencyFromQuery(value: unknown): string {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)
    ? value
    : DEFAULT_CURRENCY
}

/** Number of days a period covers, counting both ends. */
export function periodDays(period: Period): number {
  return diffDays(period.from, period.to) + 1
}

/** The range of the same length that ends the day before `period` starts. */
export function previousPeriod(period: Period): Period {
  const to = addDays(period.from, -1)
  return { kind: 'custom', from: addDays(to, 1 - periodDays(period)), to }
}

/**
 * Bucket size of the "spend over time" series. Day, week and month periods are always shown by
 * day. A custom range longer than three months is shown by ISO week, and one longer than a year
 * by month. "Longer than N months" means the range reaches the day N months after it starts.
 */
export function granularityFor(period: Period): Granularity {
  if (period.kind !== 'custom') return 'day'
  if (period.to >= addMonths(period.from, 12)) return 'month'
  if (period.to >= addMonths(period.from, 3)) return 'week'
  return 'day'
}

export type DeltaView =
  { direction: 'none' } | { direction: 'up' | 'down' | 'flat'; percent: number }

/** The change against the previous period; `percent` is absolute, with one decimal. */
export function describeDelta(deltaPercent: number | null): DeltaView {
  if (deltaPercent === null) return { direction: 'none' }
  const percent = Math.round(Math.abs(deltaPercent) * 10) / 10
  if (percent === 0) return { direction: 'flat', percent: 0 }
  return { direction: deltaPercent > 0 ? 'up' : 'down', percent }
}

export interface KpiView {
  currency: string
  totalCents: number
  count: number
  dailyAverageCents: number
  /** Days the period covers, to explain what the daily average is averaged over. */
  days: number
  delta: DeltaView
}

/**
 * Integer percentages of `totals` that always add up to 100 (largest remainder method; the
 * earlier entry wins a tie). Returns zeros when the totals add up to nothing.
 */
export function apportionShares(totals: readonly number[]): number[] {
  const sum = totals.reduce((acc, value) => acc + value, 0)
  if (sum <= 0) return totals.map(() => 0)
  const exact = totals.map((value) => (value * 100) / sum)
  const shares = exact.map((value) => Math.floor(value))
  const missing = 100 - shares.reduce((acc, value) => acc + value, 0)
  exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .slice(0, missing)
    .forEach(({ index }) => {
      shares[index] = (shares[index] ?? 0) + 1
    })
  return shares
}

export interface RankedCategory {
  categoryId: string
  name: string
  totalCents: number
  count: number
  /** Whole percent; the list adds up to 100. */
  percent: number
}

/** Largest first (ties by name), with whole-percent shares computed from the amounts. */
export function rankCategories(stats: readonly CategoryStat[]): RankedCategory[] {
  const sorted = [...stats].sort(
    (a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name),
  )
  const shares = apportionShares(sorted.map((stat) => stat.totalCents))
  return sorted.map((stat, index) => ({
    categoryId: stat.categoryId,
    name: stat.name,
    totalCents: stat.totalCents,
    count: stat.count,
    percent: shares[index] ?? 0,
  }))
}

/** The colour of a known category, or a palette colour picked by position. */
export function categoryColor(known: string | undefined, index: number): string {
  if (known !== undefined) return known
  const fallback = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  return fallback === undefined ? CATEGORY_COLORS[0].hex : fallback.hex
}

export interface SeriesPoint {
  start: IsoDate
  totalCents: number
}

/** First day of every bucket that overlaps the period (ISO Monday for weeks). */
export function bucketStarts(period: Period, granularity: Granularity): IsoDate[] {
  const starts: IsoDate[] = []
  let cursor =
    granularity === 'day'
      ? period.from
      : granularity === 'week'
        ? startOfIsoWeek(period.from)
        : startOfMonth(period.from)
  while (cursor <= period.to) {
    starts.push(cursor)
    cursor =
      granularity === 'day'
        ? addDays(cursor, 1)
        : granularity === 'week'
          ? addDays(cursor, 7)
          : addMonths(cursor, 1)
  }
  return starts
}

/** One point per bucket of the period; buckets the API left out count as zero. */
export function fillBuckets(
  period: Period,
  granularity: Granularity,
  buckets: readonly TimeseriesBucket[],
): SeriesPoint[] {
  const byStart = new Map(buckets.map((bucket) => [bucket.periodStart, bucket.totalCents]))
  return bucketStarts(period, granularity).map((start) => ({
    start,
    totalCents: byStart.get(start) ?? 0,
  }))
}

export interface ComparisonPoint {
  index: number
  currentStart: IsoDate | null
  previousStart: IsoDate | null
  current: number | null
  previous: number | null
}

/** Pairs the buckets of two periods by position; the shorter one leaves nulls (gaps). */
export function alignPeriods(
  current: readonly SeriesPoint[],
  previous: readonly SeriesPoint[],
): ComparisonPoint[] {
  const length = Math.max(current.length, previous.length)
  return Array.from({ length }, (_, index) => ({
    index,
    currentStart: current[index]?.start ?? null,
    previousStart: previous[index]?.start ?? null,
    current: current[index]?.totalCents ?? null,
    previous: previous[index]?.totalCents ?? null,
  }))
}

/** The first bucket with the highest spending, or null when nothing was spent. */
export function peakPoint(points: readonly SeriesPoint[]): SeriesPoint | null {
  let peak: SeriesPoint | null = null
  for (const point of points) {
    if (point.totalCents > 0 && (peak === null || point.totalCents > peak.totalCents)) peak = point
  }
  return peak
}
