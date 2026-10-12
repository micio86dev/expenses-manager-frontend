import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import App from '@/App.vue'

describe('AuthLayout (rendered through the app root)', () => {
  it('shows the product name, a skip link and the routed page in main', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/login' })
    expect(wrapper.get('a.skip-link').attributes('href')).toBe('#main')
    expect(wrapper.get('header').text()).toBe('Expenses manager')
    expect(wrapper.get('main#main').find('h1').text()).toBe('Sign in')
  })

  it('has no axe violations', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/register' })
    await expectNoA11yViolations(wrapper.element)
  })
})
