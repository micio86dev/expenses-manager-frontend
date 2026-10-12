import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { expectNoA11yViolations } from '../../../tests/helpers'
import DashboardCard from './DashboardCard.vue'

function render(props: Record<string, unknown>) {
  return mount(DashboardCard, {
    props: { title: 'Top expenses', status: 'ready', ...props },
    slots: { default: '<p data-content>Content</p>' },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('DashboardCard', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('is a named region with a level two heading', () => {
    const wrapper = render({})
    const heading = wrapper.get('h2')
    expect(heading.text()).toBe('Top expenses')
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(heading.attributes('id'))
  })

  it('shows its content when ready', () => {
    const wrapper = render({})
    expect(wrapper.find('[data-content]').exists()).toBe(true)
    expect(wrapper.find('[data-skeleton]').exists()).toBe(false)
  })

  it.each(['idle', 'loading'])('shows a skeleton and announces loading when %s', async (status) => {
    const wrapper = render({ status })
    expect(wrapper.find('[data-content]').exists()).toBe(false)
    expect(wrapper.get('[data-skeleton]').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('[role=status]').text()).toBe('Loading')
    expect(wrapper.get('section').attributes('aria-busy')).toBe('true')
    await expectNoA11yViolations(wrapper.element)
  })

  it('shows the error with a retry instead of the content', async () => {
    const wrapper = render({ status: 'error', errorMessage: 'We could not load your data.' })
    expect(wrapper.find('[data-content]').exists()).toBe(false)
    expect(wrapper.get('[role=alert]').text()).toContain('We could not load your data.')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.get('section').attributes('aria-busy')).toBeUndefined()
  })
})
