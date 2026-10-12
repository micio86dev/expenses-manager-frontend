import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currencyFromQuery, DEFAULT_CURRENCY } from '@/domain/dashboard'
import {
  type Period,
  periodFromQuery,
  periodToQuery,
  resolveCustomPeriod,
  resolvePeriod,
  shiftPeriod,
  type StandardPeriodKind,
} from '@/domain/period'
import { today } from '@/lib/dates'

/** The dashboard period and currency, kept in the URL query so they survive a reload. */
export function useDashboardPeriod() {
  const route = useRoute()
  const router = useRouter()

  const period = computed(() => periodFromQuery(route.query, today()))
  const currency = computed(() => currencyFromQuery(route.query.currency))
  const canGoNext = computed(() => shiftPeriod(period.value, 1, today()) !== null)

  async function write(next: Period, nextCurrency: string, replace = false): Promise<void> {
    await router.push({
      query: {
        ...periodToQuery(next),
        ...(nextCurrency === DEFAULT_CURRENCY ? {} : { currency: nextCurrency }),
      },
      replace,
    })
  }

  /** Makes the default period visible in the address bar so the URL is always shareable. */
  async function ensureCanonicalUrl(): Promise<void> {
    if (route.query.period === undefined) await write(period.value, currency.value, true)
  }

  async function shift(direction: 1 | -1): Promise<void> {
    const next = shiftPeriod(period.value, direction, today())
    if (next !== null) await write(next, currency.value)
  }

  /** Changes the kind of period, staying around the end of the one shown (never after today). */
  async function select(kind: StandardPeriodKind): Promise<void> {
    const anchor = period.value.to < today() ? period.value.to : today()
    await write(resolvePeriod(kind, anchor), currency.value)
  }

  async function applyCustom(from: string, to: string): Promise<boolean> {
    const next = resolveCustomPeriod(from, to, today())
    if (next === null) return false
    await write(next, currency.value)
    return true
  }

  const setCurrency = (next: string): Promise<void> => write(period.value, next)

  return {
    period,
    currency,
    canGoNext,
    ensureCanonicalUrl,
    shift,
    select,
    applyCustom,
    setCurrency,
  }
}
