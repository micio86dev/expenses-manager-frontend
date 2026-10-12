import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { CATEGORY_ICONS } from '@/domain/categories'
import CategoryIcon from './CategoryIcon.vue'

describe('CategoryIcon', () => {
  it.each(CATEGORY_ICONS)('renders the decorative %s icon', (name) => {
    const wrapper = mount(CategoryIcon, { props: { name } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('focusable')).toBe('false')
    expect(wrapper.findAll('path').length).toBeGreaterThan(0)
  })
})
