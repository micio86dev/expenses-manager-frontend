import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FieldNotes from './FieldNotes.vue'

describe('FieldNotes', () => {
  it('shows the hint without any error block', () => {
    const wrapper = mount(FieldNotes, {
      props: { hint: 'At least 8', hintId: 'h', errorId: 'e', errors: [] },
    })
    expect(wrapper.get('[data-hint]').text()).toBe('At least 8')
    expect(wrapper.find('[data-error]').exists()).toBe(false)
  })

  it('lists every error message and omits the hint when none is given', () => {
    const wrapper = mount(FieldNotes, {
      props: { hintId: 'h', errorId: 'e', errors: ['Required', 'Too short'] },
    })
    expect(wrapper.find('[data-hint]').exists()).toBe(false)
    expect(wrapper.findAll('[data-error] span').map((span) => span.text())).toEqual([
      'Required',
      'Too short',
    ])
  })
})
