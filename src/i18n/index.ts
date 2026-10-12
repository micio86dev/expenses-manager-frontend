import { createI18n } from 'vue-i18n'
import { activateDateLocale } from '@/lib/dates'
import type { MessageKey } from './keys'
import { DEFAULT_LOCALE, isLocaleCode, locales, type LocaleCode } from './registry'

export const LOCALE_STORAGE_KEY = 'expenses.locale'

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
})

/** Stored choice first, then the browser languages, then the default. */
export function detectLocale(): LocaleCode {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (isLocaleCode(stored)) return stored
  for (const language of navigator.languages) {
    const base = language.slice(0, 2).toLowerCase()
    if (isLocaleCode(base)) return base
  }
  return DEFAULT_LOCALE
}

/** Loads the locale chunks on first use, then syncs vue-i18n, <html lang>, dayjs and storage. */
export async function setLocale(code: LocaleCode): Promise<void> {
  const entry = locales[code]
  if (!i18n.global.availableLocales.includes(code)) {
    const messages = await entry.messages()
    i18n.global.setLocaleMessage(code, messages.default)
  }
  await activateDateLocale(code)
  i18n.global.locale.value = code
  document.documentElement.lang = code
  localStorage.setItem(LOCALE_STORAGE_KEY, code)
}

/** Key-checked translation for code outside components (stores, router, API errors). */
export function translate(key: MessageKey): string {
  return i18n.global.t(key)
}
