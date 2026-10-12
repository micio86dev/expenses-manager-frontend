<script setup lang="ts">
import EmptyState from '@/components/molecules/EmptyState.vue'
import { useTranslate } from '@/composables/useTranslate'

const t = useTranslate()
</script>

<template>
  <div class="page">
    <h1>{{ t('categories.title') }}</h1>
    <EmptyState
      :title="t('categories.empty.title')"
      :description="t('categories.empty.description')"
    />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-5);
}
</style>
