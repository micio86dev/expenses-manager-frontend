import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('shows a title and a description', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No data', description: 'Add something.' },
    })
    expect(wrapper.get('h2').text()).toBe('No data')
    expect(wrapper.get('p').text()).toBe('Add something.')
  })

  it('renders an optional action slot', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No data', description: 'x' },
      slots: { default: '<button>Add</button>' },
    })
    expect(wrapper.find('button').exists()).toBe(true)
  })
})
