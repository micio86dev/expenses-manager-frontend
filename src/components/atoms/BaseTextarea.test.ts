import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseTextarea from './BaseTextarea.vue'

describe('BaseTextarea', () => {
  it('reflects the model value and emits updates', async () => {
    const wrapper = mount(BaseTextarea, { props: { id: 'note', modelValue: 'Lunch' } })
    const textarea = wrapper.get('textarea')
    expect(textarea.element.value).toBe('Lunch')
    await textarea.setValue('Lunch with Sam')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Lunch with Sam']])
  })

  it('forwards accessibility state', () => {
    const wrapper = mount(BaseTextarea, {
      props: { id: 'note', modelValue: '', invalid: true, describedby: 'note-error' },
    })
    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('aria-invalid')).toBe('true')
    expect(textarea.attributes('aria-describedby')).toBe('note-error')
  })
})
