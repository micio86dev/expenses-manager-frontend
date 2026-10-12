<script setup lang="ts">
import { useTranslate } from '@/composables/useTranslate'

const t = useTranslate()
</script>

<template>
  <a class="skip-link" href="#main">{{ t('app.skipToContent') }}</a>
</template>

<style scoped>
.skip-link {
  position: absolute;
  z-index: 10;
  left: var(--space-3);
  top: calc(-1 * var(--target-min) - var(--space-4));
  display: inline-flex;
  align-items: center;
  min-height: var(--target-min);
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--weight-medium);
}

.skip-link:focus {
  top: var(--space-3);
}
</style>
