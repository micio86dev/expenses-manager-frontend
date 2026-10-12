<script setup lang="ts">
import { useTranslate } from '@/composables/useTranslate'
import type { MessageKey } from '@/i18n/keys'
import AppIcon from '../atoms/AppIcon.vue'

const t = useTranslate()

const items: {
  name: string
  labelKey: MessageKey
  icon: 'dashboard' | 'expenses' | 'categories' | 'settings'
}[] = [
  { name: 'dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { name: 'expenses', labelKey: 'nav.expenses', icon: 'expenses' },
  { name: 'categories', labelKey: 'nav.categories', icon: 'categories' },
  { name: 'settings', labelKey: 'nav.settings', icon: 'settings' },
]
</script>

<template>
  <nav class="app-nav" :aria-label="t('nav.label')">
    <ul>
      <li v-for="item in items" :key="item.name">
        <RouterLink :to="{ name: item.name }">
          <AppIcon :name="item.icon" />
          <span>{{ t(item.labelKey) }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
ul {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  flex: 1;
}

a {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: var(--tabbar-height);
  padding: var(--space-1) var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-decoration: none;
}

/* The current page is shown by weight and a bar as well as by colour. */
a[aria-current='page'] {
  color: var(--color-accent);
  font-weight: var(--weight-bold);
}

a[aria-current='page']::before {
  content: '';
  position: absolute;
  inset: 0 var(--space-3) auto;
  height: 3px;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: currentcolor;
}

@media (min-width: 52rem) {
  ul {
    flex-direction: column;
    gap: var(--space-1);
  }

  a {
    flex-direction: row;
    justify-content: flex-start;
    gap: var(--space-3);
    min-height: var(--target-min);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-md);
  }

  a[aria-current='page']::before {
    inset: var(--space-2) auto var(--space-2) 0;
    width: 3px;
    height: auto;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
}
</style>
