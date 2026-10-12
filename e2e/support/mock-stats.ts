import { createHash } from 'node:crypto'
import type { MockCategory, MockExpense } from './mock-api'
import { addDays, diffDays, startOfIsoWeek } from '../../src/lib/dates'

// The stats endpoints of the mocked API, computed from the same expenses the list endpoint serves.
// Calendar maths goes through the app's dates facade, like everywhere else.

type StatExpense = MockExpense
type StatCategory = MockCategory

export type StatsBody = Record<string, unknown>

function inRange(expenses: StatExpense[], from: string, to: string, currency: string) {
  return expenses.filter((e) => e.spent_on >= from && e.spent_on <= to && e.currency === currency)
}

const sum = (expenses: StatExpense[]): number => expenses.reduce((s, e) => s + e.amount_cents, 0)

function bucketStart(date: string, granularity: string): string {
  if (granularity === 'week') return startOfIsoWeek(date)
  return granularity === 'month' ? `${date.slice(0, 7)}-01` : date
}

/** The JSON for a stats path, or null when the path is not a stats endpoint. */
export function statsBody(
  path: string,
  query: Record<string, string>,
  expenses: StatExpense[],
  categories: StatCategory[],
): StatsBody | null {
  const { from = '', to = '', currency = 'EUR' } = query
  const current = inRange(expenses, from, to, currency)
  switch (path) {
    case '/stats/summary': {
      const days = diffDays(from, to) + 1
      const previousTo = addDays(from, -1)
      const previous = sum(inRange(expenses, addDays(previousTo, 1 - days), previousTo, currency))
      const total = sum(current)
      return {
        data: {
          currency,
          total_cents: total,
          count: current.length,
          daily_average_cents: Math.round(total / days),
          previous_period: {
            total_cents: previous,
            delta_percent: previous === 0 ? null : ((total - previous) / previous) * 100,
          },
          top_category: null,
          biggest_expense: null,
        },
      }
    }
    case '/stats/by-category': {
      const total = sum(current)
      const groups = new Map<string, StatExpense[]>()
      for (const e of current) groups.set(e.category_id, [...(groups.get(e.category_id) ?? []), e])
      return {
        data: [...groups]
          .map(([id, items]) => ({
            category_id: id,
            name: categories.find((c) => c.id === id)?.name ?? id,
            total_cents: sum(items),
            count: items.length,
            share_percent: (sum(items) / total) * 100,
          }))
          .sort((a, b) => b.total_cents - a.total_cents),
      }
    }
    case '/stats/timeseries': {
      const granularity = query.granularity ?? 'day'
      const buckets = new Map<string, StatExpense[]>()
      for (const e of current) {
        const start = bucketStart(e.spent_on, granularity)
        buckets.set(start, [...(buckets.get(start) ?? []), e])
      }
      return {
        data: [...buckets]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([start, items]) => ({
            period_start: start,
            total_cents: sum(items),
            count: items.length,
          })),
      }
    }
    case '/stats/top-expenses':
      return {
        data: [...current]
          .sort((a, b) => b.amount_cents - a.amount_cents || b.spent_on.localeCompare(a.spent_on))
          .slice(0, Number(query.limit ?? 5)),
      }
    default:
      return null
  }
}

/** A weak validator for a body, so the mock can answer conditional requests with 304. */
export function etagOf(body: StatsBody): string {
  return `"${createHash('sha1').update(JSON.stringify(body)).digest('hex').slice(0, 16)}"`
}
