import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  activateDateLocale,
  addDays,
  addMonths,
  endOfIsoWeek,
  endOfMonth,
  formatDate,
  isIsoDate,
  startOfIsoWeek,
  startOfMonth,
  today,
} from './dates'

describe('dates facade', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today as an ISO calendar date', () => {
    vi.useFakeTimers()
    vi.setSystemTime('2026-10-12T10:30:00')
    expect(today()).toBe('2026-10-12')
  })

  it('validates strict ISO calendar dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('12/10/2026')).toBe(false)
    expect(isIsoDate('')).toBe(false)
  })

  it('starts and ends the ISO week on Monday and Sunday', () => {
    expect(startOfIsoWeek('2026-10-14')).toBe('2026-10-12')
    expect(endOfIsoWeek('2026-10-14')).toBe('2026-10-18')
    expect(startOfIsoWeek('2026-10-18')).toBe('2026-10-12')
    expect(startOfIsoWeek('2026-10-12')).toBe('2026-10-12')
  })

  it('computes month boundaries', () => {
    expect(startOfMonth('2026-02-17')).toBe('2026-02-01')
    expect(endOfMonth('2026-02-17')).toBe('2026-02-28')
    expect(endOfMonth('2028-02-01')).toBe('2028-02-29')
  })

  it('adds days and months', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('formats dates with the active locale', async () => {
    await activateDateLocale('it')
    expect(formatDate('2026-10-12', 'ddd D MMM')).not.toBe('Mon 12 Oct')
    await activateDateLocale('en')
    expect(formatDate('2026-10-12', 'ddd D MMM')).toBe('Mon 12 Oct')
  })
})
