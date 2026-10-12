<script setup lang="ts">
import { useTranslate } from '@/composables/useTranslate'

defineProps<{ label: string; canGoNext: boolean }>()
const emit = defineEmits<{ previous: []; next: [] }>()

const t = useTranslate()
</script>

<template>
  <div class="period-nav">
    <button
      type="button"
      class="period-nav__step"
      :aria-label="t('expenses.period.previous')"
      @click="emit('previous')"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path
          d="M15 5l-7 7 7 7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <p class="period-nav__label" aria-live="polite">{{ label }}</p>
    <button
      type="button"
      class="period-nav__step"
      :disabled="!canGoNext"
      :aria-label="t('expenses.period.next')"
      @click="emit('next')"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path
          d="M9 5l7 7-7 7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.period-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.period-nav__label {
  flex: 1;
  text-align: center;
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  text-transform: capitalize;
}

.period-nav__step {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--target-min);
  height: var(--target-min);
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.period-nav__step:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
