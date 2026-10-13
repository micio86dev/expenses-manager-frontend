<script setup lang="ts">
import { computed, useId } from 'vue'
import FieldNotes from './FieldNotes.vue'

const props = defineProps<{
  label: string
  hint: string
  currencyLabel: string
  modelValue: string
  currency: string
  currencies: readonly string[]
  errors?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:currency': [value: string]
}>()

const id = useId()
const currencyId = `${id}-currency`
const hintId = `${id}-hint`
const errorId = `${id}-error`
const hasErrors = computed(() => (props.errors?.length ?? 0) > 0)
const describedby = computed(() => (hasErrors.value ? `${hintId} ${errorId}` : hintId))
</script>

<template>
  <div class="amount-input">
    <label class="amount-input__label" :for="id">{{ label }}</label>
    <div class="amount-input__row">
      <input
        :id="id"
        class="amount-input__field amount"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        :value="modelValue"
        :aria-invalid="hasErrors ? 'true' : undefined"
        :aria-describedby="describedby"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <label class="visually-hidden" :for="currencyId">{{ currencyLabel }}</label>
      <select
        :id="currencyId"
        class="amount-input__currency"
        data-currency
        :value="currency"
        @change="emit('update:currency', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="code in currencies" :key="code" :value="code">{{ code }}</option>
      </select>
    </div>
    <FieldNotes :hint="hint" :hint-id="hintId" :error-id="errorId" :errors="errors ?? []" />
  </div>
</template>

<style scoped>
.amount-input {
  display: grid;
  gap: var(--space-1);
}

.amount-input__label {
  font-weight: var(--weight-medium);
}

/* Same frame as every other field: a 2px border, the base text size, and the currency inside it. */
.amount-input__row {
  display: flex;
  align-items: stretch;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.amount-input__field {
  flex: 1;
  min-width: 0;
  min-height: var(--target-min);
  padding: var(--space-2) var(--space-3);
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-variant-numeric: tabular-nums;
}

.amount-input__row:focus-within {
  border-color: var(--color-text);
}

.amount-input__currency {
  flex: none;
  padding: 0 var(--space-3);
  border: 0;
  border-left: 2px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-weight: var(--weight-medium);
}

.amount-input__field[aria-invalid='true'] {
  color: var(--color-danger);
}
</style>
