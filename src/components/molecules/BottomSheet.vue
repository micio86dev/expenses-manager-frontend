<script setup lang="ts">
import { useId, useTemplateRef } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useTranslate } from '@/composables/useTranslate'

const props = withDefaults(
  defineProps<{
    title: string
    role?: 'dialog' | 'alertdialog'
    /** Id of the element that describes the dialog (used by alert dialogs). */
    describedby?: string
    /** CSS selector of the control to focus first. Defaults to the first field in the body. */
    initialFocus?: string
    /** `sheet` slides up on mobile and centres on desktop; `center` always centres. */
    placement?: 'sheet' | 'center'
  }>(),
  {
    role: 'dialog',
    initialFocus: '[data-autofocus], .sheet__body :is(input, select, textarea):not([type="radio"])',
    placement: 'sheet',
  },
)

const emit = defineEmits<{ close: [] }>()

const t = useTranslate()
const titleId = useId()
const panel = useTemplateRef<HTMLElement>('panel')

useFocusTrap(panel, {
  onEscape: () => {
    emit('close')
  },
  initialFocus: () => props.initialFocus,
})
</script>

<template>
  <div class="sheet" :class="`sheet--${placement}`">
    <button
      type="button"
      class="sheet__backdrop"
      tabindex="-1"
      aria-hidden="true"
      @click="emit('close')"
    />
    <div
      ref="panel"
      class="sheet__panel"
      :role="role"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="describedby"
      tabindex="-1"
    >
      <div class="sheet__header">
        <h2 :id="titleId">{{ title }}</h2>
        <button
          type="button"
          class="sheet__close"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
      <div class="sheet__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet--center {
  align-items: center;
}

.sheet__backdrop {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: var(--color-scrim);
  cursor: default;
}

.sheet__panel {
  position: relative;
  display: grid;
  gap: var(--space-4);
  width: 100%;
  max-height: 92dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-4) calc(var(--space-4) + env(safe-area-inset-right))
    calc(var(--space-5) + env(safe-area-inset-bottom))
    calc(var(--space-4) + env(safe-area-inset-left));
  border-top: 4px solid var(--color-accent);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--color-bg);
  color: var(--color-text);
  animation: sheet-rise var(--motion-base) var(--ease-out);
}

.sheet--center .sheet__panel {
  width: min(100% - 2 * var(--space-4), 26rem);
  border-radius: var(--radius-lg);
}

.sheet__panel:focus {
  outline: none;
}

.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.sheet__close {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--target-min);
  height: var(--target-min);
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.sheet__body {
  display: grid;
  gap: var(--space-4);
}

@keyframes sheet-rise {
  from {
    transform: translateY(2rem);
    opacity: 0;
  }
}

@media (min-width: 52rem) {
  .sheet {
    align-items: center;
  }

  .sheet__panel {
    width: min(100% - 2 * var(--space-6), 32rem);
    border-radius: var(--radius-lg);
  }
}
</style>
