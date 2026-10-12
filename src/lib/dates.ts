// The only module allowed to use dayjs (and `new Date` / `Date.*`). Everything else exchanges
// calendar dates as ISO `YYYY-MM-DD` strings.
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import isoWeek from 'dayjs/plugin/isoWeek.js'

dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)

/** Calendar date in ISO 8601 form, `YYYY-MM-DD`. */
export type IsoDate = string

const ISO_FORMAT = 'YYYY-MM-DD'

/**
 * Switches the dayjs locale. The caller supplies the dynamic import of the dayjs locale file so
 * that each locale stays a separate lazy chunk; importing it registers the locale with dayjs.
 */
export async function activateDateLocale(
  code: string,
  load: () => Promise<unknown>,
): Promise<void> {
  await load()
  dayjs.locale(code)
}

export function today(): IsoDate {
  return dayjs().format(ISO_FORMAT)
}

export function isIsoDate(value: string): boolean {
  return dayjs(value, ISO_FORMAT, true).isValid()
}

export function startOfIsoWeek(date: IsoDate): IsoDate {
  return dayjs(date).startOf('isoWeek').format(ISO_FORMAT)
}

export function endOfIsoWeek(date: IsoDate): IsoDate {
  return dayjs(date).endOf('isoWeek').format(ISO_FORMAT)
}

export function startOfMonth(date: IsoDate): IsoDate {
  return dayjs(date).startOf('month').format(ISO_FORMAT)
}

export function endOfMonth(date: IsoDate): IsoDate {
  return dayjs(date).endOf('month').format(ISO_FORMAT)
}

export function addDays(date: IsoDate, amount: number): IsoDate {
  return dayjs(date).add(amount, 'day').format(ISO_FORMAT)
}

export function addMonths(date: IsoDate, amount: number): IsoDate {
  return dayjs(date).add(amount, 'month').format(ISO_FORMAT)
}

/** Formats with a dayjs pattern in the active locale, e.g. `ddd D MMM`. */
export function formatDate(date: IsoDate, pattern: string): string {
  return dayjs(date).format(pattern)
}
