<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ApiError } from '@/api/errors'
import type { Category, CategoryInput } from '@/api/types'
import BaseButton from '@/components/atoms/BaseButton.vue'
import SkeletonList from '@/components/atoms/SkeletonList.vue'
import ConfirmDialog from '@/components/molecules/ConfirmDialog.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import ErrorState from '@/components/molecules/ErrorState.vue'
import OfflineNotice from '@/components/molecules/OfflineNotice.vue'
import BottomSheet from '@/components/molecules/BottomSheet.vue'
import CategoryForm from '@/components/organisms/CategoryForm.vue'
import CategoryList from '@/components/organisms/CategoryList.vue'
import { useOnline } from '@/composables/useOnline'
import { useTranslate } from '@/composables/useTranslate'
import { visibleCategories } from '@/domain/categories'
import { useCategoriesStore } from '@/stores/categories'

interface SheetState {
  /** The category being edited, or null when creating one. */
  editing: Category | null
  draft: CategoryInput | null
  serverErrors: Record<string, string[]>
}

const t = useTranslate()
const store = useCategoriesStore()
const online = useOnline()

const showArchived = ref(false)
const sheet = ref<SheetState | null>(null)
const deleting = ref<Category | null>(null)

const visible = computed(() => visibleCategories(store.items, showArchived.value))
const loadMessage = computed(() => {
  const error: ApiError | null = store.error
  if (error === null) return ''
  return error.kind === 'network' ? t('errors.offline') : t('errors.loadFailed')
})

onMounted(() => store.load())

function openCreate(): void {
  sheet.value = { editing: null, draft: null, serverErrors: {} }
}

function openEdit(category: Category): void {
  const { name, color, icon } = category
  sheet.value = { editing: category, draft: { name, color, icon }, serverErrors: {} }
}

async function save(input: CategoryInput): Promise<void> {
  const current = sheet.value
  if (current === null) return
  sheet.value = null
  const result =
    current.editing === null
      ? await store.create(input)
      : await store.update(current.editing.id, input)
  // The change was rolled back; give the person their draft back with the server's reasons.
  if (!result.ok && result.error.status === 422) {
    sheet.value = { editing: current.editing, draft: input, serverErrors: result.error.fieldErrors }
  }
}

async function confirmDelete(): Promise<void> {
  const category = deleting.value
  deleting.value = null
  if (category !== null) await store.remove(category.id)
}
</script>

<template>
  <div class="page">
    <div class="page__header">
      <h1>{{ t('categories.title') }}</h1>
      <BaseButton data-add @click="openCreate">{{ t('categories.add') }}</BaseButton>
    </div>

    <OfflineNotice v-if="!online" />

    <label class="toggle">
      <input v-model="showArchived" type="checkbox" />
      <span>{{ t('categories.showArchived') }}</span>
    </label>

    <div v-if="store.status === 'idle' || store.status === 'loading'" aria-busy="true">
      <p class="visually-hidden" role="status">{{ t('app.loading') }}</p>
      <SkeletonList />
    </div>
    <ErrorState v-else-if="store.status === 'error'" :message="loadMessage" @retry="store.load()" />
    <EmptyState
      v-else-if="visible.length === 0"
      :title="t('categories.empty.title')"
      :description="t('categories.empty.description')"
    >
      <BaseButton @click="openCreate">{{ t('categories.add') }}</BaseButton>
    </EmptyState>
    <CategoryList
      v-else
      :categories="visible"
      @edit="openEdit"
      @archive="store.archive($event.id)"
      @unarchive="store.unarchive($event.id)"
      @delete="deleting = $event"
    />

    <BottomSheet
      v-if="sheet !== null"
      :title="
        t(sheet.editing === null ? 'categories.sheet.createTitle' : 'categories.sheet.editTitle')
      "
      @close="sheet = null"
    >
      <CategoryForm
        :initial="sheet.draft"
        :server-errors="sheet.serverErrors"
        @submit="save"
        @cancel="sheet = null"
      />
    </BottomSheet>

    <ConfirmDialog
      v-if="deleting !== null"
      :title="t('categories.confirmDelete.title')"
      :message="t('categories.confirmDelete.message', { name: deleting.name })"
      :confirm-label="t('categories.confirmDelete.confirm')"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-4);
}

.page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--target-min);
}

.toggle input {
  width: 1.5rem;
  height: 1.5rem;
  accent-color: var(--color-accent);
}
</style>
