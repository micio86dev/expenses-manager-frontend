import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('renders its slot as a button of type button by default', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Save' } })
    expect(wrapper.html()).toMatch(/^<button/)
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Save')
  })

  it.each(['primary', 'secondary', 'danger'] as const)('applies the %s variant', (variant) => {
    const wrapper = mount(BaseButton, { props: { variant } })
    expect(wrapper.classes()).toContain(`base-button--${variant}`)
  })

  it('submits forms when asked to', () => {
    const wrapper = mount(BaseButton, { props: { type: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('is disabled and busy while loading, and does not emit clicks', async () => {
    const wrapper = mount(BaseButton, { props: { loading: true }, slots: { default: 'Save' } })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('can be disabled', () => {
    const wrapper = mount(BaseButton, { props: { disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBeUndefined()
  })
})
