import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, LOCALE_STORAGE_KEY } from '@/i18n'
import { useLocaleStore } from './locale'

describe('locale store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts from the detected locale', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    const store = useLocaleStore()
    await store.init()
    expect(store.current).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
  })

  it('applies a locale, persisting it and syncing the document language', async () => {
    const store = useLocaleStore()
    await store.apply('en')
    expect(store.current).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    await store.apply('it')
    expect(store.current).toBe('it')
  })

  it('lists the registered locales for the switcher', () => {
    const store = useLocaleStore()
    expect(store.available.map((l) => l.code)).toEqual(['it', 'en'])
    expect(store.available.every((l) => l.label.length > 0)).toBe(true)
  })
})
