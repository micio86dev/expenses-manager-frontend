import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { expectNoA11yViolations } from '../../../tests/helpers'
import PeriodNav from './PeriodNav.vue'

function render(canGoNext = true) {
  return mount(PeriodNav, {
    props: { label: 'October 2026', canGoNext },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('PeriodNav', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('shows the current period in a polite live region', () => {
    const wrapper = render()
    const label = wrapper.get('[aria-live=polite]')
    expect(label.text()).toBe('October 2026')
  })

  it('moves to the previous and the next period', async () => {
    const wrapper = render()
    await wrapper.get('button[aria-label="Previous period"]').trigger('click')
    await wrapper.get('button[aria-label="Next period"]').trigger('click')
    expect(wrapper.emitted('previous')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('cannot move into the future', async () => {
    const wrapper = render(false)
    const next = wrapper.get('button[aria-label="Next period"]')
    expect(next.attributes('disabled')).toBeDefined()
    await next.trigger('click')
    expect(wrapper.emitted('next')).toBeUndefined()
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations(render().element)
  })
})
