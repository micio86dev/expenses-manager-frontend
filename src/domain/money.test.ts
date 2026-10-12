import { describe, expect, it } from 'vitest'
import {
  MAX_AMOUNT_CENTS,
  currencyOptions,
  fractionDigits,
  formatAmountInput,
  formatMoney,
  parseAmount,
} from './money'

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

  it('parses locale-formatted thousands and decimals', () => {
    expect(parseAmount('1.234,56', 'EUR')).toBe(123456)
    expect(parseAmount('1,234.56', 'EUR')).toBe(123456)
    expect(parseAmount('1.234.567,8', 'EUR')).toBe(123456780)
    expect(parseAmount('12,50', 'EUR')).toBe(1250)
    expect(parseAmount('0,99', 'EUR')).toBe(99)
  })

  it('rejects zero, negatives, malformed groups and over-precise input', () => {
    expect(parseAmount('0', 'EUR')).toBeNull()
    expect(parseAmount('0,00', 'EUR')).toBeNull()
    expect(parseAmount('-12,50', 'EUR')).toBeNull()
    expect(parseAmount('12,345', 'EUR')).toBeNull()
    expect(parseAmount('12.345,678', 'EUR')).toBeNull()
    expect(parseAmount('1.23.4,56', 'EUR')).toBeNull()
    expect(parseAmount('1,234.567,89', 'EUR')).toBeNull()
    expect(parseAmount('.5', 'EUR')).toBeNull()
  })

  it('rejects values above the contract maximum', () => {
    expect(MAX_AMOUNT_CENTS).toBe(99_999_999_999)
    expect(parseAmount('999.999.999,99', 'EUR')).toBe(99_999_999_999)
    expect(parseAmount('1.000.000.000,00', 'EUR')).toBeNull()
    expect(parseAmount('99999999999999999999', 'EUR')).toBeNull()
  })

  it('formats minor units for an editable input without grouping', () => {
    expect(formatAmountInput(1250, 'EUR', 'it')).toBe('12,50')
    expect(formatAmountInput(1250, 'EUR', 'en')).toBe('12.50')
    expect(formatAmountInput(123456, 'EUR', 'it')).toBe('1234,56')
    expect(formatAmountInput(500, 'JPY', 'en')).toBe('500')
  })

  it('lists the currencies on offer and keeps the current currency selectable', () => {
    expect(currencyOptions('EUR')).toEqual(['EUR', 'USD', 'GBP', 'CHF'])
    expect(currencyOptions('JPY')).toEqual(['JPY', 'EUR', 'USD', 'GBP', 'CHF'])
  })
})
