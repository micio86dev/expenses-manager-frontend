import { describe, expect, it, vi } from 'vitest'
import { makeCategory } from '../../tests/fixtures'
import { createCategoriesApi } from './categories'
import type { ApiClient } from './client'

function fakeClient() {
  const request = vi.fn()
  return { client: { request } as unknown as ApiClient, request }
}

describe('categories api', () => {
  it('lists categories including archived ones', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: [makeCategory()] })
    await expect(createCategoriesApi(client).list()).resolves.toEqual([makeCategory()])
    expect(request).toHaveBeenCalledWith('GET', '/categories', {
      query: { include_archived: true },
    })
  })

  it('creates and updates with the input as body', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: makeCategory() })
    const api = createCategoriesApi(client)
    const input = { name: 'Pets', color: '#0B6B72', icon: 'heart' } as const
    await expect(api.create(input)).resolves.toEqual(makeCategory())
    expect(request).toHaveBeenLastCalledWith('POST', '/categories', { body: input })
    await api.update('c1', input)
    expect(request).toHaveBeenLastCalledWith('PUT', '/categories/c1', { body: input })
  })

  it('deletes, archives and unarchives', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: makeCategory({ archived: true }) })
    const api = createCategoriesApi(client)
    await api.remove('c1')
    expect(request).toHaveBeenLastCalledWith('DELETE', '/categories/c1')
    await expect(api.archive('c1')).resolves.toEqual(makeCategory({ archived: true }))
    expect(request).toHaveBeenLastCalledWith('POST', '/categories/c1/archive')
    await api.unarchive('c1')
    expect(request).toHaveBeenLastCalledWith('POST', '/categories/c1/unarchive')
  })
})
