// Money is an integer in minor units (cents) plus an ISO 4217 currency code. Pure TypeScript.

/** Number of decimal places the currency uses (2 for EUR, 0 for JPY). */
export function fractionDigits(currency: string): number {
  const parts = new Intl.NumberFormat('en', { style: 'currency', currency }).formatToParts(1)
  return parts.find((part) => part.type === 'fraction')?.value.length ?? 0
}

export function formatMoney(minorUnits: number, currency: string, locale: string): string {
  const digits = fractionDigits(currency)
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    minorUnits / 10 ** digits,
  )
}

/** Largest amount the API accepts, in minor units (contract `ExpenseInput.amount_cents`). */
export const MAX_AMOUNT_CENTS = 99_999_999_999

/** Minor units as an editable string in the locale's decimal style, without grouping: "12,50". */
export function formatAmountInput(minorUnits: number, currency: string, locale: string): string {
  const digits = fractionDigits(currency)
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(minorUnits / 10 ** digits)
}

const GROUPED = (separator: string): RegExp => new RegExp(`^\\d{1,3}(?:${separator}\\d{3})+$`)

/** Splits "1.234,56" into its whole and fraction digits, or null when the shape is invalid. */
function splitAmount(input: string): { whole: string; fraction: string } | null {
  if (!/^[\d.,]+$/.test(input)) return null
  const separator = /[.,](?=[^.,]*$)/.exec(input)?.[0]
  if (separator === undefined) return { whole: input, fraction: '' }
  const escaped = `\\${separator}`
  const other = separator === ',' ? '.' : ','
  const parts = input.split(separator)
  // A separator that repeats can only group thousands: "1.234.567".
  if (parts.length > 2) {
    return GROUPED(escaped).test(input) ? { whole: parts.join(''), fraction: '' } : null
  }
  const [integer = '', fraction = ''] = parts
  const groupedInteger = integer.includes(other)
    ? GROUPED(`\\${other}`).test(integer)
    : /^\d+$/.test(integer)
  if (!groupedInteger || !/^\d+$/.test(fraction)) return null
  return { whole: integer.split(other).join(''), fraction }
}

/**
 * Parses what a person types ("12,50", "12.5", "1.234,56", "7") into minor units.
 * Returns null for empty, zero, negative, malformed, over-precise or over-the-maximum input.
 */
export function parseAmount(input: string, currency: string): number | null {
  const digits = fractionDigits(currency)
  const parts = splitAmount(input.trim())
  if (parts === null || parts.fraction.length > digits) return null
  const minor = Number(parts.whole + parts.fraction.padEnd(digits, '0'))
  return minor > 0 && minor <= MAX_AMOUNT_CENTS ? minor : null
}
