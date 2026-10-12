<script setup lang="ts">
import type { CategoryIcon } from '@/api/types'

const ICONS: Record<CategoryIcon, readonly string[]> = {
  cart: ['M3 4h2l2.4 11h10.2L20 7H6', 'M9 20h.01', 'M17 20h.01'],
  home: ['M4 11l8-7 8 7', 'M6 10v10h12V10'],
  car: ['M5 16v-4l2-5h10l2 5v4', 'M3 16h18', 'M7 19h.01', 'M17 19h.01'],
  bolt: ['M13 3L5 13h6l-1 8 8-10h-6z'],
  heart: ['M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'],
  plane: ['M3 12l18-8-6 16-3-7z'],
  coffee: [
    'M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z',
    'M16 10h2a2 2 0 0 1 0 4h-2',
    'M8 3v2',
    'M12 3v2',
  ],
  gift: ['M4 9h16v4H4z', 'M5 13v7h14v-7', 'M12 9v11', 'M12 9c-2-4-6-3-4 0', 'M12 9c2-4 6-3 4 0'],
  book: ['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11'],
  briefcase: ['M4 8h16v11H4z', 'M9 8V5h6v3', 'M4 13h16'],
  tag: ['M3 12V4h8l10 10-8 8z', 'M7.5 8.5h.01'],
  other: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
}

defineProps<{ name: CategoryIcon }>()
</script>

<template>
  <svg
    class="category-icon"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="d in ICONS[name]" :key="d" :d="d" />
  </svg>
</template>

<style scoped>
.category-icon {
  flex: none;
}
</style>
