import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppIcon from './AppIcon.vue'

describe('AppIcon', () => {
  it.each(['dashboard', 'expenses', 'categories', 'settings'] as const)(
    'renders the decorative %s icon',
    (name) => {
      const wrapper = mount(AppIcon, { props: { name } })
      expect(wrapper.html()).toMatch(/^<svg/)
      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('focusable')).toBe('false')
      expect(wrapper.findAll('path').length).toBeGreaterThan(0)
    },
  )
})
