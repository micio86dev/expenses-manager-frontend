<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import DashboardCard from '@/components/molecules/DashboardCard.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import ErrorState from '@/components/molecules/ErrorState.vue'
import OfflineNotice from '@/components/molecules/OfflineNotice.vue'
import CategoryBreakdown from '@/components/organisms/CategoryBreakdown.vue'
import DashboardPeriodControls from '@/components/organisms/DashboardPeriodControls.vue'
import KpiStrip from '@/components/organisms/KpiStrip.vue'
import PeriodComparison from '@/components/organisms/PeriodComparison.vue'
import SpendChart from '@/components/organisms/SpendChart.vue'
import TopExpenses from '@/components/organisms/TopExpenses.vue'
import { useDashboardPeriod } from '@/composables/useDashboardPeriod'
import { useOnline } from '@/composables/useOnline'
import { useTranslate } from '@/composables/useTranslate'
import { categoryColor } from '@/domain/dashboard'
import { today } from '@/lib/dates'
import { useCategoriesStore } from '@/stores/categories'
import { type CardState, useDashboardStore } from '@/stores/dashboard'
import { useExpenseSheetStore } from '@/stores/expenseSheet'
import { useExpensesStore } from '@/stores/expenses'

const t = useTranslate()
const online = useOnline()
const urlPeriod = useDashboardPeriod()
const { period, currency, canGoNext } = urlPeriod
const dashboard = useDashboardStore()
const categories = useCategoriesStore()
const expenses = useExpensesStore()
const sheet = useExpenseSheetStore()

// Keyed by the range and the currency, so rewriting the URL to its canonical form does not
// trigger a second request.
const requestKey = computed(() => `${period.value.from}|${period.value.to}|${currency.value}`)
watch(
  requestKey,
  () => {
    void dashboard.load(period.value, currency.value)
  },
  { immediate: true },
)

// An expense was added, edited or deleted: the figures changed.
watch(
  () => expenses.revision,
  () => {
    void dashboard.retry()
  },
)

onMounted(async () => {
  await urlPeriod.ensureCanonicalUrl()
  await categories.load()
})

const slices = computed(() =>
  dashboard.categories.map((item, index) => ({
    ...item,
    color: categoryColor(categories.byId.get(item.categoryId)?.color, index),
  })),
)

const messageFor = (card: CardState): string =>
  card.error?.kind === 'network' ? t('errors.offline') : t('errors.loadFailed')
</script>

<template>
  <div class="page">
    <h1>{{ t('dashboard.title') }}</h1>

    <OfflineNotice v-if="!online" />

    <DashboardPeriodControls
      :period="period"
      :currency="currency"
      :can-go-next="canGoNext"
      :today="today()"
      @select="urlPeriod.select"
      @shift="urlPeriod.shift"
      @apply-custom="urlPeriod.applyCustom"
      @update:currency="urlPeriod.setCurrency"
    />

    <ErrorState
      v-if="dashboard.status === 'error'"
      :message="messageFor(dashboard.cards.kpi)"
      @retry="dashboard.retry()"
    />
    <EmptyState
      v-else-if="dashboard.isEmpty"
      :title="t('dashboard.empty.title')"
      :description="t('dashboard.empty.description')"
    >
      <BaseButton @click="sheet.openCreate()">{{ t('expenses.add') }}</BaseButton>
    </EmptyState>
    <template v-else>
      <KpiStrip
        :kpi="dashboard.kpi"
        :status="dashboard.cards.kpi.status"
        :error-message="messageFor(dashboard.cards.kpi)"
        @retry="dashboard.retry()"
      />
      <div class="cards">
        <DashboardCard
          class="cards__wide"
          :title="t('dashboard.spend.title')"
          :status="dashboard.cards.spend.status"
          :error-message="messageFor(dashboard.cards.spend)"
          @retry="dashboard.retry()"
        >
          <SpendChart
            :points="dashboard.bars"
            :granularity="dashboard.granularity"
            :currency="dashboard.currency"
          />
        </DashboardCard>
        <DashboardCard
          :title="t('dashboard.categories.title')"
          :status="dashboard.cards.categories.status"
          :error-message="messageFor(dashboard.cards.categories)"
          @retry="dashboard.retry()"
        >
          <CategoryBreakdown :items="slices" :currency="dashboard.currency" />
        </DashboardCard>
        <DashboardCard
          :title="t('dashboard.comparison.title')"
          :status="dashboard.cards.comparison.status"
          :error-message="messageFor(dashboard.cards.comparison)"
          @retry="dashboard.retry()"
        >
          <PeriodComparison
            :points="dashboard.comparison"
            :granularity="dashboard.granularity"
            :currency="dashboard.currency"
          />
        </DashboardCard>
        <DashboardCard
          :title="t('dashboard.top.title')"
          :status="dashboard.cards.top.status"
          :error-message="messageFor(dashboard.cards.top)"
          @retry="dashboard.retry()"
        >
          <TopExpenses :expenses="dashboard.top" :categories="categories.byId" />
        </DashboardCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-5);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: var(--space-6) var(--space-5);
}

.cards__wide {
  grid-column: 1 / -1;
}
</style>
