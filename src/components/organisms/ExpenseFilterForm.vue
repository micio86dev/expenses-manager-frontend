<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Category } from '@/api/types'
import { useTranslate } from '@/composables/useTranslate'
import { PERIOD_KINDS, type Period, type PeriodKind, resolveCustomPeriod } from '@/domain/period'
import type { FilterChange } from '@/composables/useExpenseFilters'
import BaseButton from '../atoms/BaseButton.vue'
import FormField from '../molecules/FormField.vue'
import SelectField from '../molecules/SelectField.vue'

const props = defineProps<{
  period: Period
  categoryId: string | null
  categories: readonly Category[]
  today: string
}>()

const emit = defineEmits<{ apply: [change: FilterChange]; cancel: [] }>()

const t = useTranslate()

const kind = ref<PeriodKind>(props.period.kind)
const from = ref(props.period.from)
const to = ref(props.period.to < props.today ? props.period.to : props.today)
const category = ref(props.categoryId ?? '')
const rangeError = ref<string | null>(null)

const kindLabels = {
  day: 'expenses.period.day',
  week: 'expenses.period.week',
  month: 'expenses.period.month',
  custom: 'expenses.period.custom',
} as const

const categoryOptions = computed(() =>
  props.categories.map((item) => ({
    value: item.id,
    label: item.archived ? t('expenses.filters.archivedCategory', { name: item.name }) : item.name,
  })),
)

function submit(): void {
  const categoryId = category.value === '' ? null : category.value
  if (kind.value !== 'custom') {
    emit('apply', { kind: kind.value, categoryId })
    return
  }
  if (resolveCustomPeriod(from.value, to.value, props.today) === null) {
    rangeError.value = t('expenses.filters.rangeInvalid')
    return
  }
  rangeError.value = null
  emit('apply', { kind: 'custom', from: from.value, to: to.value, categoryId })
}
</script>

<template>
  <form class="filter-form" novalidate @submit.prevent="submit">
    <fieldset class="filter-form__period">
      <legend>{{ t('expenses.period.label') }}</legend>
      <label v-for="option in PERIOD_KINDS" :key="option" class="choice">
        <input v-model="kind" type="radio" name="period-kind" :value="option" />
        <span>{{ t(kindLabels[option]) }}</span>
      </label>
    </fieldset>

    <div v-if="kind === 'custom'" class="filter-form__range">
      <FormField v-model="from" type="date" :label="t('expenses.period.from')" :max="today" />
      <FormField v-model="to" type="date" :label="t('expenses.period.to')" :max="today" />
      <p v-if="rangeError !== null" class="filter-form__error" data-error>{{ rangeError }}</p>
    </div>

    <SelectField
      v-model="category"
      :label="t('expenses.filters.category')"
      :options="categoryOptions"
      :placeholder="t('expenses.filters.allCategories')"
    />

    <div class="filter-form__actions">
      <BaseButton data-cancel variant="secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit">{{ t('expenses.filters.apply') }}</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.filter-form {
  display: grid;
  gap: var(--space-5);
}

.filter-form__period {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

legend {
  padding: 0;
  margin-bottom: var(--space-1);
  font-weight: var(--weight-medium);
}

.choice {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--target-min);
  cursor: pointer;
}

.choice input {
  width: 1.5rem;
  height: 1.5rem;
  accent-color: var(--color-accent);
}

.filter-form__range {
  display: grid;
  gap: var(--space-3);
}

.filter-form__error {
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.filter-form__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
