import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { tokenStorage } from '@/api/token'
import { useAuthStore } from '@/stores/auth'
import { createAppRouter } from './index'

describe('app router', () => {
  it('lazy-loads a page for every named route', async () => {
    localStorage.clear()
    tokenStorage.set('tok')
    setActivePinia(createPinia())
    const router = createAppRouter(createMemoryHistory())
    const names = ['dashboard', 'expenses', 'categories', 'settings']
    for (const name of names) {
      await router.push({ name })
      expect(router.currentRoute.value.name).toBe(name)
      expect(router.currentRoute.value.matched).toHaveLength(1)
    }
    useAuthStore().clearSession()
    await router.push({ name: 'login' })
    expect(router.currentRoute.value.name).toBe('login')
    await router.push({ name: 'register' })
    expect(router.currentRoute.value.name).toBe('register')
  })
})
