<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FieldErrors } from '@/api/errors'
import type { Category } from '@/api/types'
import { useTranslate } from '@/composables/useTranslate'
import {
  type ExpenseFormErrors,
  type ExpenseFormValues,
  validateExpenseForm,
} from '@/domain/expense-form'
import { currencyOptions } from '@/domain/money'
import type { ExpenseInput } from '@/api/types'
import BaseButton from '../atoms/BaseButton.vue'
import AmountInput from '../molecules/AmountInput.vue'
import CategoryBadge from '../molecules/CategoryBadge.vue'
import FormField from '../molecules/FormField.vue'
import SelectField from '../molecules/SelectField.vue'

const props = defineProps<{
  initial: ExpenseFormValues
  categories: readonly Category[]
  /** Most recently used categories, newest first. */
  recent: readonly Category[]
  editing: boolean
  serverErrors?: FieldErrors
}>()

const emit = defineEmits<{ submit: [value: ExpenseInput]; cancel: []; delete: [] }>()

const t = useTranslate()

const amount = ref(props.initial.amount)
const currency = ref(props.initial.currency)
const description = ref(props.initial.description)
const categoryId = ref(props.initial.categoryId)
const spentOn = ref(props.initial.spentOn)
const errors = ref<ExpenseFormErrors>({})

const currencies = currencyOptions(props.initial.currency)
const categoryOptions = computed(() =>
  props.categories.map((category) => ({ value: category.id, label: category.name })),
)

// A message per field: what this form found, otherwise what the server rejected.
function messages(field: keyof ExpenseFormValues, serverField: string): string[] {
  const key = errors.value[field]
  if (key !== undefined) return [t(key)]
  return props.serverErrors?.[serverField] ?? []
}

function submit(): void {
  const result = validateExpenseForm({
    amount: amount.value,
    currency: currency.value,
    description: description.value,
    categoryId: categoryId.value,
    spentOn: spentOn.value,
  })
  if (result.ok) {
    errors.value = {}
    emit('submit', result.value)
  } else {
    errors.value = result.errors
  }
}
</script>

<template>
  <form class="expense-form" novalidate @submit.prevent="submit">
    <AmountInput
      v-model="amount"
      v-model:currency="currency"
      :label="t('expenses.form.amount')"
      :hint="t('expenses.form.amountHint')"
      :currency-label="t('expenses.form.currency')"
      :currencies="currencies"
      :errors="messages('amount', 'amountCents')"
    />

    <fieldset v-if="recent.length > 0" class="recent">
      <legend>{{ t('expenses.form.recent') }}</legend>
      <div class="recent__chips">
        <button
          v-for="category in recent"
          :key="category.id"
          type="button"
          class="recent__chip"
          :aria-pressed="categoryId === category.id ? 'true' : 'false'"
          @click="categoryId = category.id"
        >
          <CategoryBadge :name="category.name" :color="category.color" :icon="category.icon" />
        </button>
      </div>
    </fieldset>

    <SelectField
      v-model="categoryId"
      data-category
      :label="t('expenses.form.category')"
      :options="categoryOptions"
      :placeholder="t('expenses.form.categoryPlaceholder')"
      :errors="messages('categoryId', 'categoryId')"
    />

    <FormField
      v-model="description"
      data-description
      :label="t('expenses.form.description')"
      :errors="messages('description', 'description')"
    />

    <FormField
      v-model="spentOn"
      type="date"
      :label="t('expenses.form.date')"
      :errors="messages('spentOn', 'spentOn')"
    />

    <div class="expense-form__actions">
      <BaseButton v-if="editing" data-delete variant="secondary" @click="emit('delete')">
        {{ t('expenses.form.delete') }}
      </BaseButton>
      <span class="expense-form__spacer" />
      <BaseButton data-cancel variant="secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit">{{ t('common.save') }}</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.expense-form {
  display: grid;
  gap: var(--space-4);
}

.recent {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

legend {
  padding: 0;
  margin-bottom: var(--space-2);
  font-weight: var(--weight-medium);
}

.recent__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.recent__chip {
  min-height: var(--target-min);
  padding: var(--space-1) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

/* Pressed is shown by a heavier border and a check as well as by colour. */
.recent__chip[aria-pressed='true'] {
  border-color: var(--color-text);
  box-shadow: 0 0 0 2px var(--color-text);
}

.recent__chip[aria-pressed='true']::after {
  content: '✓';
  margin-left: var(--space-2);
  font-weight: var(--weight-bold);
}

.expense-form__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.expense-form__spacer {
  flex: 1;
}
</style>
