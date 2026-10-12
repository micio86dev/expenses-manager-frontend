import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ExpenseFilters, filtersFromQuery, filtersToQuery } from '@/domain/expense-filters'
import { type PeriodKind, resolveCustomPeriod, resolvePeriod, shiftPeriod } from '@/domain/period'
import { today } from '@/lib/dates'

export type FilterChange =
  | { kind: Exclude<PeriodKind, 'custom'>; categoryId: string | null }
  | { kind: 'custom'; from: string; to: string; categoryId: string | null }

/** The expense list filters, kept in the URL query so they survive a reload and the back button. */
export function useExpenseFilters() {
  const route = useRoute()
  const router = useRouter()

  const filters = computed<ExpenseFilters>(() => filtersFromQuery(route.query, today()))
  const canGoNext = computed(() => shiftPeriod(filters.value.period, 1, today()) !== null)

  async function write(next: ExpenseFilters, replace = false): Promise<void> {
    await router.push({ query: filtersToQuery(next), replace })
  }

  /** Makes the default period visible in the address bar so the URL is always shareable. */
  async function ensureCanonicalUrl(): Promise<void> {
    if (route.query.period === undefined) await write(filters.value, true)
  }

  async function shift(direction: 1 | -1): Promise<void> {
    const period = shiftPeriod(filters.value.period, direction, today())
    if (period !== null) await write({ ...filters.value, period })
  }

  /** The filters chosen in the filter sheet, applied in one history entry. */
  async function apply(change: FilterChange): Promise<boolean> {
    const period =
      change.kind === 'custom'
        ? resolveCustomPeriod(change.from, change.to, today())
        : resolvePeriod(change.kind, today())
    if (period === null) return false
    await write({ ...filters.value, period, categoryId: change.categoryId })
    return true
  }

  const setCategory = (categoryId: string | null): Promise<void> =>
    write({ ...filters.value, categoryId })

  /** Drops the category and search filters, keeping the period. */
  const clearFilters = (): Promise<void> => write({ ...filters.value, categoryId: null, q: '' })

  const setQuery = (q: string): Promise<void> => write({ ...filters.value, q }, true)

  return {
    filters,
    canGoNext,
    ensureCanonicalUrl,
    shift,
    apply,
    setCategory,
    clearFilters,
    setQuery,
  }
}
