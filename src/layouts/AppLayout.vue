<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTranslate } from '@/composables/useTranslate'
import AppNav from '@/components/organisms/AppNav.vue'
import SkipLink from '@/components/atoms/SkipLink.vue'

const t = useTranslate()
const route = useRoute()
const main = useTemplateRef<HTMLElement>('main')

// A single-page app does not reload, so move focus to the content after each navigation.
watch(
  () => route.fullPath,
  () => {
    main.value?.focus()
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="app-shell">
    <SkipLink />
    <header class="app-shell__header">
      <span class="app-shell__brand">{{ t('app.name') }}</span>
    </header>
    <AppNav class="app-shell__nav" />
    <main id="main" ref="main" class="app-shell__main" tabindex="-1">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  min-height: 100dvh;
}

.app-shell__header {
  padding: calc(var(--space-3) + env(safe-area-inset-top))
    calc(var(--space-4) + env(safe-area-inset-right)) var(--space-3)
    calc(var(--space-4) + env(safe-area-inset-left));
  border-bottom: 2px solid var(--color-rule);
}

.app-shell__brand {
  font-weight: var(--weight-bold);
}

.app-shell__main {
  padding: var(--space-5) calc(var(--space-4) + env(safe-area-inset-right))
    calc(var(--tabbar-height) + var(--space-5) + env(safe-area-inset-bottom))
    calc(var(--space-4) + env(safe-area-inset-left));
}

.app-shell__main:focus {
  outline: none;
}

.app-shell__nav {
  position: fixed;
  inset: auto 0 0;
  z-index: 5;
  padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  border-top: 2px solid var(--color-rule);
  background: var(--color-bg);
}

@media (min-width: 52rem) {
  .app-shell {
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
  }

  .app-shell__header {
    grid-column: 1;
    padding-inline: calc(var(--space-4) + env(safe-area-inset-left)) var(--space-4);
    border-bottom: 0;
  }

  .app-shell__nav {
    position: sticky;
    top: 0;
    grid-column: 1;
    grid-row: 2;
    align-self: start;
    inset: auto;
    padding: var(--space-2) var(--space-3);
    border-top: 0;
    border-right: 2px solid var(--color-rule);
    background: transparent;
  }

  .app-shell__main {
    grid-column: 2;
    grid-row: 1 / span 2;
    padding: var(--space-6) var(--space-6) var(--space-6);
    max-width: 60rem;
  }
}
</style>
