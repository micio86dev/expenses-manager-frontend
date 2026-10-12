// Pure selectors over expenses: ordering, grouping by day and totals.
import type { Expense } from '@/api/types'
import type { IsoDate } from '@/lib/dates'

export interface CurrencyTotal {
  currency: string
  cents: number
}

export interface DayGroup {
  date: IsoDate
  expenses: Expense[]
  totals: CurrencyTotal[]
}

/** Newest expense date first, then newest creation time first (the API's own order). */
export function compareExpenses(a: Expense, b: Expense): number {
  if (a.spentOn !== b.spentOn) return a.spentOn < b.spentOn ? 1 : -1
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
  return 0
}

export function sortExpenses(expenses: readonly Expense[]): Expense[] {
  return [...expenses].sort(compareExpenses)
}

/** Totals are never mixed across currencies. */
export function sumByCurrency(expenses: readonly Expense[]): CurrencyTotal[] {
  const totals = new Map<string, number>()
  for (const { currency, amountCents } of expenses) {
    totals.set(currency, (totals.get(currency) ?? 0) + amountCents)
  }
  return [...totals]
    .map(([currency, cents]) => ({ currency, cents }))
    .sort((a, b) => a.currency.localeCompare(b.currency))
}

export function groupByDay(expenses: readonly Expense[]): DayGroup[] {
  const byDate = new Map<IsoDate, Expense[]>()
  for (const expense of sortExpenses(expenses)) {
    byDate.set(expense.spentOn, [...(byDate.get(expense.spentOn) ?? []), expense])
  }
  return [...byDate].map(([date, items]) => ({
    date,
    expenses: items,
    totals: sumByCurrency(items),
  }))
}
