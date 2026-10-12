import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { isTempId } from '@/domain/optimistic'
import { setLocale } from '@/i18n'
import { apiMock, categoriesApi } from '../../tests/api-mock'
import { deferred } from '../../tests/deferred'
import { makeCategory } from '../../tests/fixtures'
import { useCategoriesStore } from './categories'
import { useNoticesStore } from './notices'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

const groceries = makeCategory({ id: 'c1', name: 'Groceries' })
const travel = makeCategory({ id: 'c2', name: 'Travel', icon: 'plane' })
const input = { name: 'Pets', color: '#0B6B72', icon: 'heart' } as const
const conflict = new ApiError({ kind: 'problem', status: 409, title: 'Conflict', detail: 'In use' })
const invalid = new ApiError({ kind: 'problem', status: 422, title: 'Invalid', detail: 'Taken' })

async function loadedStore() {
  categoriesApi.list.mockResolvedValue([travel, groceries])
  const store = useCategoriesStore()
  await store.load()
  return store
}

describe('categories store', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    await setLocale('en')
  })

  it('loads categories sorted by name', async () => {
    const store = await loadedStore()
    expect(store.status).toBe('ready')
    expect(store.items.map((c) => c.id)).toEqual(['c1', 'c2'])
    expect(store.byId.get('c2')).toEqual(travel)
    expect(apiMock.categoriesApi.list).toHaveBeenCalledTimes(1)
  })

  it('exposes active categories without the archived ones', async () => {
    categoriesApi.list.mockResolvedValue([groceries, makeCategory({ id: 'c3', archived: true })])
    const store = useCategoriesStore()
    await store.load()
    expect(store.active.map((c) => c.id)).toEqual(['c1'])
  })

  it('records a load failure and recovers on retry', async () => {
    categoriesApi.list.mockRejectedValueOnce(ApiError.network())
    const store = useCategoriesStore()
    await store.load()
    expect(store.status).toBe('error')
    expect(store.error?.kind).toBe('network')
    categoriesApi.list.mockResolvedValue([groceries])
    await store.load()
    expect(store.status).toBe('ready')
    expect(store.error).toBeNull()
  })

  it('keeps the list visible while refreshing', async () => {
    const store = await loadedStore()
    const refresh = deferred<never[]>()
    categoriesApi.list.mockReturnValue(refresh.promise)
    const pending = store.load()
    expect(store.status).toBe('ready')
    refresh.resolve([])
    await pending
    expect(store.items).toEqual([])
  })

  it('adds a created category at once and swaps in the server copy', async () => {
    const store = await loadedStore()
    const request = deferred<ReturnType<typeof makeCategory>>()
    categoriesApi.create.mockReturnValue(request.promise)
    const pending = store.create(input)
    const optimistic = store.items.find((c) => c.name === 'Pets')
    expect(optimistic).toBeDefined()
    expect(isTempId(optimistic?.id ?? '')).toBe(true)
    request.resolve(makeCategory({ id: 'c9', ...input }))
    await expect(pending).resolves.toMatchObject({ ok: true })
    expect(store.items.map((c) => c.id)).toEqual(['c1', 'c9', 'c2'])
  })

  it('rolls a failed create back and tells the user', async () => {
    const store = await loadedStore()
    categoriesApi.create.mockRejectedValue(invalid)
    const result = await store.create(input)
    expect(result).toEqual({ ok: false, error: invalid })
    expect(store.items.map((c) => c.id)).toEqual(['c1', 'c2'])
    const [notice] = useNoticesStore().items
    expect(notice?.kind).toBe('error')
    expect(notice?.message).toContain('Could not create the category')
    expect(notice?.message).toContain('Taken')
  })

  it('updates in place and rolls back on failure', async () => {
    const store = await loadedStore()
    const request = deferred<ReturnType<typeof makeCategory>>()
    categoriesApi.update.mockReturnValueOnce(request.promise)
    const pending = store.update('c1', input)
    expect(store.byId.get('c1')?.name).toBe('Pets')
    request.resolve(makeCategory({ id: 'c1', ...input }))
    await pending

    categoriesApi.update.mockRejectedValue(invalid)
    const failed = await store.update('c1', { ...input, name: 'Other' })
    expect(failed.ok).toBe(false)
    expect(store.byId.get('c1')?.name).toBe('Pets')
    expect(useNoticesStore().items.at(-1)?.message).toContain('Could not update the category')
  })

  it('archives and unarchives optimistically', async () => {
    const store = await loadedStore()
    const request = deferred<ReturnType<typeof makeCategory>>()
    categoriesApi.archive.mockReturnValue(request.promise)
    const pending = store.archive('c1')
    expect(store.byId.get('c1')?.archived).toBe(true)
    request.resolve({ ...groceries, archived: true })
    await pending

    categoriesApi.unarchive.mockResolvedValue(groceries)
    await store.unarchive('c1')
    expect(store.byId.get('c1')?.archived).toBe(false)
  })

  it('restores the archived flag when archiving fails', async () => {
    const store = await loadedStore()
    categoriesApi.archive.mockRejectedValue(ApiError.network())
    await store.archive('c1')
    expect(store.byId.get('c1')?.archived).toBe(false)
    expect(useNoticesStore().items[0]?.message).toContain('Could not archive the category')
    categoriesApi.unarchive.mockRejectedValue(ApiError.network())
    await store.unarchive('c1')
    expect(useNoticesStore().items[1]?.message).toContain('Could not restore the category')
  })

  it('removes a category at once and puts it back when the server refuses', async () => {
    const store = await loadedStore()
    const request = deferred<undefined>()
    categoriesApi.remove.mockReturnValueOnce(request.promise)
    const pending = store.remove('c1')
    expect(store.byId.has('c1')).toBe(false)
    request.resolve(undefined)
    await expect(pending).resolves.toMatchObject({ ok: true })

    categoriesApi.remove.mockRejectedValue(conflict)
    const refused = await store.remove('c2')
    expect(refused.ok).toBe(false)
    expect(store.byId.has('c2')).toBe(true)
    expect(useNoticesStore().items.at(-1)?.message).toContain('Archive it instead')
  })

  it('uses the generic message when a delete fails for another reason', async () => {
    const store = await loadedStore()
    categoriesApi.remove.mockRejectedValue(ApiError.network())
    await store.remove('c1')
    expect(useNoticesStore().items[0]?.message).toContain('Could not delete the category')
  })

  it('rethrows unexpected errors instead of reporting them as API failures', async () => {
    const store = await loadedStore()
    categoriesApi.remove.mockRejectedValue(new TypeError('bug'))
    await expect(store.remove('c1')).rejects.toThrow('bug')
    expect(store.byId.has('c1')).toBe(true)
  })

  it('ignores updates and archives for unknown ids without touching the list', async () => {
    const store = await loadedStore()
    categoriesApi.update.mockResolvedValue(makeCategory({ id: 'zz', ...input }))
    await store.update('zz', input)
    categoriesApi.archive.mockResolvedValue(makeCategory({ id: 'zz', archived: true }))
    await store.archive('zz')
    categoriesApi.remove.mockResolvedValue(undefined)
    await store.remove('zz')
    expect(store.items.map((c) => c.id)).toEqual(['c1', 'c2'])
  })
})
