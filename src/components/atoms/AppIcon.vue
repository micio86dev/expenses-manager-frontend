<script setup lang="ts">
const ICONS = {
  dashboard: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'],
  expenses: ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 8h6', 'M9 12h6'],
  categories: ['M3 12V4h8l10 10-8 8z', 'M7.5 8.5h.01'],
  settings: ['M4 7h10', 'M18 7h2', 'M4 17h2', 'M10 17h10', 'M16 5v4', 'M8 15v4'],
} as const

defineProps<{ name: keyof typeof ICONS }>()

defineExpose({ ICONS })
</script>

<template>
  <svg
    class="app-icon"
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
.app-icon {
  flex: none;
}
</style>
