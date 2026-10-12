<script setup lang="ts">
import { useId } from 'vue'
import type { LocaleCode } from '@/i18n/registry'

defineProps<{
  label: string
  modelValue: LocaleCode
  options: readonly { code: LocaleCode; label: string }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [code: LocaleCode] }>()

const id = useId()
</script>

<template>
  <div class="language-switcher">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as LocaleCode)"
    >
      <option v-for="option in options" :key="option.code" :value="option.code">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.language-switcher {
  display: grid;
  gap: var(--space-1);
  max-width: 20rem;
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
</style>
