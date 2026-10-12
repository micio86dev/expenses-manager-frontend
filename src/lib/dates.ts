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
 * dayjs locale loaders, one lazy chunk per language. Importing a locale file registers it with
 * dayjs. The i18n registry's locale codes must be a subset of these keys (checked by the type
 * system through `activateDateLocale`).
 */
const localeLoaders = {
  it: () => import('dayjs/locale/it.js'),
  en: () => import('dayjs/locale/en.js'),
} as const

export type DateLocaleCode = keyof typeof localeLoaders

/** Loads the dayjs locale on first use and makes it the active one. */
export async function activateDateLocale(code: DateLocaleCode): Promise<void> {
  await localeLoaders[code]()
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
