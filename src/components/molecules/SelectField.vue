<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label: string
  modelValue: string
  options: readonly { value: string; label: string }[]
  /** Text of an extra first option with an empty value, e.g. "All categories". */
  placeholder?: string
  required?: boolean
  errors?: string[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const errorId = `${id}-error`
const hasErrors = computed(() => (props.errors?.length ?? 0) > 0)
</script>

<template>
  <div class="select-field">
    <label :for="id">{{ label }}</label>
    <select
      v-bind="$attrs"
      :id="id"
      :value="modelValue"
      :required="required"
      :aria-invalid="hasErrors ? 'true' : undefined"
      :aria-describedby="hasErrors ? errorId : undefined"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="hasErrors" :id="errorId" class="select-field__error" data-error>
      <span v-for="message in errors" :key="message">{{ message }}</span>
    </p>
  </div>
</template>

<style scoped>
.select-field {
  display: grid;
  gap: var(--space-1);
}

label {
  font-weight: var(--weight-medium);
}

select {
  min-height: var(--target-min);
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

select[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.select-field__error {
  display: grid;
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
</style>
