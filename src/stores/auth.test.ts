import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { tokenStorage } from '@/api/token'
import { setLocale } from '@/i18n'
import { useAuthStore } from './auth'
import { useLocaleStore } from './locale'
import { authApi, sampleUser as user } from '../../tests/api-mock'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

describe('auth store', () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    await setLocale('it')
  })

  it('logs in, persists the token and adopts the account locale', async () => {
    authApi.login.mockResolvedValue({ token: 'tok', user })
    const store = useAuthStore()
    await store.login({ email: user.email, password: 'pw' })
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(user)
    expect(tokenStorage.get()).toBe('tok')
    expect(useLocaleStore().current).toBe('en')
  })

  it('registers with the current locale', async () => {
    authApi.register.mockResolvedValue({ token: 'tok', user })
    const store = useAuthStore()
    await store.register({ name: 'Ada', email: user.email, password: 'password1' })
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Ada',
      email: user.email,
      password: 'password1',
      locale: 'it',
    })
    expect(store.isAuthenticated).toBe(true)
  })

  it('does not call the API on boot without a token', async () => {
    const store = useAuthStore()
    await store.boot()
    expect(authApi.getMe).not.toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
    expect(store.ready).toBe(true)
  })

  it('loads the user on boot when a token is stored', async () => {
    tokenStorage.set('tok')
    authApi.getMe.mockResolvedValue(user)
    const store = useAuthStore()
    await store.boot()
    expect(store.user).toEqual(user)
    expect(useLocaleStore().current).toBe('en')
    expect(store.ready).toBe(true)
  })

  it('clears the session when boot is rejected with 401', async () => {
    tokenStorage.set('tok')
    authApi.getMe.mockRejectedValue(new ApiError({ kind: 'problem', status: 401, title: 'No' }))
    const store = useAuthStore()
    await store.boot()
    expect(store.isAuthenticated).toBe(false)
    expect(tokenStorage.get()).toBeNull()
    expect(store.ready).toBe(true)
  })

  it('keeps the token when boot fails for other reasons', async () => {
    tokenStorage.set('tok')
    authApi.getMe.mockRejectedValue(ApiError.network())
    const store = useAuthStore()
    await store.boot()
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toBeNull()
    expect(store.ready).toBe(true)
  })

  it('logs out through the API and clears local state', async () => {
    authApi.login.mockResolvedValue({ token: 'tok', user })
    authApi.logout.mockResolvedValue(undefined)
    const store = useAuthStore()
    await store.login({ email: user.email, password: 'pw' })
    await store.logout()
    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(tokenStorage.get()).toBeNull()
  })

  it('clears local state even when the logout request fails', async () => {
    tokenStorage.set('tok')
    authApi.logout.mockRejectedValue(ApiError.network())
    const store = useAuthStore()
    await store.logout()
    expect(store.isAuthenticated).toBe(false)
    expect(tokenStorage.get()).toBeNull()
  })

  it('saves the locale on the account', async () => {
    authApi.login.mockResolvedValue({ token: 'tok', user })
    authApi.updateMe.mockResolvedValue({ ...user, locale: 'it' })
    const store = useAuthStore()
    await store.login({ email: user.email, password: 'pw' })
    await store.saveLocale('it')
    expect(authApi.updateMe).toHaveBeenCalledWith({ locale: 'it' })
    expect(store.user?.locale).toBe('it')
  })

  it('expires the session on demand', () => {
    tokenStorage.set('tok')
    const store = useAuthStore()
    store.clearSession()
    expect(store.isAuthenticated).toBe(false)
    expect(tokenStorage.get()).toBeNull()
  })
})
