import { beforeEach, describe, expect, it } from 'vitest'
import { formatDate } from '@/lib/dates'
import italian from './locales/it'
import { detectLocale, i18n, LOCALE_STORAGE_KEY, setLocale, translate } from './index'

function setNavigatorLanguages(languages: string[]): void {
  Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true })
}

describe('i18n service', () => {
  beforeEach(() => {
    localStorage.clear()
    setNavigatorLanguages(['it-IT'])
  })

  it('prefers the stored locale', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    expect(detectLocale()).toBe('en')
  })

  it('ignores a stored locale that is not registered', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'xx')
    expect(detectLocale()).toBe('it')
    localStorage.setItem(LOCALE_STORAGE_KEY, 'toString')
    expect(detectLocale()).toBe('it')
  })

  it('falls back to the browser language, then to the default', () => {
    setNavigatorLanguages(['de-DE', 'en-GB'])
    expect(detectLocale()).toBe('en')
    setNavigatorLanguages(['de-DE'])
    expect(detectLocale()).toBe('it')
  })

  it('loads messages, persists the choice and syncs html lang and date locale', async () => {
    await setLocale('en')
    expect(i18n.global.t('nav.dashboard')).toBe('Dashboard')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(formatDate('2026-10-12', 'ddd D MMM')).toBe('Mon 12 Oct')

    await setLocale('it')
    expect(i18n.global.t('nav.dashboard')).toBe(italian.nav.dashboard)
    expect(document.documentElement.lang).toBe('it')
    expect(formatDate('2026-10-12', 'ddd D MMM')).not.toBe('Mon 12 Oct')
  })

  it('translates keys outside components', async () => {
    await setLocale('en')
    expect(translate('errors.network')).toContain('Cannot reach the server')
  })
})
