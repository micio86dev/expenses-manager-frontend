<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTranslate } from '@/composables/useTranslate'
import AppNav from '@/components/organisms/AppNav.vue'
import SkipLink from '@/components/atoms/SkipLink.vue'
import ToastRegion from '@/components/organisms/ToastRegion.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { useExpenseSheetStore } from '@/stores/expenseSheet'
import ExpenseSheetHost from '@/views/ExpenseSheetHost.vue'

const t = useTranslate()
const route = useRoute()
const sheet = useExpenseSheetStore()
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
      <BaseButton class="app-shell__add" @click="sheet.openCreate()">
        {{ t('expenses.add') }}
      </BaseButton>
    </header>
    <AppNav class="app-shell__nav" />
    <main id="main" ref="main" class="app-shell__main" tabindex="-1">
      <slot />
    </main>
    <button type="button" class="fab" @click="sheet.openCreate()">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path
          d="M12 5v14M5 12h14"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>
      <span>{{ t('expenses.add') }}</span>
    </button>
    <ExpenseSheetHost />
    <ToastRegion />
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

.app-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

/* On mobile the floating button adds expenses; the header button takes over from 52rem. */
.app-shell__add {
  display: none;
}

.fab {
  position: fixed;
  z-index: 6;
  right: calc(var(--space-4) + env(safe-area-inset-right));
  bottom: calc(var(--tabbar-height) + var(--space-4) + env(safe-area-inset-bottom));
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 3.5rem;
  padding: 0 var(--space-5) 0 var(--space-4);
  border: 0;
  border-radius: 1.75rem;
  background: var(--color-accent);
  color: var(--color-on-accent);
  box-shadow: 0 0.5rem 1.25rem var(--color-scrim);
  font: inherit;
  font-weight: var(--weight-bold);
  cursor: pointer;
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

  .app-shell__add {
    display: inline-flex;
  }

  .fab {
    display: none;
  }

  .app-shell__header {
    flex-direction: column;
    align-items: stretch;
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
