import { describe, expect, it } from 'vitest'
import {
  type Period,
  periodFromQuery,
  periodToQuery,
  resolveCustomPeriod,
  resolvePeriod,
  shiftPeriod,
} from './period'

const TODAY = '2026-10-12'

describe('resolvePeriod', () => {
  it('resolves a single day', () => {
    expect(resolvePeriod('day', '2026-10-12')).toEqual({
      kind: 'day',
      from: '2026-10-12',
      to: '2026-10-12',
    })
  })

  it('resolves the ISO week from Monday to Sunday', () => {
    expect(resolvePeriod('week', '2026-10-14')).toEqual({
      kind: 'week',
      from: '2026-10-12',
      to: '2026-10-18',
    })
    expect(resolvePeriod('week', '2026-10-18').from).toBe('2026-10-12')
  })

  it('keeps ISO weeks whole across the year end', () => {
    expect(resolvePeriod('week', '2026-12-31')).toMatchObject({
      from: '2026-12-28',
      to: '2027-01-03',
    })
    expect(resolvePeriod('week', '2027-01-01')).toMatchObject({
      from: '2026-12-28',
      to: '2027-01-03',
    })
    expect(resolvePeriod('week', '2025-01-02')).toMatchObject({
      from: '2024-12-30',
      to: '2025-01-05',
    })
  })

  it('resolves the calendar month including leap February', () => {
    expect(resolvePeriod('month', '2026-10-12')).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-31',
    })
    expect(resolvePeriod('month', '2028-02-10')).toMatchObject({
      from: '2028-02-01',
      to: '2028-02-29',
    })
  })
})

describe('resolveCustomPeriod', () => {
  it('accepts a past range with from <= to <= today', () => {
    expect(resolveCustomPeriod('2026-09-01', '2026-09-15', TODAY)).toEqual({
      kind: 'custom',
      from: '2026-09-01',
      to: '2026-09-15',
    })
    expect(resolveCustomPeriod('2026-10-12', '2026-10-12', TODAY)).not.toBeNull()
  })

  it('rejects inverted, future and malformed ranges', () => {
    expect(resolveCustomPeriod('2026-09-15', '2026-09-01', TODAY)).toBeNull()
    expect(resolveCustomPeriod('2026-10-01', '2026-10-13', TODAY)).toBeNull()
    expect(resolveCustomPeriod('2026-02-30', '2026-03-01', TODAY)).toBeNull()
    expect(resolveCustomPeriod('', '2026-03-01', TODAY)).toBeNull()
    expect(resolveCustomPeriod('2026-03-01', 'nope', TODAY)).toBeNull()
  })
})

function custom(from: string, to: string): Period {
  const period = resolveCustomPeriod(from, to, TODAY)
  if (period === null) throw new Error('invalid test range')
  return period
}

describe('shiftPeriod', () => {
  it('moves a day, a week and a month backwards and forwards', () => {
    expect(shiftPeriod(resolvePeriod('day', '2026-10-12'), -1, TODAY)).toMatchObject({
      from: '2026-10-11',
    })
    expect(shiftPeriod(resolvePeriod('week', '2026-10-05'), 1, TODAY)).toMatchObject({
      from: '2026-10-12',
      to: '2026-10-18',
    })
    expect(shiftPeriod(resolvePeriod('month', '2026-10-12'), -1, TODAY)).toMatchObject({
      from: '2026-09-01',
      to: '2026-09-30',
    })
  })

  it('crosses year boundaries', () => {
    expect(shiftPeriod(resolvePeriod('month', '2027-01-15'), -1, '2027-03-01')).toMatchObject({
      from: '2026-12-01',
      to: '2026-12-31',
    })
    expect(shiftPeriod(resolvePeriod('week', '2027-01-04'), -1, '2027-03-01')).toMatchObject({
      from: '2026-12-28',
      to: '2027-01-03',
    })
  })

  it('refuses to move into the future', () => {
    expect(shiftPeriod(resolvePeriod('day', TODAY), 1, TODAY)).toBeNull()
    expect(shiftPeriod(resolvePeriod('week', TODAY), 1, TODAY)).toBeNull()
    expect(shiftPeriod(resolvePeriod('month', TODAY), 1, TODAY)).toBeNull()
  })

  it('shifts a custom range by its own length and clamps it to today', () => {
    const range = custom('2026-09-01', '2026-09-10')
    expect(shiftPeriod(range, -1, TODAY)).toEqual({
      kind: 'custom',
      from: '2026-08-22',
      to: '2026-08-31',
    })
    expect(shiftPeriod(range, 1, TODAY)).toEqual({
      kind: 'custom',
      from: '2026-09-11',
      to: '2026-09-20',
    })
    expect(shiftPeriod(custom('2026-10-01', '2026-10-10'), 1, TODAY)).toEqual({
      kind: 'custom',
      from: '2026-10-11',
      to: '2026-10-12',
    })
    expect(shiftPeriod(custom('2026-10-03', '2026-10-12'), 1, TODAY)).toBeNull()
  })
})

describe('period query', () => {
  it('round-trips through the URL query', () => {
    const period = resolvePeriod('week', '2026-10-14')
    expect(periodToQuery(period)).toEqual({
      period: 'week',
      from: '2026-10-12',
      to: '2026-10-18',
    })
    expect(periodFromQuery({ ...periodToQuery(period) }, TODAY)).toEqual(period)
  })

  it('re-derives standard periods from the from date', () => {
    expect(periodFromQuery({ period: 'month', from: '2026-09-17', to: 'junk' }, TODAY)).toEqual({
      kind: 'month',
      from: '2026-09-01',
      to: '2026-09-30',
    })
  })

  it('reads custom ranges and falls back to the current month when invalid', () => {
    expect(
      periodFromQuery({ period: 'custom', from: '2026-09-01', to: '2026-09-09' }, TODAY),
    ).toEqual({ kind: 'custom', from: '2026-09-01', to: '2026-09-09' })
    const month = { kind: 'month', from: '2026-10-01', to: '2026-10-31' }
    expect(periodFromQuery({}, TODAY)).toEqual(month)
    expect(periodFromQuery({ period: 'year' }, TODAY)).toEqual(month)
    expect(
      periodFromQuery({ period: 'custom', from: '2026-09-09', to: '2026-09-01' }, TODAY),
    ).toEqual(month)
    expect(periodFromQuery({ period: ['day'], from: 5 }, TODAY)).toEqual(month)
  })

  it('does not anchor a standard period in the future', () => {
    expect(periodFromQuery({ period: 'day', from: '2030-01-01' }, TODAY)).toEqual({
      kind: 'day',
      from: TODAY,
      to: TODAY,
    })
  })
})
