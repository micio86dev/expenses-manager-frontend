<script setup lang="ts">
import { useTranslate } from '@/composables/useTranslate'
import BaseButton from '../atoms/BaseButton.vue'
import ErrorAlert from './ErrorAlert.vue'

defineProps<{ message: string }>()
const emit = defineEmits<{ retry: [] }>()

const t = useTranslate()
</script>

<template>
  <div class="error-state">
    <ErrorAlert :message="message" />
    <BaseButton variant="secondary" @click="emit('retry')">{{ t('common.retry') }}</BaseButton>
  </div>
</template>

<style scoped>
.error-state {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
  max-width: 36rem;
}
</style>
