import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import LoginView from './LoginView.vue'
import { authApi, sampleUser as user } from '../../tests/api-mock'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof renderWithApp>>['wrapper']) {
  await wrapper.get('input[type=email]').setValue('ada@example.com')
  await wrapper.get('input[type=password]').setValue('secret-pw')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('composes the heading, the form and a link to registration', async () => {
    const { wrapper } = await renderWithApp(LoginView, { route: '/login' })
    expect(wrapper.get('h1').text()).toBe('Sign in')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.get('a[href="/register"]').text()).toBe('Create one')
  })

  it('signs in and goes to the dashboard', async () => {
    authApi.login.mockResolvedValue({ token: 'tok', user })
    const { wrapper, router } = await renderWithApp(LoginView, { route: '/login' })
    await fillAndSubmit(wrapper)
    expect(authApi.login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret-pw' })
    expect(useAuthStore().isAuthenticated).toBe(true)
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('dashboard')
    })
  })

  it('goes back to the page that required authentication', async () => {
    authApi.login.mockResolvedValue({ token: 'tok', user })
    const { wrapper, router } = await renderWithApp(LoginView, {
      route: '/login?redirect=/expenses',
    })
    await fillAndSubmit(wrapper)
    await vi.waitFor(() => {
      expect(router.currentRoute.value.name).toBe('expenses')
    })
  })

  it('shows the server message and stays on the page when sign-in fails', async () => {
    authApi.login.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 401,
        title: 'Unauthenticated',
        detail: 'Wrong email or password.',
      }),
    )
    const { wrapper, router } = await renderWithApp(LoginView, { route: '/login' })
    await fillAndSubmit(wrapper)
    expect(wrapper.get('[role=alert]').text()).toContain('Wrong email or password.')
    expect(router.currentRoute.value.name).toBe('login')
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('shows validation errors next to the fields', async () => {
    authApi.login.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 422,
        title: 'Invalid',
        fieldErrors: { email: ['The email must be valid.'] },
      }),
    )
    const { wrapper } = await renderWithApp(LoginView, { route: '/login' })
    await fillAndSubmit(wrapper)
    expect(wrapper.get('[data-error]').text()).toBe('The email must be valid.')
  })

  it('has no axe violations', async () => {
    const { wrapper } = await renderWithApp(LoginView, { route: '/login' })
    await expectNoA11yViolations(wrapper.element)
  })
})
