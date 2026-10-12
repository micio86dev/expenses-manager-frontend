<script setup lang="ts">
import { computed, useId } from 'vue'
import { useTranslate } from '@/composables/useTranslate'
import ErrorState from './ErrorState.vue'

const props = defineProps<{
  title: string
  status: 'idle' | 'loading' | 'ready' | 'error'
  errorMessage?: string | undefined
}>()
const emit = defineEmits<{ retry: [] }>()

const t = useTranslate()
const headingId = useId()
const busy = computed(() => props.status === 'idle' || props.status === 'loading')
</script>

<template>
  <section class="card" :aria-labelledby="headingId" :aria-busy="busy ? 'true' : undefined">
    <h2 :id="headingId">{{ title }}</h2>
    <slot v-if="status === 'ready'" />
    <ErrorState
      v-else-if="status === 'error'"
      :message="errorMessage ?? ''"
      @retry="emit('retry')"
    />
    <div v-else class="card__skeleton" data-skeleton aria-hidden="true">
      <span class="card__bar card__bar--tall" />
      <span class="card__bar" />
      <span class="card__bar card__bar--short" />
    </div>
    <p v-if="busy" class="visually-hidden" role="status">{{ t('app.loading') }}</p>
  </section>
</template>

<style scoped>
.card {
  display: grid;
  align-content: start;
  gap: var(--space-4);
  min-width: 0;
  padding-top: var(--space-3);
  border-top: 3px solid var(--color-text);
}

.card__skeleton {
  display: grid;
  gap: var(--space-3);
}

.card__bar {
  display: block;
  height: 1rem;
  border-radius: var(--radius-sm);
  background: var(--color-rule);
  animation: card-pulse 1.4s ease-in-out infinite;
}

.card__bar--tall {
  height: 10rem;
}

.card__bar--short {
  width: 40%;
}

@keyframes card-pulse {
  50% {
    opacity: 0.45;
  }
}
</style>
