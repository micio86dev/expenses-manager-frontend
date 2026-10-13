import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocale } from '@/i18n'
import { apiClient, onUnauthorized } from './index'
import { tokenStorage } from './token'

describe('api singleton', () => {
  beforeEach(async () => {
    localStorage.clear()
    await setLocale('en')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the token from storage and the locale from i18n on every request', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    tokenStorage.set('abc')
    await apiClient.request('GET', '/auth/me')
    const [url, init] = fetchMock.mock.calls[0] ?? []
    // The base URL comes from the environment (the container sets it); assert the same source the client uses.
    expect(url).toBe(`${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/auth/me`)
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer abc')
    expect(headers.get('Accept-Language')).toBe('en')
  })

  it('notifies the registered handler on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('{"title":"x","status":401}', { status: 401 })),
    )
    const handler = vi.fn()
    onUnauthorized(handler)
    await expect(apiClient.request('GET', '/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe('token storage', () => {
  it('stores, reads and clears the token', () => {
    localStorage.clear()
    expect(tokenStorage.get()).toBeNull()
    tokenStorage.set('t')
    expect(tokenStorage.get()).toBe('t')
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })
})
