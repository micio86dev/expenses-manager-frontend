// The filters of the expense list, and how they are stored in the URL query.
import type { Expense } from '@/api/types'
import type { IsoDate } from '@/lib/dates'
import { type Period, periodFromQuery, periodToQuery } from './period'

export const MAX_SEARCH_LENGTH = 100

export interface ExpenseFilters {
  period: Period
  categoryId: string | null
  q: string
}

export type FilterQuery = Record<string, string>

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function filtersFromQuery(query: Record<string, unknown>, today: IsoDate): ExpenseFilters {
  return {
    period: periodFromQuery(query, today),
    categoryId: text(query.category) || null,
    q: text(query.q).trim().slice(0, MAX_SEARCH_LENGTH),
  }
}

export function filtersToQuery(filters: ExpenseFilters): FilterQuery {
  return {
    ...periodToQuery(filters.period),
    ...(filters.categoryId === null ? {} : { category: filters.categoryId }),
    ...(filters.q === '' ? {} : { q: filters.q }),
  }
}

/** Whether an expense belongs in a list loaded with these filters (used for optimistic updates). */
export function matchesFilters(expense: Expense, filters: ExpenseFilters): boolean {
  return (
    expense.spentOn >= filters.period.from &&
    expense.spentOn <= filters.period.to &&
    (filters.categoryId === null || expense.categoryId === filters.categoryId) &&
    (filters.q === '' || expense.description.toLowerCase().includes(filters.q.toLowerCase()))
  )
}
