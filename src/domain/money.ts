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

/**
 * Parses what a person types ("12,50", "12.5", "7") into minor units.
 * Returns null for empty, negative, malformed or over-precise input.
 */
export function parseAmount(input: string, currency: string): number | null {
  const digits = fractionDigits(currency)
  const match = /^(\d+)(?:[.,](\d+))?$/.exec(input.trim())
  if (match === null) return null
  const [, whole = '', fraction = ''] = match
  if (fraction.length > digits) return null
  return Number(whole + fraction.padEnd(digits, '0'))
}
