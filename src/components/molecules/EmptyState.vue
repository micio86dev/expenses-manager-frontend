<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>

<template>
  <div class="empty-state">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: grid;
  justify-items: start;
  gap: var(--space-2);
  padding: var(--space-6) 0;
  border-top: 2px solid var(--color-rule);
  max-width: 36rem;
}

.empty-state p {
  color: var(--color-text-muted);
}
</style>
