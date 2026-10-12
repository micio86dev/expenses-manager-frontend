import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { tokenStorage } from '@/api/token'
import { createExpensesApp } from './bootstrap'

const wireUser = { id: 'u', name: 'Ada', email: 'a@b.c', locale: 'en', created_at: 'x' }

describe('bootstrap', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = '<div id="app"></div>'
    vi.stubGlobal('fetch', vi.fn<typeof fetch>())
  })

  it('boots signed out on the login page in the stored language', async () => {
    localStorage.setItem('expenses.locale', 'en')
    const { app, router } = await createExpensesApp(createMemoryHistory())
    app.mount('#app')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('login')
    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelector('h1')?.textContent).toBe('Sign in')
    expect(fetch).not.toHaveBeenCalled()
    app.unmount()
  })

  it('loads the current user on boot when a token is stored', async () => {
    tokenStorage.set('tok')
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: wireUser }), { status: 200 }),
    )
    const { app, router } = await createExpensesApp(createMemoryHistory())
    expect(router.currentRoute.value.name).toBe('dashboard')
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('/auth/me')
    app.unmount()
  })

  it('signs out and redirects to login when the API answers 401', async () => {
    tokenStorage.set('tok')
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: wireUser }), { status: 200 }),
    )
    const { app, router } = await createExpensesApp(createMemoryHistory())
    await router.push('/expenses')
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ title: 'Unauthenticated', status: 401 }), { status: 401 }),
    )
    const { apiClient } = await import('@/api')
    await expect(apiClient.request('GET', '/expenses')).rejects.toMatchObject({ status: 401 })
    await flushPromises()
    expect(tokenStorage.get()).toBeNull()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/expenses')
    app.unmount()
  })
})
