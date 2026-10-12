<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <ul class="skeleton" aria-hidden="true">
    <li v-for="row in rows" :key="row" class="skeleton__row">
      <span class="skeleton__bar skeleton__bar--wide" />
      <span class="skeleton__bar skeleton__bar--short" />
    </li>
  </ul>
</template>

<style scoped>
.skeleton {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.skeleton__row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-top: 2px solid var(--color-rule);
}

.skeleton__bar {
  display: block;
  height: 1rem;
  border-radius: var(--radius-sm);
  background: var(--color-rule);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton__bar--wide {
  width: 55%;
}

.skeleton__bar--short {
  width: 18%;
}

@keyframes skeleton-pulse {
  50% {
    opacity: 0.45;
  }
}
</style>
