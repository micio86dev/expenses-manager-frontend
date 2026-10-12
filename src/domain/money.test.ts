import { describe, expect, it } from 'vitest'
import { fractionDigits, formatMoney, parseAmount } from './money'

describe('money', () => {
  it('formats minor units with the locale and currency', () => {
    expect(formatMoney(12345678, 'EUR', 'en')).toBe('€123,456.78')
    expect(formatMoney(12345678, 'EUR', 'it').replace(/\s/g, ' ')).toBe('123.456,78 €')
  })

  it('handles currencies without fraction digits', () => {
    expect(fractionDigits('JPY')).toBe(0)
    expect(fractionDigits('EUR')).toBe(2)
    expect(formatMoney(500, 'JPY', 'en')).toBe('¥500')
  })

  it('formats negative amounts', () => {
    expect(formatMoney(-250, 'EUR', 'en')).toBe('-€2.50')
  })

  it('parses user input with comma or dot decimals into minor units', () => {
    expect(parseAmount('12,50', 'EUR')).toBe(1250)
    expect(parseAmount('12.5', 'EUR')).toBe(1250)
    expect(parseAmount(' 7 ', 'EUR')).toBe(700)
    expect(parseAmount('500', 'JPY')).toBe(500)
  })

  it('rejects invalid or over-precise input', () => {
    expect(parseAmount('', 'EUR')).toBeNull()
    expect(parseAmount('abc', 'EUR')).toBeNull()
    expect(parseAmount('1.234', 'EUR')).toBeNull()
    expect(parseAmount('-5', 'EUR')).toBeNull()
    expect(parseAmount('1,2,3', 'EUR')).toBeNull()
  })
})
