import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { makeCategory } from '../../../tests/fixtures'
import CategoryBadge from './CategoryBadge.vue'

describe('CategoryBadge', () => {
  it('shows the icon on the category colour next to its name', () => {
    const wrapper = mount(CategoryBadge, {
      props: { name: 'Groceries', color: '#0B6B72', icon: makeCategory().icon },
    })
    expect(wrapper.text()).toBe('Groceries')
    expect(wrapper.get('.category-badge__chip').attributes('style')).toContain('background')
    expect(wrapper.find('svg[aria-hidden=true]').exists()).toBe(true)
  })
})
