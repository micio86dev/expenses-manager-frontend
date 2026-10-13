<script setup lang="ts">
import { computed, useId } from 'vue'
import BaseInput from '../atoms/BaseInput.vue'
import BaseTextarea from '../atoms/BaseTextarea.vue'
import FieldNotes from './FieldNotes.vue'

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
    multiline?: boolean
    hint?: string
    errors?: string[]
  }>(),
  { type: 'text', required: false, multiline: false, errors: () => [] },
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
    <BaseTextarea
      v-if="multiline"
      v-bind="$attrs"
      :id="id"
      :model-value="modelValue"
      :invalid="hasErrors"
      :describedby="describedby"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <BaseInput
      v-else
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
    <FieldNotes :hint="hint" :hint-id="hintId" :error-id="errorId" :errors="errors" />
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
</style>
