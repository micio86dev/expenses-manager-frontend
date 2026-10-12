import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import type { ExpenseFilters } from '@/domain/expense-filters'
import { resolvePeriod } from '@/domain/period'
import { setLocale } from '@/i18n'
import { expensesApi } from '../../tests/api-mock'
import { deferred } from '../../tests/deferred'
import { makeExpense } from '../../tests/fixtures'
import { useExpensesStore } from './expenses'
import { useNoticesStore } from './notices'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

const filters: ExpenseFilters = {
  period: resolvePeriod('month', '2026-10-12'),
  categoryId: null,
  q: '',
}
const meta = (
  overrides: Partial<{ currentPage: number; lastPage: number; total: number }> = {},
) => ({
  currentPage: 1,
  perPage: 50,
  total: 2,
  lastPage: 1,
  ...overrides,
})
const lunch = makeExpense({ id: 'e1', description: 'Lunch', spentOn: '2026-10-12' })
const taxi = makeExpense({ id: 'e2', description: 'Taxi', spentOn: '2026-10-10', amountCents: 900 })
const input = {
  description: 'Coffee',
  amountCents: 150,
  currency: 'EUR',
  categoryId: 'c1',
  spentOn: '2026-10-12',
}
const failure = new ApiError({ kind: 'problem', status: 500, title: 'Server error' })

async function loadedStore() {
  expensesApi.list.mockResolvedValue({ data: [lunch, taxi], meta: meta() })
  const store = useExpensesStore()
  await store.load(filters)
  return store
}

describe('expenses store', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    await setLocale('en')
  })

  it('loads the first page with the required period and active filters', async () => {
    expensesApi.list.mockResolvedValue({ data: [lunch], meta: meta({ total: 1 }) })
    const store = useExpensesStore()
    const pending = store.load({ ...filters, categoryId: 'c1', q: 'lun' })
    expect(store.status).toBe('loading')
    await pending
    expect(store.status).toBe('ready')
    expect(store.items).toEqual([lunch])
    expect(expensesApi.list).toHaveBeenCalledWith(
      { from: '2026-10-01', to: '2026-10-31', categoryId: 'c1', q: 'lun', page: 1, perPage: 50 },
      expect.any(AbortSignal),
    )
  })

  it('omits empty filters from the request', async () => {
    await loadedStore()
    expect(expensesApi.list.mock.calls[0]?.[0]).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      page: 1,
      perPage: 50,
    })
  })

  it('groups the loaded expenses by day', async () => {
    const store = await loadedStore()
    expect(store.groups.map((g) => g.date)).toEqual(['2026-10-12', '2026-10-10'])
    expect(store.isEmpty).toBe(false)
  })

  it('reports an empty result', async () => {
    expensesApi.list.mockResolvedValue({ data: [], meta: meta({ total: 0 }) })
    const store = useExpensesStore()
    await store.load(filters)
    expect(store.isEmpty).toBe(true)
  })

  it('records a failed load and retries with the same filters', async () => {
    expensesApi.list.mockRejectedValueOnce(ApiError.network())
    const store = useExpensesStore()
    await store.load(filters)
    expect(store.status).toBe('error')
    expect(store.error?.kind).toBe('network')
    expensesApi.list.mockResolvedValue({ data: [lunch], meta: meta({ total: 1 }) })
    await store.reload()
    expect(store.status).toBe('ready')
    expect(store.items).toEqual([lunch])
  })

  it('does nothing on reload before any load', async () => {
    const store = useExpensesStore()
    await store.reload()
    expect(expensesApi.list).not.toHaveBeenCalled()
  })

  it('ignores the answer of a superseded load', async () => {
    const slow = deferred<{ data: unknown[]; meta: ReturnType<typeof meta> }>()
    expensesApi.list.mockReturnValueOnce(slow.promise)
    const store = useExpensesStore()
    const first = store.load(filters)
    expensesApi.list.mockResolvedValueOnce({ data: [taxi], meta: meta({ total: 1 }) })
    await store.load({ ...filters, q: 'taxi' })
    slow.resolve({ data: [lunch], meta: meta({ total: 1 }) })
    await first
    expect(store.items).toEqual([taxi])
  })

  it('does not report a superseded failure', async () => {
    const slow = deferred<never>()
    expensesApi.list.mockReturnValueOnce(slow.promise)
    const store = useExpensesStore()
    const first = store.load(filters)
    expensesApi.list.mockResolvedValueOnce({ data: [taxi], meta: meta({ total: 1 }) })
    await store.load(filters)
    slow.reject(failure)
    await first
    expect(store.status).toBe('ready')
    expect(store.error).toBeNull()
  })

  it('loads more pages without duplicating expenses', async () => {
    expensesApi.list.mockResolvedValueOnce({
      data: [lunch],
      meta: meta({ total: 3, lastPage: 2 }),
    })
    const store = useExpensesStore()
    await store.load(filters)
    expect(store.hasMore).toBe(true)
    expensesApi.list.mockResolvedValueOnce({
      data: [lunch, taxi],
      meta: meta({ total: 3, currentPage: 2, lastPage: 2 }),
    })
    const pending = store.loadMore()
    expect(store.loadingMore).toBe(true)
    await pending
    expect(store.loadingMore).toBe(false)
    expect(store.items.map((e) => e.id)).toEqual(['e1', 'e2'])
    expect(store.hasMore).toBe(false)
    expect(expensesApi.list.mock.calls[1]?.[0]).toMatchObject({ page: 2 })
    await store.loadMore()
    expect(expensesApi.list).toHaveBeenCalledTimes(2)
  })

  it('keeps the loaded list and reports when loading more fails', async () => {
    expensesApi.list.mockResolvedValueOnce({ data: [lunch], meta: meta({ total: 3, lastPage: 2 }) })
    const store = useExpensesStore()
    await store.load(filters)
    expensesApi.list.mockRejectedValueOnce(ApiError.network())
    await store.loadMore()
    expect(store.items).toEqual([lunch])
    expect(store.loadingMore).toBe(false)
    expect(useNoticesStore().items[0]?.message).toContain('Could not load more expenses')
  })

  it('discards a load-more answer that arrives after the filters changed', async () => {
    expensesApi.list.mockResolvedValueOnce({ data: [lunch], meta: meta({ total: 3, lastPage: 2 }) })
    const store = useExpensesStore()
    await store.load(filters)
    const late = deferred<{ data: unknown[]; meta: ReturnType<typeof meta> }>()
    expensesApi.list.mockReturnValueOnce(late.promise)
    const more = store.loadMore()
    expensesApi.list.mockResolvedValueOnce({ data: [taxi], meta: meta({ total: 1 }) })
    await store.load({ ...filters, q: 'taxi' })
    late.resolve({ data: [lunch], meta: meta({ total: 3, currentPage: 2, lastPage: 2 }) })
    await more
    expect(store.items).toEqual([taxi])
  })

  describe('create', () => {
    it('shows the expense at once and swaps in the server copy', async () => {
      const store = await loadedStore()
      const request = deferred<ReturnType<typeof makeExpense>>()
      expensesApi.create.mockReturnValue(request.promise)
      const pending = store.create(input)
      expect(store.items).toHaveLength(3)
      expect(store.total).toBe(3)
      expect(store.items[0]).toMatchObject({ description: 'Coffee', amountCents: 150 })
      expect(store.isPending(store.items[0]?.id ?? '')).toBe(true)
      request.resolve(makeExpense({ id: 'e9', ...input, createdAt: '2026-10-12T15:00:00Z' }))
      await expect(pending).resolves.toMatchObject({ ok: true })
      expect(store.items.map((e) => e.id)).toEqual(['e9', 'e1', 'e2'])
      expect(store.isPending('e9')).toBe(false)
    })

    it('rolls back and reports a failed create', async () => {
      const store = await loadedStore()
      expensesApi.create.mockRejectedValue(failure)
      const result = await store.create(input)
      expect(result).toEqual({ ok: false, error: failure })
      expect(store.items.map((e) => e.id)).toEqual(['e1', 'e2'])
      expect(store.total).toBe(2)
      expect(useNoticesStore().items[0]?.message).toContain('Could not save the expense')
    })

    it('does not show an expense that the current filters would hide', async () => {
      const store = await loadedStore()
      expensesApi.create.mockResolvedValue(makeExpense({ id: 'e9', spentOn: '2026-09-01' }))
      await store.create({ ...input, spentOn: '2026-09-01' })
      expect(store.items.map((e) => e.id)).toEqual(['e1', 'e2'])
      expect(store.total).toBe(2)
    })

    it('sends the request even when no list is loaded', async () => {
      const store = useExpensesStore()
      expensesApi.create.mockResolvedValue(makeExpense({ id: 'e9' }))
      await expect(store.create(input)).resolves.toMatchObject({ ok: true })
      expect(store.items).toEqual([])
    })
  })

  describe('update', () => {
    it('edits in place and keeps the server copy', async () => {
      const store = await loadedStore()
      const request = deferred<ReturnType<typeof makeExpense>>()
      expensesApi.update.mockReturnValue(request.promise)
      const pending = store.update('e1', { ...input, description: 'Brunch' })
      expect(store.items.find((e) => e.id === 'e1')?.description).toBe('Brunch')
      request.resolve(makeExpense({ id: 'e1', description: 'Brunch (saved)' }))
      await pending
      expect(store.items.find((e) => e.id === 'e1')?.description).toBe('Brunch (saved)')
    })

    it('restores the previous expense when the update fails', async () => {
      const store = await loadedStore()
      expensesApi.update.mockRejectedValue(failure)
      await store.update('e1', { ...input, description: 'Brunch', amountCents: 1 })
      expect(store.items.find((e) => e.id === 'e1')).toEqual(lunch)
      expect(useNoticesStore().items[0]?.message).toContain('Could not update the expense')
    })

    it('drops an expense moved out of the filters, and brings it back on failure', async () => {
      const store = await loadedStore()
      expensesApi.update.mockRejectedValue(failure)
      const moved = { ...input, spentOn: '2026-09-01' }
      const pending = store.update('e1', moved)
      expect(store.items.map((e) => e.id)).toEqual(['e2'])
      expect(store.total).toBe(1)
      await pending
      expect(store.items.map((e) => e.id)).toEqual(['e1', 'e2'])
      expect(store.total).toBe(2)
    })

    it('brings an edited expense into view when it now matches', async () => {
      const store = await loadedStore()
      expensesApi.update.mockResolvedValue(makeExpense({ id: 'e5', spentOn: '2026-10-11' }))
      await store.update('e5', { ...input, spentOn: '2026-10-11' })
      expect(store.items.map((e) => e.id)).toEqual(['e1', 'e5', 'e2'])
      expect(store.total).toBe(3)
    })
  })

  describe('remove', () => {
    it('removes at once', async () => {
      const store = await loadedStore()
      const request = deferred<undefined>()
      expensesApi.remove.mockReturnValue(request.promise)
      const pending = store.remove('e1')
      expect(store.items.map((e) => e.id)).toEqual(['e2'])
      expect(store.total).toBe(1)
      request.resolve(undefined)
      await expect(pending).resolves.toMatchObject({ ok: true })
      expect(store.items.map((e) => e.id)).toEqual(['e2'])
    })

    it('puts the expense back in order when the delete fails', async () => {
      const store = await loadedStore()
      expensesApi.remove.mockRejectedValue(failure)
      const result = await store.remove('e1')
      expect(result.ok).toBe(false)
      expect(store.items.map((e) => e.id)).toEqual(['e1', 'e2'])
      expect(store.total).toBe(2)
      expect(useNoticesStore().items[0]?.message).toContain('Could not delete the expense')
    })

    it('still deletes an expense that is not in the loaded list', async () => {
      const store = await loadedStore()
      expensesApi.remove.mockResolvedValue(undefined)
      await store.remove('zz')
      expect(store.items).toHaveLength(2)
      expect(store.total).toBe(2)
    })
  })

  describe('revision', () => {
    it('counts the changes the server confirmed, so other screens can refresh', async () => {
      const store = await loadedStore()
      expect(store.revision).toBe(0)
      expensesApi.create.mockResolvedValue(makeExpense({ id: 'e9', ...input }))
      await store.create(input)
      expect(store.revision).toBe(1)
      expensesApi.update.mockResolvedValue(makeExpense({ id: 'e1' }))
      await store.update('e1', input)
      expect(store.revision).toBe(2)
      expensesApi.remove.mockResolvedValue(undefined)
      await store.remove('e2')
      expect(store.revision).toBe(3)
    })

    it('does not count a change that was rolled back', async () => {
      const store = await loadedStore()
      expensesApi.create.mockRejectedValue(failure)
      await store.create(input)
      expect(store.revision).toBe(0)
    })
  })
})
