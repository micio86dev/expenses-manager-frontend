<script setup lang="ts">
import { useTranslate } from '@/composables/useTranslate'
import { useNoticesStore } from '@/stores/notices'

const t = useTranslate()
const notices = useNoticesStore()
</script>

<template>
  <section class="toasts" :aria-label="t('common.notifications')">
    <div class="toasts__stack">
      <div
        v-for="notice in notices.items"
        :key="notice.id"
        :role="notice.kind === 'error' ? 'alert' : 'status'"
        data-toast
        :class="['toast', `toast--${notice.kind}`]"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path
            v-if="notice.kind === 'error'"
            d="M12 3 2 20h20zM12 10v4m0 3h.01"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-else
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p>{{ notice.message }}</p>
        <button type="button" :aria-label="t('common.dismiss')" @click="notices.dismiss(notice.id)">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
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
    </div>
  </section>
</template>

<style scoped>
.toasts {
  position: fixed;
  z-index: 30;
  inset: auto var(--space-3)
    calc(var(--tabbar-height) + var(--space-3) + env(safe-area-inset-bottom));
  pointer-events: none;
}

.toasts__stack {
  display: grid;
  gap: var(--space-2);
  max-width: 28rem;
  margin: 0 auto;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  border: 2px solid var(--color-text);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 0.5rem 1.5rem var(--color-scrim);
  pointer-events: auto;
}

.toast--error {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.toast > svg {
  flex: none;
  margin-top: 0.75rem;
}

.toast p {
  flex: 1;
  padding: var(--space-2) 0;
  font-weight: var(--weight-medium);
}

.toast button {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--target-min);
  height: var(--target-min);
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

@media (min-width: 52rem) {
  .toasts {
    inset: auto var(--space-5) var(--space-5) auto;
    width: 26rem;
  }
}
</style>
