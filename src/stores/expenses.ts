import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { expensesApi } from '@/api'
import { ApiError } from '@/api/errors'
import type { Expense, ExpenseInput } from '@/api/types'
import { type ExpenseFilters, matchesFilters } from '@/domain/expense-filters'
import { groupByDay, sortExpenses } from '@/domain/expenses'
import { UNCONFIRMED_AT, isTempId, runOptimistic, tempId } from '@/domain/optimistic'
import { type MutationResult, reportFailure, settle } from './mutation'

const PER_PAGE = 50

function toExpense(id: string, input: ExpenseInput, createdAt: string): Expense {
  return {
    id,
    description: input.description,
    amountCents: input.amountCents,
    currency: input.currency,
    categoryId: input.categoryId,
    spentOn: input.spentOn,
    createdAt,
    updatedAt: createdAt,
  }
}

export const useExpensesStore = defineStore('expenses', () => {
  const items = ref<Expense[]>([])
  const total = ref(0)
  const page = ref(1)
  const lastPage = ref(1)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref<ApiError | null>(null)
  const loadingMore = ref(false)
  // Counts the changes the server confirmed, so screens showing figures derived from the
  // expenses (the dashboard) know when to refresh.
  const revision = ref(0)
  const filters = ref<ExpenseFilters | null>(null)
  // Bumped by every load so an answer for outdated filters is ignored when it finally arrives.
  let generation = 0
  let controller: AbortController | null = null

  const groups = computed(() => groupByDay(items.value))
  const hasMore = computed(() => page.value < lastPage.value)
  const isEmpty = computed(() => status.value === 'ready' && items.value.length === 0)

  function isPending(id: string): boolean {
    return isTempId(id)
  }

  function request(active: ExpenseFilters, pageNumber: number, signal: AbortSignal) {
    return expensesApi.list(
      {
        from: active.period.from,
        to: active.period.to,
        ...(active.categoryId === null ? {} : { categoryId: active.categoryId }),
        ...(active.q === '' ? {} : { q: active.q }),
        page: pageNumber,
        perPage: PER_PAGE,
      },
      signal,
    )
  }

  async function load(next: ExpenseFilters): Promise<void> {
    controller?.abort()
    controller = new AbortController()
    generation += 1
    const mine = generation
    filters.value = next
    status.value = 'loading'
    error.value = null
    loadingMore.value = false
    try {
      const result = await request(next, 1, controller.signal)
      if (mine !== generation) return
      items.value = sortExpenses(result.data)
      total.value = result.meta.total
      page.value = result.meta.currentPage
      lastPage.value = result.meta.lastPage
      status.value = 'ready'
    } catch (caught) {
      if (mine !== generation) return
      if (!(caught instanceof ApiError)) throw caught
      error.value = caught
      status.value = 'error'
    }
  }

  async function reload(): Promise<void> {
    if (filters.value !== null) await load(filters.value)
  }

  async function loadMore(): Promise<void> {
    if (filters.value === null || !hasMore.value || loadingMore.value) return
    const mine = generation
    loadingMore.value = true
    try {
      const signal = controller?.signal ?? new AbortController().signal
      const result = await request(filters.value, page.value + 1, signal)
      if (mine !== generation) return
      const known = new Set(items.value.map((expense) => expense.id))
      items.value = sortExpenses([
        ...items.value,
        ...result.data.filter((expense) => !known.has(expense.id)),
      ])
      total.value = result.meta.total
      page.value = result.meta.currentPage
      lastPage.value = result.meta.lastPage
    } catch (caught) {
      if (mine !== generation) return
      if (!(caught instanceof ApiError)) throw caught
      reportFailure('expenses.notices.loadMoreFailed', caught)
    } finally {
      if (mine === generation) loadingMore.value = false
    }
  }

  const isVisible = (expense: Expense): boolean =>
    filters.value !== null && matchesFilters(expense, filters.value)

  function without(id: string): Expense[] {
    return items.value.filter((expense) => expense.id !== id)
  }

  function create(input: ExpenseInput): Promise<MutationResult<Expense>> {
    const id = tempId()
    const draft = toExpense(id, input, UNCONFIRMED_AT)
    const visible = isVisible(draft)
    return settle(
      () =>
        runOptimistic({
          apply: () => {
            if (!visible) return
            items.value = sortExpenses([...items.value, draft])
            total.value += 1
          },
          rollback: () => {
            if (!visible) return
            items.value = without(id)
            total.value -= 1
          },
          request: () => expensesApi.create(input),
          commit: (saved) => {
            if (visible) items.value = sortExpenses([...without(id), saved])
          },
        }),
      (failure) => {
        reportFailure('expenses.notices.createFailed', failure)
      },
    )
  }

  function update(id: string, input: ExpenseInput): Promise<MutationResult<Expense>> {
    const previous = items.value.find((expense) => expense.id === id)
    const next = toExpense(id, input, previous?.createdAt ?? UNCONFIRMED_AT)
    const wasListed = previous !== undefined
    const willShow = isVisible(next)
    const delta = Number(willShow) - Number(wasListed)
    return settle(
      () =>
        runOptimistic({
          apply: () => {
            items.value = sortExpenses([...without(id), ...(willShow ? [next] : [])])
            total.value += delta
          },
          rollback: () => {
            items.value = sortExpenses([
              ...without(id),
              ...(previous === undefined ? [] : [previous]),
            ])
            total.value -= delta
          },
          request: () => expensesApi.update(id, input),
          commit: (saved) => {
            if (willShow) items.value = sortExpenses([...without(id), saved])
          },
        }),
      (failure) => {
        reportFailure('expenses.notices.updateFailed', failure)
      },
    )
  }

  function remove(id: string): Promise<MutationResult<void>> {
    const previous = items.value.find((expense) => expense.id === id)
    return settle(
      () =>
        runOptimistic({
          apply: () => {
            if (previous === undefined) return
            items.value = without(id)
            total.value -= 1
          },
          rollback: () => {
            if (previous === undefined) return
            items.value = sortExpenses([...items.value, previous])
            total.value += 1
          },
          request: () => expensesApi.remove(id),
        }),
      (failure) => {
        reportFailure('expenses.notices.deleteFailed', failure)
      },
    )
  }

  /** Wraps a mutation so that a confirmed change bumps `revision`. */
  function confirmed<Args extends unknown[], T>(
    mutate: (...args: Args) => Promise<MutationResult<T>>,
  ): (...args: Args) => Promise<MutationResult<T>> {
    return async (...args) => {
      const result = await mutate(...args)
      if (result.ok) revision.value += 1
      return result
    }
  }

  return {
    items,
    revision,
    total,
    status,
    error,
    loadingMore,
    groups,
    hasMore,
    isEmpty,
    isPending,
    load,
    reload,
    loadMore,
    create: confirmed(create),
    update: confirmed(update),
    remove: confirmed(remove),
  }
})
