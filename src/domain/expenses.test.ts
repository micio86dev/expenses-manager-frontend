import { describe, expect, it } from 'vitest'
import { makeExpense } from '../../tests/fixtures'
import {
  type ExpenseFilters,
  filtersFromQuery,
  filtersToQuery,
  matchesFilters,
} from './expense-filters'
import { compareExpenses, groupByDay, sortExpenses, sumByCurrency } from './expenses'
import { resolvePeriod } from './period'

const TODAY = '2026-10-12'

describe('sorting and grouping', () => {
  it('orders by day then creation time, newest first', () => {
    const a = makeExpense({ id: 'a', spentOn: '2026-10-10', createdAt: '2026-10-10T08:00:00Z' })
    const b = makeExpense({ id: 'b', spentOn: '2026-10-12', createdAt: '2026-10-12T08:00:00Z' })
    const c = makeExpense({ id: 'c', spentOn: '2026-10-12', createdAt: '2026-10-12T09:00:00Z' })
    expect(sortExpenses([a, b, c]).map((e) => e.id)).toEqual(['c', 'b', 'a'])
    expect(compareExpenses(a, a)).toBe(0)
  })

  it('does not mutate the input when sorting', () => {
    const list = [makeExpense({ id: 'a', spentOn: '2026-10-01' }), makeExpense({ id: 'b' })]
    sortExpenses(list)
    expect(list.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('groups by day with per-currency totals', () => {
    const groups = groupByDay([
      makeExpense({ id: 'a', spentOn: '2026-10-10', amountCents: 500 }),
      makeExpense({ id: 'b', spentOn: '2026-10-12', amountCents: 1250 }),
      makeExpense({
        id: 'c',
        spentOn: '2026-10-12',
        amountCents: 250,
        createdAt: '2026-10-12T13:00:00Z',
      }),
      makeExpense({ id: 'd', spentOn: '2026-10-12', amountCents: 900, currency: 'USD' }),
    ])
    expect(groups.map((g) => g.date)).toEqual(['2026-10-12', '2026-10-10'])
    expect(groups[0]?.expenses.map((e) => e.id)).toEqual(['c', 'b', 'd'])
    expect(groups[0]?.totals).toEqual([
      { currency: 'EUR', cents: 1500 },
      { currency: 'USD', cents: 900 },
    ])
    expect(groups[1]?.totals).toEqual([{ currency: 'EUR', cents: 500 }])
  })

  it('returns no groups and no totals for an empty list', () => {
    expect(groupByDay([])).toEqual([])
    expect(sumByCurrency([])).toEqual([])
  })
})

describe('expense filters', () => {
  const base: ExpenseFilters = {
    period: resolvePeriod('month', TODAY),
    categoryId: null,
    q: '',
  }

  it('matches on period, category and text', () => {
    const lunch = makeExpense({ description: 'Lunch with Ada', categoryId: 'c1' })
    expect(matchesFilters(lunch, base)).toBe(true)
    expect(matchesFilters(makeExpense({ spentOn: '2026-09-30' }), base)).toBe(false)
    expect(matchesFilters(makeExpense({ spentOn: '2026-11-01' }), base)).toBe(false)
    expect(matchesFilters(lunch, { ...base, categoryId: 'c2' })).toBe(false)
    expect(matchesFilters(lunch, { ...base, categoryId: 'c1' })).toBe(true)
    expect(matchesFilters(lunch, { ...base, q: 'ada' })).toBe(true)
    expect(matchesFilters(lunch, { ...base, q: 'taxi' })).toBe(false)
  })

  it('writes only the active filters to the query', () => {
    expect(filtersToQuery(base)).toEqual({ period: 'month', from: '2026-10-01', to: '2026-10-31' })
    expect(filtersToQuery({ ...base, categoryId: 'c1', q: 'taxi' })).toEqual({
      period: 'month',
      from: '2026-10-01',
      to: '2026-10-31',
      category: 'c1',
      q: 'taxi',
    })
  })

  it('reads filters from the query and trims the search text', () => {
    expect(
      filtersFromQuery({ period: 'week', from: '2026-10-12', category: 'c1', q: '  taxi ' }, TODAY),
    ).toEqual({
      period: { kind: 'week', from: '2026-10-12', to: '2026-10-18' },
      categoryId: 'c1',
      q: 'taxi',
    })
    expect(filtersFromQuery({}, TODAY)).toEqual(base)
    expect(filtersFromQuery({ category: ['x'], q: 7 }, TODAY)).toEqual(base)
    expect(filtersFromQuery({ q: 'x'.repeat(150) }, TODAY).q).toHaveLength(100)
  })
})
