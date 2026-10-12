<script setup lang="ts">
import type { Category, Expense } from '@/api/types'
import { useFormatters } from '@/composables/useFormatters'
import { useTranslate } from '@/composables/useTranslate'
import CategoryBadge from '../molecules/CategoryBadge.vue'

defineProps<{ expenses: readonly Expense[]; categories: ReadonlyMap<string, Category> }>()

const t = useTranslate()
const format = useFormatters()
</script>

<template>
  <ol class="top" :aria-label="t('dashboard.top.listLabel')">
    <li v-for="expense in expenses" :key="expense.id" class="top__row">
      <span class="top__rank amount" aria-hidden="true" />
      <span class="top__text">
        <span class="top__description">{{ expense.description }}</span>
        <CategoryBadge
          :name="categories.get(expense.categoryId)?.name ?? t('expenses.unknownCategory')"
          :color="categories.get(expense.categoryId)?.color ?? 'var(--color-text-muted)'"
          :icon="categories.get(expense.categoryId)?.icon ?? 'other'"
        />
        <span class="top__date">{{ format.bucket(expense.spentOn, 'day') }}</span>
      </span>
      <span class="top__amount amount">{{
        format.money(expense.amountCents, expense.currency)
      }}</span>
    </li>
  </ol>
</template>

<style scoped>
.top {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: rank;
}

.top__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-top: 2px solid var(--color-rule);
  counter-increment: rank;
}

.top__rank {
  flex: none;
  width: 1.5rem;
  color: var(--color-text-muted);
  font-weight: var(--weight-bold);
}

.top__rank::before {
  content: counter(rank);
}

.top__text {
  flex: 1;
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.top__description {
  overflow-wrap: anywhere;
  font-weight: var(--weight-medium);
}

.top__date {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.top__amount {
  flex: none;
  font-weight: var(--weight-bold);
}
</style>
