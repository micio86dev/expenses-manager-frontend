<script setup lang="ts">
import { useId } from 'vue'
import type { ExpenseGroupView } from '@/composables/useExpenseGroups'
import { useTranslate } from '@/composables/useTranslate'
import CategoryBadge from '../molecules/CategoryBadge.vue'

defineProps<{ groups: readonly ExpenseGroupView[] }>()
const emit = defineEmits<{ select: [id: string] }>()

const t = useTranslate()
const prefix = useId()
</script>

<template>
  <div class="expense-list">
    <section
      v-for="group in groups"
      :key="group.date"
      class="day"
      :aria-labelledby="`${prefix}-${group.date}`"
    >
      <h2 :id="`${prefix}-${group.date}`" class="day__heading">
        <span>{{ group.label }}</span>
        <span class="day__total amount">
          <span class="visually-hidden">{{ t('expenses.dayTotal') }}: </span>{{ group.totalLabel }}
        </span>
      </h2>
      <ul class="day__rows">
        <li v-for="row in group.rows" :key="row.id" :aria-busy="row.pending ? 'true' : undefined">
          <button
            type="button"
            class="row"
            aria-haspopup="dialog"
            :disabled="row.pending"
            @click="emit('select', row.id)"
          >
            <span class="row__text">
              <span class="row__description">{{ row.description }}</span>
              <CategoryBadge
                :name="row.category.name"
                :color="row.category.color"
                :icon="row.category.icon"
              />
            </span>
            <span class="row__amount amount">{{ row.amountLabel }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.expense-list {
  display: grid;
  gap: var(--space-5);
}

.day__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 3px solid var(--color-text);
  font-size: var(--text-md);
  text-transform: capitalize;
}

.day__total {
  font-weight: var(--weight-bold);
  text-transform: none;
}

.day__rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.day__rows li + li {
  border-top: 2px solid var(--color-rule);
}

.day__rows li[aria-busy='true'] {
  opacity: 0.6;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  min-height: 3.5rem;
  padding: var(--space-3) 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.row:disabled {
  cursor: progress;
}

.row__text {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.row__description {
  overflow-wrap: anywhere;
}

.row__amount {
  flex: none;
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}
</style>
