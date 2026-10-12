<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CategoryInput } from '@/api/types'
import type { FieldErrors } from '@/api/errors'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type CategoryFormErrors,
  validateCategoryForm,
} from '@/domain/categories'
import { useTranslate } from '@/composables/useTranslate'
import BaseButton from '../atoms/BaseButton.vue'
import CategoryIcon from '../atoms/CategoryIcon.vue'
import FormField from '../molecules/FormField.vue'
import RadioTileGroup from '../molecules/RadioTileGroup.vue'

const props = defineProps<{
  initial: CategoryInput | null
  serverErrors?: FieldErrors
}>()

const emit = defineEmits<{ submit: [value: CategoryInput]; cancel: [] }>()

const t = useTranslate()

const name = ref(props.initial?.name ?? '')
const color = ref(props.initial?.color.toUpperCase() ?? CATEGORY_COLORS[0].hex)
const icon = ref<string>(props.initial?.icon ?? 'tag')
const errors = ref<CategoryFormErrors>({})

const colorOptions = computed(() =>
  CATEGORY_COLORS.map((option) => ({ value: option.hex, label: t(option.labelKey) })),
)
const iconOptions = CATEGORY_ICONS.map((value) => ({ value, label: '' }))
const labelledIcons = computed(() =>
  iconOptions.map((option) => ({
    value: option.value,
    label: t(`categories.icons.${option.value}`),
  })),
)

const nameErrors = computed(() => [
  ...(errors.value.name === undefined ? [] : [t(errors.value.name)]),
  ...(props.serverErrors?.name ?? []),
])
const colorError = computed(() => {
  const key = errors.value.color
  return key === undefined ? props.serverErrors?.color?.[0] : t(key)
})
const iconError = computed(() => {
  const key = errors.value.icon
  return key === undefined ? props.serverErrors?.icon?.[0] : t(key)
})

function submit(): void {
  const result = validateCategoryForm({ name: name.value, color: color.value, icon: icon.value })
  if (result.ok) {
    errors.value = {}
    emit('submit', result.value)
  } else {
    errors.value = result.errors
  }
}
</script>

<template>
  <form class="category-form" novalidate @submit.prevent="submit">
    <FormField v-model="name" :label="t('categories.form.name')" :errors="nameErrors" />
    <RadioTileGroup
      v-model="color"
      name="category-color"
      :legend="t('categories.form.color')"
      :options="colorOptions"
      :error="colorError"
    >
      <template #tile="{ option }">
        <span class="swatch" :style="{ background: option.value }" />
      </template>
    </RadioTileGroup>
    <RadioTileGroup
      v-model="icon"
      name="category-icon"
      :legend="t('categories.form.icon')"
      :options="labelledIcons"
      :error="iconError"
    >
      <template #tile="{ option }">
        <CategoryIcon :name="option.value" />
      </template>
    </RadioTileGroup>
    <div class="category-form__actions">
      <BaseButton data-cancel variant="secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton type="submit">{{ t('common.save') }}</BaseButton>
    </div>
  </form>
</template>

<style scoped>
.category-form {
  display: grid;
  gap: var(--space-5);
}

.swatch {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-sm);
}

.category-form__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
