import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { tokenStorage } from '@/api/token'
import { setLocale } from '@/i18n'
import { createAppRouter } from './index'
import { safeRedirect } from './guards'

async function routerAt(path: string, token: string | null) {
  localStorage.clear()
  if (token !== null) tokenStorage.set(token)
  setActivePinia(createPinia())
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  return router
}

describe('route guards', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('sends signed-out visitors to the login page and remembers where they were going', async () => {
    const router = await routerAt('/expenses', null)
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/expenses')
  })

  it('does not add a redirect for the home page', async () => {
    const router = await routerAt('/', null)
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('lets signed-in users reach authenticated pages', async () => {
    const router = await routerAt('/settings', 'tok')
    expect(router.currentRoute.value.name).toBe('settings')
  })

  it('keeps signed-in users away from login and register', async () => {
    expect((await routerAt('/login', 'tok')).currentRoute.value.name).toBe('dashboard')
    expect((await routerAt('/register', 'tok')).currentRoute.value.name).toBe('dashboard')
  })

  it('returns signed-in users to the page they asked for', async () => {
    const router = await routerAt('/login?redirect=/categories', 'tok')
    expect(router.currentRoute.value.name).toBe('categories')
  })

  it('sets the document title from the route', async () => {
    await routerAt('/categories', 'tok')
    expect(document.title).toBe('Categories · Expenses manager')
    await routerAt('/login', null)
    expect(document.title).toBe('Sign in · Expenses manager')
  })

  it('redirects unknown paths to the home page', async () => {
    const router = await routerAt('/nope/never', 'tok')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})

describe('safeRedirect', () => {
  it('accepts internal paths only', () => {
    expect(safeRedirect('/expenses?from=2026-10-01')).toBe('/expenses?from=2026-10-01')
    expect(safeRedirect('https://evil.example')).toBe('/')
    expect(safeRedirect('//evil.example')).toBe('/')
    expect(safeRedirect('/\\evil.example')).toBe('/')
    expect(safeRedirect(undefined)).toBe('/')
    expect(safeRedirect(['/a'])).toBe('/')
  })
})
