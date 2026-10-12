import { type Ref, computed } from 'vue'
import type { CategoryIcon } from '@/api/types'
import { CATEGORY_COLORS } from '@/domain/categories'
import type { DayGroup } from '@/domain/expenses'
import { isTempId } from '@/domain/optimistic'
import { useCategoriesStore } from '@/stores/categories'
import { useFormatters } from './useFormatters'
import { useTranslate } from './useTranslate'

export interface ExpenseRowView {
  id: string
  description: string
  amountLabel: string
  category: { name: string; color: string; icon: CategoryIcon }
  /** True until the server has confirmed the expense (optimistic create). */
  pending: boolean
}

export interface ExpenseGroupView {
  date: string
  label: string
  totalLabel: string
  rows: ExpenseRowView[]
}

/** Turns day groups into display-ready rows: localized labels, amounts and category details. */
export function useExpenseGroups(groups: Ref<readonly DayGroup[]>) {
  const categories = useCategoriesStore()
  const format = useFormatters()
  const t = useTranslate()

  return computed<ExpenseGroupView[]>(() =>
    groups.value.map((group) => ({
      date: group.date,
      label: format.day(group.date),
      totalLabel: format.totals(group.totals),
      rows: group.expenses.map((expense) => {
        const category = categories.byId.get(expense.categoryId)
        return {
          id: expense.id,
          description: expense.description,
          amountLabel: format.money(expense.amountCents, expense.currency),
          category: {
            name: category?.name ?? t('expenses.unknownCategory'),
            color: category?.color ?? CATEGORY_COLORS[2].hex,
            icon: category?.icon ?? 'other',
          },
          pending: isTempId(expense.id),
        }
      }),
    })),
  )
}
