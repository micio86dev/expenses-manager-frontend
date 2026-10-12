import { i18n } from '@/i18n'
import { createAuthApi } from './auth'
import { createApiClient } from './client'
import { tokenStorage } from './token'

let unauthorizedHandler: () => void = () => undefined

/** Registers what happens when an authenticated request gets a 401 (set once at bootstrap). */
export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  getToken: tokenStorage.get,
  getLocale: () => i18n.global.locale.value,
  onUnauthorized: () => {
    unauthorizedHandler()
  },
})

export const authApi = createAuthApi(apiClient)
