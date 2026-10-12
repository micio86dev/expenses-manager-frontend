<script setup lang="ts">
import { computed, useId } from 'vue'

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
    <p :id="hintId" class="amount-input__hint" data-hint>{{ hint }}</p>
    <p v-if="hasErrors" :id="errorId" class="amount-input__error" data-error>
      <span v-for="message in errors" :key="message">{{ message }}</span>
    </p>
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

.amount-input__row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  border-bottom: 3px solid var(--color-text);
}

/* The signature element: a large, borderless, tabular amount. */
.amount-input__field {
  flex: 1;
  min-width: 0;
  padding: var(--space-1) 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-amount);
  font-weight: var(--weight-bold);
  line-height: 1.1;
}

.amount-input__field:focus-visible {
  outline-offset: 4px;
}

.amount-input__currency {
  flex: none;
  min-height: var(--target-min);
  margin-bottom: var(--space-2);
  padding: 0 var(--space-2);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-weight: var(--weight-medium);
}

.amount-input__hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.amount-input__error {
  display: grid;
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.amount-input__field[aria-invalid='true'] {
  color: var(--color-danger);
}
</style>
