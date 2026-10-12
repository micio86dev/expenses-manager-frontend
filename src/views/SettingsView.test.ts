import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import SettingsView from './SettingsView.vue'
import { authApi, sampleUser as user } from '../../tests/api-mock'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('offers the language switcher with the current language selected', async () => {
    const { wrapper } = await renderWithApp(SettingsView, { route: '/settings', token: 'tok' })
    expect(wrapper.get('h1').text()).toBe('Settings')
    expect(wrapper.get('select').element.value).toBe('en')
  })

  it('switches language and saves it on the account', async () => {
    authApi.updateMe.mockResolvedValue({ ...user, locale: 'it' })
    const { wrapper } = await renderWithApp(SettingsView, { route: '/settings', token: 'tok' })
    await wrapper.get('select').setValue('it')
    await vi.waitFor(() => {
      expect(authApi.updateMe).toHaveBeenCalledWith({ locale: 'it' })
    })
    expect(useLocaleStore().current).toBe('it')
    expect(document.documentElement.lang).toBe('it')
  })

  it('keeps the new language and shows an error when saving it fails', async () => {
    authApi.updateMe.mockRejectedValue(ApiError.network())
    const { wrapper } = await renderWithApp(SettingsView, { route: '/settings', token: 'tok' })
    await wrapper.get('select').setValue('it')
    await vi.waitFor(() => {
      expect(wrapper.find('[role=alert]').exists()).toBe(true)
    })
    expect(useLocaleStore().current).toBe('it')
  })

  it('signs out and returns to the login page', async () => {
    authApi.logout.mockResolvedValue(undefined)
    const { wrapper, router } = await renderWithApp(SettingsView, {
      route: '/settings',
      token: 'tok',
    })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(useAuthStore().isAuthenticated).toBe(false)
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('login')
    })
  })

  it('has no axe violations', async () => {
    const { wrapper } = await renderWithApp(SettingsView, { route: '/settings', token: 'tok' })
    await expectNoA11yViolations(wrapper.element)
  })
})
