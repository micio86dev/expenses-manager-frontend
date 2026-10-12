<script setup lang="ts">
import type { CategoryIcon as IconName } from '@/api/types'
import CategoryIcon from '../atoms/CategoryIcon.vue'

defineProps<{ name: string; color: string; icon: IconName }>()
</script>

<template>
  <span class="category-badge">
    <span class="category-badge__chip" :style="{ background: color }">
      <CategoryIcon :name="icon" />
    </span>
    <span class="category-badge__name">{{ name }}</span>
  </span>
</template>

<style scoped>
.category-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

/* The chip always carries an icon, so the colour is never the only signal. */
.category-badge__chip {
  display: grid;
  flex: none;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  color: var(--color-on-category);
}

.category-badge__name {
  overflow-wrap: anywhere;
  font-weight: var(--weight-medium);
}
</style>
