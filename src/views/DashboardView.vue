<script setup lang="ts">
import EmptyState from '@/components/molecules/EmptyState.vue'
import { useTranslate } from '@/composables/useTranslate'

const t = useTranslate()
</script>

<template>
  <div class="page">
    <h1>{{ t('dashboard.title') }}</h1>
    <EmptyState
      :title="t('dashboard.empty.title')"
      :description="t('dashboard.empty.description')"
    />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-5);
}
</style>
