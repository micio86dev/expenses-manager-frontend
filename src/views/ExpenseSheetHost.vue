<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ExpenseInput } from '@/api/types'
import BottomSheet from '@/components/molecules/BottomSheet.vue'
import ConfirmDialog from '@/components/molecules/ConfirmDialog.vue'
import ExpenseForm from '@/components/organisms/ExpenseForm.vue'
import { useFormatters } from '@/composables/useFormatters'
import { useRecentCategories } from '@/composables/useRecentCategories'
import { useTranslate } from '@/composables/useTranslate'
import { recentCategories } from '@/domain/categories'
import type { ExpenseFormValues } from '@/domain/expense-form'
import { today } from '@/lib/dates'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { useExpenseSheetStore } from '@/stores/expenseSheet'
import { useExpensesStore } from '@/stores/expenses'

const t = useTranslate()
const format = useFormatters()
const sheet = useExpenseSheetStore()
const categories = useCategoriesStore()
const expenses = useExpensesStore()
const auth = useAuthStore()
const recent = useRecentCategories(() => auth.user?.id)

const confirmingDelete = ref(false)
// What the person typed, handed back when the server rejects it.
const retry = ref<{ values: ExpenseFormValues; errors: Record<string, string[]> } | null>(null)

watch(
  () => sheet.isOpen,
  (open) => {
    if (open && categories.status !== 'ready') void categories.load()
    if (!open) confirmingDelete.value = false
  },
)

const initial = computed<ExpenseFormValues>(() => {
  if (retry.value !== null) return retry.value.values
  const expense = sheet.editing
  if (expense === null) {
    return { amount: '', currency: 'EUR', description: '', categoryId: '', spentOn: today() }
  }
  return {
    amount: format.amountInput(expense.amountCents, expense.currency),
    currency: expense.currency,
    description: expense.description,
    categoryId: expense.categoryId,
    spentOn: expense.spentOn,
  }
})

// Active categories, plus the one the edited expense already uses even if it was archived.
const choices = computed(() =>
  categories.items.filter(
    (category) => !category.archived || category.id === sheet.editing?.categoryId,
  ),
)
const recentChoices = computed(() => recentCategories(recent.ids.value, categories.items))

function close(): void {
  retry.value = null
  sheet.close()
}

async function save(input: ExpenseInput): Promise<void> {
  const editing = sheet.editing
  retry.value = null
  sheet.close()
  const result =
    editing === null ? await expenses.create(input) : await expenses.update(editing.id, input)
  if (result.ok) {
    recent.record(input.categoryId)
    return
  }
  // The change was rolled back; give the person their draft back with the server's reasons.
  if (result.error.status === 422) {
    retry.value = {
      values: {
        amount: format.amountInput(input.amountCents, input.currency),
        currency: input.currency,
        description: input.description,
        categoryId: input.categoryId,
        spentOn: input.spentOn,
      },
      errors: result.error.fieldErrors,
    }
    if (editing === null) sheet.openCreate()
    else sheet.openEdit(editing)
  }
}

async function remove(): Promise<void> {
  const target = sheet.editing
  confirmingDelete.value = false
  close()
  if (target !== null) await expenses.remove(target.id)
}
</script>

<template>
  <BottomSheet
    v-if="sheet.isOpen"
    :title="t(sheet.editing === null ? 'expenses.sheet.createTitle' : 'expenses.sheet.editTitle')"
    @close="close"
  >
    <ExpenseForm
      :initial="initial"
      :categories="choices"
      :recent="recentChoices"
      :editing="sheet.editing !== null"
      :server-errors="retry?.errors ?? {}"
      @submit="save"
      @cancel="close"
      @delete="confirmingDelete = true"
    />
  </BottomSheet>

  <ConfirmDialog
    v-if="sheet.isOpen && confirmingDelete && sheet.editing !== null"
    :title="t('expenses.confirmDelete.title')"
    :message="
      t('expenses.confirmDelete.message', {
        description: sheet.editing.description,
        amount: format.money(sheet.editing.amountCents, sheet.editing.currency),
      })
    "
    :confirm-label="t('expenses.confirmDelete.confirm')"
    @confirm="remove"
    @cancel="confirmingDelete = false"
  />
</template>
