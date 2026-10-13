<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string
    modelValue: string
    rows?: number
    invalid?: boolean
    describedby?: string | undefined
  }>(),
  { rows: 3, invalid: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <textarea
    :id="id"
    class="base-textarea"
    :rows="rows"
    :value="modelValue"
    :aria-invalid="invalid ? 'true' : undefined"
    :aria-describedby="describedby"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<style scoped>
.base-textarea {
  width: 100%;
  min-height: var(--target-min);
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  resize: vertical;
}

.base-textarea[aria-invalid='true'] {
  border-color: var(--color-danger);
}
</style>
