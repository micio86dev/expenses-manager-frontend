import { computed } from 'vue'
import type { CurrencyTotal } from '@/domain/expenses'
import { formatAmountInput, formatMoney } from '@/domain/money'
import type { Period } from '@/domain/period'
import { type IsoDate, formatDate } from '@/lib/dates'
import { useLocaleStore } from '@/stores/locale'

/** Locale-aware formatting of money, days and periods for views. */
export function useFormatters() {
  const localeStore = useLocaleStore()
  const locale = computed(() => localeStore.current)

  const money = (cents: number, currency: string): string =>
    formatMoney(cents, currency, locale.value)

  const amountInput = (cents: number, currency: string): string =>
    formatAmountInput(cents, currency, locale.value)

  const totals = (items: readonly CurrencyTotal[]): string =>
    items.map((item) => money(item.cents, item.currency)).join(' · ')

  const day = (date: IsoDate): string => formatDate(date, 'dddd D MMMM')

  function period(value: Period): string {
    switch (value.kind) {
      case 'day':
        return formatDate(value.from, 'dddd D MMMM YYYY')
      case 'month':
        return formatDate(value.from, 'MMMM YYYY')
      case 'week':
      case 'custom':
        return `${formatDate(value.from, 'D MMM')} – ${formatDate(value.to, 'D MMM YYYY')}`
    }
  }

  return { money, amountInput, totals, day, period }
}
