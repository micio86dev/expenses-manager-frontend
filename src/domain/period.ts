// Periods the expense list can show. Pure TypeScript: calendar maths goes through the dates facade.
import {
  addDays,
  addMonths,
  diffDays,
  endOfIsoWeek,
  endOfMonth,
  isIsoDate,
  startOfIsoWeek,
  startOfMonth,
  type IsoDate,
} from '@/lib/dates'

export const PERIOD_KINDS = ['day', 'week', 'month', 'custom'] as const
export type PeriodKind = (typeof PERIOD_KINDS)[number]
export type StandardPeriodKind = Exclude<PeriodKind, 'custom'>

/** An inclusive date range. */
export interface Period {
  kind: PeriodKind
  from: IsoDate
  to: IsoDate
}

export function resolvePeriod(kind: StandardPeriodKind, anchor: IsoDate): Period {
  switch (kind) {
    case 'day':
      return { kind, from: anchor, to: anchor }
    case 'week':
      return { kind, from: startOfIsoWeek(anchor), to: endOfIsoWeek(anchor) }
    case 'month':
      return { kind, from: startOfMonth(anchor), to: endOfMonth(anchor) }
  }
}

/** A custom range is valid when both dates exist and `from <= to <= today` (ISO dates sort as text). */
export function resolveCustomPeriod(from: string, to: string, today: IsoDate): Period | null {
  if (!isIsoDate(from) || !isIsoDate(to) || from > to || to > today) return null
  return { kind: 'custom', from, to }
}

/**
 * The adjacent period in the given direction, or null when it would start after today.
 * A custom range moves by its own length and is clamped to today.
 */
export function shiftPeriod(period: Period, direction: 1 | -1, today: IsoDate): Period | null {
  let next: Period
  if (period.kind === 'custom') {
    const span = diffDays(period.from, period.to)
    next =
      direction === 1
        ? {
            kind: 'custom',
            from: addDays(period.to, 1),
            to: minDate(addDays(period.to, 1 + span), today),
          }
        : { kind: 'custom', from: addDays(period.from, -(1 + span)), to: addDays(period.from, -1) }
  } else if (period.kind === 'month') {
    next = resolvePeriod('month', addMonths(period.from, direction))
  } else {
    next = resolvePeriod(
      period.kind,
      addDays(period.from, direction * (period.kind === 'week' ? 7 : 1)),
    )
  }
  return next.from > today ? null : next
}

function minDate(a: IsoDate, b: IsoDate): IsoDate {
  return a < b ? a : b
}

export interface PeriodQuery {
  period: PeriodKind
  from: IsoDate
  to: IsoDate
}

export function periodToQuery(period: Period): PeriodQuery {
  return { period: period.kind, from: period.from, to: period.to }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isStandardKind(value: string): value is StandardPeriodKind {
  return value === 'day' || value === 'week' || value === 'month'
}

/**
 * Reads the period from URL query values. Anything missing or invalid falls back to the current
 * month, so a hand-edited URL never breaks the page.
 */
export function periodFromQuery(query: Record<string, unknown>, today: IsoDate): Period {
  const kind = text(query.period)
  const from = text(query.from)
  if (isStandardKind(kind) && isIsoDate(from)) return resolvePeriod(kind, minDate(from, today))
  if (kind === 'custom') {
    const custom = resolveCustomPeriod(from, text(query.to), today)
    if (custom !== null) return custom
  }
  return resolvePeriod('month', today)
}
