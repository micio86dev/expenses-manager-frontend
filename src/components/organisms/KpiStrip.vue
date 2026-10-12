<script setup lang="ts">
import { computed } from 'vue'
import { useFormatters } from '@/composables/useFormatters'
import { useTranslate } from '@/composables/useTranslate'
import type { KpiView } from '@/domain/dashboard'
import type { MessageKey } from '@/i18n/keys'
import ErrorState from '../molecules/ErrorState.vue'

const props = defineProps<{
  kpi: KpiView | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  errorMessage?: string | undefined
}>()
const emit = defineEmits<{ retry: [] }>()

const t = useTranslate()
const format = useFormatters()

const deltaKeys = {
  up: 'dashboard.kpi.deltaUp',
  down: 'dashboard.kpi.deltaDown',
  flat: 'dashboard.kpi.deltaFlat',
  none: 'dashboard.kpi.deltaNone',
} as const satisfies Record<string, MessageKey>

const delta = computed(() => {
  const value = props.kpi?.delta
  if (value === undefined) return null
  const percent = value.direction === 'none' ? 0 : value.percent
  return { tone: value.direction, text: t(deltaKeys[value.direction], { percent }) }
})

const busy = computed(() => props.status === 'idle' || props.status === 'loading')
const ready = computed(() => props.status === 'ready' && props.kpi !== null)
</script>

<template>
  <section class="kpi" aria-labelledby="kpi-heading" :aria-busy="busy ? 'true' : undefined">
    <h2 id="kpi-heading" class="visually-hidden">{{ t('dashboard.kpi.label') }}</h2>
    <dl v-if="ready && kpi !== null && delta !== null" class="kpi__list">
      <div class="kpi__tile kpi__tile--total">
        <dt>{{ t('dashboard.kpi.total') }}</dt>
        <dd class="kpi__value amount">{{ format.money(kpi.totalCents, kpi.currency) }}</dd>
      </div>
      <div class="kpi__tile">
        <dt>{{ t('dashboard.kpi.delta') }}</dt>
        <dd class="kpi__delta" :data-delta="delta.tone">
          <svg
            v-if="delta.tone === 'up' || delta.tone === 'down'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            focusable="false"
          >
            <path
              :d="delta.tone === 'up' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ delta.text }}</span>
        </dd>
      </div>
      <div class="kpi__tile">
        <dt>{{ t('dashboard.kpi.average') }}</dt>
        <dd>
          <span class="kpi__value amount">{{
            format.money(kpi.dailyAverageCents, kpi.currency)
          }}</span>
          <span class="kpi__hint">{{ t('dashboard.kpi.averageOver', { days: kpi.days }) }}</span>
        </dd>
      </div>
      <div class="kpi__tile">
        <dt>{{ t('dashboard.kpi.count') }}</dt>
        <dd class="kpi__value amount">{{ kpi.count }}</dd>
      </div>
    </dl>
    <ErrorState
      v-else-if="status === 'error'"
      :message="errorMessage ?? ''"
      @retry="emit('retry')"
    />
    <div v-else class="kpi__list" aria-hidden="true">
      <span v-for="n in 4" :key="n" class="kpi__tile kpi__tile--skeleton" data-skeleton />
    </div>
    <p v-if="busy" class="visually-hidden" role="status">{{ t('app.loading') }}</p>
  </section>
</template>

<style scoped>
.kpi__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-4) var(--space-5);
  margin: 0;
}

.kpi__tile {
  display: grid;
  align-content: start;
  gap: var(--space-1);
  min-width: 0;
  padding-top: var(--space-3);
  border-top: 2px solid var(--color-rule);
}

.kpi__tile--total {
  grid-column: 1 / -1;
  border-top-color: var(--color-text);
}

.kpi__tile--skeleton {
  height: 4rem;
  background: var(--color-rule);
  border-radius: var(--radius-sm);
  animation: kpi-pulse 1.4s ease-in-out infinite;
}

dt {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

dd {
  display: grid;
  gap: var(--space-1);
  margin: 0;
}

.kpi__value {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.kpi__tile--total .kpi__value {
  font-size: var(--text-amount);
  line-height: var(--leading-tight);
}

.kpi__hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

/* The arrow and the words carry the meaning; the colour only reinforces it. */
.kpi__delta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: var(--weight-bold);
}

.kpi__delta[data-delta='up'] {
  color: var(--color-danger);
}

.kpi__delta[data-delta='down'] {
  color: var(--color-accent);
}

@keyframes kpi-pulse {
  50% {
    opacity: 0.45;
  }
}
</style>
