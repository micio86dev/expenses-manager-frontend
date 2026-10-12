<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import { useTranslate } from '@/composables/useTranslate'
import type { ComparisonPoint, Granularity } from '@/domain/dashboard'
import '@/lib/chart'
import ChartFigure from '../molecules/ChartFigure.vue'

const props = defineProps<{
  points: readonly ComparisonPoint[]
  granularity: Granularity
  currency: string
}>()

const t = useTranslate()
const format = useFormatters()
const { colors, animate } = useChartTheme()

const bucketKeys = {
  day: 'dashboard.spend.bucket.day',
  week: 'dashboard.spend.bucket.week',
  month: 'dashboard.spend.bucket.month',
} as const

const money = (cents: number): string => format.money(cents, props.currency)
const orDash = (cents: number | null): string => (cents === null ? '—' : money(cents))

const labels = computed(() =>
  props.points.map((p) =>
    format.bucket(p.currentStart ?? p.previousStart ?? '', props.granularity),
  ),
)

const summary = computed(() =>
  t('dashboard.comparison.summary', {
    current: money(props.points.reduce((sum, p) => sum + (p.current ?? 0), 0)),
    previous: money(props.points.reduce((sum, p) => sum + (p.previous ?? 0), 0)),
  }),
)

const data = computed<ChartData<'line'>>(() => ({
  labels: labels.value,
  datasets: [
    {
      label: t('dashboard.comparison.current'),
      data: props.points.map((p) => p.current),
      borderColor: colors.value.accent,
      backgroundColor: colors.value.accent,
      pointStyle: 'circle',
      spanGaps: false,
    },
    {
      label: t('dashboard.comparison.previous'),
      data: props.points.map((p) => p.previous),
      borderColor: colors.value.muted,
      backgroundColor: colors.value.muted,
      borderDash: [6, 4],
      pointStyle: 'rectRot',
      spanGaps: false,
    },
  ],
}))

const options = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...(animate.value ? {} : { animation: false as const }),
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (item) => `${item.dataset.label ?? ''}: ${money(Number(item.parsed.y))}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: colors.value.muted, maxTicksLimit: 8 } },
    y: {
      beginAtZero: true,
      grid: { color: colors.value.rule },
      ticks: { color: colors.value.muted, callback: (value) => money(Number(value)) },
    },
  },
}))
</script>

<template>
  <div class="comparison">
    <ChartFigure :label="summary">
      <Line aria-hidden="true" :data="data" :options="options" />
    </ChartFigure>
    <ul class="comparison__legend" aria-hidden="true">
      <li class="comparison__key comparison__key--current">
        {{ t('dashboard.comparison.current') }}
      </li>
      <li class="comparison__key comparison__key--previous">
        {{ t('dashboard.comparison.previous') }}
      </li>
    </ul>
    <table class="visually-hidden">
      <caption>
        {{
          t('dashboard.comparison.title')
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">{{ t(bucketKeys[granularity]) }}</th>
          <th scope="col">{{ t('dashboard.comparison.current') }}</th>
          <th scope="col">{{ t('dashboard.comparison.previous') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(point, index) in points" :key="point.index">
          <th scope="row">{{ labels[index] }}</th>
          <td>{{ orDash(point.current) }}</td>
          <td>{{ orDash(point.previous) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.comparison {
  display: grid;
  gap: var(--space-3);
}

/* The legend repeats the line styles (solid and dashed), so colour is never the only signal. */
.comparison__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
}

.comparison__key {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.comparison__key::before {
  content: '';
  width: 1.75rem;
  border-top: 3px solid var(--color-accent);
}

.comparison__key--previous::before {
  border-top: 3px dashed var(--color-text-muted);
}
</style>
