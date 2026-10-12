import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { useNoticesStore } from '@/stores/notices'
import { expectNoA11yViolations } from '../../../tests/helpers'
import ToastRegion from './ToastRegion.vue'

async function render() {
  const pinia = createPinia()
  setActivePinia(pinia)
  await setLocale('en')
  const wrapper = mount(ToastRegion, {
    attachTo: document.body,
    global: { plugins: [pinia, i18n] },
  })
  return { wrapper, notices: useNoticesStore() }
}

describe('ToastRegion', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps a labelled region in the page even when empty', async () => {
    const { wrapper } = await render()
    expect(wrapper.get('section').attributes('aria-label')).toBe('Notifications')
    expect(wrapper.findAll('[data-toast]')).toHaveLength(0)
  })

  it('announces errors as alerts and successes as status messages', async () => {
    const { wrapper, notices } = await render()
    notices.push('error', 'Could not save the expense.')
    notices.push('success', 'Saved.')
    await wrapper.vm.$nextTick()
    const items = wrapper.findAll('[data-toast]')
    expect(items.map((li) => li.attributes('role'))).toEqual(['alert', 'status'])
    expect(items[0]?.text()).toContain('Could not save the expense.')
  })

  it('dismisses a notice with its button', async () => {
    const { wrapper, notices } = await render()
    notices.push('error', 'Oops')
    await wrapper.vm.$nextTick()
    await wrapper.get('button').trigger('click')
    expect(notices.items).toEqual([])
    expect(wrapper.findAll('[data-toast]')).toHaveLength(0)
  })

  it('has no axe violations', async () => {
    const { wrapper, notices } = await render()
    notices.push('error', 'Oops')
    await wrapper.vm.$nextTick()
    await expectNoA11yViolations(wrapper.element)
  })
})
