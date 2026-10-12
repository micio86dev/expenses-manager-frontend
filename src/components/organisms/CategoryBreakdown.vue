<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import { useTranslate } from '@/composables/useTranslate'
import type { RankedCategory } from '@/domain/dashboard'
import '@/lib/chart'
import ChartFigure from '../molecules/ChartFigure.vue'

export interface CategorySlice extends RankedCategory {
  color: string
}

const props = defineProps<{ items: readonly CategorySlice[]; currency: string }>()

const t = useTranslate()
const format = useFormatters()
const { colors, animate } = useChartTheme()

const money = (cents: number): string => format.money(cents, props.currency)

const summary = computed(() => {
  const [largest] = props.items
  if (largest === undefined) return t('dashboard.categories.summaryNone')
  return t('dashboard.categories.summary', {
    name: largest.name,
    percent: largest.percent,
    total: money(props.items.reduce((sum, item) => sum + item.totalCents, 0)),
  })
})

const data = computed<ChartData<'doughnut'>>(() => ({
  labels: props.items.map((item) => item.name),
  datasets: [
    {
      data: props.items.map((item) => item.totalCents),
      backgroundColor: props.items.map((item) => item.color),
      borderColor: colors.value.surface,
      borderWidth: 2,
    },
  ],
}))

const options = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  ...(animate.value ? {} : { animation: false as const }),
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (item) => `${item.label}: ${money(item.parsed)}` },
    },
  },
}))
</script>

<template>
  <div class="breakdown">
    <ChartFigure :label="summary">
      <Doughnut :data="data" :options="options" />
    </ChartFigure>
    <ol class="ranking" :aria-label="t('dashboard.categories.listLabel')">
      <li v-for="item in items" :key="item.categoryId" class="ranking__row">
        <span class="ranking__swatch" :style="{ background: item.color }" aria-hidden="true" />
        <span class="ranking__name">{{ item.name }}</span>
        <span class="ranking__amount amount">{{ money(item.totalCents) }}</span>
        <span class="ranking__share amount">{{ format.percent(item.percent) }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.breakdown {
  display: grid;
  gap: var(--space-4);
}

.ranking {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ranking__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto 3.5rem;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-top: 2px solid var(--color-rule);
}

.ranking__swatch {
  width: 1rem;
  height: 1rem;
  border-radius: var(--radius-sm);
}

.ranking__name {
  overflow-wrap: anywhere;
  font-weight: var(--weight-medium);
}

.ranking__share {
  text-align: right;
  font-weight: var(--weight-bold);
}
</style>
