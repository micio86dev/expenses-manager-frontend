import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import RegisterView from './RegisterView.vue'
import { authApi, sampleUser as user } from '../../tests/api-mock'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers with the current locale and goes to the dashboard', async () => {
    authApi.register.mockResolvedValue({ token: 'tok', user })
    // The dashboard route is lazy. Load its module before the submit, so the navigation after a
    // successful registration never waits on a cold import (that wait is what made this test flaky).
    await import('@/pages/DashboardPage.vue')
    const { wrapper, router } = await renderWithApp(RegisterView, { route: '/register' })
    expect(wrapper.get('h1').text()).toBe('Create an account')
    expect(wrapper.get('a[href="/login"]').text()).toBe('Sign in')
    await wrapper.get('input[autocomplete=name]').setValue('Ada')
    await wrapper.get('input[type=email]').setValue('ada@example.com')
    await wrapper.get('input[type=password]').setValue('password1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password1',
      locale: 'en',
    })
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('dashboard')
    })
  })

  it('shows the server problem and stays on the page', async () => {
    authApi.register.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 422,
        title: 'Invalid',
        fieldErrors: { email: ['Already taken'] },
      }),
    )
    const { wrapper, router } = await renderWithApp(RegisterView, { route: '/register' })
    await wrapper.get('input[autocomplete=name]').setValue('Ada')
    await wrapper.get('input[type=email]').setValue('ada@example.com')
    await wrapper.get('input[type=password]').setValue('password1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Already taken')
    expect(router.currentRoute.value.name).toBe('register')
  })

  it('has no axe violations', async () => {
    const { wrapper } = await renderWithApp(RegisterView, { route: '/register' })
    await expectNoA11yViolations(wrapper.element)
  })
})
