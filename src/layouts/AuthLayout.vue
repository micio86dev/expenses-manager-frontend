<script setup lang="ts">
import { useTranslate } from '@/composables/useTranslate'
import SkipLink from '@/components/atoms/SkipLink.vue'

const t = useTranslate()
</script>

<template>
  <div class="auth-shell">
    <SkipLink />
    <header class="auth-shell__header">{{ t('app.name') }}</header>
    <main id="main" class="auth-shell__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth-shell {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100dvh;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}

.auth-shell__header {
  padding: var(--space-4);
  font-weight: var(--weight-bold);
}

.auth-shell__main {
  width: 100%;
  max-width: 26rem;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-7);
}
</style>
