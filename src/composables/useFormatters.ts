import { computed } from 'vue'
import type { Granularity } from '@/api/types'
import type { CurrencyTotal } from '@/domain/expenses'
import { formatAmountInput, formatMoney } from '@/domain/money'
import type { Period } from '@/domain/period'
import { type IsoDate, formatDate } from '@/lib/dates'
import { translate } from '@/i18n'
import { useLocaleStore } from '@/stores/locale'

/** Locale-aware formatting of money, days and periods for views. */
export function useFormatters() {
  const localeStore = useLocaleStore()
  const locale = computed(() => localeStore.current)

  const money = (cents: number, currency: string): string =>
    formatMoney(cents, currency, locale.value)

  const amountInput = (cents: number, currency: string): string =>
    formatAmountInput(cents, currency, locale.value)

  function totals(items: readonly CurrencyTotal[]): string {
    const [first = '', ...rest] = items.map((item) => money(item.cents, item.currency))
    return rest.reduce(
      (joined, next) => translate('format.pair', { first: joined, second: next }),
      first,
    )
  }

  const day = (date: IsoDate): string => formatDate(date, 'dddd D MMMM')

  function period(value: Period): string {
    switch (value.kind) {
      case 'day':
        return formatDate(value.from, 'dddd D MMMM YYYY')
      case 'month':
        return formatDate(value.from, 'MMMM YYYY')
      case 'week':
      case 'custom':
        return translate('format.range', {
          from: formatDate(value.from, 'D MMM'),
          to: formatDate(value.to, 'D MMM YYYY'),
        })
    }
  }

  /** Axis and table label of a chart bucket: the day, the week's first day or the month. */
  const bucket = (date: IsoDate, granularity: Granularity): string =>
    formatDate(date, granularity === 'month' ? 'MMM YYYY' : 'D MMM')

  const percent = (value: number): string =>
    new Intl.NumberFormat(locale.value, { style: 'percent' }).format(value / 100)

  return { money, amountInput, totals, day, period, bucket, percent }
}
