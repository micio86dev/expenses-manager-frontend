import { describe, expect, it } from 'vitest'
import { CATEGORY_COLORS } from './categories'
import {
  alignPeriods,
  apportionShares,
  bucketStarts,
  categoryColor,
  currencyFromQuery,
  DEFAULT_CURRENCY,
  describeDelta,
  fillBuckets,
  granularityFor,
  peakPoint,
  periodDays,
  previousPeriod,
  rankCategories,
} from './dashboard'
import { resolvePeriod, type Period } from './period'

const custom = (from: string, to: string): Period => ({ kind: 'custom', from, to })

describe('granularityFor', () => {
  it.each([
    ['day', resolvePeriod('day', '2026-10-12')],
    ['week', resolvePeriod('week', '2026-10-12')],
    ['month', resolvePeriod('month', '2026-10-12')],
  ] as const)('uses days for a %s period', (_kind, period) => {
    expect(granularityFor(period)).toBe('day')
  })

  it('uses days for a custom range of up to three months', () => {
    expect(granularityFor(custom('2026-07-01', '2026-09-30'))).toBe('day')
    expect(granularityFor(custom('2026-10-12', '2026-10-12'))).toBe('day')
  })

  it('switches to weeks once a custom range is longer than three months', () => {
    expect(granularityFor(custom('2026-07-01', '2026-10-01'))).toBe('week')
    expect(granularityFor(custom('2025-10-01', '2026-09-30'))).toBe('week')
  })

  it('switches to months once a custom range is longer than a year', () => {
    expect(granularityFor(custom('2025-10-01', '2026-10-01'))).toBe('month')
    expect(granularityFor(custom('2024-01-01', '2026-10-12'))).toBe('month')
  })
})

describe('periodDays and previousPeriod', () => {
  it('counts both ends of the range', () => {
    expect(periodDays(resolvePeriod('day', '2026-10-12'))).toBe(1)
    expect(periodDays(resolvePeriod('week', '2026-10-12'))).toBe(7)
    expect(periodDays(resolvePeriod('month', '2026-10-12'))).toBe(31)
  })

  it('returns the range of the same length immediately before', () => {
    expect(previousPeriod(resolvePeriod('week', '2026-10-12'))).toEqual(
      custom('2026-10-05', '2026-10-11'),
    )
    expect(previousPeriod(resolvePeriod('day', '2026-10-12'))).toEqual(
      custom('2026-10-11', '2026-10-11'),
    )
  })

  it('keeps the length of a month, not the previous calendar month', () => {
    const previous = previousPeriod(resolvePeriod('month', '2026-10-12'))
    expect(previous).toEqual(custom('2026-08-31', '2026-09-30'))
    expect(periodDays(previous)).toBe(31)
  })
})

describe('describeDelta', () => {
  it('has no direction when the previous period had no spending', () => {
    expect(describeDelta(null)).toEqual({ direction: 'none' })
  })

  it('reports an increase and a decrease with an absolute, rounded percentage', () => {
    expect(describeDelta(12.345)).toEqual({ direction: 'up', percent: 12.3 })
    expect(describeDelta(-40)).toEqual({ direction: 'down', percent: 40 })
  })

  it('treats a change that rounds to zero as flat', () => {
    expect(describeDelta(0)).toEqual({ direction: 'flat', percent: 0 })
    expect(describeDelta(-0.04)).toEqual({ direction: 'flat', percent: 0 })
  })
})

describe('apportionShares', () => {
  it('always sums to 100 with the largest remainder method', () => {
    expect(apportionShares([1, 1, 1])).toEqual([34, 33, 33])
    expect(apportionShares([50, 30, 20])).toEqual([50, 30, 20])
    const shares = apportionShares([3333, 3333, 3334, 1])
    expect(shares.reduce((sum, value) => sum + value, 0)).toBe(100)
  })

  it('gives ties to the earlier entry', () => {
    expect(apportionShares([1, 1, 1, 1, 1, 1, 1])).toEqual([15, 15, 14, 14, 14, 14, 14])
  })

  it('returns zeros when there is nothing to share', () => {
    expect(apportionShares([0, 0])).toEqual([0, 0])
    expect(apportionShares([])).toEqual([])
  })
})

describe('rankCategories', () => {
  const stat = (name: string, totalCents: number) => ({
    categoryId: name.toLowerCase(),
    name,
    totalCents,
    count: 1,
    sharePercent: 0,
  })

  it('orders by amount and attaches shares that sum to 100', () => {
    const ranked = rankCategories([stat('Coffee', 100), stat('Rent', 600), stat('Food', 300)])
    expect(ranked.map((item) => [item.name, item.percent])).toEqual([
      ['Rent', 60],
      ['Food', 30],
      ['Coffee', 10],
    ])
  })

  it('breaks equal amounts by name so the order is stable', () => {
    const ranked = rankCategories([stat('Zoo', 100), stat('Art', 100), stat('Bus', 100)])
    expect(ranked.map((item) => item.name)).toEqual(['Art', 'Bus', 'Zoo'])
    expect(ranked.reduce((sum, item) => sum + item.percent, 0)).toBe(100)
  })

  it('is empty for no categories', () => {
    expect(rankCategories([])).toEqual([])
  })
})

describe('bucketStarts and fillBuckets', () => {
  it('lists every day, ISO week start and month start of a period', () => {
    expect(bucketStarts(custom('2026-10-10', '2026-10-12'), 'day')).toEqual([
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
    ])
    expect(bucketStarts(custom('2026-10-01', '2026-10-20'), 'week')).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
    ])
    expect(bucketStarts(custom('2026-08-15', '2026-10-02'), 'month')).toEqual([
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
    ])
  })

  it('fills the days without spending with zero', () => {
    const points = fillBuckets(resolvePeriod('week', '2026-10-12'), 'day', [
      { periodStart: '2026-10-13', totalCents: 500, count: 2 },
      { periodStart: '2026-10-18', totalCents: 70, count: 1 },
    ])
    expect(points).toHaveLength(7)
    expect(points.map((point) => point.totalCents)).toEqual([0, 500, 0, 0, 0, 0, 70])
    expect(points[0]).toEqual({ start: '2026-10-12', totalCents: 0 })
  })

  it('ignores buckets outside the period', () => {
    const points = fillBuckets(custom('2026-10-10', '2026-10-11'), 'day', [
      { periodStart: '2026-10-09', totalCents: 999, count: 1 },
      { periodStart: '2026-10-10', totalCents: 1, count: 1 },
    ])
    expect(points.map((point) => point.totalCents)).toEqual([1, 0])
  })
})

describe('alignPeriods', () => {
  const point = (start: string, totalCents: number) => ({ start, totalCents })

  it('pairs buckets by their index in each period', () => {
    const aligned = alignPeriods(
      [point('2026-10-12', 10), point('2026-10-13', 0), point('2026-10-14', 30)],
      [point('2026-10-05', 5), point('2026-10-06', 6), point('2026-10-07', 0)],
    )
    expect(aligned).toEqual([
      {
        index: 0,
        currentStart: '2026-10-12',
        previousStart: '2026-10-05',
        current: 10,
        previous: 5,
      },
      {
        index: 1,
        currentStart: '2026-10-13',
        previousStart: '2026-10-06',
        current: 0,
        previous: 6,
      },
      {
        index: 2,
        currentStart: '2026-10-14',
        previousStart: '2026-10-07',
        current: 30,
        previous: 0,
      },
    ])
  })

  it('leaves a gap when one period has fewer buckets', () => {
    const aligned = alignPeriods([point('2026-10-12', 10)], [point('a', 1), point('b', 2)])
    expect(aligned[1]).toEqual({
      index: 1,
      currentStart: null,
      previousStart: 'b',
      current: null,
      previous: 2,
    })
    expect(alignPeriods([point('a', 1), point('b', 2)], [point('c', 3)])[1]).toMatchObject({
      previousStart: null,
      previous: null,
      current: 2,
    })
  })

  it('is empty when both periods are', () => {
    expect(alignPeriods([], [])).toEqual([])
  })
})

describe('peakPoint', () => {
  it('finds the first highest bucket with spending', () => {
    const points = [
      { start: 'a', totalCents: 5 },
      { start: 'b', totalCents: 9 },
      { start: 'c', totalCents: 9 },
    ]
    expect(peakPoint(points)).toEqual({ start: 'b', totalCents: 9 })
  })

  it('is null without any spending', () => {
    expect(peakPoint([{ start: 'a', totalCents: 0 }])).toBeNull()
    expect(peakPoint([])).toBeNull()
  })
})

describe('categoryColor', () => {
  it('keeps the colour of a known category', () => {
    expect(categoryColor('#3D4F9E', 0)).toBe('#3D4F9E')
  })

  it('falls back to the palette, cycling when it runs out', () => {
    expect(categoryColor(undefined, 1)).toBe(CATEGORY_COLORS[1].hex)
    expect(categoryColor(undefined, CATEGORY_COLORS.length)).toBe(CATEGORY_COLORS[0].hex)
  })
})

describe('currencyFromQuery', () => {
  it('accepts an offered currency and falls back to the default', () => {
    expect(currencyFromQuery('USD')).toBe('USD')
    expect(currencyFromQuery('XXX')).toBe(DEFAULT_CURRENCY)
    expect(currencyFromQuery(undefined)).toBe(DEFAULT_CURRENCY)
    expect(currencyFromQuery(['USD'])).toBe(DEFAULT_CURRENCY)
  })
})
