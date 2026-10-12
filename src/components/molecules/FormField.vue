<script setup lang="ts">
import { computed, useId } from 'vue'
import BaseInput from '../atoms/BaseInput.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string
    type?: 'text' | 'email' | 'password' | 'date' | 'search'
    max?: string | undefined
    autocomplete?: string | undefined
    required?: boolean
    minlength?: number | undefined
    hint?: string
    errors?: string[]
  }>(),
  { type: 'text', required: false, errors: () => [] },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
const hasErrors = computed(() => props.errors.length > 0)
const describedby = computed(() => {
  const ids = [...(props.hint === undefined ? [] : [hintId]), ...(hasErrors.value ? [errorId] : [])]
  return ids.length > 0 ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="form-field">
    <label class="form-field__label" :for="id">{{ label }}</label>
    <BaseInput
      v-bind="$attrs"
      :id="id"
      :model-value="modelValue"
      :type="type"
      :autocomplete="autocomplete"
      :required="required"
      :minlength="minlength"
      :max="max"
      :invalid="hasErrors"
      :describedby="describedby"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="hint !== undefined" :id="hintId" class="form-field__hint" data-hint>{{ hint }}</p>
    <p v-if="hasErrors" :id="errorId" class="form-field__error" data-error>
      <span v-for="message in errors" :key="message">{{ message }}</span>
    </p>
  </div>
</template>

<style scoped>
.form-field {
  display: grid;
  gap: var(--space-1);
}

.form-field__label {
  font-weight: var(--weight-medium);
}

.form-field__hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.form-field__error {
  display: grid;
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
</style>
