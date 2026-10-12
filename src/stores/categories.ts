import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { categoriesApi } from '@/api'
import { ApiError } from '@/api/errors'
import type { Category, CategoryInput } from '@/api/types'
import { UNCONFIRMED_AT, runOptimistic, tempId } from '@/domain/optimistic'
import { translate } from '@/i18n'
import type { MessageKey } from '@/i18n/keys'
import { type MutationResult, reportFailure, settle } from './mutation'
import { useNoticesStore } from './notices'

const byName = (a: Category, b: Category): number => a.name.localeCompare(b.name)

export const useCategoriesStore = defineStore('categories', () => {
  const items = ref<Category[]>([])
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref<ApiError | null>(null)

  const byId = computed(() => new Map(items.value.map((category) => [category.id, category])))
  const active = computed(() => items.value.filter((category) => !category.archived))

  /** Fetches every category; a refresh keeps the current list on screen. */
  async function load(): Promise<void> {
    if (status.value !== 'ready') status.value = 'loading'
    try {
      items.value = (await categoriesApi.list()).sort(byName)
      error.value = null
      status.value = 'ready'
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught
      error.value = caught
      status.value = 'error'
    }
  }

  function replace(id: string, next: Category): void {
    items.value = items.value.map((category) => (category.id === id ? next : category)).sort(byName)
  }

  /** Optimistically replaces one category, undoing it if the request fails. */
  function mutate(
    id: string,
    change: (current: Category) => Category,
    request: () => Promise<Category>,
    failureKey: MessageKey,
  ): Promise<MutationResult<Category>> {
    const previous = byId.value.get(id)
    return settle(
      () =>
        runOptimistic({
          apply: () => {
            if (previous !== undefined) replace(id, change(previous))
          },
          rollback: () => {
            if (previous !== undefined) replace(id, previous)
          },
          request,
          commit: (saved) => {
            if (previous !== undefined) replace(id, saved)
          },
        }),
      (failure) => {
        reportFailure(failureKey, failure)
      },
    )
  }

  function create(input: CategoryInput): Promise<MutationResult<Category>> {
    const id = tempId()
    return settle(
      () =>
        runOptimistic({
          apply: () => {
            items.value = [
              ...items.value,
              { id, ...input, isSystem: false, archived: false, createdAt: UNCONFIRMED_AT },
            ].sort(byName)
          },
          rollback: () => {
            items.value = items.value.filter((category) => category.id !== id)
          },
          request: () => categoriesApi.create(input),
          commit: (saved) => {
            replace(id, saved)
          },
        }),
      (failure) => {
        reportFailure('categories.notices.createFailed', failure)
      },
    )
  }

  const update = (id: string, input: CategoryInput) =>
    mutate(
      id,
      (current) => ({ ...current, ...input }),
      () => categoriesApi.update(id, input),
      'categories.notices.updateFailed',
    )

  const archive = (id: string) =>
    mutate(
      id,
      (current) => ({ ...current, archived: true }),
      () => categoriesApi.archive(id),
      'categories.notices.archiveFailed',
    )

  const unarchive = (id: string) =>
    mutate(
      id,
      (current) => ({ ...current, archived: false }),
      () => categoriesApi.unarchive(id),
      'categories.notices.unarchiveFailed',
    )

  function remove(id: string): Promise<MutationResult<void>> {
    const previous = byId.value.get(id)
    return settle(
      () =>
        runOptimistic({
          apply: () => {
            items.value = items.value.filter((category) => category.id !== id)
          },
          rollback: () => {
            if (previous !== undefined) items.value = [...items.value, previous].sort(byName)
          },
          request: () => categoriesApi.remove(id),
        }),
      (failure) => {
        // 409: the category is used by expenses, so the useful advice is to archive it.
        if (failure.status === 409) {
          useNoticesStore().push('error', translate('categories.notices.deleteInUse'))
        } else {
          reportFailure('categories.notices.deleteFailed', failure)
        }
      },
    )
  }

  return { items, status, error, byId, active, load, create, update, archive, unarchive, remove }
})
