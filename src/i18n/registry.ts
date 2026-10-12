// Language registry. Adding a language = one file in ./locales plus one line below (plus its dayjs loader).
// Each entry loads its messages lazily, so every language is its own chunk. The dayjs locale
// loader for the same code lives in src/lib/dates.ts (its type forces you to add it).
export const locales = {
  it: {
    label: 'Italiano',
    messages: () => import('./locales/it'),
  },
  en: {
    label: 'English',
    messages: () => import('./locales/en'),
  },
} as const

export type LocaleCode = keyof typeof locales

export const DEFAULT_LOCALE: LocaleCode = 'it'

export const localeCodes = Object.keys(locales) as LocaleCode[]

export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === 'string' && Object.hasOwn(locales, value)
}
