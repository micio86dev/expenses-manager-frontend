import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import App from '@/App.vue'

describe('AppLayout (rendered through the app root)', () => {
  it('provides landmarks and a skip link to the main content', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/settings', token: 'tok' })
    const skip = wrapper.get('a.skip-link')
    expect(skip.attributes('href')).toBe('#main')
    expect(skip.text()).toBe('Skip to content')
    expect(wrapper.find('main#main').exists()).toBe(true)
    expect(wrapper.find('nav[aria-label]').exists()).toBe(true)
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('renders the routed page inside main', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/settings', token: 'tok' })
    expect(wrapper.get('main').find('h1').text()).toBe('Settings')
  })

  it('moves focus to the main region after navigation', async () => {
    const { wrapper, router } = await renderWithApp(App, { route: '/', token: 'tok' })
    await router.push('/expenses')
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('main').element)
  })

  it('keeps a notifications region for rollback and error messages', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/settings', token: 'tok' })
    expect(wrapper.find('section[aria-label="Notifications"]').exists()).toBe(true)
  })

  it('has no axe violations', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/', token: 'tok' })
    await expectNoA11yViolations(wrapper.element)
  })
})
