import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ExpenseFilters, filtersFromQuery, filtersToQuery } from '@/domain/expense-filters'
import {
  type Period,
  type StandardPeriodKind,
  resolveCustomPeriod,
  resolvePeriod,
  shiftPeriod,
} from '@/domain/period'
import { today } from '@/lib/dates'

/** The expense list filters, kept in the URL query so they survive a reload and the back button. */
export function useExpenseFilters() {
  const route = useRoute()
  const router = useRouter()

  const filters = computed<ExpenseFilters>(() => filtersFromQuery(route.query, today()))
  const canGoNext = computed(() => shiftPeriod(filters.value.period, 1, today()) !== null)

  async function write(next: ExpenseFilters, replace = false): Promise<void> {
    await router.push({ query: filtersToQuery(next), replace })
  }

  const withPeriod = (period: Period): Promise<void> => write({ ...filters.value, period })

  /** Makes the default period visible in the address bar so the URL is always shareable. */
  async function ensureCanonicalUrl(): Promise<void> {
    if (route.query.period === undefined) await write(filters.value, true)
  }

  async function shift(direction: 1 | -1): Promise<void> {
    const next = shiftPeriod(filters.value.period, direction, today())
    if (next !== null) await withPeriod(next)
  }

  const setPeriodKind = (kind: StandardPeriodKind): Promise<void> =>
    withPeriod(resolvePeriod(kind, today()))

  /** Returns false (and changes nothing) unless `from <= to <= today`. */
  async function setCustomRange(from: string, to: string): Promise<boolean> {
    const period = resolveCustomPeriod(from, to, today())
    if (period === null) return false
    await withPeriod(period)
    return true
  }

  const setCategory = (categoryId: string | null): Promise<void> =>
    write({ ...filters.value, categoryId })

  const setQuery = (q: string): Promise<void> => write({ ...filters.value, q }, true)

  return {
    filters,
    canGoNext,
    ensureCanonicalUrl,
    shift,
    setPeriodKind,
    setCustomRange,
    setCategory,
    setQuery,
  }
}
