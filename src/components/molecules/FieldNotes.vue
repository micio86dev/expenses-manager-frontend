<script setup lang="ts">
defineProps<{
  hint?: string | undefined
  hintId: string
  errorId: string
  errors: string[]
}>()
</script>

<template>
  <p v-if="hint !== undefined" :id="hintId" class="field-notes__hint" data-hint>{{ hint }}</p>
  <p v-if="errors.length > 0" :id="errorId" class="field-notes__error" data-error>
    <span v-for="message in errors" :key="message">{{ message }}</span>
  </p>
</template>

<style scoped>
.field-notes__hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.field-notes__error {
  display: grid;
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
</style>
