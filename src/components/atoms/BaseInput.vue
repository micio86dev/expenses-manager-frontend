<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string
    modelValue: string
    type?: 'text' | 'email' | 'password'
    autocomplete?: string | undefined
    required?: boolean
    minlength?: number | undefined
    invalid?: boolean
    describedby?: string | undefined
  }>(),
  { type: 'text', required: false, invalid: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :id="id"
    class="base-input"
    :value="modelValue"
    :type="type"
    :autocomplete="autocomplete"
    :required="required"
    :minlength="minlength"
    :aria-invalid="invalid ? 'true' : undefined"
    :aria-describedby="describedby"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped>
.base-input {
  width: 100%;
  min-height: var(--target-min);
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.base-input[aria-invalid='true'] {
  border-color: var(--color-danger);
}
</style>
