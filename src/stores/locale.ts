import { defineStore } from 'pinia'
import { ref } from 'vue'
import { detectLocale, setLocale } from '@/i18n'
import { DEFAULT_LOCALE, localeCodes, locales, type LocaleCode } from '@/i18n/registry'

export const useLocaleStore = defineStore('locale', () => {
  const current = ref<LocaleCode>(DEFAULT_LOCALE)
  const available = localeCodes.map((code) => ({ code, label: locales[code].label }))

  /** Switches the UI language everywhere (messages, <html lang>, dates, storage). */
  async function apply(code: LocaleCode): Promise<void> {
    await setLocale(code)
    current.value = code
  }

  /** Applies the stored or browser locale at startup. */
  async function init(): Promise<void> {
    await apply(detectLocale())
  }

  return { current, available, apply, init }
})
