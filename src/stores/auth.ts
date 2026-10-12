import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api'
import { ApiError } from '@/api/errors'
import { tokenStorage } from '@/api/token'
import type { LoginInput, RegisterInput, AuthSession, User } from '@/api/types'
import type { LocaleCode } from '@/i18n/registry'
import { useLocaleStore } from './locale'

/*
 * Token storage trade-off: the bearer token lives in localStorage so the session survives
 * reloads and works offline-first on mobile without a cookie round trip. The cost is that any
 * script running on the page (an XSS) can read it, whereas an httpOnly cookie could not be read.
 * We accept this for a personal single-origin app with a strict CSP, no third-party scripts and
 * a revocable token (POST /auth/logout). Moving to httpOnly cookies would need a backend change.
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(tokenStorage.get())
  const user = ref<User | null>(null)
  /** True once the boot attempt to load the current user has settled. */
  const ready = ref(false)
  const isAuthenticated = computed(() => token.value !== null)

  async function adoptSession(session: AuthSession): Promise<void> {
    tokenStorage.set(session.token)
    token.value = session.token
    user.value = session.user
    await useLocaleStore().apply(session.user.locale)
  }

  async function login(input: LoginInput): Promise<void> {
    await adoptSession(await authApi.login(input))
  }

  async function register(input: Omit<RegisterInput, 'locale'>): Promise<void> {
    const locale = useLocaleStore().current
    await adoptSession(await authApi.register({ ...input, locale }))
  }

  function clearSession(): void {
    tokenStorage.clear()
    token.value = null
    user.value = null
  }

  /** Loads the current user when a token is stored. A rejected token ends the session. */
  async function boot(): Promise<void> {
    if (token.value !== null) {
      try {
        user.value = await authApi.getMe()
        await useLocaleStore().apply(user.value.locale)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clearSession()
        // Other failures (offline, server down) keep the session; the user loads on next success.
      }
    }
    ready.value = true
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } catch {
      // The token may already be invalid or the network down; local state is cleared regardless.
    } finally {
      clearSession()
    }
  }

  async function saveLocale(locale: LocaleCode): Promise<void> {
    user.value = await authApi.updateMe({ locale })
  }

  return {
    token,
    user,
    ready,
    isAuthenticated,
    login,
    register,
    boot,
    logout,
    clearSession,
    saveLocale,
  }
})
