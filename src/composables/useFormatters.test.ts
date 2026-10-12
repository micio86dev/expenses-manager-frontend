import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { useLocaleStore } from '@/stores/locale'
import { useFormatters } from './useFormatters'

async function formatters(locale: 'en' | 'it') {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useLocaleStore().apply(locale)
  let result: ReturnType<typeof useFormatters> | undefined
  mount(
    defineComponent({
      setup() {
        result = useFormatters()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n] } },
  )
  if (result === undefined) throw new Error('composable did not run')
  return result
}

const nbsp = (value: string): string => value.replace(/\s/g, ' ')

describe('useFormatters', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('formats money for the active locale', async () => {
    const en = await formatters('en')
    expect(en.money(1234567, 'EUR')).toBe('€12,345.67')
    const italian = await formatters('it')
    expect(nbsp(italian.money(1234567, 'EUR'))).toBe('12.345,67 €')
  })

  it('joins per-currency totals', async () => {
    const en = await formatters('en')
    expect(
      en.totals([
        { currency: 'EUR', cents: 1500 },
        { currency: 'USD', cents: 900 },
      ]),
    ).toBe('€15.00 · $9.00')
  })

  it('labels a day in the active language', async () => {
    const en = await formatters('en')
    const english = en.day('2026-10-12')
    expect(english).toBe('Monday 12 October')
    const italian = await formatters('it')
    expect(italian.day('2026-10-12')).toContain('12')
    expect(italian.day('2026-10-12')).not.toBe(english)
  })

  it('labels each kind of period', async () => {
    const en = await formatters('en')
    expect(en.period({ kind: 'day', from: '2026-10-12', to: '2026-10-12' })).toBe(
      'Monday 12 October 2026',
    )
    expect(en.period({ kind: 'month', from: '2026-10-01', to: '2026-10-31' })).toBe('October 2026')
    expect(en.period({ kind: 'week', from: '2026-10-12', to: '2026-10-18' })).toBe(
      '12 Oct – 18 Oct 2026',
    )
    expect(en.period({ kind: 'custom', from: '2026-09-01', to: '2026-10-09' })).toBe(
      '1 Sep – 9 Oct 2026',
    )
  })

  it('formats an amount for an input field', async () => {
    const italian = await formatters('it')
    expect(italian.amountInput(1250, 'EUR')).toBe('12,50')
  })

  it('labels chart buckets by granularity and formats shares', async () => {
    const en = await formatters('en')
    expect(en.bucket('2026-10-12', 'day')).toBe('12 Oct')
    expect(en.bucket('2026-10-12', 'week')).toBe('12 Oct')
    expect(en.bucket('2026-10-01', 'month')).toBe('Oct 2026')
    expect(en.percent(70)).toBe('70%')
  })
})
