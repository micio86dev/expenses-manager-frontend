import { computed } from 'vue'
import type { LocaleCode } from '@/i18n/registry'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'

/** Language switching: applies locally at once, and saves it on the account when signed in. */
export function useLanguage() {
  const localeStore = useLocaleStore()
  const auth = useAuthStore()

  async function change(code: LocaleCode): Promise<void> {
    await localeStore.apply(code)
    if (auth.isAuthenticated) await auth.saveLocale(code)
  }

  return { current: computed(() => localeStore.current), available: localeStore.available, change }
}
