<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div class="error-alert" role="alert">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M12 3 2 20h20zM12 10v4m0 3h.01"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.error-alert {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-danger);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-weight: var(--weight-medium);
}

.error-alert svg {
  flex: none;
  margin-top: 0.15rem;
}
</style>
