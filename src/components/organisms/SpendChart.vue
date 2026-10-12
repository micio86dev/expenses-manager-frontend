<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import { useTranslate } from '@/composables/useTranslate'
import { type Granularity, peakPoint, type SeriesPoint } from '@/domain/dashboard'
import '@/lib/chart'
import ChartFigure from '../molecules/ChartFigure.vue'

const props = defineProps<{
  points: readonly SeriesPoint[]
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

const labels = computed(() => props.points.map((p) => format.bucket(p.start, props.granularity)))
const money = (cents: number): string => format.money(cents, props.currency)

const summary = computed(() => {
  const peak = peakPoint(props.points)
  if (peak === null) return t('dashboard.spend.summaryNone')
  return t('dashboard.spend.summary', {
    total: money(props.points.reduce((sum, p) => sum + p.totalCents, 0)),
    peak: money(peak.totalCents),
    date: format.bucket(peak.start, props.granularity),
  })
})

const data = computed<ChartData<'bar'>>(() => ({
  labels: labels.value,
  datasets: [
    {
      data: props.points.map((p) => p.totalCents),
      backgroundColor: colors.value.accent,
      borderRadius: 3,
    },
  ],
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...(animate.value ? {} : { animation: false as const }),
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (item) => money(Number(item.parsed.y)) } },
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
  <div>
    <ChartFigure :label="summary">
      <Bar aria-hidden="true" :data="data" :options="options" />
    </ChartFigure>
    <table class="visually-hidden">
      <caption>
        {{
          t('dashboard.spend.title')
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">{{ t(bucketKeys[granularity]) }}</th>
          <th scope="col">{{ t('dashboard.spend.amount') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(point, index) in points" :key="point.start">
          <th scope="row">{{ labels[index] }}</th>
          <td>{{ money(point.totalCents) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
