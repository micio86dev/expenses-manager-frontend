<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import SkeletonList from '@/components/atoms/SkeletonList.vue'
import BottomSheet from '@/components/molecules/BottomSheet.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import ErrorState from '@/components/molecules/ErrorState.vue'
import OfflineNotice from '@/components/molecules/OfflineNotice.vue'
import PeriodNav from '@/components/molecules/PeriodNav.vue'
import ExpenseFilterForm from '@/components/organisms/ExpenseFilterForm.vue'
import ExpenseList from '@/components/organisms/ExpenseList.vue'
import { useDebouncedValue } from '@/composables/useDebouncedValue'
import { type FilterChange, useExpenseFilters } from '@/composables/useExpenseFilters'
import { useExpenseGroups } from '@/composables/useExpenseGroups'
import { useFormatters } from '@/composables/useFormatters'
import { useOnline } from '@/composables/useOnline'
import { useTranslate } from '@/composables/useTranslate'
import { filtersToQuery } from '@/domain/expense-filters'
import { today } from '@/lib/dates'
import { useCategoriesStore } from '@/stores/categories'
import { useExpenseSheetStore } from '@/stores/expenseSheet'
import { useExpensesStore } from '@/stores/expenses'

const SEARCH_DELAY_MS = 275

const t = useTranslate()
const format = useFormatters()
const online = useOnline()
const urlFilters = useExpenseFilters()
const { filters, canGoNext } = urlFilters
const expenses = useExpensesStore()
const categories = useCategoriesStore()
const sheet = useExpenseSheetStore()

const filterSheetOpen = ref(false)
const searchId = useId()
const search = ref(filters.value.q)
const debouncedSearch = useDebouncedValue(search, SEARCH_DELAY_MS)

const groups = useExpenseGroups(computed(() => expenses.groups))

// The fetch is keyed by the serialized filters, so rewriting the URL to its canonical form (or
// any unrelated navigation) does not trigger a second request.
const filtersKey = computed(() => JSON.stringify(filtersToQuery(filters.value)))
watch(
  filtersKey,
  () => {
    void expenses.load(filters.value)
  },
  { immediate: true },
)

watch(debouncedSearch, (value) => {
  if (value.trim() !== filters.value.q) void urlFilters.setQuery(value.trim())
})
// Back/forward (or "clear filters") changes the URL: reflect it in the input.
watch(
  () => filters.value.q,
  (value) => {
    if (value !== search.value.trim()) search.value = value
  },
)

onMounted(async () => {
  await urlFilters.ensureCanonicalUrl()
  await categories.load()
})

const activeCategory = computed(() =>
  filters.value.categoryId === null ? undefined : categories.byId.get(filters.value.categoryId),
)
const hasFilters = computed(() => filters.value.categoryId !== null || filters.value.q !== '')
const loadMessage = computed(() =>
  expenses.error?.kind === 'network' ? t('errors.offline') : t('errors.loadFailed'),
)

async function apply(change: FilterChange): Promise<void> {
  if (await urlFilters.apply(change)) filterSheetOpen.value = false
}

function edit(id: string): void {
  const expense = expenses.items.find((item) => item.id === id)
  if (expense !== undefined) sheet.openEdit(expense)
}
</script>

<template>
  <div class="page">
    <h1>{{ t('expenses.title') }}</h1>

    <OfflineNotice v-if="!online" />

    <PeriodNav
      :label="format.period(filters.period)"
      :can-go-next="canGoNext"
      @previous="urlFilters.shift(-1)"
      @next="urlFilters.shift(1)"
    />

    <div class="toolbar">
      <div class="toolbar__search" role="search">
        <label class="visually-hidden" :for="searchId">{{ t('expenses.search.label') }}</label>
        <BaseInput
          :id="searchId"
          v-model="search"
          type="search"
          :placeholder="t('expenses.search.placeholder')"
        />
      </div>
      <BaseButton data-filters variant="secondary" @click="filterSheetOpen = true">
        {{ t('expenses.filters.open') }}
      </BaseButton>
    </div>

    <div v-if="activeCategory !== undefined" class="chips">
      <span class="chip" data-chip>
        {{ t('expenses.filters.activeCategory', { name: activeCategory.name }) }}
        <button
          type="button"
          class="chip__remove"
          :aria-label="t('expenses.filters.removeCategory', { name: activeCategory.name })"
          @click="urlFilters.setCategory(null)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </span>
    </div>

    <div v-if="expenses.status === 'idle' || expenses.status === 'loading'" aria-busy="true">
      <p class="visually-hidden" role="status">{{ t('app.loading') }}</p>
      <SkeletonList :rows="6" />
    </div>
    <ErrorState
      v-else-if="expenses.status === 'error'"
      :message="loadMessage"
      @retry="expenses.reload()"
    />
    <EmptyState
      v-else-if="expenses.isEmpty && hasFilters"
      :title="t('expenses.emptyFiltered.title')"
      :description="t('expenses.emptyFiltered.description')"
    >
      <BaseButton variant="secondary" @click="urlFilters.clearFilters()">
        {{ t('expenses.emptyFiltered.clear') }}
      </BaseButton>
    </EmptyState>
    <EmptyState
      v-else-if="expenses.isEmpty"
      :title="t('expenses.empty.title')"
      :description="t('expenses.empty.description')"
    >
      <BaseButton @click="sheet.openCreate()">{{ t('expenses.add') }}</BaseButton>
    </EmptyState>
    <template v-else>
      <ExpenseList :groups="groups" @select="edit" />
      <div class="more">
        <p class="more__count">
          {{ t('expenses.showing', { shown: expenses.items.length, total: expenses.total }) }}
        </p>
        <BaseButton
          v-if="expenses.hasMore"
          data-load-more
          variant="secondary"
          :loading="expenses.loadingMore"
          @click="expenses.loadMore()"
        >
          {{ t('expenses.loadMore') }}
        </BaseButton>
      </div>
    </template>

    <BottomSheet
      v-if="filterSheetOpen"
      :title="t('expenses.filters.title')"
      @close="filterSheetOpen = false"
    >
      <ExpenseFilterForm
        :period="filters.period"
        :category-id="filters.categoryId"
        :categories="categories.items"
        :today="today()"
        @apply="apply"
        @cancel="filterSheetOpen = false"
      />
    </BottomSheet>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-4);
}

.toolbar {
  display: flex;
  gap: var(--space-3);
}

.toolbar__search {
  flex: 1;
  min-width: 0;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--target-min);
  padding: 0 var(--space-1) 0 var(--space-3);
  border: 2px solid var(--color-text);
  border-radius: var(--radius-lg);
  font-weight: var(--weight-medium);
}

.chip__remove {
  display: grid;
  place-items: center;
  width: var(--target-min);
  height: calc(var(--target-min) - 4px);
  padding: 0;
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.more {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
}

.more__count {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
