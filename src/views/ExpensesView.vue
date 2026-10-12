<script setup lang="ts">
import EmptyState from '@/components/molecules/EmptyState.vue'
import { useTranslate } from '@/composables/useTranslate'

const t = useTranslate()
</script>

<template>
  <div class="page">
    <h1>{{ t('expenses.title') }}</h1>
    <EmptyState :title="t('expenses.empty.title')" :description="t('expenses.empty.description')" />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-5);
}
</style>
