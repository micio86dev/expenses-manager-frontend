const TOKEN_STORAGE_KEY = 'expenses.token'

/** Persistence for the bearer token. The API client and the auth store share this module. */
export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY),
  set: (token: string): void => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  },
  clear: (): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  },
}
