<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', loading: false, disabled: false },
)
</script>

<template>
  <button
    :class="['base-button', `base-button--${variant}`, { 'base-button--loading': loading }]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--target-min);
  min-width: var(--target-min);
  padding: var(--space-2) var(--space-5);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-out),
    opacity var(--motion-fast) var(--ease-out);
}

.base-button--primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.base-button--secondary {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text);
}

.base-button--danger {
  background: var(--color-danger);
  color: var(--color-on-danger);
}

.base-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Loading is announced by aria-busy and shown by the ring, not by colour alone. */
.base-button--loading::after {
  content: '';
  width: 1em;
  height: 1em;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: base-button-spin 0.8s linear infinite;
}

@keyframes base-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
