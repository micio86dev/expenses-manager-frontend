<script setup lang="ts">
import { useTranslate } from '@/composables/useTranslate'

const t = useTranslate()
</script>

<template>
  <p class="offline-notice" role="status">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M3 9a14 14 0 0 1 18 0M6 13a9 9 0 0 1 12 0M9.5 16.5a4 4 0 0 1 5 0M12 20h.01M4 4l16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span>{{ t('common.offline') }}</span>
  </p>
</template>

<style scoped>
.offline-notice {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  font-weight: var(--weight-medium);
}

svg {
  flex: none;
  margin-top: 0.15rem;
}
</style>
