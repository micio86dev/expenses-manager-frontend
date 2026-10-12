import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocale } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useLanguage } from './useLanguage'

vi.mock('@/api', () => ({ authApi: { updateMe: vi.fn() } }))

describe('useLanguage', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    await setLocale('it')
  })

  it('applies the locale locally when signed out', async () => {
    const auth = useAuthStore()
    const saveLocale = vi.spyOn(auth, 'saveLocale')
    const { current, change } = useLanguage()
    await change('en')
    expect(current.value).toBe('en')
    expect(saveLocale).not.toHaveBeenCalled()
  })

  it('also saves it on the account when signed in', async () => {
    const auth = useAuthStore()
    auth.token = 'tok'
    const saveLocale = vi.spyOn(auth, 'saveLocale').mockResolvedValue()
    const { change } = useLanguage()
    await change('en')
    expect(useLocaleStore().current).toBe('en')
    expect(saveLocale).toHaveBeenCalledWith('en')
  })
})
