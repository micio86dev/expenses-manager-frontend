<script setup lang="ts" generic="V extends string">
import { computed, useId } from 'vue'

const props = defineProps<{
  legend: string
  name: string
  options: readonly { value: V; label: string }[]
  modelValue: string
  error?: string | undefined
}>()

const emit = defineEmits<{ 'update:modelValue': [value: V] }>()

defineSlots<{
  tile?: (props: { option: { value: V; label: string }; selected: boolean }) => unknown
}>()

const errorId = useId()
const describedby = computed(() => (props.error === undefined ? undefined : errorId))
</script>

<template>
  <fieldset class="tile-group" :aria-describedby="describedby">
    <legend>{{ legend }}</legend>
    <div class="tile-group__options">
      <label v-for="option in options" :key="option.value" class="tile">
        <input
          class="tile__input"
          type="radio"
          :name="name"
          :value="option.value"
          :checked="modelValue === option.value"
          @change="emit('update:modelValue', option.value)"
        />
        <span class="tile__face" :data-selected="modelValue === option.value ? '' : undefined">
          <slot name="tile" :option="option" :selected="modelValue === option.value" />
          <svg
            v-if="modelValue === option.value"
            class="tile__check"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="visually-hidden">{{ option.label }}</span>
      </label>
    </div>
    <p v-if="error !== undefined" :id="errorId" class="tile-group__error" data-error>{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.tile-group {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

legend {
  padding: 0;
  margin-bottom: var(--space-2);
  font-weight: var(--weight-medium);
}

.tile-group__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tile {
  position: relative;
  cursor: pointer;
}

.tile__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}

.tile__face {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--target-min);
  height: var(--target-min);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}

.tile__face[data-selected] {
  border-color: var(--color-text);
  box-shadow: 0 0 0 2px var(--color-text);
}

.tile__input:focus-visible + .tile__face {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.tile__check {
  position: absolute;
  right: -6px;
  bottom: -6px;
  padding: 2px;
  border-radius: 50%;
  background: var(--color-text);
  color: var(--color-bg);
}

.tile-group__error {
  margin-top: var(--space-1);
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
</style>
