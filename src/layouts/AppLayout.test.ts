import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import App from '@/App.vue'
import { categoriesApi, expensesApi } from '../../tests/api-mock'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

describe('AppLayout (rendered through the app root)', () => {
  beforeEach(() => {
    categoriesApi.list.mockResolvedValue([])
    expensesApi.list.mockResolvedValue({
      data: [],
      meta: { currentPage: 1, perPage: 50, total: 0, lastPage: 1 },
    })
  })

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

  it('offers adding an expense from the header and from a floating button', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/settings', token: 'tok' })
    const buttons = wrapper.findAll('button').filter((b) => b.text() === 'Add expense')
    expect(buttons).toHaveLength(2)
    expect(wrapper.get('header button').text()).toBe('Add expense')
    expect(wrapper.get('button.fab').text()).toBe('Add expense')
  })

  it('opens the amount-first sheet from the floating button and returns focus on Escape', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/settings', token: 'tok' })
    const fab = wrapper.get<HTMLButtonElement>('button.fab')
    fab.element.focus()
    await fab.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=dialog] h2').text()).toBe('New expense')
    expect(document.activeElement).toBe(wrapper.get('input[inputmode=decimal]').element)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(document.activeElement).toBe(fab.element)
  })

  it('opens the same sheet from the header button', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/settings', token: 'tok' })
    await wrapper.get('header button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role=dialog]').exists()).toBe(true)
  })

  it('keeps a notifications region for rollback and error messages', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/settings', token: 'tok' })
    expect(wrapper.find('section[aria-label="Notifications"]').exists()).toBe(true)
  })

  it('has no axe violations, also with the sheet open', async () => {
    const { wrapper } = await renderWithApp(App, { route: '/', token: 'tok' })
    await expectNoA11yViolations(wrapper.element)
    await wrapper.get('button.fab').trigger('click')
    await flushPromises()
    await expectNoA11yViolations(wrapper.element)
  })
})
