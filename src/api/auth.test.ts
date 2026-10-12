import { describe, expect, it, vi } from 'vitest'
import { createAuthApi } from './auth'
import type { ApiClient } from './client'

function fakeClient() {
  const request = vi.fn()
  return { client: { request } as unknown as ApiClient, request }
}

const user = { id: 'u1', name: 'Ada', email: 'ada@example.com', locale: 'it', createdAt: 'x' }

describe('auth api', () => {
  it('logs in without a token and unwraps the data envelope', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: { token: 't', user } })
    const result = await createAuthApi(client).login({ email: 'ada@example.com', password: 'pw' })
    expect(request).toHaveBeenCalledWith('POST', '/auth/login', {
      auth: false,
      body: { email: 'ada@example.com', password: 'pw' },
    })
    expect(result).toEqual({ token: 't', user })
  })

  it('registers with the chosen locale', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: { token: 't', user } })
    await createAuthApi(client).register({
      name: 'Ada',
      email: 'a@b.c',
      password: 'pw',
      locale: 'en',
    })
    expect(request).toHaveBeenCalledWith('POST', '/auth/register', {
      auth: false,
      body: { name: 'Ada', email: 'a@b.c', password: 'pw', locale: 'en' },
    })
  })

  it('loads and updates the signed-in user', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: user })
    const api = createAuthApi(client)
    await expect(api.getMe()).resolves.toEqual(user)
    expect(request).toHaveBeenLastCalledWith('GET', '/auth/me')
    await expect(api.updateMe({ locale: 'en' })).resolves.toEqual(user)
    expect(request).toHaveBeenLastCalledWith('PATCH', '/auth/me', { body: { locale: 'en' } })
  })

  it('logs out', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue(undefined)
    await createAuthApi(client).logout()
    expect(request).toHaveBeenCalledWith('POST', '/auth/logout')
  })
})
